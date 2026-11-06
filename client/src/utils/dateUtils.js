/**
 * Date and Time Utilities for SIM Farmasi Klinik Almedika
 * Ensures 100% accurate synchronization with real Indonesian Western Time (WIB / Asia/Jakarta, UTC+7).
 */

/**
 * Safely parse a date string from server/SQLite.
 * SQLite CURRENT_TIMESTAMP returns UTC as "YYYY-MM-DD HH:MM:SS" without a 'Z' suffix.
 * When parsed directly by new Date(str), browsers treat it as local time, causing a 7-hour discrepancy.
 */
export function parseServerDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  
  let str = String(dateStr).trim();
  if (!str) return null;

  // If SQLite space-separated "YYYY-MM-DD HH:MM:SS" without timezone indicator
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(str)) {
    str = str.replace(' ', 'T') + 'Z';
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format time in WIB (e.g. "17:09 WIB" or "17:09:30 WIB")
 */
export function formatTimeWIB(dateStr, includeSeconds = false) {
  const d = parseServerDate(dateStr);
  if (!d) return '-';

  const timeString = d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    timeZone: 'Asia/Jakarta'
  }).replace('.', ':');

  return `${timeString} WIB`;
}

/**
 * Format date in Indonesian locale (e.g. "6 Nov 2026" or "Jumat, 6 November 2026")
 */
export function formatDateID(dateStr, format = 'short') {
  const d = parseServerDate(dateStr);
  if (!d) return '-';

  if (format === 'full') {
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta'
    });
  }

  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  });
}

/**
 * Format date and time in WIB (e.g. "06/11/2026, 17:09 WIB")
 */
export function formatDateTimeWIB(dateStr) {
  const d = parseServerDate(dateStr);
  if (!d) return '-';

  const datePart = d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  });

  const timePart = d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  }).replace('.', ':');

  return `${datePart} · ${timePart} WIB`;
}

/**
 * Calculate accurate relative time difference ("Baru saja", "5 mnt lalu", "1 jam lalu")
 */
export function timeAgo(dateStr) {
  const d = parseServerDate(dateStr);
  if (!d) return '-';

  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 15) return 'Baru saja';
  if (diffSec < 60) return `${diffSec} dtk lalu`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} jam lalu`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} hari lalu`;
}

/**
 * Return current local date in YYYY-MM-DD (Asia/Jakarta)
 */
export function getCurrentLocalDateString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}
