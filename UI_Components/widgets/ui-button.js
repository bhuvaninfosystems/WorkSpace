/**
 * Premium Button — Reusable toolbar/action button.
 *
 * Usage:
 *  <premium-button
 *    button-id="add-record-btn"
 *    icon="bi-plus-circle"
 *    label="Add Lead"
 *    class="ml-auto"
 *    text-color="text-gray-700"
 *    border-color="border-gray-300"
 *    bg-color="bg-white"
 *    hover-class="hover:bg-gray-50 hover:text-gray-800 hover:border-gray-400">
 *  </premium-button>
 */

(function (global) {
    'use strict';

    class PremiumButton extends HTMLElement {
        constructor() {
            super();
        }

        connectedCallback() {
            this.render();
        }

        static get observedAttributes() {
            return [
                'button-id',
                'label',
                'icon',
                'class',
                'label-class',
                'icon-class',
                'icon-color',
                'variant',
                'text-color',
                'border-color',
                'bg-color',
                'hover-class',
                'is-active'
            ];
        }

        get isActive() {
            return this.getAttribute('is-active') === 'true';
        }

        set isActive(val) {
            if (val) {
                this.setAttribute('is-active', 'true');
            } else {
                this.removeAttribute('is-active');
            }
        }

        attributeChangedCallback() {
            this.render();
        }

        render() {
            const buttonId = this.getAttribute('button-id') || '';
            const label = this.getAttribute('label') || 'Button';
            const icon = this.getAttribute('icon') || '';
            const extraClass = this.getAttribute('class') || '';
            const labelClass = this.hasAttribute('label-class') ? this.getAttribute('label-class').trim() : (icon ? 'hidden sm:inline' : '');
            const iconClass = this.hasAttribute('icon-class') ? this.getAttribute('icon-class').trim() : (icon ? 'text-base sm:text-sm' : 'text-sm');
            const iconColor = (this.getAttribute('icon-color') || '').trim();
            const variant = (this.getAttribute('variant') || 'outline').toLowerCase();

            const textColor = (this.getAttribute('text-color') || '').trim();
            const borderColor = (this.getAttribute('border-color') || '').trim();
            const bgColor = (this.getAttribute('bg-color') || '').trim();
            const hoverClass = (this.getAttribute('hover-class') || '').trim();

            const variantStyles = {
                outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 hover:text-gray-800 hover:border-gray-400',
                primary: 'border border-gray-800 text-white bg-gray-800 hover:bg-gray-700 hover:border-gray-700'
            };

            const baseStyle = 'flex items-center justify-center gap-1 border px-2 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95 ';

            var colorStyle;
            if (textColor || borderColor || bgColor || hoverClass) {
                colorStyle = [
                    borderColor || 'border-gray-300',
                    textColor || 'text-gray-700',
                    bgColor || 'bg-white',
                    hoverClass || 'hover:bg-gray-50 hover:text-gray-800 hover:border-gray-400'
                ].join(' ');
            } else {
                colorStyle = variantStyles[variant] || variantStyles.outline;
            }

            const combinedClasses = (baseStyle + colorStyle + ' ' + extraClass).trim();

            this.innerHTML = '';

            const btn = document.createElement('button');
            if (buttonId) btn.id = buttonId;
            btn.className = combinedClasses;
            btn.type = 'button';
            btn.title = this.getAttribute('title') || label;
            btn.setAttribute('aria-label', btn.title);

            if (icon) {
                const iconEl = document.createElement('i');
                iconEl.className = ('bi ' + icon + ' ' + (iconColor ? iconColor + ' ' : '') + iconClass).trim();
                btn.appendChild(iconEl);
            }

            if (label) {
                const spanEl = document.createElement('span');
                if (labelClass) spanEl.className = labelClass;
                spanEl.textContent = label;
                btn.appendChild(spanEl);
            }

            if (this.isActive) {
                btn.classList.add('relative');
                const dotWrap = document.createElement('span');
                dotWrap.className = 'absolute -top-1 -right-1 flex h-3 w-3';
                dotWrap.innerHTML = `
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-sm border border-white"></span>
                `;
                btn.appendChild(dotWrap);
            }

            this.appendChild(btn);

            Array.from(this.attributes).forEach(attr => {
                if (!PremiumButton.observedAttributes.includes(attr.name) && attr.name !== 'id') {
                    btn.setAttribute(attr.name, attr.value);
                }
            });
        }
    }

    if (!customElements.get('premium-button')) {
        customElements.define('premium-button', PremiumButton);
    }

})(typeof window !== 'undefined' ? window : this);
