const msgs = [
  { id: '1', date: 'Jul 19, 2026, 11:17:25 AM' },
  { id: '2', date: '2026-07-19T05:17:39.012Z' },
  { id: '3' }
];
console.log(msgs.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
