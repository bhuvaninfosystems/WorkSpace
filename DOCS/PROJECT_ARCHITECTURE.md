# Task Management System - Project Architecture & Directory Structure

## Overview

This project is a modern, component-driven, modular frontend application built for enterprise **Task Management**. It utilizes vanilla HTML5, Tailwind CSS, custom design tokens, and modular ES6 JavaScript components without requiring heavy frontend framework builds (like React/Angular). 

The application is structured to easily integrate with a **C# / .NET RESTful API** backend, dividing responsibilities cleanly between design system assets (`Config/`), feature views (`Modules/`), and reusable UI component primitives (`UI_Components/`).

---

## Architectural Diagram

```mermaid
graph TD
    Client[Browser / User] --> Index[index.html - Login / Auth Landing]
    Index --> Modules[Modules Layer / Tasks Subsystem]
    
    subgraph Config Layer [Config Directory]
        CSS[global.css - Design System & Tokens]
        Assets[Images & Media Assets]
        CDN[Offline Vendor Libraries: AG-Grid, Chart.js, GSAP, Tailwind]
    end

    subgraph Modules Layer [Modules/Tasks/]
        Dash[Dashboard.html]
        Kanban[Kanban.html]
        NewTask[NewTask.html]
        Reports[TaskReport.html]
        Masters[UserMaster / OtherMaster]
    end

    subgraph Component Engine [UI_Components Directory]
        Layout[layout/ - Navigation & Data Grid]
        Cards[cards/ - Stat Cards, Graph Cards, Aging Cards]
        Modals[modals/ - Popup & Full-screen Dialogs]
        Widgets[widgets/ - KPI Manager, Loading Overlay, UI Buttons]
    end

    subgraph Backend [.NET Server Architecture]
        API[C# / .NET REST API Endpoints]
        DB[(Database)]
        API --> DB
    end

    Modules --> Config Layer
    Modules --> Component Engine
    Modules -- REST / JSON AJAX Requests --> API
```

---

## Complete Directory Structure

```
TaskManagement/
│
├── index.html                          # Entry Point / Authentication & Login Page
├── PROJECT_ARCHITECTURE.md             # Project Architecture & Directory Documentation
│
├── Config/                             # Central System Configuration & Global Assets
│   ├── assets/                         # Static Branding & Media Assets
│   │   └── images/                     # Logos, Backgrounds, and Vector Icons
│   ├── cdn/                            # Vendor JavaScript & CSS Libraries (Offline/Local Fallbacks)
│   │   ├── ag-grid-community.min.js    # Enterprise Data Grid Library
│   │   ├── chart.umd.min.js            # Analytics Data Visualization (Chart.js)
│   │   ├── gsap.min.js                 # UI Animation Engine
│   │   ├── jquery-3.7.1.min.js         # DOM Manipulation / Legacy AJAX support
│   │   ├── select2.full.min.js         # Enhanced Dropdown Select Control
│   │   ├── select2.min.css             # Select2 Stylesheet
│   │   ├── sweetalert2_11.js           # Interactive Alert & Notification Dialogs
│   │   ├── tailwindcss_3_4_17.js       # Tailwind CSS JIT Runtime Engine
│   │   └── fonts/                      # Custom Web Font Files
│   ├── nav/                            # Navigation Configuration & Menu Schemas
│   └── style/                          # Global CSS & Design System
│       └── global.css                  # Core CSS variables, resets, and theme tokens
│
├── Modules/                            # Feature-Driven Business Modules
│   └── Tasks/                          # Task Management Module Views
│       ├── Dashboard.html              # Main Task Analytics & Overview Dashboard
│       ├── Groups.html                 # Department & Group Task Distribution
│       ├── Kanban.html                 # Interactive Drag-and-Drop Task Kanban Board
│       ├── MyDashboard.html            # Personal User Task Workspace
│       ├── NewTask.html                # Task Creation & Assignment Entry Form
│       ├── OtherMaster.html            # Reference Data & Master Maintenance
│       ├── PasswordChange.html         # User Account Security Portal
│       ├── TaskReport.html             # Advanced Task Export & Analytical Reports
│       ├── TaskStatusView.html         # Lifecycle & Progress Tracking View
│       ├── UserMaster.html             # User Accounts & Role Permissions Management
│       └── VideoTraining.html          # Onboarding & User Training Video Portal
│
└── UI_Components/                      # Reusable Modular UI Component Engine
    ├── UI_COMPONENTS_GUIDE.md          # Implementation Guide for UI Components
    ├── cards/                          # Analytics & Summary Card Components
    │   ├── ageing-card.js              # Task Aging Matrix Display Card
    │   ├── bar-graph-card.js           # Chart.js Bar Graph Component Wrapper
    │   ├── doughnut-graph-card.js      # Chart.js Doughnut Graph Component Wrapper
    │   ├── modal-grid-card.js          # Grid Container embedded in Cards
    │   ├── nav-card.js                 # Quick Navigation Card Widget
    │   ├── pie-graph-card.js           # Chart.js Pie Chart Component Wrapper
    │   ├── quick-navigate-card.js      # Action Shortcut Link Card
    │   ├── stat-grid-card.js           # High-Level Metric & KPI Grid Container
    │   └── summary-list-card.js        # Itemized Task Summary List Display
    │
    ├── layout/                         # Core Structural Shell & Layout Controls
    │   ├── data-grid.js                # Custom Wrapper for AG-Grid Enterprise Tables
    │   └── navigation.js               # Universal Sidebar & Top Navigation Engine
    │
    ├── modals/                         # Reusable Dialog & Overlay System
    │   ├── popup-modal.js              # Dynamic Modal Dialog Engine
    │   ├── full-screen-popup-modal.js    # Full-screen Modal Dialog Container
    │   └── components/                 # Sub-elements for Modal Content
    │
    └── widgets/                        # Micro-UI Components & State Helpers
        ├── kpi-manager.js              # Real-time KPI Calculation & Rendering
        ├── loading-overlay.js          # GSAP-powered Global Loading Overlay
        └── ui-button.js                # Custom Standardized Button Generator
```

---

## Detailed Architectural Layers

### 1. Root & Entry Point (`index.html`)
* **Role**: Handles user authentication, credential validation, and session setup.
* **Flow**: Upon successful login, redirects users to main module views (e.g., `Modules/Tasks/Dashboard.html`).

### 2. Configuration & Asset Layer (`Config/`)
* **`Config/style/global.css`**: Defines design system tokens using CSS Custom Properties (`--primary-color`, typography scale, border radii, card elevation).
* **`Config/cdn/`**: Contains offline local fallbacks for external vendor scripts. This ensures the application functions smoothly in air-gapped corporate intranet environments.
* **`Config/assets/`**: Central storage for branding images, icons, and background graphic assets.

### 3. Business Modules (`Modules/Tasks/`)
Each `.html` file inside `Modules/Tasks/` represents a self-contained feature view:
* **Kanban (`Kanban.html`)**: Dynamic drag-and-drop workflow tracking.
* **Dashboard (`Dashboard.html` / `MyDashboard.html`)**: Real-time analytical widgets and metrics.
* **New Task (`NewTask.html`)**: Multi-field form for creating, scheduling, and assigning tasks.
* **Masters (`UserMaster.html`, `OtherMaster.html`)**: CRUD operations for managing system configuration data.

### 4. Reusable UI Components Engine (`UI_Components/`)
Rather than rewriting HTML/CSS across pages, UI components are modular JS classes:
* **Layout (`UI_Components/layout/`)**: `navigation.js` dynamically renders the universal sidebar navigation across all module views, and `data-grid.js` standardizes table views using AG-Grid.
* **Cards (`UI_Components/cards/`)**: Standardized wrappers around Chart.js and stat counters for consistent metrics presentation.
* **Modals (`UI_Components/modals/`)**: Reusable dialog system for forms, details, and confirm prompts.
* **Widgets (`UI_Components/widgets/`)**: Global micro-UI controls such as `loading-overlay.js` for loading indicators.

---

## Data Flow & Backend Integration Pattern

1. **User Action**: User triggers an action in a Module (e.g., submitting a task in `NewTask.html` or dragging a card in `Kanban.html`).
2. **AJAX/Fetch Call**: JavaScript sends an asynchronous request (via `fetch` or `jQuery.ajax`) to the C# / .NET API endpoint (e.g., `POST /api/tasks/create`).
3. **API Processing**: The C# .NET backend processes business logic and updates the database.
4. **DOM Update**: The frontend receives JSON responses and updates UI components (AG-Grid, Chart.js, KPI cards) reactively.

---

## CI/CD Pipeline Integration Readiness

Because the frontend is completely decoupled from the backend and composed of static files (HTML, JS, CSS, and assets), it is ideal for **GitHub Actions CI/CD automation**:

* **Source Control**: Code pushes trigger automated builds in GitHub.
* **Build Phase**: Compiles CSS assets and runs syntax checks.
* **Deployment Phase**: Deploys static files directly to the IIS web server (`C:\inetpub\wwwroot\`) using FTP/SFTP or a GitHub Self-Hosted Runner, eliminating manual RDP file transfers.
