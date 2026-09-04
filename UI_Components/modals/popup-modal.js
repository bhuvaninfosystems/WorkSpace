/**
 * Premium Popup Modal — NewDesign reusable modal shell (same behavioral API as Common-components/ui/popup-modal.js).
 *
 * Usage:
 * <premium-popup-modal id="my-modal" data-title="Add New Lead" data-subtitle="Enter details">
 *   <template data-modal-body> ... body markup ... </template>
 * </premium-popup-modal>
 *
 * Rich open (modes, validation, dynamic footer) — same options shape as <popup-modal>:
 *   modal.open({ mode: 'add' | 'view' | 'edit' | 'delete', title, subtitle, bodyHtml, buttons, footer: false, ... });
 *
 * Legacy open (unchanged for existing pages): modal.open() — shows overlay only; header/footer/body stay as in markup / last render.
 *
 * Outside click: by default the modal does **not** close when clicking the backdrop. Set `data-close-on-backdrop="true"` on the element to restore that behavior.
 *
 * Loading overlay:
 *   On every open(), a default ~1s loading animation runs (no API required).
 *   modal.setLoading(true) — manual load (cancels auto-hide until setLoading(false)).
 *   open({ skipOpenLoading: true }) — disable default open loader.
 */
(function (global) {
    'use strict';

    var LOADING_STYLE_ID = 'premium-popup-modal-loading-css';
    var DEFAULT_OPEN_LOADING_MS = 1000;

    /** Same defaults as Common-components/ui/popup-modal.js */
    var MODE_DEFAULTS = {
        add: {
            title: 'Add New Record',
            subtitle: 'Fill in the details to add a new record',
            headerVariant: 'neutral',
            buttons: [
                { label: 'Add Record', id: 'modal-submit-btn', type: 'accent', submit: true }
            ]
        },
        view: {
            title: 'View Record Details',
            subtitle: 'View record information (read-only)',
            headerVariant: 'neutral',
            buttons: [],
            freezeInputs: true,
            freezeMode: 'disabled'
        },
        edit: {
            title: 'Edit Record Details',
            subtitle: 'Update record information',
            headerVariant: 'neutral',
            buttons: [
                { label: 'Update Record', id: 'modal-submit-btn', type: 'accent', submit: true }
            ]
        },
        delete: {
            title: 'Reason for Deletion',
            subtitle: 'Please provide a reason for deleting this record',
            headerVariant: 'danger',
            buttons: [
                { label: 'Delete Record', id: 'modal-delete-btn', type: 'danger' }
            ]
        }
    };

    /** Header bar: base layout + variant (neutral default; primary/danger optional). */
    var HEADER_LAYOUT_CLASS =
        'px-4 sm:px-5 py-3 flex justify-between items-center flex-shrink-0';
    var HEADER_VARIANT_CLASSES = {
        neutral: 'bg-gray-50 border-b border-gray-200 text-gray-800',
        primary: 'bg-primary-500 border-b border-gray-100 text-white',
        danger: 'bg-red-600 border-b border-red-700 text-white'
    };
    var HEADER_CLOSE_BTN_CLASSES = {
        neutral: 'w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-all',
        primary: 'w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white hover:text-white hover:bg-white/20 transition-all',
        danger: 'w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white hover:text-white hover:bg-white/20 transition-all'
    };

    /** Footer button styles aligned with premium rounded buttons */
    var BUTTON_CLASSES = {
        accent: 'px-6 py-2 rounded-lg bg-secondary-500 text-white font-semibold hover:opacity-90 transition-all active:scale-95 text-sm',
        primary: 'px-6 py-2 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-all active:scale-95 text-sm',
        secondary: 'px-6 py-2 rounded-lg bg-gray-100 text-gray-800 font-semibold border border-gray-200 hover:bg-gray-200 transition-all text-sm',
        danger: 'px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-all active:scale-95 text-sm'
    };

    var REQUIRED_WARNING_DEFAULT = 'Please fill the required input field(s).';

    function injectLoadingKeyframeCSS() {
        if (typeof document === 'undefined' || document.getElementById(LOADING_STYLE_ID)) return;
        var style = document.createElement('style');
        style.id = LOADING_STYLE_ID;
        style.textContent =
            '@keyframes premium-popup-modal-spin{to{transform:rotate(360deg)}}' +
            '[data-modal-overlay] [data-modal-loading]{' +
            'z-index:100 !important;pointer-events:auto;' +
            '}' +
            '[data-modal-loading] .premium-popup-modal-spinner{' +
            'width:2.5rem;height:2.5rem;border-radius:9999px;' +
            'border:2px solid rgba(15,118,110,0.2);border-top-color:rgba(13,148,136,0.95);' +
            'animation:premium-popup-modal-spin 0.75s linear infinite;' +
            '}';
        (document.head || document.documentElement).appendChild(style);
    }

    function applyInputFieldStyles(scope) {
        if (!scope) return;
        if (typeof global.InputFieldStyles !== 'undefined' &&
            global.InputFieldStyles &&
            typeof global.InputFieldStyles.applyByDataAttr === 'function') {
            global.InputFieldStyles.applyByDataAttr(scope);
            return;
        }
        if (typeof global.PremiumInputStyles !== 'undefined' &&
            global.PremiumInputStyles &&
            typeof global.PremiumInputStyles.applyByDataAttr === 'function') {
            global.PremiumInputStyles.applyByDataAttr(scope);
        }
    }

    function isEnterNavigableField(el) {
        if (!el || !el.tagName) return false;
        var tag = el.tagName.toLowerCase();
        if (tag === 'textarea') return false;
        if (tag !== 'input' && tag !== 'select') return false;
        var type = (el.type || '').toLowerCase();
        if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'reset' || type === 'image') return false;
        if (el.disabled || el.readOnly) return false;
        return true;
    }

    function bindEnterToNextField(scope) {
        if (!scope || scope.__premiumPopupEnterNavBound) return;
        scope.__premiumPopupEnterNavBound = true;
        scope.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter') return;
            var target = e.target;
            if (!isEnterNavigableField(target)) return;
            if (target.matches && target.matches('[data-enter-submit], [data-enter-next="false"]')) return;
            e.preventDefault();
            var root = target.form || scope;
            var fields = Array.prototype.slice.call(root.querySelectorAll('input, select, textarea'));
            var eligible = fields.filter(function (el) { return isEnterNavigableField(el); });
            var idx = eligible.indexOf(target);
            if (idx === -1) return;
            var next = eligible[idx + 1];
            if (next && typeof next.focus === 'function') next.focus();
        });
    }

    function clearRequiredWarning(warningEl) {
        if (!warningEl) return;
        warningEl.textContent = '';
        warningEl.classList.add('hidden');
    }

    function showRequiredWarning(warningEl, message) {
        if (!warningEl) return;
        warningEl.textContent = message || REQUIRED_WARNING_DEFAULT;
        warningEl.classList.remove('hidden');
    }

    function isRequiredMissing(el, root) {
        if (!el || el.disabled) return false;
        var tag = (el.tagName || '').toLowerCase();
        var type = (el.type || '').toLowerCase();
        if (tag === 'input' && type === 'radio') {
            var groupName = el.name || '';
            var radios = Array.prototype.slice.call((root || document).querySelectorAll('input[type="radio"][name]'));
            var sameGroup = radios.filter(function (r) { return (r.name || '') === groupName; });
            if (!sameGroup.length) return !el.checked;
            return !sameGroup.some(function (r) { return r.checked; });
        }
        if (tag === 'input' && type === 'checkbox') return !el.checked;
        if (tag === 'select') return !el.value || String(el.value).trim() === '';
        return !String(el.value || '').trim();
    }

    function validateRequiredFields(scope) {
        if (!scope || !scope.querySelectorAll) return { valid: true, firstInvalid: null };
        var required = Array.prototype.slice.call(scope.querySelectorAll('[required]'));
        for (var i = 0; i < required.length; i++) {
            if (isRequiredMissing(required[i], scope)) return { valid: false, firstInvalid: required[i] };
        }
        return { valid: true, firstInvalid: null };
    }

    function bindClearWarningOnInput(bodyEl, warningEl) {
        if (!bodyEl || bodyEl.__premiumPopupRequiredClearBound) return;
        bodyEl.__premiumPopupRequiredClearBound = true;
        bodyEl.addEventListener('input', function () {
            var state = validateRequiredFields(bodyEl);
            if (state.valid) clearRequiredWarning(warningEl);
        });
        bodyEl.addEventListener('change', function () {
            var state = validateRequiredFields(bodyEl);
            if (state.valid) clearRequiredWarning(warningEl);
        });
    }

    function canUseReadOnly(el) {
        if (!el || !el.tagName) return false;
        var tag = el.tagName.toLowerCase();
        if (tag === 'textarea') return true;
        if (tag !== 'input') return false;
        var type = (el.type || '').toLowerCase();
        return [
            'text', 'password', 'email', 'search', 'url', 'tel',
            'number', 'date', 'datetime-local', 'month', 'week',
            'time', 'color'
        ].indexOf(type) !== -1;
    }

    function setInputsFrozen(scope, freezeOptions) {
        if (!scope || !scope.querySelectorAll) return;
        var opts = freezeOptions || {};
        var freeze = opts.freezeInputs === true;
        var mode = (opts.freezeMode || 'readonly').toLowerCase();
        var selector = opts.freezeSelector || 'input, select, textarea, button';
        var excludeSelector = opts.freezeExcludeSelector || '[data-no-freeze], [type="hidden"], [type="submit"], [type="reset"], [type="button"], [type="image"]';
        var nodes = scope.querySelectorAll(selector);

        nodes.forEach(function (el) {
            if (excludeSelector && el.matches && el.matches(excludeSelector)) return;

            if (el.dataset.popupOrigDisabled == null) {
                el.dataset.popupOrigDisabled = el.disabled ? 'true' : 'false';
            }
            if (el.dataset.popupOrigReadOnly == null) {
                el.dataset.popupOrigReadOnly = el.readOnly ? 'true' : 'false';
            }

            if (freeze) {
                if (mode === 'disabled') {
                    el.disabled = true;
                    return;
                }
                if (canUseReadOnly(el)) {
                    el.readOnly = true;
                    return;
                }
                el.disabled = true;
                return;
            }

            el.disabled = (el.dataset.popupOrigDisabled === 'true');
            if ('readOnly' in el) {
                el.readOnly = (el.dataset.popupOrigReadOnly === 'true');
            }
        });
    }

    /**
     * Overlay layout: `absolute` (default) fills positioned host; `fixed` covers viewport
     * (use for nested dialogs inside fullscreen modals / overflow-hidden parents).
     */
    function getOverlayPositionConfig(host) {
        var pos = (host.getAttribute('data-overlay-position') || 'absolute').trim().toLowerCase();
        var zAttr = (host.getAttribute('data-overlay-z-index') || '').trim();
        var zClass = zAttr ? 'z-[' + zAttr + ']' : (pos === 'fixed' ? 'z-[90]' : 'z-[60]');
        var overlayBase = 'hidden flex items-center justify-center p-4 sm:p-8 transition-all duration-500';
        if (pos === 'fixed') {
            return {
                overlayClass: 'fixed inset-0 ' + zClass + ' ' + overlayBase,
                useFixedHost: true
            };
        }
        return {
            overlayClass: 'absolute inset-0 ' + zClass + ' ' + overlayBase,
            useFixedHost: false
        };
    }

    function extractBodyTemplateHtml(host, options) {
        if (!host || !host.querySelector) return '';
        var templateId = (options && options.bodyTemplateId) ||
            (host.getAttribute && (host.getAttribute('data-body-template-id') || host.getAttribute('data-popup-body-template-id')));
        if (templateId) {
            var byId = document.getElementById(templateId);
            if (byId && byId.tagName && byId.tagName.toLowerCase() === 'template') {
                return byId.innerHTML || '';
            }
        }

        var sibling = host.nextElementSibling;
        if (sibling && sibling.tagName && sibling.tagName.toLowerCase() === 'template') {
            return sibling.innerHTML || '';
        }

        var templateEl = host.querySelector(
            'template[data-modal-body], template[data-popup-body], template[data-popup-body-template], template.popup-modal-body-template'
        );
        if (templateEl) return templateEl.innerHTML || '';

        var bodyNode = host.querySelector('[data-popup-body], .popup-modal-body-template');
        if (bodyNode) return bodyNode.innerHTML || '';
        return '';
    }

    class PremiumPopupModal extends HTMLElement {
        constructor() {
            super();
            this._isOpen = false;
            this._onSave = null;
            this._onSubmit = null;
            this._onCancel = null;
            this._onDelete = null;
            this._onClose = null;
            this._bodyHtml = '';
            this._initialized = false;
            this._loadingEl = null;
            this._loadingActive = false;
            this._openLoadingTimer = null;
            this._defaultOpenLoadingActive = false;
            this._settingDefaultOpenLoading = false;
            this._currentRequiredWarningMessage = REQUIRED_WARNING_DEFAULT;
            this._headerTitleEl = null;
            this._headerSubtitleEl = null;
            this._headerTextWrapEl = null;
        }

        connectedCallback() {
            if (this._initialized) return;
            this.style.display = 'block';
            this._initWhenTemplateReady(0);
        }

        _applyFixedOverlayHostStyles() {
            var cfg = getOverlayPositionConfig(this);
            if (!cfg.useFixedHost) return;
            this.style.height = '0';
            this.style.overflow = 'visible';
            this.style.pointerEvents = 'none';
        }

        _syncFixedOverlayHostPointerEvents(active) {
            if (!getOverlayPositionConfig(this).useFixedHost) return;
            this.style.pointerEvents = active ? 'auto' : 'none';
        }

        _getDirectBodyTemplate() {
            var directTemplate = null;
            try {
                directTemplate = this.querySelector(':scope > template[data-modal-body]');
            } catch (err) {
                var children = Array.from(this.children || []);
                directTemplate = children.find(function (el) {
                    return el.tagName && el.tagName.toLowerCase() === 'template' && el.hasAttribute('data-modal-body');
                }) || null;
            }
            return directTemplate;
        }

        _initWhenTemplateReady(attempt) {
            var directTemplate = this._getDirectBodyTemplate();
            if (directTemplate) {
                this._bodyHtml = directTemplate.innerHTML || '';
                this._render();
                this._initialized = true;
                return;
            }

            if (document.readyState === 'loading' && attempt < 20) {
                requestAnimationFrame(() => this._initWhenTemplateReady(attempt + 1));
                return;
            }

            this._readTemplate();
            this._render();
            this._initialized = true;
        }

        _readTemplate() {
            var tpl = this.querySelector('template[data-modal-body]');
            if (tpl) {
                this._bodyHtml = tpl.innerHTML || '';
                return;
            }
            var extracted = extractBodyTemplateHtml(this, {});
            this._bodyHtml = extracted || '';
        }

        _isLegacyOpenOptions(openOptions) {
            if (openOptions == null) return true;
            if (typeof openOptions !== 'object') return true;
            return Object.keys(openOptions).length === 0;
        }

        /** Default: backdrop clicks do not close (only header close / footer cancel etc.). Use data-close-on-backdrop="true" to allow closing by clicking outside. */
        _closeOnBackdropClick() {
            var attr = this.getAttribute('data-close-on-backdrop');
            if (attr == null) return false;
            return String(attr).toLowerCase() === 'true';
        }

        _cacheDomRefs() {
            this._overlayEl = this.querySelector('[data-modal-overlay]');
            this._backdropEl = this.querySelector('[data-overlay-backdrop]');
            this._boxEl = this.querySelector('[data-modal-box]');
            this._bodyEl = this.querySelector('[data-modal-body]');
            this._loadingEl = this.querySelector('[data-modal-loading]');
            this._closeBtnEl = this.querySelector('[data-close-btn]');
            this._headerBarEl = this.querySelector('[data-modal-header]');
            this._headerTextWrapEl = this.querySelector('[data-modal-header-text-wrap]');
            this._headerTitleEl = this.querySelector('[data-modal-title]');
            this._headerSubtitleEl = this.querySelector('[data-modal-subtitle]');
            this._footerWrapEl = this.querySelector('[data-modal-footer-wrap]');
            this._footerWarningEl = this.querySelector('[data-modal-footer-warning]');
            this._footerActionsEl = this.querySelector('[data-modal-footer-actions]');
            this._saveBtnEl = this.querySelector('[data-save-btn]');
        }

        _bindStaticEvents() {
            var self = this;
            if (this._backdropEl) {
                this._backdropEl.addEventListener('click', function () {
                    if (!self._closeOnBackdropClick()) return;
                    self._userDismiss();
                });
            }
            if (this._closeBtnEl) {
                this._closeBtnEl.addEventListener('click', function () {
                    self._userDismiss();
                });
            }
        }

        /** Align with common popup-modal: close first, then onCancel (sync). */
        _userDismiss() {
            var oc = this._onCancel;
            this.close();
            if (typeof oc === 'function') oc();
        }

        _render() {
            injectLoadingKeyframeCSS();

            var title = this.getAttribute('data-title') || 'Modal';
            var subtitle = this.getAttribute('data-subtitle') || '';
            var width = this.getAttribute('data-width') || '800px';
            var maxWidth = this.getAttribute('data-max-width') || '95%';
            var heightAttr = (this.getAttribute('data-height') || '').trim();
            var maxHeight = (this.getAttribute('data-max-height') || '').trim();
            var minHeight = (this.getAttribute('data-min-height') || '').trim();
            if (!maxHeight) {
                maxHeight = '90vh';
            }
            var boxStyle = 'width:' + width + ';max-width:' + maxWidth + ';max-height:' + maxHeight + ';';
            if (heightAttr) {
                boxStyle += 'height:' + heightAttr + ';';
            }
            if (minHeight) {
                boxStyle += 'min-height:' + minHeight + ';';
            }
            var saveLabel = this.getAttribute('data-save-label') || 'Save';
            var hostId = this.id || 'premium-popup-modal';
            var modalBoxId = hostId + '-modal-box';
            var overlayCfg = getOverlayPositionConfig(this);

            this.innerHTML = [
                '<div data-modal-overlay class="' + overlayCfg.overlayClass + '">',
                '  <div data-overlay-backdrop class="absolute inset-0 bg-gray-900/5 backdrop-blur-[6px]"></div>',
                '  <div data-modal-box id="' + modalBoxId + '" class="relative flex w-full min-h-0 max-h-full flex-col overflow-hidden bg-white/90 backdrop-blur-3xl rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white/60" style="' + boxStyle + '">',
                '    <div data-modal-header class="' + HEADER_LAYOUT_CLASS + ' ' + HEADER_VARIANT_CLASSES.neutral + '">',
                '      <div data-modal-header-text-wrap>',
                '        <h2 data-modal-title class="text-xl font-bold text-gray-800 tracking-tight">' + title + '</h2>',
                '        <p data-modal-subtitle class="text-xs text-gray-500">' + subtitle + '</p>',
                '      </div>',
                '      <button type="button" data-close-btn class="' + HEADER_CLOSE_BTN_CLASSES.neutral + '">',
                '        <i class="bi bi-x-lg text-base"></i>',
                '      </button>',
                '    </div>',
                '    <div class="relative flex-1 min-h-0 flex flex-col">',
                '      <div data-modal-body class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar p-4 sm:p-8 pb-6" data-lenis-prevent>',
                this._bodyHtml,
                '      </div>',
                '      <div data-modal-loading class="absolute inset-0 z-[100] hidden flex flex-col items-center justify-center gap-3 bg-white/75 backdrop-blur-[3px] transition-opacity duration-200" aria-hidden="true">',
                '        <div class="premium-popup-modal-spinner" role="status" aria-label="Loading"></div>',
                '        <span data-modal-loading-label class="text-xs font-semibold text-gray-500 tracking-wide">Loading…</span>',
                '      </div>',
                '    </div>',
                '    <div data-modal-footer-wrap class="px-4 sm:px-5 py-3 border-t border-gray-100 flex flex-col gap-2 flex-shrink-0 bg-white/50">',
                '      <p data-modal-footer-warning class="hidden min-h-[1.25rem] text-xs text-red-600"></p>',
                '      <div data-modal-footer-actions class="flex flex-wrap justify-end gap-4 w-full">',
                '        <button type="button" id="modal-submit-btn" data-save-btn class="' + BUTTON_CLASSES.accent + '">' + saveLabel + '</button>',
                '      </div>',
                '    </div>',
                '  </div>',
                '</div>'
            ].join('');

            this._cacheDomRefs();
            this._bindStaticEvents();
            this._wireDefaultSubmitButton();
            this._applyFixedOverlayHostStyles();
        }

        _wireDefaultSubmitButton() {
            var self = this;
            var btn = this._footerActionsEl && this._footerActionsEl.querySelector('#modal-submit-btn');
            if (!btn) btn = this._footerActionsEl && this._footerActionsEl.querySelector('[data-save-btn]');
            this._saveBtnEl = btn;
            if (btn && !btn.__premiumSubmitWired) {
                btn.__premiumSubmitWired = true;
                btn.addEventListener('click', function (e) {
                    self._handleSubmitClick(e);
                });
            }
        }

        _handleSubmitClick(e) {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            var btn = e ? e.currentTarget || this._saveBtnEl : this._saveBtnEl;
            var bodyEl = this._bodyEl;
            var state = validateRequiredFields(bodyEl);
            if (!state.valid) {
                showRequiredWarning(this._footerWarningEl, this._currentRequiredWarningMessage);
                if (state.firstInvalid && typeof state.firstInvalid.focus === 'function') state.firstInvalid.focus();
                return;
            }
            clearRequiredWarning(this._footerWarningEl);
            
            if (btn && !btn.__originalInnerHtml) {
                btn.__originalInnerHtml = btn.innerHTML;
                btn.innerHTML = '<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline-block align-text-bottom" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ' + btn.__originalInnerHtml;
                btn.disabled = true;
                
                // Auto-restore after a few seconds in case caller forgets to call setLoading(false) on error
                if (btn.__spinnerTimeout) clearTimeout(btn.__spinnerTimeout);
                btn.__spinnerTimeout = setTimeout(function() {
                    if (btn.__originalInnerHtml) {
                        btn.innerHTML = btn.__originalInnerHtml;
                        btn.__originalInnerHtml = null;
                        btn.disabled = false;
                    }
                }, 4000);
            }

            var fn = this._onSubmit || this._onSave;
            if (typeof fn === 'function') fn();
        }

        _handleDeleteClick() {
            if (typeof this._onDelete === 'function') this._onDelete();
        }

        _refreshBodyBindings() {
            if (!this._bodyEl) return;
            applyInputFieldStyles(this._bodyEl);
            bindEnterToNextField(this._bodyEl);
            bindClearWarningOnInput(this._bodyEl, this._footerWarningEl);
        }

        _runOpenAnimation() {
            if (global.gsap && this._boxEl) {
                global.gsap.fromTo(this._boxEl, { scale: 0.9, opacity: 0, y: 30 }, { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: 'back.out(1.7)' });
            }
        }

        _clearOpenLoadingTimer() {
            if (this._openLoadingTimer) {
                clearTimeout(this._openLoadingTimer);
                this._openLoadingTimer = null;
            }
        }

        _parseOpenLoadingDuration(openOptions) {
            var attr = this.getAttribute('data-open-loading-duration');
            if (openOptions && typeof openOptions.openLoadingDuration === 'number') {
                return Math.max(0, openOptions.openLoadingDuration);
            }
            if (attr != null && attr !== '') {
                var fromAttr = Number(attr);
                if (Number.isFinite(fromAttr)) return Math.max(0, fromAttr);
            }
            return DEFAULT_OPEN_LOADING_MS;
        }

        _shouldSkipOpenLoading(openOptions) {
            if (openOptions && openOptions.skipOpenLoading === true) return true;
            var attr = this.getAttribute('data-open-loading');
            if (attr != null && String(attr).toLowerCase() === 'false') return true;
            return false;
        }

        /** Show body loading overlay briefly on every open (unless skipped or manual setLoading). */
        _startDefaultOpenLoading(openOptions) {
            var self = this;
            if (this._shouldSkipOpenLoading(openOptions)) return;

            var duration = this._parseOpenLoadingDuration(openOptions);
            if (duration <= 0) return;

            var message = (openOptions && openOptions.openLoadingMessage) ||
                this.getAttribute('data-open-loading-message') ||
                'Loading…';

            this._clearOpenLoadingTimer();
            this._defaultOpenLoadingActive = true;
            this._settingDefaultOpenLoading = true;
            this.setLoading(true, message);
            this._settingDefaultOpenLoading = false;

            this._openLoadingTimer = setTimeout(function () {
                self._openLoadingTimer = null;
                if (self._defaultOpenLoadingActive) {
                    self._defaultOpenLoadingActive = false;
                    self.setLoading(false);
                }
            }, duration);
        }

        /** Scroll modal body (and safe ancestors) to top whenever the dialog opens */
        _scrollModalContentToTop() {
            var self = this;
            function run() {
                if (self._bodyEl && typeof self._bodyEl.scrollTop === 'number') {
                    self._bodyEl.scrollTop = 0;
                }
                if (self._boxEl && typeof self._boxEl.scrollTop === 'number') {
                    self._boxEl.scrollTop = 0;
                }
                if (self._overlayEl && typeof self._overlayEl.scrollTop === 'number') {
                    self._overlayEl.scrollTop = 0;
                }
            }
            run();
            try {
                if (typeof requestAnimationFrame === 'function') {
                    requestAnimationFrame(run);
                }
            } catch (e) {
                /* no-op */
            }
        }

        /**
         * Legacy: no options — same as before (respect data-title in static HTML; do not apply mode defaults).
         */
        _openLegacy() {
            if (!this._overlayEl) return;
            this._overlayEl.classList.remove('hidden');
            this._isOpen = true;
            this._syncFixedOverlayHostPointerEvents(true);
            this._scrollModalContentToTop();
            this._runOpenAnimation();
            this._startDefaultOpenLoading(null);
        }

        /**
         * Full open path aligned with Common-components popup-modal (modes, templates, validation hooks).
         */
        _openRich(openOptions) {
            var self = this;
            if (!this._overlayEl) return;

            openOptions = openOptions || {};
            var mode = openOptions.mode || 'add';
            var defaults = MODE_DEFAULTS[mode] || MODE_DEFAULTS.add;

            this._onSubmit = openOptions.onSubmit;
            this._onSave = openOptions.onSave;
            this._onDelete = openOptions.onDelete;
            this._onCancel = openOptions.onCancel;
            this._onClose = openOptions.onClose;

            this.setHeader({
                title: openOptions.title != null ? openOptions.title : defaults.title,
                subtitle: openOptions.subtitle != null ? openOptions.subtitle : defaults.subtitle,
                headerVariant: openOptions.headerVariant != null ? openOptions.headerVariant : defaults.headerVariant,
                titleTag: openOptions.titleTag,
                subtitleTag: openOptions.subtitleTag,
                titleClass: openOptions.titleClass,
                subtitleClass: openOptions.subtitleClass,
                titleHtml: openOptions.titleHtml,
                subtitleHtml: openOptions.subtitleHtml,
                headerHtml: openOptions.headerHtml
            });

            if (this._footerWrapEl) {
                this._footerWrapEl.classList.remove('hidden');
            }
            if (openOptions.footer === false) {
                if (this._footerActionsEl) this._footerActionsEl.innerHTML = '';
                clearRequiredWarning(this._footerWarningEl);
                if (this._footerWrapEl) this._footerWrapEl.classList.add('hidden');
            } else {
                if (this._footerWrapEl) this._footerWrapEl.classList.remove('hidden');
                this.setButtons(openOptions.buttons != null ? openOptions.buttons : defaults.buttons);
                if (openOptions.footer) this.setFooter(openOptions.footer);
            }

            this._currentRequiredWarningMessage =
                openOptions.requiredWarningMessage || REQUIRED_WARNING_DEFAULT;
            clearRequiredWarning(this._footerWarningEl);

            if (openOptions.bodyHtml != null) {
                this.setBody(openOptions.bodyHtml);
            } else {
                var shouldResolveTemplate = !this._bodyEl || !this._bodyEl.children || this._bodyEl.children.length === 0;
                if (shouldResolveTemplate) {
                    var resolvedBodyHtml = extractBodyTemplateHtml(this, openOptions);
                    if (resolvedBodyHtml) this.setBody(resolvedBodyHtml);
                }
            }

            this._refreshBodyBindings();
            
            var mergedFreezeOptions = {
                freezeInputs: openOptions.freezeInputs !== undefined ? openOptions.freezeInputs : defaults.freezeInputs,
                freezeMode: openOptions.freezeMode || defaults.freezeMode,
                freezeSelector: openOptions.freezeSelector || defaults.freezeSelector,
                freezeExcludeSelector: openOptions.freezeExcludeSelector || defaults.freezeExcludeSelector
            };
            setInputsFrozen(this._bodyEl, mergedFreezeOptions);

            this._overlayEl.classList.remove('hidden');
            this._isOpen = true;
            this._syncFixedOverlayHostPointerEvents(true);
            if (typeof document !== 'undefined' && document.body) {
                document.body.style.overflow = 'hidden';
            }

            this._scrollModalContentToTop();

            requestAnimationFrame(function () {
                self._scrollModalContentToTop();
                self._runOpenAnimation();
                self._startDefaultOpenLoading(openOptions);
            });
        }

        /**
         * @param {object} [openOptions] Omit or pass {} for legacy behavior. Pass { mode, ... } for parity with popup-modal.
         */
        open(openOptions) {
            if (!this._overlayEl) return;
            if (this._isLegacyOpenOptions(openOptions)) {
                this._openLegacy();
                return;
            }
            this._openRich(openOptions);
        }

        setLoading(isLoading, message) {
            if (isLoading) {
                if (!this._settingDefaultOpenLoading) {
                    this._clearOpenLoadingTimer();
                    this._defaultOpenLoadingActive = false;
                }
            } else {
                this._clearOpenLoadingTimer();
                this._defaultOpenLoadingActive = false;
            }

            this._loadingActive = !!isLoading;
            if (!this._loadingEl) return;

            var labelEl = this._loadingEl.querySelector('[data-modal-loading-label]');
            if (labelEl) {
                if (isLoading) {
                    labelEl.textContent = (typeof message === 'string' && message.trim()) ? message.trim() : 'Loading…';
                } else {
                    labelEl.textContent = 'Loading…';
                }
            }

            if (isLoading) {
                this._loadingEl.classList.remove('hidden');
                this._loadingEl.setAttribute('aria-hidden', 'false');
                if (this._boxEl) this._boxEl.setAttribute('aria-busy', 'true');
            } else {
                this._loadingEl.classList.add('hidden');
                this._loadingEl.setAttribute('aria-hidden', 'true');
                if (this._boxEl) this._boxEl.removeAttribute('aria-busy');
            }

            var buttons = this._footerActionsEl ? this._footerActionsEl.querySelectorAll('button') : [];
            for (var i = 0; i < buttons.length; i++) {
                // If turning off loading, restore original text if a spinner was added
                if (!isLoading && buttons[i].__originalInnerHtml) {
                    buttons[i].innerHTML = buttons[i].__originalInnerHtml;
                    buttons[i].__originalInnerHtml = null;
                    if (buttons[i].__spinnerTimeout) clearTimeout(buttons[i].__spinnerTimeout);
                }
                buttons[i].disabled = !!isLoading;
                buttons[i].setAttribute('aria-disabled', isLoading ? 'true' : 'false');
            }
        }

        isLoading() {
            return !!this._loadingActive;
        }

        close() {
            if (!this._overlayEl) return;
            this._clearOpenLoadingTimer();
            this._defaultOpenLoadingActive = false;
            this.setLoading(false);
            
            // Clean up any lingering inline button spinners
            var buttons = this._footerActionsEl ? this._footerActionsEl.querySelectorAll('button') : [];
            for (var i = 0; i < buttons.length; i++) {
                if (buttons[i].__originalInnerHtml) {
                    buttons[i].innerHTML = buttons[i].__originalInnerHtml;
                    buttons[i].__originalInnerHtml = null;
                    buttons[i].disabled = false;
                    if (buttons[i].__spinnerTimeout) clearTimeout(buttons[i].__spinnerTimeout);
                }
            }
            
            if (typeof document !== 'undefined' && document.body) {
                document.body.style.overflow = '';
            }
            var self = this;
            var done = function () {
                self._overlayEl.classList.add('hidden');
                self._isOpen = false;
                self._syncFixedOverlayHostPointerEvents(false);
                if (typeof self._onClose === 'function') self._onClose();
            };
            if (global.gsap && this._boxEl) {
                global.gsap.to(this._boxEl, { scale: 0.95, opacity: 0, y: 20, duration: 0.25, onComplete: done });
            } else {
                done();
            }
        }

        isOpen() {
            return this._isOpen;
        }

        getBodyElement() {
            return this._bodyEl;
        }

        getBody() {
            return this._bodyEl;
        }

        getFooter() {
            return this._footerWrapEl;
        }

        getBackdrop() {
            return this._backdropEl;
        }

        /** Outer overlay wrapper (dialog host). */
        getModal() {
            return this._overlayEl;
        }

        /** Parent for Select2 dropdowns — avoids clipping by modal box overflow. */
        getSelect2DropdownParent() {
            return this._overlayEl || this.querySelector('[data-modal-overlay]') || document.body;
        }

        getCardElement() {
            return this._boxEl;
        }

        setOnSave(fn) {
            this._onSave = fn;
        }

        setOnSubmit(fn) {
            this._onSubmit = fn;
        }

        setOnCancel(fn) {
            this._onCancel = fn;
        }

        setOnDelete(fn) {
            this._onDelete = fn;
        }

        setOnClose(fn) {
            this._onClose = fn;
        }

        _replaceTag(el, tagName, className) {
            if (!el) return null;
            var nextTag = (tagName || el.tagName || 'div').toString().toLowerCase();
            if (el.tagName.toLowerCase() === nextTag) {
                if (className) el.className = className;
                return el;
            }
            var next = document.createElement(nextTag);
            next.className = className || el.className;
            next.innerHTML = el.innerHTML;
            if (el.parentNode) el.parentNode.replaceChild(next, el);
            return next;
        }

        setHeader(opts) {
            if (!opts) return;
            var title = opts.title != null ? opts.title : '';
            var subtitle = opts.subtitle != null ? opts.subtitle : '';
            var variant = opts.headerVariant || 'neutral';
            var titleTag = opts.titleTag || 'h2';
            var subtitleTag = opts.subtitleTag || 'p';
            var isLightHeader = variant === 'neutral';
            var titleClass = opts.titleClass || (isLightHeader
                ? 'text-xl font-bold text-gray-800 tracking-tight'
                : 'text-xl font-bold text-white tracking-tight');
            var subtitleClass = opts.subtitleClass || (isLightHeader ? 'text-xs text-gray-500' : 'text-xs text-white');

            if (this._headerTextWrapEl && typeof opts.headerHtml === 'string') {
                this._headerTextWrapEl.innerHTML = opts.headerHtml;
                this._headerTitleEl = this._headerTextWrapEl.querySelector('[data-modal-title], .popup-modal-title');
                this._headerSubtitleEl = this._headerTextWrapEl.querySelector('[data-modal-subtitle], .popup-modal-subtitle');
            } else {
                this._headerTitleEl = this._replaceTag(this._headerTitleEl, titleTag, titleClass);
                if (this._headerTitleEl && !this._headerTitleEl.hasAttribute('data-modal-title')) {
                    this._headerTitleEl.setAttribute('data-modal-title', '');
                }
                this._headerSubtitleEl = this._replaceTag(this._headerSubtitleEl, subtitleTag, subtitleClass);
                if (this._headerSubtitleEl && !this._headerSubtitleEl.hasAttribute('data-modal-subtitle')) {
                    this._headerSubtitleEl.setAttribute('data-modal-subtitle', '');
                }
                if (this._headerTitleEl) {
                    if (opts.titleHtml != null) this._headerTitleEl.innerHTML = String(opts.titleHtml);
                    else this._headerTitleEl.textContent = title;
                }
                if (this._headerSubtitleEl) {
                    if (opts.subtitleHtml != null) this._headerSubtitleEl.innerHTML = String(opts.subtitleHtml);
                    else this._headerSubtitleEl.textContent = subtitle;
                }
            }

            if (this._headerBarEl) {
                var vClass = HEADER_VARIANT_CLASSES[variant] || HEADER_VARIANT_CLASSES.neutral;
                this._headerBarEl.className = HEADER_LAYOUT_CLASS + ' ' + vClass;
            }
            if (this._closeBtnEl) {
                var closeClass = HEADER_CLOSE_BTN_CLASSES[variant] || HEADER_CLOSE_BTN_CLASSES.neutral;
                this._closeBtnEl.className = closeClass;
            }
        }

        setButtons(buttons) {
            if (!this._footerActionsEl) return;
            this._footerActionsEl.innerHTML = '';
            if (!Array.isArray(buttons)) return;

            var self = this;
            buttons.forEach(function (b) {
                var btn = document.createElement('button');
                btn.type = b.submit ? 'submit' : 'button';
                if (b.id) btn.id = b.id;
                if (b.submit || b.id === 'modal-submit-btn') {
                    btn.setAttribute('data-save-btn', '');
                }
                btn.className = BUTTON_CLASSES[b.type] || BUTTON_CLASSES.secondary;
                btn.textContent = b.label || '';

                if (b.id === 'modal-cancel-btn') {
                    btn.addEventListener('click', function () {
                        self._userDismiss();
                    });
                }
                if (b.id === 'modal-delete-btn') {
                    btn.addEventListener('click', function () {
                        self._handleDeleteClick();
                    });
                }
                if (b.id === 'modal-submit-btn' || b.submit) {
                    btn.addEventListener('click', function (e) {
                        self._handleSubmitClick(e);
                    });
                }

                self._footerActionsEl.appendChild(btn);
            });

            this._saveBtnEl = this._footerActionsEl.querySelector('#modal-submit-btn, [data-save-btn]');
        }

        setFooter(opts) {
            if (!this._footerWrapEl || !opts) return;
            this._footerWrapEl.classList.remove('hidden');
            if (typeof opts.className === 'string' && opts.className.trim()) {
                this._footerWrapEl.className = opts.className;
            }
            if (typeof opts.contentHtml === 'string' && this._footerActionsEl) {
                this._footerActionsEl.innerHTML = opts.contentHtml;
                return;
            }
            if (Array.isArray(opts.buttons)) {
                this.setButtons(opts.buttons);
            }
            if (typeof opts.prependHtml === 'string' && opts.prependHtml && this._footerActionsEl) {
                this._footerActionsEl.insertAdjacentHTML('afterbegin', opts.prependHtml);
            }
            if (typeof opts.appendHtml === 'string' && opts.appendHtml && this._footerActionsEl) {
                this._footerActionsEl.insertAdjacentHTML('beforeend', opts.appendHtml);
            }
        }

        setBody(content) {
            if (!this._bodyEl || content == null) return;
            if (typeof content === 'string') {
                this._bodyEl.innerHTML = content;
            } else {
                this._bodyEl.innerHTML = '';
                if (content instanceof Node) {
                    this._bodyEl.appendChild(content);
                }
            }
            this._refreshBodyBindings();
        }

        setInputsFrozen(opts) {
            setInputsFrozen(this._bodyEl, opts || {});
        }
    }

    /**
     * Append a premium modal element to a container (parity with PopupModal.render shape; styling is still premium).
     * @returns {PremiumPopupModal|null}
     */
    function renderPremium(container, options) {
        options = options || {};
        var el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) {
            if (typeof console !== 'undefined' && console.error) {
                console.error('PremiumPopupModal.render: container not found', container);
            }
            return null;
        }
        var node = document.createElement('premium-popup-modal');
        if (options.id) node.id = options.id;
        if (options.dataTitle != null) node.setAttribute('data-title', options.dataTitle);
        if (options.dataSubtitle != null) node.setAttribute('data-subtitle', options.dataSubtitle);
        if (options.dataSaveLabel != null) node.setAttribute('data-save-label', options.dataSaveLabel);
        if (options.dataWidth != null) node.setAttribute('data-width', options.dataWidth);
        if (options.dataHeight != null) node.setAttribute('data-height', options.dataHeight);
        if (options.dataMaxHeight != null) node.setAttribute('data-max-height', options.dataMaxHeight);
        if (options.dataMinHeight != null) node.setAttribute('data-min-height', options.dataMinHeight);
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

    PremiumPopupModal.MODE_DEFAULTS = MODE_DEFAULTS;
    PremiumPopupModal.HEADER_VARIANT_CLASSES = HEADER_VARIANT_CLASSES;
    PremiumPopupModal.HEADER_CLOSE_BTN_CLASSES = HEADER_CLOSE_BTN_CLASSES;
    PremiumPopupModal.HEADER_CLASSES = HEADER_VARIANT_CLASSES;
    PremiumPopupModal.BUTTON_CLASSES = BUTTON_CLASSES;
    PremiumPopupModal.render = renderPremium;

    if (typeof window !== 'undefined' && window.customElements && !window.customElements.get('premium-popup-modal')) {
        window.customElements.define('premium-popup-modal', PremiumPopupModal);
    }

    global.PremiumPopupModal = PremiumPopupModal;
})(typeof window !== 'undefined' ? window : this);
