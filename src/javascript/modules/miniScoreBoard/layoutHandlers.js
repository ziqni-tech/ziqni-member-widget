import query from '../../utils/query';
import addClass from '../../utils/addClass';
import removeClass from '../../utils/removeClass';
import remove from '../../utils/remove';
import cloneDeep from 'lodash.clonedeep';
import moment from 'moment';
import { formatDateTime } from '../../utils/formatDateTime';
import { DEFAULT_LAYOUT, FIRST_TO_LAYOUT, SUM_BEST_LAYOUT, OPTIN_LAYOUT, MINI_SCOREBOARD_CLASSES } from './constants';

export const updateCommonElements = (container, selectorsMapping) => {
  Object.entries(selectorsMapping).forEach(([selector, value]) => {
    const element = query(container, selector);
    if (element) {
      element.innerHTML = value;
    }
  });
};

export const createDefaultEntry = () => {
  const entry = document.createElement('div');
  entry.className = 'cl-widget-ms-default-mem-entry';
  entry.innerHTML = `
    <div class="cl-widget-ms-default-mem-rank"></div>
    <div class="cl-widget-ms-default-mem-label"></div>
    <div class="cl-widget-ms-default-mem-points"></div>
  `;
  return entry;
};

export const createFirstToEntry = () => {
  const entry = document.createElement('div');
  entry.className = 'cl-widget-ms-first-to-mem-entry';
  entry.innerHTML = `
    <div class="cl-widget-ms-first-to-mem-label"></div>
    <div class="cl-widget-ms-first-to-mem-rank"></div>
    <div class="cl-widget-ms-first-to-mem-icon"><img class="cl-widget-ms-first-to-mem-img" style="display:none" /></div>
    <div class="cl-widget-ms-first-to-mem-points"></div>
  `;
  return entry;
};

export const showInfoContainer = (infoContainer) => {
  const msContainer = document.querySelector(`.${MINI_SCOREBOARD_CLASSES.WRAPPER}`);
  if (msContainer) removeClass(msContainer, MINI_SCOREBOARD_CLASSES.HIDE);
  setTimeout(() => addClass(infoContainer, MINI_SCOREBOARD_CLASSES.SHOW), 200);
};

export const removeUnusedElements = (container) => {
  const wrappers = [
        `.${DEFAULT_LAYOUT.WRAPPER}`,
        `.${OPTIN_LAYOUT.WRAPPER}`,
        `.${SUM_BEST_LAYOUT.WRAPPER}`,
        `.${FIRST_TO_LAYOUT.WRAPPER}`
  ];
  const styles = [
    DEFAULT_LAYOUT.STYLE,
    OPTIN_LAYOUT.STYLE,
    SUM_BEST_LAYOUT.STYLE,
    FIRST_TO_LAYOUT.STYLE
  ];

  styles.forEach(s => removeClass(container, s));
  wrappers.forEach(w => {
    const el = query(container, w);
    if (el) remove(el);
  });
};

export const layoutDefaultOrEmptySingleRow = (lbEntry, lbWidgetSettings) => {
  const { translation, member, leaderboard } = lbWidgetSettings;
  const isSelf = lbEntry.members && lbEntry.members.some(m => m.memberRefId === member.memberRefId);
  const formattedPoints = leaderboard.pointsFormatter(lbEntry.score);

  const row = createDefaultEntry();
  if (isSelf) addClass(row, DEFAULT_LAYOUT.SELF_MEMBER);

  query(row, '.cl-widget-ms-default-mem-label').innerHTML = isSelf ? `(${translation.leaderboard.you})` : '';
  query(row, '.cl-widget-ms-default-mem-rank').innerHTML = `<span class='cl-mem-rank-label'>${translation.leaderboard.rank}</span><span class='cl-mem-rank cl-mem-rank-${lbEntry.rank}'>${lbEntry.rank}</span>`;
  query(row, '.cl-widget-ms-default-mem-points').innerHTML = `<span class='cl-mem-points-label'>${translation.leaderboard.points}</span><span class='cl-mem-points'>${formattedPoints}</span>`;

  return row;
};

export const layoutDefaultOrEmpty = (instance, timeMgmt) => {
  const { infoContainer, container, lbWidget } = instance.settings;
  const { translation, leaderboard, member } = lbWidget.settings;

  let defaultDomObj = query(container, `.${DEFAULT_LAYOUT.WRAPPER}`);

  if (defaultDomObj === null) {
    removeUnusedElements(container);
    addClass(container, DEFAULT_LAYOUT.STYLE);

    defaultDomObj = document.createElement('div');
    defaultDomObj.className = DEFAULT_LAYOUT.WRAPPER;
    defaultDomObj.innerHTML = `
      <div class="${DEFAULT_LAYOUT.DATE_WRAPPER} ${DEFAULT_LAYOUT.DATE_ONLY}">
        <div class="${DEFAULT_LAYOUT.DATE_LABEL}">${timeMgmt.label}</div>
        <div class="${DEFAULT_LAYOUT.DATE}">${timeMgmt.date}</div>
      </div>
      <div class="cl-widget-ms-default-results-wrapper">
        <div class="cl-widget-ms-default-results-headers">
          <div class="cl-widget-ms-default-results-header-rank">${translation.leaderboard.rank}</div>
          <div class="cl-widget-ms-default-results-header-points">${translation.leaderboard.points}</div>
        </div>
        <div class="${DEFAULT_LAYOUT.RESULTS_LIST}"></div>
      </div>
    `;

    infoContainer.appendChild(defaultDomObj);
    showInfoContainer(infoContainer);
  } else {
    updateCommonElements(container, {
      '.cl-widget-ms-default-results-header-rank': translation.leaderboard.rank,
      '.cl-widget-ms-default-results-header-points': translation.leaderboard.points,
      [`.${DEFAULT_LAYOUT.DATE_LABEL}`]: timeMgmt.label,
      [`.${DEFAULT_LAYOUT.DATE}`]: timeMgmt.date
    });
    showInfoContainer(infoContainer);
  }

  let leaderboardData = cloneDeep(leaderboard.leaderboardData);
  if (leaderboard.miniScoreBoard.enableRankings) {
    const selfIdx = leaderboardData.findIndex(entry => entry.members && entry.members.some(m => m.memberRefId === member.memberRefId));
    if (selfIdx !== -1) {
      const count = leaderboard.miniScoreBoard.rankingsCount;
      leaderboardData = leaderboardData.slice(Math.max(0, selfIdx - count), selfIdx + count + 1);
    } else {
      leaderboardData = [];
    }
  }

  const scoreArea = query(defaultDomObj, `.${DEFAULT_LAYOUT.RESULTS_LIST}`);
  scoreArea.innerHTML = '';

  leaderboardData.forEach(lbEntry => {
    const row = layoutDefaultOrEmptySingleRow(lbEntry, lbWidget.settings);
    scoreArea.appendChild(row);
  });

  if (timeMgmt.inverse) addClass(defaultDomObj, MINI_SCOREBOARD_CLASSES.INVERSE);
};

export const layoutFirstToOrEmptySingleRow = (lbEntry, strategy, lbWidgetSettings) => {
  const { translation, member, leaderboard } = lbWidgetSettings;
  const isSelf = lbEntry.members && lbEntry.members.some(m => m.memberRefId === member.memberRefId);
  const formattedPoints = leaderboard.pointsFormatter(lbEntry.score);

  const row = createFirstToEntry();
  if (isSelf) addClass(row, FIRST_TO_LAYOUT.SELF_MEMBER);

  query(row, '.cl-widget-ms-first-to-mem-label').innerHTML = isSelf ? translation.leaderboard.you : '';
  query(row, '.cl-widget-ms-first-to-mem-rank').innerHTML = `<span class='cl-mem-rank-label'>${translation.leaderboard.rank}</span><span class='cl-mem-rank'>${lbEntry.rank}</span>`;
  query(row, '.cl-widget-ms-first-to-mem-points').innerHTML = `<span class='cl-mem-points-label'>${translation.leaderboard.points}</span><span class='cl-mem-points'>${formattedPoints}/${strategy.scoringStrategy.recordTimeWhenSumReaches}</span>`;

  return row;
};

export const layoutFirstToOrEmpty = (instance, strategy, timeMgmt) => {
  const { infoContainer, container, lbWidget } = instance.settings;
  const { translation, leaderboard, member } = lbWidget.settings;

  let firstToDomObj = query(container, `.${FIRST_TO_LAYOUT.WRAPPER}`);

  if (firstToDomObj === null) {
    removeUnusedElements(container);
    addClass(container, FIRST_TO_LAYOUT.STYLE);

    firstToDomObj = document.createElement('div');
    firstToDomObj.className = FIRST_TO_LAYOUT.WRAPPER;
    firstToDomObj.innerHTML = `
      <div class="${FIRST_TO_LAYOUT.DATE_WRAPPER} ${FIRST_TO_LAYOUT.DATE_ONLY}">
        <div class="cl-widget-ms-first-to-date-label"></div>
        <div class="cl-widget-ms-first-to-date">${timeMgmt.label}</div>
      </div>
      <div class="cl-widget-ms-first-to-results-wrapper">
        <div class="cl-widget-ms-first-to-results-headers">
          <div class="cl-widget-ms-first-to-results-header-rank">${translation.leaderboard.rank}</div>
          <div class="cl-widget-ms-first-to-results-header-points">${translation.leaderboard.points}</div>
        </div>
        <div class="${FIRST_TO_LAYOUT.RESULTS_LIST}"></div>
      </div>
    `;
    infoContainer.appendChild(firstToDomObj);
    showInfoContainer(infoContainer);
  } else {
    updateCommonElements(container, {
      '.cl-widget-ms-first-to-results-header-rank': translation.leaderboard.rank,
      '.cl-widget-ms-first-to-results-header-points': translation.leaderboard.points,
      '.cl-widget-ms-first-to-date-label': timeMgmt.label,
      '.cl-widget-ms-first-to-date': timeMgmt.date
    });
    showInfoContainer(infoContainer);
  }

  const scoreArea = query(firstToDomObj, `.${FIRST_TO_LAYOUT.RESULTS_LIST}`);
  scoreArea.innerHTML = '';

  const lbData = leaderboard.leaderboardData;
  lbData.forEach(lbEntry => {
    const isSelf = lbEntry.members.some(m => m.memberRefId === member.memberRefId);
    if (leaderboard.miniScoreBoard.enableRankings || isSelf) {
      scoreArea.appendChild(layoutFirstToOrEmptySingleRow(lbEntry, strategy, lbWidget.settings));
    }
  });

  if (timeMgmt.inverse) addClass(firstToDomObj, MINI_SCOREBOARD_CLASSES.INVERSE);
};

export const layoutSumBestOf = (instance, timeMgmt) => {
  const { infoContainer, container, lbWidget } = instance.settings;
  const { translation, leaderboard, member } = lbWidget.settings;

  let sumBestDomObj = query(container, `.${SUM_BEST_LAYOUT.WRAPPER}`);

  const dateLabel = (timeMgmt.date.length > 0) ? timeMgmt.date : timeMgmt.label;
  const dateText = (timeMgmt.date.length > 0) ? translation.miniLeaderboard.rank : '';

  if (sumBestDomObj === null) {
    removeUnusedElements(container);
    sumBestDomObj = document.createElement('div');
    sumBestDomObj.className = SUM_BEST_LAYOUT.WRAPPER;
    sumBestDomObj.innerHTML = `
      <div class="cl-widget-ms-sum-best-date-wrapper">
        <div class="${SUM_BEST_LAYOUT.DATE_LABEL}">${dateLabel}</div>
        <div class="${SUM_BEST_LAYOUT.DATE}">${dateText}</div>
      </div>
      <div class="cl-widget-ms-sum-best-results-wrapper">
        <div class="cl-widget-ms-sum-best-area">
          <div class="cl-widget-ms-sum-best-high-area">
            <div class="${SUM_BEST_LAYOUT.HIGH_LABEL}">${translation.miniLeaderboard.highScore}</div>
            <div class="${SUM_BEST_LAYOUT.HIGH_SCORE}">--</div>
          </div>
          <div class="cl-widget-ms-sum-best-last-area">
            <div class="${SUM_BEST_LAYOUT.LAST_LABEL}">${translation.miniLeaderboard.lastScore}</div>
            <div class="${SUM_BEST_LAYOUT.LAST_SCORE}">--</div>
          </div>
        </div>
        <div class="cl-widget-ms-sum-best-rank-area">
          <span class="${SUM_BEST_LAYOUT.RANK_VALUE}">--</span>
        </div>
      </div>
    `;
    infoContainer.appendChild(sumBestDomObj);
    showInfoContainer(infoContainer);
  } else {
    updateCommonElements(container, {
      [`.${SUM_BEST_LAYOUT.HIGH_LABEL}`]: translation.miniLeaderboard.highScore,
      [`.${SUM_BEST_LAYOUT.LAST_LABEL}`]: translation.miniLeaderboard.lastScore,
      [`.${SUM_BEST_LAYOUT.DATE_LABEL}`]: dateLabel,
      [`.${SUM_BEST_LAYOUT.DATE}`]: dateText
    });
    showInfoContainer(infoContainer);
  }

  const lbEntry = leaderboard.leaderboardData.find(entry => entry.members.some(m => m.memberRefId === member.memberRefId));
  if (lbEntry) {
    const lastScoreEl = query(container, `.${SUM_BEST_LAYOUT.LAST_SCORE}`);
    const highScoreEl = query(container, `.${SUM_BEST_LAYOUT.HIGH_SCORE}`);
    const rankEl = query(container, `.${SUM_BEST_LAYOUT.RANK_VALUE}`);

    const currentLast = lastScoreEl.innerHTML;
    const currentHigh = highScoreEl.innerHTML;
    const formattedPoints = leaderboard.pointsFormatter(lbEntry.score);

    if (currentLast !== String(lbEntry.score) && String(lbEntry.score) !== currentHigh) {
      lastScoreEl.innerHTML = currentHigh;
    }
    highScoreEl.innerHTML = formattedPoints;

    const change = (lbEntry.change < 0) ? 'down' : (lbEntry.change > 0 ? 'up' : 'same');
    removeClass(rankEl, 'cl-ms-rank-up', 'cl-ms-rank-down', 'cl-ms-rank-same');
    addClass(rankEl, `cl-ms-rank-${change}`);
    rankEl.innerHTML = lbEntry.rank;
  }

  if (timeMgmt.inverse) addClass(sumBestDomObj, MINI_SCOREBOARD_CLASSES.INVERSE);
};

export const layoutRequiresOptIn = (instance, isProcessing = false) => {
  const { lbWidget, infoContainer, container } = instance.settings;
  const { activeContest } = lbWidget.settings.competition;
  const { translation } = lbWidget.settings;
  if (!activeContest) return;

  const startDate = activeContest.actualStartDate || activeContest.scheduledStartDate;
  const diff = moment(startDate).diff(moment());
  let label = translation.miniLeaderboard.startsIn;
  let date = formatDateTime(moment.duration(diff), translation.time);

  if (diff <= 0) {
    if (activeContest.statusCode === 15 || activeContest.statusCode === 20) {
      label = translation.miniLeaderboard.starting;
      date = '';
    } else if (activeContest.statusCode === 25) {
      const endDiff = moment(activeContest.scheduledEndDate).diff(moment());
      label = translation.miniLeaderboard.started;
      date = endDiff > 0 ? formatDateTime(moment.duration(endDiff), translation.time) : '';
      if (endDiff <= 0) label = translation.tournaments.finishing;
    } else if (activeContest.statusCode === 30) {
      label = translation.miniLeaderboard.finishing;
      date = '';
    } else if (activeContest.statusCode >= 35) {
      label = translation.miniLeaderboard.finished;
      date = '';
    }
  }

  let optInWrapper = query(container, `.${OPTIN_LAYOUT.WRAPPER}`);
  const actionText = isProcessing ? translation.tournaments.processing : translation.tournaments.enter;

  if (optInWrapper === null) {
    removeUnusedElements(container);
    optInWrapper = document.createElement('div');
    optInWrapper.className = OPTIN_LAYOUT.WRAPPER;
    optInWrapper.innerHTML = `
      <div class="cl-widget-ms-optin-date-wrapper">
        <div class="${OPTIN_LAYOUT.DATE_LABEL}">${label}</div>
        <div class="${OPTIN_LAYOUT.DATE}">${date}</div>
      </div>
      <div class="cl-widget-ms-optin-action-wrapper">
        <a class="${OPTIN_LAYOUT.ACTION} ${isProcessing ? OPTIN_LAYOUT.CHECKING : ''}">${actionText}</a>
      </div>
    `;
    infoContainer.appendChild(optInWrapper);
    showInfoContainer(infoContainer);
  } else {
    updateCommonElements(container, {
      [`.${OPTIN_LAYOUT.DATE_LABEL}`]: label,
      [`.${OPTIN_LAYOUT.DATE}`]: date,
      [`.${OPTIN_LAYOUT.ACTION}`]: actionText
    });
    const actionBtn = query(container, `.${OPTIN_LAYOUT.ACTION}`);
    if (isProcessing) addClass(actionBtn, OPTIN_LAYOUT.CHECKING); else removeClass(actionBtn, OPTIN_LAYOUT.CHECKING);
    showInfoContainer(infoContainer);
  }
};
