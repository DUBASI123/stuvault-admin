# StuVault Admin Portal

A premium‑styled admin dashboard for managing colleges, departments, and students. Built with **React + Vite**, **TailwindCSS**, and **Zustand**.

---

## 📦 Quick start (local development)

```bash
# Install dependencies
npm ci

# Run the development server
npm run dev   # Open http://localhost:5173
```

The app supports dark‑mode (toggle in the header) and uses glass‑morphism UI components.

---

## 📦 Production build

```bash
npm run build   # Generates the ./dist folder
npx serve -s dist   # Preview the built site locally
```

---

## 🚀 Deployment (Vercel)

A GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically builds and deploys the site on every push to the `main` branch.

1. **Create a Vercel personal token** (`vercel token add`).
2. **Add the token to GitHub** → *Repository Settings* → *Secrets* → *Actions* → New repository secret named `VERCEL_TOKEN`.
3. Push to `main` → the workflow runs and updates `https://stuvault-admin-portal-plan.vercel.app`.

---

## 🌐 Custom domain (optional)

If you own a domain, add it in the Vercel dashboard under *Settings → Domains* or via the CLI:

```bash
vercel alias set stuvault-admin-portal-plan.vercel.app yourdomain.com
```

Make sure the DNS records point to Vercel as instructed.

---

## 📈 Analytics & SEO

- **Google Analytics** – the `<script>` snippet is injected in `index.html`. Replace `G-XXXXXXXXXX` with your Measurement ID.
- **SEO meta tags** – description, keywords, Open‑Graph tags are included in `index.html`.

---

## 🛠️ CI/CD

The CI workflow (`.github/workflows/deploy.yml`) runs the following steps:

1. Checkout code.
2. Set up Node 20.
3. Install dependencies.
4. Build the project.
5. Deploy to Vercel using the `VERCEL_TOKEN` secret.

---

## 📂 Project structure (highlights)

- `src/pages/` – React pages (`Dashboard`, `Students`, `Approvals`, …).
- `src/components/` – reusable UI components (Header, ThemeToggle, etc.).
- `src/lib/theme.ts` – Theme context for dark‑mode.
- `index.html` – contains SEO meta tags and Google Analytics script.
- `vercel.json` – optional Vercel configuration (aliases, redirects).

---

## 🎉 That's it!

Your admin portal is now ready for development, production builds, and automated Vercel deployments. Feel free to open an issue or submit a PR for further improvements.
