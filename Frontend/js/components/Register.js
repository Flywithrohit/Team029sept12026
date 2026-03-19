import { store } from '../store.js';
import CompactSelect from './CompactSelect.js';

export default {
    components: {
        CompactSelect
    },
    template: `
    <div class="auth-shell">
        <div class="container auth-container">
            <div class="row justify-content-center align-items-center g-4 auth-row auth-row-register">
                <div class="col-lg-6">
                    <div class="auth-card auth-form-card auth-register-card card border-0 shadow-lg">
                        <p class="panel-kicker mb-2">Register</p>
                        <h3 class="mb-4">Create your CRM account</h3>
                        <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
                        <div v-if="success" class="alert alert-success py-2">{{ success }}</div>
                        <form @submit.prevent="register">
                <div class="mb-3">
                    <label class="form-label">Username</label>
                    <input type="text" v-model="form.username" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Full Name</label>
                    <input type="text" v-model="form.full_name" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" v-model="form.email" class="form-control" required>
                </div>

                <!-- Password Field with Toggle -->
                <div class="mb-2">
                    <label class="form-label">Password</label>
                    <div class="input-group">
                        <input :type="showPassword ? 'text' : 'password'"
                               v-model="form.password"
                               class="form-control"
                               required
                               autocomplete="new-password">
                        <button class="btn btn-outline-secondary" type="button"
                                @click="showPassword = !showPassword"
                                tabindex="-1"
                                :title="showPassword ? 'Hide password' : 'Show password'">
                            <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                        </button>
                    </div>
                </div>

                <!-- Real-Time Validation Checklist -->
                <div v-if="form.password.length > 0" class="mb-2">
                    <ul class="list-unstyled mb-1" style="font-size: 0.82rem;">
                        <li v-for="check in passwordChecks" :key="check.label"
                            :style="{ color: check.passed ? '#198754' : '#dc3545' }">
                            <i :class="check.passed ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'"
                               style="margin-right: 4px;"></i>
                            {{ check.label }}
                        </li>
                    </ul>

                    <!-- Password Strength Bar -->
                    <div class="d-flex align-items-center gap-2 mt-1 mb-1">
                        <div class="progress flex-grow-1" style="height: 6px;">
                            <div class="progress-bar"
                                 :class="strengthBarClass"
                                 :style="{ width: strengthBarWidth }"
                                 role="progressbar"></div>
                        </div>
                        <span style="font-size: 0.78rem; font-weight: 600; min-width: 52px;"
                              :style="{ color: strengthColor }">
                            {{ passwordStrength }}
                        </span>
                    </div>
                </div>

                <!-- Confirm Password Field with Toggle -->
                <div class="mb-3">
                    <label class="form-label">Confirm Password</label>
                    <div class="input-group">
                        <input :type="showConfirmPassword ? 'text' : 'password'"
                               v-model="form.confirm_password"
                               class="form-control"
                               required
                               autocomplete="new-password">
                        <button class="btn btn-outline-secondary" type="button"
                                @click="showConfirmPassword = !showConfirmPassword"
                                tabindex="-1"
                                :title="showConfirmPassword ? 'Hide password' : 'Show password'">
                            <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                        </button>
                    </div>
                    <div v-if="form.confirm_password.length > 0 && !passwordsMatch"
                         style="font-size: 0.82rem; color: #dc3545; margin-top: 4px;">
                        <i class="bi bi-x-circle-fill" style="margin-right: 4px;"></i>
                        Passwords do not match
                    </div>
                    <div v-if="form.confirm_password.length > 0 && passwordsMatch"
                         style="font-size: 0.82rem; color: #198754; margin-top: 4px;">
                        <i class="bi bi-check-circle-fill" style="margin-right: 4px;"></i>
                        Passwords match
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label">Role</label>
                    <compact-select
                        v-model="form.role"
                        :options="roleOptions"
                        placeholder="Select role"
                        width="100%"
                    ></compact-select>
                </div>
                <button type="submit" class="btn hero-btn-primary w-100 mb-2"
                        :disabled="loading || !canSubmit">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    Register
                </button>
                <div class="text-center small">
                    <router-link to="/login">Already have an account? Login</router-link>
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
            form: {
                username: '',
                full_name: '',
                email: '',
                password: '',
                confirm_password: '',
                role: 'Employee'
            },
            showPassword: false,
            showConfirmPassword: false,
            error: null,
            success: null,
            loading: false
        }
    },
    computed: {
        passwordChecks() {
            const pw = this.form.password;
            return [
                { label: 'At least 8 characters', passed: pw.length >= 8 },
                { label: 'At least 1 uppercase letter', passed: /[A-Z]/.test(pw) },
                { label: 'At least 1 lowercase letter', passed: /[a-z]/.test(pw) },
                { label: 'At least 1 number', passed: /[0-9]/.test(pw) },
                { label: 'At least 1 special character (!@#$%^&*…)', passed: /[!@#$%^&*()_+\-=\[\]{}|;:'",.<>?/`~\\]/.test(pw) },
                { label: 'Does not contain username', passed: !this.form.username || this.form.username.length === 0 || !pw.toLowerCase().includes(this.form.username.toLowerCase()) },
                { label: 'Does not contain email', passed: !this.containsEmail }
            ];
        },
        containsEmail() {
            const pw = this.form.password.toLowerCase();
            const email = this.form.email;
            if (!email || !email.includes('@')) return false;
            const local = email.split('@')[0].toLowerCase();
            return local.length >= 3 && pw.includes(local);
        },
        passedCount() {
            return this.passwordChecks.filter(c => c.passed).length;
        },
        allChecksPassed() {
            return this.passwordChecks.every(c => c.passed);
        },
        passwordsMatch() {
            return this.form.password === this.form.confirm_password;
        },
        canSubmit() {
            return this.allChecksPassed
                && this.form.confirm_password.length > 0
                && this.passwordsMatch
                && this.form.username.length > 0
                && this.form.email.length > 0;
        },
        passwordStrength() {
            const n = this.passedCount;
            if (n <= 2) return 'Weak';
            if (n <= 4) return 'Medium';
            return 'Strong';
        },
        strengthBarWidth() {
            const n = this.passedCount;
            const total = this.passwordChecks.length;
            return Math.round((n / total) * 100) + '%';
        },
        strengthBarClass() {
            const s = this.passwordStrength;
            if (s === 'Weak') return 'bg-danger';
            if (s === 'Medium') return 'bg-warning';
            return 'bg-success';
        },
        strengthColor() {
            const s = this.passwordStrength;
            if (s === 'Weak') return '#dc3545';
            if (s === 'Medium') return '#fd7e14';
            return '#198754';
        },
        roleOptions() {
            return [
                { label: 'Employee', value: 'Employee' },
                { label: 'Manager', value: 'Manager' },
                { label: 'Recruitment Executive', value: 'Recruitment Executive' },
                { label: 'Business Development Team', value: 'Business Development Team' }
            ];
        }
    },
    methods: {
        async register() {
            this.loading = true;
            this.error = null;
            this.success = null;
            try {
                await axios.post('/api/auth/register', this.form);
                this.success = 'Registration successful! Redirecting to login...';
                setTimeout(() => {
                    this.$router.push('/login');
                }, 1500);
            } catch (err) {
                this.error = err.response?.data?.message || 'Registration failed';
            } finally {
                this.loading = false;
            }
        }
    }
};
