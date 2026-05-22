// Timezone utility to handle India Standard Time (IST, UTC+5.5) independently of server timezone

const getISTDateComponents = (date = new Date()) => {
  const istTime = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
  return {
    year: istTime.getUTCFullYear(),
    month: istTime.getUTCMonth(),
    date: istTime.getUTCDate(),
    hour: istTime.getUTCHours(),
    minute: istTime.getUTCMinutes(),
    second: istTime.getUTCSeconds(),
    millisecond: istTime.getUTCMilliseconds(),
    dayName: istTime.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
  };
};

const createDateFromIST = (year, month, dateNum, hour, minute, second = 0, millisecond = 0) => {
  const utcDate = new Date(Date.UTC(year, month, dateNum, hour, minute, second, millisecond));
  return new Date(utcDate.getTime() - (5.5 * 60 * 60 * 1000));
};

const getStartOfDayIST = (date = new Date()) => {
  const ist = getISTDateComponents(date);
  return createDateFromIST(ist.year, ist.month, ist.date, 0, 0, 0, 0);
};

const getEndOfDayIST = (date = new Date()) => {
  const ist = getISTDateComponents(date);
  return createDateFromIST(ist.year, ist.month, ist.date, 23, 59, 59, 999);
};

module.exports = {
  getISTDateComponents,
  createDateFromIST,
  getStartOfDayIST,
  getEndOfDayIST
};
