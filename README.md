# CampusVault 🎓💰

> Student monthly expense tracker, personal budget manager, smart savings optimizer, and multi-asset micro-investment platform supporting savings accounts, index funds, crypto, P2P lending, and digital gold & silver.

[![Hacktoberfest](https://img.shields.io/badge/Hacktoberfest-2026-blueviolet?style=flat&logo=hacktoberfest)](https://hacktoberfest.com/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

---

## 🌟 Key Features

- **Monthly Student Expense Ledger**: Track purchases across 6 campus categories (*Food & Dining*, *Textbooks & Academic*, *Campus Transit*, *Subscriptions & Apps*, *Coffee & Social*, *Dorm & Essentials*).
- **Automated Spare Change Round-Ups**: Every transaction calculates spare change to the nearest dollar that sweeps directly into your uninvested Savings Pool.
- **Dynamic Category Budget Caps & Alerts**: Visual donut breakdown, cumulative burn trajectory, and threshold warnings (50%–100%) to prevent overspending.
- **Pattern-Based Savings Optimizer**: Audits dining and subscription habits to surface actionable monthly savings opportunities.
- **Multi-Asset Micro-Investment Hub**: Deploy saved budget surpluses directly into:
  - 🛡️ **Low-Risk Savings Vaults** (4.85%–5.25% APY)
  - 📈 **Fractional Index Funds** (S&P 500 ETF, Clean Tech)
  - ⚡ **Crypto Baskets & Stablecoin Yield**
  - 🤝 **Campus P2P Micro-Credit Lending**
  - 🪙 **LBMA-Vaulted Digital Gold & Silver**
- **Cloud Sync**: Firebase Firestore persistence with Google Authentication and Attribute-Based Access Control (ABAC) security rules.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm / yarn / bun

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/campus-vault.git
   cd campus-vault
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env` (or configure your Firebase credentials):
   ```bash
   cp .env.example .env
   ```

4. **Start the local dev server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🎃 Hacktoberfest Participation

We welcome contributors of all skill levels during Hacktoberfest! Check out our [CONTRIBUTING.md](CONTRIBUTING.md) guide to get started.

### Good First Issues
- Additional currency selectors (EUR, GBP, INR, CAD)
- Receipt OCR scanning integration
- CSV/PDF monthly budget export
- Dark / Light high-contrast theme toggles
- Additional micro-investing simulated instruments

---

## 📄 License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.
