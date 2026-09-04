/**
 * Premium Ageing Card — Receivables and payables ageing bucket visualisation.
 * Shows 0–30, 31–60, 61–90, and 90+ day buckets as colour-coded progress bars.
 *
 * Usage:
 *   <premium-ageing-card id="card-ageing" title="Ageing Analysis"></premium-ageing-card>
 *
 *   document.getElementById('card-ageing').setOptions({
 *     title: 'Ageing Analysis',
 *     subtitle: 'Invoice age distribution',
 *     receivables: { bucket_0_30: 120000, bucket_31_60: 80000, bucket_61_90: 40000, bucket_90_plus: 20000 },
 *     payables:    { bucket_0_30:  90000, bucket_31_60: 60000, bucket_61_90: 10000, bucket_90_plus:  5000 }
 *   });
 *   document.getElementById('card-ageing').setLoading(true, 'Loading…');
 */
(function (global) {
    'use strict';

    var BUCKET_COLORS = ['#16a34a', '#f59e0b', '#f97316', '#ef4444'];
    var BUCKET_LABELS = ['0–30 days', '31–60 days', '61–90 days', '90+ days'];
    var BUCKET_KEYS   = ['bucket_0_30', 'bucket_31_60', 'bucket_61_90', 'bucket_90_plus'];

    function formatINR(amount) {
        if (amount == null || isNaN(amount)) return '₹ 0';
        var n   = Math.round(Math.abs(amount));
        var neg = amount < 0;
        var s   = n.toString();
        var result;
        if (s.length <= 3) {
            result = s;
        } else {
            var last3 = s.slice(-3);
            var rem   = s.slice(0, -3);
            var parts = [];
            while (rem.length > 2) { parts.unshift(rem.slice(-2)); rem = rem.slice(0, -2); }
            if (rem) parts.unshift(rem);
            result = parts.join(',') + ',' + last3;
        }
        return (neg ? '₹ -' : '₹ ') + result;
    }

    function buildLegend() {
        var items = BUCKET_LABELS.map(function (lbl, i) {
            return (
                '<div class="flex items-center gap-1">' +
                '<div class="w-2 h-2 rounded-full" style="background:' + BUCKET_COLORS[i] + '"></div>' +
                '<span class="text-[10px] text-gray-400">' + lbl + '</span>' +
                '</div>'
            );
        }).join('');
        return '<div class="flex items-center gap-3 mb-3 flex-wrap">' + items + '</div>';
    }

    function buildSection(title, icon, iconCls, data) {
        data = data || {};
        var values  = BUCKET_KEYS.map(function (k) { return parseFloat(data[k]) || 0; });
        var total   = values.reduce(function (s, v) { return s + v; }, 0);
        var maxVal  = Math.max.apply(null, values) || 1;

        var bars = BUCKET_KEYS.map(function (k, i) {
            var pct = Math.round((values[i] / maxVal) * 100);
            return (
                '<div class="mb-2.5">' +
                '<div class="flex justify-between items-center mb-0.5">' +
                '<span class="text-[11px] text-gray-500">' + BUCKET_LABELS[i] + '</span>' +
                '<span class="text-[11px] font-semibold text-gray-700">' + formatINR(values[i]) + '</span>' +
                '</div>' +
                '<div class="w-full bg-gray-100 rounded-full h-1.5">' +
                '<div class="h-1.5 rounded-full" style="width:' + pct + '%;background:' + BUCKET_COLORS[i] + '"></div>' +
                '</div>' +
                '</div>'
            );
        }).join('');

        return (
            '<div>' +
            '<div class="flex items-center justify-between mb-2">' +
            '<div class="flex items-center gap-1.5">' +
            '<i class="bi ' + icon + ' text-sm ' + iconCls + '"></i>' +
            '<span class="text-xs font-bold text-gray-600 uppercase tracking-wide">' + title + '</span>' +
            '</div>' +
            '<span class="text-xs font-semibold text-gray-500">' + formatINR(total) + '</span>' +
            '</div>' +
            bars +
            '</div>'
        );
    }

    function buildHtml(opts) {
        opts = opts || {};
        var title    = opts.title    || 'Ageing Analysis';
        var subtitle = opts.subtitle || '';
        var overlay  = global.CardPanelLoading ? global.CardPanelLoading.overlayInnerHtml() : '';

        return (
            '<section class="premium-ageing-card-inner bg-gray-50 rounded-2xl border border-gray-200 shadow-sm w-full">' +
            '<div class="pt-3 px-4">' +
            '<h3 class="text-lg font-bold text-gray-800">' + title + '</h3>' +
            (subtitle ? '<p class="text-xs text-gray-500">' + subtitle + '</p>' : '') +
            '</div>' +
            '<div class="premium-card-panel-body premium-ageing-card-body bg-white m-3 rounded-xl border border-gray-200 relative overflow-y-auto p-4">' +
            overlay +
            buildLegend() +
            buildSection('Receivables', 'bi-arrow-down-circle', 'text-green-600', opts.receivables) +
            '<hr class="border-gray-100 my-3">' +
            buildSection('Payables', 'bi-arrow-up-circle', 'text-rose-500', opts.payables) +
            '</div>' +
            '</section>'
        );
    }

    class PremiumAgeingCard extends HTMLElement {
        constructor() {
            super();
            this._options = {};
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

        setOptions(opts) {
            this._options = Object.assign({}, this._options, opts || {});
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
                    title:    this.getAttribute('title')    || this._options.title    || 'Ageing Analysis',
                    subtitle: this.getAttribute('subtitle') || this._options.subtitle || ''
                },
                this._options
            );
            this.innerHTML = buildHtml(opts);
        }
    }

    if (!customElements.get('premium-ageing-card')) {
        customElements.define('premium-ageing-card', PremiumAgeingCard);
    }

})(typeof window !== 'undefined' ? window : this);
