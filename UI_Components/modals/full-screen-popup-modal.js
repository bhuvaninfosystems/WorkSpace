/**
 * Premium Full-Screen Popup Modal — covers the entire main content canvas (KPI + grid area).
 *
 * Same behavioral API as popup-modal.js (modes, validation, footer, freeze, loading).
 * Visually fills the host layout edge-to-edge instead of a centered card dialog.
 *
 * Requires: popup-modal.js loaded first (extends PremiumPopupModal).
 *
 * Usage:
 * <main id="main-canvas" class="relative flex flex-1 flex-col overflow-hidden">
 *   <premium-fullscreen-popup-modal id="workspace-modal" data-title="Add Account">
 *     <template data-modal-body>…</template>
 *   </premium-fullscreen-popup-modal>
 *   <div class="relative flex h-full flex-col"> KPI + grid </div>
 * </main>
 *
 *   modal.open({ mode: 'add', title: '…', buttons: [...] });
 *
 * Optional: data-cover-target="#app-content-column" — covers top nav + main (must be position: relative).
 */
(function (global) {
    'use strict';

    var Base = global.PremiumPopupModal;
    if (!Base) {
        console.error('[PremiumFullscreenPopupModal] Load popup-modal.js before full-screen-popup-modal.js');
        return;
    }

    /** Match sidebar sub-nav header: h-16 + border-gray-300 */
    var HEADER_LAYOUT_CLASS =
        'h-16 min-h-[4rem] max-h-16 px-4 sm:px-6 flex justify-between items-center flex-shrink-0 overflow-hidden';

    /** Fallbacks if popup-modal statics are unavailable (normally use Base.*). */
    var FALLBACK_HEADER_VARIANT_CLASSES = {
        neutral: 'bg-white border-b border-gray-300 text-gray-800',
        primary: 'bg-primary-500 border-b border-gray-100 text-white',
        danger: 'bg-red-600 border-b border-red-700 text-white'
    };
    var FALLBACK_HEADER_CLOSE_BTN_CLASSES = {
        neutral: 'w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-all',
        primary: 'w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white hover:text-white hover:bg-white/20 transition-all',
        danger: 'w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white hover:text-white hover:bg-white/20 transition-all'
    };
    var FALLBACK_BUTTON_CLASSES = {
        accent: 'px-6 py-2 rounded-lg bg-gray-800 text-white font-semibold hover:bg-gray-700 transition-all active:scale-95 text-sm',
        primary: 'px-6 py-2 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-all active:scale-95 text-sm',
        secondary: 'px-6 py-2 rounded-lg bg-gray-100 text-gray-800 font-semibold border border-gray-200 hover:bg-gray-200 transition-all text-sm',
        danger: 'px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-all active:scale-95 text-sm'
    };

    function getHeaderVariantClasses() {
        return Base.HEADER_VARIANT_CLASSES || FALLBACK_HEADER_VARIANT_CLASSES;
    }

    function getHeaderCloseBtnClasses() {
        return Base.HEADER_CLOSE_BTN_CLASSES || FALLBACK_HEADER_CLOSE_BTN_CLASSES;
    }

    function getButtonClasses() {
        return Base.BUTTON_CLASSES || FALLBACK_BUTTON_CLASSES;
    }

    function resolveCoverTarget(host) {
        var sel = host.getAttribute('data-cover-target') || host.getAttribute('data-layout-target');
        if (!sel) return null;
        try {
            return document.querySelector(sel);
        } catch (e) {
            return null;
        }
    }

    function ensureRelativePosition(el) {
        if (!el || typeof window === 'undefined') return;
        var pos = window.getComputedStyle(el).position;
        if (pos === 'static') {
            el.classList.add('relative');
        }
    }

    class PremiumFullscreenPopupModal extends Base {
        connectedCallback() {
            this._applyFullscreenHostStyles();
            this._mountToCoverTarget();
            Base.prototype.connectedCallback.call(this);
        }

        _applyFullscreenHostStyles() {
            this.style.display = 'block';
            // Use responsive classes: fixed on mobile (to cover bottom nav), absolute on sm+ (to cover only main canvas)
            this.classList.add('!fixed', 'sm:!absolute');
            this.style.inset = '0';
            this.style.zIndex = '75';
            this.style.width = '100%';
            this.style.height = '100%';
            this.style.pointerEvents = 'none';
        }

        _mountToCoverTarget() {
            var target = resolveCoverTarget(this);
            if (!target || target === this.parentElement) return;
            ensureRelativePosition(target);
            target.appendChild(this);
        }

        _syncHostPointerEvents(active) {
            if (active) {
                this.style.pointerEvents = 'auto';
                if (this._overlayEl) this._overlayEl.style.pointerEvents = 'auto';
            } else {
                this.style.pointerEvents = 'none';
                if (this._overlayEl) this._overlayEl.style.pointerEvents = 'none';
            }
        }

        _render() {
            var title = this.getAttribute('data-title') || 'Modal';
            var subtitle = this.getAttribute('data-subtitle') || '';
            var saveLabel = this.getAttribute('data-save-label') || 'Save';
            var headerNeutral = getHeaderVariantClasses().neutral;
            var closeNeutral = getHeaderCloseBtnClasses().neutral;
            var accentBtn = getButtonClasses().accent;

            this.innerHTML = [
                '<div data-modal-overlay class="absolute inset-0 z-[1] hidden flex flex-col transition-opacity duration-300" role="dialog" aria-modal="true">',
                '  <div data-overlay-backdrop class="absolute inset-0 bg-white/97 backdrop-blur-[3px]"></div>',
                '  <div data-modal-box class="relative z-[2] flex h-full w-full min-h-0 flex-col overflow-hidden bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">',
                '    <div data-modal-header class="' + HEADER_LAYOUT_CLASS + ' ' + headerNeutral + '">',
                '      <div data-modal-header-text-wrap class="min-w-0 flex-1 flex flex-col justify-center gap-0 leading-tight pr-3">',
                '        <h2 data-modal-title class="truncate text-lg font-semibold text-gray-800">' + title + '</h2>',
                '        <p data-modal-subtitle class="truncate text-xs text-gray-500">' + subtitle + '</p>',
                '      </div>',
                '      <button type="button" data-close-btn class="' + closeNeutral + '" aria-label="Close">',
                '        <i class="bi bi-x-lg text-base"></i>',
                '      </button>',
                '    </div>',
                '    <div class="relative flex min-h-0 flex-1 flex-col">',
                '      <div data-modal-body class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar p-4 sm:p-6 lg:p-8 pb-6" data-lenis-prevent>',
                this._bodyHtml,
                '      </div>',
                '      <div data-modal-loading class="absolute inset-0 z-[100] hidden flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-[4px] transition-opacity duration-200" aria-hidden="true">',
                '        <div class="premium-popup-modal-spinner" role="status" aria-label="Loading"></div>',
                '        <span data-modal-loading-label class="text-xs font-semibold text-gray-500 tracking-wide">Loading…</span>',
                '      </div>',
                '    </div>',
                '    <div data-modal-footer-wrap class="flex flex-shrink-0 flex-col gap-2 border-t border-gray-100 bg-white px-4 py-2.5 sm:px-6">',
                '      <p data-modal-footer-warning class="hidden min-h-[1.25rem] text-xs text-red-600"></p>',
                '      <div data-modal-footer-actions class="flex w-full flex-wrap justify-end gap-4">',
                '        <button type="button" id="modal-submit-btn" data-save-btn class="' + accentBtn + '">' + saveLabel + '</button>',
                '      </div>',
                '    </div>',
                '  </div>',
                '</div>'
            ].join('');

            this._cacheDomRefs();
            this._bindStaticEvents();
            this._wireDefaultSubmitButton();
        }

        _runOpenAnimation() {
            if (global.gsap && this._boxEl) {
                global.gsap.fromTo(
                    this._boxEl,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out' }
                );
            }
        }

        /** Fixed h-16 header to align with sidebar sub-nav (base popup-modal uses py-3). */
        setHeader(opts) {
            Base.prototype.setHeader.call(this, opts);
            if (!this._headerBarEl) return;
            var variant = (opts && opts.headerVariant) || 'neutral';
            var variants = getHeaderVariantClasses();
            var vClass = variants[variant] || variants.neutral;
            this._headerBarEl.className = HEADER_LAYOUT_CLASS + ' ' + vClass;
            if (this._headerTextWrapEl && !this._headerTextWrapEl.classList.contains('min-w-0')) {
                this._headerTextWrapEl.classList.add('min-w-0', 'flex-1', 'flex', 'flex-col', 'justify-center', 'gap-0', 'leading-tight', 'pr-3');
            }
            if (this._headerTitleEl) {
                this._headerTitleEl.className = 'truncate text-lg font-semibold text-gray-800';
            }
            if (this._headerSubtitleEl) {
                this._headerSubtitleEl.className = 'truncate text-xs text-gray-500';
            }
        }

        open(openOptions) {
            Base.prototype.open.call(this, openOptions);
            if (this._isOpen) {
                this._syncHostPointerEvents(true);
            }
        }

        close() {
            if (!this._overlayEl) return;
            this.setLoading(false);
            if (typeof document !== 'undefined' && document.body) {
                document.body.style.overflow = '';
            }
            var self = this;
            var done = function () {
                self._overlayEl.classList.add('hidden');
                self._isOpen = false;
                self._syncHostPointerEvents(false);
                if (typeof self._onClose === 'function') self._onClose();
            };
            if (global.gsap && this._boxEl) {
                global.gsap.to(this._boxEl, {
                    opacity: 0,
                    y: 14,
                    duration: 0.22,
                    ease: 'power2.in',
                    onComplete: done
                });
            } else {
                done();
            }
        }
    }

    /**
     * @param {string|Element} container
     * @param {object} [options]
     * @returns {PremiumFullscreenPopupModal|null}
     */
    function renderFullscreen(container, options) {
        options = options || {};
        var el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) {
            if (typeof console !== 'undefined' && console.error) {
                console.error('PremiumFullscreenPopupModal.render: container not found', container);
            }
            return null;
        }
        var node = document.createElement('premium-fullscreen-popup-modal');
        if (options.id) node.id = options.id;
        if (options.dataTitle != null) node.setAttribute('data-title', options.dataTitle);
        if (options.dataSubtitle != null) node.setAttribute('data-subtitle', options.dataSubtitle);
        if (options.dataSaveLabel != null) node.setAttribute('data-save-label', options.dataSaveLabel);
        if (options.coverTarget != null) {
            node.setAttribute('data-cover-target', options.coverTarget);
        }
        if (options.dataBodyTemplateId != null) {
            node.setAttribute('data-body-template-id', options.dataBodyTemplateId);
        }
        if (options.bodyTemplateId) node.setAttribute('data-body-template-id', options.bodyTemplateId);
        if (options.closeOnBackdropClick === true) {
            node.setAttribute('data-close-on-backdrop', 'true');
        } else if (options.closeOnBackdropClick === false) {
            node.setAttribute('data-close-on-backdrop', 'false');
        }
        el.appendChild(node);
        return node;
    }

    PremiumFullscreenPopupModal.MODE_DEFAULTS = Base.MODE_DEFAULTS;
    PremiumFullscreenPopupModal.HEADER_LAYOUT_CLASS = HEADER_LAYOUT_CLASS;
    PremiumFullscreenPopupModal.HEADER_VARIANT_CLASSES = getHeaderVariantClasses();
    PremiumFullscreenPopupModal.HEADER_CLOSE_BTN_CLASSES = getHeaderCloseBtnClasses();
    PremiumFullscreenPopupModal.HEADER_CLASSES = Base.HEADER_CLASSES || getHeaderVariantClasses();
    PremiumFullscreenPopupModal.BUTTON_CLASSES = getButtonClasses();
    PremiumFullscreenPopupModal.render = renderFullscreen;

    if (typeof window !== 'undefined' && window.customElements &&
        !window.customElements.get('premium-fullscreen-popup-modal')) {
        window.customElements.define('premium-fullscreen-popup-modal', PremiumFullscreenPopupModal);
    }

    global.PremiumFullscreenPopupModal = PremiumFullscreenPopupModal;
})(typeof window !== 'undefined' ? window : this);
