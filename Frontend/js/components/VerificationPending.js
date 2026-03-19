import { store } from '../store.js';

export default {
    template: `
    <div class="auth-shell">
        <div class="container py-5">
            <div class="row justify-content-center align-items-center" style="min-height: 100vh;">
                <div class="col-lg-6">
                    <div class="auth-card card border-0 shadow-lg p-4 p-md-5 text-center">
                        <div class="mb-3">
                            <span class="verification-badge">
                                <i class="bi bi-shield-lock me-2"></i>
                                Verification {{ statusLabel }}
                            </span>
                        </div>
                        <h2 class="mb-3">Your CRM access is under review</h2>
                        <p class="text-muted mb-4">
                            Your account has been created successfully, but an admin must verify it before you can access the dashboard.
                        </p>
                        <div class="verification-panel mb-4">
                            <p class="mb-2"><strong>Name:</strong> {{ store.user?.full_name || store.user?.username }}</p>
                            <p class="mb-2"><strong>Email:</strong> {{ store.user?.email }}</p>
                            <p class="mb-0"><strong>Status:</strong> {{ store.user?.verification_status || 'Pending' }}</p>
                        </div>
                        <div v-if="message" class="alert alert-info py-2">{{ message }}</div>
                        <div class="d-flex flex-wrap justify-content-center gap-3">
                            <button class="btn hero-btn-primary" @click="refreshStatus" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                                Check Verification Status
                            </button>
                            <button class="btn btn-outline-secondary" @click="logout">Logout</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            loading: false,
            message: ''
        };
    },
    computed: {
        statusLabel() {
            return store.user?.verification_status || 'Pending';
        },
        store() {
            return store;
        }
    },
    methods: {
        async refreshStatus() {
            this.loading = true;
            this.message = '';
            try {
                const response = await axios.get('/api/auth/me');
                store.user = response.data;
                localStorage.setItem('user', JSON.stringify(response.data));
                if (response.data.is_verified) {
                    this.$router.push('/app');
                    return;
                }
                this.message = 'Verification is still in process. Please check again later.';
            } catch (err) {
                this.message = err.response?.data?.message || 'Unable to refresh verification status right now.';
            } finally {
                this.loading = false;
            }
        },
        logout() {
            store.logout();
            this.$router.push('/login');
        }
    }
};
