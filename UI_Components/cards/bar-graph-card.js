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
 * Premium Bar Graph Card — Chart.js bar chart with title, subtitle, and canvas area.
 * Requires Chart.js (window.Chart) loaded before this script.
 *
 *   <premium-bar-graph-card
 *     id="chart-task-volume"
 *     class="col-span-12 xl:col-span-8"
 *     title="Task volume trend"
 *     chart-height="280"
 *     aria-label="Task volume bar chart">
 *   </premium-bar-graph-card>
 *
 *   document.getElementById('chart-task-volume').setOptions({
 *     subtitleHtml: 'Tasks created by <span>task date</span> (last 7 days).',
 *     labels: ['01-05-2026'],
 *     data: [3],
 *     datasetLabel: 'Tasks'
 *   });
 */
(function (global) {
    'use strict';

    var DEFAULT_OPTIONS = {
        title: '',
        subtitle: '',
        subtitleHtml: '',
        labels: [],
        data: [],
        datasets: null,
        datasetLabel: 'Series',
        backgroundColor: '#FC3231',
        borderRadius: 4,
        maxBarThickness: 44,
        height: 280,
        canvasClass: '',
        chartOptions: null,
        ariaLabel: 'Bar chart',
        showOptions: false
    };

    function parseNum(val, fallback) {
        var n = Number(val);
        return Number.isFinite(n) ? n : fallback;
    }

    function mergeDeep(target, source) {
        if (!source || typeof source !== 'object') return target;
        Object.keys(source).forEach(function (key) {
            var sv = source[key];
            if (sv && typeof sv === 'object' && !Array.isArray(sv) && typeof sv !== 'function') {
                if (!target[key] || typeof target[key] !== 'object') target[key] = {};
                mergeDeep(target[key], sv);
            } else {
                target[key] = sv;
            }
        });
        return target;
    }

    function defaultBarOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(148, 163, 184, 0.25)' } }
            }
        };
    }

    function buildChartData(opts) {
        if (opts.datasets && opts.datasets.length) {
            return { labels: opts.labels || [], datasets: opts.datasets };
        }
        return {
            labels: opts.labels || [],
            datasets: [{
                label: opts.datasetLabel || DEFAULT_OPTIONS.datasetLabel,
                data: opts.data || [],
                backgroundColor: opts.backgroundColor || '#FC3231',
                borderRadius: opts.borderRadius !== undefined ? opts.borderRadius : DEFAULT_OPTIONS.borderRadius,
                maxBarThickness: opts.maxBarThickness != null ? opts.maxBarThickness : 44
            }]
        };
    }

    function createChartInstance(canvas, opts) {
        if (!canvas || !global.Chart) {
            console.warn('PremiumBarGraphCard: Chart.js (window.Chart) is required.');
            return null;
        }
        var baseOpts = defaultBarOptions();
        var chartOpts = opts.chartOptions
            ? mergeDeep(JSON.parse(JSON.stringify(baseOpts)), opts.chartOptions)
            : baseOpts;

        return new global.Chart(canvas, {
            type: 'bar',
            data: buildChartData(opts),
            options: chartOpts
        });
    }

    function updateChartInstance(chart, opts) {
        if (!chart) return;
        chart.data = buildChartData(opts);
        chart.update();
    }

    function buildCardHtml(opts, canvasId) {
        var height = parseNum(opts.height, 280);
        var bodyClass = 'h-[' + height + 'px] p-4 bg-white m-3 rounded-xl border border-gray-200 relative premium-card-panel-body';
        var overlay = global.CardPanelLoading && global.CardPanelLoading.overlayInnerHtml
            ? global.CardPanelLoading.overlayInnerHtml()
            : '';
        var canvasClass = opts.canvasClass ? (' ' + opts.canvasClass) : '';
        var subtitle = '';
        if (opts.subtitleHtml) {
            subtitle = '<p class="text-xs text-gray-500">' + opts.subtitleHtml + '</p>';
        } else if (opts.subtitle) {
            subtitle = '<p class="text-xs text-gray-500">' + opts.subtitle + '</p>';
        }

        return [
            '<section class="premium-bar-graph-card-inner bg-gray-50 rounded-2xl border border-gray-200 shadow-sm w-full">',
            '<div class="pt-3 px-4 flex justify-between items-start">',
            '<div>',
            opts.title ? '<h3 class="text-lg font-bold text-gray-800">' + opts.title + '</h3>' : '',
            subtitle,
            '</div>',
            opts.showOptions ? '<button type="button" class="premium-card-options-btn text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-200/50" title="Options"><i class="bi bi-three-dots-vertical text-lg leading-none"></i></button>' : '',
            '</div>',
            '<div class="' + bodyClass + '">',
            '<canvas id="' + canvasId + '" class="w-full h-full' + canvasClass + '" aria-label="' + (opts.ariaLabel || 'Bar chart') + '"></canvas>',
            overlay,
            '</div>',
            '</section>'
        ].join('');
    }

    class PremiumBarGraphCard extends HTMLElement {
        constructor() {
            super();
            this._options = Object.assign({}, DEFAULT_OPTIONS);
            this._chart = null;
            this._canvasId = null;
            this._rendered = false;
        }

        static get observedAttributes() {
            return ['title', 'subtitle', 'chart-height', 'aria-label', 'dataset-label', 'show-options'];
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
            if (this._rendered) {
                this._syncHeader();
                this._refreshChart();
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
            if (get('chart-height', null) != null) this._options.height = parseNum(get('chart-height'), 280);
            if (get('aria-label', null) != null) this._options.ariaLabel = get('aria-label', 'Bar chart');
            if (get('dataset-label', null) != null) this._options.datasetLabel = get('dataset-label', 'Series');
            if (get('show-options', null) != null) {
                var so = get('show-options');
                this._options.showOptions = so === 'true' || so === '';
            }
        }

        _canvasIdForHost() {
            if (!this._canvasId) {
                this._canvasId = 'bar-graph-canvas-' + Math.random().toString(36).slice(2, 10);
            }
            return this._canvasId;
        }

        _syncHeader() {
            var header = this.querySelector('.premium-bar-graph-card-inner .pt-3');
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

        setOptions(options) {
            this._options = Object.assign({}, this._options, options || {});
            if (this.isConnected) {
                if (!this._rendered) this.render();
                else this._refreshChart();
            }
            return this;
        }

        updateData(labels, data) {
            this._options.labels = labels || [];
            this._options.data = data || [];
            this._refreshChart();
            return this;
        }

        getChart() {
            return this._chart;
        }

        setLoading(active, message) {
            if (global.CardPanelLoading && global.CardPanelLoading.setLoadingOnHost) {
                global.CardPanelLoading.setLoadingOnHost(this, !!active, message);
            }
            return this;
        }

        destroyChart() {
            if (this._chart) {
                this._chart.destroy();
                this._chart = null;
            }
        }

        render() {
            var canvasId = this._canvasIdForHost();
            this.innerHTML = buildCardHtml(this._options, canvasId);
            var canvas = this.querySelector('#' + canvasId);
            this.destroyChart();
            this._chart = createChartInstance(canvas, this._options);
            this._rendered = true;
            return this;
        }

        _refreshChart() {
            if (!this._rendered) {
                this.render();
                return;
            }
            this._syncHeader();
            var canvas = this.querySelector('canvas');
            if (!canvas) return;
            if (!this._chart) {
                this._chart = createChartInstance(canvas, this._options);
                return;
            }
            updateChartInstance(this._chart, this._options);
        }
    }

    function render(container, options) {
        var host = typeof container === 'string' ? document.querySelector(container) : container;
        if (!host) {
            console.error('BarGraphCard.render: container not found', container);
            return null;
        }

        var el = document.createElement('premium-bar-graph-card');
        if (options && options.id) el.id = options.id;
        if (options && options.className) el.className = options.className;
        host.innerHTML = '';
        host.appendChild(el);

        el.setOptions(options || {});
        el.render();

        return {
            element: el,
            setOptions: function (opts) { el.setOptions(opts); return this; },
            updateData: function (labels, data) { el.updateData(labels, data); return this; },
            getChart: function () { return el.getChart(); },
            destroy: function () { el.destroyChart(); }
        };
    }

    if (typeof window !== 'undefined' && window.customElements && !window.customElements.get('premium-bar-graph-card')) {
        window.customElements.define('premium-bar-graph-card', PremiumBarGraphCard);
    }

    global.BarGraphCard = { render: render };
    global.PremiumBarGraphCard = PremiumBarGraphCard;
})(typeof window !== 'undefined' ? window : this);
