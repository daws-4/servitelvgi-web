
/**
 * Formats a date to Venezuela time (GMT-4) in the format DD/MM/YYYY HH:MM
 * Used for Netuno sync and reports.
 * 
 * Logic:
 * 1. Takes a Date object (absolute time).
 * 2. Adds -4 hours to the timestamp.
 * 3. Reads the UTC components of the resulting shifted time.
 * 
 * Example:
 * Input: 12:00 UTC
 * Shifted: 08:00 UTC
 * Output: "08:00" (Correct for VET)
 */
export function formatDateToVenezuela(date: Date | string): string {
    const d = new Date(date);

    // Venezuela is GMT-4
    const offset = -4 * 60; // minutes
    const localTime = new Date(d.getTime() + offset * 60 * 1000);

    const day = String(localTime.getUTCDate()).padStart(2, '0');
    const month = String(localTime.getUTCMonth() + 1).padStart(2, '0');
    const year = localTime.getUTCFullYear();
    const hours = String(localTime.getUTCHours()).padStart(2, '0');
    const minutes = String(localTime.getUTCMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}
