## Portfolio-Website
Portfolio website built using HTML5, CSS3, JavaScript, and jQuery.

<a href="https://karanaswani.netlify.app/" target="_blank">**Visit Now** 🚀</a>


## 📌 Tech Stack
[![HTML](https://img.shields.io/badge/html5%20-%23E34F26.svg?&style=for-the-badge&logo=html5&logoColor=white)](https://github.com/karanaswani007)&nbsp;
[![CSS](https://img.shields.io/badge/css3%20-%231572B6.svg?&style=for-the-badge&logo=css3&logoColor=white)](https://github.com/karanaswani007/)&nbsp;
[![JS](https://img.shields.io/badge/javascript%20-%23323330.svg?&style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)](https://github.com/karanaswani007/)


### Extras : 
Particle.js, Typed.js, Tilt.js, Scroll Reveal, Tawk.to, Font Awesome and JSON


<h2>📬 Contact</h2>

Feel free to reach me through the below handles if you'd like to contact me.

[![linkedin](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/karanaswani007)
[![instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/karanaswani007)

## Admin CMS

The portfolio includes a PostgreSQL-backed admin panel at `/admin`. It manages the
homepage profile, skills, education, projects, experience, certifications, contact
details, and social links. Content is seeded from the existing JSON files the first
time the server connects to an empty database; later starts keep the saved database
content.

1. Install Node.js 18 or newer and create a PostgreSQL database. Neon works with its
   connection string (including `sslmode=require`).
2. Install dependencies with `npm install`.
3. Set `DATABASE_URL`, a unique `ADMIN_PASSWORD` (at least 12 characters), and a
   random `SESSION_SECRET` (at least 32 characters) in `.env`. `.env.example` shows
   the required format. Keep `.env` private; it is excluded by `.gitignore`.
4. Start the site with `npm start`, then visit `http://localhost:3000/admin`.

The server creates its content table automatically. Back up the database before
making infrastructure changes; content edits are saved immediately.
Images uploaded in the admin are stored directly in PostgreSQL with their content.
The application does not impose an upload-size limit on authenticated content
saves, but the database provider, browser, and deployment platform can still
restrict request or record sizes (including Netlify Functions).

### Deploying to Netlify

Netlify serves the static portfolio and runs the admin API as a Netlify Function.
The function still requires a reachable PostgreSQL database (Neon works).

1. Push this repository to GitHub and import it in Netlify using the repository
   root as the base directory. `netlify.toml` configures the publish directory,
   function bundle, API rewrite, and Node.js runtime.
2. In Netlify, open **Site configuration → Environment variables** and add
   `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, and `NODE_ENV`.
   Use a unique password of at least 12 characters and a random secret of at
   least 32 characters. Do not commit these values or put them in `netlify.toml`.
3. Trigger a new deploy after setting the variables. The first API request
   creates and seeds the database table.
4. Verify `https://YOUR-SITE.netlify.app/api/admin/session` returns
   `{"authenticated":false}`, then sign in at
   `https://YOUR-SITE.netlify.app/admin/`.

Keep the database credentials private and rotate them immediately if they have
ever been exposed. Admin content changes are written directly to PostgreSQL.
