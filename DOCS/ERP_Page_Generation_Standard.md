# ERP Page Generation & Conversion Standard

**Purpose.** Define the single, mandatory way to (A) produce a **new** ERP page and
(B) **convert an old-platform page** into the new structured pattern — so that every page,
however it was made, comes out structurally identical.

**The one rule behind everything here:**

> ❗ **Never write a page from scratch, and never edit an old file in place.
> Always clone the matching *new* reference file, then fill it with the module's data and
> delete what doesn't apply.**

- **New page** → clone the reference, fill from a spec.
- **Convert old page** → clone the reference, fill from *the old file* (which becomes your
  data source, not your starting text).

Both are the same predictable operation: *clone the target skeleton, port the specifics in.*

## 0. HOW to clone (read this first — it is the #1 reason output drifts)

"Clone the reference" means **start from the reference file's literal text and edit it** — not
"produce a new file that matches the reference's description." A model given only this document
will rebuild the *structure* but lose fine texture (comment density, exact idioms, numbering),
which is exactly the "no comments / doesn't look like the pattern" failure.

**Non-negotiable process, every time:**

1. **Physically supply the reference file's full source** to the generator in the same request
   (paste the entire `AccountMaster.html` or `PurchaseOrder.html`). The reference is the
   starting material; this document only says what to change.
2. Instruct it to **edit that text in place** — keep every line unless a rule below says to
   change or delete it. The converted file should read as a **diff** of the reference: only the
   VARIABLE slots (§A4) differ.
3. For an old→new conversion, **also supply the old file** as the data source (§B4). So the
   request contains *two* files: the new reference (skeleton to edit) + the old file (facts to
   port). Never the old file alone.

If you cannot attach files, the output will approximate the pattern at best. Attaching the
reference is worth more than any amount of prose in this document.

---

# PART A — The New Standard (the target)

## A1. The three page types

All types share **the same 8-section script skeleton**. Type‑1 and Type‑2 also share the same
page shell and differ only in the record-form modal and save complexity. **Type‑3 (Report)** is
read-only and uses a different shell (no KPI, no record modal) — see §A7.

| | **Type‑1 — Master** | **Type‑2 — Transaction** | **Type‑3 — Report / Ledger** |
|---|---|---|---|
| Reference file | `AccountMaster.html` / `SecondaryGroupHeads.html` | `PurchaseOrder.html` / `GRN.html` | `CashBook.html` / `BankBook.html` / `GeneralLedger.html` |
| Record form | `premium-popup-modal` | `premium-fullscreen-popup-modal` | none (read-only) |
| Child rows | none | `premium-modal-tabs` + `premium-modal-grid` | none |
| Data flow | fetch list → grid; create/edit via modal | header + detail (+ terms) | filter (account + date range) → fetch → grid |
| Writes | single POST (`Insert`/`Update`) | header POST → `mTransNo` → detail/term POSTs | **none** — view + export only |
| Distinctive UI | KPI + add/edit/delete modal | fullscreen modal, tabs, sub-grids | Back header, collapsible filter panel, Excel/PDF/CSV export |
| Use for | flat reference/lookup data | header + repeating child tables | viewing/exporting existing transactions |

**Choosing:** flat form, no repeating rows → **Type‑1**. Header + one or more repeating child
tables → **Type‑2**. Read-only view of existing data with a filter and export, no create/edit
→ **Type‑3**.

## A2. The universal skeleton

Every page is exactly these blocks, in order. The banner comments stay even when a section is
empty. (Type‑3 typically leaves sections 2–4 as banner-only.)

```
<head>  DEPENDENCIES · UI COMPONENTS
<body>  PAGE SHELL   (Type‑1/2: sidebar / topbar / main-canvas / bottom-nav
                      Type‑3: sub-header + filter panel + grid — see §A7)
          KPI Manager · Premium Grid (+ toolbar) · Record Modal(s)   (Type‑1/2 only)
  <script>
    SECTION 1 — CONSTANTS
    SECTION 2 — STATE
    SECTION 3 — DATA
    SECTION 4 — UI HELPERS
    SECTION 5 — FEATURE LOGIC
    SECTION 6 — COMPONENTS
    SECTION 7 — EVENTS
    SECTION 8 — INIT
```

Top-of-script banner (change only the module name / type line):

```js
// ╔══════════════════════════════════════════════════════════════════╗
// ║ <Module Name>                                                     ║
// ║ Type-1 module using AccountMaster-style structure.               ║   // or Type-2 / Type-3
// ╚══════════════════════════════════════════════════════════════════╝
//  SECTIONS:  1-CONSTANTS  2-STATE  3-DATA  4-UI HELPERS
//             5-FEATURE LOGIC  6-COMPONENTS  7-EVENTS  8-INIT
```

## A3. INVARIANT — copy byte-for-byte, never change

- **Dependency block & order.** Common: `tailwindcss_3_4_17` → `bootstrap-icons` → fonts →
  `global.css` → `gsap` → `loading-overlay` → `jquery` → `session.js` (loaded right after jQuery) → `navigation` →
  `kpi-manager` → `ag-grid` → `select2` css+js → `sweetalert2` → `ui-button` → `input-field` →
  `select2-field` → `popup-modal` → `data-grid`. **Type‑2 adds** `modal-grid.js` +
  `modal-tabs.js` (before `popup-modal.js`) and `full-screen-popup-modal.js` (after it). Do
  not reorder, re-path, or upgrade versions. **Type‑3 differs:** it **omits** `kpi-manager.js`,
  `modal-grid.js`, `modal-tabs.js`, and `full-screen-popup-modal.js`, keeps `popup-modal.js` +
  `data-grid.js`, and **adds** three export libraries after `data-grid.js`:
  `xlsx@0.18.5`, `jspdf@2.5.1`, `jspdf-autotable@3.5.25`.
- **Page shell containers (Type‑1/2):** `sidebar-container`, `top-nav-container`, `main-canvas`,
  `kpiManager` (`<premium-kpi-manager>`), `bottom-nav-container`. **Type‑3 uses a different
  shell — see §A7.**
- **`<premium-grid>` tag** — copy whole; only `data-row-id-field` changes.
- **Section 1 CONSTANTS** — copy exactly (modified for dynamic, token-based sessions via `session.js`):
  ```js
  if (!localStorage.getItem('TokenNo')) {
      window.location.href = '../CommonPages/login.html'; // path walked up to root
  }

  const DomainName = window.DomainName || '';
  let UserNo = 0;
  let mSubscID = 0;
  let mUserType = '';

  // Asynchronously load the user information from the shared session component
  function fetchAndSetUserInfo() {
      return window.loadUserInfo().then(function (userData) {
          if (userData) {
              UserNo = Number(userData.mTransNo);
              mSubscID = Number(userData.subscID);
              mUserType = userData.userType || '';
          }
      });
  }
  ```
- **Project conventions** used in every fetch/save:
  - **Authenticated Requests**: Use the custom `authenticatedFetch` utility rather than raw `fetch()` to carry the authorization headers:
    ```js
    function authenticatedFetch(url, options) {
        options = options || {};
        options.headers = options.headers || {};
        var token = localStorage.getItem('TokenNo') || '';
        if (token) {
            options.headers['X-Token'] = token;
        }
        return fetch(url, options);
    }
    ```
  - List unwrap: `var list = Array.isArray(data) ? data : (data.data || data.Data || []);`
  - Save response: text; `var trans = String(result||'').split('^');` new id = `Number(trans[1])`;
    `<= 0` = failure → `Swal.fire('Error', result, 'error')`.
  - Payload `status`: `'Insert'` (new) / `'Update'` (existing).
  - Success toast: `Swal.fire({ title:'Success!', text:'…', icon:'success', confirmButtonColor:'#10b981', heightAuto:false })`.
  - Status display: `lockStatus === 'Y' ? 'Active' : 'Inactive'`.
  - Modal API: `modal.open({ mode, title, subtitle, onSubmit })`, `modal.setLoading(true,'…')`, `modal.close()`.
  - Select2: `PremiumSelect2.init(el, { dropdownParent: PremiumSelect2.dropdownParentFromModal(modal), … })`,
    guarded by `if (!$(el).hasClass('select2-hidden-accessible'))`.
  - After save: `premiumGrid.loadFromEndpoint()` + `window.updateDashboardKPIs()`.
  - **Ready block wrapping**: Initialization functions (e.g. `renderComponents()`, `bindEvents()`) must be wrapped within the resolution callback of `fetchAndSetUserInfo()`:
    ```js
    $(document).ready(function () {
        fetchAndSetUserInfo().then(function () {
            renderComponents();
            bindEvents();
        });
    });
    ```
- **Comment convention (this was the missing rule).** The reference files are densely
  commented and the converted file must match that density — this is what makes a file "look
  like the pattern." Specifically:
  - Every section keeps its full banner (`// ─────`  +  `// SECTION n — NAME`  +  `// ─────`).
  - **Every numbered function has a heading *and* a one-line description directly under it:**
    ```js
    // 5.1 — Load Lookup Data
    // Fetches supplier, item, and currency dropdown data used by the purchase order modals.
    function loadLookupData() { … }
    ```
    A heading with no description line is a defect. Rewrite the description to fit the new
    module; do not just copy the reference's wording.
  - Keep the reference's inline explanatory comments (the short `// why this line exists`
    notes inside functions). Port them to the new logic; don't strip them.
- **Contiguous numbering.** When you delete a function, **renumber** so subsections stay
  sequential (`5.1, 5.2, 5.3 …`). Gaps like `5.7 → 5.9` mean functions were dropped without
  renumbering — not allowed.

## A4. VARIABLE — change per module

`<title>` · grid `data-row-id-field` · toolbar button ids (`add-<module>-btn`) · modal id
(`<module>-modal`) · form id (`<module>-form`) · form fields · API controller path
(`/api/<Controller>/...`) · KPI cards · grid columns · function names (`load<Module>IntoGrid`).
**Type‑2 also:** tabs, each tab's modal-grid columns, child popup-modal forms, summary field
ids, detail/term endpoints.
**Type‑3 also:** `<title>` + sub-header title/subtitle · `back-btn` target URL · account-select
`endpoint` (+ `PayMode` / `mapItem`) · report API URL · grid columns · export filename prefix,
sheet name, and PDF heading.

## A5. DELETE — remove cleanly when not needed

Filter modal + `filter-btn` + `applyFilter` + `parseDateOnly` (present in `AccountMaster`,
absent in `OtherMaster`) · delete action (replace with "Deletion Restricted" toast if
restricted — see `OtherMaster` §5.3) · Type‑2 tabs you don't use (`GRN` has items only, no
terms) · `printRecord` · unused lookups in `loadLookupData`.
> After any deletion, search the file for the removed id/function — **zero** references may remain.

## A6. Required FEATURE LOGIC per type

**Type‑1:** `viewRecord` · `editRecord` · `deleteRecord` · `load<Module>IntoGrid` ·
`initSelect2ForModal` · (opt) `parseDateOnly` + `applyFilter`.

**Type‑2:** `loadLookupData` · `loadRecordsIntoGrid` · `getMaxNo` · `loadRecordDetails` ·
`initSelect2ForModal` · `populateModal` · `openItemModal` · (opt) `openTermModal` ·
`renderItemRows` · (opt) `renderTermRows` · `updateSummaryTotals` · `calculateItemModalTotal` ·
`saveRecord` · `viewRecord` · `editRecord` · `deleteRecord` · (opt) `printRecord`.

**Type‑3:** `fetchReportData` · `formatCustomDate` · `renderComponents` (nav + grid columns) ·
`initFilterSelect2` · `bindEvents` · `toggleFilterPanel` · `handleExportExcel` ·
`handleExportCSV` · `handleExportPDF`. No save/edit/delete.

**Init differs:** Type‑1 → `$(document).ready(() => { renderComponents(); bindEvents(); })`.
Type‑2 → `DOMContentLoaded` → `loadLookupData().then(() => { renderComponents(); bindEvents(); window.updateDashboardKPIs(); })`.
Type‑3 → `$(document).ready(() => { renderComponents(); PremiumInputStyles.applyByDataAttr(); initFilterSelect2(); `*set default dates last-month→today*`; bindEvents(); fetchReportData(); })` — i.e. it **auto-loads** the default report on open.

## A7. Type‑3 (Report / Ledger) specifics

Type‑3 diverges enough that its shell and conventions live here. Clone `CashBook.html` (single
filter account) or `GeneralLedger.html` (all accounts) as the reference.

**Shell (replaces the Type‑1/2 shell):**
- `<body class="w-screen h-screen overflow-hidden flex flex-col …">`.
- **Sub-header bar:** logo image + vertical divider + `<h1>` title + `<p>` subtitle on the left;
  a `<premium-button id="back-btn" variant="outline">` on the right that navigates to the parent
  page (e.g. `../Accounts/AccountBooks.html`).
- `<main class="flex-1 …">` containing, in order:
  - **Collapsible filter panel** `#filter-panel` (animated via inline `max-height`, starts `0px`)
    with `#filter-form` → account `<select id="account-name">`, `#from-date`, `#to-date`
    (both `data-premium-date="forward-block" required`), and `#apply-filter-btn`.
  - `<premium-grid id="premiumGrid" data-show-actions="false" …>` whose `slot="actions"` holds
    the toolbar: `#filter-btn` (toggles the panel) + `#export-excel-btn` + `#export-pdf-btn` +
    `#export-csv-btn`.
- `renderComponents()` still calls `NavigationManager.init(undefined, { useMainNavRail: true })`
  even though there is no `sidebar-container` in the markup — keep this call.

**Invariant conventions (Type‑3):**
- **Filter → fetch:** `fetchReportData()` validates `#filter-form`, reads account + from/to,
  calls `toggleFilterPanel(false)`, `grid.setTableLoading(true, …)`, fetches the report URL,
  unwraps with the standard `Array.isArray(data) ? … : (data.data||data.Data||[])`, maps rows
  to the report shape, `grid.setRowData(...)`, sets `#filter-btn` active state, `.finally` clears
  loading. Store rows in `window.GlobalRecordList` (exports read from it).
- **Server-driven account select:** `PremiumSelect2.init(el, { endpoint: '…', mapItem: fn })`
  (guarded by `select2-hidden-accessible`) — not a static `options` array.
- **Default dates + auto-load:** on ready set from-date = today − 1 month, to-date = today, then
  call `fetchReportData()` so the page opens populated.
- **Exports:** all three guard on empty `GlobalRecordList` with a `Swal.fire('No Data', …, 'info')`;
  Excel via `XLSX.utils.json_to_sheet` → `XLSX.writeFile`; CSV via manual blob; PDF via
  `new jspdf.jsPDF('l','mm','a4')` + `doc.autoTable(...)`. Filename pattern:
  `<Report>_<AccountText || 'Report'>_<YYYY-MM-DD>.<ext>`; success shows a top-end toast.
- **Row rendering:** grid columns use `valueFormatter`/`valueGetter` with the `isNoteRow` guard
  and numeric columns `toFixed(2)`; keep that convention.

**Type‑3 DELETE list:** no KPI, no add/edit/delete/save, no record modal — remove any that a
clone dragged in. Drop an export button (CSV/PDF/Excel) only if that format isn't wanted, and
remove its handler + binding.

---

# PART B — Converting an OLD File to the New Standard

## B1. Mental model: two transformations, one method

An old-platform page differs from the new one on **two axes**:

1. **Platform** — different CDNs, component library, custom elements, and attribute names.
2. **Structure** — looser section layout (e.g. "API FUNCTIONS", "GLOBAL EVENT HANDLERS")
   instead of the canonical 8 sections.

Do **not** try to patch the old file into shape. **Clone the new reference file for the type,
then treat the old file purely as a source of business facts** to pour into the new skeleton.
This collapses both axes into the same clone-and-fill operation as a brand-new page.

## B2. Platform mapping (OLD → NEW)

Use this table to translate every old construct to its new equivalent.

| Concern | OLD (source platform) | NEW (target platform) |
|---|---|---|
| Tailwind | `@tailwindcss/browser@4` (remote) | `../../Config/cdn/tailwindcss_3_4_17.js` (local) |
| CDN libs | remote `jsdelivr` / `code.jquery` | local `../../Config/cdn/…` |
| Component folder | `../Common-Components/new_ui/Common-components/ui/` + `../Common-Components/Frontend-UI/` | `../../UI_Components/…` + `../../Config/…` |
| Nav / topbar / sidebar | ES-module `createTopbarHTML` / `createSidebarHTML` / `initTopbar` / `initSidebar` into `#components-container` | `navigation.js` + `NavigationManager.init(undefined, { useMainNavRail: true })` with `sidebar-container` / `top-nav-container` / `bottom-nav-container` |
| Body shell | `main-content > modalParent > popup-modal-host + main-container`, hand-built `<h1>` + search box | `main-canvas` with `<premium-kpi-manager>` + `<premium-grid>` |
| Main grid | `<ag-grid-table id=… data-grid-id=…>` | `<premium-grid id="premiumGrid" …>` |
| KPI | `kpi-cards.js` / custom styled `#…-kpis` block | `<premium-kpi-manager id="kpiManager">` + `kpi.setCards([…])` |
| Add button | `<ui-button button-id="add-trigger-btn" icon="bi bi-plus-lg" variant="primary"><span>Add</span></ui-button>` | `<premium-button id="add-<module>-btn" icon="bi-plus-circle" label="Add" variant="solid" …>` |
| Field label | `<label data-ui-label for="…">` | `<label data-premium-label>` |
| Field input | `<input data-ui-input data-ui-type="text" …>` | `<input data-premium-input …>` |
| Type‑1 modal | `PopupModal.render("#popup-modal-host", {…})` + `modal.open({…})`, form in `<template id="…-form-template">`, select2 mounted into container divs | `<premium-popup-modal id="<module>-modal">` with inline `<template data-modal-body><form>…</form></template>`; `modal.open({mode,title,subtitle,onSubmit})` |
| Type‑2 modal | `MainAreaModal.render("#main-area-host", {…})` + `modal.open({ title, bodyHtml: template.innerHTML })` | `<premium-fullscreen-popup-modal id="add-<module>-modal" data-title="…">` with inline template |
| Tabs | hand-built `.tab-btn` / `.tab-content` + manual toggle JS | `<premium-modal-tabs>` with `<template data-tab-id … data-tab-label …>` + `tab-shown` event |
| Sub-grids | `<ag-grid-table>` inside a tab | `<premium-modal-grid id="items-grid" data-row-id-field="_idx">` |
| Select2 | `Select2Field.render(container, {…})` into a container div | `PremiumSelect2.init(<select data-premium-input>, { dropdownParent: PremiumSelect2.dropdownParentFromModal(modal), … })` |
| Alerts | custom `showSwalError(title,msg)` / `showSwalToast(msg)` | direct `Swal.fire({…, confirmButtonColor:'#10b981', heightAuto:false })` |
| Constants | `DomainName = localStorage.getItem('Domain')` (no fallback), no login guard | `TokenNo` guard + dynamic `session.js` `loadUserInfo()` + variables defined as `let` (see A3) |

## B3. Structure mapping (OLD sections → NEW canonical 8)

| OLD section (varies) | NEW canonical section |
|---|---|
| CONSTANTS | 1 — CONSTANTS |
| STATE | 2 — STATE |
| API / API FUNCTIONS (lookup fetches) | 3 — DATA |
| API / API FUNCTIONS (list load, save, delete) | folded into 5 — FEATURE LOGIC |
| UI HELPERS | 4 — UI HELPERS |
| FEATURE LOGIC (SUB-MODALS & RENDERERS) | 5 — FEATURE LOGIC |
| GLOBAL EVENT HANDLERS | 7 — EVENTS (`bindEvents`) |
| COMPONENT RENDERERS & BINDINGS | 6 — COMPONENTS (`renderComponents`, `updateDashboardKPIs`) |
| INIT | 8 — INIT |

## B4. What to EXTRACT from the old file (the business facts)

These are the only things worth carrying over. Pull them out first, before touching the new
skeleton:

1. **Fields** — each form field's id, label, type, required flag, and any transform (e.g. the
   old title-case `oninput`). Re-express as new `data-premium-input` fields.
2. **API endpoints** — every URL: list, get-by-id, save, delete, lookups, get-max-no.
3. **Payload shapes** — exact property names/casing sent on save (header + detail + term).
4. **Grid columns** — field, header, width/flex, and any value formatters.
5. **KPI definitions** — labels + how each number is computed.
6. **Calculations** — item totals, discounts, tax, summary rollups, rounding.
7. **Business rules & edge cases** — e.g. old AccountMaster's "cannot modify/delete CUSTOMER
   or SUPPLIER accounts", restricted delete, duplicate-name checks, default currency.
8. **Feature set** — does it have search? date filter? print? terms tab? (drives §A5 deletes.)

> Ignore the old *plumbing* entirely (how it mounted the sidebar, how `PopupModal.render`
> worked, its custom Swal wrappers). Only the facts above survive.

## B5. Conversion procedure

1. **Classify** the old page as Type‑1, Type‑2, or Type‑3 (§A1).
2. **Extract** the business facts (§B4) into a short list.
3. **Clone** the matching *new* reference file (`AccountMaster.html`, `PurchaseOrder.html`, or
   `CashBook.html`) as the working file.
4. **Fill** the new skeleton's VARIABLE slots (§A4) using the extracted facts, translating any
   old construct through the platform map (§B2).
5. **Rewrite payloads** to the extracted shapes, but keep the invariant conventions (§A3):
   list unwrap, `^` split, `Insert`/`Update`, `#10b981` toast, grid reload + KPI refresh.
6. **Re-home the logic** into canonical sections per the structure map (§B3).
7. **Port edge cases** (§B4.7) into the relevant new functions (e.g. guard inside
   `editRecord`/`deleteRecord`).
8. **Delete** unused features (§A5) with no orphaned references.
9. **Verify** against the checklist (§B6).

## B6. Conversion acceptance checklist

- [ ] Output cloned from the correct **new** reference (not the old file edited in place).
- [ ] No old-platform artifacts remain: no `@tailwindcss/browser@4`, no `Common-Components/…`
      paths, no `ag-grid-table`, `main-area-modal`, `PopupModal.render`, `MainAreaModal.render`,
      `Select2Field.render`, `data-ui-*`, `#components-container`, `showSwalError/showSwalToast`.
- [ ] Dependency block + order match the new reference (Type‑2 has its 3 extra scripts).
- [ ] All five new page-shell container ids present; nav via `NavigationManager.init`.
- [ ] `<premium-grid>` copied whole; only `data-row-id-field` changed.
- [ ] Section 1 CONSTANTS copied verbatim (login guard + `|| ''` + destructure).
- [ ] All eight `SECTION n —` banners present, in order; old section names gone.
- [ ] Every field uses `data-premium-input` / `data-premium-label`; every dropdown uses
      `PremiumSelect2.init` with `dropdownParentFromModal` + the `select2-hidden-accessible` guard.
- [ ] **Every numbered function has a heading + one-line description; inline comments ported;
      subsection numbers contiguous (no gaps).**
- [ ] **Output reads as a diff of the reference — only VARIABLE slots differ.**
- [ ] All extracted endpoints, columns, KPIs, calculations, and edge cases carried over.
- [ ] Every fetch uses the §A3 conventions; after save → grid reload + KPI refresh.
- [ ] Type‑2 only: header save returns `mTransNo`, detail/term saves + deletes run after it;
      tabs use `<premium-modal-tabs>` + `tab-shown`; sub-grids use `<premium-modal-grid>`.
- [ ] Type‑3 only: uses the §A7 shell (Back header + collapsible filter panel + export toolbar),
      the three export libs, server-driven account select (`endpoint`/`mapItem`), default
      last-month→today dates, and auto-loads via `fetchReportData()` on ready. No KPI/modal/save.
- [ ] Deleted features leave zero orphaned ids / handlers / references.

---

# PART C — Reusable prompts

## C1. New page

> You are generating an ERP page. Do **not** invent structure — clone the new reference file
> for the type and follow `ERP_Page_Generation_Standard.md`. **The reference file is attached;
> start from its literal text and edit it in place** so the output reads as a diff of the
> reference (only VARIABLE slots differ), keeping banner comments, the one-line description
> under every numbered function, and inline comments (reworded for this module), with contiguous
> subsection numbering.
> - Type: **{Type‑1 | Type‑2 | Type‑3}** · Reference: **{AccountMaster.html | PurchaseOrder.html | CashBook.html}**
> - Module: **{…}** · PK field: **{…}** · Controller: **/api/{…}**
> - Fields (name, type, required): **{…}**
> - Type‑2 child tables (tab → columns): **{…}** · KPIs: **{…}** · Grid columns: **{…}**
> - Type‑3: back-btn target · account-select endpoint (+PayMode) · report API URL · columns · export names
> - Features to REMOVE: **{filter | delete | print | terms | an export format | …}**
>
> Keep everything marked INVARIANT byte-for-byte. Change only VARIABLE slots. Delete unused
> features with no orphaned references. Output the full file and confirm the §A checklist.

## C2. Convert old → new

> You are converting an OLD-platform ERP page to the new standard in
> `ERP_Page_Generation_Standard.md`. Two files are attached: the **new reference**
> (**{AccountMaster.html | PurchaseOrder.html | CashBook.html}**) and the **old file**. Work like this:
> 1. **Start from the new reference's literal text and edit it in place.** The result must read
>    as a diff of the reference — change only the VARIABLE slots (§A4), keep everything else,
>    including the banner comments, the one-line description under every numbered function, and
>    inline comments (rewrite their wording to fit this module). Renumber subsections so they
>    stay contiguous. Do **not** regenerate from your memory of the pattern.
> 2. Treat the **old file only as a source of business facts** (§B4): fields, endpoints,
>    payload shapes, grid columns, KPIs, calculations, business rules/edge cases, feature set.
> 3. Delete features the module doesn't use; keep all INVARIANT conventions.
>
> Output the full converted file and confirm every item of the §B6 conversion checklist,
> explicitly listing which business facts you carried over and which old features you dropped.
