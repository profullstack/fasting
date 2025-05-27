import { getTimezone } from './lib/config.js';

// Test with a known UTC timestamp
const testTimestamp = '2024-05-26T18:03:00.000Z'; // 6:03 PM UTC
const date = new Date(testTimestamp);

console.log('Test timestamp (UTC):', testTimestamp);
console.log('Date object:', date);
console.log('Date.getTime():', date.getTime());
console.log('Date.toISOString():', date.toISOString());

const timezone = getTimezone();
console.log('Configured timezone:', timezone);

// Test the current formatTimeString logic
const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: timezone,
  hour: 'numeric',
  minute: 'numeric',
  hour12: true
});

console.log('Formatter result:', formatter.format(date));
console.log('Formatter parts:', formatter.formatToParts(date));

// Test with different timezone explicitly
const pacificFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles',
  hour: 'numeric',
  minute: 'numeric',
  hour12: true
});

console.log('Pacific formatter result:', pacificFormatter.format(date));
console.log('Pacific formatter parts:', pacificFormatter.formatToParts(date));

// Test system timezone
console.log('System timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);