/**
 * Premium Nav Card — Quick-navigate link card with icon badges and descriptions.
 * Supports href-based navigation and event-based (non-link) navigation.
 *
 * Usage:
 *   <premium-nav-card id="card-quick-nav" title="Quick Navigate"></premium-nav-card>
 *
 *   document.getElementById('card-quick-nav').setOptions({
 *     title: 'Quick Navigate',
 *     subtitle: 'Jump to any module',
 *     items: [
 *       { icon: 'bi-book',   label: 'General Ledger', description: 'Account-wise view', href: 'GeneralLedger.html' },
 *       { icon: 'bi-cart3',  label: 'Purchase Orders', description: 'PO pipeline',      href: 'PurchaseOrder.html' }
 *     ]
 *   });
 *
 * For non-link items (no href), the element dispatches a 'premium-nav-click' CustomEvent
 * with detail: { label: string }.
 */
(function (global) {
    'use strict';

    var PALETTE = [
        { bg: 'rgba(59,130,246,0.1)',  icon: '#3b82f6' },
        { bg: 'rgba(22,163,74,0.1)',   icon: '#16a34a' },
        { bg: 'rgba(249,115,22,0.1)',  icon: '#f97316' },
        { bg: 'rgba(139,92,246,0.1)',  icon: '#8b5cf6' },
        { bg: 'rgba(99,102,241,0.1)',  icon: '#6366f1' },
        { bg: 'rgba(20,184,166,0.1)',  icon: '#14b8a6' },
        { bg: 'rgba(245,158,11,0.1)',  icon: '#f59e0b' },
        { bg: 'rgba(239,68,68,0.1)',   icon: '#ef4444' }
    ];

    function buildItem(item, idx) {
        var c    = PALETTE[idx % PALETTE.length];
        var tag  = item.href ? 'a' : 'div';
        var href = item.href ? (' href="' + item.href + '"') : '';
        var role = item.href ? '' : ' role="button" tabindex="0"';
        var data = item.href ? '' : (' data-nav-label="' + (item.label || '') + '"');

        return (
            '<' + tag + href + role + data +
            ' class="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer group border-b border-gray-50 last:border-b-0">' +
            '<div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style="background:' + c.bg + '">' +
            '<i class="bi ' + (item.icon || 'bi-link') + ' text-sm" style="color:' + c.icon + '"></i>' +
            '</div>' +
            '<div class="flex-1 min-w-0">' +
            '<p class="text-sm font-semibold text-gray-700 group-hover:text-gray-900 truncate">' + (item.label || '') + '</p>' +
            (item.description ? '<p class="text-[11px] text-gray-400 truncate">' + item.description + '</p>' : '') +
            '</div>' +
            '<i class="bi bi-chevron-right text-xs text-gray-300 group-hover:text-gray-500 flex-shrink-0"></i>' +
            '</' + tag + '>'
        );
    }

    function buildHtml(opts, items) {
        opts  = opts  || {};
        items = items || [];
        var title    = opts.title    || 'Quick Navigate';
        var subtitle = opts.subtitle || '';
        var overlay  = global.CardPanelLoading ? global.CardPanelLoading.overlayInnerHtml() : '';

        return (
            '<section class="premium-nav-card-inner bg-gray-50 rounded-2xl border border-gray-200 shadow-sm w-full">' +
            '<div class="pt-3 px-4">' +
            '<h3 class="text-lg font-bold text-gray-800">' + title + '</h3>' +
            (subtitle ? '<p class="text-xs text-gray-500">' + subtitle + '</p>' : '') +
            '</div>' +
            '<div class="premium-card-panel-body premium-nav-card-body bg-white m-3 rounded-xl border border-gray-200 relative overflow-y-auto">' +
            overlay +
            items.map(function (it, i) { return buildItem(it, i); }).join('') +
            '</div>' +
            '</section>'
        );
    }

    class PremiumNavCard extends HTMLElement {
        constructor() {
            super();
            this._options = {};
            this._items   = [];
        }

        static get observedAttributes() { return ['title', 'subtitle']; }

        connectedCallback() {
            this.style.display = 'block';
            this._render();
        }

        attributeChangedCallback(name, oldVal, newVal) {
            if (oldVal === newVal || !this.isConnected) return;
            this._options[name] = newVal;
            this._render();
        }

        setItems(items) {
            this._items = items || [];
            this._render();
        }

        setOptions(opts) {
            this._options = Object.assign({}, this._options, opts || {});
            if (opts && opts.items) this._items = opts.items;
            this._render();
        }

        setLoading(active, message) {
            if (global.CardPanelLoading) {
                global.CardPanelLoading.setLoading(this.querySelector('.premium-card-panel-body'), active, message);
            }
        }

        _render() {
            var opts = Object.assign(
                {
                    title:    this.getAttribute('title')    || this._options.title    || 'Quick Navigate',
                    subtitle: this.getAttribute('subtitle') || this._options.subtitle || ''
                },
                this._options
            );
            this.innerHTML = buildHtml(opts, this._items);

            var self = this;
            this.querySelectorAll('[data-nav-label]').forEach(function (el) {
                el.addEventListener('click', function () {
                    self.dispatchEvent(new CustomEvent('premium-nav-click', {
                        bubbles: true,
                        detail: { label: el.getAttribute('data-nav-label') }
                    }));
                });
                el.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
                });
            });
        }
    }

    if (!customElements.get('premium-nav-card')) {
        customElements.define('premium-nav-card', PremiumNavCard);
    }

})(typeof window !== 'undefined' ? window : this);
