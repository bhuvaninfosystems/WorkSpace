/**
 * KPI Manager — Reusable KPI cards with premium styling.
 * 
 * Usage:
 *  1. Include this script: <script src="UI_Components/widgets/kpi-manager.js"></script>
 *  2. Add to HTML: <premium-kpi-manager id="kpi-container"></premium-kpi-manager>
 *  3. Initialize in JS:
 *     document.getElementById('kpi-container').setCards([
 *       { id: 'new-leads', label: 'New Leads', value: '42', icon: 'bi-person-plus' },
 *       { id: 'revenue', label: 'Revenue', value: '$12.5k', icon: 'bi-currency-dollar' }
 *     ]);
 *  4. Update values:
 *     document.getElementById('kpi-container').setValue('new-leads', '50');
 */

(function (global) {
    'use strict';

    class PremiumKpiManager extends HTMLElement {
        constructor() {
            super();
            this.cards = [];
            this.hideOnMobile = false;
            this.mobileTitle = '';
            this.containerClass = 'grid grid-cols-2 sm:grid-cols-4 w-full border-b border-gray-300';
        }

        connectedCallback() {
            this.render();
        }

        setCards(cards) {
            this.cards = cards || [];
            this.render();
        }

        setValue(id, value) {
            var valEl = this.querySelector('#kpi-val-' + id);
            if (valEl) valEl.textContent = value;
        }

        setValues(data) {
            var self = this;
            Object.keys(data).forEach(function (id) {
                self.setValue(id, data[id]);
            });
        }

        buildCardHTML(card, index, total) {
            var customBorder = '';
            if (index === 0) customBorder = 'border-r border-b sm:border-b-0';
            else if (index === 1) customBorder = 'sm:border-r border-b sm:border-b-0';
            else if (index === 2) customBorder = 'border-r';
            else if (index === 3) customBorder = '';

            return `
                <div class="kpi-card h-20 sm:h-24 ${customBorder} border-gray-300 bg-white p-3 sm:p-5 flex flex-col justify-center group hover:bg-gray-50/50 min-w-0">
                    <div class="flex justify-between items-center w-full gap-2 sm:gap-4 min-w-0">
                        <div class="min-w-0 flex-1">
                            <div class="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider truncate" title="${card.label}">${card.label}</div>
                            <div class="flex items-center gap-2 mt-0.5 sm:mt-1 min-w-0">
                                <h3 class="text-2xl sm:text-3xl font-semibold text-gray-800 truncate" id="kpi-val-${card.id}">${card.value}</h3>
                            </div>
                        </div>
                        <div class="flex flex-shrink-0 w-9 h-9 sm:w-12 sm:h-12 bg-secondary-100 text-secondary-500 border border-secondary-500 sm:rounded-2xl rounded-xl items-center justify-center">
                            <i class="${card.icon} text-base sm:text-xl"></i>
                        </div>
                    </div>
                </div>`;
        }

        cleanDocumentTitle() {
            var t = String(document.title || '').trim();
            if (!t) return '';
            if (t.indexOf('—') !== -1) t = t.split('—')[0].trim();
            if (t.indexOf('-') !== -1) t = t.split('-')[0].trim();
            return t;
        }

        render() {
            if (this.cards.length === 0) {
                this.innerHTML = '';
                return;
            }

            var mobileTitle = this.mobileTitle || this.cleanDocumentTitle();
            var mobileTitleBlock = '';
            var cardsWrapperClass = this.containerClass;

            if (this.hideOnMobile) {
                mobileTitleBlock =
                    '<div class="block sm:hidden px-4 py-3 border-b border-gray-200 bg-white">' +
                    '  <h2 class="text-xl font-bold text-gray-800">' + (mobileTitle || 'Dashboard') + '</h2>' +
                    '</div>';
                cardsWrapperClass += ' hidden sm:grid';
            }

            var self = this;
            var cardsHTML = this.cards.map(function (card, i) {
                return self.buildCardHTML(card, i, self.cards.length);
            }).join('');

            this.innerHTML =
                mobileTitleBlock +
                '<div class="' + cardsWrapperClass + '">' +
                cardsHTML +
                '</div>';
        }
    }

    if (typeof window !== 'undefined' && window.customElements && !window.customElements.get('premium-kpi-manager')) {
        window.customElements.define('premium-kpi-manager', PremiumKpiManager);
    }

    // Fallback/Legacy API to not break existing pages
    global.KPIManager = {
        render: function (selector, options) {
            var container = document.querySelector(selector);
            if (!container) {
                console.error('KPIManager: container not found', selector);
                return null;
            }

            var el = document.createElement('premium-kpi-manager');
            container.innerHTML = '';
            container.appendChild(el);

            if (options && options.hideOnMobile !== undefined) {
                el.hideOnMobile = options.hideOnMobile;
            }
            if (options && options.mobileTitle !== undefined) {
                el.mobileTitle = options.mobileTitle;
            }

            el.setCards(options ? (options.cards || []) : []);

            return {
                setValue: function (id, value) {
                    el.setValue(id, value);
                },
                setValues: function (data) {
                    el.setValues(data);
                }
            };
        }
    };

})(typeof window !== 'undefined' ? window : this);
