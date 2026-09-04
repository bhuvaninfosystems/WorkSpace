(function (global) {
    'use strict';

    var DEFAULT_OPTIONS = {
        title: '',
        subtitle: '',
        subtitleHtml: '',
        items: [], // Array of { label, value, caption, colorClass }
        height: 300,
        showOptions: false
    };

    function parseNum(val, fallback) {
        var n = Number(val);
        return Number.isFinite(n) ? n : fallback;
    }

    function buildCardHtml(opts) {
        var subtitle = '';
        if (opts.subtitleHtml) subtitle = '<p class="text-xs text-gray-500">' + opts.subtitleHtml + '</p>';
        else if (opts.subtitle) subtitle = '<p class="text-xs text-gray-500">' + opts.subtitle + '</p>';

        var bodyClass = 'h-[' + opts.height + 'px] p-4 bg-white m-3 rounded-xl border border-gray-200 relative overflow-y-auto premium-card-panel-body';

        var itemsHtml = '<div class="grid grid-cols-2 gap-3">';
        itemsHtml += (opts.items || []).map(function(item) {
            var color = item.colorClass || 'text-primary-600';
            var caption = item.caption ? '<div class="text-[0.65rem] text-gray-400 font-medium uppercase tracking-wider mt-1">' + item.caption + '</div>' : '';
            return [
                '<div class="flex flex-col items-center justify-center p-3 text-center rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all">',
                '<div class="text-sm font-semibold text-gray-700 mb-1">' + (item.label || '') + '</div>',
                '<div class="text-lg font-bold ' + color + '">' + (item.value || '') + '</div>',
                caption,
                '</div>'
            ].join('');
        }).join('');
        itemsHtml += '</div>';

        var overlay = global.CardPanelLoading && global.CardPanelLoading.overlayInnerHtml
            ? global.CardPanelLoading.overlayInnerHtml()
            : '';

        return [
            '<section class="premium-stat-grid-card-inner bg-gray-50 rounded-2xl border border-gray-200 shadow-sm w-full">',
            '<div class="pt-3 px-4 flex justify-between items-start">',
            '<div>',
            opts.title ? '<h3 class="text-lg font-bold text-gray-800">' + opts.title + '</h3>' : '',
            subtitle,
            '</div>',
            opts.showOptions ? '<button type="button" class="premium-card-options-btn text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-200/50" title="Options"><i class="bi bi-three-dots-vertical text-lg leading-none"></i></button>' : '',
            '</div>',
            '<div class="' + bodyClass + '">',
            itemsHtml,
            overlay,
            '</div>',
            '</section>'
        ].join('');
    }

    class PremiumStatGridCard extends HTMLElement {
        constructor() {
            super();
            this._options = Object.assign({}, DEFAULT_OPTIONS);
            this._rendered = false;
        }

        static get observedAttributes() {
            return ['title', 'subtitle', 'card-height', 'show-options'];
        }

        connectedCallback() {
            this.style.display = 'block';
            if (!this._rendered) {
                this._readAttributes();
                this.render();
            }
        }

        attributeChangedCallback(name, oldVal, newVal) {
            if (oldVal === newVal || !this.isConnected) return;
            this._readAttributes();
            if (this._rendered) this.render();
        }

        _readAttributes() {
            var self = this;
            function get(n, d) { var v = self.getAttribute(n); return v == null || v === '' ? d : v; }
            if (get('title', null) != null) this._options.title = get('title', '');
            if (get('subtitle', null) != null) this._options.subtitle = get('subtitle', '');
            if (get('card-height', null) != null) this._options.height = parseNum(get('card-height'), 300);
            if (get('show-options', null) != null) {
                var so = get('show-options');
                this._options.showOptions = so === 'true' || so === '';
            }
        }

        setOptions(options) {
            this._options = Object.assign({}, this._options, options || {});
            if (this.isConnected) this.render();
            return this;
        }

        setItems(items) {
            this._options.items = items || [];
            if (this.isConnected) this.render();
            return this;
        }

        render() {
            this.innerHTML = buildCardHtml(this._options);
            this._rendered = true;
            return this;
        }

        setLoading(active, message) {
            if (global.CardPanelLoading && global.CardPanelLoading.setLoadingOnHost) {
                global.CardPanelLoading.setLoadingOnHost(this, !!active, message);
            }
            return this;
        }
    }

    if (typeof window !== 'undefined' && window.customElements && !window.customElements.get('premium-stat-grid-card')) {
        window.customElements.define('premium-stat-grid-card', PremiumStatGridCard);
    }

    global.PremiumStatGridCard = PremiumStatGridCard;
})(typeof window !== 'undefined' ? window : this);
