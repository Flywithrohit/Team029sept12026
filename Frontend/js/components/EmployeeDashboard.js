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
                <h2 class="crm-page-title">{{ getDashboardTitle() }}</h2>
                <p class="crm-page-subtitle">Welcome back, <strong>{{ store.user?.full_name || store.user?.username }}</strong></p>
            </div>
            <div class="text-end d-none d-md-block">
                <span class="crm-date-pill">
                    <i class="bi bi-calendar3 text-primary"></i>{{ todayDate }}
                </span>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="crm-hero-tile crm-hero-tile-blue h-100">
                    <div class="card-body">
                        <div class="small text-white-50 mb-3">Attendance Today</div>
                        <h3 class="card-title">{{ todayAttendance ? todayAttendance.status : 'Not Clocked In' }}</h3>
                        <p class="card-text" v-if="todayAttendance">
                            In: {{ formatTime(todayAttendance.check_in) }}<br>
                            <span v-if="todayAttendance.check_out">Out: {{ formatTime(todayAttendance.check_out) }}</span>
                        </p>
                        <button v-if="!todayAttendance" @click="clockIn" class="btn btn-light crm-action-btn mt-2" :disabled="loading">Clock In</button>
                        <button v-if="todayAttendance && !todayAttendance.check_out" @click="clockOut" class="btn btn-light crm-action-btn mt-2" :disabled="loading">Clock Out</button>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="crm-hero-tile crm-hero-tile-green h-100">
                    <div class="card-body">
                        <div class="small text-white-50 mb-3">Leave Balance</div>
                        <h3 class="card-title">{{ leaveBalance }} Days Left</h3>
                        <p class="card-text">Used: {{ 20 - leaveBalance }} / 20</p>
                        <button @click="showLeaveModal = true" class="btn btn-light crm-action-btn mt-2">Apply Leave</button>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="crm-hero-tile crm-hero-tile-cyan h-100">
                    <div class="card-body">
                        <div class="small text-white-50 mb-3">Last Salary</div>
                        <h3 class="card-title" v-if="salary">{{ formatCurrency(salary.net_pay) }}</h3>
                        <p class="card-text" v-if="salary">{{ salary.month }} {{ salary.year }}</p>
                        <p class="card-text mb-1" v-if="salary">Base: {{ formatCurrency(salary.base) }}</p>
                        <p class="card-text mb-0" v-if="salary">Incentives: {{ formatCurrency(salary.incentives) }} | Deductions: {{ formatCurrency(salary.deductions) }}</p>
                        <p class="card-text" v-else>No salary record found.</p>
                    </div>
                </div>
            </div>
        </div>

        <salary-overview title="Personal Salary Information"></salary-overview>

        <!-- Attendance History -->
        <div class="crm-card mb-4">
            <div class="crm-card-header">
                <h5 class="crm-section-title">Recent Attendance</h5>
            </div>
            <div class="crm-card-body">
                <div class="crm-search mb-3">
                    <i class="bi bi-search crm-search-icon"></i>
                    <input type="text" class="form-control crm-search-input" v-model="attendanceSearch" placeholder="Search by date, time, hours, or status">
                </div>
                <div class="table-responsive crm-table-wrap">
                    <table class="table table-hover crm-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>In</th>
                                <th>Out</th>
                                <th>Hours</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="att in filteredAttendanceHistory" :key="att.id">
                                <td>{{ att.date }}</td>
                                <td>{{ formatTime(att.check_in) }}</td>
                                <td>{{ formatTime(att.check_out) }}</td>
                                <td>{{ att.total_hours || '-' }}</td>
                                <td><span class="badge bg-success">{{ att.status }}</span></td>
                            </tr>
                            <tr v-if="filteredAttendanceHistory.length === 0">
                                <td colspan="5" class="text-center">No history found.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Leave History -->
        <div class="crm-card mb-4">
            <div class="crm-card-header">
                <h5 class="crm-section-title">Leave History</h5>
            </div>
            <div class="crm-card-body">
                <div class="crm-search mb-3">
                    <i class="bi bi-search crm-search-icon"></i>
                    <input type="text" class="form-control crm-search-input" v-model="leaveSearch" placeholder="Search by type, reason, date, or status">
                </div>
                <div class="table-responsive crm-table-wrap">
                    <table class="table table-hover crm-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Applied On</th>
                                <th>From</th>
                                <th>To</th>
                                <th>Session</th>
                                <th>Days</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Approved By</th>
                                <th>Actioned On</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="leave in filteredLeaveHistory" :key="leave.id">
                                <td>{{ leave.type }}</td>
                                <td>{{ leave.applied_at || '-' }}</td>
                                <td>{{ leave.start_date }}</td>
                                <td>{{ leave.end_date }}</td>
                                <td>
                                    <span class="badge" :class="{
                                        'bg-primary': leave.day_type === 'Full Day',
                                        'bg-info text-dark': leave.day_type === 'First Half',
                                        'bg-secondary': leave.day_type === 'Second Half'
                                    }">
                                        {{ leave.day_type || 'Full Day' }}
                                    </span>
                                </td>
                                <td>{{ leave.total_days }}</td>
                                <td>{{ leave.reason }}</td>
                                <td>
                                    <span class="badge" 
                                          :class="{
                                              'bg-warning text-dark': leave.status === 'Pending',
                                              'bg-success': leave.status === 'Approved',
                                              'bg-danger': leave.status === 'Rejected'
                                          }">
                                        {{ leave.status }}
                                    </span>
                                </td>
                                <td>{{ leave.approved_by_name || '-' }}</td>
                                <td>{{ leave.approved_at || '-' }}</td>
                            </tr>
                            <tr v-if="filteredLeaveHistory.length === 0">
                                <td colspan="10" class="text-center">No leave requests found.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Leave Modal -->
        <div v-if="showLeaveModal" class="modal fade show crm-modal" style="display: block; background: rgba(14,23,38,0.45);" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Apply for Leave</h5>
                        <button type="button" class="btn-close" @click="showLeaveModal = false"></button>
                    </div>
                    <div class="modal-body">
                         <div v-if="leaveMsg" :class="{'alert': true, 'alert-success': leaveSuccess, 'alert-danger': !leaveSuccess}">{{ leaveMsg }}</div>
                        <form @submit.prevent="applyLeave">
                            <div class="mb-3">
                                <label class="form-label fw-semibold">Leave Type</label>
                                <compact-select v-model="leaveForm.type" :options="leaveTypeOptions" width="100%"></compact-select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-semibold">Day Type</label>
                                <div class="d-flex gap-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="dayType" id="dayTypeFull" value="Full Day" v-model="leaveForm.day_type">
                                        <label class="form-check-label" for="dayTypeFull">Full Day</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="dayType" id="dayTypeFirst" value="First Half" v-model="leaveForm.day_type">
                                        <label class="form-check-label" for="dayTypeFirst">First Half <small class="text-muted">(Forenoon)</small></label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="dayType" id="dayTypeSecond" value="Second Half" v-model="leaveForm.day_type">
                                        <label class="form-check-label" for="dayTypeSecond">Second Half <small class="text-muted">(Afternoon)</small></label>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label fw-semibold">From</label>
                                    <calendar-field v-model="leaveForm.start_date" type="date" :min="todayIso" required @change="calculateDays"></calendar-field>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label fw-semibold">To</label>
                                    <calendar-field v-model="leaveForm.end_date" type="date" :min="leaveForm.start_date || todayIso" required @change="calculateDays"></calendar-field>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-semibold">Total Days</label>
                                <input type="text" :value="leaveForm.total_days" class="form-control bg-light" readonly>
                                <small class="text-muted" v-if="leaveForm.day_type !== 'Full Day'">Half-day applied - {{ leaveForm.day_type === 'First Half' ? 'Forenoon' : 'Afternoon' }} session</small>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-semibold">Reason</label>
                                <textarea v-model="leaveForm.reason" class="form-control" rows="2" required placeholder="Please provide the reason for your leave..."></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary" :disabled="loading">Submit</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>

    </div>
    `,
    data() {
        return {
            todayAttendance: null,
            attendanceHistory: [],
            leaveHistory: [],
            salary: null,
            attendanceSearch: '',
            leaveSearch: '',
            loading: false,
            pollingInterval: null,
            showLeaveModal: false,
            leaveForm: {
                type: 'Casual Leave',
                day_type: 'Full Day',
                start_date: '',
                end_date: '',
                total_days: 0,
                reason: ''
            },
            leaveMsg: '',
            leaveSuccess: false,
            store,
            todayDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            todayIso: new Date().toISOString().split('T')[0]
        }
    },
    watch: {
        'leaveForm.day_type'() {
            this.calculateDays();
        }
    },
    mounted() {
        this.fetchData();
        this.pollingInterval = setInterval(() => {
            this.fetchData();
        }, 5000);
    },
    beforeUnmount() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
    },
    methods: {
        async fetchData() {
            try {
                const ts = new Date().getTime(); 


                const attRes = await axios.get('/api/employee/attendance?t=' + ts);
                this.attendanceHistory = attRes.data;

                const d = new Date();
                const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                this.todayAttendance = this.attendanceHistory.find(a => a.date === today);


                const salRes = await axios.get('/api/employee/salary?t=' + ts);
                if (salRes.data.length > 0) {
                    this.salary = salRes.data[0];
                }

                const leaveRes = await axios.get('/api/employee/leaves?t=' + ts);
                this.leaveHistory = leaveRes.data;

            } catch (err) {
                console.error("Error fetching dashboard data", err);
            }
        },
        async clockIn() {
            this.loading = true;
            try {
                await axios.post('/api/employee/attendance/clock-in');
                await this.fetchData();
            } catch (err) {
                alert(err.response?.data?.message || 'Clock in failed');
            } finally {
                this.loading = false;
            }
        },
        async clockOut() {
            this.loading = true;
            try {
                await axios.post('/api/employee/attendance/clock-out');
                await this.fetchData();
            } catch (err) {
                alert(err.response?.data?.message || 'Clock out failed');
            } finally {
                this.loading = false;
            }
        },
        calculateDays() {
            if (this.leaveForm.start_date && this.leaveForm.end_date) {
                const start = new Date(this.leaveForm.start_date);
                const end = new Date(this.leaveForm.end_date);
                if (end >= start) {
                    const diffTime = end - start;
                    const dayCount = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    if (this.leaveForm.day_type !== 'Full Day') {
                        this.leaveForm.total_days = dayCount === 1 ? 0.5 : dayCount - 0.5;
                    } else {
                        this.leaveForm.total_days = dayCount;
                    }
                } else {
                    this.leaveForm.total_days = 0;
                }
            }
        },
        async applyLeave() {
            this.loading = true;
            this.leaveMsg = '';
            try {
                await axios.post('/api/employee/leaves', {
                    leave_type: this.leaveForm.type,
                    day_type: this.leaveForm.day_type,
                    start_date: this.leaveForm.start_date,
                    end_date: this.leaveForm.end_date,
                    reason: this.leaveForm.reason
                });
                this.leaveSuccess = true;
                this.leaveMsg = 'Leave applied successfully!';
                this.leaveForm = { type: 'Casual Leave', day_type: 'Full Day', start_date: '', end_date: '', total_days: 0, reason: '' };
                this.fetchData(); 
                setTimeout(() => {
                    this.showLeaveModal = false;
                    this.leaveMsg = '';
                }, 1500);
            } catch (err) {
                this.leaveSuccess = false;
                this.leaveMsg = err.response?.data?.message || 'Failed to apply leave';
            } finally {
                this.loading = false;
            }
        },
        formatTime(dateStr) {
            if (!dateStr) return '-';
            if (typeof dateStr === 'string' && dateStr.includes(':') && !dateStr.includes('T')) {
                return dateStr;
            }
            const date = new Date(dateStr);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        },
        formatCurrency(amount) {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 2
            }).format(Number(amount || 0));
        },
        getDashboardTitle() {
            if (!store.user) return 'Employee Control Center';
            const role = store.user.role;
            if (role === 'Admin') return 'Employee Control Center';
            if (role === 'Manager') return 'Employee Control Center';
            if (role === 'Recruitment Executive') return 'Employee Control Center';
            if (role === 'Business Development Team') return 'Employee Control Center';
            return 'Employee Control Center';
        }
    },
    computed: {
        filteredAttendanceHistory() {
            const q = this.attendanceSearch.toLowerCase().trim();
            if (!q) return this.attendanceHistory;
            return this.attendanceHistory.filter(att =>
                (att.date || '').toLowerCase().includes(q) ||
                String(att.check_in || '').toLowerCase().includes(q) ||
                String(att.check_out || '').toLowerCase().includes(q) ||
                String(att.total_hours || '').toLowerCase().includes(q) ||
                (att.status || '').toLowerCase().includes(q)
            );
        },
        filteredLeaveHistory() {
            const q = this.leaveSearch.toLowerCase().trim();
            if (!q) return this.leaveHistory;
            return this.leaveHistory.filter(leave =>
                (leave.type || '').toLowerCase().includes(q) ||
                (leave.reason || '').toLowerCase().includes(q) ||
                (leave.applied_at || '').toLowerCase().includes(q) ||
                (leave.approved_by_name || '').toLowerCase().includes(q) ||
                (leave.approved_at || '').toLowerCase().includes(q) ||
                (leave.start_date || '').toLowerCase().includes(q) ||
                (leave.end_date || '').toLowerCase().includes(q) ||
                (leave.status || '').toLowerCase().includes(q)
            );
        },
        leaveBalance() {
            const totalAllowance = 20;
            let usedLeaves = 0;
            this.leaveHistory.forEach(leave => {
                if (leave.status === 'Approved') {
                    usedLeaves += parseInt(leave.total_days, 10);
                }
            });
            return totalAllowance - usedLeaves;
        },
        leaveTypeOptions() {
            return [
                'Sick Leave',
                'Casual Leave',
                'Earned / Privilege Leave',
                'Compensatory Off',
                'Maternity Leave',
                'Paternity Leave',
                'Emergency Leave',
                'Bereavement Leave',
                'Loss of Pay (LOP)'
            ];
        }
    }
};

