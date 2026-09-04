/**
 * Premium Modal Grid — AG Grid wrapper for popup modals & tab panels.
 *
 * Feature-parity with data-grid.js: S.No column, Activity buttons (view/edit/delete),
 * row actions, loading overlay — all controlled via setOptions() parameters.
 *
 * Usage (HTML):
 *   <premium-modal-grid id="contacts-grid" data-show-sino="true" data-show-actions="true"></premium-modal-grid>
 *
 * Usage (JS):
 *   const grid = document.getElementById('contacts-grid');
 *   grid.setOptions({
 *       showSINO: true,
 *       showActions: true,
 *       rowIdField: 'id',
 *       actionCallbacks: { edit: editContact, delete: deleteContact },
 *       columns: [
 *           { field: 'name', headerName: 'Name', flex: 1 },
 *           { field: 'phone', headerName: 'Phone No', width: 130 }
 *       ],
 *       rowData: []
 *   });
 *   grid.render();
 */
(function (global) {
    'use strict';

    // ─────────────────────────────────────────────────────────────────
    // STYLES
    // ─────────────────────────────────────────────────────────────────
    var MODAL_GRID_STYLE_ID = 'premium-modal-grid-styles';

    var MODAL_GRID_CSS = [
        '.pmg-wrap .ag-theme-quartz {',
        "  --ag-font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif;",
        '  --ag-font-size: 12px;',
        '}',
        /* Loading overlay */
        '@keyframes pmg-spin { to { transform: rotate(360deg); } }',
        '.pmg-loading-overlay {',
        '  position: absolute; inset: 0; z-index: 30;',
        '  display: none; align-items: center; justify-content: center;',
        '  flex-direction: column; gap: 0.5rem;',
        '  background: rgba(255,255,255,0.82); backdrop-filter: blur(4px);',
        '}',
        '.pmg-loading-overlay.is-active { display: flex; }',
        '.pmg-loading-spinner {',
        '  width: 24px; height: 24px; border-radius: 9999px;',
        "  border: 2px solid rgba(13,148,136,.2); border-top-color: rgb(13,148,136);",
        '  animation: pmg-spin 0.65s linear infinite;',
        '}',
        '.pmg-loading-label { font-size: 0.7rem; font-weight: 600; color: #64748b; letter-spacing: .03em; }',
        /* Action buttons */
        '.pmg-action-btn { display: inline-flex; align-items: center; justify-content: center;',
        '  background: none; border: none; padding: 3px 5px; border-radius: 6px; cursor: pointer;',
        '  color: #6b7280; font-size: 14px; transition: color .15s, background .15s; }',
        '.pmg-action-btn:hover { background: #f3f4f6; color: #111827; }'
    ].join('\n');

    function injectStylesOnce() {
        if (typeof document === 'undefined' || document.getElementById(MODAL_GRID_STYLE_ID)) return;
        var st = document.createElement('style');
        st.id = MODAL_GRID_STYLE_ID;
        st.textContent = MODAL_GRID_CSS;
        (document.head || document.documentElement).appendChild(st);
    }

    // ─────────────────────────────────────────────────────────────────
    // DEFAULTS
    // ─────────────────────────────────────────────────────────────────
    var DEFAULTS = {
        columns: [],
        rowData: [],
        rowHeight: 44,
        headerHeight: 44,
        floatingFilter: false,
        showSINO: false,
        showActions: false,
        rowIdField: 'id',
        actionCallbacks: { view: null, edit: null, delete: null },
        isActionVisible: null,
        onActionClick: null,
        gridOptions: null
    };

    // ─────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────
    function parseBool(v) {
        return v === true || v === 'true' || v === '1' || v === '';
    }

    function resolveCallback(ref) {
        if (typeof ref === 'function') return ref;
        if (typeof ref === 'string' && ref && typeof global[ref] === 'function') return global[ref];
        return null;
    }

    function createInvokeAction(opts) {
        return function (actionKey, id, rowData, params) {
            var callbacks = opts.actionCallbacks || {};
            var fn = resolveCallback(callbacks[actionKey]);
            if (fn) {
                try { fn(id, rowData, params); } catch (e) { console.error('ModalGrid action error:', e); }
            }
            if (typeof opts.onActionClick === 'function') {
                try { opts.onActionClick({ action: actionKey, rowId: id, rowData: rowData }); } catch (e) { }
            }
        };
    }

    function buildColumnDefs(opts, invokeAction) {
        var columns = [];
        var idField = opts.rowIdField || DEFAULTS.rowIdField;

        // ── S.No column ──
        if (parseBool(opts.showSINO)) {
            columns.push({
                field: 'sino',
                headerName: 'S.No',
                width: 70,
                minWidth: 60,
                maxWidth: 90,
                sortable: false,
                filter: false,
                resizable: false,
                suppressSizeToFit: true,
                cellRenderer: function (p) {
                    return '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:12px;color:#9ca3af;font-weight:600;">' + (p.node.rowIndex + 1) + '</div>';
                }
            });
        }

        // ── Data columns ──
        (opts.columns || []).forEach(function (col) {
            var c = Object.assign({}, col);
            if (c.filter == null) c.filter = false;
            if (c.sortable == null) c.sortable = true;
            if (c.resizable == null) c.resizable = true;
            columns.push(c);
        });

        // ── Activity column ──
        if (parseBool(opts.showActions)) {
            var callbacks = opts.actionCallbacks || {};
            var viewCb = callbacks.hasOwnProperty('view') ? callbacks.view : null;
            var editCb = callbacks.hasOwnProperty('edit') ? callbacks.edit : null;
            var deleteCb = callbacks.hasOwnProperty('delete') ? callbacks.delete : null;

            columns.push({
                field: '_activity',
                headerName: 'Activity',
                width: 100,
                minWidth: 80,
                maxWidth: 120,
                sortable: false,
                filter: false,
                resizable: false,
                suppressSizeToFit: true,
                cellRenderer: function (p) {
                    var idVal = p.data && p.data[idField] != null ? p.data[idField] : '';
                    var isVis = typeof opts.isActionVisible === 'function' ? opts.isActionVisible : function () { return true; };
                    var wrap = document.createElement('div');
                    wrap.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:2px;height:100%;';

                    function addBtn(key, icon, title) {
                        if (!isVis(key, p.data)) return;
                        var btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'pmg-action-btn';
                        btn.title = title;
                        btn.innerHTML = '<i class="bi ' + icon + '"></i>';
                        btn.addEventListener('click', function (e) {
                            e.preventDefault(); e.stopPropagation();
                            invokeAction(key, idVal, p.data, p);
                        });
                        wrap.appendChild(btn);
                    }

                    if (viewCb) addBtn('view', 'bi-eye', 'View');
                    if (editCb) addBtn('edit', 'bi-pencil-square', 'Edit');
                    if (deleteCb) addBtn('delete', 'bi-trash3', 'Delete');
                    return wrap;
                }
            });
        }

        return columns;
    }

    // ─────────────────────────────────────────────────────────────────
    // CUSTOM ELEMENT
    // ─────────────────────────────────────────────────────────────────
    class PremiumModalGrid extends HTMLElement {

        static get observedAttributes() {
            return ['data-show-sino', 'data-show-actions', 'data-row-id-field', 'data-row-height', 'data-floating-filter'];
        }

        constructor() {
            super();
            this._api = null;
            this._options = Object.assign({}, DEFAULTS);
            this._loadingOverlayEl = null;
        }

        connectedCallback() {
            this.style.display = 'block';
            this.style.width = '100%';
            if (!this.style.height) this.style.height = '250px';

            // Sync HTML attributes → options (if set before setOptions is called)
            this._syncAttributes();
        }

        attributeChangedCallback() {
            this._syncAttributes();
        }

        _syncAttributes() {
            var map = {
                'data-show-sino': 'showSINO',
                'data-show-actions': 'showActions',
                'data-row-id-field': 'rowIdField',
                'data-row-height': 'rowHeight',
                'data-floating-filter': 'floatingFilter'
            };
            var self = this;
            Object.keys(map).forEach(function (attr) {
                var val = self.getAttribute(attr);
                if (val !== null) self._options[map[attr]] = parseBool(val) || val;
            });
        }

        /** Merge user options before calling render(). */
        setOptions(options) {
            this._options = Object.assign({}, this._options, options || {});
        }

        /** Build and mount the AG Grid. Call after setOptions(). */
        render() {
            injectStylesOnce();

            if (this._api && this._api.destroy) {
                this._api.destroy();
                this._api = null;
            }

            var opts = this._options;
            var gridId = 'pmg-' + Math.random().toString(36).slice(2, 9);

            // Outer wrapper
            var wrap = document.createElement('div');
            wrap.className = 'pmg-wrap';
            wrap.style.cssText = 'width:100%;height:100%;position:relative;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;';

            // AG Grid host
            var gridDiv = document.createElement('div');
            gridDiv.id = gridId;
            gridDiv.className = 'ag-theme-quartz';
            gridDiv.style.cssText = 'width:100%;height:100%;';
            gridDiv.setAttribute('data-lenis-prevent', '');

            // Loading overlay
            var loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'pmg-loading-overlay';
            loadingOverlay.innerHTML =
                '<div class="pmg-loading-spinner" aria-hidden="true"></div>' +
                '<span class="pmg-loading-label" data-pmg-loading-label>Loading…</span>';

            wrap.appendChild(gridDiv);
            wrap.appendChild(loadingOverlay);

            this.innerHTML = '';
            this.appendChild(wrap);
            this._loadingOverlayEl = loadingOverlay;

            // Build column defs
            var invokeAction = createInvokeAction(opts);
            var columnDefs = buildColumnDefs(opts, invokeAction);

            var useFloatingFilter = parseBool(opts.floatingFilter);

            var gridOptions = {
                columnDefs: columnDefs,
                rowData: opts.rowData || [],
                rowHeight: opts.rowHeight || DEFAULTS.rowHeight,
                headerHeight: opts.headerHeight || DEFAULTS.headerHeight,
                defaultColDef: {
                    sortable: true,
                    filter: false,
                    resizable: true,
                    floatingFilter: useFloatingFilter
                },
                suppressPaginationPanel: true,
                domLayout: 'normal',
                suppressCellFocus: true,
                animateRows: false
            };

            if (typeof opts.getRowStyle === 'function') {
                gridOptions.getRowStyle = opts.getRowStyle;
            }
            if (opts.rowClassRules && typeof opts.rowClassRules === 'object') {
                gridOptions.rowClassRules = opts.rowClassRules;
            }
            if (opts.gridOptions && typeof opts.gridOptions === 'object') {
                Object.assign(gridOptions, opts.gridOptions);
            }

            if (typeof agGrid === 'undefined') {
                console.error('PremiumModalGrid: ag-grid-community is required.');
                return null;
            }

            this._api = agGrid.createGrid(gridDiv, gridOptions);
            return this._api;
        }

        // ── Public API ──────────────────────────────────────────────

        getApi() { return this._api; }

        setRowData(rowData) {
            if (this._api) {
                this._api.setGridOption('rowData', rowData || []);
            }
        }

        setLoading(active, message) {
            if (!this._loadingOverlayEl) return;
            if (message != null) {
                var label = this._loadingOverlayEl.querySelector('[data-pmg-loading-label]');
                if (label) label.textContent = String(message);
            }
            if (active) {
                this._loadingOverlayEl.classList.add('is-active');
            } else {
                this._loadingOverlayEl.classList.remove('is-active');
            }
        }

        /** Refresh columns (e.g., after changing showActions). */
        refreshColumns() {
            if (!this._api) return;
            var invokeAction = createInvokeAction(this._options);
            this._api.setGridOption('columnDefs', buildColumnDefs(this._options, invokeAction));
        }
    }

    if (typeof window !== 'undefined' && window.customElements && !window.customElements.get('premium-modal-grid')) {
        window.customElements.define('premium-modal-grid', PremiumModalGrid);
    }

})(typeof window !== 'undefined' ? window : this);
