require("dotenv").config();

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const { Pool } = require("pg");

const root = __dirname;
const app = express();
const port = Number(process.env.PORT || 3000);
const adminPassword = process.env.ADMIN_PASSWORD || "";
const sessionSecret = process.env.SESSION_SECRET || "";
const databaseUrl = process.env.DATABASE_URL || "";
const sessionCookie = "portfolio_admin";
const sessionDuration = 8 * 60 * 60 * 1000;
const validSections = new Set([
  "hero",
  "about",
  "skills",
  "education",
  "projects",
  "experience",
  "certifications",
  "contact",
  "socials"
]);

if (!databaseUrl || !adminPassword || !sessionSecret) {
  console.error("Missing configuration. Set DATABASE_URL, ADMIN_PASSWORD and SESSION_SECRET in .env.");
  process.exit(1);
}

if (adminPassword.length < 12 || sessionSecret.length < 32) {
  console.error("ADMIN_PASSWORD must be at least 12 characters and SESSION_SECRET at least 32 characters.");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const loginAttempts = new Map();

app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));

function sign(value) {
  return crypto.createHmac("sha256", sessionSecret).update(value).digest("base64url");
}

function createSessionToken() {
  const payload = Buffer.from(JSON.stringify({ expiresAt: Date.now() + sessionDuration })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function hasValidSession(req) {
  const token = req.headers.cookie
    ?.split(";")
    .map(part => part.trim())
    .find(part => part.startsWith(`${sessionCookie}=`))
    ?.slice(sessionCookie.length + 1);

  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expectedSignature = sign(payload);
  const received = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number.isFinite(session.expiresAt) && session.expiresAt > Date.now();
  } catch {
    return false;
  }
}

function requireAdmin(req, res, next) {
  if (!hasValidSession(req)) {
    return res.status(401).json({ error: "Admin login required." });
  }
  next();
}

function passwordMatches(candidate) {
  const received = Buffer.from(candidate);
  const expected = Buffer.from(adminPassword);
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

function normalizeProjectImages(projects) {
  const imageDirectory = path.join(root, "assets", "images", "projects");
  const files = new Map(fs.readdirSync(imageDirectory).map(file => [file.toLowerCase(), file]));

  return projects.map(project => {
    const image = String(project.image || "");
    if (/^(https?:\/\/|\/)/i.test(image)) return project;

    const filename = files.get(`${image}.png`.toLowerCase())
      || files.get(`${image}.jpg`.toLowerCase())
      || files.get(`${image}.jpeg`.toLowerCase());

    return { ...project, image: filename ? `/assets/images/projects/${filename}` : `/assets/images/projects/${image}.png` };
  });
}

function readSeedContent() {
  const defaults = JSON.parse(fs.readFileSync(path.join(root, "content", "default-content.json"), "utf8"));
  const skills = JSON.parse(fs.readFileSync(path.join(root, "skills.json"), "utf8"));
  const projects = JSON.parse(fs.readFileSync(path.join(root, "projects", "projects.json"), "utf8"));
  const certifications = JSON.parse(fs.readFileSync(path.join(root, "assets", "data", "certifications.json"), "utf8"));

  return {
    ...defaults,
    skills,
    projects: normalizeProjectImages(projects),
    certifications
  };
}

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS portfolio_content (
      section TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const content = readSeedContent();
  for (const [section, data] of Object.entries(content)) {
    await pool.query(
      "INSERT INTO portfolio_content (section, data) VALUES ($1, $2::jsonb) ON CONFLICT (section) DO NOTHING",
      [section, JSON.stringify(data)]
    );
  }
}

app.get("/api/content", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT section, data FROM portfolio_content ORDER BY section");
    res.set("Cache-Control", "no-store");
    res.json(Object.fromEntries(result.rows.map(row => [row.section, row.data])));
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/session", (req, res) => {
  res.json({ authenticated: hasValidSession(req) });
});

app.post("/api/admin/login", (req, res) => {
  const now = Date.now();
  const ip = req.ip;
  const attempt = loginAttempts.get(ip);
  if (attempt && attempt.lockedUntil > now) {
    return res.status(429).json({ error: "Too many login attempts. Please try again later." });
  }

  if (typeof req.body.password !== "string" || !passwordMatches(req.body.password)) {
    const attempts = attempt && attempt.lockedUntil <= now ? 0 : (attempt?.count || 0);
    const count = attempts + 1;
    loginAttempts.set(ip, {
      count,
      lockedUntil: count >= 5 ? now + 15 * 60 * 1000 : 0
    });
    return res.status(401).json({ error: "Incorrect password." });
  }

  loginAttempts.delete(ip);
  res.cookie(sessionCookie, createSessionToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionDuration,
    path: "/"
  });
  res.json({ authenticated: true });
});

app.post("/api/admin/logout", (req, res) => {
  res.clearCookie(sessionCookie, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
  res.json({ authenticated: false });
});

app.put("/api/admin/content/:section", requireAdmin, async (req, res, next) => {
  const { section } = req.params;
  const data = req.body.data;

  if (!validSections.has(section)) {
    return res.status(404).json({ error: "Content section not found." });
  }

  if (data === undefined || data === null || typeof data !== "object") {
    return res.status(400).json({ error: "Content must be a JSON object or array." });
  }

  const isCollection = ["skills", "education", "projects", "experience", "certifications", "socials"].includes(section);
  if (isCollection !== Array.isArray(data)) {
    return res.status(400).json({ error: isCollection ? "This section must be a list." : "This section must be an object." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO portfolio_content (section, data, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (section) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
       RETURNING section, data, updated_at`,
      [section, JSON.stringify(data)]
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.get(["/admin", "/admin/"], (req, res) => res.sendFile(path.join(root, "admin", "index.html")));
app.get(["/projects", "/projects/"], (req, res) => res.sendFile(path.join(root, "projects", "index.html")));
app.get(["/experience", "/experience/"], (req, res) => res.sendFile(path.join(root, "experience", "index.html")));
app.get("/", (req, res) => res.sendFile(path.join(root, "index.html")));
app.get("/certification.html", (req, res) => res.sendFile(path.join(root, "certification.html")));
app.get("/404.html", (req, res) => res.sendFile(path.join(root, "404.html")));
app.get("/skills.json", (req, res) => res.sendFile(path.join(root, "skills.json")));
app.use("/assets", express.static(path.join(root, "assets")));
app.use("/projects", express.static(path.join(root, "projects"), { index: false }));
app.use("/experience", express.static(path.join(root, "experience"), { index: false }));
app.use("/admin", express.static(path.join(root, "admin"), { index: false }));

app.use((error, req, res, next) => {
  console.error("Request failed:", error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

initializeDatabase()
  .then(() => {
    app.listen(port, () => console.log(`Portfolio server running at http://localhost:${port}`));
  })
  .catch(error => {
    console.error("Unable to initialize PostgreSQL content store:", error);
    process.exit(1);
  });
