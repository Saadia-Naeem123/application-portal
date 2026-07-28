const PRIORITY = Object.freeze({
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
});

const ALL_PRIORITIES = Object.values(PRIORITY);

module.exports = { PRIORITY, ALL_PRIORITIES };
