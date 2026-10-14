const sections = [
  { key: "hero", label: "Hero", icon: "fa-house-user", description: "Your introduction, headline and homepage image.", fields: [
    { key: "greeting", label: "Greeting" }, { key: "firstName", label: "First name" }, { key: "lastName", label: "Last name" },
    { key: "roles", label: "Animated roles", type: "list", full: true, hint: "Enter one role per line." },
    { key: "image", label: "Image path or URL", full: true }
  ] },
  { key: "about", label: "About", icon: "fa-user", description: "Your biography, contact details and resume.", fields: [
    { key: "name", label: "Display name" }, { key: "tag", label: "Professional headline", full: true },
    { key: "description", label: "Biography", type: "textarea", full: true }, { key: "image", label: "Image path or URL", full: true },
    { key: "email", label: "Email", type: "email" }, { key: "location", label: "Location" },
    { key: "resume", label: "Resume URL", type: "url", full: true }
  ] },
  { key: "skills", label: "Skills", icon: "fa-laptop-code", description: "Technologies and tools displayed in your skills section.", collection: true, fields: [
    { key: "name", label: "Skill name" }, { key: "icon", label: "Icon URL", type: "url" }
  ] },
  { key: "education", label: "Education", icon: "fa-graduation-cap", description: "Education entries shown on your portfolio.", collection: true, fields: [
    { key: "degree", label: "Degree or qualification", full: true }, { key: "institution", label: "Institution", full: true },
    { key: "period", label: "Period or status" }, { key: "image", label: "Image path or URL" }
  ] },
  { key: "projects", label: "Projects", icon: "fa-code", description: "Project cards shown on the homepage and projects page.", collection: true, fields: [
    { key: "name", label: "Project name", full: true }, { key: "desc", label: "Description", type: "textarea", full: true },
    { key: "image", label: "Image path or URL", full: true }, { key: "category", label: "Category" },
    { key: "links.view", label: "Live project URL", type: "url" }, { key: "links.code", label: "Source code URL", type: "url" }
  ] },
  { key: "experience", label: "Experience", icon: "fa-briefcase", description: "Work, internships and workshops shown across experience pages.", collection: true, fields: [
    { key: "company", label: "Organization", full: true }, { key: "role", label: "Role or description", type: "textarea", full: true },
    { key: "period", label: "Period" }
  ] },
  { key: "certifications", label: "Certifications", icon: "fa-award", description: "Credentials displayed on the homepage and certifications page.", collection: true, fields: [
    { key: "title", label: "Certification title", full: true }, { key: "description", label: "Description", type: "textarea", full: true },
    { key: "organization", label: "Provider" }, { key: "logo", label: "Logo file name" },
    { key: "issueDate", label: "Issue date" }, { key: "credentialId", label: "Credential ID" },
    { key: "category", label: "Category" }, { key: "viewLink", label: "Certificate URL", type: "url" },
    { key: "proofLink", label: "Proof URL", type: "url" }
  ] },
  { key: "contact", label: "Contact & footer", icon: "fa-address-card", description: "Contact details and footer copy shown on the site.", fields: [
    { key: "phone", label: "Phone", type: "tel" }, { key: "email", label: "Email", type: "email" },
    { key: "location", label: "Location", full: true }, { key: "footerTitle", label: "Footer title" },
    { key: "footerMessage", label: "Footer message", type: "textarea", full: true },
    { key: "creditName", label: "Credit name" }, { key: "creditUrl", label: "Credit URL", type: "url" }
  ] },
  { key: "socials", label: "Social links", icon: "fa-share-alt", description: "Social profiles shown in your homepage and footer.", collection: true, fields: [
    { key: "name", label: "Network name" }, { key: "icon", label: "Font Awesome icon class", hint: "Example: fab fa-linkedin" },
    { key: "url", label: "Profile URL", type: "url", full: true }
  ] }
];

const appRoot = document.getElementById("adminApp");
const loginScreen = document.getElementById("loginScreen");
const dashboard = document.getElementById("dashboard");
const contentPanel = document.getElementById("contentPanel");
const editorDialog = document.getElementById("editorDialog");
const state = { content: {}, activeSection: "hero", editIndex: null, noticeTimer: null };

function getSection(key) {
  return sections.find(section => section.key === key);
}

function valueAt(object, key) {
  return key.split(".").reduce((value, part) => value && value[part], object);
}

function setValue(object, key, value) {
  const parts = key.split(".");
  const last = parts.pop();
  const target = parts.reduce((current, part) => {
    if (!current[part] || typeof current[part] !== "object") current[part] = {};
    return current[part];
  }, object);
  target[last] = value;
}

function showNotice(message, isError = false) {
  const notice = document.getElementById("notice");
  notice.textContent = message;
  notice.classList.toggle("error", isError);
  notice.classList.remove("hidden");
  clearTimeout(state.noticeTimer);
  state.noticeTimer = setTimeout(() => notice.classList.add("hidden"), 3600);
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...options.headers }
  });

  const rawText = await response.text();
  let result = {};

  if (rawText) {
    try {
      result = JSON.parse(rawText);
    } catch {
      const fallbackMessage = rawText.trim().startsWith("<")
        ? "Admin API is currently unavailable. Check the server connection and try again."
        : rawText.trim() || "The server returned an invalid response.";
      throw new Error(fallbackMessage);
    }
  }

  if (!response.ok) {
    throw new Error(result.error || `Request failed (${response.status}).`);
  }

  return result;
}

function renderNavigation() {
  const navigation = document.getElementById("sectionNavigation");
  navigation.replaceChildren();
  sections.forEach(section => {
    const button = document.createElement("button");
    button.className = `sidebar-link${section.key === state.activeSection ? " active" : ""}`;
    button.type = "button";
    button.dataset.section = section.key;
    button.innerHTML = `<i class="fas ${section.icon}"></i><span></span>`;
    button.querySelector("span").textContent = section.label;
    navigation.append(button);
  });
}

function createInput(field, value, id, compact = false) {
  const wrapper = document.createElement("div");
  wrapper.className = `${compact ? "editor-field" : "content-field"}${field.full ? " full-width" : ""}`;
  const label = document.createElement("label");
  label.htmlFor = id;
  label.textContent = field.label;
  const input = document.createElement(field.type === "textarea" || field.type === "list" ? "textarea" : "input");
  input.id = id;
  input.name = field.key;
  input.dataset.field = field.key;
  if (input instanceof HTMLInputElement) {
    input.type = field.type === "email" || field.type === "tel" ? field.type : "text";
  }
  input.value = field.type === "list" ? (Array.isArray(value) ? value.join("\n") : "") : (value ?? "");
  wrapper.append(label, input);
  if (field.hint) {
    const hint = document.createElement("p");
    hint.className = "field-hint";
    hint.textContent = field.hint;
    wrapper.append(hint);
  }
  return wrapper;
}

function renderObjectSection(section) {
  const form = document.createElement("form");
  form.id = "objectForm";
  form.className = "section-card";
  const fields = document.createElement("div");
  fields.className = "content-fields";
  section.fields.forEach((field, index) => {
    fields.append(createInput(field, valueAt(state.content[section.key] || {}, field.key), `field-${section.key}-${index}`));
  });
  const save = document.createElement("button");
  save.className = "primary-button";
  save.type = "submit";
  save.innerHTML = 'Save changes <i class="fas fa-check"></i>';
  form.append(fields, save);
  return form;
}

function itemTitle(section, item, index) {
  const titleField = section.fields.find(field => ["name", "title", "degree", "company", "organization"].includes(field.key));
  return valueAt(item, titleField?.key || section.fields[0]?.key) || `${section.label} ${index + 1}`;
}

function itemSummary(section, item) {
  return section.fields
    .filter(field => !["name", "title", "degree", "company", "organization"].includes(field.key))
    .map(field => valueAt(item, field.key))
    .filter(value => typeof value === "string" && value.trim())
    .slice(0, 2)
    .join(" · ");
}

function renderCollectionSection(section) {
  const items = state.content[section.key] || [];
  const grid = document.createElement("div");
  grid.className = "items-grid";

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = '<i class="far fa-folder-open"></i><p>No items yet. Add your first entry to get started.</p>';
    grid.append(empty);
  }

  items.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "item-card";
    const copy = document.createElement("div");
    copy.className = "item-copy";
    const title = document.createElement("h3");
    title.textContent = itemTitle(section, item, index);
    const summary = document.createElement("p");
    summary.textContent = itemSummary(section, item) || "No additional details";
    copy.append(title, summary);
    const actions = document.createElement("div");
    actions.className = "item-actions";
    actions.innerHTML = `<button class="icon-button" type="button" data-edit="${index}" aria-label="Edit item"><i class="fas fa-pen"></i></button><button class="icon-button delete" type="button" data-delete="${index}" aria-label="Delete item"><i class="far fa-trash-alt"></i></button>`;
    card.append(copy, actions);
    grid.append(card);
  });
  return grid;
}

function renderSection() {
  const section = getSection(state.activeSection);
  if (!section) return;
  document.getElementById("pageTitle").textContent = section.label;
  contentPanel.replaceChildren();
  const intro = document.createElement("div");
  intro.className = "section-intro";
  const copy = document.createElement("div");
  const title = document.createElement("h2");
  title.textContent = section.collection ? `Manage ${section.label.toLowerCase()}` : `Edit ${section.label.toLowerCase()} content`;
  const description = document.createElement("p");
  description.textContent = section.description;
  copy.append(title, description);
  intro.append(copy);

  if (section.collection) {
    const add = document.createElement("button");
    add.className = "primary-button";
    add.type = "button";
    add.id = "addItem";
    add.innerHTML = '<i class="fas fa-plus"></i> Add new';
    intro.append(add);
  }

  contentPanel.append(intro, section.collection ? renderCollectionSection(section) : renderObjectSection(section));
}

async function loadContent() {
  state.content = await request("/api/content");
  renderNavigation();
  renderSection();
}

function enterDashboard() {
  loginScreen.classList.add("hidden");
  dashboard.classList.remove("hidden");
  loadContent().catch(error => showNotice(error.message, true));
}

function leaveDashboard() {
  dashboard.classList.add("hidden");
  loginScreen.classList.remove("hidden");
  document.getElementById("adminPassword").value = "";
}

function openEditor(section, index) {
  const item = index === null ? {} : structuredClone(state.content[section.key][index]);
  state.editIndex = index;
  document.getElementById("editorEyebrow").textContent = section.label.toUpperCase();
  document.getElementById("editorTitle").textContent = index === null ? `Add ${section.label.toLowerCase().replace(/s$/, "")}` : `Edit ${section.label.toLowerCase().replace(/s$/, "")}`;
  const fields = document.getElementById("editorFields");
  fields.replaceChildren();
  section.fields.forEach((field, fieldIndex) => {
    fields.append(createInput(field, valueAt(item, field.key), `editor-${fieldIndex}`, true));
  });
  editorDialog.showModal();
}

function readFields(form, section, base = {}) {
  const value = structuredClone(base);
  section.fields.forEach(field => {
    const input = form.querySelector(`[data-field="${CSS.escape(field.key)}"]`);
    const content = input.value.trim();
    setValue(value, field.key, field.type === "list" ? content.split(/\r?\n/).map(item => item.trim()).filter(Boolean) : content);
  });
  return value;
}

async function saveSection(sectionKey, data) {
  await request(`/api/admin/content/${sectionKey}`, {
    method: "PUT",
    body: JSON.stringify({ data })
  });
  state.content[sectionKey] = data;
  renderSection();
  showNotice("Changes saved successfully.");
}

document.getElementById("loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  const error = document.getElementById("loginError");
  error.textContent = "";
  const password = document.getElementById("adminPassword").value;
  try {
    await request("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
    enterDashboard();
  } catch (failure) {
    error.textContent = failure.message;
  }
});

document.getElementById("sectionNavigation").addEventListener("click", event => {
  const button = event.target.closest("[data-section]");
  if (!button) return;
  state.activeSection = button.dataset.section;
  renderNavigation();
  renderSection();
});

contentPanel.addEventListener("submit", async event => {
  if (event.target.id !== "objectForm") return;
  event.preventDefault();
  const section = getSection(state.activeSection);
  try {
    await saveSection(section.key, readFields(event.target, section, state.content[section.key]));
  } catch (failure) {
    showNotice(failure.message, true);
  }
});

contentPanel.addEventListener("click", event => {
  const section = getSection(state.activeSection);
  if (event.target.closest("#addItem")) {
    openEditor(section, null);
    return;
  }
  const editButton = event.target.closest("[data-edit]");
  if (editButton) {
    openEditor(section, Number(editButton.dataset.edit));
    return;
  }
  const deleteButton = event.target.closest("[data-delete]");
  if (deleteButton && window.confirm("Delete this item? This change will be visible on your portfolio.")) {
    const items = [...state.content[section.key]];
    items.splice(Number(deleteButton.dataset.delete), 1);
    saveSection(section.key, items).catch(failure => showNotice(failure.message, true));
  }
});

document.getElementById("itemForm").addEventListener("submit", async event => {
  event.preventDefault();
  const section = getSection(state.activeSection);
  const items = [...state.content[section.key]];
  const item = readFields(event.target, section);
  if (state.editIndex === null) items.push(item);
  else items[state.editIndex] = item;
  try {
    await saveSection(section.key, items);
    editorDialog.close();
  } catch (failure) {
    showNotice(failure.message, true);
  }
});

document.getElementById("closeEditor").addEventListener("click", () => editorDialog.close());
document.getElementById("cancelEditor").addEventListener("click", () => editorDialog.close());
document.getElementById("logoutButton").addEventListener("click", async () => {
  try {
    await request("/api/admin/logout", { method: "POST", body: "{}" });
    leaveDashboard();
  } catch (failure) {
    showNotice(failure.message, true);
  }
});

request("/api/admin/session")
  .then(session => session.authenticated ? enterDashboard() : leaveDashboard())
  .catch(error => {
    leaveDashboard();
    document.getElementById("loginError").textContent = error.message;
  });
