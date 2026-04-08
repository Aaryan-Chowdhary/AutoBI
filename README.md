# AutoBI Studio

AutoBI Studio is a streamlined, modern web-based application designed for data storage, organization, and automated business intelligence dashboard generation.

This project was recently refactored to focus solely on the core, high-priority user flows, stripping away unused routes and extraneous background processes.

## 🚀 Core Features

1. **Landing Page:** Pre-login informational page about AutoBI Studio.
2. **Authentication Flow:** Secure Login and Account Creation (Register) pages integrating with Firebase Auth.
3. **Workspace (Home):** The main dashboard view where users can see quick stats, pinned items, and create new dashboards.
4. **Datasets Storage:** A dedicated storage system allowing users to organize, manage, and upload cleaned or raw dataset files.
5. **Studio Environment:** A drag-and-drop workspace UI to build and generate visual dashboards based on uploaded data.

## 🛠️ Technology Stack

### Frontend (`/frontned`)

- **Framework:** React 19 + Vite
- **Styling:** TailwindCSS (v4)
- **Routing:** React Router DOM
- **Authentication:** Firebase Client SDK

### Backend (`/backend`)

- **Server:** Node.js with Express.js
- **Database Agents:** PostgreSQL (`pg`), DuckDB
- **Authentication:** Firebase Admin SDK (Token verification)
- **Utilities:** Multer (File Uploads), Nodemailer, Bcrypt, JWT

## 📂 Project Structure

```text
AUTOBI/
├── backend/                  # Node/Express Backend Server
│   ├── routes/               # API endpoints (oauth.js, dashboards.js)
│   ├── middleware/           # Express middlewares (auth.js)
│   ├── uploads/              # Local storage for datasets
│   ├── server.js             # Main server entry point
│   ├── firebaseAdmin.js      # Firebase Admin config
│   └── db.js                 # PostgreSQL config
└── frontned/                 # React UI (Spelled as "frontned" in directory)
    ├── public/               # Static assets
    ├── src/                  
    │   ├── components/       # Reusable UI (Sidebar, TopBar, Forms, UploadWizard)
    │   ├── context/          # React Context (AuthContext)
    │   ├── lib/              # API and utility helpers
    │   ├── pages/            # Core UI Views (Landing, Home, Datasets, Studio)
    │   ├── App.jsx           # Main Frontend Router
    │   └── index.css         # Tailwind directives & Global Styles
    ├── vite.config.js        # Vite configurations
    └── package.json          
```

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- `npm` (comes with Node.js)
- A PostgreSQL server running
- Firebase Project configured (Client config for frontend, Admin SDK JSON for backend)

## 🏃 Setup and Run Instructions

You will need to run the frontend and backend concurrently in two separate terminal windows.

### 1. Backend Setup

```bash
cd backend
npm install
npm run dev
```

> **Note:** Make sure you have your `.env` file populated inside the `/backend` folder with your Database credentials (`PG_URI` or specific host/user configs), `JWT_SECRET`, and Firebase Admin configurations.

### 2. Frontend Setup

```bash
cd frontned
npm install
npm run dev
```

> **Note:** Make sure you have your `.env` file populated inside the `/frontned` folder containing your Firebase client configuration keys (`VITE_FIREBASE_API_KEY`, etc.).

## 🧹 Recent Architectural Updates

- **Simplified Backend:** Removed unused standalone Python scripts, defunct `datasets.js` and `query.js` routes, and custom internal JWT generation in favor of relying entirely on `oauth.js` combined with Firebase tokens.
- **Simplified Frontend:** Purged duplicate frontend routing code (e.g., `DataPreviewPage`, isolated modals, and duplicate `Login.jsx` files unused by `App.jsx`).

## 🛡️ Version Control (Git)

This repository includes a global `.gitignore` file configured for security so you can safely upload it to a public or private GitHub repository.

**Blocked from GitHub (`.gitignore` rules):**

- **`.env` files:** All local `.env` and `.env.local` files are ignored so your secrets (like `VITE_FIREBASE_API_KEY` or `PG_URI`) never leak onto GitHub.
- **`node_modules/`:** Prevent huge dependency trees from being committed.
- **`backend/uploads/`:** Keeps local user dataset uploads out of the repository.
- **Build & Cache Files:** Discards system cache, OS files (like `.DS_Store`), and vite build output folders.

### ⬆️ How to push to GitHub

To push your clean workspace to a new GitHub repo:

```bash
git init
git add .
git commit -m "AutoBI Initial commit - Core UI and Setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## ⚖️ License

Internal Use Only - AutoBI Studio
