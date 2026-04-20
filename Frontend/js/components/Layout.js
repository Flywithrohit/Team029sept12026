import { store } from '../store.js';

export default {
    template: `
        <div class="d-flex flex-column flex-lg-row app-shell">
        <button v-if="mobileNavOpen" type="button" class="crm-sidebar-backdrop d-lg-none" @click="closeMobileNav"></button>

        <!-- Sidebar -->
        <div class="crm-sidebar d-flex flex-column flex-shrink-0"
             :class="{ 'is-mobile-open': mobileNavOpen, 'is-collapsed': sidebarCollapsed }">
            <div class="crm-sidebar-top">
                <router-link to="/app/dashboard" class="crm-sidebar-brand" @click="closeMobileNav">
                    <span class="crm-sidebar-brand-mark">
                        <i class="bi bi-buildings-fill"></i>
                    </span>
                    <span class="crm-sidebar-brand-copy">
                        <strong>EduITalent CRM</strong>
                        <small>Operations workspace</small>
                    </span>
                </router-link>
                <button type="button"
                        class="crm-sidebar-toggle d-none d-lg-inline-flex"
                        @click="toggleSidebar"
                        :aria-label="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
                        :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'">
                    <i class="bi" :class="sidebarCollapsed ? 'bi-layout-sidebar-inset-reverse' : 'bi-layout-sidebar-inset'"></i>
                </button>
                <button type="button" class="crm-sidebar-toggle d-lg-none" @click="toggleMobileNav" :aria-expanded="mobileNavOpen ? 'true' : 'false'" aria-label="Toggle navigation">
                    <i class="bi" :class="mobileNavOpen ? 'bi-x-lg' : 'bi-list'"></i>
                </button>
            </div>
            <div class="crm-sidebar-menu" :class="{ 'is-open': mobileNavOpen }">
            <ul class="nav flex-column mb-auto crm-sidebar-nav">
                <li v-for="item in navItems" :key="item.to" class="nav-item">
                    <router-link :to="item.to"
                                 class="crm-sidebar-link"
                                 :class="{ active: isRouteActive(item.to) }"
                                 :aria-label="item.label"
                                 :data-tooltip="sidebarCollapsed ? item.label : null"
                                 @click="closeMobileNav">
                        <span class="crm-sidebar-link-icon">
                            <i class="bi" :class="item.icon"></i>
                        </span>
                        <span class="crm-sidebar-link-label">{{ item.label }}</span>
                    </router-link>
                </li>
            </ul>
            <div class="dropdown crm-sidebar-profile">
                <a href="#"
                   class="crm-sidebar-profile-toggle dropdown-toggle"
                   :data-tooltip="sidebarCollapsed ? (store.user?.full_name || store.user?.username || 'Profile') : null"
                   id="dropdownUser1"
                   data-bs-toggle="dropdown"
                   aria-expanded="false">
                    <img :src="getProfilePictureUrl(store.user?.profile_picture, store.user?.full_name || store.user?.username)" alt="" width="40" height="40" class="rounded-circle crm-sidebar-avatar" style="object-fit: cover;">
                    <span class="crm-sidebar-profile-copy">
                        <strong>{{ store.user?.full_name || store.user?.username }}</strong>
                        <small>Account</small>
                    </span>
                </a>
                <ul class="dropdown-menu dropdown-menu-dark text-small shadow" aria-labelledby="dropdownUser1">
                    <li><router-link class="dropdown-item" to="/app/profile">Profile</router-link></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" @click.prevent="logout">Sign out</a></li>
                </ul>
            </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="crm-main">
            <router-view></router-view>
        </div>
    </div>
    `,
    data() {
        return {
            store,
            mobileNavOpen: false,
            sidebarCollapsed: localStorage.getItem('crm-sidebar-collapsed') === 'true'
        }
    },
    computed: {
        navItems() {
            const items = [
                { to: '/app/dashboard', label: 'Employee', icon: 'bi-speedometer2', show: true },
                { to: '/app/recruitment', label: 'Recruitment', icon: 'bi-person-badge', show: this.store.hasRole(['Admin', 'Manager', 'Recruitment Executive']) },
                { to: '/app/sales', label: 'Sales', icon: 'bi-graph-up', show: this.store.hasRole(['Admin', 'Manager', 'Business Development Team']) },
                { to: '/app/admin', label: 'Operations Hub', icon: 'bi-shield-lock', show: this.store.hasRole(['Admin', 'Manager']) }
            ];
            return items.filter((item) => item.show);
        }
    },
    watch: {
        $route() {
            this.mobileNavOpen = false;
        }
    },
    methods: {
        isRouteActive(path) {
            return this.$route.path === path;
        },
        getProfilePictureUrl(path, name = 'User') {
            if (!path) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e9ecef&color=6c757d`;
            return `${path}?t=${new Date().getTime()}`;
        },
        toggleMobileNav() {
            this.mobileNavOpen = !this.mobileNavOpen;
        },
        closeMobileNav() {
            this.mobileNavOpen = false;
        },
        toggleSidebar() {
            this.sidebarCollapsed = !this.sidebarCollapsed;
            localStorage.setItem('crm-sidebar-collapsed', String(this.sidebarCollapsed));
        },
        logout() {
            store.logout();
            this.$router.push('/login');
        }
    }
};
