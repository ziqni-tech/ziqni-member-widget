import moment from 'moment';
import { formatDateTime } from '../../utils/formatDateTime';

/**
 * Calculates time remaining and status labels for the MiniScoreBoard.
 * @param {Object} lbWidgetSettings - Settings from the lbWidget.
 * @param {Object} msSettings - Settings from the MiniScoreBoard.
 * @param {Function} clearIntervalCallback - Callback to clear the interval.
 * @returns {Object} { label, diff, date, dateObj, inverse }
 */
export const manageTime = (lbWidgetSettings, msSettings, clearIntervalCallback) => {
  const { competition, translation } = lbWidgetSettings;
  const activeCompetition = competition.activeCompetition;
  const activeContest = competition.activeContest;

  let diff = 0;
  let label = '&nbsp;';
  let date = '';
  let dateObj = '';
  let inverse = false;

  if (activeCompetition && activeCompetition.statusCode === 15) {
    const startDate = activeCompetition.scheduledStartDate;
    diff = moment(startDate).diff(moment());

    label = translation.miniLeaderboard.startsIn;
    date = formatDateTime(moment.duration(diff), translation.time);
    dateObj = date;
    inverse = false;

    if (diff <= 0 && !msSettings.timeManagementInterval) {
      msSettings.timeManagementInterval = setTimeout(() => {
        lbWidgetSettings.lbWidget.activeDataRefresh(() => { clearIntervalCallback(); });
      }, 5000);
    }
  } else if (activeContest !== null) {
    const startDate = activeContest.actualStart || activeContest.scheduledStart;

    diff = moment(startDate).diff(moment());
    label = translation.miniLeaderboard.startsIn;
    date = formatDateTime(moment.duration(diff), translation.time);
    dateObj = date;
    inverse = false;

    if (diff <= 0 && activeContest.statusCode < 25) {
      label = translation.miniLeaderboard.starting;
      date = '';
    } else if (activeContest.statusCode === 25) {
      diff = moment(activeContest.scheduledEndDate).diff(moment());
      dateObj = formatDateTime(moment.duration(diff), translation.time);
      label = '&nbsp;';
      date = dateObj;
      if (diff <= 0) {
        label = translation.tournaments.finishing;
        date = '';
      }
      inverse = true;
    } else if (activeContest.statusCode === 30) {
      label = translation.miniLeaderboard.finishing;
      date = '';
      inverse = true;
    } else if (activeContest.statusCode >= 35) {
      label = translation.miniLeaderboard.finished;
      date = '';
      inverse = true;
    } else if (diff <= 0) {
      label = translation.tournaments.finished;
      date = '';
    }
  }

  return { label, diff, date, dateObj, inverse };
};
