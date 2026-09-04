/**
 * Premium Select2 — centralized init for searchable, no-search, and multiple (checkbox) modes.
 *
 * Requires: jQuery, select2.full.min.js, global.css Select2 theme.
 *
 * Attributes on <select>:
 *   data-premium-select2="search" | "no-search" | "multiple"
 *     aliases: normal/searchable → search; without-search → no-search
 *   data-premium-select2-placeholder="Select…"
 *   data-premium-select2-dropdown-parent="#modal-overlay" (optional)
 *   data-premium-select2-allow-clear="false" (optional, default true)
 *
 * Multiple mode: checkboxes in list, Select all / Clear all, closed label "N Selected".
 */
(function (global, $) {
    'use strict';

    if (!$) {
        console.warn('[PremiumSelect2] jQuery required');
        return;
    }

    var INIT_FLAG = 'data-premium-select2-init';
    var STYLES_ID = 'premium-select2-extra-styles';

    function injectExtraStyles() {
        if (typeof document === 'undefined' || document.getElementById(STYLES_ID)) return;
        var st = document.createElement('style');
        st.id = STYLES_ID;
        st.textContent = [
            '.select2-container--default .select2-selection--multiple {',
            '  min-height: 42px !important;',
            '  border: 1px solid #e5e7eb !important;',
            '  border-radius: 12px !important;',
            '  padding: 4px 8px !important;',
            '  background: #fff !important;',
            '}',
            '.select2-container--default .select2-selection--multiple .select2-selection__rendered {',
            '  display: flex !important; align-items: center !important; padding: 0 !important;',
            '}',
            '.select2-container--premium-multiple .select2-selection__choice:not(.premium-s2-summary) {',
            '  display: none !important;',
            '}',
            '.select2-container--premium-multiple .select2-selection__choice.premium-s2-summary {',
            '  display: inline-flex !important; margin: 0 !important; padding: 2px 8px !important;',
            '  background: #f3f4f6 !important; border: none !important; color: #374151 !important;',
            '  font-size: 14px !important; font-weight: 600 !important; border-radius: 8px !important;',
            '}',
            '.select2-container--premium-multiple .select2-search--inline { display: none !important; }',
            '.premium-s2-dropdown-header {',
            '  padding: 8px 12px; border-bottom: 1px solid #f1f5f9;',
            '  display: flex; align-items: center; justify-content: space-between; gap: 8px;',
            '  font-size: 12px; font-weight: 700; color: #6b7280; background: #fafafa;',
            '}',
            '.premium-s2-dropdown-header .premium-s2-count { color: #374151; }',
            '.premium-s2-dropdown-actions { display: flex; gap: 8px; }',
            '.premium-s2-dropdown-actions button {',
            '  font-size: 11px; font-weight: 700; color: var(--primary-color, #dc2626);',
            '  background: none; border: none; cursor: pointer; padding: 0;',
            '}',
            '.premium-s2-dropdown-actions button:hover { text-decoration: underline; }',
            '.premium-s2-option { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #374151; }',
            '.premium-s2-option input[type="checkbox"] {',
            '  width: 16px; height: 16px; accent-color: var(--primary-color, #dc2626); pointer-events: none;',
            '}',
            '.select2-results__options { max-height: 220px !important; overflow-y: auto !important; }',
            '.select2-container--default .select2-search--dropdown .select2-search__field {',
            '  border: 1px solid #e5e7eb !important; border-radius: 8px !important;',
            '  font-size: 13px !important; font-weight: 600 !important; padding: 6px 10px !important;',
            '}'
        ].join('\n');
        (document.head || document.documentElement).appendChild(st);
    }

    function normalizeSelect2Mode(mode) {
        var m = String(mode || 'search').trim().toLowerCase();
        if (m === 'multiple' || m === 'multi') return 'multiple';
        if (m === 'no-search' || m === 'without-search' || m === 'nosearch') return 'no-search';
        return 'search';
    }

    function getSelect2Mode(el, options) {
        if (options && options.mode) return normalizeSelect2Mode(options.mode);
        if (el && el.hasAttribute('data-premium-select2')) {
            return normalizeSelect2Mode(el.getAttribute('data-premium-select2'));
        }
        return 'search';
    }

    function parseBoolAttr(el, name, defaultVal) {
        var v = el.getAttribute(name);
        if (v == null) return defaultVal;
        if (v === 'false' || v === '0') return false;
        return v === '' || v === 'true' || v === '1';
    }

    function resolveDropdownParent(el, scope, options) {
        if (options && options.dropdownParent) {
            var dp = options.dropdownParent;
            if (dp && dp.nodeType) return $(dp);
            if (typeof dp === 'string') return $(dp);
        }
        var attr = el.getAttribute('data-premium-select2-dropdown-parent');
        if (attr) {
            try {
                var found = (scope || document).querySelector(attr) || document.querySelector(attr);
                if (found) return $(found);
            } catch (e) { /* ignore */ }
        }
        var overlay = el.closest && el.closest('[data-modal-overlay]');
        if (overlay) return $(overlay);
        return $('body');
    }

    function getPlaceholder(el) {
        var custom = el.getAttribute('data-premium-select2-placeholder');
        if (custom) return custom;
        var first = el.querySelector('option');
        if (first && first.value === '') return first.textContent || 'Select';
        return 'Select';
    }

    function getAllOptionValues($select) {
        var vals = [];
        $select.find('option').each(function () {
            var v = $(this).attr('value');
            if (v != null && v !== '') vals.push(v);
        });
        return vals;
    }

    function updateMultipleSummary($select) {
        var mode = getSelect2Mode($select[0], null);
        if (mode !== 'multiple') return;

        var $container = $select.next('.select2-container');
        if (!$container.length) return;

        $container.addClass('select2-container--premium-multiple');
        var vals = $select.val() || [];
        if (!Array.isArray(vals)) vals = vals ? [vals] : [];
        var $rendered = $container.find('.select2-selection--multiple .select2-selection__rendered');
        $rendered.find('.select2-selection__choice').remove();
        $rendered.find('.select2-search--inline').remove();

        if (vals.length) {
            $rendered.prepend(
                '<li class="select2-selection__choice premium-s2-summary" title="' + vals.length + ' selected">' +
                vals.length + ' Selected</li>'
            );
        }
    }

    function bindMultipleHeader($select) {
        var mode = getSelect2Mode($select[0], null);
        if (mode !== 'multiple') return;

        $select.off('select2:open.premiumS2').on('select2:open.premiumS2', function () {
            var s2 = $select.data('select2');
            if (!s2 || !s2.$dropdown) return;

            var $dropdown = s2.$dropdown;
            $dropdown.find('.premium-s2-dropdown-header').remove();

            var vals = $select.val() || [];
            if (!Array.isArray(vals)) vals = vals ? [vals] : [];
            var count = vals.length;

            var $header = $(
                '<div class="premium-s2-dropdown-header">' +
                '  <span class="premium-s2-count">' + count + ' Selected</span>' +
                '  <div class="premium-s2-dropdown-actions">' +
                '    <button type="button" data-premium-s2-select-all>Select all</button>' +
                '    <button type="button" data-premium-s2-clear-all>Clear</button>' +
                '  </div>' +
                '</div>'
            );

            $header.find('[data-premium-s2-select-all]').on('click', function (evt) {
                evt.preventDefault();
                evt.stopPropagation();
                $select.val(getAllOptionValues($select)).trigger('change');
                updateMultipleSummary($select);
                var $count = $dropdown.find('.premium-s2-count');
                $count.text(($select.val() || []).length + ' Selected');
            });

            $header.find('[data-premium-s2-clear-all]').on('click', function (evt) {
                evt.preventDefault();
                evt.stopPropagation();
                $select.val(null).trigger('change');
                updateMultipleSummary($select);
                $dropdown.find('.premium-s2-count').text('0 Selected');
            });

            $dropdown.prepend($header);
        });

        $select.off('change.premiumS2').on('change.premiumS2', function () {
            updateMultipleSummary($select);
            var s2 = $select.data('select2');
            if (s2 && s2.$dropdown) {
                var vals = $select.val() || [];
                if (!Array.isArray(vals)) vals = vals ? [vals] : [];
                s2.$dropdown.find('.premium-s2-count').text(vals.length + ' Selected');
            }
        });
    }

    function formatOptionWithCheckbox(data, $select) {
        if (!data.id) return data.text;
        var selected = $select.val() || [];
        if (!Array.isArray(selected)) selected = selected ? [String(selected)] : [];
        var checked = selected.indexOf(String(data.id)) >= 0;
        var $wrap = $('<span class="premium-s2-option"></span>');
        $wrap.append($('<input type="checkbox" tabindex="-1" />').prop('checked', checked));
        $wrap.append($('<span></span>').text(data.text));
        return $wrap;
    }

    function buildOptions(el, scope, options) {
        var mode = getSelect2Mode(el, options);
        var $select = $(el);
        var placeholder = getPlaceholder(el);
        var allowClear = parseBoolAttr(el, 'data-premium-select2-allow-clear', true);
        var $parent = resolveDropdownParent(el, scope, options);

        var config = {
            placeholder: placeholder,
            allowClear: allowClear,
            width: '100%',
            dropdownParent: $parent,
            minimumResultsForSearch: mode === 'no-search' ? Infinity : 0
        };

        if (mode === 'multiple') {
            if (!$select.prop('multiple')) {
                $select.prop('multiple', true);
            }
            config.closeOnSelect = false;
            config.allowClear = allowClear;
            config.templateResult = function (data) {
                return formatOptionWithCheckbox(data, $select);
            };
            config.templateSelection = function (data) {
                return data.text;
            };
            config.escapeMarkup = function (m) { return m; };
        }

        return config;
    }

    function destroy(el) {
        var $el = $(el);
        if (!$el.length) return;
        $el.removeAttr(INIT_FLAG);
        $el.off('.premiumS2');
        if ($el.hasClass('select2-hidden-accessible') && $.fn.select2) {
            try { $el.select2('destroy'); } catch (e) { /* ignore */ }
        }
    }

    function init(el, options) {
        if (!el || !$.fn.select2) {
            console.warn('[PremiumSelect2] select2 plugin not loaded');
            return null;
        }

        if (options && options.endpoint) {
            var domain = (typeof localStorage !== 'undefined' ? localStorage.getItem('Domain') : '') || '';
            var url = domain + options.endpoint;
            var $loadingSelect = $(el);

            $loadingSelect.empty();
            var pl = options.placeholder || getPlaceholder(el) || 'Loading...';
            $loadingSelect.append($('<option></option>').attr('value', '').text('Loading...'));

            fetch(url)
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    console.log(data);
                    var list = Array.isArray(data) ? data : (data.data || data.Data || []);
                    if (typeof options.mapItem === 'function') {
                        options.options = list.map(options.mapItem);
                    } else {
                        options.options = list;
                    }
                    delete options.endpoint; // Prevent recursion loop
                    init(el, options);
                })
                .catch(function (err) {
                    console.error('[PremiumSelect2] Error fetching options:', err);
                    delete options.endpoint;
                    init(el, options);
                });

            var tempConfig = buildOptions(el, options && options.scope, options);
            destroy(el);
            $loadingSelect.select2(tempConfig);
            el.setAttribute(INIT_FLAG, '1');
            return $loadingSelect;
        }

        if (el.getAttribute(INIT_FLAG) === '1') {
            destroy(el);
        }

        injectExtraStyles();

        var $select = $(el);

        if (options && options.options && Array.isArray(options.options)) {
            $select.empty();
            var mode = getSelect2Mode(el, options);
            var placeholderText = options.placeholder || getPlaceholder(el) || 'Select';
            if (mode !== 'multiple') {
                $select.append($('<option></option>').attr('value', '').text(placeholderText));
            }
            options.options.forEach(function (opt) {
                var value = opt.id != null ? opt.id : opt;
                var text = opt.text != null ? opt.text : opt;
                $select.append($('<option></option>').attr('value', value).text(text));
            });
        }

        var config = buildOptions(el, options && options.scope, options);

        destroy(el);
        $select.select2(config);
        el.setAttribute(INIT_FLAG, '1');

        var mode = getSelect2Mode(el, options);
        if (mode === 'multiple') {
            bindMultipleHeader($select);
            updateMultipleSummary($select);
        }

        return $select;
    }

    function initInScope(scope, options) {
        var root = scope || document;
        var nodes = root.querySelectorAll
            ? root.querySelectorAll('select[data-premium-select2]')
            : [];
        var list = [];
        var i;
        for (i = 0; i < nodes.length; i++) {
            list.push(init(nodes[i], Object.assign({}, options || {}, { scope: scope })));
        }
        return list;
    }

    function destroyInScope(scope) {
        var root = scope || document;
        var nodes = root.querySelectorAll
            ? root.querySelectorAll('select[data-premium-select2]')
            : [];
        var i;
        for (i = 0; i < nodes.length; i++) {
            destroy(nodes[i]);
        }
    }

    function refreshInScope(scope, options) {
        destroyInScope(scope);
        return initInScope(scope, options);
    }

    /** Resolve dropdown parent from premium-popup-modal host (same as pages use today). */
    function dropdownParentFromModal(modalEl) {
        if (modalEl && modalEl.getSelect2DropdownParent) {
            return modalEl.getSelect2DropdownParent();
        }
        if (modalEl && modalEl.nodeType) {
            var overlay = modalEl.querySelector && modalEl.querySelector('[data-modal-overlay]');
            return overlay || modalEl;
        }
        return document.body;
    }

    /**
     * Dynamically render the entire Select2 component (label + select + initialization).
     * @param {string|HTMLElement|jQuery} container - The container where the component should be rendered.
     * @param {object} options - Configuration object.
     *   - id {string} (required) - ID for the select element.
     *   - label {string} (required) - Label text.
     *   - placeholder {string} - Placeholder text.
     *   - required {boolean} - Whether the field is required (adds asterisk).
     *   - mode {string} - 'search', 'no-search', or 'multiple'
     *   - options {Array} - Array of objects like { id: 'value', text: 'Display Text' }
     *   - dropdownParent {HTMLElement|jQuery} - Dropdown parent (e.g. modal).
     * @returns {jQuery} The generated select element (already initialized).
     */
    function render(container, options) {
        var $container = $(container);
        if (!$container.length) {
            console.warn('[PremiumSelect2] Render container not found.');
            return null;
        }

        var config = options || {};
        var id = config.id || ('select2-' + Date.now());
        var labelText = config.label || '';
        if (config.required && labelText.indexOf('*') === -1) {
            labelText += ' *';
        }

        $container.empty();
        if (!$container.hasClass('space-y-1')) {
            $container.addClass('space-y-1');
        }

        if (labelText) {
            var $label = $('<label></label>')
                .attr('for', id)
                .attr('data-premium-label', '')
                .text(labelText);
            $container.append($label);
        }

        var $select = $('<select></select>')
            .attr('id', id)
            .attr('class', 'w-full')
            .attr('data-premium-input', '');

        if (config.required) {
            $select.attr('required', 'required');
        }

        if (config.mode) {
            $select.attr('data-premium-select2', config.mode);
        }

        var placeholderText = config.placeholder || 'Select';
        if (config.mode !== 'multiple') {
            $select.append($('<option></option>').attr('value', '').text(placeholderText));
        }

        if (config.options && Array.isArray(config.options)) {
            config.options.forEach(function (opt) {
                var value = opt.id != null ? opt.id : opt;
                var text = opt.text != null ? opt.text : opt;
                $select.append($('<option></option>').attr('value', value).text(text));
            });
        }

        $container.append($select);

        return init($select[0], config);
    }

    global.PremiumSelect2 = {
        init: init,
        destroy: destroy,
        initInScope: initInScope,
        destroyInScope: destroyInScope,
        refreshInScope: refreshInScope,
        dropdownParentFromModal: dropdownParentFromModal,
        getMode: getSelect2Mode,
        render: render
    };
})(typeof window !== 'undefined' ? window : this, typeof jQuery !== 'undefined' ? jQuery : null);
