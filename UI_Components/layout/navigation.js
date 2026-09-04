/**
 * Navigation Component
 * Modularized Sidebar and Top Navigation
 *
 * Navigation is sourced from menu JSON in localStorage (`MinuList`).
 * When `localStorage['MinuList']` contains a non-empty GetMenuList response,
 * nav is built from that list (section -> category, module rows -> options).
 * Pages call `NavigationManager.init()` with no arguments unless they need a full override.
 *
 * Layout modes (second argument to `init`):
 * - `{ useMainNavRail: true }` (default): `#main-nav-wrapper` shows category icons; `#sub-nav-wrapper`
 *   shows options for the active category only.
 * - `{ useMainNavRail: false }`: no main rail; every category and its options render inside `#sub-nav-wrapper`.
 */

function escapeHtmlAttr(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;');
}

function getCurrentPageFilename() {
    var path = (typeof window !== 'undefined' && window.location && window.location.pathname)
        ? String(window.location.pathname).replace(/\\/g, '/')
        : '';
    var name = path.split('/').pop() || '';
    name = name.split('?')[0].split('#')[0] || '';
    if (!name && window.location && window.location.href) {
        var href = window.location.href.split('#')[0].split('?')[0];
        var parts = href.replace(/\\/g, '/').split('/');
        name = parts.pop() || '';
    }
    return name;
}

function getBaseName(pathOrFile) {
    if (pathOrFile == null) return '';
    var normalized = String(pathOrFile).replace(/\\/g, '/');
    var leaf = normalized.split('/').pop() || '';
    return leaf.split('?')[0].split('#')[0];
}

function isSameNavPage(currentFile, href) {
    var currentBase = getBaseName(currentFile).toLowerCase();
    var hrefBase = getBaseName(href).toLowerCase();
    return !!currentBase && !!hrefBase && currentBase === hrefBase;
}

function readCurrentLogUser() {
    try {
        var raw = localStorage.getItem('LogUser');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function pickDisplayNameFromLogUser(u) {
    if (!u || typeof u !== 'object') return '';
    var candidates = [
        u.userName, u.UserName, u.name, u.Name, u.fullName, u.FullName,
        u.employeeName, u.EmployeeName, u.displayName, u.DisplayName, u.loginName, u.LoginName
    ];
    var i;
    for (i = 0; i < candidates.length; i++) {
        var v = candidates[i];
        if (v != null && String(v).trim()) return String(v).trim();
    }
    return '';
}

function buildUserInitials(displayName, fallbackId) {
    var base = String(displayName || '').trim();
    if (!base) base = String(fallbackId || '').trim();
    if (!base) return 'U';
    var parts = base.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    var one = parts[0] || base;
    if (one.length >= 2) return one.slice(0, 2).toUpperCase();
    return one.charAt(0).toUpperCase();
}

function mapRoleLabelFromLogUser(u) {
    if (!u || typeof u !== 'object') return 'User';
    var role = u.userType != null ? u.userType : (u.role != null ? u.role : u.Role);
    var des = u.designation != null ? u.designation : u.Designation;
    var text = String(role || des || 'User').trim();
    if (!text) text = 'User';
    return text.charAt(0).toUpperCase() + text.slice(1);
}

var PREMIUM_MENU_LIST_STORAGE_KEY = 'MinuList';
var PREMIUM_MENU_DEFAULT_ICON = 'bi-circle';

/**
 * GetMenuList responses are sometimes a raw array and sometimes wrapped (data / Data / result).
 * @param {*} parsed — JSON.parse output or API object
 * @returns {Array}
 */
function normalizeMenuListPayload(parsed) {
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.data)) return parsed.data;
        if (Array.isArray(parsed.Data)) return parsed.Data;
        if (Array.isArray(parsed.result)) return parsed.result;
        if (Array.isArray(parsed.Result)) return parsed.Result;
    }
    return [];
}

function isAccountsModulePath() {
    var path = '';
    try {
        path = String((window.location && window.location.pathname) || '').replace(/\\/g, '/').toLowerCase();
    } catch (e) {
        path = '';
    }
    return path.indexOf('/modules/accounts') !== -1 || path.indexOf('/accounts/') !== -1;
}

function isTasksModulePath() {
    var path = '';
    try {
        path = String((window.location && window.location.pathname) || '').replace(/\\/g, '/').toLowerCase();
    } catch (e) {
        path = '';
    }
    return path.indexOf('/modules/tasks') !== -1 || path.indexOf('/tasks/') !== -1;
}

/**
 * Normalizes old API paths in MinuList.
 * @param {Array} rows
 * @returns {Array}
 */
function patchAccountsMenuListRows(rows) {
    if (!rows || !rows.length) return rows;
    return rows.map(function (row) {
        if (!row || typeof row !== 'object') return row;
        var raw = row.modulePage || row.ModulePage || row.href || row.Href || '';
        var next = String(raw || '').replace(/^\.\//, '').replace(/^\/+/, '').replace(/\\/g, '/');
        var lower = next.toLowerCase();
        if (lower.indexOf('modules/accounts/transactions/') === 0) {
            next = next.slice('modules/accounts/transactions/'.length);
        } else if (lower.indexOf('transactions/') === 0) {
            next = next.slice('transactions/'.length);
        } else {
            var marker = '/transactions/';
            var idx = lower.indexOf(marker);
            if (idx !== -1) next = next.slice(idx + marker.length);
        }
        next = next.replace(/^modules\/accounts\/accounts\//i, '');
        next = next.replace(/^accounts\/accounts\//i, '');
        next = next.replace(/^modules\/accounts\//i, '');
        next = next.replace(/^accounts\//i, '');
        if (String(next) === String(raw)) return row;
        var copy = {};
        var k;
        for (k in row) {
            if (Object.prototype.hasOwnProperty.call(row, k)) copy[k] = row[k];
        }
        if (row.modulePage != null || row.ModulePage != null) {
            copy.modulePage = next;
            copy.ModulePage = next;
        } else {
            copy.href = next;
            copy.Href = next;
        }
        return copy;
    });
}

function getPreferredMenuStorageKey() {
    return PREMIUM_MENU_LIST_STORAGE_KEY;
}

/**
 * Read menu JSON from localStorage (same shape as GetMenuList → AllProducts / Dashboard).
 * @param {string} [storageKey='MinuList']
 * @returns {Array}
 */
function readMenuListFromStorage(storageKey) {
    var key = storageKey || PREMIUM_MENU_LIST_STORAGE_KEY;
    try {
        var raw = localStorage.getItem(key);
        if (raw) {
            var data = JSON.parse(raw);
            var list = normalizeMenuListPayload(data);
            if (list.length) {
                if (isAccountsModulePath()) {
                    return patchAccountsMenuListRows(list);
                }
                return list;
            }
        }
    } catch (e) {
        console.warn('[Navigation] Failed to parse MinuList from localStorage', e);
    }
    return [];
}

/**
 * Normalize API row to { label, icon, href, section } for AppNavigation.
 * Supports camelCase and PascalCase (legacy Tasks navbars.js / C# JSON).
 * @param {object} item
 * @returns {{ label: string, icon: string, href: string, section?: string } | null}
 */
function menuListRowToNavOption(item) {
    if (!item || typeof item !== 'object') return null;
    var label = item.moduleName || item.ModuleName || item.label || item.Label || '';
    var hrefRaw = item.modulePage || item.ModulePage || item.href || item.Href || '#';
    var href = String(hrefRaw).replace(/^\.\//, '');
    if (isAccountsModulePath()) {
        href = href.replace(/^\/+/, '').replace(/\\/g, '/');
        var lower = href.toLowerCase();
        if (lower.indexOf('modules/accounts/transactions/') === 0) {
            href = href.slice('modules/accounts/transactions/'.length);
        } else if (lower.indexOf('transactions/') === 0) {
            href = href.slice('transactions/'.length);
        } else {
            var marker = '/transactions/';
            var idx = lower.indexOf(marker);
            if (idx !== -1) href = href.slice(idx + marker.length);
        }
        href = href.replace(/^modules\/accounts\/accounts\//i, '');
        href = href.replace(/^accounts\/accounts\//i, '');
        href = href.replace(/^modules\/accounts\//i, '');
        href = href.replace(/^accounts\//i, '');
    }
    if (!label) return null;
    var section = item.section || item.Section || '';
    if (section) section = String(section).trim();
    var iconRaw = item.moduleIcon || item.ModuleIcon || item.icon || item.Icon || '';
    var icon = String(iconRaw || '').trim();
    if (!icon) icon = PREMIUM_MENU_DEFAULT_ICON;
    if (icon.indexOf('bi ') === 0) icon = icon.replace(/^bi\s+/, '').trim();
    if (icon.indexOf('bi-') !== 0) icon = PREMIUM_MENU_DEFAULT_ICON;
    var out = { label: label, icon: icon, href: href };
    if (section) out.section = section;
    return out;
}

function getMenuListSortTuple(row) {
    if (!row || typeof row !== 'object') return [0, 0];
    var ssl = row.sslNo != null ? row.sslNo : row.SslNo;
    var msl = row.mslNo != null ? row.mslNo : row.MslNo;
    var a = Number(ssl);
    var b = Number(msl);
    return [(isFinite(a) ? a : 0), (isFinite(b) ? b : 0)];
}

function sortMenuListRows(rows) {
    var copy = rows.slice();
    copy.sort(function (a, b) {
        var ta = getMenuListSortTuple(a);
        var tb = getMenuListSortTuple(b);
        if (ta[0] !== tb[0]) return ta[0] - tb[0];
        return ta[1] - tb[1];
    });
    return copy;
}

function slugNavCategoryId(displayLabel, index) {
    var base = String(displayLabel || 'cat').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cat';
    return 'sec-' + index + '-' + base;
}

/** Pick a Bootstrap icon for the left-rail category from the section title. */
function iconForSectionLabel(label) {
    var n = String(label || '').toLowerCase();
    if (n.indexOf('dashboard') >= 0) return 'bi-speedometer2';
    if (n.indexOf('master') >= 0) return 'bi-journal-bookmark';
    if (n.indexOf('transaction') >= 0) return 'bi-arrow-left-right';
    if (n.indexOf('report') >= 0) return 'bi-graph-up-arrow';
    return 'bi-folder2';
}

/**
 * Build nav tree from MinuList: one category per `section`, options = rows in that section.
 * Section order follows first occurrence after sslNo/mslNo sort. Rows without `section`
 * are grouped under label "Tasks".
 * @param {string} [storageKey]
 * @returns {Array|null}
 */
function buildPremiumNavDataFromMenuList(storageKey) {
    var isAdmin = premiumNavIsAdminUser();
    if (!isAdmin) {
        return [
            {
                id: 'sec-0-tasks',
                label: 'Tasks',
                icon: 'bi-list-check',
                options: [
                    { label: 'My Dashboard', icon: 'bi-speedometer2', href: 'MyDashboard.html' },
                    { label: 'Task Status Update', icon: 'bi-kanban', href: 'Kanban.html' },
                    { label: 'Task Report', icon: 'bi-file-earmark-bar-graph', href: 'TaskReport.html' }
                ]
            }
        ];
    }

    if (isTasksModulePath()) {
        return [
            {
                id: 'sec-0-tasks',
                label: 'Tasks',
                icon: 'bi-list-check',
                options: [
                    { label: 'My Dashboard', icon: 'bi-speedometer2', href: 'MyDashboard.html' },
                    { label: 'Overview Dashboard', icon: 'bi-grid-1x2', href: 'Dashboard.html' },
                    { label: 'New Task', icon: 'bi-plus-circle', href: 'NewTask.html' },
                    { label: 'Task Status Update', icon: 'bi-kanban', href: 'Kanban.html' },
                    { label: 'Groups', icon: 'bi-people', href: 'Groups.html' },
                    { label: 'Task Report', icon: 'bi-file-earmark-bar-graph', href: 'TaskReport.html' },
                    { label: 'User Master', icon: 'bi-person-badge', href: 'UserMaster.html' },
                    { label: 'Other Master', icon: 'bi-gear', href: 'OtherMaster.html' }
                ]
            }
        ];
    }
    var list = sortMenuListRows(readMenuListFromStorage(storageKey));
    if (!list.length) return null;

    var sectionOrder = [];
    var buckets = Object.create(null);
    var i;
    for (i = 0; i < list.length; i++) {
        var opt = menuListRowToNavOption(list[i]);
        if (!opt) continue;
        var key = opt.section || '__default__';
        if (!buckets[key]) {
            buckets[key] = [];
            sectionOrder.push(key);
        }
        buckets[key].push(opt);
    }

    if (!sectionOrder.length) return null;

    return sectionOrder.map(function (key, idx) {
        var displayLabel = key === '__default__' ? 'Tasks' : key;
        return {
            id: slugNavCategoryId(displayLabel, idx),
            label: displayLabel,
            icon: iconForSectionLabel(displayLabel),
            options: buckets[key]
        };
    });
}

function premiumNavIsAdminUser() {
    try {
        var raw = localStorage.getItem('LogUser');
        if (!raw) return false;
        var u = JSON.parse(raw);
        var ut = String(u.userType != null ? u.userType : '').trim().toLowerCase();
        var des = String(u.designation != null ? u.designation : '').trim().toLowerCase();
        var role = String(u.role != null ? u.role : u.Role != null ? u.Role : '').trim().toLowerCase();
        if (ut === 'admin' || des === 'admin' || role === 'admin') return true;
        if (ut.indexOf('admin') !== -1 || des.indexOf('admin') !== -1 || role.indexOf('admin') !== -1) return true;
        return false;
    } catch (e) {
        return false;
    }
}

function getPremiumHomeHrefByRole() {
    // Count how many directory levels deep the current page is, then walk up to root
    var path = String((window.location && window.location.pathname) || '').replace(/\\/g, '/');
    // Remove the filename — only count the directory segments
    var dir = path.substring(0, path.lastIndexOf('/'));
    var depth = (dir.match(/\//g) || []).length;
    var prefix = depth > 0 ? '../'.repeat(depth) : '';
    return prefix + 'Modules/Tasks/Dashboard.html';
}

class AppNavigation {
    constructor(navData, options) {
        var data = Array.isArray(navData) ? navData : [];
        this.navData = data;
        this.activeCategoryId = '';
        this.activeOptionLabel = '';
        var opts = options && typeof options === 'object' ? options : {};
        /** When false, `#main-nav-wrapper` is omitted; all categories + options render in `#sub-nav-wrapper`. */
        this.useMainNavRail = opts.useMainNavRail !== false;

        // Element IDs from original index.html
        this.containerIds = {
            sidebar: 'sidebar-container',
            topNav: 'top-nav-container',
            bottomNav: 'bottom-nav-container',
            overlay: 'sidebar-overlay-container'
        };
    }

    init() {
        this.renderBaseContainers();
        this.applySidebarLogo();
        this.populateTopProfileSummary();
        this.syncActiveFromLocation();
        this.renderSidebar();
        this.renderBottomNav();
        this.bindEvents();
        this.bindProfileMenu();
        this.refreshSettingsMenuVisibility();
        this.updateTopNavTitle();
        this.checkNavOptionsExistence();
    }

    checkNavOptionsExistence() {
        var self = this;
        if (!Array.isArray(this.navData)) return;

        // Static manifest of all existing HTML files in the project to prevent HEAD 404 network logs in the console
        var existingFilesMap = {
            "/index.html": true,
            "/commonpages/allmodules.html": true,
            "/commonpages/login.html": true,
            "/modules/accountmaster.html": true,
            "/modules/componenttest.html": true,
            "/modules/debitnoteac.html": true,
            "/modules/generalledger.html": true,
            "/modules/accounts/accountbooks.html": true,
            "/modules/accounts/accountmaster.html": true,
            "/modules/accounts/admindashboard.html": true,
            "/modules/accounts/bankbook.html": true,
            "/modules/accounts/cashbook.html": true,
            "/modules/accounts/contraregister.html": true,
            "/modules/accounts/creditnoteregister.html": true,
            "/modules/accounts/customermaster.html": true,
            "/modules/accounts/dashboard.html": true,
            "/modules/accounts/debitnote.html": true,
            "/modules/accounts/debitnoteregister.html": true,
            "/modules/accounts/finalaccount.html": true,
            "/modules/accounts/generalledger.html": true,
            "/modules/accounts/grn.html": true,
            "/modules/accounts/journalregister.html": true,
            "/modules/accounts/managerdashboard.html": true,
            "/modules/accounts/openingstock.html": true,
            "/modules/accounts/othermaster.html": true,
            "/modules/accounts/outstanding.html": true,
            "/modules/accounts/paymentregister.html": true,
            "/modules/accounts/purchaseorder.html": true,
            "/modules/accounts/purchaseregister.html": true,
            "/modules/accounts/receiptregister.html": true,
            "/modules/accounts/salesregister.html": true,
            "/modules/accounts/secondarygroupheads.html": true,
            "/modules/accounts/stockreport.html": true,
            "/modules/accounts/suppliermaster.html": true,
            "/modules/accounts/taxmaster.html": true,
            "/modules/tasks/mydashboard.html": true,
            "/modules/tasks/dashboard.html": true,
            "/modules/tasks/newtask.html": true,
            "/modules/tasks/kanban.html": true,
            "/modules/tasks/groups.html": true,
            "/modules/tasks/taskreport.html": true,
            "/modules/tasks/taskstatusview.html": true,
            "/modules/tasks/usermaster.html": true,
            "/modules/tasks/othermaster.html": true,
            "/modules/tasks/videotraining.html": true
        };

        var hasChanges = false;

        this.navData.forEach(function (cat) {
            if (!cat || !cat.options) return;
            cat.options.forEach(function (opt) {
                if (!opt.href || opt.href === '#' || opt.href.startsWith('javascript:')) return;

                // Resolve opt.href to absolute path relative to current domain
                var parser = document.createElement('a');
                parser.href = opt.href;
                var pathname = parser.pathname;

                if (pathname.charAt(0) !== '/') {
                    pathname = '/' + pathname;
                }

                var key = pathname.toLowerCase();

                // Suffix-based check to support local/sub-folder hosting (e.g. IIS virtual directories)
                var exists = false;
                for (var manifestPath in existingFilesMap) {
                    if (key.endsWith(manifestPath)) {
                        exists = true;
                        break;
                    }
                }

                if (!exists) {
                    opt.isFrozen = true;
                    hasChanges = true;
                }
            });
        });

        if (hasChanges) {
            self.renderSidebar();
            self.renderBottomNav();
        }
    }

    /** Resolve Config/assets/images/ from navigation.js URL (supports UI_Components subfolders). */
    resolveConfigAssetsImagesBase(scriptSrc) {
        if (!scriptSrc) return null;
        var u = String(scriptSrc).split(/[#?]/)[0];
        var marker = '/ui_components';
        var idx = u.toLowerCase().indexOf(marker);
        if (idx !== -1) {
            return u.slice(0, idx) + '/Config/assets/images/';
        }
        var folder = u.slice(0, u.lastIndexOf('/'));
        return folder ? folder + '/Config/assets/images/' : null;
    }

    applySidebarLogo() {
        var logoImages = document.querySelectorAll('#sidebar img[alt="Logo"], #top-nav-container img[alt="Logo"]');
        var mergedBrandImg = document.querySelector('#sidebar [data-premium-merged-brand] img');

        var configAssetsBase = null;
        if (!window.__PREMIUM_NAV_LOGO__) {
            var scripts = document.getElementsByTagName('script');
            var i;
            var s;
            for (i = scripts.length - 1; i >= 0; i--) {
                s = scripts[i].src;
                if (!s) continue;
                if (/navigation\.js(\?|#|$)/.test(s)) {
                    configAssetsBase = this.resolveConfigAssetsImagesBase(s);
                    break;
                }
            }
        }

        if (window.__PREMIUM_NAV_LOGO__) {
            var resolvedOverride = String(window.__PREMIUM_NAV_LOGO__);
            logoImages.forEach(function (imgEl) { imgEl.src = resolvedOverride; });
        } else if (logoImages.length) {
            var resolvedLogo = configAssetsBase ? (configAssetsBase + 'Logo.png') : '../../Config/assets/images/Logo.png';
            logoImages.forEach(function (imgEl) { imgEl.src = resolvedLogo; });
        }

        if (mergedBrandImg) {
            if (window.__PREMIUM_NAV_FULL_LOGO__) {
                mergedBrandImg.src = String(window.__PREMIUM_NAV_FULL_LOGO__);
            } else {
                mergedBrandImg.src = configAssetsBase
                    ? (configAssetsBase + 'FullLogo.png')
                    : '../../Config/assets/images/FullLogo.png';
            }
        }
    }

    /** Align active category / sub-option with the current page URL (no re-render). */
    syncActiveFromLocation() {
        var currentFile = getCurrentPageFilename();
        var foundCat = null;
        var foundLabel = null;
        var i;
        var j;
        for (i = 0; i < this.navData.length; i++) {
            var cat = this.navData[i];
            if (!cat || !cat.options) continue;
            for (j = 0; j < cat.options.length; j++) {
                var o = cat.options[j];
                if (!o || !o.href) continue;
                var href = String(o.href).replace(/^\.\//, '');
                var same = isSameNavPage(currentFile, href);
                if (same) {
                    foundCat = cat.id;
                    foundLabel = o.label;
                    break;
                }
            }
            if (foundCat) break;
        }
        if (foundCat && foundLabel) {
            this.activeCategoryId = foundCat;
            this.activeOptionLabel = foundLabel;
            this.updateTopNavTitle();
            return;
        }
        // If current page does not belong to known nav options, clear active styling.
        this.activeCategoryId = '';
        this.activeOptionLabel = '';
        this.updateTopNavTitle();
    }

    /** Label for the open page only (not category switch or pre-navigation highlight). */
    _pageTitleFromLocation() {
        var currentFile = getCurrentPageFilename();
        var i;
        var j;
        for (i = 0; i < this.navData.length; i++) {
            var cat = this.navData[i];
            if (!cat || !cat.options) continue;
            for (j = 0; j < cat.options.length; j++) {
                var o = cat.options[j];
                if (!o || !o.href) continue;
                if (isSameNavPage(currentFile, String(o.href).replace(/^\.\//, ''))) {
                    return o.label;
                }
            }
        }
        return '';
    }

    renderBaseContainers() {
        var rail = this.useMainNavRail;
        var mainRailBlock = rail ? `
                <div id="main-nav-wrapper"
                    class="w-[60px] h-full border-r border-gray-300 flex-shrink-0 flex flex-col items-center pb-2 bg-white">
                    <div class="w-full h-16 flex-shrink-0 flex items-center justify-center border-b border-gray-300 mb-5">
                        <button type="button" data-premium-home-trigger title="Go to All Modules" aria-label="Go to All Modules"
                            class="w-[48px] h-[48px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
                            <img src="../../Config/assets/images/Logo.png" alt="Logo" class="w-11 h-11 object-contain">
                        </button>
                    </div>
                    <div id="category-nav-options" data-lenis-prevent
                        class="flex-1 flex flex-col gap-2 w-full items-center overflow-y-auto no-scrollbar px-2">
                    </div>
                    <div id="category-scroll-indicator"
                        class="h-3 w-full flex items-center justify-center duration-300 opacity-0 pointer-events-none">
                        <i class="bi bi-chevron-down text-sm text-gray-700 animate-pulse"></i>
                    </div>
                </div>` : '';

        var subNavWrapperClass = rail
            ? 'h-full min-w-0 w-[220px] max-w-[220px] flex-shrink-0 flex flex-col overflow-hidden sm:absolute sm:left-[60px] sm:top-0 sm:w-[240px] sm:max-w-[240px] sm:bg-white/95 sm:backdrop-blur-xl sm:border-r sm:border-gray-300 sm:z-[45] sm:shadow-[20px_0_40px_rgba(0,0,0,0.05)] lg:relative lg:left-0 lg:w-[220px] lg:max-w-[220px] lg:bg-transparent lg:shadow-none lg:flex sm:hidden'
            : 'flex-1 h-full w-[240px] max-w-[240px] min-w-0 flex flex-col overflow-hidden bg-white border-r border-gray-300 sm:relative sm:flex';

        var subNavHeaderBlock = rail
            ? `<div class="h-16 flex min-w-0 items-center justify-between px-4 border-b border-gray-300 flex-shrink-0 overflow-hidden">
                        <h2 class="min-w-0 flex-1 truncate text-lg font-semibold text-gray-800">Dashboard</h2>
                    </div>`
            : `<div class="h-16 flex items-center justify-start px-3 border-b border-gray-300 flex-shrink-0 bg-white/80 backdrop-blur-xl" data-premium-merged-brand>
                        <img src="../../Config/assets/images/FullLogo.png" alt="Workspace" class="h-12 w-auto max-w-full object-contain object-left">
                    </div>`;

        var subNavFooterGear = '';

        var asideWidthClass = rail
            ? 'w-[280px] sm:relative sm:w-[60px] lg:w-[280px]'
            : 'w-[240px] sm:relative sm:w-[240px] lg:w-[240px]';

        // Sidebar HTML
        const sidebarHTML = `
            <div id="sidebar-overlay" onclick="window.appNav.toggleSidebar()"
                class="fixed inset-0 z-40 bg-gray-900/20 backdrop-blur-sm hidden sm:hidden transition-opacity duration-300 opacity-0">
            </div>
            <aside id="sidebar" data-premium-nav-layout="${rail ? 'rail' : 'merged'}"
                class="fixed inset-y-0 left-0 z-50 ${asideWidthClass} h-full bg-white/80 backdrop-blur-xl flex flex-shrink-0 transition-all duration-300 -translate-x-full sm:translate-x-0">
                ${mainRailBlock}
                <div id="sub-nav-wrapper"
                    class="${subNavWrapperClass}">
                    ${subNavHeaderBlock}
                    <div id="sub-nav-options" data-lenis-prevent
                        class="flex min-w-0 flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto px-2 py-4 no-scrollbar">
                    </div>
                    <div id="scroll-indicator"
                        class="mt-auto h-10 flex items-center justify-center bg-gradient-to-b from-transparent to-white transition-opacity duration-300 opacity-0 pointer-events-none">
                        <div class="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                            <i class="bi bi-chevron-double-down"></i>
                            <span>Scroll for more</span>
                        </div>
                    </div>
                    ${subNavFooterGear}
                </div>
            </aside>
        `;

        const topNavHTML = `
            <header class="z-20 h-16 w-full bg-white/80 backdrop-blur-xl border-b border-gray-300 flex items-center justify-between px-4 sm:px-8 transition-all duration-500">
                <div class="flex items-center">
                    <button type="button" data-premium-home-trigger title="Go to dashboard" aria-label="Go to dashboard"
                        class="sm:hidden w-12 h-12 flex items-center justify-center bg-white overflow-hidden rounded-md">
                        <img src="../../Config/assets/images/Logo.png" alt="Logo" class="w-11 h-11 object-contain">
                    </button>
                    <button type="button" data-premium-home-trigger title="Go to dashboard" aria-label="Go to dashboard"
                        class="hidden sm:block text-left">
                        <h1 class="text-2xl font-semibold tracking-tight text-gray-800 ml-0 transition-opacity">Title</h1>
                    </button>
                </div>
                <div class="flex items-center gap-1">
                    <button class="w-9 h-9 flex items-center justify-center rounded-lg text-gray-900 bg-gray-100 hover:bg-gray-200 transition-all duration-300">
                        <i class="bi bi-search text-base"></i>
                    </button>
                    <button class="w-9 h-9 flex items-center justify-center rounded-lg text-gray-900 bg-gray-100 hover:bg-gray-200 transition-all duration-300">
                        <i class="bi bi-bell text-base"></i>
                    </button>
                    <div class="h-6 w-[1px] bg-gray-200 mx-1"></div>
                    <button type="button" data-premium-profile-trigger
                        class="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white text-[11px] font-bold shadow-sm cursor-pointer hover:scale-105 hover:ring-4 hover:ring-primary-500/20 transition-all duration-300"
                        title="Profile" aria-label="Open profile menu">
                        <span data-premium-profile-initials>U</span>
                    </button>
                </div>
            </header>
            <div id="premium-profile-dropdown" role="menu" aria-hidden="true"
                class="hidden fixed z-[110] min-w-[50px] rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">
                        <span data-premium-profile-initials-menu>U</span>
                    </div>
                    <div class="min-w-0">
                        <p data-premium-profile-name class="text-sm font-bold text-gray-800 truncate">User</p>
                        <p data-premium-profile-role class="text-xs font-semibold text-gray-500 truncate">Role</p>
                    </div>
                </div>
                <div class="my-3 border-t border-gray-100"></div>
                <div class="space-y-1">
                    <p class="text-xs text-gray-500"><span class="font-semibold text-gray-700">User ID:</span> <span data-premium-profile-userid>—</span></p>
                    <p class="text-xs text-gray-500"><span class="font-semibold text-gray-700">Designation:</span> <span data-premium-profile-designation>—</span></p>
                </div>
                <div class="my-3 border-t border-gray-100"></div>
                <div class="space-y-1">
                    <button type="button" role="menuitem" data-profile-nav="password-change" class="w-full whitespace-nowrap text-left px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                        <span class="inline-flex items-center gap-2">
                            <i class="bi bi-shield-lock"></i>
                            <span>Change Password</span>
                        </span>
                    </button>
                    <button type="button" role="menuitem" data-profile-nav="training" class="w-full whitespace-nowrap text-left px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                        <span class="inline-flex items-center gap-2">
                            <i class="bi bi-play-circle"></i>
                            <span>Training</span>
                        </span>
                    </button>
                    <button type="button" role="menuitem" data-profile-nav="logout" class="w-full whitespace-nowrap text-left px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
                        <span class="inline-flex items-center gap-2">
                            <i class="bi bi-box-arrow-right"></i>
                            <span>Logout</span>
                        </span>
                    </button>
                </div>
            </div>
        `;

        const bottomNavHTML = `
            <nav id="bottom-nav" class="fixed bottom-2 left-2 right-2 h-14 bg-gray-200 flex items-center justify-around px-3 z-30 rounded-xl border border-gray-300/80 shadow-[0_4px_20px_rgba(0,0,0,0.08)] sm:hidden transition-transform duration-300">
            </nav>
        `;

        if (document.getElementById(this.containerIds.sidebar)) {
            document.getElementById(this.containerIds.sidebar).innerHTML = sidebarHTML;
        }
        if (document.getElementById(this.containerIds.topNav)) {
            document.getElementById(this.containerIds.topNav).innerHTML = topNavHTML;
        }
        if (document.getElementById(this.containerIds.bottomNav)) {
            document.getElementById(this.containerIds.bottomNav).innerHTML = bottomNavHTML;
        }
    }

    renderSidebar() {
        const categoryContainer = document.getElementById('category-nav-options');
        const subNavContainer = document.getElementById('sub-nav-options');
        const subNavHeader = document.querySelector('#sub-nav-wrapper h2');
        if (!subNavContainer) return;

        if (!Array.isArray(this.navData) || !this.navData.length) {
            if (categoryContainer) categoryContainer.innerHTML = '';
            subNavContainer.innerHTML = '';
            if (subNavHeader) subNavHeader.textContent = 'Menu';
            return;
        }

        const activeCategory = this.navData.find(cat => cat.id === this.activeCategoryId) || this.navData[0];

        if (this.useMainNavRail) {
            if (categoryContainer) {
                categoryContainer.innerHTML = this.navData.map(cat => `
            <button type="button" data-nav-cat="${escapeHtmlAttr(cat.id)}" title="${escapeHtmlAttr(cat.label)}"
                class="py-0.5 w-full rounded-xl flex items-center justify-center transition-all ${cat.id === this.activeCategoryId ? 'text-primary-500' : 'text-gray-400 hover:text-gray-600'}">
                <i class="bi ${cat.icon} text-lg"></i>
            </button>
        `).join('');
            }

            if (subNavHeader) {
                subNavHeader.textContent = activeCategory.label;
                subNavHeader.title = activeCategory.label;
            }

            subNavContainer.innerHTML = activeCategory.options.map(opt => {
                var isFrozen = opt.isFrozen === true;
                var btnClass = opt.label === this.activeOptionLabel
                    ? 'bg-secondary-500 text-white font-medium'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-600';
                if (isFrozen) {
                    btnClass = 'text-gray-300 opacity-50 cursor-not-allowed';
                }
                return `
            <button type="button" ${isFrozen ? 'disabled style="cursor: not-allowed;"' : ''} data-nav-cat="${escapeHtmlAttr(activeCategory.id)}" data-nav-label="${escapeHtmlAttr(opt.label)}" title="${escapeHtmlAttr(opt.label)}${isFrozen ? ' (Not Available)' : ''}"
                class="flex w-full min-w-0 items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium text-left ${btnClass}">
                <i class="bi ${opt.icon} flex-shrink-0 text-base"></i>
                <span class="min-w-0 flex-1 truncate">${opt.label}</span>
            </button>
        `;
            }).join('');
        } else {
            var parts = [];
            var i;
            var j;
            for (i = 0; i < this.navData.length; i++) {
                var cat = this.navData[i];
                if (!cat || !cat.options) continue;
                for (j = 0; j < cat.options.length; j++) {
                    var opt = cat.options[j];
                    var isFrozen = opt.isFrozen === true;
                    var isActive = cat.id === this.activeCategoryId && opt.label === this.activeOptionLabel;
                    var btnClass = isActive ? 'bg-secondary-500 text-white font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-600';
                    if (isFrozen) {
                        btnClass = 'text-gray-300 opacity-50 cursor-not-allowed';
                    }
                    parts.push(
                        '<button type="button" ' + (isFrozen ? 'disabled style="cursor: not-allowed;"' : '') +
                        ' data-nav-cat="' + escapeHtmlAttr(cat.id) + '" data-nav-label="' + escapeHtmlAttr(opt.label) + '"' +
                        ' title="' + escapeHtmlAttr(opt.label) + (isFrozen ? ' (Not Available)' : '') + '"' +
                        ' class="flex w-full min-w-0 items-center gap-2 px-3 py-1 rounded-md transition-all text-sm font-medium text-left ' +
                        btnClass + '">' +
                        '<i class="bi ' + escapeHtmlAttr(opt.icon) + ' flex-shrink-0 text-lg"></i>' +
                        '<span class="min-w-0 flex-1 truncate">' + opt.label + '</span></button>'
                    );
                }
            }
            subNavContainer.innerHTML = parts.join('');
        }

        this.initScrollIndicator('sub-nav-options', 'scroll-indicator');
        if (categoryContainer) {
            this.initScrollIndicator('category-nav-options', 'category-scroll-indicator');
        }
    }

    renderBottomNav() {
        const container = document.getElementById('bottom-nav');
        if (!container) return;
        if (!Array.isArray(this.navData) || !this.navData.length) {
            container.innerHTML = '';
            return;
        }

        const maxItems = 5;
        let displayedItems = [];

        if (!this.useMainNavRail && this.navData.length > 1) {
            var flat = [];
            this.navData.forEach(function (cat) {
                (cat.options || []).forEach(function (opt) {
                    flat.push(Object.assign({}, opt, { isMore: false, isSub: true, _catId: cat.id }));
                });
            });
            if (flat.length <= maxItems) {
                displayedItems = flat;
            } else {
                displayedItems = flat.slice(0, maxItems).map(function (o) { return o; });
                displayedItems.push({ id: 'more', icon: 'bi-three-dots', label: 'More', isMore: true });
            }
        } else if (this.navData.length === 1) {
            const subOptions = this.navData[0].options;
            if (subOptions.length <= maxItems) {
                displayedItems = subOptions.map(opt => ({ ...opt, isMore: false, isSub: true }));
            } else {
                displayedItems = subOptions.slice(0, maxItems).map(opt => ({ ...opt, isMore: false, isSub: true }));
                displayedItems.push({ id: 'more', icon: 'bi-three-dots', label: 'More', isMore: true });
            }
        } else {
            if (this.navData.length <= maxItems) {
                displayedItems = this.navData.map(cat => ({ ...cat, isMore: false }));
            } else {
                displayedItems = this.navData.slice(0, maxItems).map(cat => ({ ...cat, isMore: false }));
                displayedItems.push({ id: 'more', icon: 'bi-three-dots', label: 'More', isMore: true });
            }
        }

        container.innerHTML = displayedItems.map(item => {
            let extraAttr = '';
            let isActive = false;
            let isFrozen = item.isFrozen === true;

            if (item.isMore) {
                extraAttr = 'data-nav-action="toggle-sidebar"';
            } else if (item.isSub) {
                extraAttr = `data-nav-label="${escapeHtmlAttr(item.label)}"`;
                if (item._catId) {
                    extraAttr += ` data-nav-cat="${escapeHtmlAttr(item._catId)}"`;
                }
                isActive = item._catId
                    ? (item.label === this.activeOptionLabel && item._catId === this.activeCategoryId)
                    : (item.label === this.activeOptionLabel);
            } else {
                extraAttr = `data-nav-cat="${escapeHtmlAttr(item.id)}"`;
                isActive = item.id === this.activeCategoryId;
            }

            var btnClass = isActive
                ? 'bg-white text-gray-800 ring-1 ring-gray-300/60'
                : 'text-gray-500 hover:bg-gray-300/60 hover:text-gray-700';
            if (isFrozen) {
                btnClass = 'text-gray-300 opacity-50 cursor-not-allowed';
            }

            return `
                <button type="button" ${isFrozen ? 'disabled style="cursor: not-allowed;"' : ''} ${extraAttr}
                    class="flex items-center justify-center min-w-[2.75rem] h-11 px-2 rounded-xl transition-all duration-200 ${btnClass} ${item.isMore ? 'hover:bg-gray-300/60' : ''}">
                    <i class="bi ${item.icon} text-xl"></i>
                </button>
            `;
        }).join('');
    }

    handleNavClick(id) {
        const isDesktopPopOut = window.innerWidth >= 640 && window.innerWidth < 1024;
        const isFullDesktop = window.innerWidth >= 1024;
        const subNav = document.getElementById('sub-nav-wrapper');

        if (isFullDesktop) {
            this.switchCategory(id);
        } else if (isDesktopPopOut) {
            if (this.activeCategoryId === id && !subNav.classList.contains('sm:hidden')) {
                this.toggleSubNav(false);
            } else {
                this.switchCategory(id);
                this.toggleSubNav(true);
            }
        } else {
            // Mobile: keep sidebar open when switching category; only open if it was closed.
            this.switchCategory(id);
            const sidebar = document.getElementById('sidebar');
            const isOpen = sidebar && sidebar.getAttribute('data-open') === 'true';
            if (sidebar && !isOpen) {
                this.toggleSidebar();
            }
        }
    }

    /** Highlight sub-option only when it matches the current page — never default to first item. */
    _activeOptionLabelForCategory(category) {
        if (!category || !Array.isArray(category.options)) return '';
        var currentFile = getCurrentPageFilename();
        var i;
        for (i = 0; i < category.options.length; i++) {
            var o = category.options[i];
            if (!o || !o.href) continue;
            if (isSameNavPage(currentFile, String(o.href).replace(/^\.\//, ''))) {
                return o.label;
            }
        }
        return '';
    }

    switchCategory(id) {
        this.activeCategoryId = id;
        const category = this.navData.find(cat => cat.id === id);
        if (!category || !Array.isArray(category.options) || !category.options.length) {
            this.activeOptionLabel = '';
            this.renderSidebar();
            this.renderBottomNav();
            return;
        }
        this.activeOptionLabel = this._activeOptionLabelForCategory(category);
        this.renderSidebar();
        this.renderBottomNav();
    }

    switchOption(label, categoryIdFromDom) {
        var category = null;
        var opt = null;
        if (categoryIdFromDom) {
            category = this.navData.find(function (c) { return c.id === categoryIdFromDom; });
            opt = category && category.options
                ? category.options.find(function (o) { return o.label === label; })
                : null;
        } else {
            category = this.navData.find(cat => cat.id === this.activeCategoryId) || this.navData[0];
            opt = category && category.options ? category.options.find(function (o) { return o.label === label; }) : null;
        }

        // Freeze option: block navigation
        if (opt && opt.isFrozen) {
            return;
        }

        if (category) this.activeCategoryId = category.id;

        var currentFile = getCurrentPageFilename();

        var applyHighlight = function () {
            this.activeOptionLabel = label;
            this.renderSidebar();
            this.renderBottomNav();
        }.bind(this);

        if (opt && opt.href) {
            applyHighlight();
            var href = String(opt.href).replace(/^\.\//, '');
            var samePage = isSameNavPage(currentFile, href);
            if (samePage) {
                return;
            }
            if (window.LoadingOverlay && typeof window.LoadingOverlay.startPageTransition === 'function') {
                window.LoadingOverlay.startPageTransition(href, { duration: 0.55, title: 'Loading' });
            } else if (typeof window.startLoader === 'function') {
                window.startLoader(0.5, function () { window.location.assign(href); });
            } else {
                window.location.assign(href);
            }
            return;
        }

        applyHighlight();
    }

    updateTopNavTitle() {
        const titleEl = document.querySelector('header h1');
        if (!titleEl) return;
        if (!Array.isArray(this.navData) || !this.navData.length) {
            titleEl.textContent = 'Menu';
            return;
        }
        var pageTitle = this._pageTitleFromLocation();
        titleEl.textContent = pageTitle || 'Dashboard';
    }

    toggleSubNav(show) {
        const subNav = document.getElementById('sub-nav-wrapper');
        if (!subNav || !window.gsap) return;

        if (show) {
            subNav.classList.remove('sm:hidden');
            gsap.fromTo(subNav,
                { x: -20, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
            );
        } else {
            gsap.to(subNav, {
                x: -20,
                opacity: 0,
                duration: 0.3,
                ease: 'power2.in',
                onComplete: () => subNav.classList.add('sm:hidden')
            });
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (!sidebar || !overlay || !window.gsap) return;

        const isHidden = !sidebar.getAttribute('data-open') || sidebar.getAttribute('data-open') === 'false';

        if (isHidden) {
            sidebar.setAttribute('data-open', 'true');
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
            gsap.to(overlay, { opacity: 1, duration: 0.4 });
            gsap.to(sidebar, { x: 0, duration: 0.6, ease: 'expo.out' });
        } else {
            sidebar.setAttribute('data-open', 'false');
            sidebar.classList.add('-translate-x-full');
            gsap.to(overlay, {
                opacity: 0,
                duration: 0.4,
                onComplete: () => overlay.classList.add('hidden')
            });
            gsap.to(sidebar, { x: '-100%', duration: 0.6, ease: 'expo.inOut' });
        }
    }

    closeSubNavOnDesktop() {
        if (window.innerWidth >= 640 && window.innerWidth < 1024) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.dataset.premiumNavLayout === 'merged') return;

            const subNav = document.getElementById('sub-nav-wrapper');
            if (subNav && !subNav.classList.contains('sm:hidden')) {
                this.toggleSubNav(false);
            }
        }
    }

    closeSettingsMenu() {
        var menu = document.getElementById('premium-settings-dropdown');
        if (!menu) return;
        menu.classList.add('hidden');
        menu.setAttribute('aria-hidden', 'true');
    }

    /**
     * Toggle visibility of items in #premium-settings-dropdown (e.g. admin-only entries).
     * No-op if the dropdown is not in the DOM (many layouts only use the profile menu).
     */
    refreshSettingsMenuVisibility() {
        var menu = document.getElementById('premium-settings-dropdown');
        if (!menu) return;
        var admin = premiumNavIsAdminUser();
        menu.querySelectorAll('[data-settings-admin-only]').forEach(function (el) {
            if (admin) el.classList.remove('hidden');
            else el.classList.add('hidden');
        });
    }

    populateTopProfileSummary() {
        var u = readCurrentLogUser() || {};
        var displayName = pickDisplayNameFromLogUser(u) || 'User';
        var userId = u.userId != null ? String(u.userId).trim() : '';
        var designation = u.designation != null ? String(u.designation).trim() : '';
        var roleLabel = mapRoleLabelFromLogUser(u);
        var initials = buildUserInitials(displayName, userId || roleLabel);

        document.querySelectorAll('[data-premium-profile-initials], [data-premium-profile-initials-menu]').forEach(function (el) {
            el.textContent = initials;
        });
        var nameEl = document.querySelector('[data-premium-profile-name]');
        if (nameEl) nameEl.textContent = displayName;
        var roleEl = document.querySelector('[data-premium-profile-role]');
        if (roleEl) roleEl.textContent = roleLabel || 'User';
        var idEl = document.querySelector('[data-premium-profile-userid]');
        if (idEl) idEl.textContent = userId || (u.mTransNo != null ? String(u.mTransNo) : '—');
        var desEl = document.querySelector('[data-premium-profile-designation]');
        if (desEl) desEl.textContent = designation || roleLabel || '—';
    }

    closeProfileMenu() {
        var menu = document.getElementById('premium-profile-dropdown');
        if (!menu) return;
        menu.classList.add('hidden');
        menu.setAttribute('aria-hidden', 'true');
    }

    positionProfileDropdown(triggerEl) {
        var menu = document.getElementById('premium-profile-dropdown');
        if (!menu || !triggerEl) return;
        var mw = menu.offsetWidth || 220;
        var mh = menu.offsetHeight || 180;
        var r = triggerEl.getBoundingClientRect();
        var left = r.right - mw;
        var top = r.bottom + 8;
        if (left + mw > window.innerWidth - 12) left = window.innerWidth - mw - 12;
        if (left < 8) left = 8;
        if (top + mh > window.innerHeight - 8) {
            top = Math.max(8, r.top - mh - 8);
        }
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
    }

    bindProfileMenu() {
        var self = this;
        if (document.documentElement.dataset.premiumNavProfileBound === '1') return;
        document.documentElement.dataset.premiumNavProfileBound = '1';

        document.addEventListener('click', function (e) {
            var menu = document.getElementById('premium-profile-dropdown');
            if (!menu) return;

            var trigger = e.target.closest('[data-premium-profile-trigger]');
            if (trigger) {
                e.preventDefault();
                e.stopPropagation();
                if (!menu.classList.contains('hidden')) {
                    self.closeProfileMenu();
                    return;
                }
                menu.classList.remove('hidden');
                menu.setAttribute('aria-hidden', 'false');
                self.positionProfileDropdown(trigger);
                return;
            }

            var profileItem = e.target.closest('[data-profile-nav]');
            if (profileItem && menu.contains(profileItem)) {
                e.preventDefault();
                e.stopPropagation();
                self.closeProfileMenu();
                self.handleSettingsAction(profileItem.getAttribute('data-profile-nav'));
                return;
            }

            if (!menu.classList.contains('hidden') && !menu.contains(e.target)) {
                self.closeProfileMenu();
            }
        });

        window.addEventListener('resize', function () {
            var menu = document.getElementById('premium-profile-dropdown');
            if (!menu || menu.classList.contains('hidden')) return;
            var trigger = document.querySelector('[data-premium-profile-trigger]');
            if (trigger) self.positionProfileDropdown(trigger);
        });
    }

    positionSettingsDropdown(triggerEl) {
        var menu = document.getElementById('premium-settings-dropdown');
        if (!menu || !triggerEl) return;
        var mw = menu.offsetWidth || 176;
        var mh = menu.offsetHeight || 180;
        var r = triggerEl.getBoundingClientRect();
        var left;
        var top;
        if (this.useMainNavRail) {
            left = r.right + 8;
            top = r.top + r.height / 2 - mh / 2;
        } else {
            left = r.left;
            top = r.bottom + 6;
            if (top + mh > window.innerHeight - 12) {
                top = r.top - mh - 6;
            }
        }
        if (left + mw > window.innerWidth - 12) {
            left = window.innerWidth - mw - 12;
        }
        if (left < 8) left = 8;
        if (top < 8) top = 8;
        if (top + mh > window.innerHeight - 8) {
            top = Math.max(8, window.innerHeight - mh - 8);
        }
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
    }

    getSettingsHref(action) {
        var map = typeof window.__PREMIUM_SETTINGS_HREFS__ === 'object' && window.__PREMIUM_SETTINGS_HREFS__
            ? window.__PREMIUM_SETTINGS_HREFS__
            : null;
        if (map && map[action]) return String(map[action]);
        if (action === 'logout') {
            return typeof window.__PREMIUM_LOGOUT_HREF__ === 'string' && window.__PREMIUM_LOGOUT_HREF__
                ? window.__PREMIUM_LOGOUT_HREF__
                : '/index.html';
        }
        if (action === 'password-change') {
            var path = String((window.location && window.location.pathname) || '').replace(/\\/g, '/');
            var dir = path.substring(0, path.lastIndexOf('/'));
            var depth = (dir.match(/\//g) || []).length;
            var prefix = depth > 0 ? '../'.repeat(depth) : '';
            return prefix + 'Modules/Tasks/PasswordChange.html';
        }
        if (action === 'training') {
            var path = String((window.location && window.location.pathname) || '').replace(/\\/g, '/');
            var dir = path.substring(0, path.lastIndexOf('/'));
            var depth = (dir.match(/\//g) || []).length;
            var prefix = depth > 0 ? '../'.repeat(depth) : '';
            return prefix + 'Modules/Tasks/VideoTraining.html';
        }
        return '#';
    }

    handleSettingsAction(action) {
        if (action === 'logout') {
            try {
                localStorage.removeItem('LogUser');
            } catch (e) { /* no-op */ }
            window.location.href = this.getSettingsHref('logout');
            return;
        }
        var href = this.getSettingsHref(action);
        if (href && href !== '#') {
            window.location.assign(href);
        }
    }

    bindSettingsMenu() {
        var self = this;
        if (document.documentElement.dataset.premiumNavSettingsBound === '1') return;
        document.documentElement.dataset.premiumNavSettingsBound = '1';

        document.addEventListener('click', function (e) {
            var menu = document.getElementById('premium-settings-dropdown');
            if (!menu) return;

            var trigger = e.target.closest('[data-premium-settings-trigger]');
            if (trigger) {
                e.preventDefault();
                e.stopPropagation();
                if (!menu.classList.contains('hidden')) {
                    self.closeSettingsMenu();
                    return;
                }
                self.refreshSettingsMenuVisibility();
                menu.classList.remove('hidden');
                menu.setAttribute('aria-hidden', 'false');
                self.positionSettingsDropdown(trigger);
                return;
            }

            if (menu.classList.contains('hidden')) return;

            var item = e.target.closest('[data-settings-nav]');
            if (item && menu.contains(item)) {
                e.preventDefault();
                self.handleSettingsAction(item.getAttribute('data-settings-nav'));
                self.closeSettingsMenu();
                return;
            }

            if (!menu.contains(e.target)) {
                self.closeSettingsMenu();
            }
        });
    }

    initScrollIndicator(containerId, indicatorId) {
        const container = document.getElementById(containerId);
        const indicator = document.getElementById(indicatorId);

        if (!container || !indicator) return;

        const updateIndicator = () => {
            const isOverflowing = container.scrollHeight > container.clientHeight;
            const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 2;

            if (isOverflowing && !isAtBottom) {
                indicator.classList.remove('opacity-0', 'pointer-events-none');
            } else {
                indicator.classList.add('opacity-0', 'pointer-events-none');
            }
        };

        container.addEventListener('scroll', updateIndicator);
        window.addEventListener('resize', updateIndicator);
        setTimeout(updateIndicator, 100);
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.renderBottomNav();
        });
        if (document.documentElement.dataset.premiumNavHomeBound !== '1') {
            document.documentElement.dataset.premiumNavHomeBound = '1';
            document.addEventListener('click', (e) => {
                var homeTrigger = e.target.closest('[data-premium-home-trigger]');
                if (!homeTrigger) return;
                e.preventDefault();
                var href = getPremiumHomeHrefByRole();
                if (window.LoadingOverlay && typeof window.LoadingOverlay.startPageTransition === 'function') {
                    window.LoadingOverlay.startPageTransition(href, { duration: 0.55, title: 'Loading' });
                } else {
                    window.location.assign(href);
                }
            });
        }

        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.dataset.premiumNavDelegate) {
            sidebar.addEventListener('click', (e) => {
                const catBtn = e.target.closest('#category-nav-options button[data-nav-cat]');
                if (catBtn && window.appNav) {
                    e.preventDefault();
                    window.appNav.handleNavClick(catBtn.getAttribute('data-nav-cat'));
                    return;
                }
                const subBtn = e.target.closest('#sub-nav-options button[data-nav-label]');
                if (subBtn && window.appNav) {
                    e.preventDefault();
                    window.appNav.switchOption(
                        subBtn.getAttribute('data-nav-label'),
                        subBtn.getAttribute('data-nav-cat') || undefined
                    );
                }
            });
            sidebar.dataset.premiumNavDelegate = '1';
        }

        const bottomNav = document.getElementById('bottom-nav');
        if (bottomNav && !bottomNav.dataset.premiumNavDelegate) {
            bottomNav.addEventListener('click', (e) => {
                const moreBtn = e.target.closest('button[data-nav-action="toggle-sidebar"]');
                if (moreBtn && window.appNav) {
                    e.preventDefault();
                    window.appNav.toggleSidebar();
                    return;
                }
                const subBtn = e.target.closest('button[data-nav-label]');
                if (subBtn && window.appNav) {
                    e.preventDefault();
                    window.appNav.switchOption(
                        subBtn.getAttribute('data-nav-label'),
                        subBtn.getAttribute('data-nav-cat') || undefined
                    );
                    return;
                }
                const catBtn = e.target.closest('button[data-nav-cat]');
                if (catBtn && window.appNav) {
                    e.preventDefault();
                    window.appNav.handleNavClick(catBtn.getAttribute('data-nav-cat'));
                }
            });
            bottomNav.dataset.premiumNavDelegate = '1';
        }

        // Add click listener for main canvas to close sub-nav
        const mainCanvas = document.getElementById('main-canvas');
        if (mainCanvas) {
            mainCanvas.addEventListener('click', () => this.closeSubNavOnDesktop());
        }
    }
}

// Global factory function to initialize
window.NavigationManager = {
    /**
     * @param {Array} [navDataOverride] — optional full nav tree; if omitted, uses
     *   menu list from localStorage (preferred key by page context).
     */
    /**
     * @param {Array} [navDataOverride]
     * @param {{ useMainNavRail?: boolean }} [options] — pass `{ useMainNavRail: false }` to merge all
     *   categories into `#sub-nav-wrapper` only (no `#main-nav-wrapper`).
     */
    init: (navDataOverride, options) => {
        var useOverride = Array.isArray(navDataOverride) && navDataOverride.length > 0;
        var preferredKey = getPreferredMenuStorageKey();
        var fromMinuList = !useOverride ? buildPremiumNavDataFromMenuList(preferredKey) : null;
        var mergedOpts = Object.assign({}, typeof window.__PREMIUM_NAV_OPTIONS__ === 'object' && window.__PREMIUM_NAV_OPTIONS__ ? window.__PREMIUM_NAV_OPTIONS__ : {}, options || {});
        window.appNav = new AppNavigation(useOverride ? navDataOverride : fromMinuList, mergedOpts);
        window.appNav.init();
        return window.appNav;
    },
    /**
     * Re-read `MinuList` (or `storageKey`) and refresh sidebar / bottom nav / title.
     * Call after async GetMenuList completes so nav matches server menu.
     * @param {string} [storageKey]
     * @returns {boolean} true if nav was updated from a non-empty menu list
     */
    reloadFromMinuList: function (storageKey) {
        if (!window.appNav) return false;
        var next = buildPremiumNavDataFromMenuList(storageKey || PREMIUM_MENU_LIST_STORAGE_KEY);
        if (!next) return false;
        window.appNav.navData = next;
        window.appNav.syncActiveFromLocation();
        window.appNav.renderSidebar();
        window.appNav.renderBottomNav();
        window.appNav.updateTopNavTitle();
        return true;
    }
};
