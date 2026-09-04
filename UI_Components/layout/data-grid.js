/**
 * Premium Data Grid — NewDesign shell (toolbar) + feature parity with Common-components/ui/ag-grid-table.js.
 *
 * The UI structure is fixed: .premium-grid-wrapper > .table-controls (search, sort, actions slot) + #grid (default ag-theme-quartz).
 * All ag-grid-table.js behaviors (column building, actions, API surface) match the common module.
 * 
 * Usage:
 *  <premium-grid id="my-table" data-show-sino="true"></premium-grid>
 *  table.setOptions({ columns: [...], rowData: [...] });
 *  table.render();
 *  table.setTableLoading(true, 'Loading…'); // optional overlay over the grid until data is ready
 *
 * Programmatic (same as AGGridTable.render): PremiumDataGrid.render('#host', { ... });
 */

(function (global) {
    'use strict';

    const PREMIUM_GRID_STYLES_ID = 'premium-grid-styles';

    const PREMIUM_GRID_FONT_FAMILY = "'DM Sans', ui-sans-serif, system-ui, sans-serif";
    const PREMIUM_GRID_COLUMN_BORDER = '#e5e7eb';
    /** Matches sidebar active nav option (Tailwind bg-gray-200). */
    const PREMIUM_GRID_HEADER_BG = '#e5e7eb';
    const PREMIUM_GRID_HEADER_FG = '#1f2937';

    const PREMIUM_GRID_STYLES_CSS = `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
        .premium-grid-wrapper,
        .premium-grid-wrapper .table-controls {
            font-family: ${PREMIUM_GRID_FONT_FAMILY};
        }
        .premium-grid-wrapper .ag-theme-quartz {
            --ag-font-family: ${PREMIUM_GRID_FONT_FAMILY};
            --ag-header-background-color: ${PREMIUM_GRID_HEADER_BG};
            --ag-header-foreground-color: ${PREMIUM_GRID_HEADER_FG};
            --ag-row-border-width: 0;
            --ag-row-border-color: transparent;
            --ag-cell-horizontal-border: solid transparent;
            --ag-header-column-separator-display: none;
            --ag-header-column-resize-handle-display: none;
        }
        .premium-grid-wrapper .ag-header-cell-resize::after {
            display: none !important;
            background: transparent !important;
        }
        .premium-grid-wrapper .ag-row {
            border-top-width: 0 !important;
            border-bottom-width: 0 !important;
        }
        .premium-grid-wrapper .ag-ltr .ag-header-cell,
        .premium-grid-wrapper .ag-ltr .ag-header-group-cell {
            border-right: none !important;
            border-left: none !important;
            box-shadow: inset -1px 0 0 ${PREMIUM_GRID_COLUMN_BORDER};
        }
        .premium-grid-wrapper .ag-ltr .ag-cell {
            border-right: none !important;
            border-left: none !important;
            box-shadow: inset -1px 0 0 ${PREMIUM_GRID_COLUMN_BORDER};
        }
        .premium-grid-wrapper .ag-ltr .ag-header-cell::before,
        .premium-grid-wrapper .ag-ltr .ag-header-group-cell:not(.ag-header-span-height.ag-header-group-cell-no-group)::before {
            display: none !important;
        }
        .premium-grid-wrapper .ag-header,
        .premium-grid-wrapper .ag-header-row,
        .premium-grid-wrapper .ag-header-cell,
        .premium-grid-wrapper .ag-header-group-cell,
        .premium-grid-wrapper .ag-floating-filter,
        .premium-grid-wrapper .ag-floating-filter-body {
            background-color: ${PREMIUM_GRID_HEADER_BG} !important;
            color: ${PREMIUM_GRID_HEADER_FG};
        }
        .premium-grid-wrapper .ag-header {
            border-bottom: 1px solid ${PREMIUM_GRID_COLUMN_BORDER};
        }
        .premium-grid-wrapper .ag-header-cell-label,
        .premium-grid-wrapper .ag-header-cell-text {
            color: ${PREMIUM_GRID_HEADER_FG};
            font-weight: 600;
        }
        .premium-grid-wrapper .ag-pinned-left-cols-viewport,
        .premium-grid-wrapper .ag-center-cols-viewport,
        .premium-grid-wrapper .ag-pinned-right-cols-viewport {
            position: relative;
        }
        .premium-grid-wrapper .ag-center-cols-container,
        .premium-grid-wrapper .ag-pinned-left-cols-container,
        .premium-grid-wrapper .ag-pinned-right-cols-container {
            position: relative;
            z-index: 1;
        }
        .premium-grid-wrapper .premium-grid-column-guides {
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 0;
        }
        .premium-grid-wrapper .premium-grid-column-guide {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 0;
            border-right: 1px solid ${PREMIUM_GRID_COLUMN_BORDER};
        }
        
        /* Custom thin scrollbars */
        .premium-grid-wrapper ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        .premium-grid-wrapper ::-webkit-scrollbar-track {
            background: #f8fafc;
        }
        .premium-grid-wrapper ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
        }
        .premium-grid-wrapper ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
    `;

    function paintViewportColumnGuides(viewport, columns) {
        if (!viewport) return;
        var list = columns || [];
        var guides = viewport.querySelector('.premium-grid-column-guides');
        if (!guides) {
            guides = document.createElement('div');
            guides.className = 'premium-grid-column-guides';
            guides.setAttribute('aria-hidden', 'true');
            viewport.appendChild(guides);
        }
        var html = [];
        var x = 0;
        var i;
        for (i = 0; i < list.length; i++) {
            var col = list[i];
            if (!col || typeof col.getActualWidth !== 'function') continue;
            var w = col.getActualWidth() || 0;
            x += w;
            if (i < list.length - 1) {
                // Subtract 1px to perfectly align with the border-box's right inner border of the cells above.
                html.push('<div class="premium-grid-column-guide" style="left:' + (x - 1) + 'px"></div>');
            }
        }
        guides.innerHTML = html.join('');
        var container = viewport.querySelector('.ag-center-cols-container')
            || viewport.querySelector('.ag-pinned-left-cols-container')
            || viewport.querySelector('.ag-pinned-right-cols-container');
        guides.style.width = container ? (container.offsetWidth + 'px') : '100%';
    }

    function paintPremiumGridColumnGuides(api, gridRoot) {
        if (!api || !gridRoot) return;
        paintViewportColumnGuides(
            gridRoot.querySelector('.ag-pinned-left-cols-viewport'),
            typeof api.getDisplayedLeftColumns === 'function' ? api.getDisplayedLeftColumns() : []
        );
        paintViewportColumnGuides(
            gridRoot.querySelector('.ag-center-cols-viewport'),
            typeof api.getDisplayedCenterColumns === 'function' ? api.getDisplayedCenterColumns() : []
        );
        paintViewportColumnGuides(
            gridRoot.querySelector('.ag-pinned-right-cols-viewport'),
            typeof api.getDisplayedRightColumns === 'function' ? api.getDisplayedRightColumns() : []
        );
    }

    function schedulePremiumGridColumnGuides(host, api) {
        if (!host || !api) return;
        if (host._premiumGridGuidesRaf) {
            cancelAnimationFrame(host._premiumGridGuidesRaf);
        }
        host._premiumGridGuidesRaf = requestAnimationFrame(function () {
            host._premiumGridGuidesRaf = null;
            var root = host.querySelector('.ag-root-wrapper');
            paintPremiumGridColumnGuides(api, root);
        });
    }

    var PREMIUM_GRID_GUIDE_EVENTS = [
        'columnResized',
        'displayedColumnsChanged',
        'modelUpdated',
        'paginationChanged',
        'gridSizeChanged',
        'firstDataRendered'
    ];

    const TABLE_LOADING_OVERLAY_CSS = `
        @keyframes premium-grid-table-spin { to { transform: rotate(360deg); } }
        .premium-grid-table-loading-overlay {
            position: absolute;
            inset: 0;
            z-index: 30;
            display: none;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 0.65rem;
            background: rgba(255, 255, 255, 0.82);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
        }
        .premium-grid-table-loading-overlay.is-active {
            display: flex;
        }
        .premium-grid-table-loading-spinner {
            width: 28px;
            height: 28px;
            border-radius: 9999px;
            border: 2px solid rgba(13, 148, 136, 0.22);
            border-top-color: rgb(13, 148, 136);
            animation: premium-grid-table-spin 0.65s linear infinite;
        }
        .premium-grid-table-loading-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #64748b;
            letter-spacing: 0.02em;
            font-family: ${PREMIUM_GRID_FONT_FAMILY};
        }
    `;

    /** Mirrors Common-components/ui/ag-grid-table.js DEFAULT_OPTIONS (adds premium-only: sortColumn, gridOptions, onGridReady). */
    const DEFAULT_OPTIONS = {
        gridElementId: 'myGrid',
        showSINO: true,
        showActions: true,
        rowIdField: 'sino',
        actionCallbacks: {
            view: 'viewRecord',
            edit: 'editRecord',
            delete: 'deleteRecord'
        },
        isActionVisible: null,
        onActionClick: null,
        pagination: true,
        paginationPageSize: 15,
        paginationPageSizeSelector: [5, 10, 15, 20, 50],
        /** Omit rowSummary to hide "1 to 5 of 5" text in the paging bar. */
        paginationPanels: ['pageSize', 'pageSummary'],
        floatingFilter: false,
        rowHeight: 48,
        getRowStyle: null,
        columns: [],
        customColumns: [],
        columnDefs: [],
        autoFillAvailableHeight: true,
        minHeight: 200,
        suppressSizeToFit: false,
        sortColumn: null,
        gridOptions: null,
        onGridReady: null
    };

    function injectPremiumGridStylesOnce() {
        if (typeof document === 'undefined' || document.getElementById(PREMIUM_GRID_STYLES_ID)) return;
        var st = document.createElement('style');
        st.id = PREMIUM_GRID_STYLES_ID;
        st.textContent = PREMIUM_GRID_STYLES_CSS + TABLE_LOADING_OVERLAY_CSS;
        (document.head || document.documentElement).appendChild(st);
    }

    function parseBool(val) {
        return val === true || val === 'true' || val === '1' || val === '';
    }

    /** AG Grid: colDef.flex conflicts with gridOptions.autoSizeStrategy — use one or the other. */
    function resolveAutoSizeStrategy(opts, isMobile) {
        if (parseBool(opts.suppressSizeToFit)) return undefined;
        return isMobile ? { type: 'fitCellContents' } : { type: 'fitGridWidth', defaultMinWidth: 80 };
    }

    function omitFlexFromColDef(col) {
        if (!col || col.flex == null) return col;
        var out = Object.assign({}, col);
        delete out.flex;
        return out;
    }

    function omitFlexFromColumnDefs(cols) {
        if (!cols || !cols.length) return cols;
        return cols.map(omitFlexFromColDef);
    }

    function sanitizeGridOptionsForAutoSize(gridOptions) {
        if (!gridOptions || !gridOptions.autoSizeStrategy) return gridOptions;
        var g = Object.assign({}, gridOptions);
        if (g.defaultColDef && Object.prototype.hasOwnProperty.call(g.defaultColDef, 'flex')) {
            g.defaultColDef = Object.assign({}, g.defaultColDef);
            delete g.defaultColDef.flex;
        }
        if (g.columnDefs && g.columnDefs.length) {
            g.columnDefs = omitFlexFromColumnDefs(g.columnDefs);
        }
        return g;
    }

    function toNumber(v) {
        var n = parseFloat(v);
        return Number.isFinite(n) ? n : 0;
    }

    function getOuterHeight(el) {
        if (!el) return 0;
        var styles = window.getComputedStyle(el);
        if (styles.display === 'none' || styles.position === 'absolute' || styles.position === 'fixed') return 0;
        return el.offsetHeight + toNumber(styles.marginTop) + toNumber(styles.marginBottom);
    }

    /** SweetAlert / modal overlays change body height and trigger bad flex recalc — skip until closed. */
    function isLayoutLockOverlayOpen() {
        if (typeof document === 'undefined') return false;
        var body = document.body;
        var html = document.documentElement;
        if (body && body.classList.contains('swal2-shown')) return true;
        if (html && (html.classList.contains('swal2-height-auto') || html.classList.contains('swal2-shown'))) return true;
        if (document.querySelector('[data-modal-overlay][data-open="true"]')) return true;
        return false;
    }

    function calcAvailableHeight(hostEl, minHeight) {
        if (isLayoutLockOverlayOpen()) return null;
        var parent = hostEl && hostEl.parentElement;
        if (!parent) return null;
        var parentStyles = window.getComputedStyle(parent);
        var paddingTop = toNumber(parentStyles.paddingTop);
        var paddingBottom = toNumber(parentStyles.paddingBottom);
        var parentInnerHeight = parent.clientHeight - paddingTop - paddingBottom;
        if (!parentInnerHeight) return null;

        var occupied = 0;
        Array.from(parent.children).forEach(function (child) {
            if (child !== hostEl) occupied += getOuterHeight(child);
        });

        var hostStyles = window.getComputedStyle(hostEl);
        var hostMargins = toNumber(hostStyles.marginTop) + toNumber(hostStyles.marginBottom);
        var remaining = Math.floor(parentInnerHeight - occupied - hostMargins);
        return Math.max(minHeight || 200, remaining);
    }

    function resolveActionHandler(actionRef, g) {
        if (typeof actionRef === 'function') return actionRef;
        if (typeof actionRef === 'string' && actionRef && typeof g[actionRef] === 'function') {
            return g[actionRef];
        }
        return null;
    }

    /**
     * Same invocation contract as ag-grid-table.js invokeAction (always 4-arg callback).
     */
    function createInvokeAction(opts, g) {
        return function invokeAction(actionRef, rowId, rowData, params, meta) {
            var handled = false;
            var fn = resolveActionHandler(actionRef, g);
            if (fn) {
                try {
                    fn(rowId, rowData, params, meta);
                    handled = true;
                } catch (err) {
                    console.error('PremiumGrid action callback failed:', err);
                }
            }
            if (typeof opts.onActionClick === 'function') {
                try {
                    opts.onActionClick({
                        action: meta && meta.action != null ? meta.action : actionRef,
                        rowId: rowId,
                        rowData: rowData,
                        params: params,
                        meta: meta || null,
                        handled: handled
                    });
                } catch (err) {
                    console.error('PremiumGrid onActionClick failed:', err);
                }
            }
        };
    }

    /**
     * Identical logic to Common-components/ui/ag-grid-table.js buildColumnDefs (expects options._actionInvoker).
     */
    function buildColumnDefs(options, isMobile) {
        var showSINO = options.showSINO;
        var showActions = options.showActions;
        var rowIdField = options.rowIdField;
        var actionCallbacks = options.actionCallbacks;
        var callbacks = actionCallbacks || DEFAULT_OPTIONS.actionCallbacks;
        var idField = rowIdField || DEFAULT_OPTIONS.rowIdField;
        var actionInvoker = typeof options._actionInvoker === 'function' ? options._actionInvoker : null;
        var allowFlex = parseBool(options.suppressSizeToFit);

        var columns = [];

        if (parseBool(showSINO)) {
            var sinoCol = {
                field: 'sino',
                headerName: 'S.No',
                width: isMobile ? 44 : 70,
                minWidth: 40,
                maxWidth: isMobile ? 52 : 90,
                suppressSizeToFit: true,
                sortable: true,
                cellRenderer: function (params) {
                    return '<div class="flex items-center justify-center h-full font-mono text-[13px]">' + (params.node.rowIndex + 1) + '</div>';
                }
            };
            if (allowFlex) sinoCol.flex = 0;
            columns.push(sinoCol);
        }

        var plainCols = options.columns;
        var customCols = typeof options.customColumns === 'function' ? options.customColumns(isMobile) : options.customColumns;
        var fullColDefs = options.columnDefs;

        if (plainCols && plainCols.length) {
            plainCols.forEach(function (c, idx) {
                if (c.icon != null && c.action != null) {
                    var actionRef = c.action;
                    var iconClass = typeof c.icon === 'string' ? c.icon : 'bi bi-circle';
                    var title = c.title != null ? String(c.title) : (c.headerName != null ? String(c.headerName) : '');
                    columns.push({
                        field: '_icon_' + idx,
                        headerName: c.headerName != null ? c.headerName : (c.header || ''),
                        sortable: false,
                        filter: false,
                        width: c.width != null ? c.width : (isMobile ? 50 : 60),
                        cellRenderer: function (params) {
                            if (typeof options.isActionVisible === 'function' && !options.isActionVisible(actionRef, params.data)) {
                                return '';
                            }
                            var id = params.data && params.data[idField] != null ? params.data[idField] : '';
                            var wrap = document.createElement('div');
                            wrap.className = 'flex items-center justify-center h-full';
                            var btn = document.createElement('button');
                            btn.type = 'button';
                            btn.className = 'ag-grid-btn-primary text-gray-500 text-sm rounded-lg p-1.5';
                            btn.title = title;
                            btn.innerHTML = '<i class="bi ' + iconClass + ' text-base"></i>';
                            btn.addEventListener('click', function (evt) {
                                evt.preventDefault();
                                evt.stopPropagation();
                                if (actionInvoker) {
                                    actionInvoker(actionRef, id, params.data, params, {
                                        action: 'icon',
                                        column: c,
                                        event: evt
                                    });
                                }
                            });
                            wrap.appendChild(btn);
                            return wrap;
                        }
                    });
                } else {
                    var merged = Object.assign({}, c, {
                        field: c.field,
                        headerName: c.headerName != null ? c.headerName : (c.header || c.field),
                        sortable: c.sortable !== false,
                        filter: c.filter !== false,
                        width: c.width != null ? c.width : (isMobile ? 100 : null)
                    });
                    if (allowFlex) {
                        merged.flex = c.flex != null ? c.flex : (c.width == null && !isMobile ? 1 : undefined);
                    } else if (merged.flex != null) {
                        delete merged.flex;
                    }
                    columns.push(merged);
                }
            });
        } else if (customCols && customCols.length) {
            columns.push.apply(columns, allowFlex ? customCols : omitFlexFromColumnDefs(customCols));
        } else if (fullColDefs && fullColDefs.length) {
            columns.push.apply(columns, allowFlex ? fullColDefs : omitFlexFromColumnDefs(fullColDefs));
        }

        if (parseBool(showActions) && callbacks) {
            var viewCb = callbacks && Object.prototype.hasOwnProperty.call(callbacks, 'view') ? callbacks.view : 'viewRecord';
            var editCb = callbacks && Object.prototype.hasOwnProperty.call(callbacks, 'edit') ? callbacks.edit : 'editRecord';
            var deleteCb = callbacks && Object.prototype.hasOwnProperty.call(callbacks, 'delete') ? callbacks.delete : 'deleteRecord';

            var activityCol = {
                field: 'activity',
                headerName: 'Activity',
                width: isMobile ? 72 : 100,
                minWidth: 72,
                maxWidth: isMobile ? 80 : 100,
                suppressSizeToFit: true,
                sortable: false,
                filter: false,
                cellRenderer: function (params) {
                    var id = params.data && params.data[idField] != null ? params.data[idField] : '';
                    var wrap = document.createElement('div');
                    wrap.className = 'flex items-center justify-center gap-1 h-full';

                    function createActionButton(action, iconClass, title, callbackRef) {
                        var btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'text-gray-500 hover:text-gray-700 text-sm rounded-md flex items-center gap-1';
                        btn.title = title;
                        btn.innerHTML = '<i class="bi ' + iconClass + ' text-base"></i>';
                        btn.addEventListener('click', function (evt) {
                            evt.preventDefault();
                            evt.stopPropagation();
                            if (actionInvoker) {
                                actionInvoker(callbackRef, id, params.data, params, {
                                    action: action,
                                    event: evt
                                });
                            }
                        });
                        return btn;
                    }

                    var isVis = typeof options.isActionVisible === 'function' ? options.isActionVisible : function () { return true; };

                    if (viewCb && isVis('view', params.data)) {
                        wrap.appendChild(createActionButton('view', 'bi-eye', 'View Details', viewCb));
                    }
                    if (editCb && isVis('edit', params.data)) {
                        wrap.appendChild(createActionButton('edit', 'bi-pencil-square', 'Edit Record', editCb));
                    }
                    if (deleteCb && isVis('delete', params.data)) {
                        wrap.appendChild(createActionButton('delete', 'bi-trash3', 'Delete Record', deleteCb));
                    }
                    return wrap;
                }
            };
            if (allowFlex) activityCol.flex = 0;
            columns.push(activityCol);
        }

        return columns;
    }

    /**
     * Imperative API matching AGGridTable.render — grid only (no premium toolbar). Same options as ag-grid-table.
     */
    function renderProgrammatic(container, options) {
        var el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) {
            console.error('PremiumDataGrid.render: container not found', container);
            return null;
        }

        var opts = Object.assign({}, DEFAULT_OPTIONS, options || {});
        var gridId = opts.gridElementId || 'myGrid';
        var isMobile = typeof window !== 'undefined' && window.innerWidth <= 767;

        var invokeAction = createInvokeAction(opts, global);
        opts._actionInvoker = invokeAction;

        injectPremiumGridStylesOnce();

        var wrapper = document.createElement('div');
        wrapper.className = 'premium-grid-wrapper w-full h-full flex-1 min-h-0 flex flex-col rounded-lg';
        wrapper.style.minHeight = (opts.minHeight || 200) + 'px';

        var gridHost = document.createElement('div');
        gridHost.className = 'relative w-full h-full flex-1 min-h-0 flex flex-col';
        gridHost.style.minHeight = (opts.minHeight || 200) + 'px';

        var gridDiv = document.createElement('div');
        gridDiv.id = gridId;
        gridDiv.className = 'ag-theme-quartz w-full h-full';
        gridDiv.style.minHeight = (opts.minHeight || 200) + 'px';

        var loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'premium-grid-table-loading-overlay';
        loadingOverlay.setAttribute('data-table-loading-overlay', '');
        loadingOverlay.setAttribute('role', 'status');
        loadingOverlay.setAttribute('aria-live', 'polite');
        loadingOverlay.setAttribute('aria-busy', 'false');
        loadingOverlay.innerHTML =
            '<div class="premium-grid-table-loading-spinner" aria-hidden="true"></div>' +
            '<span class="premium-grid-table-loading-label" data-table-loading-label>Loading…</span>';

        gridHost.appendChild(gridDiv);
        gridHost.appendChild(loadingOverlay);
        wrapper.appendChild(gridHost);
        el.appendChild(wrapper);

        var columnDefs = buildColumnDefs(opts, isMobile);
        var rowData = Array.isArray(opts.rowData) ? opts.rowData : [];

        var useFloatingFilter = parseBool(opts.floatingFilter != null ? opts.floatingFilter : DEFAULT_OPTIONS.floatingFilter);
        var gridOptions = {
            animateRows: false,
            rowHeight: opts.rowHeight != null ? opts.rowHeight : DEFAULT_OPTIONS.rowHeight,
            enableCharts: false,
            getRowStyle: opts.getRowStyle || (Array.isArray(opts.rowHighlights) ? function (params) {
                if (!params.data) return null;
                for (var i = 0; i < opts.rowHighlights.length; i++) {
                    var rule = opts.rowHighlights[i];
                    var cellValue = params.data[rule.field];
                    if (cellValue != null && String(cellValue).toLowerCase() === String(rule.value).toLowerCase()) {
                        return { background: rule.bg, color: rule.color };
                    }
                }
                return null;
            } : undefined),
            autoSizeStrategy: resolveAutoSizeStrategy(opts, isMobile),
            suppressHorizontalScroll: false,
            pagination: parseBool(opts.pagination != null ? opts.pagination : DEFAULT_OPTIONS.pagination),
            paginationPageSize: opts.paginationPageSize != null ? opts.paginationPageSize : DEFAULT_OPTIONS.paginationPageSize,
            paginationPageSizeSelector: isMobile ? false : (opts.paginationPageSizeSelector || DEFAULT_OPTIONS.paginationPageSizeSelector),
            paginationPanels: isMobile
                ? ['pageSummary']
                : (opts.paginationPanels || DEFAULT_OPTIONS.paginationPanels),
            paginationNumberFormatter: function (params) {
                return params.value != null && typeof params.value.toLocaleString === 'function'
                    ? String(params.value.toLocaleString()) : String(params.value != null ? params.value : '');
            },
            defaultColDef: {
                floatingFilter: useFloatingFilter
            },
            rowData: rowData,
            columnDefs: columnDefs,
            suppressCellFocus: true
        };

        if (typeof agGrid === 'undefined') {
            console.error('PremiumDataGrid: ag-grid-community (agGrid.createGrid) required');
            return null;
        }

        gridOptions = sanitizeGridOptionsForAutoSize(gridOptions);
        var createdApi = agGrid.createGrid(gridDiv, gridOptions);
        var api = createdApi || gridOptions.api;

        var resizeObserver = null;
        var mutationObserver = null;

        var applyAvailableHeight = function () {
            if (!opts.autoFillAvailableHeight || typeof window === 'undefined') return;
            if (isLayoutLockOverlayOpen()) return;
            var nextHeight = calcAvailableHeight(el, opts.minHeight || 200);
            if (!nextHeight) return;
            el.style.height = nextHeight + 'px';
            el.style.minHeight = (opts.minHeight || 200) + 'px';
            if (!opts.suppressSizeToFit && api && typeof api.sizeColumnsToFit === 'function') {
                api.sizeColumnsToFit();
            }
        };

        if (opts.autoFillAvailableHeight && typeof window !== 'undefined') {
            requestAnimationFrame(applyAvailableHeight);
            if (typeof ResizeObserver !== 'undefined' && el.parentElement) {
                resizeObserver = new ResizeObserver(function () { applyAvailableHeight(); });
                resizeObserver.observe(el.parentElement);
            }
            if (typeof MutationObserver !== 'undefined' && el.parentElement) {
                mutationObserver = new MutationObserver(function () { applyAvailableHeight(); });
                mutationObserver.observe(el.parentElement, {
                    childList: true,
                    subtree: false,
                    attributes: true,
                    attributeFilter: ['class', 'style']
                });
            }
        }

        var setRowData = function (data) {
            if (!api) return;
            var rows = data || [];
            if (typeof api.setGridOption === 'function') {
                api.setGridOption('rowData', rows);
            } else if (typeof api.setRowData === 'function') {
                api.setRowData(rows);
            }
            if (!opts.suppressSizeToFit && typeof window !== 'undefined' && window.innerWidth > 767) {
                setTimeout(function () {
                    if (api && typeof api.sizeColumnsToFit === 'function') {
                        api.sizeColumnsToFit();
                    }
                }, 50);
            }
        };

        var setGlobalSearch = function (value) {
            if (!api) return;
            if (typeof api.setGridOption === 'function') {
                api.setGridOption('quickFilterText', value || '');
            } else if (typeof api.setQuickFilter === 'function') {
                api.setQuickFilter(value || '');
            }
        };

        var updateColumnDefs = function (newColumnDefsOrCustomColumns, useAsCustomColumns) {
            var isMobileNow = window.innerWidth <= 767;
            var nextOpts = useAsCustomColumns
                ? Object.assign({}, opts, { customColumns: newColumnDefsOrCustomColumns, columnDefs: [], columns: [] })
                : Object.assign({}, opts, { columnDefs: newColumnDefsOrCustomColumns, customColumns: [], columns: [] });
            nextOpts._actionInvoker = invokeAction;
            var nextDefs = buildColumnDefs(nextOpts, isMobileNow);
            if (api) api.setGridOption('columnDefs', nextDefs);
        };

        var resize = function () {
            var isMobileNow = window.innerWidth <= 767;
            if (api) {
                var nextOpts = Object.assign({}, opts, { _actionInvoker: invokeAction });
                var nextDefs = buildColumnDefs(nextOpts, isMobileNow);
                api.setGridOption('columnDefs', nextDefs);
                api.setGridOption('suppressHorizontalScroll', isMobileNow);
                if (!opts.suppressSizeToFit) {
                    api.sizeColumnsToFit();
                }
            }
            applyAvailableHeight();
        };

        var doDestroy = function () {
            if (typeof window !== 'undefined') {
                window.removeEventListener('resize', resize);
            }
            if (resizeObserver) resizeObserver.disconnect();
            if (mutationObserver) mutationObserver.disconnect();
            if (api) api.destroy();
            if (wrapper && wrapper.parentNode) {
                wrapper.parentNode.removeChild(wrapper);
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('resize', resize);
        }

        var setTableLoading = function (active, message) {
            if (!loadingOverlay) return;
            var label = loadingOverlay.querySelector('[data-table-loading-label]');
            if (message != null && label) {
                label.textContent = String(message);
            } else if (!active && label) {
                label.textContent = 'Loading…';
            }
            if (active) {
                loadingOverlay.classList.add('is-active');
                loadingOverlay.setAttribute('aria-busy', 'true');
            } else {
                loadingOverlay.classList.remove('is-active');
                loadingOverlay.setAttribute('aria-busy', 'false');
            }
        };

        return {
            api: api,
            gridOptions: gridOptions,
            setRowData: setRowData,
            destroy: doDestroy,
            setGlobalSearch: setGlobalSearch,
            updateColumnDefs: updateColumnDefs,
            resize: resize,
            setTableLoading: setTableLoading
        };
    }

    class PremiumGrid extends HTMLElement {
        static get observedAttributes() {
            return [
                'data-grid-element-id',
                'data-show-sino',
                'data-show-actions',
                'data-row-id-field',
                'data-pagination-page-size',
                'data-pagination',
                'data-floating-filter',
                'data-row-height',
                'data-action-view',
                'data-action-edit',
                'data-action-delete',
                'data-pagination-page-size-selector',
                'data-auto-fill-height',
                'data-min-height',
                'data-suppress-size-to-fit'
            ];
        }

        constructor() {
            super();
            this._options = Object.assign({}, DEFAULT_OPTIONS);
            this._api = null;
            this._lastGridOptions = null;
            this._mounted = false;
            this._currentGridId = null;
            this._resizeObserver = null;
            this._mutationObserver = null;
            this._boundWindowResize = null;
            this._tableLoadingOverlayEl = null;
        }

        connectedCallback() {
            this.style.display = 'flex';
            this.style.flexDirection = 'column';
            this.style.flex = '1';
            this.style.minHeight = '0';
            this._readAttributes();
            this._mounted = true;
        }

        _readAttributes() {
            var self = this;
            function get(name, def) {
                var v = self.getAttribute(name);
                return v === null || v === undefined ? def : v;
            }
            if (get('data-grid-element-id') || get('data-grid-id')) {
                this._options.gridElementId = get('data-grid-element-id') || get('data-grid-id') || this._options.gridElementId;
            }
            this._options.showSINO = parseBool(get('data-show-sino', this._options.showSINO));
            this._options.showActions = parseBool(get('data-show-actions', this._options.showActions));
            this._options.rowIdField = get('data-row-id-field') || this._options.rowIdField;
            var pps = parseInt(get('data-pagination-page-size'), 10);
            if (Number.isFinite(pps) && pps > 0) this._options.paginationPageSize = pps;
            var rh = parseInt(get('data-row-height'), 10);
            if (Number.isFinite(rh) && rh > 0) this._options.rowHeight = rh;
            var af = this.getAttribute('data-auto-fill-height');
            if (af !== null) this._options.autoFillAvailableHeight = parseBool(af);
            var mh = parseInt(get('data-min-height'), 10);
            if (Number.isFinite(mh) && mh > 0) this._options.minHeight = mh;
            this._options.suppressSizeToFit = parseBool(get('data-suppress-size-to-fit', this._options.suppressSizeToFit));
            this._options.pagination = parseBool(get('data-pagination', this._options.pagination));
            this._options.floatingFilter = parseBool(get('data-floating-filter', this._options.floatingFilter));
            var sel = get('data-pagination-page-size-selector');
            if (sel) {
                try {
                    this._options.paginationPageSizeSelector = JSON.parse(sel);
                } catch (_) { /* ignore */ }
            }
            this._options.actionCallbacks = {
                view: get('data-action-view') || this._options.actionCallbacks.view,
                edit: get('data-action-edit') || this._options.actionCallbacks.edit,
                delete: get('data-action-delete') || this._options.actionCallbacks.delete
            };
            var dataColumns = get('data-columns');
            if (dataColumns) {
                try {
                    this._options.columns = JSON.parse(dataColumns);
                } catch (_) { /* ignore */ }
            }
        }

        setOptions(options) {
            this._options = Object.assign({}, this._options, options || {});
            if (this._mounted) this.render();
        }

        set columns(val) {
            this._options.columns = val;
            this._options.columnDefs = [];
            this._options.customColumns = [];
            if (this._mounted) {
                if (!this._api) this.render();
                else {
                    var invokeAction = createInvokeAction(this._options, global);
                    var next = buildColumnDefs(Object.assign({}, this._options, { _actionInvoker: invokeAction }), window.innerWidth <= 767);
                    this._api.setGridOption('columnDefs', next);
                }
            }
        }

        set customColumns(val) {
            this._options.customColumns = val;
            this._options.columns = [];
            this._options.columnDefs = [];
            if (this._mounted) {
                if (!this._api) this.render();
                else {
                    var invokeAction = createInvokeAction(this._options, global);
                    var next = buildColumnDefs(Object.assign({}, this._options, { _actionInvoker: invokeAction }), window.innerWidth <= 767);
                    this._api.setGridOption('columnDefs', next);
                }
            }
        }

        set columnDefs(val) {
            this._options.columnDefs = val;
            this._options.columns = [];
            this._options.customColumns = [];
            if (this._mounted) {
                if (!this._api) this.render();
                else {
                    var invokeAction = createInvokeAction(this._options, global);
                    var next = buildColumnDefs(Object.assign({}, this._options, { _actionInvoker: invokeAction }), window.innerWidth <= 767);
                    this._api.setGridOption('columnDefs', next);
                }
            }
        }

        set rowData(val) {
            this._options.rowData = val;
            if (this._mounted) {
                if (!this._api) this.render();
                else this.setRowData(val);
            }
        }

        set endpoint(val) {
            this._options.endpoint = val;
            if (this._mounted && this._api) {
                this.loadFromEndpoint();
            }
        }

        set mapItem(val) {
            this._options.mapItem = val;
        }

        loadFromEndpoint() {
            var endpoint = this._options.endpoint;
            if (!endpoint) return;
            var domain = (typeof localStorage !== 'undefined' ? localStorage.getItem('Domain') : '') || '';
            var url = domain + endpoint;
            this.setTableLoading(true, 'Loading data...');
            var self = this;
            fetch(url)
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    console.log(data);
                    var list = Array.isArray(data) ? data : (data.data || data.Data || data.list || data.List || []);
                    if (typeof self._options.mapItem === 'function') {
                        list = list.map(self._options.mapItem);
                    }
                    self.setRowData(list);
                    self.setTableLoading(false);
                })
                .catch(function (err) {
                    console.error('[PremiumGrid] Error fetching data:', err);
                    self.setRowData([]);
                    self.setTableLoading(false);
                });
        }

        _cleanupObservers() {
            if (this._resizeObserver) {
                try { this._resizeObserver.disconnect(); } catch (e) { /* ignore */ }
                this._resizeObserver = null;
            }
            if (this._mutationObserver) {
                try { this._mutationObserver.disconnect(); } catch (e) { /* ignore */ }
                this._mutationObserver = null;
            }
            if (this._boundWindowResize && typeof window !== 'undefined') {
                window.removeEventListener('resize', this._boundWindowResize);
                this._boundWindowResize = null;
            }
        }

        _applyAvailableHeight() {
            if (!this._options.autoFillAvailableHeight || typeof window === 'undefined') return;
            if (isLayoutLockOverlayOpen()) return;
            var nextHeight = calcAvailableHeight(this, this._options.minHeight || 200);
            if (!nextHeight) return;
            this.style.height = nextHeight + 'px';
            this.style.minHeight = (this._options.minHeight || 200) + 'px';
            if (!this._options.suppressSizeToFit && this._api && typeof this._api.sizeColumnsToFit === 'function') {
                this._api.sizeColumnsToFit();
            }
        }

        render() {
            // Capture slotted elements before we modify innerHTML!
            if (!this._hasCapturedSlots) {
                this._hasCapturedSlots = true;
                var actionsSlotEl = this.querySelector('[slot="actions"]');
                if (actionsSlotEl) {
                    this._slottedActions = document.createDocumentFragment();
                    while (actionsSlotEl.firstChild) {
                        this._slottedActions.appendChild(actionsSlotEl.firstChild);
                    }
                }
            }

            this._cleanupObservers();
            if (this._api && this._api.destroy) {
                this._api.destroy();
            }
            this._api = null;

            this._readAttributes();

            injectPremiumGridStylesOnce();

            var gridId = 'grid-' + Math.random().toString(36).substr(2, 9);
            this._currentGridId = gridId;

            this.innerHTML = [
                '<div class="premium-grid-wrapper flex-1 w-full flex flex-col overflow-hidden bg-white pt-0 min-h-0">',
                '  <div class="table-controls flex flex-col gap-3 sm:flex-row sm:items-center p-2.5 flex-shrink-0">',
                '    <div class="flex items-center w-full sm:w-auto">',
                '      <div class="relative flex-1 sm:flex-initial">',
                '        <i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>',
                '        <input type="text" id="search-input-', gridId, '" placeholder="Search anything..."',
                '          class="w-full sm:w-44 lg:w-64 bg-gray-50 border border-gray-100 rounded-xl py-2 pl-11 pr-4 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:bg-white">',
                '      </div>',
                '      <button type="button" id="sort-btn-', gridId, '"',
                '        class="ml-2 w-9 h-9 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-primary-500"',
                '        title="Toggle Sort"><i class="bi bi-sort-down text-lg"></i></button>',
                '    </div>',
                '    <div id="actions-slot-', gridId, '" class="w-full sm:w-auto sm:ml-auto flex items-center justify-end sm:justify-start gap-2 overflow-x-auto"></div>',
                '  </div>',
                '  <div class="relative flex-1 w-full min-h-0 flex flex-col px-2.5 pb-1.5">',
                '    <div id="', gridId, '" class="ag-theme-quartz flex-1 w-full min-h-0" data-lenis-prevent></div>',
                '    <div class="premium-grid-table-loading-overlay" data-table-loading-overlay role="status" aria-live="polite" aria-busy="false">',
                '      <div class="premium-grid-table-loading-spinner" aria-hidden="true"></div>',
                '      <span class="premium-grid-table-loading-label" data-table-loading-label>Loading…</span>',
                '    </div>',
                '  </div>',
                '</div>'
            ].join('');

            var actionsSlot = this.querySelector('#actions-slot-' + gridId);
            if (actionsSlot && this._slottedActions) {
                actionsSlot.appendChild(this._slottedActions.cloneNode(true));
            }

            this._tableLoadingOverlayEl = this.querySelector('[data-table-loading-overlay]');

            var isMobile = typeof window !== 'undefined' && window.innerWidth <= 767;
            var invokeAction = createInvokeAction(this._options, global);
            var colOpts = Object.assign({}, this._options, { _actionInvoker: invokeAction });
            var columnDefs = buildColumnDefs(colOpts, isMobile);

            var o = this._options;
            var autoSizeStrategy = resolveAutoSizeStrategy(o, isMobile);
            var allowFlex = parseBool(o.suppressSizeToFit);

            var baseGridOptions = {
                enableCharts: false,
                animateRows: false,
                pagination: o.pagination,
                paginationPageSize: o.paginationPageSize,
                paginationPageSizeSelector: isMobile ? false : o.paginationPageSizeSelector,
                paginationPanels: isMobile
                    ? ['pageSummary']
                    : (o.paginationPanels || DEFAULT_OPTIONS.paginationPanels),
                paginationNumberFormatter: function (params) {
                    return params.value != null && typeof params.value.toLocaleString === 'function'
                        ? String(params.value.toLocaleString()) : String(params.value != null ? params.value : '');
                },
                rowHeight: o.rowHeight,
                headerHeight: 40,
                defaultColDef: Object.assign({
                    sortable: true,
                    resizable: true,
                    minWidth: 100,
                    floatingFilter: !!o.floatingFilter
                }, allowFlex ? { flex: 1 } : {}),
                autoSizeStrategy: autoSizeStrategy,
                suppressHorizontalScroll: false,
                rowSelection: {
                    mode: 'multiRow',
                    checkboxes: false,
                    headerCheckbox: false,
                    enableClickSelection: false
                },
                suppressCellFocus: true,
                rowData: o.rowData || [],
                getRowStyle: typeof o.getRowStyle === 'function' ? o.getRowStyle : (Array.isArray(o.rowHighlights) ? function (params) {
                    if (!params.data) return null;
                    for (var i = 0; i < o.rowHighlights.length; i++) {
                        var rule = o.rowHighlights[i];
                        var cellValue = params.data[rule.field];
                        if (cellValue != null && String(cellValue).toLowerCase() === String(rule.value).toLowerCase()) {
                            return { background: rule.bg, color: rule.color };
                        }
                    }
                    return null;
                } : undefined)
            };

            var userGridOpts = o.gridOptions || {};
            var userOnReady = userGridOpts.onGridReady || o.onGridReady;
            var gridOptions = Object.assign({}, baseGridOptions, userGridOpts);
            if (Object.prototype.hasOwnProperty.call(gridOptions, 'floatingFilter')) {
                var legacyFf = !!gridOptions.floatingFilter;
                delete gridOptions.floatingFilter;
                gridOptions.defaultColDef = Object.assign({}, gridOptions.defaultColDef || {});
                if (gridOptions.defaultColDef.floatingFilter === undefined) {
                    gridOptions.defaultColDef.floatingFilter = legacyFf;
                }
            }
            gridOptions.columnDefs = columnDefs;
            gridOptions = sanitizeGridOptionsForAutoSize(gridOptions);
            gridOptions.onGridReady = function (params) {
                this._api = params.api;
                if (!o.suppressSizeToFit && this._api && this._api.sizeColumnsToFit) {
                    this._api.sizeColumnsToFit();
                }
                this._applyAvailableHeight();
                var self = this;
                var api = params.api;
                PREMIUM_GRID_GUIDE_EVENTS.forEach(function (ev) {
                    api.addEventListener(ev, function () {
                        schedulePremiumGridColumnGuides(self, api);
                    });
                });
                schedulePremiumGridColumnGuides(self, api);
                if (typeof userOnReady === 'function') {
                    userOnReady(params);
                }
            }.bind(this);

            this._lastGridOptions = gridOptions;

            var gridDiv = this.querySelector('#' + gridId);
            var created = agGrid.createGrid(gridDiv, gridOptions);
            this._api = created || gridOptions.api;

            this._hookLayoutObservers();
            this._hookEvents(gridId);

            if (this._options.endpoint) {
                this.loadFromEndpoint();
            }

            return this._api;
        }

        _hookLayoutObservers() {
            var self = this;
            if (!this._options.autoFillAvailableHeight || typeof window === 'undefined') return;

            requestAnimationFrame(function () { self._applyAvailableHeight(); });

            if (typeof ResizeObserver !== 'undefined' && this.parentElement) {
                this._resizeObserver = new ResizeObserver(function () { self._applyAvailableHeight(); });
                this._resizeObserver.observe(this.parentElement);
            }
            if (typeof MutationObserver !== 'undefined' && this.parentElement) {
                this._mutationObserver = new MutationObserver(function () { self._applyAvailableHeight(); });
                this._mutationObserver.observe(this.parentElement, {
                    childList: true,
                    subtree: false,
                    attributes: true,
                    attributeFilter: ['class', 'style']
                });
            }

            this._boundWindowResize = function () {
                if (!self._api) return;
                var isMobile = window.innerWidth <= 767;
                var invokeAction = createInvokeAction(self._options, global);
                var colOpts = Object.assign({}, self._options, { _actionInvoker: invokeAction });
                var defs = buildColumnDefs(colOpts, isMobile);
                self._api.setGridOption('columnDefs', defs);
                self._api.setGridOption('suppressHorizontalScroll', isMobile);
                if (!self._options.suppressSizeToFit && self._api.sizeColumnsToFit) {
                    self._api.sizeColumnsToFit();
                }
                self._applyAvailableHeight();
                schedulePremiumGridColumnGuides(self, self._api);
            };
            window.addEventListener('resize', this._boundWindowResize);
        }

        _hookEvents(gridId) {
            var self = this;
            var searchInput = this.querySelector('#search-input-' + gridId);
            var sortBtn = this.querySelector('#sort-btn-' + gridId);

            if (searchInput) {
                searchInput.addEventListener('input', function (e) {
                    self.setGlobalSearch(e.target.value);
                });
            }

            if (sortBtn) {
                sortBtn.addEventListener('click', function () {
                    if (!self._api) return;
                    var sortCol = self._options.sortColumn ||
                        (self._options.columns && self._options.columns[0] && self._options.columns[0].field);
                    if (!sortCol) return;

                    var cs = self._api.getColumnState().find(function (s) { return s.colId === sortCol; });
                    var currentSort = cs && cs.sort;
                    var nextSort = currentSort === 'asc' ? 'desc' : (currentSort === 'desc' ? null : 'asc');
                    self._api.applyColumnState({
                        state: [{ colId: sortCol, sort: nextSort }],
                        defaultState: { sort: null }
                    });
                });
            }
        }

        setGlobalSearch(value) {
            if (!this._api) return;
            var v = value != null ? String(value) : '';
            if (typeof this._api.setGridOption === 'function') {
                this._api.setGridOption('quickFilterText', v);
            } else if (typeof this._api.setQuickFilter === 'function') {
                this._api.setQuickFilter(v);
            }
        }

        /**
         * Full-screen (within the grid area) loading buffer: use while fetching row data.
         * @param {boolean} active - true to show spinner, false to hide
         * @param {string} [message] - optional label (defaults to "Loading…" when hiding)
         */
        setTableLoading(active, message) {
            var el = this._tableLoadingOverlayEl;
            if (!el) return;
            var label = el.querySelector('[data-table-loading-label]');
            if (message != null && label) {
                label.textContent = String(message);
            } else if (!active && label) {
                label.textContent = 'Loading…';
            }
            if (active) {
                el.classList.add('is-active');
                el.setAttribute('aria-busy', 'true');
            } else {
                el.classList.remove('is-active');
                el.setAttribute('aria-busy', 'false');
            }
        }

        updateColumnDefs(defs, useAsCustomColumns) {
            if (!this._api) return;
            var isMobile = typeof window !== 'undefined' && window.innerWidth <= 767;
            if (useAsCustomColumns) {
                this._options.customColumns = defs;
                this._options.columns = [];
                this._options.columnDefs = [];
            } else {
                this._options.columnDefs = defs;
                this._options.columns = [];
                this._options.customColumns = [];
            }
            var invokeAction = createInvokeAction(this._options, global);
            var colOpts = Object.assign({}, this._options, { _actionInvoker: invokeAction });
            var next = buildColumnDefs(colOpts, isMobile);
            this._api.setGridOption('columnDefs', next);
        }

        resize() {
            if (this._boundWindowResize) this._boundWindowResize();
        }

        destroy() {
            this._cleanupObservers();
            if (this._api && this._api.destroy) {
                this._api.destroy();
            }
            this._api = null;
            this._currentGridId = null;
            this._lastGridOptions = null;
            this._tableLoadingOverlayEl = null;
        }

        getActionsSlot() {
            var id = this._currentGridId || (this.querySelector('.ag-theme-quartz') && this.querySelector('.ag-theme-quartz').id);
            return id ? this.querySelector('#actions-slot-' + id) : null;
        }

        getApi() {
            return this._api;
        }

        getGridOptions() {
            return this._lastGridOptions;
        }

        setRowData(data) {
            if (!this._api) return;
            var rows = data || [];
            if (typeof this._api.setGridOption === 'function') {
                this._api.setGridOption('rowData', rows);
            }
            var self = this;
            if (!this._options.suppressSizeToFit && typeof window !== 'undefined' && window.innerWidth > 767) {
                setTimeout(function () {
                    if (self._api && typeof self._api.sizeColumnsToFit === 'function') {
                        self._api.sizeColumnsToFit();
                    }
                }, 50);
            }
        }
    }

    if (typeof window !== 'undefined' && window.customElements && !window.customElements.get('premium-grid')) {
        window.customElements.define('premium-grid', PremiumGrid);
    }

    global.PremiumDataGrid = {
        render: renderProgrammatic,
        DEFAULT_OPTIONS: DEFAULT_OPTIONS,
        buildColumnDefs: function (options, isMobile) {
            var o = Object.assign({}, options);
            if (!o._actionInvoker) {
                o._actionInvoker = createInvokeAction(o, global);
            }
            var mobile = isMobile === true || isMobile === false
                ? isMobile
                : (typeof window !== 'undefined' && window.innerWidth <= 767);
            return buildColumnDefs(o, mobile);
        },
        INTEGRATION: {
            id: 'premium-grid',
            tagName: 'premium-grid',
            defaultOptions: DEFAULT_OPTIONS,
            initPattern: 'getElementById({{id}}).setOptions({{options}}); getElementById({{id}}).render();'
        }
    };
})(typeof window !== 'undefined' ? window : this);
