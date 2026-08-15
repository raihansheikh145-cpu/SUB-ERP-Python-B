const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-BD', {
    timeZone: 'Asia/Dhaka',
    hour12: true,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};
console.log(formatDateTime("2025-01-01T12:34:56Z"));
console.log(formatDateTime("2025-01-01"));
