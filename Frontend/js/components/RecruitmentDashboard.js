import { store } from '../store.js';
import SalaryOverview from './SalaryOverview.js';
import CompactSelect from './CompactSelect.js';
import CalendarField from './CalendarField.js?v=20260318-calendar-refresh-5';

export default {
    components: {
        SalaryOverview,
        CompactSelect,
        CalendarField
    },
    template: `
    <div class="crm-page">
        <div class="crm-page-header animate__animated animate__fadeIn">
            <div>
                <h2 class="crm-page-title">Recruitment Control Center</h2>
                <p class="crm-page-subtitle">Welcome back, <strong>{{ store.user?.full_name || store.user?.username }}</strong></p>
            </div>
            <div class="text-end d-none d-md-block">
                <span class="crm-date-pill">
                    <i class="bi bi-calendar3 text-primary"></i>{{ todayDate }}
                </span>
            </div>
        </div>

        <div class="crm-tabs">
            <a class="crm-tab-link" :class="{active: currentTab === 'requirements'}" href="#" @click.prevent="currentTab = 'requirements'">Job Requirements</a>
            <a class="crm-tab-link" :class="{active: currentTab === 'candidates'}" href="#" @click.prevent="currentTab = 'candidates'">Candidate Pool</a>
            <a class="crm-tab-link" :class="{active: currentTab === 'pipeline'}" href="#" @click.prevent="currentTab = 'pipeline'">Hiring Pipeline</a>
            <a class="crm-tab-link" :class="{active: currentTab === 'daily_logs'}" href="#" @click.prevent="currentTab = 'daily_logs'">Daily Activity</a>
            <a class="crm-tab-link" :class="{active: currentTab === 'reports'}" href="#" @click.prevent="currentTab = 'reports'">Reports</a>
            <a class="crm-tab-link" :class="{active: currentTab === 'salary'}" href="#" @click.prevent="currentTab = 'salary'">My Salary</a>
        </div>

        <!-- Requirements Tab -->
        <div v-if="currentTab === 'requirements'">
            <div class="crm-toolbar">
                <div>
                    <h4 class="crm-section-title mb-1">Requirement Allocation Dashboard</h4>
                    <p class="crm-inline-note mb-0">Review open requirements by recruiter, company, location, profile, and positions before assigning work.</p>
                </div>
                <div class="d-flex flex-wrap align-items-center gap-3 crm-requirement-toolbar-actions">
                    <div class="form-check form-check-inline mb-0">
                        <input class="form-check-input" type="checkbox" id="showAssignedOnly" v-model="showAssignedOnly">
                        <label class="form-check-label" for="showAssignedOnly">Show Assigned Only</label>
                    </div>
                    <div v-if="store.hasRole(['Admin', 'Manager'])" class="form-check form-check-inline mb-0">
                        <input class="form-check-input" type="checkbox" id="showUnassignedOnly" v-model="showUnassignedOnly">
                        <label class="form-check-label" for="showUnassignedOnly">Show Unassigned Only</label>
                    </div>
                    <button v-if="store.hasRole(['Admin', 'Manager'])" @click="showRequirementModal = true" class="btn btn-primary crm-requirement-add-btn">Add Requirement</button>
                </div>
            </div>

            <div class="row g-3 mb-3">
                <div class="col-md-4">
                    <div class="crm-stat-card h-100">
                        <div class="card-body">
                            <small class="text-muted d-block mb-1">Open Requirements</small>
                            <div class="fs-4 fw-bold">{{ openRequirementCount }}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="crm-stat-card h-100">
                        <div class="card-body">
                            <small class="text-muted d-block mb-1">Unassigned Requirements</small>
                            <div class="fs-4 fw-bold text-warning">{{ unassignedRequirementCount }}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="crm-stat-card h-100">
                        <div class="card-body">
                            <small class="text-muted d-block mb-1">Available Positions</small>
                            <div class="fs-4 fw-bold text-primary">{{ totalOpenPositions }}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="crm-search mb-3">
                <i class="bi bi-search crm-search-icon"></i>
                <input type="text" class="form-control crm-search-input" v-model="requirementSearch" placeholder="Search requirements by recruiter, company, location, profile, or status">
            </div>
            
            <div class="table-responsive crm-table-wrap">
                <table class="table table-hover crm-table">
                    <thead>
                        <tr>
                            <th>Recruiter Name</th>
                            <th>Company</th>
                            <th>Location</th>
                            <th>Profile Name</th>
                            <th>No. of Positions</th>
                            <th>JD</th>
                            <th>Status</th>
                            <th v-if="store.hasRole(['Admin', 'Manager'])">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="req in searchedRequirements" :key="req.id">
                            <td>{{ req.recruiter_name }}</td>
                            <td>{{ req.client_company }}</td>
                            <td>{{ req.location }}</td>
                            <td>{{ req.role_title }}</td>
                            <td>{{ req.positions_count }}</td>
                            <td>
                                <a v-if="req.jd_file_path" :href="req.jd_file_path" target="_blank" class="btn btn-sm crm-action-btn crm-action-btn-outline"><i class="bi bi-file-earmark-text"></i> View</a>
                                <span v-else class="text-muted small">N/A</span>
                            </td>
                            <td>
                                <div v-if="store.hasRole(['Admin'])" class="d-flex align-items-center gap-2">
                                    <span :class="getStatusClass(req.status)">{{ req.status }}</span>
                                    <div class="crm-inline-dropdown" :class="{ 'is-open': activeDropdown === 'req-status-' + req.id }">
                                        <button type="button" class="btn btn-sm crm-action-btn crm-action-btn-outline crm-action-menu-trigger crm-action-menu-trigger-sm" @click.stop="toggleDropdown('req-status-' + req.id, $event)">
                                            {{ req.status }}
                                            <i class="bi bi-chevron-down small"></i>
                                        </button>
                                    </div>
                                    <teleport to="body">
                                        <div
                                            v-if="activeDropdown === 'req-status-' + req.id"
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
                                <span v-else :class="getStatusClass(req.status)">{{ req.status }}</span>
                            </td>
                            <td v-if="store.hasRole(['Admin', 'Manager'])">
                                <div class="crm-action-stack">
                                    <button class="btn btn-sm crm-action-btn crm-action-btn-outline" @click="openAssignModal(req)">Assign</button>
                                    <button class="btn btn-sm crm-action-btn crm-action-btn-danger" @click="deleteRequirement(req.id)">Delete</button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="searchedRequirements.length === 0">
                            <td :colspan="store.hasRole(['Admin', 'Manager']) ? 8 : 7" class="text-center py-4">No requirements found.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Candidate Pool Tab -->
        <div v-if="currentTab === 'candidates'">

            <!-- Header Bar -->
            <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                <div>
                    <h4 class="mb-0"><i class="bi bi-people-fill me-2"></i>Talent Pool</h4>
                    <p class="text-muted mb-0 mt-1">Unassigned candidates stay here until you map them to a live client requirement.</p>
                </div>
                <div class="d-flex gap-2">
                    <label class="btn btn-outline-success mb-0" style="cursor: pointer;">
                        <i class="bi bi-file-earmark-spreadsheet me-1"></i>Upload Excel
                        <input type="file" accept=".xlsx,.csv" @change="handleExcelUpload" style="display: none;">
                    </label>
                    <button @click="showCandidateModal = true" class="btn btn-primary">
                        <i class="bi bi-plus-lg me-1"></i>Add Candidate
                    </button>
                </div>
            </div>

            <!-- Import Summary Alert -->
            <div v-if="importSummary" class="alert alert-info alert-dismissible fade show py-2" role="alert">
                <i class="bi bi-check-circle-fill me-1"></i>
                <strong>{{ importSummary.imported }}</strong> candidates imported successfully.
                <span v-if="importSummary.skipped > 0">
                    <strong>{{ importSummary.skipped }}</strong> duplicate records skipped.
                </span>
                <button type="button" class="btn-close" @click="importSummary = null"></button>
            </div>

            <!-- Search Bar -->
            <div class="row mb-3">
                <div class="col-md-6">
                    <div class="crm-search">
                        <i class="bi bi-search crm-search-icon"></i>
                        <input type="text" class="form-control crm-search-input" placeholder="Search by name, email, phone, company, profile, location..."
                               v-model="candidateSearch">
                    </div>
                </div>
                <div class="col-md-6 text-end d-flex align-items-center justify-content-end gap-2">
                    <button class="btn btn-sm btn-outline-secondary" @click="showFilters = !showFilters">
                        <i class="bi bi-funnel me-1"></i>{{ showFilters ? 'Hide Filters' : 'Show Filters' }}
                    </button>
                    <span class="badge bg-secondary">{{ filteredCandidates.length }} candidate{{ filteredCandidates.length !== 1 ? 's' : '' }}</span>
                </div>
            </div>

            <!-- Filter Panel -->
            <div v-if="showFilters" class="card mb-3 border-0 shadow-sm">
                <div class="card-body py-2">
                    <div class="row g-2">
                        <div class="col-md-2">
                            <label class="form-label small mb-1">Location</label>
                            <input type="text" class="form-control form-control-sm" v-model="filters.location" placeholder="Any">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small mb-1">Profile / Role</label>
                            <input type="text" class="form-control form-control-sm" v-model="filters.profile" placeholder="Any">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small mb-1">Min Experience (yrs)</label>
                            <input type="number" class="form-control form-control-sm" v-model.number="filters.minExp" placeholder="0" min="0" step="0.5">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small mb-1">Max CTC (LPA)</label>
                            <input type="number" class="form-control form-control-sm" v-model.number="filters.maxCtc" placeholder="Any" min="0">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small mb-1">Notice Period</label>
                            <input type="text" class="form-control form-control-sm" v-model="filters.noticePeriod" placeholder="Any">
                        </div>
                        <div class="col-md-2 d-flex align-items-end">
                            <button class="btn btn-sm btn-outline-danger w-100" @click="clearFilters">
                                <i class="bi bi-x-circle me-1"></i>Clear
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Candidate Table -->
            <div class="table-responsive crm-table-wrap">
                <table class="table table-hover crm-table align-middle" style="font-size: 0.88rem;">
                    <thead class="table-light">
                        <tr>
                            <th>Name</th>
                            <th>Profile</th>
                            <th>Company</th>
                            <th>Location</th>
                            <th>Email</th>
                            <th>Contact</th>
                            <th>Tot Exp</th>
                            <th>Rel Exp</th>
                            <th>CTC</th>
                            <th>Expected</th>
                            <th>Notice</th>
                            <th>Status</th>
                            <th style="min-width: 220px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="cand in paginatedCandidates" :key="cand.id">
                            <td class="fw-semibold">{{ cand.name || '-' }}</td>
                            <td>{{ cand.profile_name || '-' }}</td>
                            <td>{{ cand.company_name || '-' }}</td>
                            <td>{{ cand.location || '-' }}</td>
                            <td><small>{{ cand.email || '-' }}</small></td>
                            <td>{{ cand.phone || '-' }}</td>
                            <td>{{ cand.total_experience != null ? cand.total_experience + 'y' : '-' }}</td>
                            <td>{{ cand.relevant_experience != null ? cand.relevant_experience + 'y' : '-' }}</td>
                            <td>{{ cand.current_ctc != null ? cand.current_ctc + ' LPA' : '-' }}</td>
                            <td>{{ cand.expected_ctc != null ? cand.expected_ctc + ' LPA' : '-' }}</td>
                            <td>{{ cand.notice_period || '-' }}</td>
                            <td><span :class="getStatusClass(cand.status)">{{ cand.status }}</span></td>
                            <td>
                                <div class="crm-action-stack">
                                <button class="btn btn-sm crm-action-btn crm-action-btn-outline" @click="viewCandidate(cand)" title="View Details">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-sm crm-action-btn btn-primary" @click="openCandidateAssignmentModal(cand)">Assign To Role</button>
                                <button class="btn btn-sm crm-action-btn crm-action-btn-outline" @click="toggleTalentPoolStatus(cand)">
                                    {{ cand.status === 'On Hold' ? 'Mark Available' : 'Put On Hold' }}
                                </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="filteredCandidates.length === 0">
                            <td colspan="13" class="text-center py-4 text-muted">
                                <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                                <p class="mt-2 mb-0">No unassigned candidates found. Add more talent or check the hiring pipeline for assigned profiles.</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <nav v-if="totalPages > 1" class="mt-3 d-flex justify-content-between align-items-center">
                <small class="text-muted">Showing {{ pageStart + 1 }}–{{ pageEnd }} of {{ filteredCandidates.length }}</small>
                <ul class="pagination pagination-sm mb-0">
                    <li class="page-item" :class="{ disabled: currentPage === 1 }">
                        <a class="page-link" href="#" @click.prevent="currentPage = currentPage - 1">&laquo;</a>
                    </li>
                    <li v-for="p in visiblePages" :key="p" class="page-item" :class="{ active: p === currentPage }">
                        <a class="page-link" href="#" @click.prevent="currentPage = p">{{ p }}</a>
                    </li>
                    <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                        <a class="page-link" href="#" @click.prevent="currentPage = currentPage + 1">&raquo;</a>
                    </li>
                </ul>
            </nav>
        </div>

        <div v-if="currentTab === 'pipeline'">
            <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                <div>
                    <h4 class="mb-0"><i class="bi bi-diagram-3 me-2"></i>Hiring Pipeline</h4>
                    <p class="text-muted mb-0 mt-1">Candidates move here after they are assigned to a specific client and role.</p>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <input type="text" class="form-control form-control-sm" style="width: 320px;" v-model="pipelineSearch" placeholder="Search by candidate, client, role, recruiter, location...">
                    <span class="badge bg-secondary">{{ filteredPipelineCandidates.length }} in pipeline</span>
                </div>
            </div>

            <div class="table-responsive crm-table-wrap">
                <table class="table table-hover crm-table align-middle">
                    <thead>
                        <tr>
                            <th>Candidate</th>
                            <th>Client</th>
                            <th>Position</th>
                            <th>Location</th>
                            <th>Recruiter</th>
                            <th>Stage</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="cand in filteredPipelineCandidates" :key="cand.id">
                            <td>
                                <div class="fw-semibold">{{ cand.name || '-' }}</div>
                                <small class="text-muted">{{ cand.email || cand.phone || 'No contact info' }}</small>
                            </td>
                            <td>{{ cand.job_client_company || '-' }}</td>
                            <td>{{ cand.job_role || '-' }}</td>
                            <td>{{ cand.job_location || cand.location || '-' }}</td>
                            <td>{{ cand.assigned_recruiter_name || '-' }}</td>
                            <td><span :class="getStatusClass(cand.status)">{{ cand.status }}</span></td>
                            <td>
                                <div class="crm-action-stack">
                                <button class="btn btn-sm crm-action-btn crm-action-btn-outline" @click="viewCandidate(cand)">View</button>
                                <div class="crm-inline-dropdown" :class="{ 'is-open': activeDropdown === 'pipeline-status-' + cand.id }">
                                    <button type="button" class="btn btn-sm crm-action-btn crm-action-btn-outline crm-action-menu-trigger" @click.stop="toggleDropdown('pipeline-status-' + cand.id, $event)">
                                        {{ cand.status }}
                                        <i class="bi bi-chevron-down small"></i>
                                    </button>
                                </div>
                                <teleport to="body">
                                    <div
                                        v-if="activeDropdown === 'pipeline-status-' + cand.id"
                                        ref="activeActionMenu"
                                        class="crm-action-menu crm-action-menu-floating"
                                        :style="activeDropdownStyle"
                                        @click.stop
                                    >
                                        <button
                                            v-for="status in pipelineStatusOptions"
                                            :key="status"
                                            type="button"
                                            class="crm-action-menu-item"
                                            :class="{ 'is-active': cand.status === status }"
                                            @click="setCandidateStatus(cand, status)"
                                        >
                                            <span class="crm-action-menu-item-label">{{ status }}</span>
                                            <i v-if="cand.status === status" class="bi bi-check2"></i>
                                        </button>
                                    </div>
                                </teleport>
                                <button class="btn btn-sm crm-action-btn btn-outline-warning" @click="moveCandidateBackToPool(cand)">Move To Pool</button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="filteredPipelineCandidates.length === 0">
                            <td colspan="7" class="text-center py-4 text-muted">No assigned candidates found yet.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Daily Logs Tab -->
        <div v-if="currentTab === 'daily_logs'">
            <h4>Daily Activity Log</h4>
            <div class="card mb-4">
                <div class="card-body">
                    <form @submit.prevent="createDailyLog">
                        <div class="row">
                            <div class="col-md-3 mb-2">
                                <label>Date</label>
                                <calendar-field v-model="dailyLogForm.date" type="date" required></calendar-field>
                            </div>
                            <div class="col-md-3 mb-2">
                                <label>Profiles Sourced</label>
                                <input type="number" class="form-control" v-model="dailyLogForm.profiles_sourced" required min="0">
                            </div>
                            <div class="col-md-3 mb-2">
                                <label>Profiles Shared</label>
                                <input type="number" class="form-control" v-model="dailyLogForm.profiles_shared" required min="0">
                            </div>
                            <div class="col-md-3 mb-2">
                                <label>Comments</label>
                                <input type="text" class="form-control" v-model="dailyLogForm.comments">
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary">Submit Log</button>
                    </form>
                </div>
            </div>

            <div class="table-responsive crm-table-wrap">
                <div class="p-3 pb-0">
                    <div class="crm-search">
                        <i class="bi bi-search crm-search-icon"></i>
                        <input type="text" class="form-control crm-search-input" v-model="dailyLogSearch" placeholder="Search daily logs by date, recruiter, counts, or comments">
                    </div>
                </div>
                <table class="table table-hover crm-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Recruiter</th>
                            <th>Sourced</th>
                            <th>Shared</th>
                            <th>Comments</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="log in filteredDailyLogs" :key="log.id">
                            <td>{{ log.date }}</td>
                            <td>{{ log.recruiter_name }}</td>
                            <td>{{ log.profiles_sourced }}</td>
                            <td>{{ log.profiles_shared }}</td>
                            <td>{{ log.comments }}</td>
                        </tr>
                        <tr v-if="filteredDailyLogs.length === 0">
                            <td colspan="5" class="text-center py-4">No activity logs found.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="currentTab === 'reports'">
            <div class="crm-toolbar">
                <div>
                    <h4 class="crm-section-title mb-1">Recruitment Reports</h4>
                    <p class="crm-inline-note mb-0">Track profiles shared, shortlisted, interviewed, and selected by client and position.</p>
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
                <h5 class="crm-section-title mb-3">Daily Client / Position Status</h5>
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
                            <tr v-for="item in filteredRecruiterReports" :key="item.recruiter_name">
                                <td>{{ item.recruiter_name }}</td>
                                <td>{{ item.stats.activity_days }}</td>
                                <td>{{ item.stats.sourced }}</td>
                                <td>{{ item.stats.shared }}</td>
                                <td>{{ item.stats.closed }}</td>
                                <td>{{ item.stats.shortlisted }}</td>
                                <td>{{ item.stats.interviewed }}</td>
                                <td>{{ item.stats.selected }}</td>
                                <td>{{ item.stats.rejected }}</td>
                                <td>{{ item.stats.sourced ? Math.round((item.stats.shared / item.stats.sourced) * 100) + '%' : '0%' }}</td>
                                <td>{{ item.stats.shared ? Math.round((item.stats.closed / item.stats.shared) * 100) + '%' : '0%' }}</td>
                                <td>{{ item.stats.shared ? Math.round((item.stats.selected / item.stats.shared) * 100) + '%' : '0%' }}</td>
                            </tr>
                            <tr v-if="filteredRecruiterReports.length === 0">
                                <td colspan="12" class="text-center py-4">No recruiter performance data available.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div v-if="currentTab === 'salary'">
            <salary-overview title="My Salary"></salary-overview>
        </div>

        <!-- Add Requirement Modal -->
        <div v-if="showRequirementModal" class="modal fade show crm-modal" style="display: block; background: rgba(14,23,38,0.45);">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">New Job Requirement</h5>
                        <button type="button" class="btn-close" @click="showRequirementModal = false"></button>
                    </div>
                    <div class="modal-body">
                         <form @submit.prevent="createRequirement">
                            <div class="mb-3">
                                <label>Client Company</label>
                                <input type="text" v-model="requirementForm.client_company" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label>Role Title</label>
                                <input type="text" v-model="requirementForm.role_title" class="form-control" required>
                            </div>
                             <div class="mb-3">
                                <label>Location</label>
                                <input type="text" v-model="requirementForm.location" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label>Positions</label>
                                <input type="number" v-model="requirementForm.positions_count" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label>Job Description (File)</label>
                                <input type="file" @change="handleFileUpload($event, 'jd')" class="form-control">
                            </div>
                            <button type="submit" class="btn btn-primary">Create</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <!-- Assign Modal -->
        <div v-if="showAssignModal" class="modal fade show crm-modal" style="display: block; background: rgba(14,23,38,0.45); overflow: visible;">
            <div class="modal-dialog crm-assign-modal-dialog" style="overflow: visible;">
                <div class="modal-content crm-assign-modal-content" style="overflow: visible;">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title mb-1">Assign Recruiter</h5>
                            <p class="crm-inline-note mb-0">Choose the recruiter who will own this requirement.</p>
                        </div>
                        <button type="button" class="btn-close" @click="showAssignModal = false"></button>
                    </div>
                    <div class="modal-body crm-assign-modal-body" style="overflow: visible;">
                         <form @submit.prevent="assignRecruiter">
                            <div v-if="selectedAssignmentRequirement" class="crm-assign-modal-summary mb-3">
                                <div class="crm-assign-modal-summary-label">Requirement</div>
                                <div class="crm-assign-modal-summary-title">
                                    {{ selectedAssignmentRequirement.role_title }}
                                </div>
                                <div class="crm-assign-modal-summary-meta">
                                    <span>{{ selectedAssignmentRequirement.client_company }}</span>
                                    <span>{{ selectedAssignmentRequirement.location }}</span>
                                    <span>{{ selectedAssignmentRequirement.positions_count }} position{{ Number(selectedAssignmentRequirement.positions_count) === 1 ? '' : 's' }}</span>
                                </div>
                            </div>
                            <div class="mb-4">
                                <label class="form-label fw-semibold">Select Recruiter</label>
                                <compact-select
                                    v-model="assignForm.recruiter_id"
                                    :options="recruiterSelectOptions"
                                    placeholder="Choose recruiter"
                                    width="100%"
                                ></compact-select>
                                <small class="text-muted d-block mt-2">
                                    {{ selectedRecruiterName ? 'Selected: ' + selectedRecruiterName : 'No recruiter selected yet.' }}
                                </small>
                            </div>
                            <div class="d-flex justify-content-end gap-2">
                                <button type="button" class="btn btn-light" @click="showAssignModal = false">Cancel</button>
                                <button type="submit" class="btn btn-primary" :disabled="!assignForm.recruiter_id">Save Assignment</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showCandidateAssignmentModal && selectedCandidateForAssignment" class="modal fade show crm-modal" style="display: block; background: rgba(14,23,38,0.45); overflow: visible;">
            <div class="modal-dialog crm-assign-modal-dialog" style="overflow: visible;">
                <div class="modal-content crm-assign-modal-content" style="overflow: visible;">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title mb-1">Assign Candidate To Requirement</h5>
                            <p class="crm-inline-note mb-0">Map the candidate to a live requirement and move them into the hiring pipeline.</p>
                        </div>
                        <button type="button" class="btn-close" @click="showCandidateAssignmentModal = false"></button>
                    </div>
                    <div class="modal-body crm-assign-modal-body" style="overflow: visible;">
                        <form @submit.prevent="assignCandidateToRequirement">
                            <div class="crm-assign-modal-summary mb-3">
                                <div class="crm-assign-modal-summary-label">Candidate</div>
                                <div class="crm-assign-modal-summary-title">
                                    {{ selectedCandidateForAssignment.name }}
                                </div>
                                <div class="crm-assign-modal-summary-meta">
                                    <span>{{ selectedCandidateForAssignment.profile_name || 'Profile not added' }}</span>
                                    <span>{{ selectedCandidateForAssignment.location || 'Location pending' }}</span>
                                    <span>{{ selectedCandidateForAssignment.status || 'Available' }}</span>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-semibold">Open Requirement</label>
                                <compact-select
                                    v-model="candidateAssignmentForm.job_requirement_id"
                                    :options="openRequirementSelectOptions"
                                    placeholder="Select client and role"
                                    width="100%"
                                ></compact-select>
                                <small class="text-muted d-block mt-2">
                                    {{ candidateAssignmentRequirementLabel || 'Choose the requirement you want this candidate assigned to.' }}
                                </small>
                            </div>
                            <div v-if="store.hasRole(['Admin', 'Manager'])" class="mb-4">
                                <label class="form-label fw-semibold">Recruiter</label>
                                <compact-select
                                    v-model="candidateAssignmentForm.recruiter_id"
                                    :options="recruiterSelectOptions"
                                    placeholder="Select recruiter"
                                    width="100%"
                                ></compact-select>
                                <small class="text-muted d-block mt-2">
                                    {{ candidateAssignmentRecruiterName ? 'Selected: ' + candidateAssignmentRecruiterName : 'This recruiter will be assigned to the selected requirement before moving the candidate into the pipeline.' }}
                                </small>
                            </div>
                            <div class="d-flex justify-content-end gap-2">
                                <button type="button" class="btn btn-light" @click="showCandidateAssignmentModal = false">Cancel</button>
                                <button type="submit" class="btn btn-primary" :disabled="!canSubmitCandidateAssignment">Move To Pipeline</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add Candidate Modal -->
        <div v-if="showCandidateModal" class="modal fade show crm-modal" style="display: block; background: rgba(14,23,38,0.45); overflow: visible;">
            <div class="modal-dialog modal-lg crm-candidate-modal-dialog" style="overflow: visible;">
                <div class="modal-content crm-candidate-modal-content" style="overflow: visible;">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title mb-1">Add New Candidate</h5>
                            <p class="crm-inline-note mb-0">Capture candidate details cleanly before keeping them in the pool or attaching them to a live role.</p>
                        </div>
                        <button type="button" class="btn-close" @click="showCandidateModal = false"></button>
                    </div>
                    <div class="modal-body crm-candidate-modal-body" style="overflow: visible;">
                         <form @submit.prevent="addCandidate">
                            <div class="crm-candidate-modal-banner mb-4">
                                <div class="crm-candidate-modal-banner-title">Talent Pool Intake</div>
                                <p class="mb-0">Use this form to create a polished candidate profile with experience, salary, notice period, and resume details.</p>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label fw-semibold">Name <span class="text-danger">*</span></label>
                                    <input type="text" v-model="candidateForm.name" class="form-control" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label fw-semibold">Email</label>
                                    <input type="email" v-model="candidateForm.email" class="form-control">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label fw-semibold">Phone</label>
                                    <input type="text" v-model="candidateForm.phone" class="form-control">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label fw-semibold">Company Name</label>
                                    <input type="text" v-model="candidateForm.company_name" class="form-control">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label fw-semibold">Profile / Role</label>
                                    <input type="text" v-model="candidateForm.profile_name" class="form-control">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label fw-semibold">Location</label>
                                    <input type="text" v-model="candidateForm.location" class="form-control">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label fw-semibold">Qualification</label>
                                    <input type="text" v-model="candidateForm.qualification" class="form-control">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label fw-semibold">Total Experience</label>
                                    <input type="number" step="0.5" v-model="candidateForm.total_experience" class="form-control">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label fw-semibold">Relevant Experience</label>
                                    <input type="number" step="0.5" v-model="candidateForm.relevant_experience" class="form-control">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label fw-semibold">In-hand Salary</label>
                                    <input type="number" step="0.01" v-model="candidateForm.in_hand_salary" class="form-control">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label fw-semibold">CTC Salary</label>
                                    <input type="number" step="0.01" v-model="candidateForm.current_ctc" class="form-control">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label fw-semibold">Expected Salary</label>
                                    <input type="number" step="0.01" v-model="candidateForm.expected_ctc" class="form-control">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label fw-semibold">Notice Period</label>
                                    <input type="text" v-model="candidateForm.notice_period" class="form-control" placeholder="e.g. 30 Days">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label fw-semibold">Assign To Open Role (Optional)</label>
                                    <compact-select
                                        v-model="candidateForm.job_requirement_id"
                                        :options="candidateFormRequirementOptions"
                                        placeholder="Keep in talent pool"
                                        width="100%"
                                    ></compact-select>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label fw-semibold">Resume (File)</label>
                                    <input type="file" @change="handleFileUpload($event, 'resume')" class="form-control">
                                </div>
                            </div>
                            <div class="d-flex justify-content-end gap-2 mt-2">
                                <button type="button" class="btn btn-light" @click="showCandidateModal = false">Cancel</button>
                                <button type="submit" class="btn btn-primary">Add Candidate</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <!-- View Candidate Detail Modal -->
        <div v-if="showDetailModal && selectedCandidate" class="modal fade show crm-modal" style="display: block; background: rgba(14,23,38,0.45);">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title"><i class="bi bi-person-badge me-2"></i>Candidate Profile</h5>
                        <button type="button" class="btn-close btn-close-white" @click="showDetailModal = false"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-12 mb-3">
                                <h5 class="mb-1">{{ selectedCandidate.name || 'N/A' }}</h5>
                                <span :class="getStatusClass(selectedCandidate.status)" class="me-2">{{ selectedCandidate.status }}</span>
                                <small class="text-muted" v-if="selectedCandidate.profile_name">{{ selectedCandidate.profile_name }}</small>
                            </div>
                        </div>
                        <hr class="my-2">
                        <div class="row g-3">
                            <div class="col-md-6" v-for="item in detailFields" :key="item.label">
                                <div class="d-flex">
                                    <span class="text-muted me-2" style="min-width: 140px; font-size: 0.85rem;">{{ item.label }}:</span>
                                    <span class="fw-semibold" style="font-size: 0.9rem;">{{ item.value || 'N/A' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" @click="showDetailModal = false">Close</button>
                    </div>
                </div>
            </div>
        </div>

    </div>
    `,
    data() {
        return {
            store,
            currentTab: 'requirements',
            requirements: [],
            recruiters: [],
            candidates: [],
            dailyLogs: [],
            reports: {
                recruiter_summary: [],
                requirement_summary: []
            },
            showRequirementModal: false,
            showCandidateModal: false,
            showAssignModal: false,
            showCandidateAssignmentModal: false,
            showAssignedOnly: false,
            showUnassignedOnly: false,
            showDetailModal: false,
            showFilters: false,
            selectedCandidate: null,
            selectedCandidateForAssignment: null,
            importSummary: null,
            activeDropdown: null,
            activeDropdownTrigger: null,
            activeDropdownStyle: {},
            requirementSearch: '',
            candidateSearch: '',
            dailyLogSearch: '',
            reportRequirementSearch: '',
            reportRecruiterSearch: '',
            pipelineSearch: '',
            currentPage: 1,
            pageSize: 20,
            filters: {
                location: '',
                profile: '',
                minExp: null,
                maxCtc: null,
                noticePeriod: ''
            },
            requirementForm: {
                client_company: '',
                role_title: '',
                location: '',
                positions_count: 1,
                recruiter_id: ''
            },
            assignForm: {
                req_id: '',
                recruiter_id: ''
            },
            candidateAssignmentForm: {
                job_requirement_id: '',
                recruiter_id: ''
            },
            candidateForm: {
                name: '',
                email: '',
                phone: '',
                company_name: '',
                profile_name: '',
                location: '',
                qualification: '',
                total_experience: null,
                relevant_experience: null,
                in_hand_salary: null,
                current_ctc: null,
                expected_ctc: null,
                notice_period: '',
                job_requirement_id: ''
            },
            dailyLogForm: {
                date: new Date().toISOString().split('T')[0],
                profiles_sourced: 0,
                profiles_shared: 0,
                comments: ''
            },
            requirementStatusOptions: ['Open', 'Closed', 'On Hold'],
            pipelineStatusOptions: ['Shared', 'Shortlisted', 'Interviewed', 'Selected', 'Rejected', 'On Hold'],
            todayDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        }
    },
    mounted() {
        this.fetchData();
        this.fetchRecruiters();
        this.fetchDailyLogs();
        this.fetchReports();
        document.addEventListener('click', this.handleDocumentClick);
        document.addEventListener('scroll', this.handleViewportChange, true);
        window.addEventListener('resize', this.handleViewportChange);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleDocumentClick);
        document.removeEventListener('scroll', this.handleViewportChange, true);
        window.removeEventListener('resize', this.handleViewportChange);
    },
    computed: {
        filteredRequirements() {
            let list = [...this.requirements];
            if (this.showAssignedOnly) {
                const currentUser = store.user;
                if (!currentUser) return list;
                list = list.filter(r => r.recruiter_name === currentUser.full_name);
            }
            if (this.showUnassignedOnly) {
                list = list.filter(r => r.recruiter_name === 'Unassigned');
            }
            return list;
        },
        searchedRequirements() {
            const q = this.requirementSearch.toLowerCase().trim();
            if (!q) return this.filteredRequirements;
            return this.filteredRequirements.filter(r =>
                (r.recruiter_name || '').toLowerCase().includes(q) ||
                (r.client_company || '').toLowerCase().includes(q) ||
                (r.location || '').toLowerCase().includes(q) ||
                (r.role_title || '').toLowerCase().includes(q) ||
                (r.status || '').toLowerCase().includes(q)
            );
        },
        openRequirementCount() {
            return this.requirements.filter(r => r.status === 'Open').length;
        },
        unassignedRequirementCount() {
            return this.requirements.filter(r => r.status === 'Open' && r.recruiter_name === 'Unassigned').length;
        },
        totalOpenPositions() {
            return this.requirements
                .filter(r => r.status === 'Open')
                .reduce((sum, r) => sum + Number(r.positions_count || 0), 0);
        },
        openRequirements() {
            return this.requirements.filter(r => r.status === 'Open');
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
        recruiterSelectOptions() {
            return this.recruiters.map(rec => ({
                label: rec.full_name,
                value: rec.id
            }));
        },
        openRequirementSelectOptions() {
            return this.openRequirements.map(req => ({
                label: `${req.client_company} - ${req.role_title} (${req.location})`,
                value: req.id
            }));
        },
        candidateFormRequirementOptions() {
            return [
                { label: 'Keep in talent pool', value: '' },
                ...this.openRequirements.map(req => ({
                    label: `${req.role_title} - ${req.client_company}`,
                    value: req.id
                }))
            ];
        },
        selectedAssignmentRequirement() {
            return this.requirements.find(req => String(req.id) === String(this.assignForm.req_id)) || null;
        },
        selectedRecruiterName() {
            const recruiter = this.recruiters.find(rec => String(rec.id) === String(this.assignForm.recruiter_id));
            return recruiter ? recruiter.full_name : '';
        },
        candidateAssignmentRequirement() {
            return this.requirements.find(req => String(req.id) === String(this.candidateAssignmentForm.job_requirement_id)) || null;
        },
        candidateAssignmentRequirementLabel() {
            if (!this.candidateAssignmentRequirement) return '';
            const req = this.candidateAssignmentRequirement;
            return `${req.client_company} - ${req.role_title} (${req.location})`;
        },
        candidateAssignmentRecruiterName() {
            const recruiter = this.recruiters.find(rec => String(rec.id) === String(this.candidateAssignmentForm.recruiter_id));
            return recruiter ? recruiter.full_name : '';
        },
        canSubmitCandidateAssignment() {
            if (!this.candidateAssignmentForm.job_requirement_id) return false;
            if (store.hasRole(['Admin', 'Manager']) && !this.candidateAssignmentForm.recruiter_id) return false;
            return true;
        },
        filteredCandidates() {
            let list = this.candidates.filter(c => !c.job_requirement_id);

            // Global search
            const q = (this.candidateSearch || '').toLowerCase().trim();
            if (q) {
                list = list.filter(c => {
                    return (c.name || '').toLowerCase().includes(q)
                        || (c.email || '').toLowerCase().includes(q)
                        || (c.phone || '').toLowerCase().includes(q)
                        || (c.company_name || '').toLowerCase().includes(q)
                        || (c.profile_name || '').toLowerCase().includes(q)
                        || (c.location || '').toLowerCase().includes(q);
                });
            }

            // Filters
            if (this.filters.location) {
                const loc = this.filters.location.toLowerCase();
                list = list.filter(c => (c.location || '').toLowerCase().includes(loc));
            }
            if (this.filters.profile) {
                const pf = this.filters.profile.toLowerCase();
                list = list.filter(c => (c.profile_name || '').toLowerCase().includes(pf));
            }
            if (this.filters.minExp != null && this.filters.minExp !== '') {
                list = list.filter(c => c.total_experience != null && c.total_experience >= this.filters.minExp);
            }
            if (this.filters.maxCtc != null && this.filters.maxCtc !== '') {
                list = list.filter(c => c.current_ctc != null && c.current_ctc <= this.filters.maxCtc);
            }
            if (this.filters.noticePeriod) {
                const np = this.filters.noticePeriod.toLowerCase();
                list = list.filter(c => (c.notice_period || '').toLowerCase().includes(np));
            }

            return list;
        },
        filteredPipelineCandidates() {
            let list = this.candidates.filter(c => c.job_requirement_id);
            const q = (this.pipelineSearch || '').toLowerCase().trim();
            if (q) {
                list = list.filter(c =>
                    (c.name || '').toLowerCase().includes(q)
                    || (c.job_client_company || '').toLowerCase().includes(q)
                    || (c.job_role || '').toLowerCase().includes(q)
                    || (c.job_location || '').toLowerCase().includes(q)
                    || (c.assigned_recruiter_name || '').toLowerCase().includes(q)
                );
            }
            return list;
        },
        filteredDailyLogs() {
            const q = this.dailyLogSearch.toLowerCase().trim();
            if (!q) return this.dailyLogs;
            return this.dailyLogs.filter(log =>
                (log.date || '').toLowerCase().includes(q) ||
                (log.recruiter_name || '').toLowerCase().includes(q) ||
                String(log.profiles_sourced || '').includes(q) ||
                String(log.profiles_shared || '').includes(q) ||
                (log.comments || '').toLowerCase().includes(q)
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
            return this.reports.recruiter_summary.filter(item =>
                (item.recruiter_name || '').toLowerCase().includes(q) ||
                String(item.stats.activity_days || '').includes(q) ||
                String(item.stats.sourced || '').includes(q) ||
                String(item.stats.shared || '').includes(q) ||
                String(item.stats.shortlisted || '').includes(q) ||
                String(item.stats.interviewed || '').includes(q) ||
                String(item.stats.selected || '').includes(q) ||
                String(item.stats.rejected || '').includes(q)
            );
        },
        totalPages() {
            return Math.ceil(this.filteredCandidates.length / this.pageSize) || 1;
        },
        pageStart() {
            return (this.currentPage - 1) * this.pageSize;
        },
        pageEnd() {
            return Math.min(this.pageStart + this.pageSize, this.filteredCandidates.length);
        },
        paginatedCandidates() {
            return this.filteredCandidates.slice(this.pageStart, this.pageEnd);
        },
        visiblePages() {
            const pages = [];
            const start = Math.max(1, this.currentPage - 2);
            const end = Math.min(this.totalPages, this.currentPage + 2);
            for (let i = start; i <= end; i++) pages.push(i);
            return pages;
        },
        detailFields() {
            const c = this.selectedCandidate;
            if (!c) return [];
            return [
                { label: 'Email', value: c.email },
                { label: 'Phone', value: c.phone },
                { label: 'Company', value: c.company_name },
                { label: 'Profile / Role', value: c.profile_name },
                { label: 'Location', value: c.location },
                { label: 'Qualification', value: c.qualification },
                { label: 'Total Experience', value: c.total_experience != null ? c.total_experience + ' yrs' : null },
                { label: 'Relevant Experience', value: c.relevant_experience != null ? c.relevant_experience + ' yrs' : null },
                { label: 'In-hand Salary', value: c.in_hand_salary != null ? c.in_hand_salary + ' LPA' : null },
                { label: 'CTC Salary', value: c.current_ctc != null ? c.current_ctc + ' LPA' : null },
                { label: 'Expected Salary', value: c.expected_ctc != null ? c.expected_ctc + ' LPA' : null },
                { label: 'Notice Period', value: c.notice_period },
                { label: 'Client', value: c.job_client_company },
                { label: 'Job Requirement', value: c.job_role },
                { label: 'Requirement Location', value: c.job_location },
                { label: 'Assigned Recruiter', value: c.assigned_recruiter_name },
            ];
        }
    },
    watch: {
        candidateSearch() { this.currentPage = 1; },
        'filters.location'() { this.currentPage = 1; },
        'filters.profile'() { this.currentPage = 1; },
        'filters.minExp'() { this.currentPage = 1; },
        'filters.maxCtc'() { this.currentPage = 1; },
        'filters.noticePeriod'() { this.currentPage = 1; },
        pipelineSearch() { this.currentPage = 1; },
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
        async setCandidateStatus(cand, status) {
            this.closeDropdown();
            if (cand.status === status) return;
            await this.updateCandidateStatus(cand, status);
        },
        async fetchData() {
            try {
                const [reqRes, candRes] = await Promise.all([
                    axios.get('/api/recruitment/requirements'),
                    axios.get('/api/recruitment/candidates')
                ]);
                this.requirements = reqRes.data;
                this.candidates = candRes.data;
            } catch (err) { console.error("Error fetching data", err); }
        },
        async fetchDailyLogs() {
            try {
                const res = await axios.get('/api/recruitment/daily-logs');
                this.dailyLogs = res.data;
            } catch (err) { console.error("Error fetching daily logs", err); }
        },
        async fetchReports() {
            try {
                const res = await axios.get('/api/recruitment/reports');
                this.reports = res.data || { recruiter_summary: [], requirement_summary: [] };
            } catch (err) { console.error("Error fetching reports", err); }
        },
        handleFileUpload(event, type) {
            const file = event.target.files[0];
            if (type === 'jd') {
                this.requirementForm.jd_file = file;
            } else if (type === 'resume') {
                this.candidateForm.resume_file = file;
            }
        },
        async handleExcelUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('file', file);
            try {
                const res = await axios.post('/api/recruitment/candidates/upload-excel', formData);
                this.importSummary = res.data;
                this.fetchData();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to upload Excel file');
            }
            // Reset file input so same file can be re-uploaded
            event.target.value = '';
        },
        async createRequirement() {
            try {
                const formData = new FormData();
                formData.append('client_company', this.requirementForm.client_company);
                formData.append('role_title', this.requirementForm.role_title);
                formData.append('location', this.requirementForm.location);
                formData.append('positions_count', this.requirementForm.positions_count);
                if (this.requirementForm.recruiter_id) formData.append('recruiter_id', this.requirementForm.recruiter_id);
                if (this.requirementForm.jd_file) formData.append('jd_file', this.requirementForm.jd_file);

                await axios.post('/api/recruitment/requirements', formData);
                this.showRequirementModal = false;
                this.requirementForm = {
                    client_company: '',
                    role_title: '',
                    location: '',
                    positions_count: 1,
                    recruiter_id: ''
                };
                this.fetchData();
                this.fetchReports();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to create requirement');
            }
        },
        async deleteRequirement(id) {
            if (!confirm('Are you sure you want to delete this job requirement? All associated candidates will also be deleted.')) return;
            try {
                await axios.delete('/api/recruitment/requirements/' + id);
                this.fetchData();
                this.fetchReports();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to delete requirement');
            }
        },
        async addCandidate() {
            try {
                const formData = new FormData();
                const fields = ['name', 'email', 'phone', 'company_name', 'profile_name', 'location',
                    'qualification', 'total_experience', 'relevant_experience', 'in_hand_salary',
                    'current_ctc', 'expected_ctc', 'notice_period', 'job_requirement_id'];
                fields.forEach(f => {
                    if (this.candidateForm[f]) formData.append(f, this.candidateForm[f]);
                });
                if (this.candidateForm.resume_file) formData.append('resume_file', this.candidateForm.resume_file);

                await axios.post('/api/recruitment/candidates', formData);
                this.showCandidateModal = false;
                this.candidateForm = {
                    name: '', email: '', phone: '', company_name: '', profile_name: '',
                    location: '', qualification: '', total_experience: null, relevant_experience: null,
                    in_hand_salary: null, current_ctc: null, expected_ctc: null,
                    notice_period: '', job_requirement_id: ''
                };
                this.fetchData();
                this.fetchReports();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to add candidate');
            }
        },
        viewCandidate(cand) {
            this.selectedCandidate = cand;
            this.showDetailModal = true;
        },
        openCandidateAssignmentModal(cand) {
            this.selectedCandidateForAssignment = cand;
            this.candidateAssignmentForm.job_requirement_id = '';
            this.candidateAssignmentForm.recruiter_id = '';
            this.showCandidateAssignmentModal = true;
        },
        async assignCandidateToRequirement() {
            if (!this.selectedCandidateForAssignment || !this.candidateAssignmentForm.job_requirement_id) return;
            try {
                if (store.hasRole(['Admin', 'Manager']) && this.candidateAssignmentForm.recruiter_id) {
                    await axios.put('/api/recruitment/requirements/' + this.candidateAssignmentForm.job_requirement_id, {
                        recruiter_id: this.candidateAssignmentForm.recruiter_id
                    });
                }
                await axios.put('/api/recruitment/candidates/' + this.selectedCandidateForAssignment.id, {
                    job_requirement_id: this.candidateAssignmentForm.job_requirement_id,
                    status: 'Shared'
                });
                this.showCandidateAssignmentModal = false;
                this.selectedCandidateForAssignment = null;
                this.candidateAssignmentForm.job_requirement_id = '';
                this.candidateAssignmentForm.recruiter_id = '';
                this.currentTab = 'pipeline';
                this.fetchData();
                this.fetchReports();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to assign candidate to requirement');
            }
        },
        async updateCandidateStatus(cand, status) {
            try {
                await axios.put('/api/recruitment/candidates/' + cand.id, { status });
                this.fetchData();
                this.fetchReports();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to update status');
            }
        },
        async toggleTalentPoolStatus(cand) {
            const nextStatus = cand.status === 'On Hold' ? 'Available' : 'On Hold';
            try {
                await axios.put('/api/recruitment/candidates/' + cand.id, { status: nextStatus });
                this.fetchData();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to update candidate status');
            }
        },
        async moveCandidateBackToPool(cand) {
            try {
                await axios.put('/api/recruitment/candidates/' + cand.id, {
                    job_requirement_id: null,
                    status: 'Available'
                });
                this.fetchData();
                this.fetchReports();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to move candidate back to talent pool');
            }
        },
        clearFilters() {
            this.filters = { location: '', profile: '', minExp: null, maxCtc: null, noticePeriod: '' };
            this.candidateSearch = '';
        },
        async createDailyLog() {
            try {
                await axios.post('/api/recruitment/daily-logs', this.dailyLogForm);
                alert('Daily log submitted');
                this.fetchDailyLogs();
                this.dailyLogForm.profiles_sourced = 0;
                this.dailyLogForm.profiles_shared = 0;
                this.dailyLogForm.comments = '';
            } catch (err) { alert('Failed to submit daily log'); }
        },
        getStatusClass(status) {
            return {
                'badge': true,
                'bg-success': status === 'Open' || status === 'Selected' || status === 'Available',
                'bg-warning text-dark': status === 'Pending' || status === 'Screened' || status === 'Shortlisted',
                'bg-primary': status === 'Shared',
                'bg-info text-dark': status === 'Interviewed',
                'bg-danger': status === 'Rejected',
                'bg-secondary': status === 'Closed' || status === 'On Hold'
            }
        },
        async fetchRecruiters() {
            if (store.hasRole(['Admin', 'Manager'])) {
                try {
                    const res = await axios.get('/api/admin/users');
                    this.recruiters = res.data.filter(u => u.role === 'Recruitment Executive');
                } catch (e) { console.error('Error fetching recruiters', e); }
            }
        },
        openAssignModal(req) {
            this.assignForm.req_id = req.id;
            const matched = this.recruiters.find(r => r.full_name === req.recruiter_name);
            this.assignForm.recruiter_id = matched ? matched.id : '';
            this.showAssignModal = true;
        },
        async assignRecruiter() {
            try {
                await axios.put('/api/recruitment/requirements/' + this.assignForm.req_id, {
                    recruiter_id: this.assignForm.recruiter_id
                });
                this.showAssignModal = false;
                this.fetchData();
                this.fetchReports();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to assign recruiter');
            }
        },
        async updateRequirementStatus(req, status) {
            try {
                await axios.put('/api/recruitment/requirements/' + req.id, { status });
                this.fetchData();
                this.fetchReports();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to update requirement status');
            }
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
        }
    }
};
