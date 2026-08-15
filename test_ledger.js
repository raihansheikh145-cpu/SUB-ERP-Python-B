const rows = [];
const isPrincipalLine = true;
const isInterestLine = undefined;
rows.push({
  isInterest: isInterestLine && !isPrincipalLine
});
console.log(rows);
rows.sort((a, b) => {
  if (a.isInterest && !b.isInterest) return 1;
  if (!a.isInterest && b.isInterest) return -1;
  return 0;
});
console.log(rows);
