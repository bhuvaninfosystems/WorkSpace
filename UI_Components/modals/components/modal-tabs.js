/**
 * Premium Modal Tabs — popup-only supplemental info tabs.
 *
 * Usage — Declarative (pure HTML, no JS required):
 *
 *   <premium-modal-tabs id="supplier-tabs" data-width="100%" data-height="300px">
 *     <template data-tab-id="contacts" data-tab-label="Contacts" data-tab-active="true">
 *       <div class="flex h-full flex-col gap-3 p-2">
 *         <premium-modal-grid id="my-grid" style="height:100%;"></premium-modal-grid>
 *       </div>
 *     </template>
 *     <template data-tab-id="terms" data-tab-label="Terms">
 *       <p>Terms content here</p>
 *     </template>
 *   </premium-modal-tabs>
 *
 * Usage — Programmatic:
 *   tabs.setItems([ { id: 'a', label: 'A', content: '<p>html</p>' } ]);
 *   tabs.render();
 *
 * IMPORTANT: When using custom elements (e.g. premium-modal-grid) inside tab content,
 * always use the declarative <template> approach above. The component stamps real DOM
 * nodes via cloneNode(), ensuring custom elements fully upgrade and grids can size
 * themselves once their tab becomes visible.
 */
(function (global) {
    'use strict';

    // ─────────────────────────────────────────────────────────────────
    // DEFAULT TABS (shown when no declarative/programmatic items given)
    // ─────────────────────────────────────────────────────────────────
    var DEFAULT_ITEMS = [
        {
            id: 'notes', label: 'Notes',
            content: [
                '<div class="space-y-3">',
                '  <div class="p-3 bg-primary-50/50 rounded-lg border border-primary-100/50">',
                '    <p class="text-xs font-semibold text-primary-800">System Note</p>',
                '    <p class="text-[13px] text-gray-600 mt-1">Please ensure all identity documents are verified before final approval.</p>',
                '  </div>',
                '  <p class="text-[13px] text-gray-400 italic">No additional user notes available for this record yet.</p>',
                '</div>'
            ].join('')
        },
        {
            id: 'history', label: 'History',
            content: [
                '<div class="flex items-start gap-4">',
                '  <div class="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0"></div>',
                '  <div>',
                '    <p class="text-xs font-bold text-gray-800">Lead Created</p>',
                '    <p class="text-[11px] text-gray-400">By System</p>',
                '  </div>',
                '</div>'
            ].join('')
        },
        {
            id: 'files', label: 'Assets',
            content: [
                '<div class="flex flex-col items-center justify-center h-full text-center">',
                '  <i class="bi bi-cloud-slash text-3xl text-gray-200 mb-2"></i>',
                '  <p class="text-xs font-bold text-gray-400">No Assets Linked</p>',
                '</div>'
            ].join('')
        }
    ];

    // ─────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────

    /**
     * Notify AG Grid instances inside an element to resize.
     * Called whenever a panel becomes visible so grids render at the correct size.
     */
    function notifyGridsInPanel(panelEl) {
        if (!panelEl) return;

        // 1. Dispatch a native resize event so grids with ResizeObservers re-layout.
        try { panelEl.dispatchEvent(new Event('resize', { bubbles: true })); } catch (e) { }

        // 2. Tell every premium-modal-grid inside the panel to call sizeColumnsToFit.
        var modalGrids = panelEl.querySelectorAll('premium-modal-grid');
        modalGrids.forEach(function (mg) {
            var api = mg._api || (typeof mg.getApi === 'function' ? mg.getApi() : null);
            if (!api) return;
            // Give the browser one frame to paint the panel at full size first.
            requestAnimationFrame(function () {
                if (typeof api.sizeColumnsToFit === 'function') api.sizeColumnsToFit();
                if (typeof api.setGridOption === 'function') {
                    // Force a model update so the viewport is correctly measured.
                    try { api.setGridOption('rowData', api.getGridOption ? api.getGridOption('rowData') : undefined); } catch (e) { }
                }
            });
        });

        // 3. Dispatch a custom event so page-level code can hook in if needed.
        panelEl.dispatchEvent(new CustomEvent('tab-shown', { bubbles: true }));
    }

    // ─────────────────────────────────────────────────────────────────
    // CUSTOM ELEMENT
    // ─────────────────────────────────────────────────────────────────
    class PremiumModalTabs extends HTMLElement {
        static get observedAttributes() {
            return ['data-width', 'data-height'];
        }

        constructor() {
            super();
            this._items = DEFAULT_ITEMS.slice();
            this._activeId = this._items[0].id;
            this._layout = { width: '100%', height: '250px' };
            this._isReady = false;
            // Stores parsed <template> nodes so we can clone real DOM, not just innerHTML strings.
            this._templateNodes = [];
        }

        connectedCallback() {
            this.style.display = 'block';
            // Defer so inner <template> nodes are fully parsed by the browser first.
            setTimeout(() => {
                this._parseDeclarativeItems();
                this._readLayout();
                this._isReady = true;
                this.render();
            }, 0);
        }

        attributeChangedCallback(name, oldValue, newValue) {
            if (oldValue === newValue) return;
            if (name === 'data-width' || name === 'data-height') {
                this._readLayout();
                if (this.isConnected && this._isReady) this.render();
            }
        }

        // ── Public API ───────────────────────────────────────────────

        setItems(items) {
            if (Array.isArray(items) && items.length) {
                this._items = items.slice();
                this._templateNodes = [];   // clear template cache when using programmatic mode
                this._activeId = this._items[0].id;
            }
        }

        setActive(id) {
            if (!id) return;
            var exists = this._items.some(function (item) { return item.id === id; });
            if (!exists) return;
            this._activeId = id;
            this._updateActive();
        }

        setLayout(options) {
            options = options || {};
            if (options.width) this._layout.width = String(options.width);
            if (options.height) this._layout.height = String(options.height);
            if (this.isConnected) this.render();
        }

        render() {
            // ── Build tab buttons ──
            var tabsHtml = this._items.map((item) => {
                var active = item.id === this._activeId;
                return [
                    '<button type="button" data-tab-btn="', item.id, '" class="tab-btn shrink-0 px-6 py-3 text-[11px] font-black uppercase tracking-wider border-b-2 transition-all duration-300 ',
                    active ? 'text-primary-600 border-primary-500' : 'text-gray-400 border-transparent hover:text-gray-600',
                    '">', item.label, '</button>'
                ].join('');
            }).join('');

            // ── Build outer shell (panels will be filled below) ──
            var panelPlaceholders = this._items.map((item) => {
                var active = item.id === this._activeId;
                return [
                    '<div data-tab-panel="', item.id, '" class="tab-panel absolute inset-0 overflow-y-auto custom-scrollbar transition-all duration-300 ',
                    active ? 'opacity-100' : 'hidden opacity-0',
                    '"></div>'
                ].join('');
            }).join('');

            this.innerHTML = [
                '<div class="flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white/30 backdrop-blur-sm" style="width:',
                this._layout.width, ';height:', this._layout.height, ';">',
                '  <div class="flex overflow-x-auto whitespace-nowrap bg-gray-50/50 border-b border-gray-100 no-scrollbar">', tabsHtml, '</div>',
                '  <div class="flex-1 relative min-h-0">', panelPlaceholders, '</div>',
                '</div>'
            ].join('');

            // ── Stamp real DOM content into each panel ──
            // Using cloneNode(true) instead of innerHTML so custom elements
            // (e.g. premium-modal-grid) are properly upgraded by the browser.
            var panels = this.querySelectorAll('[data-tab-panel]');
            var self = this;
            panels.forEach(function (panel) {
                var id = panel.getAttribute('data-tab-panel');
                var tplNode = self._templateNodes.find(function (t) { return t.id === id; });

                if (tplNode && tplNode.node) {
                    // Clone the <template>'s document fragment — preserves all child elements.
                    var clone = tplNode.node.content.cloneNode(true);
                    panel.appendChild(clone);
                } else {
                    // Fallback: programmatic items or no cached template (use innerHTML string).
                    var item = self._items.find(function (i) { return i.id === id; });
                    if (item) panel.innerHTML = item.content || '';
                }

                // Notify grids in the active panel immediately.
                if (id === self._activeId) {
                    setTimeout(function () { notifyGridsInPanel(panel); }, 50);
                }
            });

            this._bindEvents();
        }

        // ── Private ──────────────────────────────────────────────────

        _parseDeclarativeItems() {
            var templates = Array.from(this.querySelectorAll('template[data-tab-id]'));
            if (!templates.length) return;

            var parsed = [];
            var cachedNodes = [];
            var activeId = null;

            templates.forEach(function (tpl) {
                var id = tpl.getAttribute('data-tab-id');
                var label = tpl.getAttribute('data-tab-label') || id;
                if (!id) return;

                parsed.push({ id: id, label: label, content: '' });
                // Keep a reference to the <template> element itself so render() can clone it.
                cachedNodes.push({ id: id, node: tpl });

                var isActive = tpl.getAttribute('data-tab-active');
                if (isActive === 'true' || isActive === '' || isActive === '1') {
                    activeId = id;
                }
            });

            if (!parsed.length) return;
            this._items = parsed;
            this._templateNodes = cachedNodes;
            this._activeId = activeId || parsed[0].id;
        }

        _readLayout() {
            var width = this.getAttribute('data-width');
            var height = this.getAttribute('data-height');
            this._layout.width = width && width.trim() ? width.trim() : '100%';
            this._layout.height = height && height.trim() ? height.trim() : '250px';
        }

        _bindEvents() {
            var buttons = this.querySelectorAll('[data-tab-btn]');
            buttons.forEach((btn) => {
                btn.addEventListener('click', () => {
                    this.setActive(btn.getAttribute('data-tab-btn'));
                });
            });
        }

        _updateActive() {
            var self = this;
            var buttons = this.querySelectorAll('[data-tab-btn]');
            var panels = this.querySelectorAll('[data-tab-panel]');

            buttons.forEach((btn) => {
                var active = btn.getAttribute('data-tab-btn') === this._activeId;
                btn.classList.toggle('text-primary-600', active);
                btn.classList.toggle('border-primary-500', active);
                btn.classList.toggle('text-gray-400', !active);
                btn.classList.toggle('border-transparent', !active);
            });

            panels.forEach((panel) => {
                var active = panel.getAttribute('data-tab-panel') === this._activeId;
                if (active) {
                    panel.classList.remove('hidden', 'opacity-0');
                    panel.classList.add('opacity-100');
                    // Notify grids now that this panel is visible.
                    setTimeout(function () { notifyGridsInPanel(panel); }, 30);
                } else {
                    panel.classList.remove('opacity-100');
                    panel.classList.add('opacity-0');
                    setTimeout(function () {
                        if (panel.getAttribute('data-tab-panel') !== self._activeId) {
                            panel.classList.add('hidden');
                        }
                    }, 300);
                }
            });
        }
    }

    if (typeof window !== 'undefined' && window.customElements && !window.customElements.get('premium-modal-tabs')) {
        window.customElements.define('premium-modal-tabs', PremiumModalTabs);
    }
})(typeof window !== 'undefined' ? window : this);
