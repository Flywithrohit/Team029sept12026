import { store } from '../store.js';
import SalaryOverview from './SalaryOverview.js';

export default {
    components: {
        SalaryOverview
    },
    template: `
    <div class="crm-page">
        <div class="crm-page-header animate__animated animate__fadeIn">
            <div>
                <h2 class="crm-page-title">{{ store.hasRole(['Admin']) ? 'Admin Control Center' : 'Manager Dashboard' }}</h2>
                <p class="crm-page-subtitle">Welcome back, <strong>{{ store.user?.full_name || store.user?.username }}</strong></p>
            </div>
            <div class="text-end d-none d-md-block">
                <span class="crm-date-pill">
                    <i class="bi bi-calendar3 text-primary"></i>{{ todayDate }}
                </span>
            </div>
        </div>

        <div class="crm-tabs">
            <a class="crm-tab-link" :class="{active: currentTab === 'users'}" href="#" @click.prevent="currentTab = 'users'">User Management</a>
            <a class="crm-tab-link" :class="{active: currentTab === 'salaries'}" href="#" @click.prevent="currentTab = 'salaries'">Salary Management</a>
            <a class="crm-tab-link" :class="{active: currentTab === 'leaves'}" href="#" @click.prevent="currentTab = 'leaves'">Leave Management</a>
            <a class="crm-tab-link" :class="{active: currentTab === 'recruitment'}" href="#" @click.prevent="currentTab = 'recruitment'">Recruitment Allocations</a>
            <a class="crm-tab-link" :class="{active: currentTab === 'reports'}" href="#" @click.prevent="currentTab = 'reports'">Reports</a>
            <a class="crm-tab-link" :class="{active: currentTab === 'my_salary'}" href="#" @click.prevent="currentTab = 'my_salary'">My Salary</a>
        </div>

        <!-- Users Tab -->
        <div v-if="currentTab === 'users'">
             <div class="crm-toolbar">
                <div>
                    <h4 class="crm-section-title">Users</h4>
                </div>
                <button @click="showUserModal = true" class="btn btn-primary">Create User</button>
            </div>
            <div class="crm-search mb-3">
                <i class="bi bi-search crm-search-icon"></i>
                <input type="text" class="form-control crm-search-input" v-model="userSearch" placeholder="Search by username, name, email, or role">
            </div>
            <div class="table-responsive crm-table-wrap">
                <table class="table table-hover crm-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Username</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Verification</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="u in filteredUsers" :key="u.id">
                            <td>
                                <img :src="getProfilePictureUrl(u.profile_picture, u.full_name || u.username)" alt="" width="32" height="32" class="rounded-circle" style="object-fit: cover;">
                            </td>
                            <td>{{ u.username }}</td>
                            <td>{{ u.full_name }}</td>
                            <td>{{ u.email }}</td>
                            <td><span class="badge crm-badge-muted">{{ u.role }}</span></td>
                            <td>
                                <span class="badge" :class="u.is_verified ? 'bg-success' : 'bg-warning text-dark'">
                                    {{ u.verification_status || (u.is_verified ? 'Approved' : 'Pending') }}
                                </span>
                            </td>
                            <td>{{ u.created_at }}</td>
                            <td>
                                <div class="crm-action-stack">
                                <router-link :to="'/app/profile/' + u.id" class="btn btn-sm crm-action-btn crm-action-btn-outline">Profile</router-link>
                                <button
                                    v-if="store.hasRole(['Admin']) && !u.is_verified"
                                    class="btn btn-sm crm-action-btn btn-outline-success"
                                    @click="updateVerificationStatus(u, 'Approved')"
                                >
                                    Approve
                                </button>
                                <button v-if="store.hasRole(['Admin']) && u.username !== 'admin'" class="btn btn-sm crm-action-btn crm-action-btn-danger" @click="deleteUser(u)">Delete</button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Salary Tab -->
        <div v-if="currentTab === 'salaries'">
             <div class="crm-toolbar">
                <h4 class="crm-section-title">Payroll Records</h4>
                <button @click="showSalaryModal = true" class="btn btn-primary">Process Salary</button>
            </div>
            <div class="crm-search mb-3">
                <i class="bi bi-search crm-search-icon"></i>
                <input type="text" class="form-control crm-search-input" v-model="salarySearch" placeholder="Search by employee, username, month, year, or status">
            </div>
             <div class="table-responsive crm-table-wrap">
                <table class="table table-hover crm-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Month/Year</th>
                            <th>Base</th>
                            <th>Incentives</th>
                            <th>Deductions</th>
                            <th>Net Pay</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="s in filteredSalaries" :key="s.id">
                            <td>{{ s.employee_name }} ({{ s.username }})</td>
                            <td>{{ s.month }} {{ s.year }}</td>
                            <td>{{ s.base_salary }}</td>
                            <td>{{ s.incentives }}</td>
                            <td>{{ s.deductions }}</td>
                            <td><strong>{{ s.net_pay }}</strong></td>
                            <td>{{ s.payment_status }}</td>
                        </tr>
                        <tr v-if="salaries.length === 0">
                            <td colspan="7" class="text-center py-4">No salary records found.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
         </div>

        <!-- Leave Management Tab -->
        <div v-if="currentTab === 'leaves'">
            <div class="crm-toolbar">
                <h4 class="crm-section-title">Leave Applications</h4>
            </div>
            <div class="crm-search mb-3">
                <i class="bi bi-search crm-search-icon"></i>
                <input type="text" class="form-control crm-search-input" v-model="leaveSearch" placeholder="Search by employee, leave type, applied date, approver, reason, or status">
            </div>
            <div class="table-responsive crm-table-wrap">
                <table class="table table-hover crm-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Type</th>
                            <th>Applied On</th>
                            <th>Dates</th>
                            <th>Session</th>
                            <th>Days</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Approved By</th>
                            <th>Actioned On</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="l in filteredLeaves" :key="l.id">
                            <td>{{ l.employee_name }}</td>
                            <td>{{ l.type }}</td>
                            <td>{{ l.applied_at || '-' }}</td>
                            <td>{{ l.start_date }} to {{ l.end_date }}</td>
                            <td>
                                <span class="badge" :class="{
                                    'bg-primary': l.day_type === 'Full Day',
                                    'bg-info text-dark': l.day_type === 'First Half',
                                    'bg-secondary': l.day_type === 'Second Half'
                                }">
                                    {{ l.day_type || 'Full Day' }}
                                </span>
                            </td>
                            <td>{{ l.total_days }}</td>
                            <td>{{ l.reason }}</td>
                            <td>
                                <span :class="{'badge': true, 'bg-warning': l.status === 'Pending', 'bg-success': l.status === 'Approved', 'bg-danger': l.status === 'Rejected'}">{{ l.status }}</span>
                            </td>
                            <td>{{ l.approved_by_name || '-' }}</td>
                            <td>{{ l.approved_at || '-' }}</td>
                            <td>
                                <div v-if="l.status === 'Pending'">
                                    <button class="btn btn-sm btn-success crm-action-btn me-1" @click="updateLeaveStatus(l, 'Approved')">Approve</button>
                                    <button class="btn btn-sm btn-danger crm-action-btn" @click="updateLeaveStatus(l, 'Rejected')">Reject</button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="leaves.length === 0">
                            <td colspan="11" class="text-center py-4">No leave applications found.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Recruitment Allocations Tab -->
        <div v-if="currentTab === 'recruitment'">
            <div class="crm-toolbar">
                <div>
                    <h4 class="crm-section-title mb-1">All Recruiter Assignments</h4>
                    <p class="crm-inline-note mb-0">Monitor workload distribution across recruiters and update active requirement ownership.</p>
                </div>
            </div>
            <div class="row g-3 mb-3">
                <div class="col-md-4">
                    <div class="crm-stat-card h-100">
                        <div class="card-body">
                            <small class="text-muted d-block mb-1">Total Assignments</small>
                            <div class="fs-4 fw-bold">{{ requirements.length }}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="crm-stat-card h-100">
                        <div class="card-body">
                            <small class="text-muted d-block mb-1">Assigned Requirements</small>
                            <div class="fs-4 fw-bold text-primary">{{ assignedRequirementCount }}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="crm-stat-card h-100">
                        <div class="card-body">
                            <small class="text-muted d-block mb-1">Unassigned Requirements</small>
                            <div class="fs-4 fw-bold text-warning">{{ unassignedRequirements.length }}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="crm-search mb-3">
                <i class="bi bi-search crm-search-icon"></i>
                <input type="text" class="form-control crm-search-input" v-model="recruitmentSearch" placeholder="Search by company, role, location, or recruiter">
            </div>
            <div class="table-responsive crm-table-wrap">
                <table class="table table-hover crm-table">
                    <thead>
                        <tr>
                            <th>Recruiter</th>
                            <th>Company</th>
                            <th>Role</th>
                            <th>Location</th>
                            <th>Positions</th>
                            <th>Status</th>
                            <th>Assign Recruiter</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="req in filteredAssignments" :key="req.id">
                            <td>{{ req.recruiter_name }}</td>
                            <td>{{ req.client_company }}</td>
                            <td>{{ req.role_title }}</td>
                            <td>{{ req.location }}</td>
                            <td>{{ req.positions_count }}</td>
                            <td>
                                <div v-if="store.hasRole(['Admin'])" class="d-flex align-items-center gap-2">
                                    <span class="badge" :class="{
                                        'bg-success': req.status === 'Open',
                                        'bg-secondary': req.status === 'Closed',
                                        'bg-warning text-dark': req.status === 'On Hold'
                                    }">{{ req.status }}</span>
                                    <div class="crm-inline-dropdown" :class="{ 'is-open': activeDropdown === 'admin-req-status-' + req.id }">
                                        <button type="button" class="btn btn-sm crm-action-btn crm-action-btn-outline crm-action-menu-trigger crm-action-menu-trigger-sm" @click.stop="toggleDropdown('admin-req-status-' + req.id, $event)">
                                            {{ req.status }}
                                            <i class="bi bi-chevron-down small"></i>
                                        </button>
                                    </div>
                                    <teleport to="body">
                                        <div
                                            v-if="activeDropdown === 'admin-req-status-' + req.id"
                                            ref="activeActionMenu"
                                            class="crm-action-menu crm-action-menu-floating"
                                            :style="activeDropdownStyle"
                                            @click.stop
                                        >
                                            <button
                                                v-for="status in requirementStatusOptions"
                                                :key="status"
                                                type="button"
                                                class="crm-action-menu-item"
                                                :class="{ 'is-active': req.status === status }"
                                                @click="setRequirementStatus(req, status)"
                                            >
                                                <span class="crm-action-menu-item-label">{{ status }}</span>
                                                <i v-if="req.status === status" class="bi bi-check2"></i>
                                            </button>
                                        </div>
                                    </teleport>
                                </div>
                                <span v-else class="badge" :class="{
                                    'bg-success': req.status === 'Open',
                                    'bg-secondary': req.status === 'Closed',
                                    'bg-warning text-dark': req.status === 'On Hold'
                                }">{{ req.status }}</span>
                            </td>
                            <td>
                                <div class="crm-inline-dropdown" :class="{ 'is-open': activeDropdown === 'assign-rec-' + req.id }">
                                    <button type="button" class="btn btn-sm crm-action-btn crm-action-btn-outline crm-action-menu-trigger" @click.stop="toggleDropdown('assign-rec-' + req.id, $event)">
                                        <span class="crm-action-menu-item-label">{{ getRecruiterLabel(req.temp_recruiter_id) }}</span>
                                        <i class="bi bi-chevron-down small"></i>
                                    </button>
                                </div>
                                <teleport to="body">
                                    <div
                                        v-if="activeDropdown === 'assign-rec-' + req.id"
                                        ref="activeActionMenu"
                                        class="crm-action-menu crm-action-menu-floating crm-action-menu-scroll"
                                        :style="activeDropdownStyle"
                                        @click.stop
                                    >
                                        <button
                                            type="button"
                                            class="crm-action-menu-item"
                                            :class="{ 'is-active': !req.temp_recruiter_id }"
                                            @click="selectTempRecruiter(req, '')"
                                        >
                                            <span class="crm-action-menu-item-label">Select Recruiter</span>
                                            <i v-if="!req.temp_recruiter_id" class="bi bi-check2"></i>
                                        </button>
                                        <button
                                            v-for="r in recruiters"
                                            :key="r.id"
                                            type="button"
                                            class="crm-action-menu-item"
                                            :class="{ 'is-active': String(req.temp_recruiter_id) === String(r.id) }"
                                            @click="selectTempRecruiter(req, r.id)"
                                        >
                                            <span class="crm-action-menu-item-label">{{ r.full_name }}</span>
                                            <i v-if="String(req.temp_recruiter_id) === String(r.id)" class="bi bi-check2"></i>
                                        </button>
                                    </div>
                                </teleport>
                            </td>
                            <td>
                                <button class="btn btn-sm crm-action-btn btn-primary" @click="assignRecruiter(req)" :disabled="!req.temp_recruiter_id">Assign</button>
                            </td>
                        </tr>
                        <tr v-if="filteredAssignments.length === 0">
                            <td colspan="8" class="text-center py-4">No assignments found.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Reports Tab -->
        <div v-if="currentTab === 'reports'">
            <div class="crm-toolbar">
                <div>
                    <h4 class="crm-section-title mb-1">Recruitment Reports</h4>
                    <p class="crm-inline-note mb-0">Track client-position fulfillment, shortlisted profiles, and recruiter efficiency.</p>
                </div>
            </div>

            <div class="row g-3 mb-4">
                <div class="col-md-3">
                    <div class="crm-stat-card h-100">
                        <div class="card-body">
                            <small class="text-muted d-block mb-1">Total Requirements</small>
                            <div class="fs-4 fw-bold">{{ reports.requirement_summary.length }}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="crm-stat-card h-100">
                        <div class="card-body">
                            <small class="text-muted d-block mb-1">Profiles Shared</small>
                            <div class="fs-4 fw-bold">{{ totalProfilesShared }}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="crm-stat-card h-100">
                        <div class="card-body">
                            <small class="text-muted d-block mb-1">Shortlisted</small>
                            <div class="fs-4 fw-bold text-primary">{{ totalShortlisted }}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="crm-stat-card h-100">
                        <div class="card-body">
                            <small class="text-muted d-block mb-1">Selected</small>
                            <div class="fs-4 fw-bold text-success">{{ totalSelected }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mb-4">
                <h5 class="crm-section-title mb-3">Client / Position Status</h5>
                <div class="crm-search mb-3">
                    <i class="bi bi-search crm-search-icon"></i>
                    <input type="text" class="form-control crm-search-input" v-model="reportRequirementSearch" placeholder="Search by recruiter, client, position, location, or status">
                </div>
                <div class="table-responsive crm-table-wrap">
                    <table class="table table-hover crm-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Recruiter</th>
                                <th>Client</th>
                                <th>Position</th>
                                <th>Location</th>
                                <th>Openings</th>
                                <th>Profiles Shared</th>
                                <th>Shortlisted</th>
                                <th>Interviewed</th>
                                <th>Selected</th>
                                <th>Rejected</th>
                                <th>Current Status</th>
                            </tr>
                    </thead>
                    <tbody>
                            <tr v-for="item in filteredRequirementReports" :key="item.requirement_id">
                                <td>{{ item.date }}</td>
                                <td>{{ item.recruiter_name }}</td>
                                <td>{{ item.client_company }}</td>
                                <td>{{ item.role_title }}</td>
                                <td>{{ item.location }}</td>
                                <td>{{ item.positions_count }}</td>
                                <td>{{ item.profiles_shared }}</td>
                                <td>{{ item.shortlisted }}</td>
                                <td>{{ item.interviewed }}</td>
                                <td>{{ item.selected }}</td>
                                <td>{{ item.rejected }}</td>
                                <td>
                                    <span :class="getRequirementStatusClass(item)">
                                        {{ getRequirementStatusLabel(item) }}
                                    </span>
                                </td>
                            </tr>
                            <tr v-if="filteredRequirementReports.length === 0">
                                <td colspan="12" class="text-center py-4">No requirement reports available.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <h5 class="crm-section-title mb-2">Recruiter Performance</h5>
                <p class="crm-inline-note mb-3">Activity days come from Daily Activity logs. Sourced, shared, shortlisted, interviewed, selected, and rejected come from actual CRM candidate actions.</p>
                <div class="crm-search mb-3">
                    <i class="bi bi-search crm-search-icon"></i>
                    <input type="text" class="form-control crm-search-input" v-model="reportRecruiterSearch" placeholder="Search recruiter performance by name or metrics">
                </div>
                <div class="table-responsive crm-table-wrap">
                    <table class="table table-hover crm-table">
                        <thead>
                            <tr>
                                <th>Recruiter</th>
                                <th>Activity Days</th>
                                <th>Sourced</th>
                                <th>Shared</th>
                                <th>Closed</th>
                                <th>Shortlisted</th>
                                <th>Interviewed</th>
                                <th>Selected</th>
                                <th>Rejected</th>
                                <th>Share Rate</th>
                                <th>Close Rate</th>
                                <th>Selection Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="r in filteredRecruiterReports" :key="r.recruiter_name">
                                <td>{{ r.recruiter_name }}</td>
                                <td>{{ r.stats.activity_days }}</td>
                                <td>{{ r.stats.sourced }}</td>
                                <td>{{ r.stats.shared }}</td>
                                <td>{{ r.stats.closed }}</td>
                                <td>{{ r.stats.shortlisted }}</td>
                                <td>{{ r.stats.interviewed }}</td>
                                <td>{{ r.stats.selected }}</td>
                                <td>{{ r.stats.rejected }}</td>
                                <td>{{ r.stats.sourced ? Math.round((r.stats.shared / r.stats.sourced) * 100) + '%' : '0%' }}</td>
                                <td>{{ r.stats.shared ? Math.round((r.stats.closed / r.stats.shared) * 100) + '%' : '0%' }}</td>
                                <td>{{ r.stats.shared ? Math.round((r.stats.selected / r.stats.shared) * 100) + '%' : '0%' }}</td>
                            </tr>
                            <tr v-if="filteredRecruiterReports.length === 0">
                                <td colspan="12" class="text-center py-4">No recruiter performance data available.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div v-if="currentTab === 'my_salary'">
            <salary-overview title="My Salary"></salary-overview>
        </div>

        <!-- Create User Modal -->
        <div v-if="showUserModal" class="modal fade show crm-modal" style="display: block; background: rgba(14,23,38,0.45);">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Create New User</h5>
                        <button type="button" class="btn-close" @click="showUserModal = false"></button>
                    </div>
                    <div class="modal-body">
                         <form @submit.prevent="createUser">
                            <div class="mb-3">
                                <label>Username</label>
                                <input type="text" v-model="userForm.username" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label>Password</label>
                                <div class="input-group">
                                    <input :type="showCreateUserPassword ? 'text' : 'password'" v-model="userForm.password" class="form-control" required autocomplete="new-password">
                                    <button class="btn btn-outline-secondary" type="button" @click="showCreateUserPassword = !showCreateUserPassword" tabindex="-1" :title="showCreateUserPassword ? 'Hide password' : 'Show password'">
                                        <i :class="showCreateUserPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                                    </button>
                                </div>
                            </div>
                            <div v-if="userForm.password && userPasswordChecks.length" class="mb-3">
                                <ul class="list-unstyled mb-2" style="font-size: 0.82rem;">
                                    <li v-for="check in userPasswordChecks" :key="check.label" :style="{ color: check.passed ? '#198754' : '#dc3545' }">
                                        <i :class="check.passed ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'" class="me-1"></i>
                                        {{ check.label }}
                                    </li>
                                </ul>
                                <div class="d-flex align-items-center gap-2">
                                    <div class="progress flex-grow-1" style="height: 6px;">
                                        <div class="progress-bar" :class="userStrengthBarClass" :style="{ width: userStrengthBarWidth }"></div>
                                    </div>
                                    <span :style="{ color: userStrengthColor, fontSize: '0.78rem', fontWeight: '600', minWidth: '52px' }">{{ userPasswordStrength }}</span>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label>Confirm Password</label>
                                <div class="input-group">
                                    <input :type="showCreateUserConfirmPassword ? 'text' : 'password'" v-model="userForm.confirm_password" class="form-control" required autocomplete="new-password">
                                    <button class="btn btn-outline-secondary" type="button" @click="showCreateUserConfirmPassword = !showCreateUserConfirmPassword" tabindex="-1" :title="showCreateUserConfirmPassword ? 'Hide password' : 'Show password'">
                                        <i :class="showCreateUserConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                                    </button>
                                </div>
                                <div v-if="userForm.confirm_password" :class="passwordsMatchForUser ? 'text-success' : 'text-danger'" style="font-size: 0.82rem; margin-top: 4px;">
                                    <i :class="passwordsMatchForUser ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'" class="me-1"></i>
                                    {{ passwordsMatchForUser ? 'Passwords match' : 'Passwords do not match' }}
                                </div>
                            </div>
                            <div class="mb-3">
                                <label>Full Name</label>
                                <input type="text" v-model="userForm.full_name" class="form-control" required>
                            </div>
                             <div class="mb-3">
                                <label>Email</label>
                                <input type="email" v-model="userForm.email" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label>Role</label>
                                <select v-model="userForm.role" class="form-select" required>
                                    <option v-for="role in creatableRoles" :key="role" :value="role">{{ role }}</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary" :disabled="!canCreateUser">Create User</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <!-- Process Salary Modal -->
        <div v-if="showSalaryModal" class="modal fade show crm-modal" style="display: block; background: rgba(14,23,38,0.45);">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Process Salary</h5>
                        <button type="button" class="btn-close" @click="showSalaryModal = false"></button>
                    </div>
                    <div class="modal-body">
                         <form @submit.prevent="createSalary">
                            <div class="mb-3">
                                <label>Employee</label>
                                <select v-model="salaryForm.user_id" class="form-select" required>
                                    <option v-for="u in users" :value="u.id">{{ u.full_name }} ({{ u.role }})</option>
                                </select>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label>Month</label>
                                    <select v-model="salaryForm.month" class="form-select" required>
                                        <option value="January">January</option>
                                        <option value="February">February</option>
                                        <option value="March">March</option>
                                        <option value="April">April</option>
                                        <option value="May">May</option>
                                        <option value="June">June</option>
                                        <option value="July">July</option>
                                        <option value="August">August</option>
                                        <option value="September">September</option>
                                        <option value="October">October</option>
                                        <option value="November">November</option>
                                        <option value="December">December</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label>Year</label>
                                    <input type="number" v-model="salaryForm.year" class="form-control" required>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label>Base Salary</label>
                                <input type="number" v-model="salaryForm.base_salary" class="form-control" required>
                            </div>
                             <div class="mb-3">
                                <label>Incentives</label>
                                <input type="number" v-model="salaryForm.incentives" class="form-control">
                            </div>
                             <div class="mb-3">
                                <label>Deductions</label>
                                <input type="number" v-model="salaryForm.deductions" class="form-control">
                            </div>
                             <div class="mb-3">
                                <label>Status</label>
                                <select v-model="salaryForm.payment_status" class="form-select">
                                    <option value="Pending">Pending</option>
                                    <option value="Paid">Paid</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">Save Record</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        
    </div>
    `,
    data() {
        return {
            store,
            currentTab: 'users',
            users: [],
            salaries: [],
            leaves: [],
            requirements: [],
            reports: {
                recruiter_summary: [],
                requirement_summary: []
            },
            showUserModal: false,
            showSalaryModal: false,
            showCreateUserPassword: false,
            showCreateUserConfirmPassword: false,
            userSearch: '',
            salarySearch: '',
            leaveSearch: '',
            recruitmentSearch: '',
            reportRequirementSearch: '',
            reportRecruiterSearch: '',
            activeDropdown: null,
            activeDropdownTrigger: null,
            activeDropdownStyle: {},
            requirementStatusOptions: ['Open', 'Closed', 'On Hold'],
            userForm: { username: '', full_name: '', email: '', role: 'Employee', password: '', confirm_password: '' },
            salaryForm: { year: new Date().getFullYear(), payment_status: 'Pending' },
            todayDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        }
    },
    mounted() {
        this.fetchAllData();
        this.pollingInterval = setInterval(() => {
            this.fetchAllData();
        }, 5000);

        // Listen for profile picture updates from Profile component
        window.addEventListener('profile-picture-updated', this.handleProfilePicUpdate);
        document.addEventListener('click', this.handleDocumentClick);
        document.addEventListener('scroll', this.handleViewportChange, true);
        window.addEventListener('resize', this.handleViewportChange);
    },
    beforeUnmount() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        window.removeEventListener('profile-picture-updated', this.handleProfilePicUpdate);
        document.removeEventListener('click', this.handleDocumentClick);
        document.removeEventListener('scroll', this.handleViewportChange, true);
        window.removeEventListener('resize', this.handleViewportChange);
    },
    computed: {
        recruiters() {
            return this.users.filter(u => u.role === 'Recruitment Executive');
        },
        unassignedRequirements() {
            return this.requirements.filter(r => r.recruiter_name === 'Unassigned' || r.recruiter_name === null);
        },
        assignedRequirementCount() {
            return this.requirements.filter(r => r.recruiter_name && r.recruiter_name !== 'Unassigned').length;
        },
        filteredUsers() {
            const q = this.userSearch.toLowerCase().trim();
            if (!q) return this.users;
            return this.users.filter(u =>
                (u.username || '').toLowerCase().includes(q) ||
                (u.full_name || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.role || '').toLowerCase().includes(q)
            );
        },
        filteredSalaries() {
            const q = this.salarySearch.toLowerCase().trim();
            if (!q) return this.salaries;
            return this.salaries.filter(s =>
                (s.employee_name || '').toLowerCase().includes(q) ||
                (s.username || '').toLowerCase().includes(q) ||
                String(s.month || '').toLowerCase().includes(q) ||
                String(s.year || '').toLowerCase().includes(q) ||
                String(s.payment_status || '').toLowerCase().includes(q)
            );
        },
        filteredLeaves() {
            const q = this.leaveSearch.toLowerCase().trim();
            if (!q) return this.leaves;
            return this.leaves.filter(l =>
                (l.employee_name || '').toLowerCase().includes(q) ||
                (l.type || '').toLowerCase().includes(q) ||
                (l.applied_at || '').toLowerCase().includes(q) ||
                (l.approved_by_name || '').toLowerCase().includes(q) ||
                (l.approved_at || '').toLowerCase().includes(q) ||
                (l.reason || '').toLowerCase().includes(q) ||
                (l.status || '').toLowerCase().includes(q)
            );
        },
        filteredUnassignedRequirements() {
            const q = this.recruitmentSearch.toLowerCase().trim();
            if (!q) return this.unassignedRequirements;
            return this.unassignedRequirements.filter(r =>
                (r.client_company || '').toLowerCase().includes(q) ||
                (r.role_title || '').toLowerCase().includes(q) ||
                (r.location || '').toLowerCase().includes(q) ||
                (r.recruiter_name || '').toLowerCase().includes(q)
            );
        },
        filteredAssignments() {
            const q = this.recruitmentSearch.toLowerCase().trim();
            if (!q) return this.requirements;
            return this.requirements.filter(r =>
                (r.client_company || '').toLowerCase().includes(q) ||
                (r.role_title || '').toLowerCase().includes(q) ||
                (r.location || '').toLowerCase().includes(q) ||
                (r.recruiter_name || '').toLowerCase().includes(q) ||
                (r.status || '').toLowerCase().includes(q)
            );
        },
        filteredRequirementReports() {
            const q = this.reportRequirementSearch.toLowerCase().trim();
            if (!q) return this.reports.requirement_summary;
            return this.reports.requirement_summary.filter(item =>
                (item.recruiter_name || '').toLowerCase().includes(q) ||
                (item.client_company || '').toLowerCase().includes(q) ||
                (item.role_title || '').toLowerCase().includes(q) ||
                (item.location || '').toLowerCase().includes(q) ||
                this.getRequirementStatusLabel(item).toLowerCase().includes(q)
            );
        },
        filteredRecruiterReports() {
            const q = this.reportRecruiterSearch.toLowerCase().trim();
            if (!q) return this.reports.recruiter_summary;
            return this.reports.recruiter_summary.filter(r =>
                (r.recruiter_name || '').toLowerCase().includes(q) ||
                String(r.stats.activity_days || '').includes(q) ||
                String(r.stats.sourced || '').includes(q) ||
                String(r.stats.shared || '').includes(q) ||
                String(r.stats.shortlisted || '').includes(q) ||
                String(r.stats.interviewed || '').includes(q) ||
                String(r.stats.selected || '').includes(q) ||
                String(r.stats.rejected || '').includes(q)
            );
        },
        totalProfilesShared() {
            return this.reports.requirement_summary.reduce((sum, item) => sum + Number(item.profiles_shared || 0), 0);
        },
        totalShortlisted() {
            return this.reports.requirement_summary.reduce((sum, item) => sum + Number(item.shortlisted || 0), 0);
        },
        totalSelected() {
            return this.reports.requirement_summary.reduce((sum, item) => sum + Number(item.selected || 0), 0);
        },
        creatableRoles() {
            if (store.hasRole(['Admin'])) {
                return ['Employee', 'Manager', 'Recruitment Executive', 'Business Development Team'];
            }
            return ['Employee', 'Recruitment Executive', 'Business Development Team'];
        },
        userPasswordChecks() {
            const pw = this.userForm.password || '';
            return [
                { label: 'At least 8 characters', passed: pw.length >= 8 },
                { label: 'At least 1 uppercase letter', passed: /[A-Z]/.test(pw) },
                { label: 'At least 1 lowercase letter', passed: /[a-z]/.test(pw) },
                { label: 'At least 1 number', passed: /[0-9]/.test(pw) },
                { label: 'At least 1 special character', passed: /[!@#$%^&*()_+\-=\[\]{}|;:'",.<>?/`~\\]/.test(pw) },
                { label: 'Does not contain username', passed: !this.userForm.username || !pw.toLowerCase().includes((this.userForm.username || '').toLowerCase()) },
                { label: 'Does not contain email', passed: !this.userContainsEmail }
            ];
        },
        userContainsEmail() {
            const pw = (this.userForm.password || '').toLowerCase();
            const email = this.userForm.email || '';
            if (!email || !email.includes('@')) return false;
            const local = email.split('@')[0].toLowerCase();
            return local.length >= 3 && pw.includes(local);
        },
        passwordsMatchForUser() {
            return this.userForm.password === this.userForm.confirm_password;
        },
        canCreateUser() {
            return this.userPasswordChecks.every(c => c.passed)
                && !!this.userForm.username
                && !!this.userForm.full_name
                && !!this.userForm.email
                && !!this.userForm.password
                && !!this.userForm.confirm_password
                && this.passwordsMatchForUser;
        },
        userPasswordStrength() {
            const passed = this.userPasswordChecks.filter(c => c.passed).length;
            if (passed <= 2) return 'Weak';
            if (passed <= 4) return 'Medium';
            return 'Strong';
        },
        userStrengthBarWidth() {
            return Math.round((this.userPasswordChecks.filter(c => c.passed).length / this.userPasswordChecks.length) * 100) + '%';
        },
        userStrengthBarClass() {
            if (this.userPasswordStrength === 'Weak') return 'bg-danger';
            if (this.userPasswordStrength === 'Medium') return 'bg-warning';
            return 'bg-success';
        },
        userStrengthColor() {
            if (this.userPasswordStrength === 'Weak') return '#dc3545';
            if (this.userPasswordStrength === 'Medium') return '#fd7e14';
            return '#198754';
        }
    },
    methods: {
        handleDocumentClick() {
            this.closeDropdown();
        },
        handleViewportChange() {
            if (!this.activeDropdown || !this.activeDropdownTrigger) return;
            if (!document.body.contains(this.activeDropdownTrigger)) {
                this.closeDropdown();
                return;
            }
            this.positionDropdownMenu(this.activeDropdownTrigger);
        },
        closeDropdown() {
            this.activeDropdown = null;
            this.activeDropdownTrigger = null;
            this.activeDropdownStyle = {};
        },
        toggleDropdown(key, event) {
            if (this.activeDropdown === key) {
                this.closeDropdown();
                return;
            }
            const triggerEl = event?.currentTarget || null;
            this.activeDropdownTrigger = triggerEl;
            this.activeDropdownStyle = this.getDropdownPosition(triggerEl);
            this.activeDropdown = key;
            this.$nextTick(() => {
                this.positionDropdownMenu(this.activeDropdownTrigger);
            });
        },
        getDropdownPosition(triggerEl, menuNode = null) {
            if (!triggerEl) return {};
            const rect = triggerEl.getBoundingClientRect();
            const spacing = 8;
            const viewportPadding = 12;
            const fallbackHeight = 220;
            const fallbackWidth = Math.max(rect.width, 140);
            const menuHeight = menuNode?.offsetHeight || fallbackHeight;
            const menuWidth = Math.max(menuNode?.offsetWidth || 0, fallbackWidth);
            const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
            const openUpward = spaceBelow < menuHeight && rect.top > menuHeight + viewportPadding;
            const top = openUpward
                ? Math.max(viewportPadding, rect.top - menuHeight - spacing)
                : Math.min(window.innerHeight - menuHeight - viewportPadding, rect.bottom + spacing);
            const left = Math.min(
                Math.max(viewportPadding, rect.left),
                Math.max(viewportPadding, window.innerWidth - menuWidth - viewportPadding)
            );

            return {
                top: `${Math.round(top)}px`,
                left: `${Math.round(left)}px`,
                minWidth: `${Math.round(rect.width)}px`
            };
        },
        positionDropdownMenu(triggerEl) {
            if (!triggerEl) return;
            const menuEl = this.$refs.activeActionMenu;
            const menuNode = Array.isArray(menuEl) ? menuEl[0] : menuEl;
            this.activeDropdownStyle = this.getDropdownPosition(triggerEl, menuNode);
        },
        async setRequirementStatus(req, status) {
            this.closeDropdown();
            if (req.status === status) return;
            await this.updateRequirementStatus(req, status);
        },
        selectTempRecruiter(req, recruiterId) {
            req.temp_recruiter_id = recruiterId;
            this.closeDropdown();
        },
        handleProfilePicUpdate(event) {
            const { userId, newPic } = event.detail;
            const userIndex = this.users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                this.users[userIndex].profile_picture = newPic;
            }
        },
        getRecruiterLabel(recruiterId) {
            if (!recruiterId) return 'Select Recruiter';
            const recruiter = this.recruiters.find(r => String(r.id) === String(recruiterId));
            return recruiter ? recruiter.full_name : 'Select Recruiter';
        },
        async fetchAllData() {
            this.fetchUsers();
            this.fetchSalaries();
            this.fetchLeaves();
            this.fetchRequirements();
            this.fetchReports();
        },
        getCacheBustedUrl(url) {
            return url + (url.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
        },
        getProfilePictureUrl(path, name = 'User') {
            if (!path || !String(path).startsWith('data:')) {
                return window.MockAssets?.getAvatarDataUrl(name);
            }
            return path;
        },
        async fetchUsers() {
            try {
                const res = await axios.get(this.getCacheBustedUrl('/api/admin/users'));
                this.users = res.data;
            } catch (err) { console.error("Error fetching users", err); }
        },
        async fetchSalaries() {
            try {
                const res = await axios.get(this.getCacheBustedUrl('/api/admin/salaries'));
                this.salaries = res.data;
            } catch (err) { console.error("Error fetching salaries", err); }
        },
        async fetchLeaves() {
            try {
                const res = await axios.get(this.getCacheBustedUrl('/api/admin/leaves'));
                this.leaves = res.data;
            } catch (err) { console.error("Error fetching leaves", err); }
        },
        async fetchRequirements() {
            try {
                const res = await axios.get(this.getCacheBustedUrl('/api/recruitment/requirements'));
                this.requirements = res.data;
                // Initialize temp_recruiter_id
                this.requirements.forEach(r => r.temp_recruiter_id = "");
            } catch (err) { console.error("Error fetching requirements", err); }
        },
        async fetchReports() {
            try {
                const res = await axios.get(this.getCacheBustedUrl('/api/admin/reports'));
                this.reports = res.data || { recruiter_summary: [], requirement_summary: [] };
            } catch (err) { console.error("Error fetching reports", err); }
        },
        getRequirementStatusLabel(item) {
            if (Number(item.selected || 0) >= Number(item.positions_count || 0) && Number(item.positions_count || 0) > 0) {
                return 'Fulfilled';
            }
            if (Number(item.selected || 0) > 0 || Number(item.interviewed || 0) > 0) {
                return 'In Progress';
            }
            if (Number(item.profiles_shared || 0) > 0) {
                return 'Profiles Shared';
            }
            return item.requirement_status || 'Open';
        },
        getRequirementStatusClass(item) {
            const label = this.getRequirementStatusLabel(item);
            return {
                badge: true,
                'bg-success': label === 'Fulfilled',
                'bg-info text-dark': label === 'In Progress',
                'bg-primary': label === 'Profiles Shared',
                'bg-secondary': label === 'Open' || label === 'Closed' || label === 'On Hold'
            };
        },
        async updateLeaveStatus(leave, status) {
            try {
                await axios.put(`/api/admin/leaves/${leave.id}`, { status });
                this.fetchLeaves();
            } catch (err) { alert('Failed to update leave status'); }
        },
        async assignRecruiter(req) {
            try {
                await axios.put(`/api/recruitment/requirements/${req.id}`, {
                    recruiter_id: req.temp_recruiter_id
                });
                alert('Recruiter assigned successfully');
                this.fetchRequirements();
            } catch (err) { alert('Failed to assign recruiter'); }
        },
        async updateRequirementStatus(req, status) {
            try {
                await axios.put(`/api/recruitment/requirements/${req.id}`, { status });
                this.fetchRequirements();
                this.fetchReports();
            } catch (err) { alert(err.response?.data?.message || 'Failed to update requirement status'); }
        },
        async createUser() {
            try {
                await axios.post('/api/admin/users', this.userForm);
                this.showUserModal = false;
                this.userForm = { username: '', full_name: '', email: '', role: 'Employee', password: '', confirm_password: '' };
                this.showCreateUserPassword = false;
                this.showCreateUserConfirmPassword = false;
                this.fetchUsers();
            } catch (err) { alert(err.response?.data?.message || 'Failed to create user'); }
        },
        async updateVerificationStatus(user, verification_status) {
            try {
                await axios.put(`/api/admin/users/${user.id}/verification`, { verification_status });
                this.fetchUsers();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to update verification status');
            }
        },
        async createSalary() {
            try {
                await axios.post('/api/admin/salaries', this.salaryForm);
                this.showSalaryModal = false;
                this.salaryForm = { year: new Date().getFullYear(), payment_status: 'Pending' };
                this.fetchSalaries();
            } catch (err) { alert(err.response?.data?.message || 'Failed to create salary record'); }
        },
        async deleteUser(user) {
            if (!confirm(`Are you sure you want to delete ${user.username}?`)) return;
            try {
                await axios.delete(`/api/admin/users/${user.id}`);
                this.fetchUsers();
            } catch (err) { alert('Failed to delete user'); }
        }
    }
};
