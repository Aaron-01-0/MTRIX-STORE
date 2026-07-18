<div align="center">

# ⚡ MTRIX — Premium Gaming & Lifestyle Product Store

***The Modern Uniform for Identity & Solitude***

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-gold?style=for-the-badge)](LICENSE)

---

### 📸 Interface Showcase

| 3D Hero Poster Carousel | Category Collections |
| :---: | :---: |
| ![MTRIX Hero Posters](public/docs/hero_posters.png) | ![Shop by Category](public/docs/shop_by_category.png) |

| Trending Collections | Featured Gear Grid |
| :---: | :---: |
| ![Trending Collections](public/docs/trending_collections.png) | ![Featured Gear Grid](public/docs/featured_gear.png) |

| Brand Story & Narrative |
| :---: |
| ![Brand Narrative](public/docs/brand_story.png) |

---

</div>

## 🚀 Overview

**MTRIX** is a state-of-the-art, high-performance e-commerce platform and product showcase designed for premium gaming accessories, desk setups, apparel, and lifestyle artifacts. Combining dark-mode luxury aesthetics, liquid-smooth animations, and dynamic variant configurations, MTRIX delivers a futuristic shopping experience.

---

## ✨ Features Showcase

### 🛍️ E-Commerce & Catalog Experience
- **Interactive Product Catalog**: Real-time filtering by category, price, stock status, ratings, and multi-attribute search (`⌘K`).
- **Dynamic Variant Configurator**: Color, size, and custom multi-JSON attribute selection with live stock and price recalculation.
- **Persistent Cart & Wishlist**: Real-time cart management with quantity adjustment, out-of-stock badges, and instant toast feedback.
- **Exclusive Drops & Countdown**: Limited edition product drop showcases with interactive notify-me waitlists.

### 🎮 Community & Arena
- **Community Showcase**: User-submitted desk setups, reviews, and gaming gear showcases.
- **Arena Leaderboards**: Competitive drop queues, submission portals, and community rules.

### 🔐 Auth & Administration
- **Supabase Authentication**: Secure user registration, social auth, profiles, and order tracking.
- **Comprehensive Admin Suite**:
  - Analytics dashboard with order metrics and revenue breakdown.
  - Inventory manager, category manager, and banner promotions editor.
  - Broadcast notification engine and campaign builder.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 18 + Vite |
| **Language** | TypeScript |
| **Styling & UI** | Tailwind CSS + shadcn/ui + Lucide Icons |
| **State & Data Fetching** | TanStack React Query + Context API |
| **Animations & 3D** | Framer Motion + React Three Fiber / Drei |
| **Backend & Database** | Supabase (PostgreSQL, Auth, RLS, Realtime Storage) |

---

## 📁 Project Structure

```text
MTRIX-STORE/
├── src/
│   ├── components/       # Reusable UI components (Navbar, Footer, Search, Cards)
│   │   ├── catalog/      # Catalog filtering, ProductCard, Variant selectors
│   │   ├── home/         # HeroSection, CategoryGrid, ProductBentoGrid, Reviews
│   │   └── ui/           # Radix / shadcn UI design system primitives
│   ├── hooks/            # Custom React hooks (useCart, useWishlist, useProducts, useAuth)
│   ├── pages/            # Page views (Index, Catalog, Product, Cart, Admin, Profile)
│   ├── integrations/     # Supabase client setup & types
│   ├── layouts/          # Responsive app & admin layouts
│   └── types/            # Global TypeScript definitions
├── public/               # Static assets & generated sitemap
└── supabase/             # Database migrations & seed scripts
```

---

## 🚦 Quick Start

### Prerequisites
- Node.js (v18+ recommended)
- npm or bun

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/raaajjjjj/MTRIX-STORE.git
   cd MTRIX-STORE
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:8080` in your browser.

5. **Build for Production**
   ```bash
   npm run build
   ```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <sub>Built with ❤️ for the gaming & developer community by <b>MTRIX Team</b></sub>
</div>
