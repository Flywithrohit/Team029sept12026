import { store } from '../store.js';
import EmployeeDashboard from './EmployeeDashboard.js';
import SalesDashboard from './SalesDashboard.js';
import RecruitmentDashboard from './RecruitmentDashboard.js';
import AdminDashboard from './AdminDashboard.js';

export default {
    name: 'DashboardDispatcher',
    components: {
        EmployeeDashboard,
        SalesDashboard,
        RecruitmentDashboard,
        AdminDashboard
    },
    template: `
        <div>
            <admin-dashboard v-if="role === 'Admin'"></admin-dashboard>
            <recruitment-dashboard v-else-if="role === 'Recruitment Executive'"></recruitment-dashboard>
            <sales-dashboard v-else-if="role === 'Business Development Team'"></sales-dashboard>
            <employee-dashboard v-else></employee-dashboard>
        </div>
    `,
    computed: {
        role() {
            return store.user?.role;
        }
    }
};
