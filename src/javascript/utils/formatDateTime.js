import formatNumberLeadingZeros from './formatNumberLeadingZeros';

export function formatDateTime (duration, timeLabels) {
  const largeResult = [];
  const result = [];
  if (duration.months()) largeResult.push(duration.months() + '<span class="time-ind">' + timeLabels.months + '</span>');
  if (duration.days()) largeResult.push(duration.days() + '<span class="time-ind">' + timeLabels.days + '</span>');
  if (duration.hours() || duration.days() > 0) {
    result.push(formatNumberLeadingZeros(duration.hours(), 2) + '<span class="time-ind">' + timeLabels.hours + '</span>');
  } else result.push('00<span class="time-ind">' + timeLabels.hours + '</span>');
  if (duration.minutes() || duration.hours() > 0 || duration.days() > 0) {
    result.push(formatNumberLeadingZeros(duration.minutes(), 2) + ((duration.days() > 0) ? '<span class="time-ind">' + timeLabels.minutes + '</span>' : '<span class="time-ind">' + timeLabels.minutesShortHand + '</span>'));
  } else (result.push('00' + ((duration.days() > 0) ? '<span class="time-ind">' + timeLabels.minutes + '</span>' : '<span class="time-ind">' + timeLabels.minutesShortHand + '</span>')));
  result.push(formatNumberLeadingZeros(duration.seconds(), 2) + '<span class="time-ind">' + timeLabels.seconds + '</span>');
  return (largeResult.length > 0) ? (largeResult.join(' ') + ' ' + result.join(':')) : result.join(':');
}

export function formatMissionDateTime (duration, timeLabels) {
  const days = formatNumberLeadingZeros(duration.days(), 2);
  const hours = formatNumberLeadingZeros(duration.hours(), 2);
  const minutes = formatNumberLeadingZeros(duration.minutes(), 2);
  const seconds = formatNumberLeadingZeros(duration.seconds(), 2);

  const daysElem = days + timeLabels.days;
  const hoursElem = hours + timeLabels.hours;
  const minutesElem = minutes + timeLabels.minutes;
  const secondsElem = seconds + timeLabels.seconds;

  return daysElem + ' ' + hoursElem + ' ' + minutesElem + ' ' + secondsElem;
}

export function formatBannerDateTime (duration) {
  const months = formatNumberLeadingZeros(duration.months(), 2);
  const days = formatNumberLeadingZeros(duration.days(), 2);
  const hours = formatNumberLeadingZeros(duration.hours(), 2);
  const minutes = formatNumberLeadingZeros(duration.minutes(), 2);
  const seconds = formatNumberLeadingZeros(duration.seconds(), 2);

  let monthsElem = '';
  if (Number(months[0]) || Number(months[1])) {
    monthsElem = '<div class="banner-months"><div class="banner-date-cell">' + months[0] + '</div><div class="banner-date-cell">' + months[1] + '</div></div>';
  }

  const daysElem = '<div class="banner-days"><div class="banner-date-cell">' + days[0] + '</div><div class="banner-date-cell">' + days[1] + '</div></div>';
  const hoursElem = '<div class="banner-hours"><div class="banner-date-cell">' + hours[0] + '</div><div class="banner-date-cell">' + hours[1] + '</div></div>';
  const minutesElem = '<div class="banner-minutes"><div class="banner-date-cell">' + minutes[0] + '</div><div class="banner-date-cell">' + minutes[1] + '</div></div>';
  const secondsElem = '<div class="banner-seconds"><div class="banner-date-cell">' + seconds[0] + '</div><div class="banner-date-cell">' + seconds[1] + '</div></div>';

  return '<div class="banner-date">' + monthsElem + daysElem + hoursElem + minutesElem + secondsElem + '</div>';
}
