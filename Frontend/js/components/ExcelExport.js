/**
 * @param {Object}   opts
 * @param {Array}    opts.data      – Array of row objects (the full filtered dataset)
 * @param {Array}    opts.columns   – Column definitions: { header, field, accessor?, format? }
 *                                     accessor(row) overrides field for complex values
 *                                     format: 'currency' | 'date' | undefined
 * @param {string}   opts.fileName  – Prefix for the file, e.g. 'users'
 */
export function exportToExcel({ data, columns, fileName }) {
    if (!data || data.length === 0) return;

    const XLSX = window.XLSX;
    if (!XLSX) {
        alert('Excel export library is not loaded. Please refresh the page and try again.');
        return;
    }

    // Build header row
    const headers = columns.map(c => c.header);

    // Build data rows
    const rows = data.map(row => {
        return columns.map(col => {
            let value;
            if (typeof col.accessor === 'function') {
                value = col.accessor(row);
            } else {
                value = row[col.field];
            }

            // Format values
            if (value == null) return '';

            if (col.format === 'currency') {
                const num = Number(value);
                return isNaN(num) ? value : num;
            }

            return String(value);
        });
    });

    // Create worksheet
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-width columns
    const colWidths = headers.map((h, i) => {
        let maxLen = h.length;
        rows.forEach(r => {
            const cellLen = String(r[i] ?? '').length;
            if (cellLen > maxLen) maxLen = cellLen;
        });
        return { wch: Math.min(maxLen + 4, 50) };
    });
    ws['!cols'] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Export');

    // Build the file name
    const today = new Date().toISOString().split('T')[0];
    const safeName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fullFileName = `${safeName}_export_${today}.xlsx`;

    // Convert workbook to base64 and trigger download via data URI.
    // This avoids blob URL issues where browsers ignore the download attribute
    // and produce UUID-named files.
    const wbBase64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

    const link = document.createElement('a');
    link.href = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + wbBase64;
    link.download = fullFileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
