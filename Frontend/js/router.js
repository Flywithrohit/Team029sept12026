import { store } from './store.js';
import LandingPage from './components/LandingPage.js';
import Login from './components/Login.js';
import Register from './components/Register.js';
import VerificationPending from './components/VerificationPending.js';
import Layout from './components/Layout.js';
import EmployeeDashboard from './components/EmployeeDashboard.js?v=20260318-calendar-refresh-3';
import RecruitmentDashboard from './components/RecruitmentDashboard.js?v=20260318-calendar-refresh-3';
import SalesDashboard from './components/SalesDashboard.js?v=20260318-calendar-refresh-3';
import AdminDashboard from './components/AdminDashboard.js';
import Profile from './components/Profile.js';

const routes = [
    { path: '/', component: LandingPage },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/verification-pending', component: VerificationPending, meta: { requiresAuth: true } },
    {
        path: '/app',
        component: Layout,
        meta: { requiresAuth: true, requiresVerified: true },
        children: [
            { path: '', redirect: '/app/dashboard' },
            { path: 'dashboard', component: EmployeeDashboard },
            { path: 'recruitment', component: RecruitmentDashboard },
            { path: 'sales', component: SalesDashboard },
            { path: 'admin', component: AdminDashboard },
            { path: 'profile', component: Profile },
            { path: 'profile/:id', component: Profile },
            
        ]
    }
];

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth && !store.isAuthenticated()) {
        next('/login');
    } else if (to.meta.requiresVerified && !store.isVerified()) {
        next('/verification-pending');
    } else if (to.path === '/verification-pending' && store.isAuthenticated() && store.isVerified()) {
        next('/app');
    } else {
        next();
    }
});

export default router;
