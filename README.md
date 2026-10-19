# Habeba (حبيبة) – Romantic Digital Gift Platform 💝

A modern, responsive, and secure full-stack web application for creating, customizing, and sharing personalized romantic gift websites.

Rebuilt from the ground up using **React + TypeScript + Vite** on the frontend and **Node.js + Express + Prisma + SQLite** on the backend.

---

## ✨ Features

- **Guided Gift Wizard**: 6-step creation flow for personalized messages, YouTube background music, milestone timelines, photo memories, and interactive love letters.
- **9 Exquisite Romantic Themes**: Midnight Romance, Rose Garden, Golden Elegance, Ocean Twilight, Velvet Purple, Cherry Blossom, Starlight, Enchanted Forest, and Sunset Passion.
- **Multi-Tenant Privacy**: Strict user isolation with server-side ownership enforcement.
- **Payment & Activation System**: InstaPay and Vodafone Cash manual payment reviews with receipt uploads and admin approval queue.
- **Bilingual & RTL Support**: Arabic by default with full RTL layout, switchable to English (LTR).
- **Interactive Gift Experience**: Animated heartbeat heroes, timeline milestones, masonry photo gallery, typewriter love letters, and YouTube audio players.
- **Admin Control Panel**: Real-time platform statistics, user management, gift deletion, payment approval/rejection, and payment gateway configuration.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Framer Motion, Lucide Icons, React Hook Form, Zod, i18next, TanStack Query.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, SQLite, Argon2id, Multer, Helmet, Winston, Morgan, Express Session.
- **Testing**: Vitest, Supertest.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the root and in `server/`:
```bash
cp .env.example .env
cp server/.env.example server/.env
```

### 3. Database Setup & Seed
```bash
npm run db:migrate --workspace=server
npm run db:seed --workspace=server
```

### 4. Start Development Servers
```bash
npm run dev
```
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

### 5. Build for Production
```bash
npm run build
npm start --workspace=server
```

---

## 🔒 Default Test Accounts
- **Admin**: `admin@habeba.com` / `romantic2026`
- **User**: `demo@habeba.com` / `romantic2026`
- **Flagship Demo Gift**: `/gift/salma-and-mohamed`
