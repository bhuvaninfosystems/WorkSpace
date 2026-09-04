/**
 * Premium Input Styles - NewDesign themed form styling helper.
 *
 * Purpose:
 * - Centralize modal input/label classes in one place.
 * - Keep native HTML controls (input/select/textarea).
 * - Apply styling by data attributes or by full-scope scan.
 *
 * Date fields (input[type="date"] + data-premium-date):
 *   forward-block  — block future dates (max = today)
 *   backward-block — block past dates (min = today)
 *   default-today  — value = today, read-only + disabled
 *   normal         — open selection (optional data-premium-date-min / data-premium-date-max)
 *   age            — DOB-style limits via data-premium-date-min-age / data-premium-date-max-age (years)
 *   from           — range start; max = today unless data-premium-date-allow-future="true"
 *   to             — range end; requires data-premium-date-from="#fromId"; min = from, max = today
 *
 * Number fields (input[type="number"|"text"] + data-premium-number):
 *   fraction         — decimals allowed (data-premium-number-fraction-digits, default 2)
 *   integer          — whole numbers only (aliases: whole, without-fraction, no-fraction)
 *   data-premium-number-min-length / data-premium-number-max-length — digit count (0–9 only)
 *   data-premium-number-min / data-premium-number-max — optional numeric value bounds
 *
 * Text fields (data-premium-text on input/textarea, or data-premium-input):
 *   normal      — standard single-line text (default)
 *   textarea    — multi-line (use on <textarea> or sets rows via data-premium-text-rows)
 *   title-case  — capitalize first letter of each word on blur (aliases: title, capitalize)
 * Required fields (required attribute): linked label gets automatic red * (data-premium-required-mark)
 *
 * Phone fields (data-premium-phone):
 *   plain / without-country — single tel input, digits only, min/max length on number
 *   with-country / country   — dial <select> + number input (group or auto-wrap on input)
 *   data-premium-phone-min-length / data-premium-phone-max-length — digit count for national number
 */
(function (global) {
    'use strict';

    var TOKENS = {
        base: 'w-full px-5 py-2.5 rounded-xl bg-white border border-gray-200/80 transition-all outline-none text-sm font-semibold',
        focus: 'focus:border-gray-400 focus:ring-4 focus:ring-gray-100',
        disabled: 'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed',
        label: 'block text-xs font-bold text-gray-400 group-focus-within:text-gray-600 transition-colors',
        selectChevron: 'appearance-none cursor-pointer',
        textarea: 'resize-none',
        file: 'cursor-pointer',
        range: 'w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary-500',
        checkbox: 'w-4 h-4 accent-primary-500 rounded',
        radio: 'w-4 h-4 accent-primary-500',
        color: 'w-full h-10 p-1 rounded-xl bg-white border border-gray-200/80 focus:border-primary-500/50 transition-all outline-none cursor-pointer',
        optionText: 'text-sm font-semibold text-gray-600 group-hover:text-primary-500 transition-colors',
        radioGroup: 'space-y-1',
        radioOptions: 'flex flex-wrap items-center gap-5',
        radioOption: 'group inline-flex cursor-pointer items-center gap-2',
        toggleTrack: 'w-11 h-6 bg-gray-200 rounded-full transition-colors duration-300 relative',
        toggleKnob: "content-[''] absolute top-[2px] left-[2px] h-5 w-5 rounded-full border border-gray-300 bg-white transition-all duration-300",
        fileTrigger: 'w-full flex flex-col items-center justify-center gap-3 px-5 py-8 rounded-xl bg-gray-50/50 border border-dashed border-gray-300 hover:bg-white hover:border-gray-400 hover:ring-4 hover:ring-gray-100 transition-all cursor-pointer',
        fileIconWrap: 'w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500',
        fileLabelText: 'text-sm font-semibold text-gray-500',
        requiredMark: 'text-red-500 ml-0.5 font-bold'
    };

    var TEXT_BOUND_FLAG = 'data-premium-text-bound';
    var PHONE_BOUND_FLAG = 'data-premium-phone-bound';
    var PHONE_GROUP_FLAG = 'data-premium-phone-group';

    var DEFAULT_PHONE_DIAL_CODES = [
        { code: '+91', label: '+91 IN' },
        { code: '+1', label: '+1 US' },
        { code: '+44', label: '+44 UK' },
        { code: '+971', label: '+971 AE' },
        { code: '+61', label: '+61 AU' },
        { code: '+65', label: '+65 SG' },
        { code: '+60', label: '+60 MY' },
        { code: '+966', label: '+966 SA' },
        { code: '+974', label: '+974 QA' },
        { code: '+94', label: '+94 LK' },
        { code: '+880', label: '+880 BD' },
        { code: '+92', label: '+92 PK' },
        { code: '+86', label: '+86 CN' },
        { code: '+81', label: '+81 JP' },
        { code: '+49', label: '+49 DE' },
        { code: '+33', label: '+33 FR' }
    ];

    function addClasses(el, classes) {
        if (!el || !classes) return;
        String(classes).split(/\s+/).forEach(function (name) {
            if (name) el.classList.add(name);
        });
    }

    function getClassForType(type, extraClasses) {
        var t = String(type || 'text').toLowerCase();
        var out = '';

        if (t === 'checkbox') out = TOKENS.checkbox;
        else if (t === 'radio') out = TOKENS.radio;
        else if (t === 'range') out = TOKENS.range;
        else if (t === 'color') out = TOKENS.color;
        else {
            out = TOKENS.base + ' ' + TOKENS.focus + ' ' + TOKENS.disabled;
            if (t === 'select-one' || t === 'select-multiple' || t === 'select') out += ' ' + TOKENS.selectChevron;
            if (t === 'textarea') out += ' ' + TOKENS.textarea;
            if (t === 'file') out += ' ' + TOKENS.file;
        }

        if (extraClasses) out += ' ' + String(extraClasses);
        return out.trim();
    }

    function applyInput(el, type, extraClasses) {
        if (!el) return;
        var resolvedType = type || el.getAttribute('data-premium-type') || el.getAttribute('type') || el.tagName.toLowerCase();
        var extra = extraClasses != null ? extraClasses : (el.getAttribute('data-premium-extra') || '');
        addClasses(el, getClassForType(resolvedType, extra));
    }

    function applyLabel(el, extraClasses) {
        if (!el) return;
        var extra = extraClasses != null ? extraClasses : (el.getAttribute('data-premium-label-extra') || '');
        addClasses(el, TOKENS.label + (extra ? ' ' + extra : ''));
    }

    function applyToggle(toggleRoot) {
        if (!toggleRoot) return;
        var input = toggleRoot.querySelector('input[type="checkbox"]');
        var track = toggleRoot.querySelector('[data-premium-toggle-track]');
        var knob = toggleRoot.querySelector('[data-premium-toggle-knob]');
        var text = toggleRoot.querySelector('[data-premium-toggle-text]');

        if (input) addClasses(input, 'sr-only peer');
        if (track) {
            addClasses(track, TOKENS.toggleTrack);
            addClasses(track, 'peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/10 peer-checked:bg-primary-500');
        }
        if (knob) {
            addClasses(knob, TOKENS.toggleKnob);
            addClasses(knob, 'peer-checked:translate-x-full peer-checked:border-white');
        }
        if (text) addClasses(text, 'ml-3 text-sm font-semibold text-gray-600 italic');
    }

    function parseByteSize(str) {
        if (!str) return 0;
        var match = str.toUpperCase().match(/^([\d.]+)\s*(KB|MB|GB|B)?$/);
        if (!match) return 0;
        var num = parseFloat(match[1]);
        var unit = match[2] || 'B';
        if (unit === 'KB') return num * 1024;
        if (unit === 'MB') return num * 1024 * 1024;
        if (unit === 'GB') return num * 1024 * 1024 * 1024;
        return num;
    }

    function applyFileField(fileRoot) {
        if (!fileRoot) return;
        var trigger = fileRoot.querySelector('[data-premium-file-trigger]');
        var iconWrap = fileRoot.querySelector('[data-premium-file-icon-wrap]');
        var labelText = fileRoot.querySelector('[data-premium-file-text]');
        var fileInput = fileRoot.querySelector('input[type="file"]');

        if (trigger) addClasses(trigger, TOKENS.fileTrigger);
        if (iconWrap) addClasses(iconWrap, TOKENS.fileIconWrap);
        if (labelText) addClasses(labelText, TOKENS.fileLabelText);
        if (fileInput) addClasses(fileInput, 'hidden');

        if (fileInput && !fileInput.__premiumFileBound) {
            fileInput.__premiumFileBound = true;
            var defaultText = labelText ? labelText.textContent : 'Click to upload';
            
            fileInput.addEventListener('change', function() {
                var maxSizeStr = fileInput.getAttribute('data-premium-file-max-size');
                var maxBytes = parseByteSize(maxSizeStr);
                
                if (fileInput.files && fileInput.files.length > 0) {
                    var file = fileInput.files[0];
                    if (maxBytes > 0 && file.size > maxBytes) {
                        alert('File too large! Maximum size allowed is ' + maxSizeStr);
                        fileInput.value = '';
                        if (labelText) labelText.textContent = defaultText;
                    } else {
                        if (labelText) labelText.textContent = file.name;
                    }
                } else {
                    if (labelText) labelText.textContent = defaultText;
                }
            });
        }
    }

    function applyOptionText(el) {
        if (!el) return;
        addClasses(el, TOKENS.optionText);
    }

    var DATE_BOUND_FLAG = 'data-premium-date-bound';

    function pad2(n) {
        return (n < 10 ? '0' : '') + n;
    }

    /** @returns {string} YYYY-MM-DD in local timezone */
    function getTodayISO() {
        var d = new Date();
        return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
    }

    function parseISODate(str) {
        if (!str || typeof str !== 'string') return null;
        var parts = str.split('-');
        if (parts.length !== 3) return null;
        var y = Number(parts[0]);
        var m = Number(parts[1]);
        var d = Number(parts[2]);
        if (!isFinite(y) || !isFinite(m) || !isFinite(d)) return null;
        var dt = new Date(y, m - 1, d);
        if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
        return dt;
    }

    function toISODateString(dateObj) {
        if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) return '';
        return dateObj.getFullYear() + '-' + pad2(dateObj.getMonth() + 1) + '-' + pad2(dateObj.getDate());
    }

    /** Subtract whole years from a date (for age-based limits). */
    function subtractYears(baseDate, years) {
        var y = Math.max(0, Math.floor(Number(years) || 0));
        var d = new Date(baseDate.getTime());
        d.setFullYear(d.getFullYear() - y);
        return d;
    }

    function readAttrISO(el, attrName) {
        var raw = el.getAttribute(attrName);
        if (!raw) return null;
        var dt = parseISODate(String(raw).trim());
        return dt ? toISODateString(dt) : null;
    }

    function parseBoolAttr(el, attrName) {
        var v = el.getAttribute(attrName);
        return v === '' || v === 'true' || v === '1';
    }

    function resolveFromDateInput(el, scope) {
        var sel = el.getAttribute('data-premium-date-from');
        if (!sel) return null;
        var root = scope || document;
        try {
            return root.querySelector(sel) || document.querySelector(sel);
        } catch (e) {
            return null;
        }
    }

    function getDateMode(el) {
        var mode = String(el.getAttribute('data-premium-date') || 'normal').trim().toLowerCase();
        if (mode === 'age-restricted' || mode === 'age_restricted') return 'age';
        if (mode === 'default' || mode === 'today') return 'default-today';
        return mode;
    }

    function isDateInput(el) {
        return el && String(el.tagName || '').toLowerCase() === 'input'
            && String(el.getAttribute('type') || '').toLowerCase() === 'date';
    }

    /**
     * Compute min/max ISO strings for a date input from data-premium-date* attributes.
     * @returns {{ min: string|null, max: string|null, value: string|null, locked: boolean }}
     */
    function resolveDateConstraints(el, scope) {
        var mode = getDateMode(el);
        var today = getTodayISO();
        var min = readAttrISO(el, 'data-premium-date-min');
        var max = readAttrISO(el, 'data-premium-date-max');
        var value = null;
        var locked = false;
        var minAge = el.getAttribute('data-premium-date-min-age');
        var maxAge = el.getAttribute('data-premium-date-max-age');
        var allowFuture = parseBoolAttr(el, 'data-premium-date-allow-future');
        var todayDate = parseISODate(today);

        if (mode === 'forward-block') {
            max = max || today;
        } else if (mode === 'backward-block') {
            min = min || today;
        } else if (mode === 'default-today') {
            value = today;
            locked = true;
            min = today;
            max = today;
        } else if (mode === 'age') {
            if (todayDate) {
                if (minAge != null && minAge !== '') {
                    var minAgeNum = Number(minAge);
                    if (isFinite(minAgeNum) && minAgeNum >= 0) {
                        max = max || toISODateString(subtractYears(todayDate, minAgeNum));
                    }
                }
                if (maxAge != null && maxAge !== '') {
                    var maxAgeNum = Number(maxAge);
                    if (isFinite(maxAgeNum) && maxAgeNum >= 0) {
                        min = min || toISODateString(subtractYears(todayDate, maxAgeNum));
                    }
                }
            }
        } else if (mode === 'from') {
            if (!allowFuture) {
                max = max || today;
            }
        } else if (mode === 'to') {
            max = max || today;
            var fromEl = resolveFromDateInput(el, scope);
            if (fromEl && fromEl.value) {
                var fromIso = toISODateString(parseISODate(fromEl.value));
                if (fromIso) min = min || fromIso;
            }
        }

        if (min && max && min > max) {
            max = min;
        }

        return { min: min, max: max, value: value, locked: locked, mode: mode };
    }

    function clampDateValue(iso, min, max) {
        if (!iso) return iso;
        if (min && iso < min) return min;
        if (max && iso > max) return max;
        return iso;
    }

    function applyDateConstraintsToElement(el, scope) {
        if (!isDateInput(el) || !el.hasAttribute('data-premium-date')) return;

        var c = resolveDateConstraints(el, scope);
        if (c.min) el.setAttribute('min', c.min); else el.removeAttribute('min');
        if (c.max) el.setAttribute('max', c.max); else el.removeAttribute('max');

        if (c.locked) {
            if (c.value) el.value = c.value;
            el.setAttribute('readonly', 'readonly');
            el.disabled = true;
        } else {
            el.removeAttribute('readonly');
            el.disabled = false;
            if (el.value) {
                el.value = clampDateValue(el.value, c.min, c.max);
            }
        }
    }

    function bindToDateFromPartner(toEl, scope) {
        var fromEl = resolveFromDateInput(toEl, scope);
        if (!fromEl) return;

        var onFromChange = function () {
            applyDateConstraintsToElement(toEl, scope);
            if (toEl.value) {
                var c = resolveDateConstraints(toEl, scope);
                toEl.value = clampDateValue(toEl.value, c.min, c.max);
            }
        };

        if (fromEl.getAttribute(DATE_BOUND_FLAG) !== '1') {
            fromEl.setAttribute(DATE_BOUND_FLAG, '1');
            fromEl.addEventListener('change', onFromChange);
            fromEl.addEventListener('input', onFromChange);
        }

        if (toEl.getAttribute(DATE_BOUND_FLAG) !== '1') {
            toEl.setAttribute(DATE_BOUND_FLAG, '1');
            toEl.addEventListener('change', function () {
                applyDateConstraintsToElement(toEl, scope);
                if (toEl.value) {
                    var c = resolveDateConstraints(toEl, scope);
                    toEl.value = clampDateValue(toEl.value, c.min, c.max);
                }
            });
            toEl.addEventListener('input', function () {
                applyDateConstraintsToElement(toEl, scope);
                if (toEl.value) {
                    var c = resolveDateConstraints(toEl, scope);
                    toEl.value = clampDateValue(toEl.value, c.min, c.max);
                }
            });
        }
    }

    function applyDateField(el, scope) {
        if (!isDateInput(el) || !el.hasAttribute('data-premium-date')) return el;
        applyDateConstraintsToElement(el, scope);
        if (getDateMode(el) === 'to') {
            bindToDateFromPartner(el, scope);
        }
        if (getDateMode(el) === 'from') {
            var scopeRoot = scope || document;
            scopeRoot.querySelectorAll('input[type="date"][data-premium-date="to"]').forEach(function (toEl) {
                var fromSel = toEl.getAttribute('data-premium-date-from');
                if (!fromSel) return;
                try {
                    if (scopeRoot.querySelector(fromSel) === el || document.querySelector(fromSel) === el) {
                        bindToDateFromPartner(toEl, scope);
                        applyDateConstraintsToElement(toEl, scope);
                    }
                } catch (e) { /* ignore invalid selector */ }
            });
        }
        return el;
    }

    function queryDateFields(root) {
        var scope = root || document;
        return scope.querySelectorAll('input[type="date"][data-premium-date]');
    }

    function applyDateFields(scope) {
        var root = scope || document;
        var fields = queryDateFields(root);
        fields.forEach(function (el) {
            applyDateField(el, root);
        });
        return fields;
    }

    function refreshDateFields(scope) {
        return applyDateFields(scope);
    }

    var NUMBER_BOUND_FLAG = 'data-premium-number-bound';

    function parsePositiveIntAttr(el, attrName) {
        var raw = el.getAttribute(attrName);
        if (raw == null || raw === '') return null;
        var n = parseInt(raw, 10);
        return isFinite(n) && n >= 0 ? n : null;
    }

    function parseNumberAttr(el, attrName) {
        var raw = el.getAttribute(attrName);
        if (raw == null || raw === '') return null;
        var n = Number(raw);
        return isFinite(n) ? n : null;
    }

    function getNumberMode(el) {
        var mode = String(el.getAttribute('data-premium-number') || 'integer').trim().toLowerCase();
        if (mode === 'fraction' || mode === 'with-fraction' || mode === 'decimal') return 'fraction';
        if (mode === 'integer' || mode === 'whole' || mode === 'without-fraction' || mode === 'no-fraction') return 'integer';
        return 'integer';
    }

    function isNumberField(el) {
        if (!el || String(el.tagName || '').toLowerCase() !== 'input') return false;
        if (!el.hasAttribute('data-premium-number')) return false;
        var t = String(el.getAttribute('type') || 'text').toLowerCase();
        return t === 'number' || t === 'text' || t === 'tel';
    }

    function countDigits(str) {
        return String(str || '').replace(/\D/g, '').length;
    }

    /**
     * @returns {{ mode: string, minLength: number|null, maxLength: number|null, fractionDigits: number, valueMin: number|null, valueMax: number|null }}
     */
    function resolveNumberConstraints(el) {
        var mode = getNumberMode(el);
        var minLength = parsePositiveIntAttr(el, 'data-premium-number-min-length');
        var maxLength = parsePositiveIntAttr(el, 'data-premium-number-max-length');
        var fractionDigits = parsePositiveIntAttr(el, 'data-premium-number-fraction-digits');
        if (fractionDigits == null) fractionDigits = mode === 'fraction' ? 2 : 0;
        return {
            mode: mode,
            minLength: minLength,
            maxLength: maxLength,
            fractionDigits: fractionDigits,
            valueMin: parseNumberAttr(el, 'data-premium-number-min'),
            valueMax: parseNumberAttr(el, 'data-premium-number-max')
        };
    }

    function buildFractionStep(digits) {
        var d = Math.max(0, Math.min(8, digits || 2));
        if (d === 0) return '1';
        return '0.' + Array(d).join('0') + '1';
    }

    function sanitizeNumberValue(raw, constraints) {
        var mode = constraints.mode;
        var maxLength = constraints.maxLength;
        var fractionDigits = constraints.fractionDigits;
        var s = String(raw == null ? '' : raw).trim();
        if (!s) return '';

        var negative = s.charAt(0) === '-';
        s = s.replace(/[^\d.]/g, '');
        if (mode === 'integer') {
            s = s.replace(/\./g, '');
            var digits = s.replace(/\D/g, '');
            if (maxLength != null && digits.length > maxLength) {
                digits = digits.slice(0, maxLength);
            }
            return (negative && digits ? '-' : '') + digits;
        }

        var parts = s.split('.');
        var intPart = (parts[0] || '').replace(/\D/g, '');
        var fracPart = parts.length > 1 ? parts.slice(1).join('').replace(/\D/g, '') : '';
        if (fractionDigits > 0 && fracPart.length > fractionDigits) {
            fracPart = fracPart.slice(0, fractionDigits);
        } else if (fractionDigits === 0) {
            fracPart = '';
        }
        var allDigits = intPart + fracPart;
        if (maxLength != null && allDigits.length > maxLength) {
            var over = allDigits.length - maxLength;
            if (fracPart.length >= over) {
                fracPart = fracPart.slice(0, Math.max(0, fracPart.length - over));
            } else {
                over -= fracPart.length;
                fracPart = '';
                intPart = intPart.slice(0, Math.max(0, intPart.length - over));
            }
        }
        var out = intPart;
        if (fracPart.length) out += '.' + fracPart;
        return (negative && out ? '-' : '') + out;
    }

    function applyNumberValidity(el, constraints) {
        var val = String(el.value || '').trim();
        var minLen = constraints.minLength;
        var digitCount = countDigits(val);
        if (!val) {
            el.setCustomValidity('');
            return;
        }
        if (minLen != null && digitCount < minLen) {
            el.setCustomValidity('Enter at least ' + minLen + ' digit' + (minLen === 1 ? '' : 's') + '.');
            return;
        }
        var num = Number(val);
        if (constraints.valueMin != null && isFinite(num) && num < constraints.valueMin) {
            el.setCustomValidity('Minimum value is ' + constraints.valueMin + '.');
            return;
        }
        if (constraints.valueMax != null && isFinite(num) && num > constraints.valueMax) {
            el.setCustomValidity('Maximum value is ' + constraints.valueMax + '.');
            return;
        }
        el.setCustomValidity('');
    }

    function applyNumberConstraintsToElement(el) {
        if (!isNumberField(el)) return;

        var c = resolveNumberConstraints(el);
        var type = String(el.getAttribute('type') || '').toLowerCase();
        if (!type || type === 'text' || type === 'tel') {
            el.setAttribute('type', 'text');
            el.setAttribute('inputmode', c.mode === 'fraction' ? 'decimal' : 'numeric');
        } else if (type === 'number') {
            el.setAttribute('inputmode', c.mode === 'fraction' ? 'decimal' : 'numeric');
            el.setAttribute('step', c.mode === 'fraction' ? buildFractionStep(c.fractionDigits) : '1');
        }

        if (c.valueMin != null) el.setAttribute('min', String(c.valueMin)); else el.removeAttribute('min');
        if (c.valueMax != null) el.setAttribute('max', String(c.valueMax)); else el.removeAttribute('max');

        if (el.value) {
            el.value = sanitizeNumberValue(el.value, c);
        }
        applyNumberValidity(el, c);
    }

    function bindNumberField(el) {
        if (!isNumberField(el) || el.getAttribute(NUMBER_BOUND_FLAG) === '1') return;

        el.setAttribute(NUMBER_BOUND_FLAG, '1');
        var constraints = resolveNumberConstraints(el);

        var onInput = function () {
            var c = resolveNumberConstraints(el);
            var next = sanitizeNumberValue(el.value, c);
            
            if (next !== '' && c.valueMax != null && Number(next) > c.valueMax) {
                next = String(c.valueMax);
            }
            
            if (el.value !== next) el.value = next;
            applyNumberValidity(el, c);
        };

        var onKeyDown = function (evt) {
            var c = resolveNumberConstraints(el);
            if (c.mode === 'integer' && (evt.key === '.' || evt.key === ',' || evt.key === 'e' || evt.key === 'E')) {
                evt.preventDefault();
            }
        };

        var onBlur = function () {
            var c = resolveNumberConstraints(el);
            var next = sanitizeNumberValue(el.value, c);
            
            if (next !== '') {
                var num = Number(next);
                if (c.valueMax != null && num > c.valueMax) {
                    next = String(c.valueMax);
                }
                if (c.valueMin != null && num < c.valueMin) {
                    next = String(c.valueMin);
                }
            }
            
            if (el.value !== next) el.value = next;
            applyNumberValidity(el, c);
        };

        el.addEventListener('input', onInput);
        el.addEventListener('keydown', onKeyDown);
        el.addEventListener('blur', onBlur);
    }

    function applyNumberField(el) {
        if (!isNumberField(el)) return el;
        applyNumberConstraintsToElement(el);
        bindNumberField(el);
        return el;
    }

    function queryNumberFields(root) {
        return (root || document).querySelectorAll('input[data-premium-number]');
    }

    function applyNumberFields(scope) {
        var root = scope || document;
        var fields = queryNumberFields(root);
        fields.forEach(function (el) { applyNumberField(el); });
        return fields;
    }

    function refreshNumberFields(scope) {
        return applyNumberFields(scope);
    }

    function validateNumberField(el) {
        if (!isNumberField(el)) return true;
        applyNumberConstraintsToElement(el);
        return el.checkValidity();
    }

    function normalizeTextMode(mode, el) {
        var m = String(mode || 'normal').trim().toLowerCase();
        if (m === 'textarea' || m === 'area' || m === 'multiline') return 'textarea';
        if (m === 'title-case' || m === 'titlecase' || m === 'title' || m === 'capitalize' || m === 'capital') {
            return 'title-case';
        }
        return 'normal';
    }

    function getTextMode(el) {
        if (!el) return 'normal';
        if (String(el.tagName || '').toLowerCase() === 'textarea') return 'textarea';
        if (el.hasAttribute('data-premium-text')) {
            return normalizeTextMode(el.getAttribute('data-premium-text'), el);
        }
        return 'normal';
    }

    function isTextControl(el) {
        if (!el) return false;
        var tag = String(el.tagName || '').toLowerCase();
        if (tag === 'textarea') return true;
        if (tag !== 'input') return false;
        var type = String(el.getAttribute('type') || 'text').toLowerCase();
        if (type === 'hidden' || type === 'checkbox' || type === 'radio' || type === 'file'
            || type === 'button' || type === 'submit' || type === 'reset' || type === 'range'
            || type === 'date' || type === 'number' || type === 'color') return false;
        if (el.hasAttribute('data-premium-number')) return false;
        if (el.hasAttribute('data-premium-date')) return false;
        if (el.hasAttribute('data-premium-phone')) return false;
        if (el.hasAttribute('data-premium-phone-number')) return false;
        if (el.closest && el.closest('[data-premium-phone-group]')) return false;
        return el.hasAttribute('data-premium-text')
            || el.hasAttribute('data-premium-input')
            || type === 'text' || type === 'search' || type === 'email' || type === 'tel' || type === 'url';
    }

    function toTitleCaseWords(value) {
        return String(value || '').replace(/\S+/g, function (word) {
            if (!word.length) return word;
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        });
    }

    function cssEscapeId(id) {
        if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
            return CSS.escape(id);
        }
        return String(id).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    function findLabelForField(field, scope) {
        var root = scope || document;
        var id = field.getAttribute('id');
        if (id) {
            var byFor = root.querySelector('label[for="' + cssEscapeId(id) + '"]');
            if (byFor) return byFor;
        }
        var wrap = field.closest('.space-y-1, .space-y-2, [data-premium-field]');
        if (wrap) {
            var inner = wrap.querySelector('[data-premium-label], label');
            if (inner) return inner;
        }
        return null;
    }

    function isFieldRequired(field) {
        return field.hasAttribute('required')
            || field.getAttribute('aria-required') === 'true';
    }

    function applyRequiredMark(field, scope) {
        if (!isFieldRequired(field)) return;
        var label = findLabelForField(field, scope);
        if (!label) return;
        if (label.querySelector('[data-premium-required-mark]')) return;

        var text = (label.textContent || '').trim();
        if (/\s*\*+\s*$/.test(text)) {
            label.textContent = text.replace(/\s*\*+\s*$/, '').trim();
        }

        var mark = document.createElement('span');
        mark.setAttribute('data-premium-required-mark', '');
        mark.className = TOKENS.requiredMark;
        mark.textContent = '*';
        mark.setAttribute('aria-hidden', 'true');
        label.appendChild(mark);
    }

    function applyRequiredMarksInScope(scope) {
        var root = scope || document;
        var fields = root.querySelectorAll(
            'input[data-premium-input], select[data-premium-input], textarea[data-premium-input], ' +
            '[data-premium-input-scope] input[required], [data-premium-input-scope] select[required], ' +
            '[data-premium-input-scope] textarea[required]'
        );
        fields.forEach(function (field) {
            if (field.type === 'hidden') return;
            applyRequiredMark(field, root);
        });
    }

    function applyTextareaOptions(el) {
        var mode = getTextMode(el);
        if (mode !== 'textarea' || String(el.tagName || '').toLowerCase() !== 'textarea') return;
        var rows = parseInt(el.getAttribute('data-premium-text-rows'), 10);
        if (isFinite(rows) && rows > 0) el.setAttribute('rows', String(rows));
        if (!el.getAttribute('rows')) el.setAttribute('rows', '4');
    }

    function bindTitleCaseField(el) {
        if (getTextMode(el) !== 'title-case') return;
        if (el.getAttribute(TEXT_BOUND_FLAG) === '1') return;
        el.setAttribute(TEXT_BOUND_FLAG, '1');

        var onBlur = function () {
            var next = toTitleCaseWords(el.value);
            if (el.value !== next) el.value = next;
        };
        el.addEventListener('blur', onBlur);
    }

    function applyTextField(el, scope) {
        if (!isTextControl(el)) return el;
        applyTextareaOptions(el);
        applyRequiredMark(el, scope);
        bindTitleCaseField(el);
        return el;
    }

    function queryTextFields(root) {
        var scope = root || document;
        var list = [];
        scope.querySelectorAll('textarea[data-premium-input], textarea[data-premium-text]').forEach(function (el) {
            list.push(el);
        });
        scope.querySelectorAll('input[data-premium-text], input[data-premium-input]').forEach(function (el) {
            if (isTextControl(el)) list.push(el);
        });
        return list;
    }

    function applyTextFields(scope) {
        var root = scope || document;
        var seen = [];
        queryTextFields(root).forEach(function (el) {
            if (seen.indexOf(el) >= 0) return;
            seen.push(el);
            applyTextField(el, root);
        });
        applyRequiredMarksInScope(root);
        return seen;
    }

    function refreshTextFields(scope) {
        return applyTextFields(scope);
    }

    function normalizePhoneMode(mode) {
        var m = String(mode || 'plain').trim().toLowerCase();
        if (m === 'with-country' || m === 'country' || m === 'with-country-code' || m === 'intl') {
            return 'with-country';
        }
        if (m === 'plain' || m === 'without-country' || m === 'no-country' || m === 'local') {
            return 'plain';
        }
        return 'plain';
    }

    function getPhoneModeFromNode(node) {
        if (!node) return 'plain';
        if (node.hasAttribute('data-premium-phone')) {
            return normalizePhoneMode(node.getAttribute('data-premium-phone'));
        }
        return 'plain';
    }

    function parsePhoneLengthAttr(node, attrName) {
        var el = node;
        while (el) {
            if (el.hasAttribute && el.hasAttribute(attrName)) {
                var n = parseInt(el.getAttribute(attrName), 10);
                if (isFinite(n) && n >= 0) return n;
            }
            el = el.parentElement;
        }
        return null;
    }

    function resolvePhoneConstraints(hostEl) {
        return {
            mode: getPhoneModeFromNode(hostEl),
            minLength: parsePhoneLengthAttr(hostEl, 'data-premium-phone-min-length'),
            maxLength: parsePhoneLengthAttr(hostEl, 'data-premium-phone-max-length')
        };
    }

    function sanitizePhoneDigits(raw, maxLength) {
        var digits = String(raw == null ? '' : raw).replace(/\D/g, '');
        if (maxLength != null && digits.length > maxLength) {
            digits = digits.slice(0, maxLength);
        }
        return digits;
    }

    function applyPhoneValidity(numberInput, constraints) {
        var val = sanitizePhoneDigits(numberInput.value, constraints.maxLength);
        var len = val.length;
        var minLen = constraints.minLength;
        var maxLen = constraints.maxLength;

        if (!val && !numberInput.hasAttribute('required')) {
            numberInput.setCustomValidity('');
            return;
        }
        if (!val && numberInput.hasAttribute('required')) {
            numberInput.setCustomValidity('Phone number is required.');
            return;
        }
        if (minLen != null && len < minLen) {
            numberInput.setCustomValidity('Enter at least ' + minLen + ' digit' + (minLen === 1 ? '' : 's') + '.');
            return;
        }
        if (maxLen != null && len > maxLen) {
            numberInput.setCustomValidity('Enter at most ' + maxLen + ' digit' + (maxLen === 1 ? '' : 's') + '.');
            return;
        }
        numberInput.setCustomValidity('');
    }

    function bindPhoneNumberInput(numberInput, constraints) {
        if (!numberInput || numberInput.getAttribute(PHONE_BOUND_FLAG) === '1') return;
        numberInput.setAttribute(PHONE_BOUND_FLAG, '1');
        numberInput.setAttribute('type', 'tel');
        numberInput.setAttribute('inputmode', 'numeric');
        numberInput.setAttribute('autocomplete', 'tel-national');

        if (constraints.maxLength != null) {
            numberInput.setAttribute('maxlength', String(constraints.maxLength));
        }

        var onInput = function () {
            var c = resolvePhoneConstraints(numberInput);
            var next = sanitizePhoneDigits(numberInput.value, c.maxLength);
            if (numberInput.value !== next) numberInput.value = next;
            applyPhoneValidity(numberInput, c);
        };

        numberInput.addEventListener('input', onInput);
        numberInput.addEventListener('blur', onInput);
        onInput();
    }

    function populateDialSelect(selectEl, selectedCode) {
        var i;
        var code = selectedCode || selectEl.getAttribute('data-premium-phone-default-dial') || '+91';
        selectEl.innerHTML = '';
        for (i = 0; i < DEFAULT_PHONE_DIAL_CODES.length; i++) {
            var item = DEFAULT_PHONE_DIAL_CODES[i];
            var opt = document.createElement('option');
            opt.value = item.code;
            opt.textContent = item.label;
            if (item.code === code) opt.selected = true;
            selectEl.appendChild(opt);
        }
    }

    function buildDialSelect(hostEl) {
        var select = document.createElement('select');
        select.setAttribute('data-premium-phone-dial', '');
        select.setAttribute('data-premium-input', '');
        select.setAttribute('aria-label', 'Country code');
        addClasses(select, 'w-[7.25rem] shrink-0');
        var def = hostEl.getAttribute('data-premium-phone-default-dial') || '+91';
        populateDialSelect(select, def);
        applyInput(select, 'select');
        return select;
    }

    function copyPhoneAttrsToGroup(source, group) {
        ['data-premium-phone-min-length', 'data-premium-phone-max-length', 'data-premium-phone-default-dial'].forEach(function (attr) {
            if (source.hasAttribute(attr)) {
                group.setAttribute(attr, source.getAttribute(attr));
            }
        });
        if (source.hasAttribute('required')) {
            group.setAttribute('data-premium-phone-required', 'true');
        }
    }

    function ensureCountryPhoneGroup(input) {
        if (input.closest('[data-premium-phone-group]')) {
            return input.closest('[data-premium-phone-group]');
        }

        var parent = input.parentElement;
        if (!parent) return null;

        var group = document.createElement('div');
        group.setAttribute('data-premium-phone', 'with-country');
        group.setAttribute(PHONE_GROUP_FLAG, '');
        addClasses(group, 'flex gap-2 w-full items-stretch');
        copyPhoneAttrsToGroup(input, group);

        var dial = buildDialSelect(input);
        input.setAttribute('data-premium-phone-number', '');
        input.removeAttribute('data-premium-phone');
        addClasses(input, 'flex-1 min-w-0');

        parent.insertBefore(group, input);
        group.appendChild(dial);
        group.appendChild(input);

        return group;
    }

    function getPhoneNumberInput(host) {
        if (!host) return null;
        if (host.hasAttribute('data-premium-phone-number')) return host;
        return host.querySelector('[data-premium-phone-number]');
    }

    function applyPlainPhoneInput(input, scope) {
        var mode = getPhoneModeFromNode(input);
        if (mode !== 'plain') return;
        applyInput(input, 'text');
        input.setAttribute('type', 'tel');
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('autocomplete', 'tel');

        var constraints = resolvePhoneConstraints(input);
        bindPhoneNumberInput(input, constraints);
        applyRequiredMark(input, scope);
    }

    function applyCountryPhoneGroup(group, scope) {
        var constraints = resolvePhoneConstraints(group);
        addClasses(group, 'flex gap-2 w-full items-stretch');

        var dial = group.querySelector('[data-premium-phone-dial]');
        var numberInput = getPhoneNumberInput(group);

        if (!dial) {
            dial = buildDialSelect(group);
            if (numberInput) {
                group.insertBefore(dial, numberInput);
            } else {
                group.appendChild(dial);
            }
        } else {
            if (!dial.options.length) populateDialSelect(dial, dial.value);
            applyInput(dial, 'select');
            addClasses(dial, 'w-[7.25rem] shrink-0');
        }

        if (!numberInput) {
            numberInput = document.createElement('input');
            numberInput.setAttribute('data-premium-phone-number', '');
            numberInput.setAttribute('data-premium-input', '');
            numberInput.setAttribute('placeholder', 'Phone number');
            addClasses(numberInput, 'flex-1 min-w-0');
            group.appendChild(numberInput);
        } else {
            addClasses(numberInput, 'flex-1 min-w-0');
        }

        if (group.getAttribute('data-premium-phone-required') === 'true' && !numberInput.hasAttribute('required')) {
            numberInput.setAttribute('required', 'required');
        }

        bindPhoneNumberInput(numberInput, constraints);
        applyRequiredMark(numberInput, scope);
    }

    function applyPhoneField(el, scope) {
        if (!el) return el;
        var mode = getPhoneModeFromNode(el);

        if (mode === 'with-country' && el.hasAttribute('data-premium-phone-number')) {
            var grp = el.closest('[data-premium-phone-group]') || el.parentElement;
            applyCountryPhoneGroup(grp, scope);
            return el;
        }

        if (mode === 'with-country' && (el.tagName === 'INPUT' || el.tagName === 'input')) {
            var group = ensureCountryPhoneGroup(el);
            if (group) applyCountryPhoneGroup(group, scope);
            return el;
        }

        if (el.hasAttribute(PHONE_GROUP_FLAG) || (el.hasAttribute('data-premium-phone')
            && normalizePhoneMode(el.getAttribute('data-premium-phone')) === 'with-country')) {
            applyCountryPhoneGroup(el, scope);
            return el;
        }

        if (el.hasAttribute('data-premium-phone')) {
            applyPlainPhoneInput(el, scope);
        }

        return el;
    }

    function queryPhoneHosts(root) {
        var scope = root || document;
        var list = [];
        scope.querySelectorAll('[data-premium-phone-group], [data-premium-phone]').forEach(function (el) {
            list.push(el);
        });
        return list;
    }

    function applyPhoneFields(scope) {
        var root = scope || document;
        var seen = [];
        queryPhoneHosts(root).forEach(function (host) {
            if (seen.indexOf(host) >= 0) return;
            seen.push(host);
            applyPhoneField(host, root);
        });
        return seen;
    }

    function refreshPhoneFields(scope) {
        return applyPhoneFields(scope);
    }

    function getPhoneValue(el) {
        var host = el.closest('[data-premium-phone-group]') || el;
        var mode = getPhoneModeFromNode(host);
        var numberInput = getPhoneNumberInput(host) || (mode === 'plain' ? el : null);
        if (!numberInput) return '';
        var digits = sanitizePhoneDigits(numberInput.value, null);
        if (mode === 'with-country') {
            var dial = host.querySelector('[data-premium-phone-dial]');
            var code = dial ? dial.value : '';
            return String(code || '') + digits;
        }
        return digits;
    }

    function validatePhoneField(el) {
        var numberInput = getPhoneNumberInput(el.closest('[data-premium-phone-group]') || el) || el;
        if (!numberInput) return true;
        var c = resolvePhoneConstraints(numberInput);
        applyPhoneValidity(numberInput, c);
        return numberInput.checkValidity();
    }

    function bindRangeOutput(rangeInput) {
        if (!rangeInput) return;
        var outputSelector = rangeInput.getAttribute('data-premium-output');
        if (!outputSelector) return;
        var outputEl = document.querySelector(outputSelector);
        if (!outputEl) return;

        var suffix = rangeInput.getAttribute('data-premium-output-suffix') || '';
        var update = function () {
            outputEl.textContent = String(rangeInput.value || '') + suffix;
        };

        rangeInput.removeEventListener('input', update);
        rangeInput.addEventListener('input', update);
        update();
    }

    function applyRadioGroup(scope) {
        var root = scope || document;
        var groups = root.querySelectorAll('[data-premium-radio-group]');

        groups.forEach(function (group) {
            addClasses(group, TOKENS.radioGroup);
            var fieldLabel = group.querySelector('[data-premium-label]');
            var optionsWrap = group.querySelector('[data-premium-radio-options]');
            if (fieldLabel) applyLabel(fieldLabel);
            if (optionsWrap) addClasses(optionsWrap, TOKENS.radioOptions);

            group.querySelectorAll('[data-premium-radio-option]').forEach(function (optionEl) {
                addClasses(optionEl, TOKENS.radioOption);
                var input = optionEl.querySelector('input[type="radio"]');
                var text = optionEl.querySelector('[data-premium-option-text]');
                if (input) applyInput(input, 'radio');
                if (text) applyOptionText(text);
            });
        });

        return groups;
    }

    function isRadioOptionLabel(el) {
        return el && el.closest && !!el.closest('[data-premium-radio-option]');
    }

    function applyFieldLabels(scope) {
        var root = scope || document;
        root.querySelectorAll('[data-premium-label]').forEach(function (el) {
            if (!el.closest('[data-premium-radio-option]')) applyLabel(el);
        });
        root.querySelectorAll('label[for]').forEach(function (el) {
            if (el.hasAttribute('data-premium-label')) return;
            if (isRadioOptionLabel(el)) return;
            applyLabel(el);
        });
        applyRequiredMarksInScope(root);
    }

    function applyPrefixes(scope) {
        var root = scope || document;
        root.querySelectorAll('input[data-premium-prefix]').forEach(function (input) {
            if (input.__premiumPrefixApplied) return;
            input.__premiumPrefixApplied = true;

            var prefixText = input.getAttribute('data-premium-prefix');
            if (!prefixText) return;

            var parent = input.parentElement;
            if (!parent) return;

            var wrapper = document.createElement('div');
            wrapper.className = 'relative flex items-center w-full';

            parent.insertBefore(wrapper, input);
            wrapper.appendChild(input);

            var span = document.createElement('span');
            span.className = 'absolute left-4 text-sm font-bold text-gray-400 select-none pointer-events-none z-10';
            span.textContent = prefixText;
            
            var chars = prefixText.length;
            var padRem = Math.max(2.5, 1.25 + (chars * 0.5));
            input.style.paddingLeft = padRem + 'rem';
            
            wrapper.appendChild(span);
        });
    }

    function applyByDataAttr(scope) {
        var root = scope || document;
        var inputs = root.querySelectorAll('input[data-premium-input], select[data-premium-input], textarea[data-premium-input]');
        var toggles = root.querySelectorAll('[data-premium-toggle]');
        var fileFields = root.querySelectorAll('[data-premium-file-field]');

        inputs.forEach(function (el) {
            if (el.closest('[data-premium-radio-group]') && (el.getAttribute('type') || '').toLowerCase() === 'radio') {
                return;
            }
            applyInput(el);
            if ((el.getAttribute('type') || '').toLowerCase() === 'range') {
                bindRangeOutput(el);
            }
            if (isDateInput(el) && el.hasAttribute('data-premium-date')) {
                applyDateField(el, root);
            }
            if (isNumberField(el)) {
                applyNumberField(el);
            }
            if (isTextControl(el)) {
                applyTextField(el, root);
            }
        });
        applyFieldLabels(root);
        applyRadioGroup(root);
        toggles.forEach(function (el) { applyToggle(el); });
        fileFields.forEach(function (el) { applyFileField(el); });
        applyDateFields(root);
        applyNumberFields(root);
        applyTextFields(root);
        applyPhoneFields(root);
        applyPrefixes(root);

        return { inputs: inputs, toggles: toggles, fileFields: fileFields };
    }

    function applyModal(scope) {
        var root = scope || document;
        var inputs = root.querySelectorAll('input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]), select, textarea');

        inputs.forEach(function (el) {
            if (el.closest('[data-premium-radio-group]') && (el.getAttribute('type') || '').toLowerCase() === 'radio') {
                return;
            }
            applyInput(el);
            if (isDateInput(el) && el.hasAttribute('data-premium-date')) {
                applyDateField(el, root);
            }
            if (isNumberField(el)) {
                applyNumberField(el);
            }
            if (isTextControl(el)) {
                applyTextField(el, root);
            }
        });
        applyFieldLabels(root);
        applyRadioGroup(root);
        applyDateFields(root);
        applyNumberFields(root);
        applyTextFields(root);
        applyPhoneFields(root);
        applyPrefixes(root);
        if (global.PremiumSelect2 && global.PremiumSelect2.initInScope) {
            global.PremiumSelect2.initInScope(root);
        }

        return { inputs: inputs };
    }

    function autoInit() {
        function run() {
            var scopes = document.querySelectorAll('[data-premium-input-scope]');
            if (!scopes.length) return;
            scopes.forEach(function (scope) { applyModal(scope); });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', run);
        } else {
            run();
        }
    }

    global.PremiumInputStyles = {
        tokens: TOKENS,
        get: getClassForType,
        apply: applyInput,
        applyLabel: applyLabel,
        applyOptionText: applyOptionText,
        applyToggle: applyToggle,
        applyFileField: applyFileField,
        bindRangeOutput: bindRangeOutput,
        applyRadioGroup: applyRadioGroup,
        applyByDataAttr: applyByDataAttr,
        applyModal: applyModal,
        getTodayISO: getTodayISO,
        applyDateField: applyDateField,
        applyDateFields: applyDateFields,
        refreshDateFields: refreshDateFields,
        resolveDateConstraints: resolveDateConstraints,
        applyNumberField: applyNumberField,
        applyNumberFields: applyNumberFields,
        refreshNumberFields: refreshNumberFields,
        validateNumberField: validateNumberField,
        resolveNumberConstraints: resolveNumberConstraints,
        sanitizeNumberValue: sanitizeNumberValue,
        applyTextField: applyTextField,
        applyTextFields: applyTextFields,
        refreshTextFields: refreshTextFields,
        applyRequiredMark: applyRequiredMark,
        applyRequiredMarksInScope: applyRequiredMarksInScope,
        toTitleCaseWords: toTitleCaseWords,
        applyPhoneField: applyPhoneField,
        applyPhoneFields: applyPhoneFields,
        refreshPhoneFields: refreshPhoneFields,
        validatePhoneField: validatePhoneField,
        getPhoneValue: getPhoneValue,
        sanitizePhoneDigits: sanitizePhoneDigits
    };

    autoInit();
})(typeof window !== 'undefined' ? window : this);
