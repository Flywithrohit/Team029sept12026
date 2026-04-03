import { store } from '../store.js';

export default {
    template: `
        <div class="d-flex flex-column flex-lg-row app-shell">
        <button v-if="mobileNavOpen" type="button" class="crm-sidebar-backdrop d-lg-none" @click="closeMobileNav"></button>
        <!-- Sidebar -->
        <div class="crm-sidebar d-flex flex-column flex-shrink-0" :class="{ 'is-mobile-open': mobileNavOpen }">
            <div class="crm-sidebar-top">
                <router-link to="/app/dashboard" class="crm-sidebar-brand" @click="closeMobileNav">
                    <i class="bi bi-buildings-fill"></i>
                    <span>EduITalent CRM</span>
                </router-link>
                <button type="button" class="crm-sidebar-toggle d-lg-none" @click="toggleMobileNav" :aria-expanded="mobileNavOpen ? 'true' : 'false'" aria-label="Toggle navigation">
                    <i class="bi" :class="mobileNavOpen ? 'bi-x-lg' : 'bi-list'"></i>
                </button>
            </div>
            <div class="crm-sidebar-menu" :class="{ 'is-open': mobileNavOpen }">
            <ul class="nav flex-column mb-auto crm-sidebar-nav">
                <li class="nav-item">
                    <router-link to="/app/dashboard" class="crm-sidebar-link" :class="{ active: $route.path === '/app/dashboard' }" @click="closeMobileNav">
                        <i class="bi bi-speedometer2 me-2"></i> Employee
                    </router-link>
                </li>
                <li v-if="store.hasRole(['Admin', 'Manager', 'Recruitment Executive'])">
                    <router-link to="/app/recruitment" class="crm-sidebar-link" :class="{ active: $route.path === '/app/recruitment' }" @click="closeMobileNav">
                        <i class="bi bi-person-badge me-2"></i> Recruitment
                    </router-link>
                </li>
                <li v-if="store.hasRole(['Admin', 'Manager', 'Business Development Team'])">
                    <router-link to="/app/sales" class="crm-sidebar-link" :class="{ active: $route.path === '/app/sales' }" @click="closeMobileNav">
                        <i class="bi bi-graph-up me-2"></i> Sales
                    </router-link>
                </li>
                <li v-if="store.hasRole(['Admin', 'Manager'])">
                    <router-link to="/app/admin" class="crm-sidebar-link" :class="{ active: $route.path === '/app/admin' }" @click="closeMobileNav">
                        <i class="bi bi-shield-lock me-2"></i> Operations Hub
                    </router-link>
                </li>
            </ul>
            <div class="dropdown crm-sidebar-profile">
                <a href="#" class="crm-sidebar-profile-toggle dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
                    <img :src="getProfilePictureUrl(store.user?.profile_picture, store.user?.full_name || store.user?.username)" alt="" width="32" height="32" class="rounded-circle me-2" style="object-fit: cover;">
                    <strong>{{ store.user?.full_name || store.user?.username }}</strong>
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
            mobileNavOpen: false
        }
    },
    watch: {
        $route() {
            this.mobileNavOpen = false;
        }
    },
    methods: {
        getProfilePictureUrl(path, name = 'User') {
            if (!path || !String(path).startsWith('data:')) {
                return window.MockAssets?.getAvatarDataUrl(name);
            }
            return path;
        },
        toggleMobileNav() {
            this.mobileNavOpen = !this.mobileNavOpen;
        },
        closeMobileNav() {
            this.mobileNavOpen = false;
        },
        logout() {
            store.logout();
            this.$router.push('/login');
        }
    }
};
