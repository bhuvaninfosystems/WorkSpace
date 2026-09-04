/** Built-in card loading overlay (shared across dashboard cards; defined once). */
(function (global) {
    'use strict';
    if (global.CardPanelLoading) return;

    var STYLE_ID = 'premium-card-loading-styles';
    var DEFAULT_MESSAGE = 'Loading…';
    var CSS = [
        '@keyframes premium-card-loading-spin { to { transform: rotate(360deg); } }',
        '.premium-card-panel-body { position: relative; }',
        '.premium-card-loading-overlay {',
        '  position: absolute; inset: 0; z-index: 20; display: none;',
        '  align-items: center; justify-content: center; flex-direction: column; gap: 0.5rem;',
        '  border-radius: inherit; background: rgba(255, 255, 255, 0.88);',
        '  backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);',
        '}',
        '.premium-card-loading-overlay.is-active { display: flex; }',
        '.premium-card-loading-spinner {',
        '  width: 26px; height: 26px; border-radius: 9999px;',
        '  border: 2px solid rgba(18, 84, 162, 0.2); border-top-color: #1254A2;',
        '  animation: premium-card-loading-spin 0.65s linear infinite;',
        '}',
        '.premium-card-loading-label {',
        '  font-size: 0.75rem; font-weight: 600; color: #64748b; letter-spacing: 0.02em;',
        '}'
    ].join('\n');

    function injectStylesOnce() {
        if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
        var st = document.createElement('style');
        st.id = STYLE_ID;
        st.textContent = CSS;
        (document.head || document.documentElement).appendChild(st);
    }

    function overlayInnerHtml() {
        return (
            '<div data-card-loading-overlay class="premium-card-loading-overlay" role="status" aria-live="polite" aria-busy="false">' +
            '<div class="premium-card-loading-spinner" aria-hidden="true"></div>' +
            '<span class="premium-card-loading-label" data-card-loading-label>' + DEFAULT_MESSAGE + '</span>' +
            '</div>'
        );
    }

    function setLoading(bodyEl, active, message) {
        if (!bodyEl) return;
        injectStylesOnce();
        var overlay = bodyEl.querySelector('[data-card-loading-overlay]');
        if (!overlay) return;
        var label = overlay.querySelector('[data-card-loading-label]');
        if (message != null && label) label.textContent = String(message);
        else if (!active && label) label.textContent = DEFAULT_MESSAGE;
        if (active) {
            overlay.classList.add('is-active');
            overlay.setAttribute('aria-busy', 'true');
        } else {
            overlay.classList.remove('is-active');
            overlay.setAttribute('aria-busy', 'false');
        }
    }

    function setLoadingOnHost(host, active, message) {
        if (!host || !host.querySelector) return;
        setLoading(host.querySelector('.premium-card-panel-body'), active, message);
    }

    function resolveHost(host) {
        if (!host) return null;
        if (typeof host === 'string') return document.querySelector(host);
        return host;
    }

    global.CardPanelLoading = {
        overlayInnerHtml: overlayInnerHtml,
        setLoading: setLoading,
        setLoadingOnHost: setLoadingOnHost,
        injectStyles: injectStylesOnce
    };

    global.PremiumCardLoading = {
        show: function (host, message) { setLoadingOnHost(resolveHost(host), true, message); },
        hide: function (host) { setLoadingOnHost(resolveHost(host), false); }
    };
})(typeof window !== 'undefined' ? window : this);

/**
 * Premium Modal Grid Card — titled card shell with embedded premium-modal-grid.
 * Requires modal-grid.js (premium-modal-grid) and ag-grid-community loaded first.
 *
 *   <premium-modal-grid-card
 *     id="recent-tasks-grid"
 *     class="col-span-12 lg:col-span-8"
 *     title="Recent Tasks"
 *     subtitle="Latest by task date (newest first)."
 *     grid-height="320">
 *   </premium-modal-grid-card>
 *
 *   document.getElementById('recent-tasks-grid').setOptions({
 *     columns: [...],
 *     rowData: [],
 *     rowHeight: 42,
 *     headerHeight: 42
 *   });
 *   document.getElementById('recent-tasks-grid').render();
 *   document.getElementById('recent-tasks-grid').setRowData(rows);
 */
(function (global) {
    'use strict';

    var DEFAULT_OPTIONS = {
        title: '',
        subtitle: '',
        subtitleHtml: '',
        columns: [],
        rowData: [],
        rowHeight: 45,
        headerHeight: 45,
        gridHeight: 320,
        floatingFilter: false,
        gridOptions: null,
        showOptions: false
    };

    function parseNum(val, fallback) {
        var n = Number(val);
        return Number.isFinite(n) ? n : fallback;
    }

    function buildCardHtml(opts) {
        var subtitle = '';
        if (opts.subtitleHtml) {
            subtitle = '<p class="text-xs text-gray-500">' + opts.subtitleHtml + '</p>';
        } else if (opts.subtitle) {
            subtitle = '<p class="text-xs text-gray-500">' + opts.subtitle + '</p>';
        }

        return [
            '<section class="premium-modal-grid-card-inner bg-gray-50 rounded-2xl border border-gray-200 shadow-sm w-full">',
            '<div class="pt-3 px-4 flex justify-between items-start">',
            '<div>',
            opts.title ? '<h3 class="text-lg font-bold text-gray-800">' + opts.title + '</h3>' : '',
            subtitle,
            '</div>',
            opts.showOptions ? '<button type="button" class="premium-card-options-btn text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-200/50" title="Options"><i class="bi bi-three-dots-vertical text-lg leading-none"></i></button>' : '',
            '</div>',
            '<div class="bg-white m-3 rounded-xl border border-gray-200 premium-modal-grid-card-body premium-card-panel-body relative">',
            '</div>',
            '</section>'
        ].join('');
    }

    class PremiumModalGridCard extends HTMLElement {
        constructor() {
            super();
            this._options = Object.assign({}, DEFAULT_OPTIONS);
            this._innerGrid = null;
            this._shellBuilt = false;
        }

        static get observedAttributes() {
            return ['title', 'subtitle', 'grid-height', 'show-options'];
        }

        connectedCallback() {
            this.style.display = 'block';
            this._readAttributes();
            if (!this._shellBuilt) {
                this._buildShell();
            }
        }

        attributeChangedCallback(name, oldVal, newVal) {
            if (oldVal === newVal || !this.isConnected) return;
            this._readAttributes();
            this._syncHeader();
            if (this._innerGrid) {
                this._applyGridHeight();
            }
        }

        _readAttributes() {
            var self = this;
            function get(n, d) {
                var v = self.getAttribute(n);
                return v == null || v === '' ? d : v;
            }
            if (get('title', null) != null) this._options.title = get('title', '');
            if (get('subtitle', null) != null) {
                this._options.subtitle = get('subtitle', '');
                this._options.subtitleHtml = '';
            }
            if (get('grid-height', null) != null) {
                this._options.gridHeight = parseNum(get('grid-height'), 320);
            }
            if (get('show-options', null) != null) {
                var so = get('show-options');
                this._options.showOptions = so === 'true' || so === '';
            }
        }

        _buildShell() {
            this.innerHTML = buildCardHtml(this._options);
            var body = this.querySelector('.premium-modal-grid-card-body');
            if (!body) return;

            var gridEl = document.createElement('premium-modal-grid');
            gridEl.className = 'w-full block';
            body.appendChild(gridEl);
            if (global.CardPanelLoading && global.CardPanelLoading.overlayInnerHtml) {
                body.insertAdjacentHTML('beforeend', global.CardPanelLoading.overlayInnerHtml());
            }
            this._innerGrid = gridEl;
            this._shellBuilt = true;
            this._applyGridHeight();
        }

        _applyGridHeight() {
            if (!this._innerGrid) return;
            var h = parseNum(this._options.gridHeight, 320);
            this._innerGrid.style.height = h + 'px';
        }

        _syncHeader() {
            var header = this.querySelector('.premium-modal-grid-card-inner .pt-3');
            if (!header) return;

            var textContainer = header.querySelector('div');
            if (!textContainer) return;

            var h3 = textContainer.querySelector('h3');
            if (this._options.title) {
                if (!h3) {
                    h3 = document.createElement('h3');
                    h3.className = 'text-lg font-bold text-gray-800';
                    textContainer.insertBefore(h3, textContainer.firstChild);
                }
                h3.textContent = this._options.title;
            } else if (h3) {
                h3.remove();
            }

            var p = textContainer.querySelector('p.text-xs');
            if (this._options.subtitleHtml || this._options.subtitle) {
                if (!p) {
                    p = document.createElement('p');
                    p.className = 'text-xs text-gray-500';
                    textContainer.appendChild(p);
                }
                if (this._options.subtitleHtml) p.innerHTML = this._options.subtitleHtml;
                else p.textContent = this._options.subtitle;
            } else if (p) {
                p.remove();
            }

            var btn = header.querySelector('.premium-card-options-btn');
            if (this._options.showOptions) {
                if (!btn) {
                    btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'premium-card-options-btn text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-200/50';
                    btn.title = 'Options';
                    btn.innerHTML = '<i class="bi bi-three-dots-vertical text-lg leading-none"></i>';
                    header.appendChild(btn);
                }
            } else if (btn) {
                btn.remove();
            }
        }

        _gridOptionsPayload() {
            var o = this._options;
            return {
                columns: o.columns || [],
                rowData: o.rowData || [],
                rowHeight: o.rowHeight,
                headerHeight: o.headerHeight,
                floatingFilter: o.floatingFilter,
                gridOptions: o.gridOptions
            };
        }

        setOptions(options) {
            this._options = Object.assign({}, this._options, options || {});
            if (!this._shellBuilt && this.isConnected) {
                this._buildShell();
            }
            if (this._innerGrid && typeof this._innerGrid.setOptions === 'function') {
                this._innerGrid.setOptions(this._gridOptionsPayload());
            }
            return this;
        }

        render() {
            if (!this._shellBuilt) {
                this._readAttributes();
                this._buildShell();
            }
            this._syncHeader();
            this._applyGridHeight();
            if (!this._innerGrid || typeof this._innerGrid.setOptions !== 'function') {
                console.warn('PremiumModalGridCard: premium-modal-grid child is required.');
                return null;
            }
            this._innerGrid.setOptions(this._gridOptionsPayload());
            return this._innerGrid.render();
        }

        setRowData(rowData) {
            if (!this._innerGrid) return this;
            this._options.rowData = rowData || [];
            if (typeof this._innerGrid.setRowData === 'function') {
                this._innerGrid.setRowData(this._options.rowData);
                return this;
            }
            var api = this.getApi();
            if (api && typeof api.setGridOption === 'function') {
                api.setGridOption('rowData', this._options.rowData);
            }
            return this;
        }

        getApi() {
            return this._innerGrid && typeof this._innerGrid.getApi === 'function'
                ? this._innerGrid.getApi()
                : null;
        }

        getGrid() {
            return this._innerGrid;
        }

        setLoading(active, message) {
            if (global.CardPanelLoading && global.CardPanelLoading.setLoadingOnHost) {
                global.CardPanelLoading.setLoadingOnHost(this, !!active, message);
            }
            return this;
        }
    }

    function render(container, options) {
        var host = typeof container === 'string' ? document.querySelector(container) : container;
        if (!host) {
            console.error('ModalGridCard.render: container not found', container);
            return null;
        }

        var el = document.createElement('premium-modal-grid-card');
        if (options && options.id) el.id = options.id;
        if (options && options.className) el.className = options.className;
        host.innerHTML = '';
        host.appendChild(el);

        el.setOptions(options || {});
        el.render();

        return {
            element: el,
            setOptions: function (opts) { el.setOptions(opts); return this; },
            render: function () { el.render(); return this; },
            setRowData: function (rows) { el.setRowData(rows); return this; },
            getApi: function () { return el.getApi(); },
            getGrid: function () { return el.getGrid(); }
        };
    }

    if (typeof window !== 'undefined' && window.customElements && !window.customElements.get('premium-modal-grid-card')) {
        window.customElements.define('premium-modal-grid-card', PremiumModalGridCard);
    }

    global.ModalGridCard = { render: render };
    global.PremiumModalGridCard = PremiumModalGridCard;
})(typeof window !== 'undefined' ? window : this);
