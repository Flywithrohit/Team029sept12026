import { store } from '../store.js';

export default {
    template: `
    <div class="auth-shell">
        <div class="container py-5">
            <div class="row justify-content-center align-items-center g-4" style="min-height: 100vh;">
                <div class="col-lg-5 d-none d-lg-block">
                    <div class="auth-promo">
                        <span class="eyebrow">Secure CRM Access</span>
                        <h1 class="auth-title mt-3">Welcome back to EduITalent CRM.</h1>
                        <p class="auth-copy">
                            Sign in to manage candidates, clients, internal operations, and team workflows from one place.
                        </p>
                        <div class="auth-feature-list">
                            <div><i class="bi bi-check2-circle"></i> Role-based dashboard access</div>
                            <div><i class="bi bi-check2-circle"></i> Recruitment and business tracking</div>
                            <div><i class="bi bi-check2-circle"></i> Centralized employee operations</div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-5">
                    <div class="auth-card card border-0 shadow-lg p-4 p-md-5">
                        <p class="panel-kicker mb-2">Login</p>
                        <h3 class="mb-4">Access your workspace</h3>
                        <div v-if="error" class="alert alert-danger">{{ error }}</div>
                        <form @submit.prevent="login">
                            <div class="mb-3">
                                <label class="form-label">Username</label>
                                <input type="text" v-model="username" class="form-control form-control-lg" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Password</label>
                                <div class="input-group">
                                    <input :type="showPassword ? 'text' : 'password'"
                                           v-model="password"
                                           class="form-control form-control-lg"
                                           required>
                                    <button class="btn btn-outline-secondary" type="button"
                                            @click="showPassword = !showPassword"
                                            tabindex="-1"
                                            :title="showPassword ? 'Hide password' : 'Show password'">
                                        <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                                    </button>
                                </div>
                            </div>
                            <button type="submit" class="btn hero-btn-primary w-100 mb-3" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                                Login
                            </button>
                            <div class="text-center small">
                                <router-link to="/register">Don't have an account? Register</router-link>
                            </div>
                            <div class="text-center small mt-2">
                                <router-link to="/">Back to homepage</router-link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            username: '',
            password: '',
            showPassword: false,
            error: null,
            loading: false
        }
    },
    methods: {
        async login() {
            this.loading = true;
            this.error = null;
            try {
                const response = await axios.post('/api/auth/login', {
                    username: this.username,
                    password: this.password
                });
                store.login(response.data.user, response.data.access_token);
                this.$router.push(response.data.user.is_verified ? '/app' : '/verification-pending');
            } catch (err) {
                this.error = err.response?.data?.message || 'Login failed';
            } finally {
                this.loading = false;
            }
        }
    }
};
