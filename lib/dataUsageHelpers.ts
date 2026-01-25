
/**
 * Parse data string like "100MB", "2.5 GB", "500 KB" to Megabytes (number)
 */
export function parseDataUsageToMB(dataStr: string): number {
    if (!dataStr) return 0;

    // Normalize string: uppercase and remove spaces
    const normalized = dataStr.toUpperCase().replace(/\s+/g, '');

    // Extract number part
    const match = normalized.match(/^([\d.]+)([A-Z]+)$/);
    if (!match) {
        // Try parsing just number if no unit
        // User stated input is bytes, so convert to MB
        const val = parseFloat(normalized);
        return isNaN(val) ? 0 : val / (1024 * 1024);
    }

    const value = parseFloat(match[1]);
    const unit = match[2];

    switch (unit) {
        case 'B': return value / (1024 * 1024);
        case 'KB': return value / 1024;
        case 'MB': return value;
        case 'GB': return value * 1024;
        case 'TB': return value * 1024 * 1024;
        default: return value; // Unknown unit, treat as MB?
    }
}

/**
 * Format today's date in GMT-4 for input[type=date]
 * Returns 'YYYY-MM-DD'
 */
export function getTodayGMTMinus4(): string {
    const now = new Date();
    // Offset for GMT-4 is -4 hours = -240 minutes
    // We want to shift the time so that when we take UTC components, it reflects GMT-4
    // Or simpler: Create a date object, subtract 4 hours, then format.
    // wait, if I am in browser, new Date() is local time.
    // The user requirement "format of local time GMT-4" likely means they want the DEFAULT filter to be "Today in GMT-4".

    // Create a date shifted to GMT-4
    const offset = -4;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000); // UTC time in ms
    const gmtMinus4Time = new Date(utc + (3600000 * offset));

    return gmtMinus4Time.toISOString().split('T')[0];
}

/**
 * Get start and end dates strictly for the selected "Local GMT-4" day
 * Returns { startDate, endDate } as ISO strings
 */
export function getRangeForDate(dateStr: string): { startDate: string, endDate: string } {
    // dateStr is 'YYYY-MM-DD'
    // We want 00:00:00 GMT-4 to 23:59:59 GMT-4
    // 00:00 GMT-4 = 04:00 UTC

    const start = new Date(`${dateStr}T00:00:00.000-04:00`);
    const end = new Date(`${dateStr}T23:59:59.999-04:00`);

    return {
        startDate: start.toISOString(),
        endDate: end.toISOString()
    };
}

/**
 * Get start and end ISO strings for a date interval (inclusive) in GMT-4
 */
export function getRangeForInterval(startStr: string, endStr: string): { startDate: string, endDate: string } {
    const start = new Date(`${startStr}T00:00:00.000-04:00`);
    const end = new Date(`${endStr}T23:59:59.999-04:00`);

    return {
        startDate: start.toISOString(),
        endDate: end.toISOString()
    };
}
