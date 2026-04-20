/**
 * Shared Utility for generating professional salary slips using jsPDF.
 * Used by both SalaryOverview (Employee) and AdminDashboard (Admin/Manager).
 */

export const generatePayslipPDF = (data) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const paymentStatus = String(data.payment_status || 'Pending');
    const isPending = paymentStatus !== 'Paid';
    
    // Formatting helper
    const fmt = (v) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v || 0));
    
    const mx = 16; // margin
    const cw = pw - mx * 2; // content width
    let y = 16;

    // ---- HEADER ----
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, pw, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(data.company.name.toUpperCase(), pw / 2, 14, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(data.company.address, pw / 2, 21, { align: 'center' });
    
    doc.setFillColor(45, 95, 139);
    const titleText = `Payslip for the Month of ${data.payslip_month}`;
    const titleW = doc.getTextWidth(titleText) + 18;
    doc.roundedRect((pw - titleW) / 2, 26, titleW, 8, 4, 4, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(titleText, pw / 2, 31.5, { align: 'center' });
    y = 44;

    if (isPending) {
        doc.saveGraphicsState();
        doc.setTextColor(210, 85, 85);
        doc.setGState(new doc.GState({ opacity: 0.14 }));
        doc.setFontSize(44);
        doc.setFont('helvetica', 'bold');
        doc.text('PENDING', pw / 2, ph / 2, { align: 'center', angle: 35 });
        doc.restoreGraphicsState();
    }

    // ---- SECTION HELPER ----
    const drawSectionTitle = (title) => {
        doc.setFillColor(240, 244, 248);
        doc.rect(mx, y, cw, 7, 'F');
        doc.setTextColor(30, 58, 95);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(title, mx + 3, y + 5);
        doc.setDrawColor(30, 58, 95);
        doc.setLineWidth(0.3);
        doc.line(mx, y + 7, mx + cw, y + 7);
        y += SectionVerticalSpacing;
    };
    const SectionVerticalSpacing = 10;

    // ---- TABLE HELPER ----
    const drawTable = (headers, rows, colWidths) => {
        const rh = 7;
        // header
        doc.setFillColor(240, 244, 248);
        doc.rect(mx, y, cw, rh, 'F');
        doc.setTextColor(30, 58, 95);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        let xOff = mx;
        headers.forEach((h, i) => {
            const align = i === headers.length - 1 ? 'right' : 'left';
            const xPos = align === 'right' ? xOff + colWidths[i] - 2 : xOff + 2;
            doc.text(h, xPos, y + 5, { align });
            xOff += colWidths[i];
        });
        doc.setDrawColor(200, 210, 220);
        doc.setLineWidth(0.2);
        doc.line(mx, y + rh, mx + cw, y + rh);
        y += rh;

        // rows
        rows.forEach((row, ri) => {
            const isTotal = row._isTotal;
            if (isTotal) {
                doc.setFillColor(232, 240, 254);
                doc.rect(mx, y, cw, rh, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setDrawColor(30, 58, 95);
                doc.setLineWidth(0.4);
                doc.line(mx, y, mx + cw, y);
            } else if (ri % 2 === 1) {
                doc.setFillColor(250, 251, 252);
                doc.rect(mx, y, cw, rh, 'F');
            }
            doc.setTextColor(26, 26, 46);
            if (!isTotal) doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            xOff = mx;
            row.cells.forEach((cell, ci) => {
                const align = ci === row.cells.length - 1 ? 'right' : 'left';
                const xPos = align === 'right' ? xOff + colWidths[ci] - 2 : xOff + 2;
                doc.text(String(cell), xPos, y + 5, { align });
                xOff += colWidths[ci];
            });
            doc.setDrawColor(234, 239, 244);
            doc.setLineWidth(0.15);
            doc.line(mx, y + rh, mx + cw, y + rh);
            y += rh;
        });
        y += 3;
    };

    // ---- EMPLOYEE DETAILS ----
    drawSectionTitle('Employee Details');
    const empFields = [
        ['Employee Name', data.employee.name, 'Employee ID', data.employee.employee_id],
        ['Designation', data.employee.designation, 'Department', data.employee.department],
        ['Date of Joining', data.employee.date_of_joining, 'PAN', data.employee.pan],
        ['Bank A/C No', data.employee.bank_account, 'Payment Status', paymentStatus]
    ];
    doc.setFontSize(9);
    const lCol = cw / 2;
    empFields.forEach(([l1, v1, l2, v2]) => {
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text(l1, mx + 2, y + 4);
        doc.setTextColor(26, 26, 46);
        doc.setFont('helvetica', 'bold');
        doc.text(String(v1), mx + lCol - 8, y + 4, { align: 'right' });
        if (l2) {
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'normal');
            doc.text(l2, mx + lCol + 4, y + 4);
            doc.setTextColor(26, 26, 46);
            doc.setFont('helvetica', 'bold');
            doc.text(String(v2), mx + cw - 2, y + 4, { align: 'right' });
        }
        doc.setDrawColor(224, 224, 224);
        doc.setLineWidth(0.1);
        const dashes = Math.floor(cw / 2.5);
        for (let d = 0; d < dashes; d++) {
            doc.line(mx + d * 2.5, y + 6, mx + d * 2.5 + 1.2, y + 6);
        }
        y += 8;
    });
    y += 2;

    // ---- EARNINGS ----
    drawSectionTitle('Earnings');
    drawTable(
        ['Component', 'Amount (Rs.)'],
        [
            { cells: ['Total Salary (CTC)', fmt(data.earnings.total_salary)] },
            { cells: ['Basic Salary', fmt(data.earnings.basic_salary)] },
            { cells: ['House Rent Allowance (HRA)', fmt(data.earnings.hra)] },
            { cells: ['Conveyance Allowance', fmt(data.earnings.conveyance_allowance)] },
            { cells: ['Special Allowance', fmt(data.earnings.special_allowance)] },
            { cells: ['Gross Earnings', fmt(data.earnings.gross_earnings)], _isTotal: true }
        ],
        [cw * 0.65, cw * 0.35]
    );

    // ---- INCENTIVE ----
    drawSectionTitle('Incentive');
    drawTable(
        ['Component', 'Details'],
        [
            { cells: ['Final Offers Closed', String(data.incentive.final_offer_closed)] },
            { cells: ['Commission per Closure', fmt(data.incentive.commission_per_closure)] },
            { cells: ['Total Incentive', fmt(data.incentive.total_incentive)], _isTotal: true }
        ],
        [cw * 0.65, cw * 0.35]
    );

    // ---- DEDUCTIONS ----
    drawSectionTitle('Deductions');
    drawTable(
        ['Component', 'Amount (Rs.)'],
        [
            { cells: ['Leave Deduction', fmt(data.deductions_detail.leave_deduction)] },
            { cells: ['Other Deductions / Recovery', fmt(data.deductions_detail.other_deductions)] },
            { cells: ['Gross Deductions', fmt(data.deductions_detail.gross_deductions)], _isTotal: true }
        ],
        [cw * 0.65, cw * 0.35]
    );

    // ---- NET PAY BOX ----
    doc.setFillColor(30, 58, 95);
    doc.roundedRect(mx, y, cw, 18, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Net Pay (In-Hand)', mx + 6, y + 8);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(184, 212, 240);
    doc.text(data.net_pay_words, mx + 6, y + 14);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Rs. ' + fmt(data.net_pay), mx + cw - 6, y + 11, { align: 'right' });
    y += 24;

    // ---- ATTENDANCE ----
    drawSectionTitle('Attendance Details');
    const attData = [
        { label: 'Working Days', value: String(data.attendance.working_days) },
        { label: 'Present Days', value: String(data.attendance.present_days) },
        { label: 'Leaves Taken', value: String(data.attendance.leaves_taken) }
    ];
    const attW = cw / 3;
    attData.forEach((att, i) => {
        const ax = mx + i * attW;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(232, 237, 242);
        doc.roundedRect(ax + 1, y, attW - 2, 16, 2, 2, 'FD');
        doc.setTextColor(30, 58, 95);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(att.value, ax + attW / 2, y + 8, { align: 'center' });
        doc.setTextColor(119, 119, 119);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(att.label, ax + attW / 2, y + 14, { align: 'center' });
    });
    y += 22;

    // ---- FOOTER ----
    doc.setDrawColor(232, 237, 242);
    doc.setLineWidth(0.3);
    doc.line(mx, y, mx + cw, y);
    y += 6;
    doc.setTextColor(136, 136, 136);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This is a system-generated payslip and does not require a signature.', pw / 2, y, { align: 'center' });

    // ---- SAVE ----
    const fileName = `Payslip_${data.employee.name.replace(/\s+/g, '_')}_${data.payslip_month.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
};
