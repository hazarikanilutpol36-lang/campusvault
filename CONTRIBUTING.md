# Contributing to CampusVault 🎃

Thank you for your interest in contributing to **CampusVault** during Hacktoberfest! We want to make contributing as welcoming and straightforward as possible.

---

## 🎃 Hacktoberfest Participation Rules

To have your contribution count towards Hacktoberfest:
1. Make sure your Pull Request (PR) solves a real issue or adds a genuine enhancement.
2. Maintainers will review your PR and merge it or label it with `hacktoberfest-accepted`.
3. Quality contributions only: spam or auto-generated low-effort PRs will be closed and marked as `invalid`/`spam`.

---

## 🛠️ How to Contribute

1. **Fork the Repository**: Click "Fork" at the top right of the GitHub repository.
2. **Clone your Fork**:
   ```bash
   git clone https://github.com/<YOUR_USERNAME>/campus-vault.git
   cd campus-vault
   ```
3. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Install Dependencies & Test**:
   ```bash
   npm install
   npm run dev
   ```
5. **Verify Types and Build**:
   ```bash
   npm run lint
   npm run build
   ```
6. **Commit Your Changes**:
   ```bash
   git commit -m "feat: describe your change"
   ```
7. **Push to Your Fork & Open a PR**:
   ```bash
   git push origin feature/your-feature-name
   ```
   Open a Pull Request describing what changes you made and link any related issue.

---

## 💡 Ideas for Contributions

- **UI & UX Improvements**: Accessible keyboard shortcuts, responsive mobile optimizations.
- **Exporting & Reporting**: Export monthly expense logs to CSV or printable summary.
- **Currency & Localization**: Support multi-currency displays and localized date formats.
- **Budget Goal Simulators**: Add tuition payoff calculator or custom emergency fund goals.
- **Unit & Integration Tests**: Additional test coverage for expense calculation and budget alerts.
