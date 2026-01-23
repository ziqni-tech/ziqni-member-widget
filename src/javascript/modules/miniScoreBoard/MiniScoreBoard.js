import query from '../../utils/query';
import addClass from '../../utils/addClass';
import removeClass from '../../utils/removeClass';
import remove from '../../utils/remove';
import dragElement from '../dragElement';
import { MINI_SCOREBOARD_CLASSES } from './constants';
import { manageTime } from './timeUtils';
import {
  layoutDefaultOrEmpty,
  layoutFirstToOrEmpty,
  layoutSumBestOf,
  layoutRequiresOptIn,
  removeUnusedElements
} from './layoutHandlers';

/**
 * MiniScoreBoard
 * @param options {Object}
 * @constructor
 */
export class MiniScoreBoard {
  constructor(options = {}) {
    this.settings = {
      lbWidget: null,
      container: null,
      overlayContainer: null,
      infoContainer: null,
      updateInterval: null,
      updateIntervalTime: 1000,
      active: false,
      enableDragging: true,
      dragging: false,
      verticalClass: MINI_SCOREBOARD_CLASSES.VERTICAL,
      autoClass: MINI_SCOREBOARD_CLASSES.AUTO,
      timeManagementInterval: null,
      ...options
    };

    this.removeInfoAreaInterval = null;
  }

  layout() {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('class', MINI_SCOREBOARD_CLASSES.WRAPPER);

    const { lbWidget } = this.settings;
    if (lbWidget.settings.defaultLightTheme || localStorage.getItem('zqTheme') === 'light') {
      wrapper.classList.add('lightTheme');
    }

    let logoUrl = '';
    if (lbWidget.settings.layout.logoUrl) {
      logoUrl = `background-image: url(${lbWidget.settings.layout.logoUrl})`;
    }

    const template = require('../../templates/layouts/miniScoreBoardLayout.hbs');
    wrapper.innerHTML = template({ logoUrl });

    this.initialLayoutPosition(wrapper);
    return wrapper;
  }

  initialLayoutPosition(wrapper) {
    const { lbWidget, verticalClass, autoClass } = this.settings;
    const { miniScoreBoardPosition, miniScoreBoardOrientation } = lbWidget.settings.layout;

    Object.entries(miniScoreBoardPosition).forEach(([positionKey, position]) => {
      if (position !== null) {
        wrapper.style[positionKey] = position;
      }
    });

    if (typeof miniScoreBoardOrientation === 'string') {
      switch (miniScoreBoardOrientation) {
        case 'vertical':
          addClass(wrapper, verticalClass);
          break;
        case 'auto':
          addClass(wrapper, autoClass);
          break;
        default:
          break;
      }
    }
  }

  overlayLayout() {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('class', MINI_SCOREBOARD_CLASSES.OVERLAY_WRAPPER);
    return wrapper;
  }

  clearInterval() {
    this.settings.timeManagementInterval = null;
  }

  timeManagement() {
    return manageTime(
      this.settings.lbWidget.settings,
      this.settings,
      () => this.clearInterval()
    );
  }

  // Delegate Layouts
  layoutDefaultOrEmpty() {
    layoutDefaultOrEmpty(this, this.timeManagement());
  }

  layoutFirstToOrEmpty(strategy) {
    layoutFirstToOrEmpty(this, strategy, this.timeManagement());
  }

  layoutSumBestOf() {
    layoutSumBestOf(this, this.timeManagement());
  }

  layoutRequiresOptIn(isProcessing = false) {
    layoutRequiresOptIn(this, isProcessing);
  }

  removeUnusedElements() {
    removeUnusedElements(this.settings.container);
  }

  clearAll() {
    if (this.settings.updateInterval) {
      clearTimeout(this.settings.updateInterval);
    }
    this.removeInfoArea();
    this.settings.active = false;
  }

  removeInfoArea() {
    const { container } = this.settings;
    const activeEl = query(container, `.${MINI_SCOREBOARD_CLASSES.SHOW}`);
    const layout = query(container, '.cl-widget-ms-default-wrapper');
    const msContainer = document.querySelector(`.${MINI_SCOREBOARD_CLASSES.WRAPPER}`);

    if (activeEl) removeClass(activeEl, MINI_SCOREBOARD_CLASSES.SHOW);
    if (msContainer) addClass(msContainer, MINI_SCOREBOARD_CLASSES.HIDE);

    if (layout) {
      if (this.removeInfoAreaInterval) clearTimeout(this.removeInfoAreaInterval);
      this.removeInfoAreaInterval = setTimeout(() => remove(layout), 200);
    }
  }

  updateScoreBoard() {
    if (this.settings.updateInterval) clearTimeout(this.settings.updateInterval);
    this.settings.updateInterval = setTimeout(() => {
      this.loadInfoArea(() => this.updateScoreBoard());
    }, this.settings.updateIntervalTime);
  }

  async loadInfoArea(callback) {
    if (!this.settings.active) return;
    const { lbWidget } = this.settings;
    const activeCompetition = lbWidget.settings.competition.activeCompetition;

    if (!activeCompetition) {
      this.clearAll();
      return;
    }

    const { scheduledEndDate, statusCode, id, constraints = [] } = activeCompetition;
    const diff = require('moment')(scheduledEndDate).diff(require('moment')());

    if (statusCode < 35 && diff > 0) {
      const isParamOptIn = constraints.includes('optinRequiredForEntrants');

      if (isParamOptIn) {
        let optInStatus = activeCompetition.optInStatus || [];
        const status = optInStatus[0]?.status;

        if (status === 'Entering' || status === 'Processing') {
          optInStatus = await lbWidget.getCompetitionOptInStatus(id);
          activeCompetition.optInStatus = optInStatus;
        }

        if (!this.settings.active) return;

        if (optInStatus[0]?.status === 'Entrant') {
          this.layoutDefaultOrEmpty();
        } else if (status === 'Entering' || status === 'Processing') {
          this.layoutRequiresOptIn(true);
        } else {
          this.layoutRequiresOptIn();
        }
      } else {
        const activeContest = lbWidget.settings.competition.activeContest;
        const strategyType = activeContest?.strategies?.strategyType;

        if (strategyType === 'SumBest') {
          this.layoutSumBestOf();
        } else if (strategyType === 'FirstTo') {
          this.layoutFirstToOrEmpty(activeContest.strategies);
        } else {
          this.layoutDefaultOrEmpty();
        }
      }

      if (typeof callback === 'function') callback();
    } else if (statusCode > 30) {
      this.layoutDefaultOrEmpty();
    } else {
      this.clearAll();
    }
  }

  eventListeners() {
    const { lbWidget, container, overlayContainer, verticalClass } = this.settings;

    if (lbWidget.settings.layout.enableMiniScoreBoardDragging) {
      dragElement(
        container,
        query(container, '.cl-widget-ms-icon'),
        overlayContainer,
        lbWidget.settings.bindContainer,
        (newTop, newLeft) => {
          lbWidget.stopActivity();
          if (lbWidget.settings.layout.allowOrientationChange) {
            if (newTop <= 5) addClass(container, verticalClass);
            else if (newLeft <= 15) removeClass(container, verticalClass);
          }
          this.settings.dragging = true;
        },
        () => {
          lbWidget.restartActivity();
          setTimeout(() => { this.settings.dragging = false; }, 200);
        },
        () => {
          lbWidget.clickedMiniScoreBoard();
        }
      );
    }
  }

  initLayout(callback) {
    if (this.settings.container === null) {
      this.settings.active = true;
      const { lbWidget } = this.settings;
      this.settings.container = lbWidget.settings.bindContainer.appendChild(this.layout());
      this.settings.overlayContainer = lbWidget.settings.bindContainer.appendChild(this.overlayLayout());
      this.settings.infoContainer = query(this.settings.container, `.${MINI_SCOREBOARD_CLASSES.INFO_WRAPPER}`);

      this.eventListeners();
    }

    if (typeof callback === 'function') callback();
  }

  loadScoreBoard() {
    this.initLayout(() => {
      this.loadInfoArea(() => this.updateScoreBoard());
    });
  }
}
