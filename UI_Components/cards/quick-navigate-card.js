(function (global) {
    'use strict';

    var DEFAULT_OPTIONS = {
        title: '',
        subtitle: '',
        subtitleHtml: '',
        items: [], // Array of { label, purpose, href, icon }
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

        var bodyClass = 'h-[' + opts.height + 'px] p-3 bg-white m-3 rounded-xl border border-gray-200 relative overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-1.5 premium-card-panel-body';

        var itemsHtml = (opts.items || []).map(function(item) {
            var iconHtml = item.icon 
                ? '<i class="' + item.icon + ' text-lg text-primary-500 mr-3 transition-colors"></i>' 
                : '<i class="bi bi-link-45deg text-lg text-gray-400 mr-3 group-hover:text-primary-500 transition-colors"></i>';
                
            return [
                '<a href="' + (item.href || '#') + '" class="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-primary-50 hover:border-primary-500/50 transition-colors cursor-pointer group">',
                '<div class="flex items-center">',
                iconHtml,
                '<div>',
                '<div class="text-sm font-semibold text-gray-800 group-hover:text-primary-500 transition-colors">' + (item.label || '') + '</div>',
                '<div class="text-xs text-gray-500">' + (item.purpose || '') + '</div>',
                '</div>',
                '</div>',
                '<i class="bi bi-chevron-right text-sm text-gray-300 group-hover:text-primary-500 transition-colors"></i>',
                '</a>'
            ].join('');
        }).join('');

        return [
            '<section class="premium-quick-nav-card-inner bg-gray-50 rounded-2xl border border-gray-200 shadow-sm w-full">',
            '<div class="pt-3 px-4 flex justify-between items-start">',
            '<div>',
            opts.title ? '<h3 class="text-lg font-bold text-gray-800">' + opts.title + '</h3>' : '',
            subtitle,
            '</div>',
            opts.showOptions ? '<button type="button" class="premium-card-options-btn text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-200/50" title="Options"><i class="bi bi-three-dots-vertical text-lg leading-none"></i></button>' : '',
            '</div>',
            '<div class="' + bodyClass + '">',
            itemsHtml,
            '</div>',
            '</section>'
        ].join('');
    }

    class PremiumQuickNavCard extends HTMLElement {
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
    }

    if (typeof window !== 'undefined' && window.customElements && !window.customElements.get('premium-quick-nav-card')) {
        window.customElements.define('premium-quick-nav-card', PremiumQuickNavCard);
    }

    global.PremiumQuickNavCard = PremiumQuickNavCard;
})(typeof window !== 'undefined' ? window : this);
