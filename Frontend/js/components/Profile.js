import { store } from '../store.js';

export default {
    template: `
    <div class="crm-page">
        <div class="crm-page-header">
            <div>
                <h2 class="crm-page-title"><i class="bi bi-person-lines-fill me-2"></i>User Profile</h2>
                <p class="crm-page-subtitle">Manage identity, work details, contact information, and security settings.</p>
            </div>
            <div class="d-flex gap-2">
                <button v-if="!isEditMode && canEditAnyField" class="btn btn-outline-primary" @click="toggleEditMode">
                    <i class="bi bi-pencil me-1"></i> Edit Profile
                </button>
                <template v-if="isEditMode">
                    <button class="btn btn-secondary" @click="cancelEdit">Cancel</button>
                    <button class="btn btn-primary" @click="saveProfile">
                        <i class="bi bi-save me-1"></i> Save Changes
                    </button>
                </template>
            </div>
        </div>

        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
        
        <div v-else-if="error" class="alert alert-danger">
            {{ error }}
        </div>

        <div v-else class="row g-4">
            <!-- Left Column: Picture and Summary -->
            <div class="col-12 col-md-4">
                <div class="crm-card h-100">
                    <div class="card-body text-center d-flex flex-column align-items-center pt-5">
                        <div class="position-relative mb-4">
                            <img :src="getProfilePictureUrl(profileData.profile_picture, profileData.full_name || profileData.username)" 
                                 class="rounded-circle border border-4 border-white shadow" 
                                 style="width: 150px; height: 150px; object-fit: cover;" alt="Profile Picture">
                            <button v-if="isEditMode && canEdit('profile_picture')" @click="triggerFileInput" class="btn btn-sm btn-light position-absolute bottom-0 end-0 rounded-circle shadow-sm" style="width: 32px; height: 32px; padding: 0;">
                                <i class="bi bi-camera shadow"></i>
                            </button>
                            <!-- Hidden file input -->
                            <input type="file" ref="fileInput" @change="uploadImage" style="display: none;" accept="image/*">
                        </div>
                        <h4 class="mb-1">{{ profileData.full_name || profileData.username }}</h4>
                        <p class="text-muted mb-3">{{ profileData.role }} <span v-if="profileData.department">| {{ profileData.department }}</span></p>
                        <span class="badge" :class="profileData.employee_status === 'Active' ? 'bg-success' : 'bg-secondary'">
                            {{ profileData.employee_status || 'Active' }}
                        </span>
                        
                        <div class="crm-profile-snapshot mt-4 w-100 text-start">
                            <div class="crm-profile-snapshot-head">
                                <span class="crm-profile-snapshot-kicker">Profile Snapshot</span>
                                <p class="crm-inline-note mb-0">Quick identity and activity details for this account.</p>
                            </div>
                            <div class="crm-profile-meta-grid">
                                <div v-for="item in profileMetaItems" :key="item.label" class="crm-profile-meta-card">
                                    <div class="crm-profile-meta-icon">
                                        <i :class="item.icon"></i>
                                    </div>
                                    <div class="crm-profile-meta-content">
                                        <div class="crm-profile-meta-label">{{ item.label }}</div>
                                        <div class="crm-profile-meta-value">{{ item.value }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column: Details -->
            <div class="col-12 col-md-8">
                <!-- Basic Information -->
                <div class="crm-card mb-4">
                    <div class="crm-card-header">
                        <h5 class="crm-section-title"><i class="bi bi-info-circle text-primary me-2"></i>Basic Information</h5>
                    </div>
                    <div class="crm-card-body">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label text-muted small">Full Name</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" v-model="editData.full_name" :readonly="!isEditMode || !canEdit('full_name')" :class="{'bg-light': !isEditMode || !canEdit('full_name')}">
                                    <span class="input-group-text bg-light text-muted border-start-0" v-if="!canEdit('full_name')"><i class="bi bi-lock-fill"></i></span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-muted small">Username</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" v-model="editData.username" :readonly="!isEditMode || !canEdit('username')" :class="{'bg-light': !isEditMode || !canEdit('username')}">
                                    <span class="input-group-text bg-light text-muted border-start-0" v-if="!canEdit('username')"><i class="bi bi-lock-fill"></i></span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-muted small">Email Address</label>
                                <div class="input-group">
                                    <input type="email" class="form-control" v-model="editData.email" :readonly="!isEditMode || !canEdit('email')" :class="{'bg-light': !isEditMode || !canEdit('email')}">
                                    <span class="input-group-text bg-light text-muted border-start-0" v-if="!canEdit('email')"><i class="bi bi-lock-fill"></i></span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-muted small">System Role</label>
                                <div class="input-group">
                                    <select v-if="isEditMode && canEdit('role')" class="form-select" v-model="editData.role">
                                        <option v-for="role in editableRoles" :key="role" :value="role">{{ role }}</option>
                                    </select>
                                    <input v-else type="text" class="form-control bg-light" :value="profileData.role" readonly>
                                    <span class="input-group-text bg-light text-muted border-start-0" v-if="!isEditMode || !canEdit('role')"><i class="bi bi-lock-fill"></i></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Work Information -->
                <div class="crm-card mb-4">
                    <div class="crm-card-header">
                        <h5 class="crm-section-title"><i class="bi bi-briefcase text-primary me-2"></i>Work Information</h5>
                    </div>
                    <div class="crm-card-body">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label text-muted small">Department / Role</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" v-model="editData.department" :readonly="!isEditMode || !canEdit('department')" :class="{'bg-light': !isEditMode || !canEdit('department')}">
                                    <span class="input-group-text bg-light text-muted border-start-0" v-if="!canEdit('department')"><i class="bi bi-lock-fill"></i></span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-muted small">Assigned Team</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" v-model="editData.assigned_team" :readonly="!isEditMode || !canEdit('assigned_team')" :class="{'bg-light': !isEditMode || !canEdit('assigned_team')}">
                                    <span class="input-group-text bg-light text-muted border-start-0" v-if="!canEdit('assigned_team')"><i class="bi bi-lock-fill"></i></span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-muted small">Manager</label>
                                <div class="input-group">
                                    <select v-if="isEditMode && canEdit('assigned_manager_id')" class="form-select" v-model="editData.assigned_manager_id">
                                        <option :value="null">None Assigned</option>
                                        <option v-for="manager in managerOptions" :key="manager.id" :value="manager.id">
                                            {{ manager.full_name || manager.username }}
                                        </option>
                                    </select>
                                    <input v-else type="text" class="form-control bg-light" :value="profileData.assigned_manager_name || 'None Assigned'" readonly>
                                    <span class="input-group-text bg-light text-muted border-start-0" v-if="!isEditMode || !canEdit('assigned_manager_id')"><i class="bi bi-lock-fill"></i></span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-muted small">Employee Status</label>
                                <div class="input-group">
                                    <select v-if="isEditMode && canEdit('employee_status')" class="form-select" v-model="editData.employee_status">
                                        <option value="Active">Active</option>
                                        <option value="On Leave">On Leave</option>
                                        <option value="Terminated">Terminated</option>
                                        <option value="Suspended">Suspended</option>
                                    </select>
                                    <input v-else type="text" class="form-control bg-light" :value="profileData.employee_status || 'Active'" readonly>
                                    <span class="input-group-text bg-light text-muted border-start-0" v-if="!isEditMode || !canEdit('employee_status')"><i class="bi bi-lock-fill"></i></span>
                                </div>
                            </div>
                            <div class="col-12" v-if="canView('notes')">
                                <label class="form-label text-muted small">Manager Notes</label>
                                <div class="input-group">
                                    <textarea class="form-control" v-model="editData.notes" rows="2" :readonly="!isEditMode || !canEdit('notes')" :class="{'bg-light': !isEditMode || !canEdit('notes')}"></textarea>
                                    <span class="input-group-text bg-light text-muted border-start-0" v-if="!canEdit('notes')"><i class="bi bi-lock-fill"></i></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Contact Information -->
                <div class="crm-card mb-4">
                    <div class="crm-card-header">
                        <h5 class="crm-section-title"><i class="bi bi-telephone text-primary me-2"></i>Contact Information</h5>
                    </div>
                    <div class="crm-card-body">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label text-muted small">Phone Number</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" v-model="editData.phone_number" :readonly="!isEditMode || !canEdit('phone_number')" :class="{'bg-light': !isEditMode || !canEdit('phone_number')}">
                                    <span class="input-group-text bg-light text-muted border-start-0" v-if="!canEdit('phone_number')"><i class="bi bi-lock-fill"></i></span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label text-muted small">Alternate Phone</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" v-model="editData.alternate_phone" :readonly="!isEditMode || !canEdit('alternate_phone')" :class="{'bg-light': !isEditMode || !canEdit('alternate_phone')}">
                                    <span class="input-group-text bg-light text-muted border-start-0" v-if="!canEdit('alternate_phone')"><i class="bi bi-lock-fill"></i></span>
                                </div>
                            </div>
                            <div class="col-12">
                                <label class="form-label text-muted small">Address</label>
                                <div class="input-group">
                                    <textarea class="form-control" v-model="editData.address" rows="2" :readonly="!isEditMode || !canEdit('address')" :class="{'bg-light': !isEditMode || !canEdit('address')}"></textarea>
                                    <span class="input-group-text bg-light text-muted border-start-0" v-if="!canEdit('address')"><i class="bi bi-lock-fill"></i></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Account Security -->
                <div class="crm-card mb-4" v-if="isSelf || store.hasRole(['Admin'])">
                    <div class="crm-card-header">
                        <h5 class="crm-section-title"><i class="bi bi-shield-lock text-primary me-2"></i>Account Security</h5>
                    </div>
                    <div class="crm-card-body">
                        <div v-if="!isEditMode" class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
                            <div>
                                <h6 class="mb-1">Password Protection</h6>
                                <p class="text-muted mb-0">
                                    Change the password from edit mode using your current password, then confirm the new password before saving.
                                </p>
                            </div>
                            <button v-if="canEditAnyField" class="btn btn-outline-primary" @click="toggleEditMode">
                                <i class="bi bi-key me-1"></i> Change Password
                            </button>
                        </div>
                        <div v-else class="row g-3">
                            <div class="col-md-6" v-if="isEditMode && canEdit('password') && isSelf">
                                <label class="form-label text-muted small">Current Password</label>
                                <div class="input-group">
                                    <input :type="showCurrentPassword ? 'text' : 'password'" class="form-control" v-model="editData.current_password" placeholder="Enter current password">
                                    <button class="btn btn-outline-secondary" type="button" @click="showCurrentPassword = !showCurrentPassword" tabindex="-1">
                                        <i :class="showCurrentPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="col-md-6" v-if="isEditMode && canEdit('password') && !isSelf">
                                <div class="border rounded-3 p-3 h-100 bg-light">
                                    <div class="fw-semibold mb-1">Admin Password Reset</div>
                                    <div class="text-muted small mb-0">
                                        Set a new password directly for this user. The current password is not required for admin resets.
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6" v-if="isEditMode && canEdit('password')">
                                <label class="form-label text-muted small">New Password</label>
                                <div class="input-group">
                                    <input :type="showPassword ? 'text' : 'password'" class="form-control" v-model="editData.password" placeholder="Leave blank to keep current">
                                    <button class="btn btn-outline-secondary" type="button" @click="showPassword = !showPassword" tabindex="-1">
                                        <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="col-md-6" v-if="isEditMode && canEdit('password')">
                                <label class="form-label text-muted small">Confirm New Password</label>
                                <div class="input-group">
                                    <input :type="showConfirmPassword ? 'text' : 'password'" class="form-control" v-model="editData.confirm_password" placeholder="Repeat new password">
                                    <button class="btn btn-outline-secondary" type="button" @click="showConfirmPassword = !showConfirmPassword" tabindex="-1">
                                        <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="col-12" v-if="isEditMode && editData.password">
                                <ul class="list-unstyled mb-2" style="font-size: 0.82rem;">
                                    <li v-for="check in passwordChecks" :key="check.label" :style="{ color: check.passed ? '#198754' : '#dc3545' }">
                                        <i :class="check.passed ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'" class="me-1"></i>
                                        {{ check.label }}
                                    </li>
                                </ul>
                                <div v-if="editData.confirm_password" :class="passwordsMatch ? 'text-success' : 'text-danger'" style="font-size: 0.82rem;">
                                    <i :class="passwordsMatch ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'" class="me-1"></i>
                                    {{ passwordsMatch ? 'Passwords match' : 'Passwords do not match' }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
    `,
    data() {
        return {
            store,
            profileData: {},
            editData: {},
            loading: true,
            error: null,
            isEditMode: false,
            targetUserId: null,
            managerOptions: [],
            showCurrentPassword: false,
            showPassword: false,
            showConfirmPassword: false
        }
    },
    computed: {
        isSelf() {
            return !this.targetUserId || this.targetUserId == store.user?.id || this.$route.path === '/app/profile';
        },
        canEditAnyField() {
            return this.isSelf || store.hasRole(['Manager', 'Admin']);
        },
        editableRoles() {
            return ['Admin', 'Manager', 'Employee', 'Recruitment Executive', 'Business Development Team'];
        },
        passwordChecks() {
            const pw = this.editData.password || '';
            return [
                { label: 'At least 8 characters', passed: pw.length >= 8 },
                { label: 'At least 1 uppercase letter', passed: /[A-Z]/.test(pw) },
                { label: 'At least 1 lowercase letter', passed: /[a-z]/.test(pw) },
                { label: 'At least 1 number', passed: /[0-9]/.test(pw) },
                { label: 'At least 1 special character', passed: /[!@#$%^&*()_+\-=\[\]{}|;:'",.<>?/`~\\]/.test(pw) },
                { label: 'Does not contain username', passed: !this.profileData.username || !pw.toLowerCase().includes((this.profileData.username || '').toLowerCase()) },
                { label: 'Does not contain email', passed: !this.passwordContainsEmail }
            ];
        },
        profileMetaItems() {
            return [
                {
                    label: 'Joined',
                    value: this.profileData.join_date || 'Not available',
                    icon: 'bi bi-calendar3'
                },
                {
                    label: 'Last Login',
                    value: this.profileData.last_login || 'Never',
                    icon: 'bi bi-clock-history'
                },
                {
                    label: 'Employee ID',
                    value: this.profileData.id ? `#${this.profileData.id}` : 'Pending',
                    icon: 'bi bi-shield-check'
                }
            ];
        },
        passwordContainsEmail() {
            const pw = (this.editData.password || '').toLowerCase();
            const email = this.profileData.email || '';
            if (!email || !email.includes('@')) return false;
            const local = email.split('@')[0].toLowerCase();
            return local.length >= 3 && pw.includes(local);
        },
        passwordsMatch() {
            return (this.editData.password || '') === (this.editData.confirm_password || '');
        }
    },
    methods: {
        getProfilePictureUrl(path, name = 'User') {
            if (!path || !String(path).startsWith('data:')) {
                return window.MockAssets?.getAvatarDataUrl(name);
            }
            return path;
        },
        canEdit(field) {
            if (store.hasRole(['Admin'])) return true;

            if (this.isSelf) {
                const selfEditable = ['username', 'full_name', 'email', 'phone_number', 'alternate_phone', 'address', 'profile_picture', 'password'];
                return selfEditable.includes(field);
            }

            if (store.hasRole(['Manager'])) {
                const managerEditable = ['department', 'assigned_team', 'employee_status', 'notes'];
                return managerEditable.includes(field);
            }

            return false;
        },
        canView(field) {
            if (field === 'notes') return this.isSelf || store.hasRole(['Manager', 'Admin']);
            return true;
        },
        async fetchProfile() {
            this.loading = true;
            this.error = null;
            try {
                const url = this.isSelf ? '/api/profile/me' : `/api/profile/${this.targetUserId}`;
                const response = await axios.get(url, {
                    headers: { 'Authorization': `Bearer ${store.token}` }
                });
                this.profileData = response.data;
                this.editData = { ...this.profileData };
                this.loading = false;
            } catch (err) {
                this.error = 'Failed to load profile data.';
                if (err.response?.status === 404) this.error = 'User not found.';
                this.loading = false;
                console.error(err);
            }
        },
        async fetchManagerOptions() {
            if (!store.hasRole(['Admin'])) return;
            try {
                const response = await axios.get('/api/admin/users', {
                    headers: { 'Authorization': `Bearer ${store.token}` }
                });
                this.managerOptions = (response.data || []).filter(user => user.role === 'Manager' || user.role === 'Admin');
            } catch (err) {
                console.error('Failed to load manager options.', err);
            }
        },
        toggleEditMode() {
            this.isEditMode = true;
        },
        triggerFileInput() {
            this.$refs.fileInput.click();
        },
        async uploadImage(event) {
            const file = event.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('profile_picture', file);

            try {
                this.loading = true;
                const url = `/api/profile/${this.profileData.id}/upload_picture`;
                const response = await axios.post(url, formData, {
                    headers: {
                        'Authorization': `Bearer ${store.token}`
                    }
                });

                this.profileData.profile_picture = response.data.profile_picture;
                this.editData.profile_picture = response.data.profile_picture;

                window.dispatchEvent(new CustomEvent('profile-picture-updated', {
                    detail: { userId: this.profileData.id, newPic: response.data.profile_picture }
                }));

                if (this.isSelf) {
                    const localUser = JSON.parse(localStorage.getItem('user'));
                    if (localUser) {
                        localUser.profile_picture = response.data.profile_picture;
                        localStorage.setItem('user', JSON.stringify(localUser));
                        store.user.profile_picture = response.data.profile_picture;
                    }
                }
            } catch (err) {
                this.error = err.response?.data?.message || 'Failed to upload image.';
                console.error(err);
            } finally {
                this.loading = false;
            }
        },
        cancelEdit() {
            this.isEditMode = false;
            this.editData = { ...this.profileData }; 
            this.showCurrentPassword = false;
            this.showPassword = false;
            this.showConfirmPassword = false;
            this.error = null;
        },
        async saveProfile() {
            try {
                this.error = null;
                if (!this.editData.password) {
                    delete this.editData.current_password;
                    delete this.editData.password;
                    delete this.editData.confirm_password;
                } else if (!this.passwordsMatch) {
                    this.error = 'Passwords do not match.';
                    return;
                } else if (this.isSelf && !this.editData.current_password) {
                    this.error = 'Please enter your current password.';
                    return;
                }

                const url = this.isSelf ? `/api/profile/${this.profileData.id}` : `/api/profile/${this.targetUserId}`;
                const response = await axios.put(url, this.editData, {
                    headers: { 'Authorization': `Bearer ${store.token}` }
                });

                this.profileData = response.data.user;
                this.isEditMode = false;
                this.showCurrentPassword = false;
                this.showPassword = false;
                this.showConfirmPassword = false;

                if (this.isSelf) {
                    const mergedUser = {
                        ...(store.user || {}),
                        ...this.profileData
                    };
                    localStorage.setItem('user', JSON.stringify(mergedUser));
                    store.user = mergedUser;
                }

            } catch (err) {
                this.error = err.response?.data?.message || 'Failed to save profile changes.';
                console.error(err);
            }
        }
    },
    created() {
        this.targetUserId = this.$route.params.id;
        this.fetchManagerOptions();
        this.fetchProfile();
    },
    watch: {
        '$route.params.id'(newId) {
            this.targetUserId = newId;
            this.fetchManagerOptions();
            this.fetchProfile();
            this.isEditMode = false;
        }
    }
}
