/**
 * Pure Business Logic Module for Sales Analytics
 * Zero UI dependencies. All date calculations strictly in UTC.
 * Financial arithmetic rounded to integer cents at boundaries to avoid IEEE 754 drift.
 */

// --- Financial Arithmetic ---

function toCents(dollarAmount) {
  if (dollarAmount === null || dollarAmount === undefined || isNaN(Number(dollarAmount))) {
    return 0;
  }
  return Math.round(Number(dollarAmount) * 100);
}

function toDollars(cents) {
  if (cents === null || cents === undefined || isNaN(Number(cents))) {
    return 0;
  }
  return Number((Number(cents) / 100).toFixed(2));
}

function calculateRevenue(quantity, unitPrice) {
  const qty = parseInt(String(quantity), 10) || 0;
  if (qty <= 0) return 0;
  const priceInCents = toCents(unitPrice);
  return toDollars(qty * priceInCents);
}

function calculateCost(quantity, unitCost) {
  const qty = parseInt(String(quantity), 10) || 0;
  if (qty <= 0) return 0;
  const costInCents = toCents(unitCost);
  return toDollars(qty * costInCents);
}

function calculateProfit(revenue, cost) {
  const revCents = toCents(revenue);
  const costCents = toCents(cost);
  return toDollars(revCents - costCents);
}

function calculateProfitMargin(revenue, profit) {
  const revCents = toCents(revenue);
  const profCents = toCents(profit);
  if (revCents <= 0) return 0;
  const marginPct = (profCents / revCents) * 100;
  return Number(marginPct.toFixed(2));
}

function calculatePercentageChange(current, previous) {
  const currCents = toCents(current);
  const prevCents = toCents(previous);

  if (prevCents === 0) {
    if (currCents > 0) return 100;
    if (currCents < 0) return -100;
    return 0;
  }

  const change = ((currCents - prevCents) / Math.abs(prevCents)) * 100;
  return Number(change.toFixed(1));
}

function formatCurrency(amount, options = {}) {
  const val = Number(amount) || 0;
  const maxDigits = options.maximumFractionDigits !== undefined ? options.maximumFractionDigits : 2;
  const minDigits =
    options.minimumFractionDigits !== undefined
      ? Math.min(options.minimumFractionDigits, maxDigits)
      : Math.min(2, maxDigits);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits
  }).format(val);
}

// --- Date Handling (Strictly UTC) ---

function isValidIsoDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Calendar validity check in UTC
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return (
    dateObj.getUTCFullYear() === year &&
    dateObj.getUTCMonth() === month - 1 &&
    dateObj.getUTCDate() === day
  );
}

function parseUtcDate(dateStr) {
  if (!isValidIsoDate(dateStr)) {
    throw new Error(`Invalid ISO date format (expected YYYY-MM-DD): "${dateStr}"`);
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatUtcDate(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid Date object provided to formatUtcDate');
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetweenUtc(startDateStr, endDateStr) {
  const start = parseUtcDate(startDateStr);
  const end = parseUtcDate(endDateStr);
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
}

function addDaysUtc(dateStr, days) {
  const date = parseUtcDate(dateStr);
  const newDate = new Date(date.getTime() + days * MS_PER_DAY);
  return formatUtcDate(newDate);
}

function getPriorDateRange(startDateStr, endDateStr) {
  if (!isValidIsoDate(startDateStr) || !isValidIsoDate(endDateStr)) {
    throw new Error('Valid startDate and endDate strings in YYYY-MM-DD format are required');
  }
  const durationDays = daysBetweenUtc(startDateStr, endDateStr);
  if (durationDays < 0) {
    throw new Error('startDate cannot be after endDate');
  }

  // Previous window ends 1 day prior to current startDate
  const prevEnd = addDaysUtc(startDateStr, -1);
  const prevStart = addDaysUtc(prevEnd, -durationDays);

  return { prevStart, prevEnd, durationDays };
}

function getRollingRange(preset, anchorDateStr) {
  const anchor = isValidIsoDate(anchorDateStr) ? anchorDateStr : formatUtcDate(new Date());

  if (preset === '30d') {
    return {
      startDate: addDaysUtc(anchor, -29),
      endDate: anchor
    };
  }
  if (preset === '90d') {
    return {
      startDate: addDaysUtc(anchor, -89),
      endDate: anchor
    };
  }
  if (preset === '12m') {
    return {
      startDate: addDaysUtc(anchor, -364),
      endDate: anchor
    };
  }
  return {
    startDate: '',
    endDate: ''
  };
}

function formatPeriodLabel(periodKey, range) {
  if (!periodKey || typeof periodKey !== 'string') return '';

  if (range === 'monthly') {
    const parts = periodKey.split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const d = new Date(Date.UTC(year, month - 1, 1));
      return d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', year: 'numeric' });
    }
  }

  if (range === 'weekly') {
    const parts = periodKey.split('-W');
    if (parts.length === 2) {
      return `W${parts[1]} '${parts[0].slice(2)}`;
    }
  }

  if (isValidIsoDate(periodKey)) {
    const d = parseUtcDate(periodKey);
    return d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
  }

  return periodKey;
}

// --- Ranking & Badging ---

function assignProductBadges(products = []) {
  if (!Array.isArray(products) || products.length === 0) {
    return [];
  }

  // Sort by revenue descending
  const sorted = [...products].sort(
    (a, b) => (Number(b.totalRevenue) || 0) - (Number(a.totalRevenue) || 0)
  );
  const topCount = Math.max(1, Math.ceil(sorted.length * 0.25));
  const bottomThreshold = Math.max(1, Math.floor(sorted.length * 0.25));

  const topIds = new Set(sorted.slice(0, topCount).map(p => p.id));
  const bottomIds = new Set(sorted.slice(sorted.length - bottomThreshold).map(p => p.id));

  return products.map(p => {
    let badge = 'Moderate';
    if (topIds.has(p.id)) {
      badge = 'Best Seller';
    } else if (bottomIds.has(p.id)) {
      badge = 'Slow Mover';
    }
    return {
      ...p,
      badge
    };
  });
}

const analytics = {
  toCents,
  toDollars,
  calculateRevenue,
  calculateCost,
  calculateProfit,
  calculateProfitMargin,
  calculatePercentageChange,
  formatCurrency,
  isValidIsoDate,
  parseUtcDate,
  formatUtcDate,
  daysBetweenUtc,
  addDaysUtc,
  getPriorDateRange,
  getRollingRange,
  formatPeriodLabel,
  assignProductBadges
};

export {
  toCents,
  toDollars,
  calculateRevenue,
  calculateCost,
  calculateProfit,
  calculateProfitMargin,
  calculatePercentageChange,
  formatCurrency,
  isValidIsoDate,
  parseUtcDate,
  formatUtcDate,
  daysBetweenUtc,
  addDaysUtc,
  getPriorDateRange,
  getRollingRange,
  formatPeriodLabel,
  assignProductBadges,
  analytics as default
};
