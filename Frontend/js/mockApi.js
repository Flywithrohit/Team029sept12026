export const MOCK_MODE = true;

window.MOCK_MODE = MOCK_MODE;

const MOCK_DB_KEY = 'crm-mock-db-v1';
const CURRENT_USER_KEY = 'crm-mock-current-user-id';

function svgToDataUrl(svg) {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function getAvatarDataUrl(name = 'User') {
    const safeName = String(name || 'User').trim() || 'User';
    const initials = safeName
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join('') || 'U';

    return svgToDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#1f5fff"/>
                    <stop offset="100%" stop-color="#6f2cff"/>
                </linearGradient>
            </defs>
            <rect width="160" height="160" rx="32" fill="url(#bg)"/>
            <circle cx="80" cy="58" r="28" fill="rgba(255,255,255,0.2)"/>
            <path d="M34 134c7-26 28-40 46-40s39 14 46 40" fill="rgba(255,255,255,0.18)"/>
            <text x="80" y="92" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="700" fill="#ffffff">${initials}</text>
        </svg>
    `);
}

export function getLogoDataUrl() {
    return svgToDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" width="420" height="120" viewBox="0 0 420 120">
            <defs>
                <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#16365c"/>
                    <stop offset="100%" stop-color="#2b6cb0"/>
                </linearGradient>
            </defs>
            <rect width="420" height="120" rx="28" fill="url(#logoBg)"/>
            <circle cx="62" cy="60" r="28" fill="#f6c453"/>
            <path d="M52 44h20v32H52z" fill="#16365c"/>
            <path d="M44 76h36" stroke="#16365c" stroke-width="8" stroke-linecap="round"/>
            <text x="108" y="54" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700" fill="#ffffff">EduITalent</text>
            <text x="108" y="82" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="rgba(255,255,255,0.82)">CRM Demo Workspace</text>
        </svg>
    `);
}

export function getTextDocumentUrl(title = 'Document', body = 'Demo document') {
    return `data:text/plain;charset=UTF-8,${encodeURIComponent(`${title}\n\n${body}`)}`;
}

window.MockAssets = {
    getAvatarDataUrl,
    getLogoDataUrl,
    getTextDocumentUrl
};

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

function getTodayIso() {
    return new Date().toISOString().split('T')[0];
}

function getNowReadable() {
    return new Date().toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getMonthLabel(date = new Date()) {
    return date.toLocaleString('en-US', { month: 'long' });
}

function sanitizeUser(user) {
    if (!user) return null;
    const clone = deepClone(user);
    delete clone.password;
    return clone;
}

function setCurrentUser(user) {
    if (!user) {
        localStorage.removeItem(CURRENT_USER_KEY);
        return;
    }
    localStorage.setItem(CURRENT_USER_KEY, String(user.id));
    localStorage.setItem('user', JSON.stringify(sanitizeUser(user)));
}

function syncCurrentUser(db, user) {
    if (!user) return;
    const index = db.users.findIndex(item => Number(item.id) === Number(user.id));
    if (index !== -1) {
        db.users[index] = { ...db.users[index], ...user };
        setCurrentUser(db.users[index]);
    }
}

function parseRequestData(data) {
    if (!data) return {};
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
        const parsed = {};
        for (const [key, value] of data.entries()) {
            parsed[key] = value;
        }
        return parsed;
    }
    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch (error) {
            return {};
        }
    }
    return data;
}

function getPathFromUrl(rawUrl = '') {
    try {
        return new URL(rawUrl, window.location.href).pathname;
    } catch (error) {
        return String(rawUrl).split('?')[0];
    }
}

function createMockError(status, message) {
    const error = new Error(message);
    error.mockStatus = status;
    error.mockMessage = message;
    return error;
}

async function fileToDataUrl(file) {
    if (!file || typeof FileReader === 'undefined') return '';
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('Unable to read file'));
        reader.readAsDataURL(file);
    });
}

function buildSeedData() {
    const users = [
        {
            id: 1,
            username: 'admin',
            full_name: 'Aarav Mehta',
            email: 'admin@eduitalent.demo',
            password: 'Admin@123',
            role: 'Admin',
            is_verified: true,
            verification_status: 'Approved',
            department: 'Operations',
            assigned_team: 'Leadership',
            assigned_manager_id: null,
            assigned_manager_name: 'None Assigned',
            employee_status: 'Active',
            phone_number: '+91 98765 43210',
            alternate_phone: '+91 91234 56789',
            address: 'Sector 16, Noida',
            notes: 'Demo administrator account.',
            join_date: '2024-01-08',
            last_login: '2026-03-18 09:10',
            created_at: '2024-01-08',
            profile_picture: getAvatarDataUrl('Aarav Mehta')
        },
        {
            id: 2,
            username: 'manager',
            full_name: 'Priya Sharma',
            email: 'manager@eduitalent.demo',
            password: 'Manager@123',
            role: 'Manager',
            is_verified: true,
            verification_status: 'Approved',
            department: 'People Operations',
            assigned_team: 'Management',
            assigned_manager_id: 1,
            assigned_manager_name: 'Aarav Mehta',
            employee_status: 'Active',
            phone_number: '+91 99887 76655',
            alternate_phone: '',
            address: 'Indirapuram, Ghaziabad',
            notes: 'Oversees employee and recruitment operations.',
            join_date: '2024-02-12',
            last_login: '2026-03-18 09:05',
            created_at: '2024-02-12',
            profile_picture: getAvatarDataUrl('Priya Sharma')
        },
        {
            id: 3,
            username: 'employee',
            full_name: 'Rahul Verma',
            email: 'employee@eduitalent.demo',
            password: 'Employee@123',
            role: 'Employee',
            is_verified: true,
            verification_status: 'Approved',
            department: 'Support',
            assigned_team: 'Employee Experience',
            assigned_manager_id: 2,
            assigned_manager_name: 'Priya Sharma',
            employee_status: 'Active',
            phone_number: '+91 90000 11111',
            alternate_phone: '',
            address: 'Greater Noida West',
            notes: 'Employee demo profile.',
            join_date: '2024-06-03',
            last_login: '2026-03-18 08:58',
            created_at: '2024-06-03',
            profile_picture: getAvatarDataUrl('Rahul Verma')
        },
        {
            id: 4,
            username: 'recruiter',
            full_name: 'Neha Kapoor',
            email: 'recruiter@eduitalent.demo',
            password: 'Recruiter@123',
            role: 'Recruitment Executive',
            is_verified: true,
            verification_status: 'Approved',
            department: 'Talent Acquisition',
            assigned_team: 'Technology Hiring',
            assigned_manager_id: 2,
            assigned_manager_name: 'Priya Sharma',
            employee_status: 'Active',
            phone_number: '+91 95555 22222',
            alternate_phone: '',
            address: 'South Delhi',
            notes: 'Handles active technology mandates.',
            join_date: '2024-03-19',
            last_login: '2026-03-18 08:51',
            created_at: '2024-03-19',
            profile_picture: getAvatarDataUrl('Neha Kapoor')
        },
        {
            id: 5,
            username: 'sales',
            full_name: 'Karan Malhotra',
            email: 'sales@eduitalent.demo',
            password: 'Sales@123',
            role: 'Business Development Team',
            is_verified: true,
            verification_status: 'Approved',
            department: 'Business Development',
            assigned_team: 'Enterprise Growth',
            assigned_manager_id: 2,
            assigned_manager_name: 'Priya Sharma',
            employee_status: 'Active',
            phone_number: '+91 96666 33333',
            alternate_phone: '',
            address: 'New Delhi',
            notes: 'Owns outbound lead generation.',
            join_date: '2024-04-22',
            last_login: '2026-03-18 08:43',
            created_at: '2024-04-22',
            profile_picture: getAvatarDataUrl('Karan Malhotra')
        }
    ];

    const attendance = [
        { id: 1, user_id: 1, date: '2026-03-18', check_in: '09:05', check_out: '18:10', total_hours: '9h 05m', status: 'Present' },
        { id: 2, user_id: 1, date: '2026-03-17', check_in: '09:15', check_out: '18:02', total_hours: '8h 47m', status: 'Present' },
        { id: 3, user_id: 1, date: '2026-03-16', check_in: '09:08', check_out: '17:56', total_hours: '8h 48m', status: 'Present' },
        { id: 4, user_id: 2, date: '2026-03-18', check_in: '09:10', check_out: '18:00', total_hours: '8h 50m', status: 'Present' },
        { id: 5, user_id: 2, date: '2026-03-17', check_in: '09:18', check_out: '18:08', total_hours: '8h 50m', status: 'Present' },
        { id: 6, user_id: 3, date: '2026-03-18', check_in: '09:22', check_out: null, total_hours: null, status: 'Present' },
        { id: 7, user_id: 3, date: '2026-03-17', check_in: '09:31', check_out: '18:04', total_hours: '8h 33m', status: 'Present' },
        { id: 8, user_id: 3, date: '2026-03-16', check_in: '09:28', check_out: '17:55', total_hours: '8h 27m', status: 'Present' },
        { id: 9, user_id: 4, date: '2026-03-18', check_in: '09:12', check_out: '17:58', total_hours: '8h 46m', status: 'Present' },
        { id: 10, user_id: 5, date: '2026-03-18', check_in: '09:00', check_out: '18:20', total_hours: '9h 20m', status: 'Present' }
    ];

    const salaries = [
        { id: 1, user_id: 1, month: 'March', year: 2026, base_salary: 95000, incentives: 12000, deductions: 2500, net_pay: 104500, payment_status: 'Paid', status: 'Paid' },
        { id: 2, user_id: 1, month: 'February', year: 2026, base_salary: 95000, incentives: 9000, deductions: 2200, net_pay: 101800, payment_status: 'Paid', status: 'Paid' },
        { id: 3, user_id: 2, month: 'March', year: 2026, base_salary: 82000, incentives: 7000, deductions: 1800, net_pay: 87200, payment_status: 'Paid', status: 'Paid' },
        { id: 4, user_id: 2, month: 'February', year: 2026, base_salary: 82000, incentives: 5500, deductions: 1600, net_pay: 85900, payment_status: 'Paid', status: 'Paid' },
        { id: 5, user_id: 3, month: 'March', year: 2026, base_salary: 42000, incentives: 3000, deductions: 1200, net_pay: 43800, payment_status: 'Pending', status: 'Pending' },
        { id: 6, user_id: 3, month: 'February', year: 2026, base_salary: 42000, incentives: 2500, deductions: 1000, net_pay: 43500, payment_status: 'Paid', status: 'Paid' },
        { id: 7, user_id: 4, month: 'March', year: 2026, base_salary: 52000, incentives: 8500, deductions: 1400, net_pay: 59100, payment_status: 'Pending', status: 'Pending' },
        { id: 8, user_id: 5, month: 'March', year: 2026, base_salary: 56000, incentives: 10000, deductions: 2200, net_pay: 63800, payment_status: 'Paid', status: 'Paid' }
    ];

    const leaves = [
        {
            id: 1,
            user_id: 3,
            employee_name: 'Rahul Verma',
            type: 'Casual Leave',
            day_type: 'Full Day',
            start_date: '2026-03-25',
            end_date: '2026-03-25',
            total_days: 1,
            reason: 'Family function',
            status: 'Pending',
            applied_at: '2026-03-18 10:10',
            approved_by_name: '',
            approved_at: ''
        },
        {
            id: 2,
            user_id: 4,
            employee_name: 'Neha Kapoor',
            type: 'Sick Leave',
            day_type: 'Full Day',
            start_date: '2026-03-10',
            end_date: '2026-03-10',
            total_days: 1,
            reason: 'Medical rest day',
            status: 'Approved',
            applied_at: '2026-03-09 16:45',
            approved_by_name: 'Priya Sharma',
            approved_at: '2026-03-09 17:10'
        }
    ];

    const requirements = [
        {
            id: 1,
            recruiter_id: 4,
            recruiter_name: 'Neha Kapoor',
            client_company: 'Acme Digital',
            location: 'Noida',
            role_title: 'Frontend Developer',
            positions_count: 3,
            jd_file_path: getTextDocumentUrl('Frontend Developer JD', 'Need Vue and modern frontend experience.'),
            status: 'Open'
        },
        {
            id: 2,
            recruiter_id: null,
            recruiter_name: 'Unassigned',
            client_company: 'Northwind Health',
            location: 'Remote',
            role_title: 'QA Engineer',
            positions_count: 2,
            jd_file_path: getTextDocumentUrl('QA Engineer JD', 'Manual and automation testing profile.'),
            status: 'Open'
        },
        {
            id: 3,
            recruiter_id: 4,
            recruiter_name: 'Neha Kapoor',
            client_company: 'Blue Orbit',
            location: 'Bengaluru',
            role_title: 'React Native Developer',
            positions_count: 1,
            jd_file_path: getTextDocumentUrl('React Native JD', 'Mobile app delivery for consumer products.'),
            status: 'On Hold'
        }
    ];

    const candidates = [
        {
            id: 1,
            name: 'Sana Ali',
            email: 'sana.ali@example.com',
            phone: '9876543210',
            company_name: 'TechNova',
            profile_name: 'Frontend Developer',
            location: 'Noida',
            qualification: 'B.Tech',
            total_experience: 4,
            relevant_experience: 3.5,
            in_hand_salary: 8,
            current_ctc: 10,
            expected_ctc: 12,
            notice_period: '30 Days',
            status: 'Available',
            job_requirement_id: null,
            job_client_company: '',
            job_role: '',
            job_location: '',
            assigned_recruiter_name: ''
        },
        {
            id: 2,
            name: 'Arjun Nair',
            email: 'arjun.nair@example.com',
            phone: '9898989898',
            company_name: 'PixelWorks',
            profile_name: 'Frontend Developer',
            location: 'Noida',
            qualification: 'MCA',
            total_experience: 5,
            relevant_experience: 4,
            in_hand_salary: 11,
            current_ctc: 14,
            expected_ctc: 16,
            notice_period: 'Immediate',
            status: 'Shared',
            job_requirement_id: 1,
            job_client_company: 'Acme Digital',
            job_role: 'Frontend Developer',
            job_location: 'Noida',
            assigned_recruiter_name: 'Neha Kapoor'
        },
        {
            id: 3,
            name: 'Meera Joshi',
            email: 'meera.joshi@example.com',
            phone: '9765432101',
            company_name: 'Inspectify',
            profile_name: 'QA Engineer',
            location: 'Pune',
            qualification: 'B.Sc IT',
            total_experience: 3,
            relevant_experience: 2.5,
            in_hand_salary: 6,
            current_ctc: 8,
            expected_ctc: 9.5,
            notice_period: '15 Days',
            status: 'Shortlisted',
            job_requirement_id: 2,
            job_client_company: 'Northwind Health',
            job_role: 'QA Engineer',
            job_location: 'Remote',
            assigned_recruiter_name: 'Unassigned'
        },
        {
            id: 4,
            name: 'Vivek Singh',
            email: 'vivek.singh@example.com',
            phone: '9654321098',
            company_name: 'AppCraft',
            profile_name: 'React Native Developer',
            location: 'Bengaluru',
            qualification: 'B.E.',
            total_experience: 6,
            relevant_experience: 5,
            in_hand_salary: 14,
            current_ctc: 18,
            expected_ctc: 20,
            notice_period: '45 Days',
            status: 'Interviewed',
            job_requirement_id: 3,
            job_client_company: 'Blue Orbit',
            job_role: 'React Native Developer',
            job_location: 'Bengaluru',
            assigned_recruiter_name: 'Neha Kapoor'
        }
    ];

    const dailyLogs = [
        { id: 1, user_id: 4, date: '2026-03-17', recruiter_name: 'Neha Kapoor', profiles_sourced: 8, profiles_shared: 4, comments: 'Shared frontend shortlist with Acme Digital.' },
        { id: 2, user_id: 4, date: '2026-03-18', recruiter_name: 'Neha Kapoor', profiles_sourced: 6, profiles_shared: 3, comments: 'Lined up QA interview panel for Northwind.' }
    ];

    const leads = [
        {
            id: 1,
            owner_id: 5,
            owner: 'Karan Malhotra',
            client_company: 'Vertex Systems',
            contact_person: 'Anita Rao',
            email: 'anita.rao@vertex.example',
            phone: '9123456780',
            location: 'Mumbai',
            website: 'https://vertex.example',
            social_links: 'LinkedIn /vertex-systems',
            spoc_details: 'HR Head, hiring for support and engineering.',
            status: 'Interested'
        },
        {
            id: 2,
            owner_id: 1,
            owner: 'Aarav Mehta',
            client_company: 'Sunrise Labs',
            contact_person: 'Rohit Sethi',
            email: 'rohit.sethi@sunrise.example',
            phone: '9987612345',
            location: 'Gurugram',
            website: 'https://sunrise.example',
            social_links: 'LinkedIn /sunrise-labs',
            spoc_details: 'Looking for QA and mobile hiring support.',
            status: 'New'
        },
        {
            id: 3,
            owner_id: 5,
            owner: 'Karan Malhotra',
            client_company: 'Nimbus Global',
            contact_person: 'Sakshi Khanna',
            email: 'sakshi.khanna@nimbus.example',
            phone: '9811122233',
            location: 'Dubai',
            website: 'https://nimbus.example',
            social_links: 'LinkedIn /nimbus-global',
            spoc_details: 'Potential enterprise staffing partner.',
            status: 'Converted'
        }
    ];

    const followups = [
        { id: 1, lead_id: 1, scheduled_at: '2026-03-18 11:30', notes: 'Sent revised pricing deck and case studies.', status: 'Scheduled' },
        { id: 2, lead_id: 1, scheduled_at: '2026-03-19 15:00', notes: 'Follow up for feedback from procurement team.', status: 'Scheduled' },
        { id: 3, lead_id: 3, scheduled_at: '2026-03-17 13:00', notes: 'Contract signed, onboarding to start next week.', status: 'Completed' }
    ];

    return {
        users,
        attendance,
        salaries,
        leaves,
        requirements,
        candidates,
        dailyLogs,
        leads,
        followups,
        meta: {
            nextIds: {
                user: 6,
                attendance: 11,
                salary: 9,
                leave: 3,
                requirement: 4,
                candidate: 5,
                dailyLog: 3,
                lead: 4,
                followup: 4
            }
        }
    };
}

function ensureDerivedData(db) {
    const userMap = new Map(db.users.map(user => [Number(user.id), user]));

    db.users = db.users.map(user => ({
        ...user,
        assigned_manager_name: user.assigned_manager_id ? (userMap.get(Number(user.assigned_manager_id))?.full_name || 'None Assigned') : 'None Assigned',
        profile_picture: user.profile_picture || getAvatarDataUrl(user.full_name || user.username)
    }));

    db.salaries = db.salaries.map(salary => {
        const user = userMap.get(Number(salary.user_id));
        return {
            ...salary,
            employee_name: user?.full_name || salary.employee_name || 'Unknown User',
            username: user?.username || salary.username || 'unknown',
            net_pay: Number(salary.base_salary || 0) + Number(salary.incentives || 0) - Number(salary.deductions || 0),
            status: salary.payment_status || salary.status || 'Pending'
        };
    });

    db.leaves = db.leaves.map(leave => {
        const user = userMap.get(Number(leave.user_id));
        return {
            ...leave,
            employee_name: user?.full_name || leave.employee_name || 'Unknown User',
            type: leave.type || leave.leave_type || 'Casual Leave'
        };
    });

    db.requirements = db.requirements.map(requirement => {
        const recruiter = requirement.recruiter_id ? userMap.get(Number(requirement.recruiter_id)) : null;
        return {
            ...requirement,
            recruiter_name: recruiter?.full_name || requirement.recruiter_name || 'Unassigned',
            jd_file_path: requirement.jd_file_path || getTextDocumentUrl(`${requirement.role_title || 'Requirement'} JD`, 'Demo requirement document.')
        };
    });

    db.candidates = db.candidates.map(candidate => {
        const requirement = candidate.job_requirement_id
            ? db.requirements.find(item => Number(item.id) === Number(candidate.job_requirement_id))
            : null;
        return {
            ...candidate,
            job_client_company: requirement?.client_company || candidate.job_client_company || '',
            job_role: requirement?.role_title || candidate.job_role || '',
            job_location: requirement?.location || candidate.job_location || '',
            assigned_recruiter_name: requirement?.recruiter_name || candidate.assigned_recruiter_name || ''
        };
    });

    return db;
}

function loadDb() {
    const stored = localStorage.getItem(MOCK_DB_KEY);
    if (!stored) {
        const seed = ensureDerivedData(buildSeedData());
        saveDb(seed);
        return seed;
    }

    try {
        return ensureDerivedData(JSON.parse(stored));
    } catch (error) {
        const seed = ensureDerivedData(buildSeedData());
        saveDb(seed);
        return seed;
    }
}

function saveDb(db) {
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(ensureDerivedData(db)));
}

function getCurrentUser(db) {
    const currentUserId = Number(localStorage.getItem(CURRENT_USER_KEY) || 0);
    if (!currentUserId) return null;
    return db.users.find(user => Number(user.id) === currentUserId) || null;
}

function getNextId(db, key) {
    const next = Number(db.meta?.nextIds?.[key] || 1);
    db.meta = db.meta || { nextIds: {} };
    db.meta.nextIds = db.meta.nextIds || {};
    db.meta.nextIds[key] = next + 1;
    return next;
}

function sortByNewest(items, field = 'id') {
    return [...items].sort((a, b) => {
        const aValue = a?.[field];
        const bValue = b?.[field];
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return String(bValue).localeCompare(String(aValue));
        }
        return Number(bValue || 0) - Number(aValue || 0);
    });
}

function calculateLeaveDays(startDate, endDate, dayType) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
        return 0;
    }

    const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (dayType && dayType !== 'Full Day') {
        return totalDays === 1 ? 0.5 : totalDays - 0.5;
    }
    return totalDays;
}

function buildRequirementReports(db) {
    return db.requirements.map(requirement => {
        const linkedCandidates = db.candidates.filter(candidate => Number(candidate.job_requirement_id) === Number(requirement.id));
        return {
            id: requirement.id,
            recruiter_name: requirement.recruiter_name || 'Unassigned',
            client_company: requirement.client_company,
            role_title: requirement.role_title,
            location: requirement.location,
            positions_count: requirement.positions_count,
            requirement_status: requirement.status,
            profiles_shared: linkedCandidates.filter(candidate => ['Shared', 'Shortlisted', 'Interviewed', 'Selected'].includes(candidate.status)).length,
            shortlisted: linkedCandidates.filter(candidate => candidate.status === 'Shortlisted').length,
            interviewed: linkedCandidates.filter(candidate => candidate.status === 'Interviewed').length,
            selected: linkedCandidates.filter(candidate => candidate.status === 'Selected').length,
            rejected: linkedCandidates.filter(candidate => candidate.status === 'Rejected').length
        };
    });
}

function buildRecruiterReports(db) {
    const recruiterUsers = db.users.filter(user => user.role === 'Recruitment Executive');

    return recruiterUsers.map(recruiter => {
        const recruiterRequirements = db.requirements.filter(requirement => Number(requirement.recruiter_id) === Number(recruiter.id));
        const recruiterCandidates = db.candidates.filter(candidate => candidate.assigned_recruiter_name === recruiter.full_name);
        const recruiterLogs = db.dailyLogs.filter(log => Number(log.user_id) === Number(recruiter.id));

        return {
            recruiter_name: recruiter.full_name,
            stats: {
                activity_days: recruiterLogs.length,
                sourced: recruiterLogs.reduce((sum, item) => sum + Number(item.profiles_sourced || 0), 0),
                shared: recruiterLogs.reduce((sum, item) => sum + Number(item.profiles_shared || 0), 0),
                closed: recruiterRequirements.filter(requirement => requirement.status === 'Closed').length,
                shortlisted: recruiterCandidates.filter(candidate => candidate.status === 'Shortlisted').length,
                interviewed: recruiterCandidates.filter(candidate => candidate.status === 'Interviewed').length,
                selected: recruiterCandidates.filter(candidate => candidate.status === 'Selected').length,
                rejected: recruiterCandidates.filter(candidate => candidate.status === 'Rejected').length
            }
        };
    });
}

function buildSalesStats(db) {
    const totalLeads = db.leads.length;
    const statusBreakdown = db.leads.reduce((acc, lead) => {
        const key = lead.status || 'New';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    const employeePerformanceMap = db.leads.reduce((acc, lead) => {
        const key = lead.owner || 'Unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    const employeePerformance = Object.entries(employeePerformanceMap)
        .map(([employee_name, lead_count]) => ({ employee_name, lead_count }))
        .sort((a, b) => b.lead_count - a.lead_count);

    return {
        total_leads: totalLeads,
        status_breakdown: statusBreakdown,
        employee_performance: employeePerformance
    };
}

async function handleAuth(db, path, method, body) {
    if (path === '/api/auth/login' && method === 'post') {
        const username = String(body.username || '').trim().toLowerCase();
        const password = String(body.password || '');
        const user = db.users.find(item => item.username.toLowerCase() === username && item.password === password);

        if (!user) {
            throw createMockError(400, 'Invalid username or password.');
        }

        user.last_login = getNowReadable();
        saveDb(db);
        setCurrentUser(user);

        return {
            access_token: `mock-token-${user.id}-${Date.now()}`,
            user: sanitizeUser(user)
        };
    }

    if (path === '/api/auth/register' && method === 'post') {
        const username = String(body.username || '').trim();
        const email = String(body.email || '').trim().toLowerCase();

        if (db.users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
            throw createMockError(400, 'Username already exists.');
        }

        if (db.users.some(user => user.email.toLowerCase() === email)) {
            throw createMockError(400, 'Email already exists.');
        }

        const id = getNextId(db, 'user');
        const user = {
            id,
            username,
            full_name: body.full_name || username,
            email,
            password: body.password || 'Demo@123',
            role: body.role || 'Employee',
            is_verified: false,
            verification_status: 'Pending',
            department: body.role || 'Employee',
            assigned_team: 'Pending Assignment',
            assigned_manager_id: 2,
            assigned_manager_name: 'Priya Sharma',
            employee_status: 'Active',
            phone_number: '',
            alternate_phone: '',
            address: '',
            notes: 'Registered in demo mode.',
            join_date: getTodayIso(),
            last_login: 'Never',
            created_at: getTodayIso(),
            profile_picture: getAvatarDataUrl(body.full_name || username)
        };

        db.users.push(user);
        saveDb(db);

        return {
            success: true,
            message: 'Registration successful.'
        };
    }

    if (path === '/api/auth/me' && method === 'get') {
        const user = getCurrentUser(db);
        if (!user) {
            throw createMockError(401, 'You are not logged in.');
        }

        if (!user.is_verified) {
            user.is_verified = true;
            user.verification_status = 'Approved';
            saveDb(db);
            syncCurrentUser(db, user);
        }

        return sanitizeUser(user);
    }

    return null;
}

async function handleProfile(db, path, method, body) {
    const currentUser = getCurrentUser(db);

    if (!currentUser) {
        throw createMockError(401, 'Please log in to continue.');
    }

    if (path === '/api/profile/me' && method === 'get') {
        return sanitizeUser(currentUser);
    }

    const uploadMatch = path.match(/^\/api\/profile\/(\d+)\/upload_picture$/);
    if (uploadMatch && method === 'post') {
        const targetId = Number(uploadMatch[1]);
        const user = db.users.find(item => Number(item.id) === targetId);
        if (!user) {
            throw createMockError(404, 'User not found.');
        }

        const file = body.profile_picture;
        user.profile_picture = (await fileToDataUrl(file)) || getAvatarDataUrl(user.full_name || user.username);
        saveDb(db);
        syncCurrentUser(db, user);

        return {
            success: true,
            profile_picture: user.profile_picture
        };
    }

    const profileMatch = path.match(/^\/api\/profile\/(\d+)$/);
    if (profileMatch && method === 'get') {
        const user = db.users.find(item => Number(item.id) === Number(profileMatch[1]));
        if (!user) {
            throw createMockError(404, 'User not found.');
        }
        return sanitizeUser(user);
    }

    if (profileMatch && method === 'put') {
        const user = db.users.find(item => Number(item.id) === Number(profileMatch[1]));
        if (!user) {
            throw createMockError(404, 'User not found.');
        }

        if (body.password) {
            user.password = body.password;
        }

        const fields = [
            'username',
            'full_name',
            'email',
            'role',
            'department',
            'assigned_team',
            'assigned_manager_id',
            'employee_status',
            'notes',
            'phone_number',
            'alternate_phone',
            'address'
        ];

        fields.forEach(field => {
            if (body[field] !== undefined) {
                user[field] = body[field];
            }
        });

        saveDb(db);
        syncCurrentUser(db, user);

        return {
            success: true,
            user: sanitizeUser(user)
        };
    }

    return null;
}

async function handleAdmin(db, path, method, body) {
    if (path === '/api/admin/users' && method === 'get') {
        return sortByNewest(db.users.map(sanitizeUser));
    }

    if (path === '/api/admin/users' && method === 'post') {
        const username = String(body.username || '').trim();
        const email = String(body.email || '').trim().toLowerCase();

        if (!username || !email) {
            throw createMockError(400, 'Username and email are required.');
        }

        if (db.users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
            throw createMockError(400, 'Username already exists.');
        }

        const id = getNextId(db, 'user');
        const managerId = body.role === 'Manager' ? 1 : 2;
        const user = {
            id,
            username,
            full_name: body.full_name || username,
            email,
            password: body.password || 'Demo@123',
            role: body.role || 'Employee',
            is_verified: false,
            verification_status: 'Pending',
            department: body.role || 'Employee',
            assigned_team: body.role === 'Business Development Team' ? 'Enterprise Growth' : 'General',
            assigned_manager_id: managerId,
            assigned_manager_name: db.users.find(item => Number(item.id) === managerId)?.full_name || 'Priya Sharma',
            employee_status: 'Active',
            phone_number: '',
            alternate_phone: '',
            address: '',
            notes: 'Created from admin demo panel.',
            join_date: getTodayIso(),
            last_login: 'Never',
            created_at: getTodayIso(),
            profile_picture: getAvatarDataUrl(body.full_name || username)
        };

        db.users.push(user);
        saveDb(db);
        return { success: true, user: sanitizeUser(user) };
    }

    const verificationMatch = path.match(/^\/api\/admin\/users\/(\d+)\/verification$/);
    if (verificationMatch && method === 'put') {
        const user = db.users.find(item => Number(item.id) === Number(verificationMatch[1]));
        if (!user) {
            throw createMockError(404, 'User not found.');
        }

        const status = body.verification_status || 'Approved';
        user.verification_status = status;
        user.is_verified = status === 'Approved';
        saveDb(db);
        syncCurrentUser(db, user);

        return { success: true, user: sanitizeUser(user) };
    }

    const deleteUserMatch = path.match(/^\/api\/admin\/users\/(\d+)$/);
    if (deleteUserMatch && method === 'delete') {
        const userId = Number(deleteUserMatch[1]);
        db.users = db.users.filter(user => Number(user.id) !== userId);
        db.attendance = db.attendance.filter(item => Number(item.user_id) !== userId);
        db.salaries = db.salaries.filter(item => Number(item.user_id) !== userId);
        db.leaves = db.leaves.filter(item => Number(item.user_id) !== userId);
        db.dailyLogs = db.dailyLogs.filter(item => Number(item.user_id) !== userId);
        saveDb(db);
        return { success: true, message: 'User deleted successfully.' };
    }

    if (path === '/api/admin/salaries' && method === 'get') {
        return sortByNewest(db.salaries, 'id');
    }

    if (path === '/api/admin/salaries' && method === 'post') {
        const user = db.users.find(item => Number(item.id) === Number(body.user_id));
        if (!user) {
            throw createMockError(400, 'Select a valid employee.');
        }

        const salary = {
            id: getNextId(db, 'salary'),
            user_id: user.id,
            month: body.month || getMonthLabel(),
            year: Number(body.year || new Date().getFullYear()),
            base_salary: Number(body.base_salary || 0),
            incentives: Number(body.incentives || 0),
            deductions: Number(body.deductions || 0),
            payment_status: body.payment_status || 'Pending',
            status: body.payment_status || 'Pending',
            employee_name: user.full_name,
            username: user.username
        };

        salary.net_pay = salary.base_salary + salary.incentives - salary.deductions;
        db.salaries.unshift(salary);
        saveDb(db);
        return { success: true, salary };
    }

    if (path === '/api/admin/leaves' && method === 'get') {
        return sortByNewest(db.leaves, 'id');
    }

    const leaveStatusMatch = path.match(/^\/api\/admin\/leaves\/(\d+)$/);
    if (leaveStatusMatch && method === 'put') {
        const leave = db.leaves.find(item => Number(item.id) === Number(leaveStatusMatch[1]));
        const approver = getCurrentUser(db);
        if (!leave) {
            throw createMockError(404, 'Leave request not found.');
        }

        leave.status = body.status || leave.status;
        leave.approved_by_name = approver?.full_name || 'Admin';
        leave.approved_at = getNowReadable();
        saveDb(db);
        return { success: true, leave };
    }

    if (path === '/api/admin/reports' && method === 'get') {
        return {
            recruiter_summary: buildRecruiterReports(db),
            requirement_summary: buildRequirementReports(db)
        };
    }

    return null;
}

async function handleEmployee(db, path, method, body) {
    const currentUser = getCurrentUser(db);
    if (!currentUser) {
        throw createMockError(401, 'Please log in to continue.');
    }

    if (path === '/api/employee/attendance' && method === 'get') {
        return sortByNewest(db.attendance.filter(item => Number(item.user_id) === Number(currentUser.id)), 'date');
    }

    if (path === '/api/employee/salary' && method === 'get') {
        return sortByNewest(db.salaries.filter(item => Number(item.user_id) === Number(currentUser.id)), 'id').map(item => ({
            id: item.id,
            month: item.month,
            year: item.year,
            base: item.base_salary,
            incentives: item.incentives,
            deductions: item.deductions,
            net_pay: item.net_pay,
            status: item.payment_status || item.status || 'Pending'
        }));
    }

    if (path === '/api/employee/leaves' && method === 'get') {
        return sortByNewest(db.leaves.filter(item => Number(item.user_id) === Number(currentUser.id)), 'id');
    }

    if (path === '/api/employee/attendance/clock-in' && method === 'post') {
        const today = getTodayIso();
        const existing = db.attendance.find(item => Number(item.user_id) === Number(currentUser.id) && item.date === today);
        if (existing) {
            return { success: true, message: 'Already clocked in for today.' };
        }

        db.attendance.unshift({
            id: getNextId(db, 'attendance'),
            user_id: currentUser.id,
            date: today,
            check_in: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            check_out: null,
            total_hours: null,
            status: 'Present'
        });
        saveDb(db);
        return { success: true, message: 'Clocked in successfully.' };
    }

    if (path === '/api/employee/attendance/clock-out' && method === 'post') {
        const today = getTodayIso();
        const existing = db.attendance.find(item => Number(item.user_id) === Number(currentUser.id) && item.date === today);
        if (!existing) {
            throw createMockError(400, 'Please clock in before clocking out.');
        }

        if (existing.check_out) {
            return { success: true, message: 'Already clocked out for today.' };
        }

        existing.check_out = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        existing.total_hours = '8h 30m';
        saveDb(db);
        return { success: true, message: 'Clocked out successfully.' };
    }

    if (path === '/api/employee/leaves' && method === 'post') {
        const leave = {
            id: getNextId(db, 'leave'),
            user_id: currentUser.id,
            employee_name: currentUser.full_name,
            type: body.leave_type || body.type || 'Casual Leave',
            day_type: body.day_type || 'Full Day',
            start_date: body.start_date,
            end_date: body.end_date,
            total_days: calculateLeaveDays(body.start_date, body.end_date, body.day_type || 'Full Day'),
            reason: body.reason || 'Personal reason',
            status: 'Pending',
            applied_at: getNowReadable(),
            approved_by_name: '',
            approved_at: ''
        };

        db.leaves.unshift(leave);
        saveDb(db);
        return { success: true, leave };
    }

    return null;
}

async function handleRecruitment(db, path, method, body) {
    const currentUser = getCurrentUser(db);

    if (path === '/api/recruitment/requirements' && method === 'get') {
        return sortByNewest(db.requirements, 'id');
    }

    if (path === '/api/recruitment/candidates' && method === 'get') {
        return sortByNewest(db.candidates, 'id');
    }

    if (path === '/api/recruitment/daily-logs' && method === 'get') {
        return sortByNewest(db.dailyLogs, 'date');
    }

    if (path === '/api/recruitment/reports' && method === 'get') {
        return {
            recruiter_summary: buildRecruiterReports(db),
            requirement_summary: buildRequirementReports(db)
        };
    }

    if (path === '/api/recruitment/candidates/upload-excel' && method === 'post') {
        const samples = [
            {
                name: 'Pooja Bhatia',
                email: 'pooja.bhatia@example.com',
                phone: '9345678901',
                company_name: 'Talent Grid',
                profile_name: 'QA Engineer',
                location: 'Remote',
                qualification: 'BCA',
                total_experience: 4,
                relevant_experience: 3,
                in_hand_salary: 7,
                current_ctc: 9,
                expected_ctc: 10,
                notice_period: 'Immediate',
                status: 'Available',
                job_requirement_id: null,
                job_client_company: '',
                job_role: '',
                job_location: '',
                assigned_recruiter_name: ''
            },
            {
                name: 'Harsh Goel',
                email: 'harsh.goel@example.com',
                phone: '9234567890',
                company_name: 'Code Vista',
                profile_name: 'Frontend Developer',
                location: 'Delhi NCR',
                qualification: 'B.Tech',
                total_experience: 2,
                relevant_experience: 2,
                in_hand_salary: 5,
                current_ctc: 6,
                expected_ctc: 7,
                notice_period: '30 Days',
                status: 'Available',
                job_requirement_id: null,
                job_client_company: '',
                job_role: '',
                job_location: '',
                assigned_recruiter_name: ''
            }
        ];

        samples.forEach(sample => {
            db.candidates.unshift({ id: getNextId(db, 'candidate'), ...sample });
        });
        saveDb(db);
        return { success: true, imported: 2, skipped: 1 };
    }

    if (path === '/api/recruitment/requirements' && method === 'post') {
        const recruiter = body.recruiter_id ? db.users.find(user => Number(user.id) === Number(body.recruiter_id)) : null;
        const jdFileUrl = body.jd_file ? await fileToDataUrl(body.jd_file) : '';
        const requirement = {
            id: getNextId(db, 'requirement'),
            recruiter_id: recruiter?.id || null,
            recruiter_name: recruiter?.full_name || 'Unassigned',
            client_company: body.client_company || 'Demo Client',
            location: body.location || 'Remote',
            role_title: body.role_title || 'Open Role',
            positions_count: Number(body.positions_count || 1),
            jd_file_path: jdFileUrl || getTextDocumentUrl(
                `${body.role_title || 'Open Role'} JD`,
                `Client: ${body.client_company || 'Demo Client'}\nLocation: ${body.location || 'Remote'}\nPositions: ${body.positions_count || 1}`
            ),
            status: 'Open'
        };

        db.requirements.unshift(requirement);
        saveDb(db);
        return { success: true, requirement };
    }

    const requirementMatch = path.match(/^\/api\/recruitment\/requirements\/(\d+)$/);
    if (requirementMatch && method === 'put') {
        const requirement = db.requirements.find(item => Number(item.id) === Number(requirementMatch[1]));
        if (!requirement) {
            throw createMockError(404, 'Requirement not found.');
        }

        if (body.recruiter_id !== undefined) {
            const recruiter = db.users.find(user => Number(user.id) === Number(body.recruiter_id));
            requirement.recruiter_id = recruiter?.id || null;
            requirement.recruiter_name = recruiter?.full_name || 'Unassigned';
        }

        ['status', 'client_company', 'location', 'role_title', 'positions_count'].forEach(field => {
            if (body[field] !== undefined) {
                requirement[field] = field === 'positions_count' ? Number(body[field]) : body[field];
            }
        });

        db.candidates.forEach(candidate => {
            if (Number(candidate.job_requirement_id) === Number(requirement.id)) {
                candidate.job_client_company = requirement.client_company;
                candidate.job_role = requirement.role_title;
                candidate.job_location = requirement.location;
                candidate.assigned_recruiter_name = requirement.recruiter_name;
            }
        });

        saveDb(db);
        return { success: true, requirement };
    }

    if (requirementMatch && method === 'delete') {
        const requirementId = Number(requirementMatch[1]);
        db.requirements = db.requirements.filter(item => Number(item.id) !== requirementId);
        db.candidates = db.candidates.filter(item => Number(item.job_requirement_id) !== requirementId);
        saveDb(db);
        return { success: true, message: 'Requirement deleted successfully.' };
    }

    if (path === '/api/recruitment/candidates' && method === 'post') {
        const jobRequirementId = body.job_requirement_id ? Number(body.job_requirement_id) : null;
        const requirement = jobRequirementId ? db.requirements.find(item => Number(item.id) === jobRequirementId) : null;
        const candidate = {
            id: getNextId(db, 'candidate'),
            name: body.name || 'Demo Candidate',
            email: body.email || `candidate${Date.now()}@example.com`,
            phone: body.phone || '9000000000',
            company_name: body.company_name || '',
            profile_name: body.profile_name || '',
            location: body.location || '',
            qualification: body.qualification || '',
            total_experience: Number(body.total_experience || 0),
            relevant_experience: Number(body.relevant_experience || 0),
            in_hand_salary: body.in_hand_salary === '' ? null : Number(body.in_hand_salary || 0),
            current_ctc: body.current_ctc === '' ? null : Number(body.current_ctc || 0),
            expected_ctc: body.expected_ctc === '' ? null : Number(body.expected_ctc || 0),
            notice_period: body.notice_period || '',
            status: requirement ? 'Shared' : 'Available',
            job_requirement_id: requirement?.id || null,
            job_client_company: requirement?.client_company || '',
            job_role: requirement?.role_title || '',
            job_location: requirement?.location || '',
            assigned_recruiter_name: requirement?.recruiter_name || ''
        };

        db.candidates.unshift(candidate);
        saveDb(db);
        return { success: true, candidate };
    }

    const candidateMatch = path.match(/^\/api\/recruitment\/candidates\/(\d+)$/);
    if (candidateMatch && method === 'put') {
        const candidate = db.candidates.find(item => Number(item.id) === Number(candidateMatch[1]));
        if (!candidate) {
            throw createMockError(404, 'Candidate not found.');
        }

        if (body.job_requirement_id !== undefined) {
            const jobRequirementId = body.job_requirement_id ? Number(body.job_requirement_id) : null;
            const requirement = jobRequirementId ? db.requirements.find(item => Number(item.id) === jobRequirementId) : null;
            candidate.job_requirement_id = requirement?.id || null;
            candidate.job_client_company = requirement?.client_company || '';
            candidate.job_role = requirement?.role_title || '';
            candidate.job_location = requirement?.location || '';
            candidate.assigned_recruiter_name = requirement?.recruiter_name || '';
        }

        [
            'status',
            'name',
            'email',
            'phone',
            'company_name',
            'profile_name',
            'location',
            'qualification',
            'notice_period'
        ].forEach(field => {
            if (body[field] !== undefined) {
                candidate[field] = body[field];
            }
        });

        ['total_experience', 'relevant_experience', 'in_hand_salary', 'current_ctc', 'expected_ctc'].forEach(field => {
            if (body[field] !== undefined) {
                candidate[field] = body[field] === null || body[field] === '' ? null : Number(body[field]);
            }
        });

        saveDb(db);
        return { success: true, candidate };
    }

    if (path === '/api/recruitment/daily-logs' && method === 'post') {
        const recruiter = currentUser || db.users.find(user => user.role === 'Recruitment Executive') || db.users[0];
        const log = {
            id: getNextId(db, 'dailyLog'),
            user_id: recruiter.id,
            date: body.date || getTodayIso(),
            recruiter_name: recruiter.full_name,
            profiles_sourced: Number(body.profiles_sourced || 0),
            profiles_shared: Number(body.profiles_shared || 0),
            comments: body.comments || ''
        };

        db.dailyLogs.unshift(log);
        saveDb(db);
        return { success: true, daily_log: log };
    }

    return null;
}

async function handleSales(db, path, method, body) {
    const currentUser = getCurrentUser(db) || db.users[0];

    if (path === '/api/sales/leads' && method === 'get') {
        return sortByNewest(db.leads, 'id');
    }

    if (path === '/api/sales/stats' && method === 'get') {
        return buildSalesStats(db);
    }

    if (path === '/api/sales/leads' && method === 'post') {
        const lead = {
            id: getNextId(db, 'lead'),
            owner_id: currentUser.id,
            owner: currentUser.full_name,
            client_company: body.client_company || 'New Client',
            contact_person: body.contact_person || '',
            email: body.email || '',
            phone: body.phone || '',
            location: body.location || '',
            website: body.website || '',
            social_links: body.social_links || '',
            spoc_details: body.spoc_details || '',
            status: body.status || 'New'
        };

        db.leads.unshift(lead);
        saveDb(db);
        return { success: true, lead };
    }

    const leadMatch = path.match(/^\/api\/sales\/leads\/(\d+)$/);
    if (leadMatch && method === 'put') {
        const lead = db.leads.find(item => Number(item.id) === Number(leadMatch[1]));
        if (!lead) {
            throw createMockError(404, 'Lead not found.');
        }

        Object.keys(body).forEach(key => {
            if (body[key] !== undefined) {
                lead[key] = body[key];
            }
        });

        saveDb(db);
        return { success: true, lead };
    }

    if (leadMatch && method === 'delete') {
        const leadId = Number(leadMatch[1]);
        db.leads = db.leads.filter(item => Number(item.id) !== leadId);
        db.followups = db.followups.filter(item => Number(item.lead_id) !== leadId);
        saveDb(db);
        return { success: true, message: 'Lead deleted successfully.' };
    }

    const followupMatch = path.match(/^\/api\/sales\/leads\/(\d+)\/followups$/);
    if (followupMatch && method === 'get') {
        return sortByNewest(db.followups.filter(item => Number(item.lead_id) === Number(followupMatch[1])), 'id');
    }

    if (followupMatch && method === 'post') {
        const followup = {
            id: getNextId(db, 'followup'),
            lead_id: Number(followupMatch[1]),
            scheduled_at: body.scheduled_at || getNowReadable(),
            notes: body.notes || 'Demo follow-up scheduled.',
            status: 'Scheduled'
        };

        db.followups.unshift(followup);
        saveDb(db);
        return { success: true, followup };
    }

    return null;
}

export async function getMockData(url, method = 'get', data = {}) {
    const db = loadDb();
    const normalizedMethod = String(method || 'get').toLowerCase();
    const path = getPathFromUrl(url);
    const body = parseRequestData(data);

    const handlers = [
        handleAuth,
        handleProfile,
        handleAdmin,
        handleEmployee,
        handleRecruitment,
        handleSales
    ];

    for (const handler of handlers) {
        const result = await handler(db, path, normalizedMethod, body);
        if (result !== null) {
            saveDb(db);
            return deepClone(result);
        }
    }

    saveDb(db);
    return {
        success: true,
        message: 'Mock response'
    };
}

axios.interceptors.request.use(config => {
    const requestUrl = config?.url || '';
    if (MOCK_MODE && typeof requestUrl === 'string' && requestUrl.startsWith('/api/')) {
        config.adapter = async requestConfig => {
            const delay = 200 + Math.floor(Math.random() * 301);

            return new Promise((resolve, reject) => {
                window.setTimeout(async () => {
                    try {
                        const data = await getMockData(requestConfig.url, requestConfig.method, requestConfig.data);
                        resolve({
                            data,
                            status: 200,
                            statusText: 'OK',
                            headers: {},
                            config: requestConfig,
                            request: { mocked: true }
                        });
                    } catch (error) {
                        reject({
                            message: error.mockMessage || error.message || 'Mock API error',
                            config: requestConfig,
                            response: {
                                data: {
                                    message: error.mockMessage || error.message || 'Mock API error'
                                },
                                status: error.mockStatus || 500,
                                statusText: 'Mock Error',
                                headers: {},
                                config: requestConfig,
                                request: { mocked: true }
                            }
                        });
                    }
                }, delay);
            });
        };
    }

    return config;
});
