import CompactSelect from './CompactSelect.js';
import AdaptiveTable from './AdaptiveTable.js';
import { exportToExcel } from './ExcelExport.js';
import { generatePayslipPDF } from '../utils/pdfGenerator.js';

export default {
    name: 'SalaryOverview',
    components: {
        CompactSelect,
        AdaptiveTable
    },
    props: {
        title: {
            type: String,
            default: 'My Salary'
        }
    },
    template: `
    <div class="crm-card mb-4">
        <div class="crm-card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
                <h5 class="crm-section-title">{{ title }}</h5>
                <small class="text-muted">View your month-wise salary breakdown, incentives, deductions, and net pay.</small>
            </div>
            <div class="d-flex align-items-center gap-2">
                <label class="small text-muted mb-0">Year</label>
                <compact-select v-model="selectedYear" :options="yearOptions" width="124px"></compact-select>
                <button class="crm-export-btn" :disabled="filteredSalaries.length === 0" @click="exportSalaryHistory"><i class="bi bi-file-earmark-spreadsheet"></i>Export Excel</button>
            </div>
        </div>
        <div class="crm-card-body">
            <div v-if="loading" class="text-muted">Loading salary records...</div>
            <div v-else-if="salaries.length === 0" class="alert alert-light border mb-0">
                No salary records are available for your account yet.
            </div>
            <div v-else>
                <div class="row g-3 mb-4">
                    <div class="col-md-3 col-sm-6">
                        <div class="border rounded p-3 h-100 bg-light">
                            <small class="text-muted d-block mb-1">Latest Net Pay</small>
                            <div class="fw-bold fs-5">{{ formatCurrency(latestSalary.net_pay) }}</div>
                            <small class="text-muted">{{ latestSalary.month }} {{ latestSalary.year }}</small>
                        </div>
                    </div>
                    <div class="col-md-3 col-sm-6">
                        <div class="border rounded p-3 h-100 bg-light">
                            <small class="text-muted d-block mb-1">Gross Earnings</small>
                            <div class="fw-bold fs-5">{{ formatCurrency(latestSalary.gross_earnings || latestSalary.base) }}</div>
                            <small class="text-muted">Total monthly earnings</small>
                        </div>
                    </div>
                    <div class="col-md-3 col-sm-6">
                        <div class="border rounded p-3 h-100 bg-light">
                            <small class="text-muted d-block mb-1">Latest Incentives</small>
                            <div class="fw-bold fs-5 text-success">{{ formatCurrency(latestSalary.incentives) }}</div>
                            <small class="text-muted">Performance-based earnings</small>
                        </div>
                    </div>
                    <div class="col-md-3 col-sm-6">
                        <div class="border rounded p-3 h-100 bg-light">
                            <small class="text-muted d-block mb-1">Latest Deductions</small>
                            <div class="fw-bold fs-5 text-danger">{{ formatCurrency(latestSalary.gross_deductions || latestSalary.deductions) }}</div>
                            <small class="text-muted">{{ paidCount }} paid / {{ salaries.length }} total records</small>
                        </div>
                    </div>
                </div>

                <adaptive-table title="Salary History" :row-count="filteredSalaries.length">
                    <table class="table table-hover align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Month</th>
                                <th>CTC</th>
                                <th>Gross Pay</th>
                                <th>Incentives</th>
                                <th>Deductions</th>
                                <th>Net Pay</th>
                                <th>Status</th>
                                <th>Payslip</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="salary in filteredSalaries" :key="salary.id || salary.month + salary.year">
                                <td>
                                    <div class="fw-semibold">{{ salary.month }} {{ salary.year }}</div>
                                </td>
                                <td>{{ formatCurrency(salary.total_salary || salary.base) }}</td>
                                <td>{{ formatCurrency(salary.gross_earnings || salary.base) }}</td>
                                <td class="text-success">{{ formatCurrency(salary.incentives) }}</td>
                                <td class="text-danger">{{ formatCurrency(salary.gross_deductions || salary.deductions) }}</td>
                                <td class="fw-semibold">{{ formatCurrency(salary.net_pay) }}</td>
                                <td>
                                    <span class="badge" :class="salary.status === 'Paid' ? 'bg-success' : 'bg-warning text-dark'">
                                        {{ salary.status || 'Pending' }}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                                        @click="downloadSalarySlip(salary)"
                                        :disabled="slipLoading === salary.id"
                                        :title="salary.status !== 'Paid' ? 'Download payslip with pending watermark' : 'Download payslip'"
                                        style="white-space:nowrap;"
                                    >
                                        <i class="bi" :class="slipLoading === salary.id ? 'bi-hourglass-split' : 'bi-download'"></i>
                                        <span>{{ slipLoading === salary.id ? 'Loading...' : 'Download' }}</span>
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="filteredSalaries.length === 0">
                                <td colspan="8" class="text-center text-muted py-4">No salary records found for the selected year.</td>
                            </tr>
                        </tbody>
                    </table>
                </adaptive-table>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            loading: false,
            salaries: [],
            selectedYear: 'All',
            slipLoading: null,
            currencyFormatter: new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 2
            })
        };
    },
    computed: {
        latestSalary() {
            return this.salaries[0] || {
                month: '-',
                year: '-',
                base: 0,
                incentives: 0,
                deductions: 0,
                net_pay: 0,
                gross_earnings: 0,
                gross_deductions: 0,
                total_salary: 0,
                status: 'Pending'
            };
        },
        availableYears() {
            return [...new Set(this.salaries.map(salary => salary.year).filter(Boolean))];
        },
        yearOptions() {
            return [
                { label: 'All', value: 'All' },
                ...this.availableYears.map(year => ({ label: String(year), value: String(year) }))
            ];
        },
        filteredSalaries() {
            if (this.selectedYear === 'All') {
                return this.salaries;
            }
            return this.salaries.filter(salary => String(salary.year) === this.selectedYear);
        },
        paidCount() {
            return this.salaries.filter(salary => salary.status === 'Paid').length;
        }
    },
    mounted() {
        this.fetchSalaries();
    },
    methods: {
        async fetchSalaries() {
            this.loading = true;
            try {
                const response = await axios.get('/api/employee/salary?t=' + new Date().getTime());
                this.salaries = Array.isArray(response.data) ? response.data : [];
            } catch (error) {
                console.error('Error fetching salary data', error);
                this.salaries = [];
            } finally {
                this.loading = false;
            }
        },
        formatCurrency(value) {
            return this.currencyFormatter.format(Number(value || 0));
        },
        formatINR(value) {
            return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0));
        },
        async downloadSalarySlip(salary) {
            this.slipLoading = salary.id;
            try {
                const response = await axios.get(`/api/employee/salary-slip/${salary.id}?t=` + new Date().getTime());
                generatePayslipPDF(response.data);
            } catch (error) {
                console.error('Error fetching salary slip', error);
                alert(error.response?.data?.message || 'Failed to download salary slip');
            } finally {
                this.slipLoading = null;
            }
        },
        exportSalaryHistory() {
            exportToExcel({
                data: this.filteredSalaries,
                columns: [
                    { header: 'Month', accessor: r => `${r.month} ${r.year}` },
                    { header: 'Total Salary', accessor: r => r.total_salary || r.base, format: 'currency' },
                    { header: 'Gross Earnings', accessor: r => r.gross_earnings || r.base, format: 'currency' },
                    { header: 'Incentives', field: 'incentives', format: 'currency' },
                    { header: 'Deductions', accessor: r => r.gross_deductions || r.deductions, format: 'currency' },
                    { header: 'Net Pay', field: 'net_pay', format: 'currency' },
                    { header: 'Status', accessor: r => r.status || 'Pending' }
                ],
                fileName: 'salary-history'
            });
        }
    }
};
