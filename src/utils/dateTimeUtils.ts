const DEFAULT_DISPLAY_TIMEZONE = "America/Edmonton";

export function getDisplayTimezone(): string {
    return import.meta.env.VITE_DISPLAY_TIMEZONE || DEFAULT_DISPLAY_TIMEZONE;
}

/**
 * Parses a Java Instant (ISO 8601 UTC string) to a JavaScript Date.
 *
 * @param instant - ISO 8601 string from backend (e.g., "2024-12-15T10:30:00Z")
 * @returns Date object, or null if invalid
 *
 * @example
 * parseInstant("2024-12-15T10:30:00Z") // Date object
 * parseInstant(null) // null
 */
export function parseInstant(instant: string | null): Date | null {

    if (!instant) return null;
    const date = new Date(instant);

    return isNaN(date.getTime()) ? null : date;

}

/**
 * Formats a Date object as an ISO 8601 UTC string for backend submission.
 *
 * @param date - Date to format
 * @returns ISO 8601 UTC string (e.g., "2024-12-15T10:30:00Z")
 *
 * @example
 * formatInstantForBackend(new Date()) // "2024-12-15T18:30:00Z"
 */
export function formatInstantForBackend(date: Date): string {
    return date.toISOString();
}

/**
 * Formats a Date object for display in the configured timezone.
 *
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions (optional)
 * @returns Formatted string in display timezone
 *
 * @example
 * formatInstantForDisplay(new Date("2024-12-15T18:30:00Z"))
 * // "Dec 15, 2024, 11:30 AM" (in Edmonton time, MST UTC-7)
 *
 * formatInstantForDisplay(new Date(), { dateStyle: "short", timeStyle: "short" })
 * // "12/15/24, 11:30 AM"
 */
export function formatInstantForDisplay(
    date: Date | null,
    options?: Intl.DateTimeFormatOptions
): string {

    if (!date) return "";

    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
        ...options,
    };

    return new Intl.DateTimeFormat("en-US", {
        ...defaultOptions,
        timeZone: getDisplayTimezone(),
    }).format(date);

}

/**
 * Compares two Instant values for equality.
 * Instants are equal if they represent the same moment in time (timezone-agnostic).
 *
 * @param instant1 - First instant string or Date
 * @param instant2 - Second instant string or Date
 * @returns true if instants represent the same moment
 *
 * @example
 * compareInstants("2024-12-15T18:30:00Z", "2024-12-15T11:30:00-07:00") // true (same moment)
 * compareInstants("2024-12-15T18:30:00Z", "2024-12-15T19:30:00Z") // false
 */
export function compareInstants(
    instant1: string | Date | null,
    instant2: string | Date | null
): boolean {

    if (instant1 === null && instant2 === null) return true;
    if (instant1 === null || instant2 === null) return false;

    const date1 = typeof instant1 === "string" ? parseInstant(instant1) : instant1;
    const date2 = typeof instant2 === "string" ? parseInstant(instant2) : instant2;

    if (!date1 || !date2) return false;

    return date1.getTime() === date2.getTime();

}

/**
 * Parses a Java LocalTime string to hours, minutes, seconds.
 *
 * @param localTime - Time string from backend (e.g., "14:30:00" or "14:30:00.123")
 * @returns Object with hours, minutes, seconds, or null if invalid
 *
 * @example
 * parseLocalTime("14:30:00") // { hours: 14, minutes: 30, seconds: 0 }
 * parseLocalTime("09:15:30.500") // { hours: 9, minutes: 15, seconds: 30 }
 */
export function parseLocalTime(localTime: string | null): {
    hours: number;
    minutes: number;
    seconds: number;
} | null {

    if (!localTime) return null;

    const match = localTime.match(/^(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/);
    if (!match) return null;

    return {
        hours: parseInt(match[1], 10),
        minutes: parseInt(match[2], 10),
        seconds: parseInt(match[3], 10),
    };

}

/**
 * Formats hours, minutes, seconds as a LocalTime string for backend submission.
 *
 * @param hours - Hour (0-23)
 * @param minutes - Minute (0-59)
 * @param seconds - Second (0-59)
 * @returns LocalTime string (e.g., "14:30:00")
 *
 * @example
 * formatLocalTimeForBackend(14, 30, 0) // "14:30:00"
 * formatLocalTimeForBackend(9, 5, 30) // "09:05:30"
 */
export function formatLocalTimeForBackend(
    hours: number,
    minutes: number,
    seconds: number = 0
): string {

    const pad = (n: number) => String(n).padStart(2, "0");

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

}

/**
 * Formats a LocalTime string for display.
 *
 * @param localTime - LocalTime string from backend
 * @param use24Hour - Use 24-hour format (default: false)
 * @returns Formatted time string
 *
 * @example
 * formatLocalTimeForDisplay("14:30:00") // "2:30 PM"
 * formatLocalTimeForDisplay("14:30:00", true) // "14:30"
 * formatLocalTimeForDisplay("09:05:00") // "9:05 AM"
 */
export function formatLocalTimeForDisplay(
    localTime: string | null,
    use24Hour: boolean = false
): string {

    const parsed = parseLocalTime(localTime);
    if (!parsed) return "";

    if (use24Hour) {
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${pad(parsed.hours)}:${pad(parsed.minutes)}`;
    }

    const hours12 = parsed.hours % 12 || 12;
    const period = parsed.hours >= 12 ? "PM" : "AM";

    return `${hours12}:${String(parsed.minutes).padStart(2, "0")} ${period}`;

}

/**
 * Compares two LocalTime values for equality.
 *
 * @param time1 - First LocalTime string
 * @param time2 - Second LocalTime string
 * @returns true if times are equal (ignoring milliseconds)
 *
 * @example
 * compareLocalTimes("14:30:00", "14:30:00.123") // true
 * compareLocalTimes("14:30:00", "14:31:00") // false
 */
export function compareLocalTimes(
    time1: string | null,
    time2: string | null
): boolean {

    if (time1 === null && time2 === null) return true;
    if (time1 === null || time2 === null) return false;

    const parsed1 = parseLocalTime(time1);
    const parsed2 = parseLocalTime(time2);

    if (!parsed1 || !parsed2) return false;

    return (
        parsed1.hours === parsed2.hours &&
        parsed1.minutes === parsed2.minutes &&
        parsed1.seconds === parsed2.seconds
    );

}

/**
 * Creates a Date object for a specific date and LocalTime in the display timezone.
 * Useful for combining date pickers with time pickers.
 *
 * @param date - Date object (date part will be used)
 * @param localTime - LocalTime string (time part will be used)
 * @returns Date object in display timezone
 *
 * @example
 * combineDateAndLocalTime(new Date("2024-12-15"), "14:30:00")
 * // Date representing Dec 15, 2024 at 2:30 PM in Edmonton time
 */
export function combineDateAndLocalTime(
    date: Date,
    localTime: string
): Date | null {

    const parsed = parseLocalTime(localTime);
    if (!parsed) return null;

    // Create a new Date with the date part from 'date' and time part from 'localTime'
    const combined = new Date(date);
    combined.setHours(parsed.hours, parsed.minutes, parsed.seconds, 0);

    return combined;

}

/**
 * Formats an Instant (ISO 8601 UTC string) for detailed display with abbreviated month name.
 * Format: "{Mon} {day} {year} - {hour}:{minute}:{second}"
 *
 * @param instant - ISO 8601 string from backend (e.g., "2024-12-15T10:30:45Z")
 * @returns Formatted string (e.g., "Dec 15 2024 - 3:30:45") or "—" if null/invalid
 *
 * @example
 * formatInstantDetailed("2024-12-15T18:30:45Z")
 * // "Dec 15 2024 - 11:30:45" (in Edmonton time, MST UTC-7)
 *
 * formatInstantDetailed(null) // "—"
 */
export function formatInstantDetailed(instant: string | null): string {

    if (!instant) return "—";

    const date = parseInstant(instant);
    if (!date) return "—";

    const formatter = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: getDisplayTimezone(),
    });

    const parts = formatter.formatToParts(date);
    const month = parts.find((p) => p.type === "month")?.value ?? "";
    const day = parts.find((p) => p.type === "day")?.value ?? "";
    const year = parts.find((p) => p.type === "year")?.value ?? "";
    const hour = parts.find((p) => p.type === "hour")?.value ?? "";
    const minute = parts.find((p) => p.type === "minute")?.value ?? "";
    const second = parts.find((p) => p.type === "second")?.value ?? "";

    return `${month} ${day} ${year} - ${hour}:${minute}:${second}`;

}
