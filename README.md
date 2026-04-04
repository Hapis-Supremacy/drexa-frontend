# 🚀 Drexa — Frontend

A modern, responsive crypto trading platform frontend built with **Next.js**, designed for performance, scalability, and a clean user experience.

---

## 📌 Overview

This project is the frontend for a crypto trading application focused on **spot trading**. It provides users with an intuitive interface to:

* Register and authenticate securely
* View market data and asset prices
* Execute trades
* Monitor portfolio performance
* Understand trading risks through onboarding flows

The system is designed with two main roles in mind:

* **User (Trader)** — interacts with the trading platform
* **Admin/Owner (future expansion)** — manages system-level operations

---

## 🧱 Tech Stack

* **Framework:** Next.js (App Router)
* **UI Library:** shadcn/ui, framer-motion
* **Styling:** Tailwind CSS
* **State Management:** (TBD / customizable — e.g., Zustand or React Context)
* **Routing:** Next.js routing system
* **API Communication:** Fetch / Axios (connected to Go backend)
* **Authentication:** Custom email/password auth via backend

---

## ✨ Features

### 🔐 Authentication System

* Email & password login
* Error handling with user-friendly feedback
* Planned:

  * National ID verification (KYC)
  * Face verification integration
  * Risk-awareness onboarding quiz

---

### 📊 Trading Interface

* Real-time (or near real-time) market data display
* Buy/sell crypto assets (spot trading)
* Order input panel (price, amount, confirmation)

---

### 💼 Portfolio Dashboard

* Asset balance overview
* Profit/loss tracking
* Transaction history

---

### ⚠️ Risk Awareness

* Optional onboarding quiz to ensure users understand:

  * Volatility
  * Leverage (educational context only)
  * Margin call concepts (for awareness, even in spot context)

---

## 🧩 Project Structure (Simplified)

```
/app
  /auth
    /login
    /register
  /dashboard
  /trade
  /portfolio

/components
  /ui        # shadcn/ui components
  /shared    # reusable components
  /features  # feature-specific components

/lib
  api        # API utilities
  utils      # helper functions

/styles
  globals.css
```

---

## 🎨 UI/UX Principles

* Clean, minimal, and modern interface
* Fast interactions with minimal reloads (SPA-like experience)
* Clear feedback for errors and actions
* Smooth transitions and animations (SCSS planned)
* Accessibility-friendly components via shadcn/ui

---

## 🔌 Backend Integration

This frontend connects to a custom backend built with **Go**. Key responsibilities include:

* Authentication & session handling
* Trade execution logic
* User data & portfolio management

---

## 🔒 Security Considerations

* Input validation on both frontend & backend
* Secure authentication flow
* KYC integration (planned)
* Protection against common vulnerabilities (XSS, CSRF, etc.)

---

## 🚧 Future Improvements

* Real-time updates via WebSockets
* Advanced charting tools
* Dark/light theme toggle
* Mobile-first optimization
* Notifications system (price alerts, trade confirmations)
* Multi-language support

---

## ⚙️ Setup & Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

---

## 📄 Notes

* This project focuses on **spot trading**, not derivatives (e.g., futures or CFDs).
* Educational elements are included to promote responsible trading behavior.
* Designed to be scalable for future financial features.

---

## 🤝 Suggestion

This project is currently under active development. Suggestions, and improvements are always welcomed.

---

## 📜 License

This project is proprietary software.

All rights reserved. Unauthorized copying, modification, or distribution is not permitted.

---

## 💡 Philosophy

Build a trading platform that is:

* Simple enough for beginners
* Powerful enough for growth
* Responsible in educating users about financial risk

---