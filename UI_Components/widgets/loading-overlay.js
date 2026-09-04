/**
 * Premium Loading Overlay — full-screen loading animation (GSAP + CSS).
 *
 * Depends: GSAP (`gsap` on window) loaded before this script.
 *
 * No numeric 1%–100% display; uses an indeterminate bar motion for the wait duration.
 * The full-screen container enters from the right (GSAP `xPercent`) and exits to the left.
 *
 * API:
 *   window.startLoader(durationSeconds?, onComplete?)
 *   window.LoadingOverlay.show({ title, duration, onComplete })
 *   window.LoadingOverlay.hide({ fast, onComplete })
 *
 * If `#loader-overlay` is missing, a default overlay is appended to `document.body`.
 *
 * Logo: `Config/assets/images/Logo.png` under the NewDesign root, resolved from this script URL.
 * Optional override: `window.__PREMIUM_LOADER_LOGO__ = 'https://.../Logo.png'`
 *
 * Full reload / refresh (no in-app nav handoff): body stays hidden until DOM ready, then the
 * loader runs until `window` `"load"` (plus a short hold), then exits. Opt out with
 * `window.__PREMIUM_SKIP_INITIAL_PAGE_LOADER__ = true` before this script runs.
 */
// JS Fallback for Custom Viewport Height (older / in-app browsers)
(function () {
    function updateVh() {
        var vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', vh + 'px');
    }
    window.addEventListener('resize', updateVh);
    window.addEventListener('orientationchange', updateVh);
    updateVh();
})();

(function (global) {
    'use strict';

    var OVERLAY_ID = 'loader-overlay';
    var PROGRESS_ID = 'loader-progress';
    var TITLE_ID = 'loader-title-text';
    var STYLE_ID = 'premium-loader-overlay-styles-v3';
    var ENTRANCE_SEC = 0.5;
    var EXIT_SEC = 0.45;
    var NAV_SESSION_KEY = '__premium_nav_transition__';
    var NAV_DEFAULT_HOLD_SEC = 0.55;
    var INITIAL_LOAD_MIN_HOLD_SEC = 0.4;

    function resolveLogoUrl() {
        if (global.__PREMIUM_LOADER_LOGO__) {
            return String(global.__PREMIUM_LOADER_LOGO__);
        }
        var scripts = document.getElementsByTagName('script');
        var i;
        var s;
        var u;
        for (i = scripts.length - 1; i >= 0; i--) {
            s = scripts[i].src;
            if (!s) continue;
            if (/loading-overlay\.js(\?|#|$)/.test(s)) {
                u = s.split(/[#?]/)[0];
                var marker = '/ui_components';
                var idx = u.toLowerCase().indexOf(marker);
                if (idx !== -1) {
                    return u.slice(0, idx) + '/Config/assets/images/Logo.png';
                }
                var lastSlash = u.lastIndexOf('/');
                var folder = u.slice(0, lastSlash);
                return folder + '/Config/assets/images/Logo.png';
            }
        }
        return 'Config/assets/images/Logo.png';
    }

    var LOGO_URL = resolveLogoUrl();

    function injectKeyframes() {
        if (document.getElementById(STYLE_ID)) return;
        var legacy = document.getElementById('premium-loader-overlay-styles');
        if (legacy) legacy.remove();
        var legacy2 = document.getElementById('premium-loader-overlay-styles-v2');
        if (legacy2) legacy2.remove();
        var st = document.createElement('style');
        st.id = STYLE_ID;
        st.textContent = [
            '@keyframes premium-loader-slide {',
            '  0% { transform: translateX(-100%); }',
            '  100% { transform: translateX(380%); }',
            '}',
            'html.premium-transition-pending body > *:not(#' + OVERLAY_ID + ') {',
            '  visibility: hidden !important;',
            '}',
            'html.premium-initial-load-pending body > *:not(#' + OVERLAY_ID + ') {',
            '  visibility: hidden !important;',
            '}',
            '#' + OVERLAY_ID + ' .premium-loader-bar {',
            '  width: 36%;',
            '  border-radius: 9999px;',
            '  animation: premium-loader-slide 1.15s ease-in-out infinite;',
            '}',
            '#' + OVERLAY_ID + ' .premium-loader-logo-wrap {',
            '  width: 5rem;',
            '  height: 5rem;',
            '  margin-bottom: 2rem;',
            '  display: flex;',
            '  align-items: center;',
            '  justify-content: center;',
            '}',
            '#' + OVERLAY_ID + ' .premium-loader-logo {',
            '  max-width: 5rem;',
            '  max-height: 5rem;',
            '  width: auto;',
            '  height: auto;',
            '  object-fit: contain;',
            '}'
        ].join('\n');
        document.head.appendChild(st);
    }

    function buildOverlayMarkup() {
        return [
            '<div class="flex flex-col items-center scale-90 sm:scale-100 px-6">',
            '  <div class="premium-loader-logo-wrap" aria-hidden="true">',
            '    <img id="loader-logo-img" class="premium-loader-logo" src="', LOGO_URL, '" alt="Logo">',
            '  </div>',
            '  <div class="relative w-64 max-w-[85vw] h-1.5 bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-valuetext="Loading">',
            '    <div id="', PROGRESS_ID, '" class="absolute left-0 top-0 bottom-0 bg-primary-500 premium-loader-bar"></div>',
            '  </div>',
            '  <h2 id="', TITLE_ID, '" class="text-xl font-bold text-gray-800 tracking-tight mb-4 text-center">Loading</h2>',
            '</div>'
        ].join('');
    }

    function ensureOverlay() {
        var el = document.getElementById(OVERLAY_ID);
        if (el) {
            if (el.querySelector('#loader-percentage') || !el.querySelector('#loader-logo-img')) {
                el.remove();
                el = null;
            } else {
                injectKeyframes();
                return el;
            }
        }

        injectKeyframes();
        el = document.createElement('div');
        el.id = OVERLAY_ID;
        el.className = 'fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center will-change-transform';
        el.setAttribute('aria-busy', 'true');
        el.setAttribute('aria-live', 'polite');
        el.innerHTML = buildOverlayMarkup();
        document.body.insertBefore(el, document.body.firstChild);
        if (global.gsap) {
            global.gsap.set(el, { xPercent: 100, opacity: 1 });
        } else {
            el.style.transform = 'translateX(100%)';
        }
        return el;
    }

    function getParts() {
        var overlay = ensureOverlay();
        return {
            overlay: overlay,
            progress: document.getElementById(PROGRESS_ID),
            titleEl: document.getElementById(TITLE_ID)
        };
    }

    function setTitle(text) {
        var parts = getParts();
        if (parts.titleEl && text) parts.titleEl.textContent = text;
    }

    /**
     * @param {object} opts
     * @param {string} [opts.title]
     * @param {number} [opts.duration] Hold time in seconds while overlay is centered (after slide-in, before slide-out).
     * @param {function} [opts.onComplete]
     * @param {function} [opts.onEntered]
     * @param {boolean} [opts.skipEntrance]
     * @param {boolean} [opts.skipExit]
     * @param {'left'|'right'} [opts.exitTo]
     */
    function show(opts) {
        opts = opts || {};
        var duration = typeof opts.duration === 'number' ? opts.duration : 1.2;
        var callback = typeof opts.onComplete === 'function' ? opts.onComplete : null;
        var onEntered = typeof opts.onEntered === 'function' ? opts.onEntered : null;
        var skipEntrance = !!opts.skipEntrance;
        var skipExit = !!opts.skipExit;
        var exitTo = opts.exitTo === 'right' ? 100 : -100;
        if (opts.title) setTitle(opts.title);

        var parts = getParts();
        var overlay = parts.overlay;

        if (!global.gsap) {
            if (callback) callback();
            return;
        }

        var doExit = function () {
            if (skipExit) return;
            global.gsap.delayedCall(Math.max(0, duration), function () {
                global.gsap.to(overlay, {
                    xPercent: exitTo,
                    opacity: 0,
                    duration: EXIT_SEC,
                    ease: 'power2.in',
                    onComplete: function () {
                        overlay.style.display = 'none';
                        global.gsap.set(overlay, { xPercent: 100, opacity: 1 });
                        if (callback) callback();
                    }
                });
            });
        };

        overlay.style.display = 'flex';
        global.gsap.killTweensOf(overlay);

        if (skipEntrance) {
            global.gsap.set(overlay, { xPercent: 0, opacity: 1 });
            if (onEntered) onEntered();
            doExit();
            if (skipExit && callback) callback();
            return;
        }

        global.gsap.set(overlay, { xPercent: 100, opacity: 1 });
        global.gsap.to(overlay, {
            xPercent: 0,
            duration: ENTRANCE_SEC,
            ease: 'power3.out',
            onComplete: function () {
                if (onEntered) onEntered();
                doExit();
                if (skipExit && callback) callback();
            }
        });
    }

    function hide(opts) {
        opts = opts || {};
        var overlay = document.getElementById(OVERLAY_ID);
        if (!overlay || !global.gsap) return;
        global.gsap.killTweensOf(overlay);
        global.gsap.to(overlay, {
            xPercent: -100,
            opacity: 0,
            duration: opts.fast ? 0.22 : EXIT_SEC,
            ease: 'power2.in',
            onComplete: function () {
                overlay.style.display = 'none';
                global.gsap.set(overlay, { xPercent: 100, opacity: 1 });
                if (typeof opts.onComplete === 'function') opts.onComplete();
            }
        });
    }

    function readNavTransition() {
        try {
            var raw = global.sessionStorage.getItem(NAV_SESSION_KEY);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return null;
            return parsed;
        } catch (e) {
            return null;
        }
    }

    function clearNavTransition() {
        try {
            global.sessionStorage.removeItem(NAV_SESSION_KEY);
        } catch (e) {
            /* no-op */
        }
    }

    /**
     * Start a full-page transition:
     * 1) show overlay immediately,
     * 2) navigate to target URL,
     * 3) on next page, keep overlay visible for hold duration and then reveal content.
     */
    function startPageTransition(href, opts) {
        opts = opts || {};
        var target = String(href || '');
        if (!target) return;
        var hold = typeof opts.duration === 'number' ? opts.duration : NAV_DEFAULT_HOLD_SEC;
        var title = opts.title || 'Loading';

        try {
            global.sessionStorage.setItem(NAV_SESSION_KEY, JSON.stringify({
                hold: hold,
                title: title,
                ts: Date.now()
            }));
        } catch (e) {
            /* no-op */
        }

        // Step 1: overlay slides in from right to left.
        // Step 2: after entrance completes, start navigation.
        show({
            title: title,
            skipExit: true,
            onEntered: function () {
                global.location.assign(target);
            }
        });
    }

    function resumePageTransitionIfNeeded() {
        var payload = readNavTransition();
        if (!payload) return;
        clearNavTransition();
        var hold = typeof payload.hold === 'number' ? payload.hold : NAV_DEFAULT_HOLD_SEC;
        var title = payload.title || 'Loading';

        // New page starts with loader visible at center, then exits to the right.
        show({
            duration: Math.max(0.1, hold),
            title: title,
            skipEntrance: true,
            exitTo: 'right',
            onComplete: function () {
                document.documentElement.classList.remove('premium-transition-pending');
            }
        });
    }

    function removeInitialLoadPendingClass() {
        try {
            document.documentElement.classList.remove('premium-initial-load-pending');
        } catch (e) {
            /* no-op */
        }
    }

    /**
     * Full document reload: slide loader in on DOM ready, hold until window "load", then exit.
     * Relies on html.premium-initial-load-pending (set at boot) to hide in-progress paint.
     */
    function runInitialDocumentLoadOverlay() {
        if (global.__PREMIUM_SKIP_INITIAL_PAGE_LOADER__) {
            removeInitialLoadPendingClass();
            return;
        }
        if (!global.gsap) {
            removeInitialLoadPendingClass();
            return;
        }

        var parts = getParts();
        var overlay = parts.overlay;
        overlay.style.display = 'flex';
        global.gsap.killTweensOf(overlay);
        global.gsap.set(overlay, { xPercent: 100, opacity: 1 });

        var state = { entrance: false, load: false, dismissed: false, revealScheduled: false };

        function dismiss() {
            if (state.dismissed) return;
            state.dismissed = true;
            global.gsap.killTweensOf(overlay);
            global.gsap.to(overlay, {
                xPercent: -100,
                opacity: 0,
                duration: EXIT_SEC,
                ease: 'power2.in',
                onComplete: function () {
                    overlay.style.display = 'none';
                    global.gsap.set(overlay, { xPercent: 100, opacity: 1 });
                    removeInitialLoadPendingClass();
                }
            });
        }

        function tryReveal() {
            if (state.dismissed || !state.entrance || !state.load || state.revealScheduled) return;
            state.revealScheduled = true;
            global.gsap.delayedCall(INITIAL_LOAD_MIN_HOLD_SEC, dismiss);
        }

        global.gsap.to(overlay, {
            xPercent: 0,
            duration: ENTRANCE_SEC,
            ease: 'power3.out',
            onComplete: function () {
                state.entrance = true;
                tryReveal();
            }
        });

        if (document.readyState === 'complete') {
            state.load = true;
            tryReveal();
        } else {
            global.addEventListener('load', function () {
                state.load = true;
                tryReveal();
            }, { once: true });
        }
    }

    /** @param {number} [duration]
     *  @param {function} [callback] */
    function startLoader(duration, callback) {
        show({
            duration: duration != null ? duration : 1.2,
            onComplete: callback || null,
            title: 'Loading'
        });
    }

    global.LoadingOverlay = {
        ensure: ensureOverlay,
        show: show,
        hide: hide,
        setTitle: setTitle,
        startPageTransition: startPageTransition
    };

    global.startLoader = startLoader;

    function warmupOverlay() {
        try {
            ensureOverlay();
        } catch (e) {
            /* no-op */
        }
    }

    function onBootDomReady() {
        warmupOverlay();
        if (readNavTransition()) {
            resumePageTransitionIfNeeded();
        } else {
            runInitialDocumentLoadOverlay();
        }
    }

    // Before first paint of body content: hide chrome for in-app nav OR full reload loader.
    try {
        if (global.sessionStorage.getItem(NAV_SESSION_KEY)) {
            document.documentElement.classList.add('premium-transition-pending');
        } else if (!global.__PREMIUM_SKIP_INITIAL_PAGE_LOADER__) {
            document.documentElement.classList.add('premium-initial-load-pending');
        }
        if (document.head) injectKeyframes();
    } catch (e) {
        /* no-op */
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onBootDomReady, { once: true });
    } else {
        onBootDomReady();
    }

    global.addEventListener('pageshow', function (ev) {
        if (!ev.persisted) return;
        try {
            document.documentElement.classList.remove('premium-transition-pending');
        } catch (e2) {
            /* no-op */
        }
        removeInitialLoadPendingClass();
        var overlayBf = document.getElementById(OVERLAY_ID);
        if (!overlayBf) return;
        if (global.gsap) {
            global.gsap.killTweensOf(overlayBf);
            global.gsap.set(overlayBf, { xPercent: 100, opacity: 1 });
        }
        overlayBf.style.display = 'none';
    });
})(typeof window !== 'undefined' ? window : this);
