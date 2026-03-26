// lib/timezone.ts
/**
 * Utility functions to manage dates and offsets for MTG-4 (UTC-4) time.
 * Vercel serverless environments execute in UTC by default, and `new Date()` parses
 * depending on string format into local server time, which causes
 * days/months to offset incorrectly when evaluating midnights in MTG-4.
 */

// MTG-4 is 4 hours behind UTC
const MTG4_OFFSET_HOURS = 4;

/**
 * Parses an ISO string (e.g. '2024-05-01') as a date occurring in the MTG-4 timezone
 * and returns the appropriate start of day and end of day as UTC Dates.
 */
export function getStartAndEndOfDay(dateStringOrDate?: Date | string): { start: Date, end: Date } {
    let year: number;
    let month: number;
    let day: number;

    const baseDate = dateStringOrDate ? new Date(dateStringOrDate) : new Date();

    if (typeof dateStringOrDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStringOrDate.split('T')[0])) {
        // Standard full date
        const parts = dateStringOrDate.split('T')[0].split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1; // 0-indexed
        day = parseInt(parts[2], 10);
    } else if (dateStringOrDate instanceof Date || !dateStringOrDate) {
        // To extract year, month, and day corresponding to MTG-4 from the given base UTC date
        // we must subtract 4 hours from the current UTC time.
        const mtg4DateMs = baseDate.getTime() - (MTG4_OFFSET_HOURS * 60 * 60 * 1000);
        const refDate = new Date(mtg4DateMs);
        year = refDate.getUTCFullYear();
        month = refDate.getUTCMonth();
        day = refDate.getUTCDate();
    } else {
        const parts = (dateStringOrDate as string).substring(0, 10).split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1; // 0-indexed
        day = parseInt(parts[2], 10);
    }

    // 00:00 MTG-4 -> 04:00 UTC
    const start = new Date(Date.UTC(year, month, day, MTG4_OFFSET_HOURS, 0, 0, 0));
    // 23:59:59.999 MTG-4 -> 03:59:59.999 UTC (next day)
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);

    return { start, end };
}

/**
 * Returns the start and end of the month for the given date relative to MTG-4
 */
export function getStartAndEndOfMonth(dateStringOrDate?: Date | string): { start: Date, end: Date } {
    const { start: startOfDay } = getStartAndEndOfDay(dateStringOrDate);

    // Set day to 1 of the same month and year
    const start = new Date(Date.UTC(
        startOfDay.getUTCFullYear(),
        startOfDay.getUTCMonth(),
        1,
        MTG4_OFFSET_HOURS, 0, 0, 0
    ));

    // Next month, day 0 is the last day of the current month
    let endMonth = start.getUTCMonth() + 1;
    let endYear = start.getUTCFullYear();
    if (endMonth > 11) {
        endMonth = 0;
        endYear++;
    }

    const startOfNextMonth = new Date(Date.UTC(
        endYear,
        endMonth,
        1,
        MTG4_OFFSET_HOURS, 0, 0, 0
    ));

    // End of the month is 1 ms before the start of the next month
    const end = new Date(startOfNextMonth.getTime() - 1);

    return { start, end };
}

/**
 * Return only start of month Date object
 */
export function getStartOfMonthMTG4(date?: Date | string): Date {
    return getStartAndEndOfMonth(date).start;
}
