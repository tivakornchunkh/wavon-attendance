/**
 * Helper to get current date and time in Thailand (Asia/Bangkok, UTC+7).
 * Works consistently across Windows local dev, Docker, and UTC Linux servers (Render).
 */
export function getBangkokDateTime(): {
  dateStr: string;
  timeStr: string;
  hours: number;
  minutes: number;
  currentMinutes: number;
  dayOfWeek: number;
} {
  const now = new Date();
  const thFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = thFormatter.formatToParts(now);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '00';

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  let hourStr = getPart('hour');
  if (hourStr === '24') hourStr = '00';
  const minuteStr = getPart('minute');

  const hours = parseInt(hourStr, 10);
  const minutes = parseInt(minuteStr, 10);
  const currentMinutes = hours * 60 + minutes;
  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${hourStr.padStart(2, '0')}:${minuteStr.padStart(2, '0')}`;

  const bkkDate = new Date(`${dateStr}T${timeStr}:00+07:00`);
  const dayOfWeek = bkkDate.getDay();

  return { dateStr, timeStr, hours, minutes, currentMinutes, dayOfWeek };
}
