# UI Components Guide (jQuery)

How to use every script under **`NewDesign/UI_Components/`** from a plain HTML page with **jQuery 3.x**, **`$.ajax`**, and one inline `<script>` block — the same style as **`NewDesign/Task/Groups.html`**.

- No ES modules, no `import`, no `async/await`
- Use **`var`**, **`function () { }`**, **`$(function () { … })`**
- Read/write DOM with **`$('#id')`**, **`.find()`**, **`.val()`**, **`.on()`**

**Creating a new page?** Read **[§2 Standard naming conventions](#2-standard-naming-conventions-required)** first — use the **same IDs, classes, and function names** on every file (no file-specific names like `group-modal` or `loadGroups`).

**Per-component deep dives:** [ComponentGuid/ui-components-index.md](../ComponentGuid/ui-components-index.md) (navigation, grids, modals, forms, charts, feedback).

---

## Contents

1. [Folder layout](#1-folder-layout)
2. [Standard naming conventions (required)](#2-standard-naming-conventions-required)
3. [Paths from your HTML page](#3-paths-from-your-html-page)
4. [What to put in `<head>`](#4-what-to-put-in-head)
5. [Page HTML shell](#5-page-html-shell)
6. [How to structure your `<script>`](#6-how-to-structure-your-script)
7. [Components](#7-components)
   - [Loading overlay](#71-loading-overlay)
   - [Navigation](#72-navigation)
   - [KPI manager](#73-kpi-manager)
   - [Input styles](#74-input-styles)
   - [Premium button](#75-premium-button)
   - [Popup modal](#76-popup-modal)
   - [Modal tabs](#77-modal-tabs)
   - [Modal grid](#78-modal-grid)
   - [Data grid (main list)](#79-data-grid-main-list)
   - [Chart cards & card loading](#710-chart-cards--card-loading)
   - [Select2 (optional)](#711-select2-optional)
8. [Full minimal example](#8-full-minimal-example)
9. [Quick lookup table](#9-quick-lookup-table)

---

## 1. Folder layout

```text
UI_Components/
├── feedback/loading-overlay.js   # Full-page loader (GSAP)
├── layout/navigation.js          # Sidebar + top bar + bottom nav
├── widgets/kpi-manager.js        # KPI strip
├── grids/
│   ├── data-grid.js              # <premium-grid>
│   └── modal-grid.js             # <premium-modal-grid>
├── cards/
│   ├── bar-graph-card.js
│   ├── pie-graph-card.js
│   ├── doughnut-graph-card.js
│   └── modal-grid-card.js
├── modals/
│   ├── popup-modal.js            # <premium-popup-modal>
│   ├── full-screen-popup-modal.js # <premium-fullscreen-popup-modal>
│   └── modal-tabs.js             # <premium-modal-tabs>
└── forms/
    ├── input-field.js            # PremiumInputStyles
    └── ui-button.js              # <premium-button>
```

Assets and vendor files: **`NewDesign/Config/`** (`cdn/`, `style/global.css`, `assets/images/`).

---

## 2. Standard naming conventions (required)

When you create a **new Task page** from this guide, use the **same IDs, classes, and function names on every page**. Do **not** prefix names with the file or module (no `Groups`, `Task`, `Kanban`, etc. in identifiers).

This keeps copy-paste, code review, and onboarding consistent. Only **labels, titles, API URLs, and column `field` names** should reflect the business domain.

### Rule

| ✅ Use (shared) | ❌ Avoid (file-specific) |
|-----------------|---------------------------|
| `#page-grid` | `#groups-grid`, `#task-grid`, `#kanban-grid` |
| `#main-modal` | `#group-modal`, `#task-modal` |
| `openForAdd()` | `openGroupAdd()`, `openTaskModal()` |
| `loadRecords()` | `loadGroups()`, `loadTasks()` |
| `window.onEdit` | `window.onEditGroup`, `handleTaskEdit` |

### Standard element IDs

Use these **exact** `id` values in HTML unless the page truly has no equivalent control (e.g. no nested modal → omit `#nested-modal`).

| ID | Element | Purpose |
|----|---------|---------|
| `sidebar-container` | `<div>` | Navigation sidebar host |
| `top-nav-container` | `<div>` | Top bar host |
| `bottom-nav-container` | `<div>` | Mobile bottom nav host |
| `main-canvas` | `<main>` | Page content area |
| `kpi-container` | `<div>` | KPI strip host |
| `page-grid` | `<premium-grid>` | Main list grid |
| `main-modal` | `<premium-popup-modal>` | Primary CRUD modal |
| `nested-modal` | `<premium-popup-modal>` | Optional second modal (picker / add member) |
| `main-form` | `<form>` | Form inside `main-modal` |
| `nested-form` | `<form>` | Form inside `nested-modal` |
| `items-grid` | `<premium-modal-grid>` | Sub-grid in main modal (line items / members) |
| `picker-grid` | `<premium-modal-grid>` | Sub-grid in nested modal (picker list) |
| `field-name` | `<input>` | Primary name field (`#field-{purpose}` pattern) |
| `field-role` | `<select>` | Example secondary field (role / type / category) |
| `btn-open-nested` | `<button>` | Opens nested modal from main modal |

**Field pattern:** use `#field-{shortPurpose}` — e.g. `field-name`, `field-role`, `field-due-date`. Never `field-groupName`, `field-taskTitle`.

### Standard `button-id` (premium-button)

| `button-id` | Usage |
|-------------|--------|
| `btn-add-record` | Toolbar — opens add flow (`openForAdd`) |
| `btn-open-nested` | Inside main modal — opens nested modal |

```html
<premium-button button-id="btn-add-record" icon="plus-circle" label="Add"></premium-button>
```

Selector in jQuery: `$('premium-button[button-id="btn-add-record"]')`.

### Standard CSS classes (layout)

Reuse the same utility classes on every page shell (do not invent per-page layout class names):

```html
<body class="w-screen h-screen overflow-hidden">
<div class="h-full w-full flex relative border-2 border-gray-200">
<div class="flex-1 flex flex-col h-full overflow-hidden pb-14 sm:pb-0">
<main id="main-canvas" class="relative flex-1 bg-gray-50/40">
<premium-grid id="page-grid" class="w-full flex-1 min-h-0">
```

Form styling attributes (shared across pages):

- `data-premium-input-scope` on form wrapper
- `data-premium-input` on inputs
- `data-premium-label` on labels

### Standard JavaScript variables

| Variable | Type | Purpose |
|----------|------|---------|
| `pageGridApi` | AG Grid API | Main grid instance after `render()` |
| `recordList` | `Array` | Normalized rows for main grid |
| `modalMode` | `string` | `'add'` \| `'view'` \| `'edit'` |
| `editingRecord` | `object` \| `null` | Row being viewed/edited |
| `modalItems` | `Array` | Rows for `items-grid` inside modal |
| `mainModal` | DOM node | `$('#main-modal').get(0)` |
| `nestedModal` | DOM node | `$('#nested-modal').get(0)` (if used) |
| `kpiApi` | object | Return value of `KPIManager.render` (optional) |

### Standard function names

| Function | Responsibility |
|----------|----------------|
| `initKPIs()` | Render KPI strip into `#kpi-container` |
| `initPageGrid()` | `setOptions` + `render` on `#page-grid` |
| `loadRecords()` | `$.ajax` GET — fill grid + KPIs |
| `saveRecord()` | `$.ajax` POST/PUT — persist from main modal |
| `deleteRecord(id)` | `$.ajax` DELETE (or confirm via Swal first) |
| `fetchRecord(id, callback)` | Load one row by id, then `callback(record)` |
| `findRecordById(id)` | Sync lookup in `recordList` |
| `openForAdd()` | Main modal, mode add |
| `openForView(record)` | Main modal, mode view (readonly) |
| `openForEdit(record)` | Main modal, mode edit |
| `openForEditById(id)` | `fetchRecord` then `openForEdit` |
| `openForDelete(id)` | Confirm + delete (often Swal only, no modal) |
| `refreshItemsGrid()` | `setOptions` + `render` on `#items-grid` |
| `refreshPickerGrid()` | `setOptions` + `render` on `#picker-grid` |
| `styleModalFields(modal)` | `PremiumInputStyles.applyModal` + `applyByDataAttr` |

### Standard `window` handlers (grid actions)

Define these names **exactly** — they are referenced as strings in `actionCallbacks`:

```javascript
window.onView   = function (id) { /* fetchRecord → openForView */ };
window.onEdit   = function (id) { openForEditById(id); };
window.onDelete = function (id) { openForDelete(id); };
```

```javascript
actionCallbacks: {
    view: 'onView',
    edit: 'onEdit',
    delete: 'onDelete'
}
```

### What may differ per page

Only these should change between files:

- Page `<title>` and modal **titles/subtitles** (user-visible text)
- **API URLs** and request/response mapping
- **Grid `columns`** `field` / `headerName` (domain columns)
- Extra `#field-*` inputs when the entity has more fields (still use `field-*` pattern)
- KPI card `id` values inside `KPIManager.render` (e.g. `total`, `active`) — keep ids short and generic, not `totalGroups`

### Checklist before you commit a new page

- [ ] Main grid id is **`page-grid`**, not a file-specific name
- [ ] Main modal id is **`main-modal`**
- [ ] Init functions are **`initPageGrid`** / **`initKPIs`**, not `initGroupsGrid`
- [ ] Load/save are **`loadRecords`** / **`saveRecord`**, not `loadGroups` / `saveGroup`
- [ ] Modal opens use **`openForAdd` / `openForView` / `openForEdit`**
- [ ] Grid bridge uses **`window.onView` / `onEdit` / `onDelete`**
- [ ] Add button uses **`button-id="btn-add-record"`**

> **Note:** Older pages (e.g. `Groups.html`, `NewTask.html`) may still use legacy names like `openAdd` or `loadGroups`. **New pages built from this guide must use the standard names above.**

---

## 3. Paths from your HTML page

| Your page is in… | Script tag example |
|------------------|-------------------|
| **`NewDesign/Task/`** (Groups, Dashboard, …) | `<script src="../UI_Components/layout/navigation.js"></script>` |
| **`NewDesign/`** (e.g. index.html) | `<script src="UI_Components/layout/navigation.js"></script>` |

Same rule for `../Config/cdn/jquery-3.7.1.min.js` vs `Config/cdn/...`.

---

## 4. What to put in `<head>`

### Standard Task page (list + modal)

Copy from **`Groups.html`**. Order matters.

```html
<script src="../Config/cdn/tailwindcss_3_4_17.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
<link rel="stylesheet" href="../Config/style/global.css">

<script src="../Config/cdn/gsap.min.js"></script>
<script src="../UI_Components/feedback/loading-overlay.js"></script>
<script src="../Config/cdn/sweetalert2_11.js"></script>
<script src="../Config/cdn/jquery-3.7.1.min.js"></script>
<script src="../Config/cdn/ag-grid-community.min.js"></script>

<script src="../UI_Components/layout/navigation.js"></script>
<script src="../UI_Components/widgets/kpi-manager.js"></script>
<script src="../UI_Components/grids/modal-grid.js"></script>
<script src="../UI_Components/grids/data-grid.js"></script>
<script src="../UI_Components/modals/popup-modal.js"></script>
<script src="../UI_Components/forms/ui-button.js"></script>
<script src="../UI_Components/forms/input-field.js"></script>
```

### Add only when you need them

| Need | Add |
|------|-----|
| Select2 dropdown | `select2.min.css` + `select2.full.min.js` + `forms/select2-field.js` **after jQuery** |
| Modal tabs | `modals/modal-tabs.js` |
| Dashboard charts | `chart.umd.min.js` + `cards/*.js` (loading built into each card) |

---

## 5. Page HTML shell

Navigation fills these containers for you:

```html
<div class="h-full w-full flex relative">
    <div id="sidebar-container" class="h-full flex-shrink-0"></div>

    <div class="flex-1 flex flex-col h-full overflow-hidden pb-14 sm:pb-0">
        <div id="top-nav-container"></div>

        <main id="main-canvas" class="relative flex-1 bg-gray-50/40">
            <div id="kpi-container"></div>

            <premium-button button-id="btn-add-record" icon="plus-circle" label="Add" class="hidden"></premium-button>

            <premium-grid id="page-grid" class="w-full flex-1 min-h-0"></premium-grid>

            <premium-popup-modal id="main-modal" data-title="Record" data-width="560px">
                <template data-modal-body>
                    <form id="main-form" data-premium-input-scope onsubmit="return false;">
                        <label data-premium-label for="field-name">Name</label>
                        <input data-premium-input id="field-name" type="text" required />
                    </form>
                </template>
            </premium-popup-modal>
        </main>
    </div>
</div>

<div id="bottom-nav-container"></div>
```

`pb-14 sm:pb-0` keeps content clear of the mobile bottom bar.

---

## 6. How to structure your `<script>`

Use **one** script block at the bottom of the page. Follow the same **8-section layout** used in `LeadMaster.html` and `Modules/Accounts/AccountMaster.html`.

### File header (banner)

```javascript
// ╔══════════════════════════════════════════════════════════════════╗
// ║ Account Master                                                   ║
// ║  Short description of the page.                                  ║
// ╚══════════════════════════════════════════════════════════════════╝
//
//  SECTIONS:  1-CONSTANTS  2-STATE  3-DATA  4-UI HELPERS
//             5-FEATURE LOGIC  6-COMPONENTS  7-EVENTS  8-INIT
```

### Section dividers

Between each section, use a line comment block:

```javascript
// ─────────────────────────────────────────────────────────────────
// SECTION 3 — DATA (demo — replace with API when ready)
// ─────────────────────────────────────────────────────────────────
```

### Section responsibilities

| Section | Contents |
|---------|----------|
| **1 — CONSTANTS** | `DomainName`, auth guard (commented), config from `localStorage` — use `const` |
| **2 — STATE** | `recordList`, `pageGridApi`, `modalMode`, modal refs — use `let` |
| **3 — DATA** | Demo loaders **or** `fetch` API functions; optional `transformers` object for map in/out |
| **4 — UI HELPERS** | `styleModalFields`, Select2 helpers, `showSwalToast`, `showSwalError`, grid/KPI helpers |
| **5 — FEATURE LOGIC** | Save/delete/filter, `openForAdd` / `openForView` / `openForEdit`, business rules |
| **6 — COMPONENTS** | `renderComponents()` — nav, KPIs, grid `setOptions` + `render()`, modal host refs |
| **7 — EVENTS** | `window.onView` / `onEdit` / `onDelete`, `bindEvents()` — modal callbacks, toolbar clicks |
| **8 — INIT** | `document.addEventListener('DOMContentLoaded', init)` and `init()` bootstrap |

### Demo data pattern (`SECTION 3 — DATA`)

Until the API exists, keep rows in a `transformers` object and load via `loadRecords()`:

```javascript
const transformers = {
    demoRows: function () {
        return [
            { id: '1', accountName: 'Cash Account', accountType: 'Cash', status: 'Active' }
        ];
    },
    formPayload: function ($body, mode, existingRecord) {
        return { /* map form → row */ };
    }
};

function loadRecords() {
    recordList = transformers.demoRows();
    applyGridRows(recordList);
}
```

When wiring the API later, add `fetchListAPI` / `saveAPI` in **SECTION 3** and call them from **SECTION 5** — do not move demo arrays into feature logic.

### Page init (last lines)

```javascript
document.addEventListener('DOMContentLoaded', init);

function init() {
    renderComponents();
    bindEvents();
    loadRecords();
}
```

jQuery `$(function () { init(); })` is acceptable if the page already depends on jQuery for init order.

### Rules that match the components

| Pattern | Why |
|---------|-----|
| `const` / `let` for top-level constants and state | Matches LeadMaster; avoids accidental globals |
| `var el = $('#page-grid').get(0)` | Custom elements are DOM nodes; call `.setOptions()` on the node |
| `$(modal.getBodyElement()).find('#field-name').val()` | Modal body is inside the component host |
| `window.onEdit = function (id) { … }` | `data-grid` `actionCallbacks` use **string names** on `window` |
| `PremiumInputStyles.applyModal(body)` | Run after every `modal.open()` |
| `showSwalToast('Record Saved Successfully')` | Align toast copy with `testRequirement.md` |
| `$.ajax` in **SECTION 3** when API is ready | Keep HTTP out of **SECTION 5** except orchestration |

---

## 7. Components

---

### 7.1 Loading overlay

> **Full reference:** [ComponentGuid/loading-overlay.md](../ComponentGuid/loading-overlay.md)

**File:** `feedback/loading-overlay.js`  
**Needs:** GSAP

**Globals:** `LoadingOverlay`, `startLoader`

```javascript
// Short overlay on current page
LoadingOverlay.show({
    title: 'Saving…',
    duration: 0.8,
    onComplete: function () {
        loadRecords();
    }
});

// Navigate to another page with loader
$('#link-dashboard').on('click', function (e) {
    e.preventDefault();
    LoadingOverlay.startPageTransition('Dashboard.html', {
        duration: 0.55,
        title: 'Loading'
    });
});
```

### 7.1b Record delete confirmation

> **Full reference:** [ComponentGuid/record-delete-swal.md](../ComponentGuid/record-delete-swal.md)

**File:** `feedback/record-delete-swal.js`  
**Needs:** SweetAlert2 (after `sweetalert2_11.js`)

Shows record summary + **required reason** textarea before delete.

```html
<script src="../Config/cdn/sweetalert2_11.js"></script>
<script src="../UI_Components/feedback/record-delete-swal.js"></script>
```

```javascript
PremiumRecordDelete.confirm({
    title: 'Delete account?',
    record: row,
    fields: [
        { label: 'Account Name', key: 'accountName' },
        { label: 'Status', key: 'status' }
    ],
    didClose: refreshPageGridLayout,
    onConfirm: function (reason, record) {
        // API delete with reason, then refresh grid
    }
});
```

`fields` may use `key`, fixed `value`, or `format: 'percent'`. Reason is required (min 3 characters). Uses `heightAuto: false` so the grid does not collapse.

---

### 7.2 Navigation

> **Full reference:** [ComponentGuid/navigation.md](../ComponentGuid/navigation.md)

**File:** `layout/navigation.js`  
**Needs:** GSAP, Bootstrap Icons, `#sidebar-container`, `#top-nav-container`, `#bottom-nav-container`

```javascript
$(function () {
    NavigationManager.init(undefined, { useMainNavRail: false });
});

// After login API writes menu JSON to localStorage:
function onMenuLoaded() {
    NavigationManager.reloadFromMinuList('MinuList');
}
```

**Instance:** `window.appNav` after init.

**Optional (set before script tag):**

```html
<script>window.__PREMIUM_LOGOUT_HREF__ = '/logout';</script>
```

---

### 7.3 KPI manager

> **Full reference:** [ComponentGuid/kpi-manager.md](../ComponentGuid/kpi-manager.md)

**File:** `widgets/kpi-manager.js`

```javascript
var kpiApi;

function initKPIs() {
    kpiApi = KPIManager.render('#kpi-container', {
        cards: [
            { id: 'total', label: 'Total', value: '0', icon: 'bi bi-collection' },
            { id: 'active', label: 'Active', value: '0', icon: 'bi bi-check-circle' }
        ],
        hideOnMobile: false
    });
}

function updateKpiFromRows(rows) {
    if (!kpiApi) return;
    kpiApi.setValue('total', String(rows.length));
    kpiApi.setValue('active', String(rows.filter(function (r) { return r.active; }).length));
}
```

Icons: use full class string **`bi bi-people`** (not only `people`).

---

### 7.4 Input styles

> **Full reference:** [input-field.md](../ComponentGuid/input-field.md) · [select2-field.md](../ComponentGuid/select2-field.md) · [ui-button.md](../ComponentGuid/ui-button.md) (index: [forms-components.md](../ComponentGuid/forms-components.md))

**File:** `forms/input-field.js`  
**Global:** `PremiumInputStyles`

Mark fields in HTML:

```html
<label data-premium-label for="field-name">Name</label>
<input data-premium-input id="field-name" type="text" />
```

After modal open or dynamic HTML:

```javascript
function styleModalFields(modal) {
    var body = modal.getBodyElement();
    PremiumInputStyles.applyModal(body);
    PremiumInputStyles.applyByDataAttr(body);
}

// Example in openForAdd:
mainModal.open({ mode: 'add', title: 'Add' });
styleModalFields(mainModal);
```

**Date fields** — add `data-premium-date` on `input[type="date"]` (runs via `applyModal` / `applyByDataAttr`):

| `data-premium-date` | Behaviour |
|---------------------|-----------|
| `forward-block` | No future dates (`max` = today) |
| `backward-block` | No past dates (`min` = today) |
| `default-today` | Value = today, read-only + disabled |
| `normal` | Open range (optional `data-premium-date-min` / `data-premium-date-max`) |
| `age` | Age limits: `data-premium-date-min-age`, `data-premium-date-max-age` (years, for DOB) |
| `from` | Range start; `max` = today unless `data-premium-date-allow-future="true"` |
| `to` | Range end; needs `data-premium-date-from="#fromId"`; `min` = from value, `max` = today |

```html
<input data-premium-input id="field-from-date" type="date" data-premium-date="from" required />
<input data-premium-input id="field-to-date" type="date" data-premium-date="to"
    data-premium-date-from="#field-from-date" required />

<!-- DOB: at least 18 years old -->
<input data-premium-input id="field-dob" type="date" data-premium-date="age"
    data-premium-date-min-age="18" required />
```

After programmatic date values: `PremiumInputStyles.refreshDateFields(modal.getBodyElement());`

**Number fields** — add `data-premium-number` on `input[type="number"]` or `input[type="text"]`:

| `data-premium-number` | Behaviour |
|-----------------------|-----------|
| `fraction` | Decimals allowed (`data-premium-number-fraction-digits`, default `2`) |
| `integer` | Whole numbers only (blocks `.` `e`); aliases: `whole`, `without-fraction` |

| Attribute | Purpose |
|-----------|---------|
| `data-premium-number-min-length` | Minimum digit count (0–9) |
| `data-premium-number-max-length` | Maximum digit count (0–9) |
| `data-premium-number-min` / `data-premium-number-max` | Optional numeric value bounds |
| `data-premium-number-fraction-digits` | Max decimal places (fraction mode, default `2`) |

```html
<!-- Tax % with up to 2 decimal places, max 5 digits -->
<input data-premium-input id="field-tax-percent" type="number" data-premium-number="fraction"
    data-premium-number-fraction-digits="2" data-premium-number-max-length="5" min="0" max="100" required />

<!-- Quantity: whole number, 1–6 digits -->
<input data-premium-input id="field-qty" type="number" data-premium-number="integer"
    data-premium-number-min-length="1" data-premium-number-max-length="6" required />
```

`PremiumInputStyles.validateNumberField(el)` runs length/value checks (uses `setCustomValidity`).  
After dynamic values: `PremiumInputStyles.refreshNumberFields(scope)`.

**Text fields** — `data-premium-text` on `input` or `textarea` (with `data-premium-input`):

| `data-premium-text` | Behaviour |
|---------------------|-----------|
| `normal` | Standard single-line text (default) |
| `textarea` | Multi-line; use on `<textarea>`; optional `data-premium-text-rows="4"` |
| `title-case` | Capitalize first letter of each word on blur (aliases: `title`, `capitalize`) |

**Required indicator** — any field with `required` (and `id` + matching `label[for]`) gets an automatic red `*` appended to the label. Manual `*` in label text is removed and replaced.

```html
<label data-premium-label for="field-name">Account Name</label>
<input data-premium-input id="field-name" type="text" required />

<label data-premium-label for="field-notes">Notes</label>
<textarea data-premium-input data-premium-text="textarea" data-premium-text-rows="5"
    id="field-notes"></textarea>

<label data-premium-label for="field-city">City</label>
<input data-premium-input data-premium-text="title-case" id="field-city" type="text" />
```

Runs via `applyModal` / `applyByDataAttr`. Helpers: `applyTextFields(scope)`, `applyRequiredMarksInScope(scope)`, `toTitleCaseWords(str)`.

**Phone / contact fields** — `data-premium-phone`:

| `data-premium-phone` | Behaviour |
|----------------------|-----------|
| `plain` / `without-country` | Single field, digits only, min/max length (aliases: `no-country`, `local`) |
| `with-country` / `country` | Country dial `<select>` + national number input |

| Attribute | Purpose |
|-----------|---------|
| `data-premium-phone-min-length` | Minimum digits (national number) |
| `data-premium-phone-max-length` | Maximum digits |
| `data-premium-phone-default-dial` | Default code e.g. `+91` (with-country only) |

```html
<!-- Without country code -->
<label data-premium-label for="field-mobile">Mobile</label>
<input data-premium-input data-premium-phone="plain" id="field-mobile" type="tel"
    data-premium-phone-min-length="10" data-premium-phone-max-length="10" required />

<!-- With country code (explicit group) -->
<label data-premium-label for="field-phone">Phone</label>
<div data-premium-phone="with-country" data-premium-phone-group
    data-premium-phone-min-length="10" data-premium-phone-max-length="10"
    data-premium-phone-default-dial="+91">
    <select data-premium-phone-dial data-premium-input aria-label="Country code"></select>
    <input data-premium-phone-number data-premium-input id="field-phone" type="tel"
        placeholder="Phone number" required />
</div>

<!-- With country code (auto-wrap: single input becomes dial + number) -->
<input data-premium-input data-premium-phone="with-country" id="field-phone2" type="tel"
    data-premium-phone-min-length="10" data-premium-phone-max-length="10" required />
```

Helpers: `getPhoneValue(el)` (E.164-style `+91` + digits), `validatePhoneField(el)`, `refreshPhoneFields(scope)`.

---

### 7.5 Premium button

> **Full reference:** [ComponentGuid/ui-button.md](../ComponentGuid/ui-button.md)

**File:** `forms/ui-button.js`

```html
<premium-button button-id="btn-add-record" icon="plus-circle" label="Add"></premium-button>
```

```javascript
// Click
$('premium-button[button-id="btn-add-record"]').on('click', function () {
    openForAdd();
});

// Move button into grid toolbar (Groups pattern)
var grid = $('#page-grid').get(0);
var $btn = $('premium-button[button-id="btn-add-record"]');
$btn.removeClass('hidden');
grid.getActionsSlot().appendChild($btn.get(0));
```

---

### 7.6 Popup modal

> **Full component reference:** [ComponentGuid/popup-modal.md](../ComponentGuid/popup-modal.md)

**File:** `modals/popup-modal.js`

```html
<premium-popup-modal id="main-modal" data-title="Record" data-width="600px" data-height="auto">
    <template data-modal-body>
        <!-- form fields -->
    </template>
</premium-popup-modal>
```

**Get instance:**

```javascript
var mainModal = $('#main-modal').get(0);
var $body;
```

**Open modes (add / view / edit):**

| Mode | `modal.open` | Form | Typical footer |
|------|--------------|------|----------------|
| **add** | `mode: 'add'` | Empty, editable | Save (submit) |
| **view** | `mode: 'view'` | Filled, frozen | Close only |
| **edit** | `mode: 'edit'` | Filled, editable | Update / Save (submit) |

```javascript
var editingRecord = null;
var modalMode = 'add';

function openForAdd() {
    modalMode = 'add';
    editingRecord = null;

    mainModal.open({
        mode: 'add',
        title: 'Add record',
        subtitle: 'Fill in the form',
        buttons: [{ label: 'Save', id: 'modal-submit-btn', type: 'primary', submit: true }]
    });

    $body = $(mainModal.getBodyElement());
    $body.find('#field-name').val('');
    styleModalFields(mainModal);
}

function openForView(record) {
    if (!record) return;

    modalMode = 'view';
    editingRecord = record;

    mainModal.open({
        mode: 'view',
        title: 'View record',
        subtitle: record.name || 'Details',
        buttons: [{ label: 'Close', id: 'modal-cancel-btn', type: 'secondary' }],
        freezeInputs: true,
        freezeMode: 'readonly'
    });

    $body = $(mainModal.getBodyElement());
    $body.find('#field-name').val(record.name || '');
    styleModalFields(mainModal);
}

function openForEdit(record) {
    if (!record) return;

    modalMode = 'edit';
    editingRecord = record;

    mainModal.open({
        mode: 'edit',
        title: 'Edit record',
        subtitle: 'Update and save changes',
        buttons: [{ label: 'Update', id: 'modal-submit-btn', type: 'primary', submit: true }],
        freezeInputs: false
    });

    $body = $(mainModal.getBodyElement());
    $body.find('#field-name').val(record.name || '');
    styleModalFields(mainModal);
}

// Open edit from grid row id (load full record first — same as Groups.html openEdit)
function openForEditById(id) {
    fetchRecord(id, function (record) {
        if (!record) {
            if (window.Swal) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Could not load record for editing.' });
            }
            return;
        }
        openForEdit(record);
    });
}
```

**Grid → modal wiring:**

```javascript
window.onView = function (id) {
    fetchRecord(id, function (record) {
        if (record) openForView(record);
    });
};

window.onEdit = function (id) {
    openForEditById(id);
};
```

**Callbacks:**

```javascript
mainModal.setOnSave(function () {
    if (modalMode === 'view') return;
    saveRecord();
});

mainModal.setOnDelete(function () {
    deleteRecord(editingId);
});

mainModal.setOnClose(function () {
    editingRecord = null;
    modalMode = 'add';
});
```

**Loading state inside modal:**

```javascript
mainModal.setLoading(true, 'Loading…');
$.ajax({ url: url, method: 'GET' })
    .done(function (data) { /* fill form */ })
    .always(function () {
        mainModal.setLoading(false);
    });
```

**Other methods:** `close()`, `setBody(html)`, `getBodyElement()`

---

### 7.6.1 Full-screen popup modal (main canvas)

> **Full component reference:** [ComponentGuid/full-screen-popup-modal.md](../ComponentGuid/full-screen-popup-modal.md)

**File:** `modals/full-screen-popup-modal.js` (requires `popup-modal.js` first)  
**Element:** `<premium-fullscreen-popup-modal>`

Covers the entire **`#main-canvas`** area (KPI + grid), not a centered card. Same `open()` / callbacks / validation as §7.6.

```html
<script src="../UI_Components/modals/popup-modal.js"></script>
<script src="../UI_Components/modals/full-screen-popup-modal.js"></script>

<main id="main-canvas" class="relative flex flex-1 flex-col overflow-hidden">
    <premium-fullscreen-popup-modal id="workspace-modal" data-title="Account">
        <template data-modal-body><!-- form --></template>
    </premium-fullscreen-popup-modal>
    <div class="relative flex h-full flex-col"><!-- kpi + grid --></div>
</main>
```

```javascript
var workspaceModal = $('#workspace-modal').get(0);
workspaceModal.open({ mode: 'add', title: 'Add Account', buttons: [{ label: 'Save', id: 'modal-submit-btn', type: 'accent', submit: true }] });
```

---

### 7.7 Modal tabs

> **Full reference:** [ComponentGuid/modal-tabs.md](../ComponentGuid/modal-tabs.md)

**File:** `modals/modal-tabs.js` (optional)

```html
<premium-modal-tabs id="detail-tabs"></premium-modal-tabs>
```

```javascript
$(function () {
    var tabs = $('#detail-tabs').get(0);
    tabs.setItems([
        { id: 'info', label: 'Info', content: '<div class="p-4">…</div>' },
        { id: 'log', label: 'Log', content: '<div class="p-4">…</div>' }
    ]);
    tabs.setActive('info');
    tabs.render();
});
```

---

### 7.8 Modal grid

> **Full reference:** [ComponentGuid/modal-grid.md](../ComponentGuid/modal-grid.md)

**File:** `grids/modal-grid.js`  
**Needs:** AG Grid before this script

```html
<premium-modal-grid id="members-grid" style="height:280px;"></premium-modal-grid>
```

```javascript
function refreshMembersGrid(rows) {
    var grid = $('#members-grid').get(0);
    if (!grid) return;

    grid.setOptions({
        columns: [
            { field: 'name', headerName: 'Name', minWidth: 160 },
            { field: 'role', headerName: 'Role', width: 120 }
        ],
        rowData: rows || [],
        rowHeight: 42
    });
    grid.render();
}

// If you cleared the host with .empty(), call setOptions + render again
```

**Methods:** `setOptions`, `render`, `setRowData`, `getApi`

---

### 7.9 Data grid (main list)

> **Full component reference:** [ComponentGuid/data-grid.md](../ComponentGuid/data-grid.md)

**File:** `grids/data-grid.js`  
**Element:** `<premium-grid>`

#### Setup

```javascript
var pageGridApi;

function initPageGrid() {
    var grid = $('#page-grid').get(0);
    if (!grid) return;

    grid.setOptions({
        rowIdField: 'id',
        showSINO: true,
        showActions: true,
        actionCallbacks: {
            view: 'onView',
            edit: 'onEdit',
            delete: 'onDelete'   // use null to hide delete column action
        },
        columns: [
            { field: 'groupName', headerName: 'Group Name', minWidth: 200, filter: true },
            { field: 'status', headerName: 'Status', width: 120 }
        ],
        rowData: [],
        sortColumn: 'groupName',
        pagination: true,
        paginationPageSize: 15
    });

    pageGridApi = grid.render();
}
```

#### Window handlers (required)

```javascript
window.onView = function (id) {
    var row = findRecordById(id);
    if (row) openForView(row);
};

window.onEdit = function (id) {
    var row = findRecordById(id);
    if (row) openForEdit(row);
};

window.onDelete = function (id) {
    confirmDelete(id);
};
```

Define these **before** `grid.render()`.

#### Load data with table overlay

```javascript
function loadRecords() {
    var grid = $('#page-grid').get(0);

    if (grid && grid.setTableLoading) {
        grid.setTableLoading(true, 'Loading…');
    }

    $.ajax({
        url: apiBase + '/api/Your/List',
        method: 'GET'
    }).done(function (json) {
        recordList = parseRows(json);
        if (grid) {
            grid.setRowData(recordList);
        }
        updateKpiFromRows(recordList);
    }).fail(function (xhr) {
        console.warn('loadRecords', xhr);
        if (window.Swal) {
            Swal.fire({ icon: 'warning', title: 'Error', text: 'Could not load data.' });
        }
    }).always(function () {
        if (grid && grid.setTableLoading) {
            grid.setTableLoading(false);
        }
    });
}
```

#### Other methods

| Method | Usage |
|--------|--------|
| `setRowData(rows)` | Replace all rows |
| `setTableLoading(true, 'msg')` | Show/hide grid overlay |
| `setGlobalSearch('text')` | Toolbar search |
| `getApi()` | Raw AG Grid API |
| `getActionsSlot()` | DOM node for toolbar buttons |

#### Column width note

Default sizing uses **`autoSizeStrategy: fitGridWidth`**. Prefer **`minWidth` / `width`** on columns.  
If you need **`flex: 1`** on columns, set **`suppressSizeToFit: true`** in `setOptions` (otherwise AG Grid logs a warning).

#### Without `<premium-grid>`

```javascript
PremiumDataGrid.render('#grid-host', {
    columns: [{ field: 'name', headerName: 'Name', minWidth: 160 }],
    rowData: [{ id: 1, name: 'Test' }]
});
```

---

### 7.10 Chart cards & card loading

> **Full reference:** [ComponentGuid/dashboard-cards.md](../ComponentGuid/dashboard-cards.md)

For **Dashboard**-style pages.

**Load:**

```html
<script src="../Config/cdn/chart.umd.min.js"></script>
<script src="../UI_Components/cards/bar-graph-card.js"></script>
<script src="../UI_Components/cards/pie-graph-card.js"></script>
<script src="../UI_Components/cards/doughnut-graph-card.js"></script>
<script src="../UI_Components/cards/modal-grid-card.js"></script>
<script src="../UI_Components/grids/modal-grid.js"></script>
```

**HTML:**

```html
<premium-bar-graph-card id="chart-volume" title="Volume" chart-height="280"></premium-bar-graph-card>
<premium-pie-graph-card id="chart-priority" title="Priority"></premium-pie-graph-card>
<premium-modal-grid-card id="recent-grid" title="Recent tasks" grid-height="320"></premium-modal-grid-card>
```

**jQuery — loading all cards during API fetch:**

```javascript
function setAllCardsLoading(isLoading) {
    $.each(['#chart-volume', '#chart-priority', '#recent-grid'], function (i, sel) {
        var card = $(sel).get(0);
        if (card && card.setLoading) {
            card.setLoading(isLoading, 'Loading dashboard…');
        }
    });
}

function updateBarChart(labels, values) {
    var card = $('#chart-volume').get(0);
    if (!card) return;
    card.setOptions({
        labels: labels,
        data: values,
        datasetLabel: 'Tasks',
        subtitleHtml: 'Last 7 days'
    });
    if (card.updateData) {
        card.updateData({ labels: labels, data: values });
    }
}
```

**Elements:** `premium-bar-graph-card`, `premium-pie-graph-card`, `premium-doughnut-graph-card`, `premium-modal-grid-card`  
**Common methods:** `setOptions`, `setLoading(active, message)`, `updateData` (charts), `setRowData` (grid card)

---

### 7.11 Select2 (optional)

> **Full reference:** [ComponentGuid/select2-field.md](../ComponentGuid/select2-field.md)

Load **after jQuery**: `select2.min.css`, `select2.full.min.js`, then **`forms/select2-field.js`**.

```html
<link rel="stylesheet" href="../Config/cdn/select2.min.css">
<script src="../Config/cdn/select2.full.min.js"></script>
<script src="../UI_Components/forms/select2-field.js"></script>
```

**Declarative** — add `data-premium-select2` on `<select>` (auto-inits via `PremiumInputStyles.applyModal` / `applyByDataAttr`):

| `data-premium-select2` | Behaviour |
|------------------------|-----------|
| `search` | Searchable dropdown (aliases: `normal`, `searchable`) |
| `no-search` | No search box (aliases: `without-search`) |
| `multiple` | Multi-select with checkboxes, **Select all** / **Clear**, closed label **"N Selected"**, scrollable list |

Optional: `data-premium-select2-placeholder`, `data-premium-select2-dropdown-parent="#overlay"`, `data-premium-select2-allow-clear="false"`.

```html
<select data-premium-input data-premium-select2="search" id="field-role" class="w-full">…</select>

<select data-premium-input data-premium-select2="no-search" id="field-type" class="w-full">…</select>

<select data-premium-input data-premium-select2="multiple" id="field-tags" class="w-full" multiple>…</select>
```

**Programmatic** (e.g. after modal open):

```javascript
function initSelect2InModal($select, modal) {
    PremiumSelect2.destroy($select[0]);
    PremiumSelect2.init($select[0], {
        mode: 'search',
        dropdownParent: PremiumSelect2.dropdownParentFromModal(modal)
    });
}

// On modal close:
PremiumSelect2.destroy($('#field-role')[0]);
```

| API | Purpose |
|-----|---------|
| `PremiumSelect2.init(el, { mode, dropdownParent, scope })` | Init one select |
| `PremiumSelect2.destroy(el)` | Destroy one |
| `PremiumSelect2.initInScope(modalBody)` | All `select[data-premium-select2]` in scope |
| `PremiumSelect2.destroyInScope(modalBody)` | Destroy all in scope |
| `PremiumSelect2.dropdownParentFromModal(modal)` | Modal overlay for `dropdownParent` |

Styling matches premium inputs via `Config/style/global.css` + injected rules in `select2-field.js`.

Error **`select2 is not a function`** → Select2 CDN missing or loaded before jQuery.

---

## 8. Full minimal example

Single-file pattern you can paste and rename IDs.

```html
<!-- In main-canvas -->
<div id="kpi-container"></div>
<premium-button button-id="btn-add-record" icon="plus-circle" label="Add" class="hidden"></premium-button>
<premium-grid id="page-grid" class="w-full flex-1 min-h-0"></premium-grid>

<premium-popup-modal id="main-modal" data-width="520px">
    <template data-modal-body>
        <form data-premium-input-scope onsubmit="return false;">
            <label data-premium-label for="field-name">Name</label>
            <input data-premium-input id="field-name" type="text" required />
        </form>
    </template>
</premium-popup-modal>

<script>
    var recordList = [];
    var pageGridApi;
    var modalMode = 'add';
    var editingRecord = null;
    var mainModal = null;

    function findById(id) {
        var i;
        for (i = 0; i < recordList.length; i++) {
            if (String(recordList[i].id) === String(id)) return recordList[i];
        }
        return null;
    }

    function initKPIs() {
        KPIManager.render('#kpi-container', {
            cards: [{ id: 'total', label: 'Total', value: '0', icon: 'bi bi-list' }]
        });
    }

    function initPageGrid() {
        var grid = $('#page-grid').get(0);
        grid.setOptions({
            rowIdField: 'id',
            actionCallbacks: { view: 'onView', edit: 'onEdit', delete: 'onDelete' },
            columns: [{ field: 'name', headerName: 'Name', minWidth: 200 }],
            rowData: []
        });
        pageGridApi = grid.render();
        var $btn = $('premium-button[button-id="btn-add-record"]');
        $btn.removeClass('hidden');
        grid.getActionsSlot().appendChild($btn.get(0));
    }

    function loadRecords() {
        var grid = $('#page-grid').get(0);
        grid.setTableLoading(true);
        $.ajax({ url: '/api/demo/list', method: 'GET' })
            .done(function (json) {
                recordList = json.rows || [];
                grid.setRowData(recordList);
                KPIManager.setValue('total', String(recordList.length));
            })
            .always(function () {
                grid.setTableLoading(false);
            });
    }

    function openForAdd() {
        modalMode = 'add';
        editingRecord = null;
        mainModal.open({
            mode: 'add',
            title: 'Add',
            buttons: [{ label: 'Save', id: 'modal-submit-btn', type: 'primary', submit: true }]
        });
        $(mainModal.getBodyElement()).find('#field-name').val('');
        PremiumInputStyles.applyModal(mainModal.getBodyElement());
    }

    function openForView(record) {
        modalMode = 'view';
        editingRecord = record;
        mainModal.open({
            mode: 'view',
            title: 'View',
            buttons: [{ label: 'Close', id: 'modal-cancel-btn', type: 'secondary' }],
            freezeInputs: true,
            freezeMode: 'readonly'
        });
        $(mainModal.getBodyElement()).find('#field-name').val(record.name || '');
        PremiumInputStyles.applyModal(mainModal.getBodyElement());
    }

    function openForEdit(record) {
        modalMode = 'edit';
        editingRecord = record;
        mainModal.open({
            mode: 'edit',
            title: 'Edit',
            buttons: [{ label: 'Update', id: 'modal-submit-btn', type: 'primary', submit: true }],
            freezeInputs: false
        });
        $(mainModal.getBodyElement()).find('#field-name').val(record.name || '');
        PremiumInputStyles.applyModal(mainModal.getBodyElement());
    }

    window.onView = function (id) {
        var row = findById(id);
        if (row) openForView(row);
    };

    window.onEdit = function (id) {
        var row = findById(id);
        if (row) openForEdit(row);
    };

    window.onDelete = function (id) { /* Swal + $.ajax DELETE */ };

    $(function () {
        mainModal = $('#main-modal').get(0);
        mainModal.setOnSave(function () {
            if (modalMode === 'view') return;
            var name = $(mainModal.getBodyElement()).find('#field-name').val();
            var payload = { name: name };
            if (modalMode === 'edit' && editingRecord) {
                payload.id = editingRecord.id;
            }
            $.ajax({
                url: '/api/demo/save',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(payload)
            }).done(function () {
                mainModal.close();
                editingRecord = null;
                modalMode = 'add';
                loadRecords();
            });
        });

        mainModal.setOnClose(function () {
            editingRecord = null;
            modalMode = 'add';
        });

        NavigationManager.init(undefined, { useMainNavRail: false });
        $('premium-button[button-id="btn-add-record"]').on('click', openForAdd);
        initKPIs();
        initPageGrid();
        loadRecords();
    });
</script>
```

---

## 9. Quick lookup table

| I need… | File | jQuery / DOM entry |
|---------|------|---------------------|
| Page transition loader | `feedback/loading-overlay.js` | `LoadingOverlay.show()` |
| Sidebar / nav | `layout/navigation.js` | `NavigationManager.init()` |
| KPI row | `widgets/kpi-manager.js` | `KPIManager.render('#kpi-container', …)` |
| Form look & feel | `forms/input-field.js` | `PremiumInputStyles.applyModal(body)` |
| Toolbar button | `forms/ui-button.js` | `$('premium-button[button-id="btn-add-record"]').on('click', …)` |
| Add/Edit dialog | `modals/popup-modal.js` | `$('#main-modal').get(0).open({ mode: 'add' })` |
| Tabs in dialog | `modals/modal-tabs.js` | `$('#tabs').get(0).setItems(…); tabs.render()` |
| Grid in dialog | `grids/modal-grid.js` | `$('#x').get(0).setOptions(…); grid.render()` |
| Main table | `grids/data-grid.js` | `$('#page-grid').get(0).setOptions(…); grid.render()` |
| Chart panel | `cards/*-graph-card.js` | `$('#chart').get(0).setOptions(…)` |
| Card spinner | Built into `cards/*-card.js` | `card.setLoading(true, 'Loading…')` |

**Reference implementation:** [`NewDesign/Task/Groups.html`](../Task/Groups.html)

---

*Guide version: UI_Components folder layout as used by Task module pages.*
