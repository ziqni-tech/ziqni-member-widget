import moment from 'moment';
import mapObject from '../utils/mapObject';
import hasClass from '../utils/hasClass';
import removeClass from '../utils/removeClass';
import objectIterator from '../utils/objectIterator';
import query from '../utils/query';
import closest from '../utils/closest';
import addClass from '../utils/addClass';
import remove from '../utils/remove';
import appendNext from '../utils/appendNext';
import stripHtml from '../utils/stripHtml';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import tournamentBrackets from './TournamentBrackets';

/**
 * MainWidget
 * @param options {Object}
 * @constructor
 */
export const MainWidget = function (options) {
  /**
   * MainWidget settings
   * @memberOf MainWidget
   * @constant
   * @type { Object }
   */
  this.settings = {
    lbWidget: null,
    container: null,
    overlayContainer: null,
    navigation: null,
    section: null,
    detailsContainer: null,
    tournamentListContainer: null,
    headerDate: null,
    labelDate: null,
    labelDateHeaders: null,
    detailsDateHeaders: null,
    descriptionDate: null,
    preLoader: {
      preLoaderActive: false,
      preLoaderlastAttempt: null,
      preloaderCallbackRecovery: function () {
      }
    },
    achievement: {
      container: null,
      detailsContainer: null
    },
    reward: {
      container: null,
      detailsContainer: null
    },
    messages: {
      container: null,
      detailsContainer: null
    },
    missions: {
      container: null,
      detailsContainer: null,
      mission: null,
      timerInterval: null,
      mapContainer: null
    },
    leaderboard: {
      defaultEmptyList: 20,
      topResultSize: 3,
      header: null,
      container: null,
      resultContainer: null,
      list: null,
      topResults: null,
      timerInterval: null
    },
    tournamentsSection: {
      accordionLayout: [
        {
          label: 'Upcoming Tournaments',
          type: 'readyCompetitions',
          show: false,
          showTopResults: 0
        },
        {
          label: 'Active Tournaments',
          type: 'activeCompetitions',
          show: true,
          showTopResults: 0
        },
        {
          label: 'Finished Tournaments',
          type: 'finishedCompetitions',
          show: false,
          showTopResults: 0
        }
      ]
    },
    rewardsSection: {
      accordionLayout: [
        {
          label: 'Available Awards',
          type: 'availableAwards',
          show: true,
          showTopResults: 1
        },
        {
          label: 'Claimed Awards',
          type: 'claimedAwards',
          show: false,
          showTopResults: 1
        },
        {
          label: 'Expired Awards',
          type: 'expiredAwards',
          show: false,
          showTopResults: 1
        },
        {
          label: 'Instant Wins',
          type: 'instantWins',
          show: false,
          showTopResults: 1
        }
      ]
    },
    active: false,
    navigationSwitchLastAtempt: new Date().getTime(),
    navigationSwitchInProgress: false
  };

  if (typeof options !== 'undefined') {
    for (var opt in options) {
      if (options.hasOwnProperty(opt)) {
        this.settings[opt] = options[opt];
      }
    }
  }

  /**
   * Accordion style layout
   * - parameters:
   *      - label: String "Available rewards"
   *      - type: String "available-rewards"
   *      - shown: Boolean true/false
   *
   * @memberOf MainWidget
   * @param data { Array }
   * @param onLayout { Function }
   */
  this.awardsList = function (data, onLayout) {
    const _this = this;
    const accordionWrapper = document.createElement('div');

    accordionWrapper.setAttribute('class', 'cl-main-accordion-container');

    const statusMenu = document.createElement('div');
    statusMenu.setAttribute('class', 'cl-main-accordion-container-menu');

    const availableTitle = document.createElement('div');
    const claimedTitle = document.createElement('div');
    const expiredTitle = document.createElement('div');
    const instantWinsTitle = document.createElement('div');

    availableTitle.setAttribute('class', 'cl-main-accordion-container-menu-item availableAwards');
    claimedTitle.setAttribute('class', 'cl-main-accordion-container-menu-item claimedAwards');
    expiredTitle.setAttribute('class', 'cl-main-accordion-container-menu-item expiredAwards');
    instantWinsTitle.setAttribute('class', 'cl-main-accordion-container-menu-item instantWins');

    const idx = data.findIndex(d => d.show === true);
    if (idx !== -1) {
      switch (data[idx].type) {
        case 'availableAwards':
          availableTitle.classList.add('active');
          break;
        case 'claimedAwards':
          claimedTitle.classList.add('active');
          break;
        case 'expiredAwards':
          expiredTitle.classList.add('active');
          break;
        case 'instantWins':
          if (this.settings.lbWidget.settings.instantWins.enable) {
            instantWinsTitle.classList.add('active');
          } else {
            claimedTitle.classList.add('active');
          }
          break;
      }
    }

    availableTitle.innerHTML = _this.settings.lbWidget.settings.translation.rewards.availableRewards;
    claimedTitle.innerHTML = _this.settings.lbWidget.settings.translation.rewards.claimed;
    expiredTitle.innerHTML = _this.settings.lbWidget.settings.translation.rewards.expired;
    instantWinsTitle.innerHTML = _this.settings.lbWidget.settings.translation.rewards.instantWins;

    statusMenu.appendChild(availableTitle);
    statusMenu.appendChild(claimedTitle);
    if (this.settings.lbWidget.settings.awards.showExpiredAwards) {
      statusMenu.appendChild(expiredTitle);
    }
    if (this.settings.lbWidget.settings.instantWins.enable) {
      statusMenu.appendChild(instantWinsTitle);
    }

    accordionWrapper.appendChild(statusMenu);

    mapObject(data, function (entry) {
      const accordionSection = document.createElement('div');
      const topShownEntry = document.createElement('div');
      const accordionListContainer = document.createElement('div');
      const accordionList = document.createElement('div');

      accordionSection.setAttribute('class', 'cl-accordion ' + entry.type + ((typeof entry.show === 'boolean' && entry.show) ? ' cl-shown' : ''));
      topShownEntry.setAttribute('class', 'cl-accordion-entry');
      accordionListContainer.setAttribute('class', 'cl-accordion-list-container');
      accordionList.setAttribute('class', 'cl-accordion-list');

      if (typeof onLayout === 'function') {
        onLayout(accordionSection, accordionList, topShownEntry, entry);
      }

      accordionListContainer.appendChild(accordionList);

      accordionSection.appendChild(accordionListContainer);

      accordionWrapper.appendChild(accordionSection);
    });

    return accordionWrapper;
  };

  this.tournamentsList = function (data, onLayout) {
    const _this = this;
    const accordionWrapper = document.createElement('div');

    accordionWrapper.setAttribute('class', 'cl-main-accordion-container');

    const statusMenu = document.createElement('div');
    statusMenu.setAttribute('class', 'cl-main-accordion-container-menu');

    const finishedTitle = document.createElement('div');
    const activeTitle = document.createElement('div');
    const readyTitle = document.createElement('div');

    finishedTitle.setAttribute('class', 'cl-main-accordion-container-menu-item finishedTournaments');
    activeTitle.setAttribute('class', 'cl-main-accordion-container-menu-item activeTournaments');
    readyTitle.setAttribute('class', 'cl-main-accordion-container-menu-item readyTournaments');

    const idx = data.findIndex(d => d.show === true);
    if (idx !== -1) {
      switch (data[idx].type) {
        case 'activeCompetitions':
          activeTitle.classList.add('active');
          break;
        case 'finishedCompetitions':
          finishedTitle.classList.add('active');
          break;
        case 'readyCompetitions':
          readyTitle.classList.add('active');
          break;
      }
    }

    finishedTitle.innerHTML = _this.settings.lbWidget.settings.translation.tournaments.finishedCompetitions;
    activeTitle.innerHTML = _this.settings.lbWidget.settings.translation.tournaments.activeCompetitions;
    readyTitle.innerHTML = _this.settings.lbWidget.settings.translation.tournaments.readyCompetitions;

    statusMenu.appendChild(finishedTitle);
    statusMenu.appendChild(activeTitle);
    statusMenu.appendChild(readyTitle);

    accordionWrapper.appendChild(statusMenu);

    mapObject(data, function (entry) {
      const accordionSection = document.createElement('div');
      const accordionLabel = document.createElement('div');
      const topShownEntry = document.createElement('div');
      const accordionListContainer = document.createElement('div');
      const header = document.createElement('div');
      const headerLabel = document.createElement('div');
      const headerDate = document.createElement('div');
      const headerPrize = document.createElement('div');
      const accordionList = document.createElement('div');

      accordionSection.setAttribute('class', 'cl-accordion ' + entry.type + ((typeof entry.show === 'boolean' && entry.show) ? ' cl-shown' : ''));
      topShownEntry.setAttribute('class', 'cl-accordion-entry');
      accordionListContainer.setAttribute('class', 'cl-accordion-list-container');
      header.setAttribute('class', 'cl-accordion-list-container-header');
      headerLabel.setAttribute('class', 'cl-accordion-list-container-header-label');
      headerDate.setAttribute('class', 'cl-accordion-list-container-header-date');
      headerPrize.setAttribute('class', 'cl-accordion-list-container-header-prize');
      accordionList.setAttribute('class', 'cl-accordion-list');

      headerLabel.innerHTML = _this.settings.lbWidget.settings.translation.tournaments.label;
      headerDate.innerHTML = _this.settings.lbWidget.settings.translation.tournaments.date;
      headerPrize.innerHTML = _this.settings.lbWidget.settings.translation.leaderboard.prize;

      if (typeof onLayout === 'function') {
        onLayout(accordionSection, accordionList, topShownEntry, entry);
      }

      header.appendChild(headerLabel);
      header.appendChild(headerDate);
      if (_this.settings.lbWidget.settings.tournaments.showTournamentsMenuPrizeColumn) {
        header.appendChild(headerPrize);
      }

      accordionListContainer.appendChild(header);
      accordionListContainer.appendChild(accordionList);

      accordionSection.appendChild(accordionLabel);
      accordionSection.appendChild(topShownEntry);
      accordionSection.appendChild(accordionListContainer);

      accordionWrapper.appendChild(accordionSection);
    });

    return accordionWrapper;
  };

  this.listsNavigation = function (element) {
    const menuItems = element.parentNode.querySelectorAll('.cl-main-accordion-container-menu-item');
    const container = element.closest('.cl-main-accordion-container');
    const sections = container.querySelectorAll('.cl-accordion');

    menuItems.forEach(i => i.classList.remove('active'));
    element.classList.add('active');

    sections.forEach(s => s.classList.remove('cl-shown'));

    if (element.classList.contains('finishedTournaments')) {
      const finishedContainer = container.querySelector('.finishedCompetitions');
      finishedContainer.classList.add('cl-shown');
    }
    if (element.classList.contains('activeTournaments')) {
      const activeContainer = container.querySelector('.activeCompetitions');
      activeContainer.classList.add('cl-shown');
    }
    if (element.classList.contains('readyTournaments')) {
      const readyContainer = container.querySelector('.readyCompetitions');
      readyContainer.classList.add('cl-shown');
    }
    if (element.classList.contains('availableAwards')) {
      const availableContainer = container.querySelector('.cl-accordion.availableAwards');
      availableContainer.classList.add('cl-shown');
    }
    if (element.classList.contains('claimedAwards')) {
      const claimedContainer = container.querySelector('.cl-accordion.claimedAwards');
      claimedContainer.classList.add('cl-shown');
    }
    if (element.classList.contains('expiredAwards')) {
      const expiredContainer = container.querySelector('.cl-accordion.expiredAwards');
      expiredContainer.classList.add('cl-shown');
    }
    if (element.classList.contains('instantWins')) {
      const instantWinsContainer = container.querySelector('.cl-accordion.instantWins');
      instantWinsContainer.classList.add('cl-shown');
    }
  };

  this.accordionNavigation = function (element) {
    const parentEl = element.parentNode;

    if (hasClass(parentEl, 'cl-shown')) {
      removeClass(parentEl, 'cl-shown');
    } else {
      objectIterator(query(closest(parentEl, '.cl-main-accordion-container'), '.cl-shown'), function (obj) {
        removeClass(obj, 'cl-shown');
      });

      addClass(parentEl, 'cl-shown');
    }
  };

  this.navigationSorter = function (a, b) {
    if (a.order < b.order) {
      return -1;
    }
    if (a.order > b.order) {
      return 1;
    }
    return 0;
  };

  this.navigationItems = function (container, navigationList) {
    const _this = this;

    // sorting navigation by order number
    navigationList.sort(_this.navigationSorter);

    mapObject(navigationList, function (val, key) {
      const navigationItem = document.createElement('div');
      const navigationItemIcon = document.createElement('div');
      const navigationItemTitle = document.createElement('div');
      if (val.key === 'inbox') {
        navigationItemTitle.innerHTML = _this.settings.lbWidget.settings.translation.messages.label;
      } else {
        navigationItemTitle.innerHTML = _this.settings.lbWidget.settings.translation[val.key].label;
      }

      navigationItem.setAttribute('class', _this.settings.lbWidget.settings.navigation[val.key].navigationClass + ' cl-main-widget-navigation-item' + (_this.settings.lbWidget.settings.navigation[val.key].enable ? '' : ' cl-hidden-navigation-item'));
      navigationItemIcon.setAttribute('class', _this.settings.lbWidget.settings.navigation[val.key].navigationClassIcon + ' cl-main-navigation-item');
      navigationItemTitle.setAttribute('class', 'cl-main-navigation-item-title');

      navigationItem.appendChild(navigationItemIcon);
      navigationItem.appendChild(navigationItemTitle);
      container.appendChild(navigationItem);
    });
  };

  this.overlayLayout = function () {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'cl-widget-main-widget-overlay-wrapper');

    return wrapper;
  };

  this.layout = function () {
    const _this = this;
    const wrapper = document.createElement('div');
    const innerWrapper = document.createElement('div');

    const navigationContainer = document.createElement('div');
    const navigationItems = document.createElement('div');
    const navigationLogo = document.createElement('div');
    const navigationDarkModeToggle = document.createElement('div');
    const navigationDarkModeToggleInput = document.createElement('input');
    const navigationDarkModeToggleLabel = document.createElement('label');

    const mainSectionContainer = document.createElement('div');

    const preLoaderContainer = document.createElement('div');
    const preLoaderContent = document.createElement('div');
    const preLoaderBar1 = document.createElement('div');
    const preLoaderBar2 = document.createElement('div');
    const preLoaderBar3 = document.createElement('div');

    const sectionLB = _this.leaderboardAreaLayout();
    const sectionACH = _this.achievementsAreaLayout();
    const sectionRewards = _this.rewardsAreaLayout();
    const sectionInbox = _this.inboxAreaLayout();
    const sectionMissions = _this.missionsAreaLayout();
    const sectionDashboard = _this.dashboardAreaLayout();

    const mobileThemeSwitcher = document.createElement('div');
    const landscapeClose = document.createElement('div');

    mobileThemeSwitcher.setAttribute('class', 'cl-mobile-theme-switcher');
    landscapeClose.setAttribute('class', 'cl-landscape-close');

    const navigationItemList = [];
    mapObject(_this.settings.lbWidget.settings.navigation, function (val, key) {
      navigationItemList.push({
        key: key,
        order: parseInt(val.order)
      });
    });

    _this.navigationItems(navigationItems, navigationItemList); // populate sorted navigation

    wrapper.setAttribute('class', 'cl-main-widget-wrapper');
    innerWrapper.setAttribute('class', 'cl-main-widget-inner-wrapper');

    navigationContainer.setAttribute('class', 'cl-main-widget-navigation-container');
    navigationItems.setAttribute('class', 'cl-main-widget-navigation-items');
    navigationLogo.setAttribute('class', 'cl-main-widget-navigation-logo');
    if (this.settings.lbWidget.settings.layout.logoUrl) {
      navigationLogo.setAttribute('style', `background-image: url(${this.settings.lbWidget.settings.layout.logoUrl})`);
    }

    navigationDarkModeToggle.setAttribute('class', 'cl-main-widget-navigation-darkMode-toggle');
    navigationDarkModeToggleInput.setAttribute('type', 'checkbox');
    navigationDarkModeToggleInput.setAttribute('id', 'darkmode-toggle');
    if (_this.settings.lbWidget.settings.defaultLightTheme) {
      wrapper.classList.add('lightTheme');
      navigationDarkModeToggleInput.checked = true;
    }
    navigationDarkModeToggleLabel.setAttribute('for', 'darkmode-toggle');

    navigationDarkModeToggle.appendChild(navigationDarkModeToggleInput);
    navigationDarkModeToggle.appendChild(navigationDarkModeToggleLabel);

    mainSectionContainer.setAttribute('class', 'cl-main-widget-section-container' + (_this.settings.lbWidget.settings.showCopyright ? '' : ' cl-hidden-copyright'));

    preLoaderContainer.setAttribute('class', 'cl-main-widget-pre-loader');
    preLoaderContent.setAttribute('class', 'cl-main-widget-pre-loader-content');
    preLoaderBar1.setAttribute('class', 'cl-pre-loader-bar');
    preLoaderBar2.setAttribute('class', 'cl-pre-loader-bar');
    preLoaderBar3.setAttribute('class', 'cl-pre-loader-bar');

    preLoaderContent.appendChild(preLoaderBar1);
    preLoaderContent.appendChild(preLoaderBar2);
    preLoaderContent.appendChild(preLoaderBar3);
    preLoaderContainer.appendChild(preLoaderContent);

    navigationContainer.appendChild(navigationLogo);
    navigationContainer.appendChild(navigationItems);

    if (this.settings.lbWidget.settings.layout.showThemeSwitcher) {
      navigationContainer.appendChild(navigationDarkModeToggle);
      mainSectionContainer.appendChild(mobileThemeSwitcher);
    }

    mainSectionContainer.appendChild(sectionLB);
    mainSectionContainer.appendChild(sectionACH);
    mainSectionContainer.appendChild(sectionRewards);
    mainSectionContainer.appendChild(sectionInbox);
    mainSectionContainer.appendChild(sectionMissions);
    mainSectionContainer.appendChild(sectionDashboard);
    mainSectionContainer.appendChild(preLoaderContainer);
    mainSectionContainer.appendChild(landscapeClose);

    innerWrapper.appendChild(navigationContainer);
    innerWrapper.appendChild(mainSectionContainer);
    wrapper.appendChild(innerWrapper);

    return wrapper;
  };

  this.mainNavigationCheck = function () {
    const _this = this;
    const navItems = query(_this.settings.container, '.cl-main-widget-navigation-item');
    let checkEnabled = 0;

    objectIterator(navItems, function (navItem) {
      if (!hasClass(navItem, 'cl-hidden-navigation-item')) {
        checkEnabled++;
      }
    });

    if (checkEnabled === 1) {
      addClass(query(_this.settings.container, '.cl-main-widget-inner-wrapper'), 'cl-hidden-navigation');
    } else if (checkEnabled === 0) {
      _this.settings.lbWidget.log('All navigation items disabled, check [this.settings.lbWidget.settings.navigation]');
    }
  };

  this.leaderboardAreaLayout = function () {
    const sectionLB = document.createElement('div');
    sectionLB.setAttribute('class', this.settings.lbWidget.settings.navigation.tournaments.containerClass + ' cl-main-section-item cl-main-active-section');

    const template = require('../templates/mainWidget/leaderboard.hbs');
    sectionLB.innerHTML = template({
      tournamentsLabel: this.settings.lbWidget.settings.translation.tournaments.label,
      descriptionLabel: this.settings.lbWidget.settings.translation.global.descriptionLabel,
      tAndCLabel: this.settings.lbWidget.settings.translation.global.tAndCLabel,
      enterLabel: this.settings.lbWidget.settings.translation.tournaments.enter,
      globalCopy: this.settings.lbWidget.settings.translation.global.copy,
      monthsFull: this.settings.lbWidget.settings.translation.time.monthsFull,
      daysFull: this.settings.lbWidget.settings.translation.time.daysFull,
      hoursFull: this.settings.lbWidget.settings.translation.time.hoursFull,
      minutesFull: this.settings.lbWidget.settings.translation.time.minutesFull,
      secondsFull: this.settings.lbWidget.settings.translation.time.secondsFull
    });

    return sectionLB;
  };

  this.achievementsAreaLayout = function () {
    const sectionACH = document.createElement('div');
    sectionACH.setAttribute('class', this.settings.lbWidget.settings.navigation.achievements.containerClass + ' cl-main-section-item');

    const template = require('../templates/layouts/achievementsAreaLayout.hbs');
    sectionACH.innerHTML = template({
      leavePopupTitle: this.settings.lbWidget.settings.translation.achievements.leavePopupTitle,
      leavePopupDescription: this.settings.lbWidget.settings.translation.achievements.leavePopupDescription,
      leavePopupActionConfirm: this.settings.lbWidget.settings.translation.achievements.leavePopupConfirm,
      leavePopupActionCancel: this.settings.lbWidget.settings.translation.achievements.leavePopupClose,
      descriptionLabel: this.settings.lbWidget.settings.translation.global.descriptionLabel,
      tAndCLabel: this.settings.lbWidget.settings.translation.global.tAndCLabel,
      progressLabel: this.settings.lbWidget.settings.translation.achievements.progress,
      headerLabel: this.settings.lbWidget.settings.translation.achievements.label,
      globalCopy: this.settings.lbWidget.settings.translation.global.copy,
      enterLabel: this.settings.lbWidget.settings.translation.achievements.enter
    });

    return sectionACH;
  };

  this.rewardsAreaLayout = function () {
    const sectionRewards = document.createElement('div');
    sectionRewards.setAttribute('class', this.settings.lbWidget.settings.navigation.rewards.containerClass + ' cl-main-section-item');

    const template = require('../templates/layouts/awardsAreaLayout.hbs');
    sectionRewards.innerHTML = template({
      headerLabel: this.settings.lbWidget.settings.translation.rewards.label,
      globalCopy: this.settings.lbWidget.settings.translation.global.copy,
      claimBtn: this.settings.lbWidget.settings.translation.rewards.claim
    });

    return sectionRewards;
  };

  this.inboxAreaLayout = function () {
    const sectionInbox = document.createElement('div');
    sectionInbox.setAttribute('class', this.settings.lbWidget.settings.navigation.inbox.containerClass + ' cl-main-section-item');

    const template = require('../templates/layouts/inboxAreaLayout.hbs');
    sectionInbox.innerHTML = template({
      headerLabel: this.settings.lbWidget.settings.translation.messages.label,
      globalCopy: this.settings.lbWidget.settings.translation.global.copy
    });

    return sectionInbox;
  };

  this.missionsAreaLayout = function () {
    const sectionMissions = document.createElement('div');
    sectionMissions.setAttribute('class', this.settings.lbWidget.settings.navigation.missions.containerClass + ' cl-main-section-item');

    const template = require('../templates/layouts/missionsAreaLayout.hbs');
    sectionMissions.innerHTML = template({
      headerLabel: this.settings.lbWidget.settings.translation.missions.label,
      globalCopy: this.settings.lbWidget.settings.translation.global.copy,
      descriptionLabel: this.settings.lbWidget.settings.translation.global.descriptionLabel,
      tAndCLabel: this.settings.lbWidget.settings.translation.global.tAndCLabel,
      prizeLabel: this.settings.lbWidget.settings.translation.missions.prizeLabel + ':',
      mapHeaderLabel: this.settings.lbWidget.settings.translation.missions.mapLabel
    });

    return sectionMissions;
  };

  this.dashboardAreaLayout = function () {
    const sectionDashboard = document.createElement('div');
    sectionDashboard.setAttribute('class', this.settings.lbWidget.settings.navigation.dashboard.containerClass + ' cl-main-section-item');

    const template = require('../templates/layouts/dashboardAreaLayout.hbs');
    sectionDashboard.innerHTML = template({
      isInstantWins: this.settings.lbWidget.settings.instantWins.enable,
      isAchievements: this.settings.lbWidget.settings.navigation.achievements.enable,
      isTournaments: this.settings.lbWidget.settings.navigation.tournaments.enable,
      seeAllLabel: this.settings.lbWidget.settings.translation.dashboard.seeAll,
      headerLabel: this.settings.lbWidget.settings.translation.dashboard.label,
      tournamentsTitle: this.settings.lbWidget.settings.translation.dashboard.tournamentsTitle,
      achievementsTitle: this.settings.lbWidget.settings.translation.dashboard.achievementsTitle,
      instantWinsTitle: this.settings.lbWidget.settings.translation.dashboard.instantWinsTitle,
      leavePopupTitle: this.settings.lbWidget.settings.translation.achievements.leavePopupTitle,
      leavePopupDescription: this.settings.lbWidget.settings.translation.achievements.leavePopupDescription,
      leavePopupActionConfirm: this.settings.lbWidget.settings.translation.achievements.leavePopupConfirm,
      leavePopupActionCancel: this.settings.lbWidget.settings.translation.achievements.leavePopupClose,
      instantWinsWheelTitle: this.settings.lbWidget.settings.translation.dashboard.singleWheelTitle,
      instantWinsWheelButton: this.settings.lbWidget.settings.translation.dashboard.singleWheelButton,
      instantWinsCardsTitle: this.settings.lbWidget.settings.translation.dashboard.scratchcardsTitle,
      instantWinsCardsButton: this.settings.lbWidget.settings.translation.dashboard.scratchcardsButton
    });

    return sectionDashboard;
  };

  this.leaderboardHeader = function () {
    addClass(this.settings.leaderboard.header, 'cl-reward-enabled');

    const rewardEnabled = typeof this.settings.lbWidget.settings.competition.activeContest !== 'undefined' &&
      this.settings.lbWidget.settings.competition.activeContest !== null &&
      typeof this.settings.lbWidget.settings.competition.activeContest.rewards !== 'undefined' &&
      this.settings.lbWidget.settings.competition.activeContest.rewards.length > 0;

    const template = require('../templates/mainWidget/leaderboardHeader.hbs');
    this.settings.leaderboard.header.innerHTML = template({
      rewardEnabled: rewardEnabled,
      rankColLabel: this.settings.lbWidget.settings.translation.leaderboard.rank,
      nameColLabel: this.settings.lbWidget.settings.translation.leaderboard.name,
      pointsColLabel: this.settings.lbWidget.settings.translation.leaderboard.points,
      rewardColLabel: this.settings.lbWidget.settings.translation.leaderboard.prize
    });
  };

  this.leaderboardRow = function (rank, icon, name, change, growth, points, reward, count, memberFound) {
    const cellWrapper = document.createElement('div');
    const memberFoundClass = (memberFound) ? ' cl-lb-member-row' : '';
    cellWrapper.setAttribute('class', 'cl-lb-row cl-lb-rank-' + rank + ' cl-lb-count-' + count + memberFoundClass);
    cellWrapper.dataset.rank = rank;

    const datasetGrowth = (change < 0) ? 'down' : (change > 0 ? 'up' : 'same');
    const datasetChange = change;

    const rewardEnabled = (typeof this.settings.lbWidget.settings.competition.activeContest !== 'undefined' && this.settings.lbWidget.settings.competition.activeContest !== null && typeof this.settings.lbWidget.settings.competition.activeContest.rewards !== 'undefined' && this.settings.lbWidget.settings.competition.activeContest.rewards.length > 0);

    const rewardValue = (typeof reward !== 'undefined' && reward !== null) ? reward : '';

    const template = require('../templates/mainWidget/leaderboardRow.hbs');
    cellWrapper.innerHTML = template({
      rank: rank,
      name: name,
      icon: icon,
      datasetGrowth: datasetGrowth,
      datasetChange: datasetChange,
      growth: growth,
      points: points,
      rewardEnabled: rewardEnabled,
      rewardEnabledClass: 'cl-col-reward-enabled',
      rewardValue: rewardValue
    });

    return cellWrapper;
  };

  this.leaderboardRowUpdate = function (rank, icon, name, change, growth, points, reward, count, memberFound, onMissing) {
    const _this = this;
    const cellRow = query(_this.settings.leaderboard.container, '.cl-lb-rank-' + rank + '.cl-lb-count-' + count);

    if (cellRow === null) {
      onMissing(rank, name ? name[0] : '', name, change, growth, points, reward, count, memberFound);
    } else {
      const rankCel = query(cellRow, '.cl-rank-col-value');
      const iconCel = query(cellRow, '.cl-icon-col-img');
      const nameCel = query(cellRow, '.cl-name-col');
      const growthCel = query(cellRow, '.cl-growth-col');
      const pointsCel = query(cellRow, '.cl-points-col');
      const memberFoundClass = 'cl-lb-member-row';
      const rowHasClass = hasClass(cellRow, memberFoundClass);

      if (count > 0 && !hasClass(cellRow, 'cl-shared-rank')) {
        addClass(cellRow, 'cl-shared-rank');
      }

      if (memberFound && !rowHasClass) {
        addClass(cellRow, memberFoundClass);
      } else if (!memberFound && rowHasClass) {
        removeClass(cellRow, memberFoundClass);
      }

      cellRow.dataset.rank = rank;

      rankCel.innerHTML = rank;
      nameCel.innerHTML = name;

      growthCel.dataset.growth = (change < 0) ? 'down' : (change > 0 ? 'up' : 'same');
      growthCel.dataset.change = change;
      growthCel.innerHTML = growth;

      pointsCel.innerHTML = points;

      iconCel.innerText = name ? name[0] : '';

      if (typeof _this.settings.lbWidget.settings.competition.activeContest !== 'undefined' && _this.settings.lbWidget.settings.competition.activeContest !== null && typeof _this.settings.lbWidget.settings.competition.activeContest.rewards !== 'undefined' && _this.settings.lbWidget.settings.competition.activeContest.rewards.length > 0) {
        const rewardCel = query(cellRow, '.cl-reward-col');
        if (rewardCel !== null) {
          rewardCel.innerHTML = (typeof reward !== 'undefined' && reward !== null) ? reward : '';
        }
      } else {
        const rewardCel = query(cellRow, '.cl-reward-col');
        if (rewardCel !== null) {
          rewardCel.innerHTML = '';
        }
      }
    }
  };

  this.populateLeaderboardResultsWithDefaultEntries = function (clearPrize = false) {
    const topResults = [];
    const remainingResults = [];

    for (let i = 0; i < this.settings.leaderboard.topResultSize; i++) {
      const rank = i + 1;

      topResults.push({
        name: '--',
        rank: rank,
        score: '--',
        memberId: '',
        memberRefId: ''
      });
    }

    const emptyListLength = (
      this.settings.lbWidget.settings.leaderboard.fullLeaderboardSize < this.settings.leaderboard.defaultEmptyList
    )
      ? this.settings.lbWidget.settings.leaderboard.fullLeaderboardSize + 1
      : this.settings.leaderboard.defaultEmptyList;

    for (let s = this.settings.leaderboard.topResultSize; s < emptyListLength; s++) {
      const rank = s + 1;

      remainingResults.push({
        name: '--',
        rank: rank,
        score: '--',
        memberId: '',
        memberRefId: ''
      });
    }

    this.updateLeaderboardTopResults(topResults, clearPrize);
    this.updateLeaderboardResults(remainingResults, clearPrize);
  };

  this.updateLeaderboardTopResults = function (topResults, clearPrize = false) {
    const _this = this;
    const rankCheck = [];
    const cleanupRankCheck = [];

    // cleanup
    mapObject(topResults, function (lb) {
      cleanupRankCheck.push(lb.rank);
      objectIterator(query(_this.settings.leaderboard.topResults, '.cl-lb-rank-' + lb.rank + '.cl-shared-rank'), function (obj) {
        remove(obj);
      });
    });

    objectIterator(query(_this.settings.leaderboard.topResults, '.cl-lb-row'), function (obj) {
      const rank = parseInt(obj.dataset.rank);
      if (cleanupRankCheck.indexOf(rank) === -1 && rank > _this.settings.leaderboard.defaultEmptyList) {
        remove(obj);
      }
    });

    mapObject(topResults, function (lb) {
      let memberNames = '';
      let memberLbName = '';
      if (lb.members && lb.members.length) {
        memberNames = lb.members.map((m) => m.name);
        memberLbName = memberNames.join();
      } else {
        memberLbName = lb.name;
      }
      let count = 0;
      const memberFound = lb.members && lb.members.findIndex(m => m.memberRefId === _this.settings.lbWidget.settings.member.memberRefId) !== -1;

      let memberName = (memberFound) ? _this.settings.lbWidget.settings.translation.leaderboard.you : memberLbName;
      const memberNameLength = _this.settings.lbWidget.settings.memberNameLength;
      const reward = clearPrize ? '' : _this.getReward(lb.rank);
      const change = (typeof lb.change === 'undefined') ? 0 : lb.change;
      const growthType = (change < 0) ? 'down' : (change > 0 ? 'up' : 'same');
      const growthIcon = "<span class='cl-growth-icon cl-growth-" + growthType + "'></span>";
      const formattedPoints = _this.settings.lbWidget.settings.leaderboard.pointsFormatter(lb.score);

      if (rankCheck.indexOf(lb.rank) !== -1) {
        for (let rc = 0; rc < rankCheck.length; rc++) {
          if (lb.rank === rankCheck[rc]) {
            count++;
          }
        }
      }

      if (memberNameLength && memberName !== _this.settings.lbWidget.settings.translation.leaderboard.you) {
        memberName = memberName.slice(0, memberNameLength) + '*****';
      }

      _this.leaderboardRowUpdate(
        lb.rank,
        memberName ? memberName[0] : '', // icon
        memberName,
        change,
        growthIcon, // growth
        formattedPoints,
        reward, // reward
        count,
        memberFound,
        function (rank, icon, name, change, growth, points, reward, count, memberFound) {
          const newRow = _this.leaderboardRow(rank, name ? name[0] : '', name, change, growth, points, reward, count, memberFound);
          const prevCellRow = query(_this.settings.leaderboard.container, '.cl-lb-rank-' + rank + '.cl-lb-count-' + (count - 1));

          if (prevCellRow !== null && typeof prevCellRow.length === 'undefined') {
            appendNext(prevCellRow, newRow);
          } else {
            _this.settings.leaderboard.topResults.appendChild(newRow);
          }
        }
      );

      rankCheck.push(lb.rank);
    });
  };

  this.getTournamentReward = function (tournament, rank) {
    const _this = this;
    const rewardResponse = [];

    mapObject(tournament.rewards, function (reward) {
      if (reward.rewardRank.indexOf('-') !== -1 || reward.rewardRank.indexOf(',') !== -1) {
        const rewardRankArr = reward.rewardRank.split(',');
        rewardRankArr.forEach(r => {
          const idx = r.indexOf('-');
          if (idx !== -1) {
            const start = parseInt(r);
            const end = parseInt(r.substring(idx + 1));
            if (rank >= start && rank <= end) {
              rewardResponse.push(_this.settings.lbWidget.settings.partialFunctions.rewardFormatter(reward));
            }
          } else if (parseInt(r) === rank) {
            rewardResponse.push(_this.settings.lbWidget.settings.partialFunctions.rewardFormatter(reward));
          }
        });
      } else if (rank !== 0 && parseInt(reward.rewardRank) === rank) {
        rewardResponse.push(_this.settings.lbWidget.settings.partialFunctions.rewardFormatter(reward));
      }
    });

    return rewardResponse.join(', ');
  };

  this.getReward = function (rank) {
    const _this = this;
    const rewardResponse = [];

    if (typeof _this.settings.lbWidget.settings.competition.activeContest !== 'undefined' && _this.settings.lbWidget.settings.competition.activeContest !== null) {
      mapObject(_this.settings.lbWidget.settings.competition.activeContest.rewards, function (reward) {
        if (reward.rewardRank.indexOf('-') !== -1 || reward.rewardRank.indexOf(',') !== -1) {
          const rewardRankArr = reward.rewardRank.split(',');
          rewardRankArr.forEach(r => {
            const idx = r.indexOf('-');
            if (idx !== -1) {
              const start = parseInt(r);
              const end = parseInt(r.substring(idx + 1));
              if (rank >= start && rank <= end) {
                rewardResponse.push(_this.settings.lbWidget.settings.partialFunctions.rewardFormatter(reward));
              }
            } else if (parseInt(r) === rank) {
              rewardResponse.push(_this.settings.lbWidget.settings.partialFunctions.rewardFormatter(reward));
            }
          });
        } else if (rank !== 0 && parseInt(reward.rewardRank) === rank) {
          rewardResponse.push(_this.settings.lbWidget.settings.partialFunctions.rewardFormatter(reward));
        }
      });
    }

    return rewardResponse.join(', ');
  };

  this.updateLeaderboardResults = function (remainingResults, clearPrize = false) {
    const _this = this;
    const rankCheck = [];
    const cleanupRankCheck = [];

    // cleanup
    mapObject(remainingResults, function (lb) {
      cleanupRankCheck.push(lb.rank);
      objectIterator(query(_this.settings.leaderboard.list, '.cl-lb-rank-' + lb.rank + '.cl-shared-rank'), function (obj) {
        remove(obj);
      });
    });

    objectIterator(query(_this.settings.leaderboard.container, '.cl-lb-row'), function (obj) {
      const rank = parseInt(obj.dataset.rank);
      if (cleanupRankCheck.indexOf(rank) === -1 && (rank > _this.settings.leaderboard.defaultEmptyList || rank === 0)) {
        remove(obj);
      }
    });

    mapObject(remainingResults, function (lb) {
      let memberNames = '';
      let memberLbName = '';
      if (lb.members && lb.members.length) {
        memberNames = lb.members.map((m) => m.name);
        memberLbName = memberNames.join();
      } else {
        memberLbName = lb.name;
      }
      let count = 0;
      const icon = memberLbName && memberLbName.length ? memberLbName[0] : '';
      const memberFound = lb.members && lb.members.findIndex(m => m.memberRefId === _this.settings.lbWidget.settings.member.memberRefId) !== -1;
      let memberName = (memberFound) ? _this.settings.lbWidget.settings.translation.leaderboard.you : memberLbName;
      const memberNameLength = _this.settings.lbWidget.settings.memberNameLength;
      const reward = clearPrize ? '' : _this.getReward(lb.rank);
      const change = (typeof lb.change === 'undefined') ? 0 : lb.change;
      const growthType = (change < 0) ? 'down' : (change > 0 ? 'up' : 'same');
      const growthIcon = "<span class='cl-growth-icon cl-growth-" + growthType + "'></span>";
      const formattedPoints = _this.settings.lbWidget.settings.leaderboard.pointsFormatter(lb.score);

      if (rankCheck.indexOf(lb.rank) !== -1) {
        for (let rc = 0; rc < rankCheck.length; rc++) {
          if (lb.rank === rankCheck[rc]) {
            count++;
          }
        }
      }

      if (memberNameLength && memberName !== _this.settings.lbWidget.settings.translation.leaderboard.you) {
        memberName = memberName.slice(0, memberNameLength) + '*****';
      }

      _this.leaderboardRowUpdate(
        lb.rank,
        icon,
        memberName,
        change,
        growthIcon,
        formattedPoints,
        reward,
        count,
        memberFound,
        function (rank, icon, name, change, growth, points, reward, count, memberFound) {
          const newRow = _this.leaderboardRow(rank, icon, name, name, growth, points, reward, count, memberFound);
          const prevCellRow = query(_this.settings.leaderboard.container, '.cl-lb-rank-' + rank + '.cl-lb-count-' + (count - 1));

          if (prevCellRow !== null && typeof prevCellRow.length === 'undefined') {
            appendNext(prevCellRow, newRow);
          } else {
            _this.settings.leaderboard.list.appendChild(newRow);
          }
        }
      );

      rankCheck.push(lb.rank);
    });
  };

  this.updateLeaderboard = function () {
    const _this = this;
    const topResults = [];
    const remainingResults = [];

    _this.populateLeaderboardResultsWithDefaultEntries();

    mapObject(_this.settings.lbWidget.settings.leaderboard.leaderboardData, function (lb) {
      if (lb.rank > 0 && lb.rank <= _this.settings.leaderboard.topResultSize) {
        topResults.push(lb);
      } else {
        remainingResults.push(lb);
      }
    });

    _this.updateLeaderboardTopResults(topResults);
    _this.updateLeaderboardResults(remainingResults);

    const member = query(_this.settings.leaderboard.resultContainer, '.cl-lb-member-row');

    if (member !== null) {
      _this.missingMember(_this.isElementVisibleInView(member, _this.settings.leaderboard.resultContainer));
    } else {
      _this.missingMemberReset();
    }
  };

  this.updateLeaderboardTime = function () {
    const _this = this;
    const descriptionDateEl = document.querySelector('.cl-main-widget-lb-details-description-date');
    const descriptionDateHeadersEl = document.querySelector('.cl-main-widget-lb-details-description-date-headers');
    const lbDateEl = document.querySelector('.cl-main-widget-lb-details-content-date');
    const lbDateHeaderEl = document.querySelector('.cl-main-widget-lb-details-content-date-headers');
    const descriptionMonthsLabel = document.querySelector('.cl-main-widget-lb-details-description-date-headers-item.months');
    const lbMonthsLabel = document.querySelector('.cl-main-widget-lb-details-content-date-headers-item.months');

    if (!_this.settings.lbWidget.settings.competition.activeContest && this.settings.lbWidget.settings.competition.activeCompetition.statusCode !== 15) {
      descriptionDateEl.style.display = 'none';
      lbDateEl.style.display = 'none';
      descriptionDateHeadersEl.style.display = 'none';
      lbDateHeaderEl.style.display = 'none';
    } else if (this.settings.lbWidget.settings.competition.activeCompetition && this.settings.lbWidget.settings.competition.activeCompetition.statusCode === 15) {
      descriptionDateEl.style.display = 'block';
      lbDateEl.style.display = 'block';
      descriptionDateHeadersEl.style.display = 'flex';
      lbDateHeaderEl.style.display = 'flex';

      const diff = moment(this.settings.lbWidget.settings.competition.activeCompetition.scheduledStartDate).diff(moment());
      const date = _this.settings.lbWidget.settings.translation.miniLeaderboard.startsIn + ': ' + _this.settings.lbWidget.formatDateTime(moment.duration(diff));
      const months = moment.duration(diff).months();
      if (months) {
        descriptionMonthsLabel.classList.remove('hidden');
        lbMonthsLabel.classList.remove('hidden');
      } else {
        descriptionMonthsLabel.classList.add('hidden');
        lbMonthsLabel.classList.add('hidden');
      }

      const labelDate = '<div class="cl-main-widget-lb-details-content-date-label">' +
        _this.settings.lbWidget.settings.translation.miniLeaderboard.startsIn +
        ':</div>' +
        _this.settings.lbWidget.formatBannerDateTime(moment.duration(diff));
      const descriptionDate = '<div class="cl-main-widget-lb-details-description-date-label">' +
        _this.settings.lbWidget.settings.translation.miniLeaderboard.startsIn +
        ':</div>' +
        _this.settings.lbWidget.formatBannerDateTime(moment.duration(diff));

      if (_this.settings.leaderboard.timerInterval) {
        clearTimeout(_this.settings.leaderboard.timerInterval);
      }

      _this.settings.headerDate.innerHTML = date;
      _this.settings.labelDate.innerHTML = labelDate;
      _this.settings.descriptionDate.innerHTML = descriptionDate;
      _this.settings.detailsContainerDate.innerHTML = date;
    } else {
      descriptionDateEl.style.display = 'block';
      lbDateEl.style.display = 'block';
      descriptionDateHeadersEl.style.display = 'flex';
      lbDateHeaderEl.style.display = 'flex';

      let diff = moment(_this.settings.lbWidget.settings.competition.activeContest.scheduledStartDate).diff(moment());
      let date = _this.settings.lbWidget.settings.translation.miniLeaderboard.startsIn + ': ' + _this.settings.lbWidget.formatDateTime(moment.duration(diff));
      let labelDate = '<div class="cl-main-widget-lb-details-content-date-label">' +
        _this.settings.lbWidget.settings.translation.miniLeaderboard.startsIn +
        ':</div>' +
        _this.settings.lbWidget.formatBannerDateTime(moment.duration(diff));
      let descriptionDate = '<div class="cl-main-widget-lb-details-description-date-label">' +
        _this.settings.lbWidget.settings.translation.miniLeaderboard.startsIn +
        ':</div>' +
        _this.settings.lbWidget.formatBannerDateTime(moment.duration(diff));
      const months = moment.duration(diff).months();
      if (months) {
        descriptionMonthsLabel.classList.remove('hidden');
        lbMonthsLabel.classList.remove('hidden');
      } else {
        descriptionMonthsLabel.classList.add('hidden');
        lbMonthsLabel.classList.add('hidden');
      }
      if (_this.settings.leaderboard.timerInterval) {
        clearTimeout(_this.settings.leaderboard.timerInterval);
      }

      if (diff <= 0 && _this.settings.lbWidget.settings.competition.activeContest.statusCode === 15) {
        date = _this.settings.lbWidget.settings.translation.miniLeaderboard.starting;
        labelDate = _this.settings.lbWidget.settings.translation.miniLeaderboard.starting;
        descriptionDate = _this.settings.lbWidget.settings.translation.miniLeaderboard.starting;
        _this.settings.labelDateHeaders.innerHTML = '';
        _this.settings.detailsDateHeaders.innerHTML = '';
      } else if (_this.settings.lbWidget.settings.competition.activeContest.statusCode === 20) {
        date = _this.settings.lbWidget.settings.translation.tournaments.starting;
        labelDate = _this.settings.lbWidget.settings.translation.tournaments.starting;
        descriptionDate = _this.settings.lbWidget.settings.translation.tournaments.starting;
        _this.settings.labelDateHeaders.innerHTML = '';
        _this.settings.detailsDateHeaders.innerHTML = '';
      } else if (_this.settings.lbWidget.settings.competition.activeContest.statusCode === 25) {
        diff = moment(_this.settings.lbWidget.settings.competition.activeContest.scheduledEndDate).diff(moment());
        date = _this.settings.lbWidget.formatDateTime(moment.duration(diff));
        labelDate = _this.settings.lbWidget.formatBannerDateTime(moment.duration(diff));
        descriptionDate = _this.settings.lbWidget.formatBannerDateTime(moment.duration(diff));

        const months = moment.duration(diff).months();
        if (months) {
          descriptionMonthsLabel.classList.remove('hidden');
          lbMonthsLabel.classList.remove('hidden');
        } else {
          descriptionMonthsLabel.classList.add('hidden');
          lbMonthsLabel.classList.add('hidden');
        }

        if (diff <= 0) {
          date = _this.settings.lbWidget.settings.translation.tournaments.finishing;
          labelDate = _this.settings.lbWidget.settings.translation.tournaments.finishing;
          descriptionDate = _this.settings.lbWidget.settings.translation.tournaments.finishing;
          descriptionDateHeadersEl.style.display = 'none';
          lbDateHeaderEl.style.display = 'none';
        }
      } else if (_this.settings.lbWidget.settings.competition.activeContest.statusCode === 30) {
        date = _this.settings.lbWidget.settings.translation.tournaments.finishing;
        labelDate = _this.settings.lbWidget.settings.translation.tournaments.finishing;
        descriptionDate = _this.settings.lbWidget.settings.translation.tournaments.finishing;
        descriptionDateHeadersEl.style.display = 'none';
        lbDateHeaderEl.style.display = 'none';
      } else if (_this.settings.lbWidget.settings.competition.activeContest.statusCode >= 35) {
        date = _this.settings.lbWidget.settings.translation.tournaments.finished;
        labelDate = _this.settings.lbWidget.settings.translation.tournaments.finished;
        descriptionDate = _this.settings.lbWidget.settings.translation.tournaments.finished;
        descriptionDateHeadersEl.style.display = 'none';
        lbDateHeaderEl.style.display = 'none';
      }

      _this.settings.headerDate.innerHTML = date;
      _this.settings.labelDate.innerHTML = labelDate;
      _this.settings.descriptionDate.innerHTML = descriptionDate;
      _this.settings.detailsContainerDate.innerHTML = date;
    }

    _this.settings.leaderboard.timerInterval = setTimeout(function () {
      _this.updateLeaderboardTime();
    }, 1000);
  };

  this.getActiveContestTitle = function () {
    let name = '';

    if (this.settings.lbWidget.settings.competition.activeCompetition && this.settings.lbWidget.settings.competition.activeCompetition.statusCode === 15) {
      name = this.settings.lbWidget.settings.competition.activeCompetition.name;
    } else {
      name = (
        this.settings.lbWidget.settings.competition.activeContest !== null &&
        this.settings.lbWidget.settings.competition.activeContest.name
      )
        ? this.settings.lbWidget.settings.competition.activeContest.name
        : this.settings.lbWidget.settings.translation.tournaments.noAvailableCompetitions;
    }

    return name;
  };

  this.getActiveCompetitionBanner = function () {
    let bannerImage = '';

    if (this.settings.lbWidget.settings.competition.activeContest) {
      if (this.settings.lbWidget.settings.competition.activeContest.bannerHighResolutionLink) {
        bannerImage = this.settings.lbWidget.settings.competition.activeContest.bannerHighResolutionLink;
      } else if (this.settings.lbWidget.settings.competition.activeContest.bannerLink) {
        bannerImage = this.settings.lbWidget.settings.competition.activeContest.bannerLink;
      }
    } else if (this.settings.lbWidget.settings.competition.activeCompetition) {
      if (this.settings.lbWidget.settings.competition.activeCompetition.bannerHighResolutionLink) {
        bannerImage = this.settings.lbWidget.settings.competition.activeCompetition.bannerHighResolutionLink;
      } else if (this.settings.lbWidget.settings.competition.activeCompetition.bannerLink) {
        bannerImage = this.settings.lbWidget.settings.competition.activeCompetition.bannerLink;
      }
    }

    return bannerImage;
  };

  this.getActiveCompetitionDescription = function () {
    const description = (this.settings.lbWidget.settings.competition.activeContest !== null &&
        this.settings.lbWidget.settings.competition.activeContest.description &&
        this.settings.lbWidget.settings.competition.activeContest.description.length > 0)
      ? this.settings.lbWidget.settings.competition.activeContest.description
      : ((this.settings.lbWidget.settings.competition.activeCompetition !== null &&
            this.settings.lbWidget.settings.competition.activeCompetition.description &&
            this.settings.lbWidget.settings.competition.activeCompetition.description.length > 0)
        ? this.settings.lbWidget.settings.competition.activeCompetition.description : '');

    return description
      ? description.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      : '<p>' + this.settings.lbWidget.settings.translation.global.descriptionEmpty + '</p>';
  };

  this.getActiveCompetitionTAndC = function () {
    const tc = (this.settings.lbWidget.settings.competition.activeContest !== null &&
      this.settings.lbWidget.settings.competition.activeContest.termsAndConditions &&
      this.settings.lbWidget.settings.competition.activeContest.termsAndConditions.length > 0)
      ? this.settings.lbWidget.settings.competition.activeContest.termsAndConditions
      : ((this.settings.lbWidget.settings.competition.activeCompetition !== null &&
        this.settings.lbWidget.settings.competition.activeCompetition.termsAndConditions &&
        this.settings.lbWidget.settings.competition.activeCompetition.termsAndConditions.length > 0)
        ? this.settings.lbWidget.settings.competition.activeCompetition.termsAndConditions : '');

    return tc
      ? tc.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      : '<p>' + this.settings.lbWidget.settings.translation.global.tAndCEmpty + '</p>';
  };

  this.leaderboardDetailsUpdate = function () {
    const _this = this;
    const mainLabel = query(_this.settings.section, '.cl-main-widget-lb-details-content-label-text');
    let body = null;
    let tc = null;
    let title = null;
    let bannerTitle = null;
    let bannerImage = null;
    let lbBannerImage = null;

    _this.settings.descriptionDate = query(_this.settings.container, '.cl-main-widget-lb-details-description-date');

    if (!_this.settings.lbWidget.settings.leaderboard.layoutSettings.titleLinkToDetailsPage) {
      body = query(_this.settings.section, '.cl-main-widget-lb-details-description');
      tc = query(_this.settings.section, '.cl-main-widget-lb-details-tc');
      title = query(_this.settings.section, '.cl-main-widget-lb-details-description-header-title');
      bannerTitle = query(_this.settings.section, '.cl-main-widget-lb-details-description-label-text');
      bannerImage = query(_this.settings.section, '.cl-main-widget-lb-details-description-banner');
      lbBannerImage = query(_this.settings.section, '.cl-main-widget-lb-details');
      if (!body) return;

      const bodyInnerHTML = body.innerHTML;
      if (!bodyInnerHTML || bodyInnerHTML !== _this.getActiveCompetitionDescription()) {
        body.innerHTML = _this.getActiveCompetitionDescription();
      }

      if (!bannerImage.style || !bannerImage.style.backgroundImage || bannerImage.style.backgroundImage !== this.getActiveCompetitionBanner()) {
        const link = this.getActiveCompetitionBanner();
        if (link) {
          bannerImage.setAttribute('style', `background-image: url(${link})`);
        } else {
          bannerImage.setAttribute('style', '');
        }
      }

      if (!lbBannerImage.style || !lbBannerImage.style.backgroundImage || lbBannerImage.style.backgroundImage !== this.getActiveCompetitionBanner()) {
        const link = this.getActiveCompetitionBanner();
        const lbBannerContent = query(_this.settings.section, '.cl-main-widget-lb-details-content');
        if (link) {
          lbBannerImage.setAttribute('style', `background-image: url(${link})`);
          lbBannerContent.classList.add('no-gradient');
        } else {
          lbBannerImage.setAttribute('style', '');
          lbBannerContent.classList.remove('no-gradient');
        }
      }

      tc.innerHTML = _this.getActiveCompetitionTAndC();
      title.innerHTML = _this.getActiveContestTitle();
      bannerTitle.innerHTML = _this.getActiveContestTitle();
    }

    if (body === null) {
      body = document.createElement('div');
      body.innerHTML = _this.getActiveCompetitionDescription();
    }

    if (this.settings.lbWidget.settings.competition.activeCompetition && this.settings.lbWidget.settings.competition.activeCompetition.statusCode === 15) {
      mainLabel.innerHTML = this.settings.lbWidget.settings.competition.activeCompetition.name;
    } else {
      mainLabel.innerHTML = (_this.settings.lbWidget.settings.competition.activeContest !== null)
        ? _this.settings.lbWidget.settings.competition.activeContest.name
        : _this.settings.lbWidget.settings.translation.tournaments.noAvailableCompetitions;
    }
  };

  this.showEmbeddedCompetitionDetailsContent = async function (callback) {
    const listIcon = query(this.settings.container, '.cl-main-widget-lb-header-list-icon');
    const backIcon = query(this.settings.container, '.cl-main-widget-lb-header-back-icon');

    listIcon.style.display = 'none';
    backIcon.style.display = 'block';

    if (!hasClass(this.settings.section, 'cl-main-active-embedded-description')) {
      addClass(this.settings.section, 'cl-main-active-embedded-description');
    }

    await tournamentBrackets(
      this.settings.lbWidget.apiClientStomp,
      this.settings.lbWidget.settings.tournaments.activeCompetitionId,
      this.settings.lbWidget.settings.language,
      this.settings.lbWidget.settings.translation,
      this.settings.lbWidget.settings.competition.activeContestId
    );

    if (typeof callback === 'function') callback();
  };

  this.hideEmbeddedCompetitionDetailsContent = function (callback) {
    const listIcon = query(this.settings.container, '.cl-main-widget-lb-header-list-icon');
    const backIcon = query(this.settings.container, '.cl-main-widget-lb-header-back-icon');
    const missingMember = document.querySelector('.cl-main-widget-lb-missing-member-details');

    if (missingMember) {
      missingMember.style.display = 'none';
    }

    listIcon.style.display = 'block';
    backIcon.style.display = 'none';

    removeClass(this.settings.section, 'cl-main-active-embedded-description');
    if (typeof callback === 'function') callback();
  };

  this.leaderboardOptInCheck = async function () {
    const optIn = query(this.settings.section, '.cl-main-widget-lb-optin-action');

    if (
      typeof this.settings.lbWidget.settings.competition.activeCompetition !== 'undefined' &&
      this.settings.lbWidget.settings.competition.activeCompetition !== null &&
      this.settings.lbWidget.settings.competition.activeCompetition.constraints &&
      this.settings.lbWidget.settings.competition.activeCompetition.constraints.includes('optinRequiredForEntrants')
    ) {
      const optInStatus = await this.settings.lbWidget.getCompetitionOptInStatus(
        this.settings.lbWidget.settings.competition.activeCompetition.id
      );

      if (optInStatus.length && optInStatus[0].statusCode >= 15 && optInStatus[0].statusCode <= 35) {
        optIn.parentNode.style.display = 'none';
      } else if (optInStatus.length && (optInStatus[0].statusCode === 10 || optInStatus[0].statusCode === 0)) {
        optIn.innerHTML = this.settings.lbWidget.settings.translation.tournaments.processing;
        addClass(optIn, 'checking');
        optIn.parentNode.style.display = 'flex';
      } else {
        optIn.innerHTML = this.settings.lbWidget.settings.translation.tournaments.enter;
        optIn.parentNode.style.display = 'flex';
        removeClass(optIn, 'checking');
      }
    } else {
      optIn.parentNode.style.display = 'none';
    }
  };

  // cleanup/recover activity
  this.preLoaderRerun = function () {
    const _this = this;

    if (_this.settings.preLoader.preLoaderActive && _this.settings.preLoader.preloaderCallbackRecovery !== null &&
      _this.settings.preLoader.preLoaderlastAttempt !== null && typeof _this.settings.preLoader.preLoaderlastAttempt === 'number' &&
      (_this.settings.preLoader.preLoaderlastAttempt + 8000) < new Date().getTime()) {
      _this.settings.preLoader.preloaderCallbackRecovery();
    }
  };

  this.preloader = function () {
    const _this = this;
    const preLoader = query(_this.settings.section, '.cl-main-widget-pre-loader');

    return {
      show: function (callback) {
        _this.settings.preLoader.preLoaderActive = true;
        _this.settings.preLoader.preLoaderlastAttempt = new Date().getTime();
        preLoader.style.display = 'block';
        setTimeout(function () {
          preLoader.style.opacity = 1;
        }, 20);

        if (_this.settings.preLoader.preloaderCallbackRecovery === null && typeof callback === 'function') {
          _this.settings.preLoader.preloaderCallbackRecovery = callback;
        }

        callback();
      },
      hide: function () {
        _this.settings.preLoader.preLoaderActive = false;
        _this.settings.preLoader.preLoaderlastAttempt = null;
        preLoader.style.opacity = 0;

        if (_this.settings.preLoader.preloaderCallbackRecovery !== null) {
          _this.settings.preLoader.preloaderCallbackRecovery = null;
        }

        setTimeout(function () {
          preLoader.style.display = 'none';
        }, 200);
      }
    };
  };

  this.destroyLayout = function () {
    if (this.settings.container !== null) {
      remove(this.settings.container);
      remove(this.settings.overlayContainer);
    }

    this.settings.container = null;
    this.settings.overlayContainer = null;
  };

  this.loadLeaderboard = function (callback, isTimeReload = false) {
    const _this = this;

    if (_this.settings.container === null) {
      _this.settings.container = _this.settings.lbWidget.settings.bindContainer.appendChild(_this.layout());
      _this.settings.overlayContainer = _this.settings.lbWidget.settings.bindContainer.appendChild(_this.overlayLayout());
      _this.settings.navigation = query(_this.settings.container, '.cl-main-widget-navigation-container');
      _this.settings.section = query(_this.settings.container, '.cl-main-widget-section-container');
      _this.settings.leaderboard.container = query(_this.settings.section, '.cl-main-widget-lb-leaderboard');
      _this.settings.leaderboard.header = query(_this.settings.leaderboard.container, '.cl-main-widget-lb-leaderboard-header-labels');
      _this.settings.leaderboard.resultContainer = query(_this.settings.leaderboard.container, '.cl-main-widget-lb-leaderboard-res-container');
      _this.settings.leaderboard.list = query(_this.settings.leaderboard.container, '.cl-main-widget-lb-leaderboard-body-res');
      _this.settings.leaderboard.topResults = query(_this.settings.leaderboard.container, '.cl-main-widget-lb-leaderboard-header-top-res');
      _this.settings.detailsContainer = query(_this.settings.container, '.cl-main-widget-lb-details-container');
      _this.settings.tournamentListContainer = query(_this.settings.container, '.cl-main-widget-tournaments-list');
      _this.settings.detailsContainerDate = query(_this.settings.container, '.cl-main-widget-lb-details-header-date');
      _this.settings.headerDate = query(_this.settings.container, '.cl-main-widget-lb-header-date');
      _this.settings.labelDate = query(_this.settings.container, '.cl-main-widget-lb-details-content-date');
      _this.settings.labelDateHeaders = query(_this.settings.container, '.cl-main-widget-lb-details-content-date-headers');
      _this.settings.detailsDateHeaders = query(_this.settings.container, '.cl-main-widget-lb-details-description-date-headers');
      _this.settings.achievement.container = query(_this.settings.container, '.' + _this.settings.lbWidget.settings.navigation.achievements.containerClass);
      _this.settings.achievement.detailsContainer = query(_this.settings.container, '.cl-main-widget-ach-details-container');
      _this.settings.reward.container = query(_this.settings.container, '.' + _this.settings.lbWidget.settings.navigation.rewards.containerClass);
      _this.settings.reward.detailsContainer = query(_this.settings.container, '.cl-main-widget-reward-details-container');
      _this.settings.messages.container = query(_this.settings.container, '.' + _this.settings.lbWidget.settings.navigation.inbox.containerClass);
      _this.settings.messages.detailsContainer = query(_this.settings.container, '.cl-main-widget-inbox-details-container');
      _this.settings.missions.container = query(_this.settings.container, '.' + _this.settings.lbWidget.settings.navigation.missions.containerClass);
      _this.settings.missions.detailsContainer = query(_this.settings.container, '.cl-main-widget-missions-details-container');
      _this.settings.missions.mapContainer = query(_this.settings.container, '.cl-main-widget-missions-map-container');

      _this.mainNavigationCheck();
      _this.leaderboardHeader();
    }

    _this.eventListeners();

    _this.leaderboardOptInCheck();
    _this.leaderboardDetailsUpdate();
    _this.updateLeaderboard();

    if (
      _this.settings.lbWidget.settings.competition.activeContest !== null ||
      (this.settings.lbWidget.settings.competition.activeCompetition && this.settings.lbWidget.settings.competition.activeCompetition.statusCode === 15)
    ) {
      if (isTimeReload) {
        _this.updateLeaderboardTime();
      }
    } else {
      _this.settings.labelDateHeaders.display = 'none';
      _this.settings.detailsDateHeaders.display = 'none';
    }

    if (typeof callback === 'function') {
      callback();
    }
  };

  this.clearAll = function () {
    this.settings.active = false;

    if (this.settings.leaderboard.timerInterval) {
      clearTimeout(this.settings.leaderboard.timerInterval);
    }

    this.settings.preLoader.preLoaderActive = false;
  };

  this.hide = function (callback) {
    const _this = this;

    _this.clearAll();

    if (_this.settings.container !== null) {
      removeClass(_this.settings.container, 'cl-show');

      setTimeout(function () {
        _this.settings.container.style.display = 'none';
        _this.settings.overlayContainer.style.display = 'none';

        _this.hideCompetitionDetails();
        _this.hideAchievementDetails();

        if (typeof callback === 'function') {
          callback();
        }
      }, 30);
    } else if (typeof callback === 'function') {
      callback();
    }
  };

  this.missingMember = function (isVisible) {
    const _this = this;
    const area = query(_this.settings.container, '.cl-main-widget-lb-missing-member');
    const areaDetails = query(_this.settings.container, '.cl-main-widget-lb-missing-member-details');
    let member = query(_this.settings.leaderboard.list, '.cl-lb-member-row');
    const sectionContainer = query(_this.settings.container, '.cl-main-widget-section-container');

    if (!member) {
      member = query(_this.settings.leaderboard.topResults, '.cl-lb-member-row');
    }

    if (Array.isArray(member)) {
      member = member[0];
    }

    if (area !== null && member !== null) {
      area.innerHTML = member.innerHTML;
    }

    if (areaDetails !== null && member !== null) {
      areaDetails.innerHTML = member.innerHTML;
    }

    if (!isVisible) {
      if (area !== null && member !== null) {
        area.style.display = 'flex';
      } else {
        area.style.display = 'none';
      }

      if (areaDetails !== null && member !== null && sectionContainer.classList.contains('cl-main-active-embedded-description')) {
        areaDetails.style.display = 'flex';
      } else {
        areaDetails.style.display = 'none';
      }
    } else if (sectionContainer.classList.contains('cl-main-active-embedded-description')) {
      if (areaDetails !== null && member !== null) {
        areaDetails.style.display = 'flex';
      } else {
        areaDetails.style.display = 'none';
      }
    } else {
      area.style.display = 'none';
      areaDetails.style.display = 'none';
    }
  };

  this.missingMemberReset = function () {
    const _this = this;
    const area = query(_this.settings.container, '.cl-main-widget-lb-missing-member');
    const areaDetails = query(_this.settings.container, '.cl-main-widget-lb-missing-member-details');
    area.innerHTML = '';
    areaDetails.innerHTML = '';
  };

  this.isElementVisibleInView = function (el, container) {
    if (Array.isArray(el)) {
      el = el[0];
    }
    const position = el.getBoundingClientRect();
    const elemContainer = container.getBoundingClientRect();
    const elemTop = position.top;
    const elemBottom = position.bottom;
    const elemHeight = position.height;
    const topThree = document.querySelector('.cl-main-widget-lb-leaderboard-header-top-res');
    let indentation = 110;

    if (topThree) {
      const topThreeStyle = window.getComputedStyle(topThree);
      if (topThreeStyle.position && topThreeStyle.position === 'relative') {
        indentation = 0;
      } else if (topThree.querySelector('.cl-lb-member-row')) {
        return true;
      }
    }

    return (elemTop - indentation) <= elemContainer.top
      ? elemContainer.top - (elemTop - indentation) <= elemHeight : elemBottom - elemContainer.bottom <= elemHeight;
  };

  let onresizeInitialised = false;
  this.eventListeners = function () {
    const _this = this;

    // unique solution to support horizontal mobile orientation
    if (_this.settings.leaderboard.resultContainer !== null && _this.settings.leaderboard.resultContainer.onscroll === null) {
      _this.settings.leaderboard.resultContainer.onscroll = function (evt) {
        evt.preventDefault();
        const member = query(_this.settings.leaderboard.resultContainer, '.cl-lb-member-row');

        if (member !== null) {
          _this.missingMember(_this.isElementVisibleInView(member, evt.target));
        }
      };
    }

    if (_this.settings.leaderboard.list !== null && _this.settings.leaderboard.list.parentNode.onscroll === null) {
      _this.settings.leaderboard.list.parentNode.onscroll = function (evt) {
        evt.preventDefault();
        const member = query(_this.settings.leaderboard.resultContainer, '.cl-lb-member-row');

        if (member !== null) {
          _this.missingMember(_this.isElementVisibleInView(member, evt.target));
        }
      };
    }

    if (!onresizeInitialised) {
      onresizeInitialised = true;
      window.onresize = function (evt) {
        const member = query(_this.settings.leaderboard.resultContainer, '.cl-lb-member-row');

        if (member !== null) {
          // _this.missingMember(_this.isElementVisibleInView(member, _this.settings.leaderboard.list.parentNode));
          _this.missingMember(_this.isElementVisibleInView(member, _this.settings.leaderboard.resultContainer));
        }
      };
    }

    const darkModeToggle = document.querySelector('input[id=darkmode-toggle]');
    const mainContainer = document.querySelector('.cl-main-widget-wrapper');
    const msContainer = document.querySelector('.cl-widget-ms-wrapper');
    const notificationContainer = document.querySelector('.cl-widget-notif-wrapper');

    if (darkModeToggle) {
      darkModeToggle.addEventListener('change', function () {
        if (this.checked) {
          mainContainer.classList.add('lightTheme');
          msContainer.classList.add('lightTheme');
          if (notificationContainer) notificationContainer.classList.add('lightTheme');
        } else {
          mainContainer.classList.remove('lightTheme');
          msContainer.classList.remove('lightTheme');
          if (notificationContainer) notificationContainer.classList.remove('lightTheme');
        }
      });
    }
  };

  this.competitionDetailsOptInButtonState = function () {
    const _this = this;
    const optIn = query(_this.settings.detailsContainer, '.cl-main-widget-lb-details-optin-action');

    if (typeof _this.settings.lbWidget.settings.competition.activeCompetition.optinRequired === 'boolean' && _this.settings.lbWidget.settings.competition.activeCompetition.optinRequired) {
      if (typeof _this.settings.lbWidget.settings.competition.activeCompetition.optin === 'boolean' && !_this.settings.lbWidget.settings.competition.activeCompetition.optin) {
        optIn.innerHTML = _this.settings.lbWidget.settings.translation.tournaments.enter;
        removeClass(optIn, 'cl-disabled');
      } else {
        optIn.innerHTML = _this.settings.lbWidget.settings.translation.tournaments.registered;
        addClass(optIn, 'cl-disabled');
      }
      optIn.parentNode.style.display = 'block';
    } else {
      optIn.parentNode.style.display = 'none';
    }
  };

  this.loadCompetitionDetails = function (callback) {
    const _this = this;
    const label = query(_this.settings.detailsContainer, '.cl-main-widget-lb-details-header-label');
    const body = query(_this.settings.detailsContainer, '.cl-main-widget-lb-details-body');
    const image = query(_this.settings.detailsContainer, '.cl-main-widget-lb-details-body-image-cont');
    const listIcon = query(this.settings.container, '.cl-main-widget-lb-header-list-icon');
    const backIcon = query(this.settings.container, '.cl-main-widget-lb-header-back-icon');

    listIcon.style.display = 'none';
    backIcon.style.display = 'block';

    image.innerHTML = '';
    label.innerHTML = (_this.settings.lbWidget.settings.competition.activeContest.label.length > 0) ? _this.settings.lbWidget.settings.competition.activeContest.label : _this.settings.lbWidget.settings.competition.activeCompetition.label;
    body.innerHTML = (_this.settings.lbWidget.settings.competition.activeContest.description.length > 0) ? _this.settings.lbWidget.settings.competition.activeContest.description : _this.settings.lbWidget.settings.competition.activeCompetition.description;
    _this.competitionDetailsOptInButtonState();

    _this.settings.detailsContainer.style.display = 'block';
    _this.settings.headerDate.style.display = 'none';

    setTimeout(function () {
      addClass(_this.settings.detailsContainer, 'cl-show');

      if (typeof callback === 'function') callback();
    }, 50);
  };

  this.loadCompetitionList = function (
    callback,
    readyPageNumber = 1,
    activePageNumber = 1,
    finishedPageNumber = 1,
    paginationArr = null,
    isReady = false,
    isActive = true,
    isFinished = false
  ) {
    const _this = this;
    const listResContainer = query(_this.settings.tournamentListContainer, '.cl-main-widget-tournaments-list-body-res');
    const listIcon = query(_this.settings.container, '.cl-main-widget-lb-header-list-icon');
    const backIcon = query(_this.settings.container, '.cl-main-widget-lb-header-back-icon');
    const preLoader = _this.preloader();

    const totalCount = _this.settings.lbWidget.settings.tournaments.totalCount;
    const readyTotalCount = _this.settings.lbWidget.settings.tournaments.readyTotalCount;
    const finishedTotalCount = _this.settings.lbWidget.settings.tournaments.finishedTotalCount;
    const itemsPerPage = 12;

    const prev = document.createElement('span');
    prev.setAttribute('class', 'paginator-item prev');
    const next = document.createElement('span');
    next.setAttribute('class', 'paginator-item next');

    let paginator = query(listResContainer, '.paginator-active');
    if (!paginator && totalCount > itemsPerPage) {
      const pagesCount = Math.ceil(totalCount / itemsPerPage);
      paginator = document.createElement('div');
      paginator.setAttribute('class', 'paginator-active');
      addClass(paginator, 'paginator');
      addClass(paginator, 'accordion');

      let page = '';
      const isEllipsis = pagesCount > 7;

      if (isEllipsis) {
        for (let i = 0; i < 7; i++) {
          if (i === 5) {
            page += '<span class="paginator-item" data-page="..."\>...</span>';
          } else if (i === 6) {
            page += '<span class="paginator-item" data-page=' + pagesCount + '\>' + pagesCount + '</span>';
          } else {
            page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
          }
        }
      } else {
        for (let i = 0; i < pagesCount; i++) {
          page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
        }
      }

      paginator.innerHTML = page;

      const prev = document.createElement('span');
      prev.setAttribute('class', 'paginator-item prev');
      const next = document.createElement('span');
      next.setAttribute('class', 'paginator-item next');

      paginator.prepend(prev);
      paginator.appendChild(next);
    }

    let readyPaginator = query(listResContainer, '.paginator-ready');
    if (!readyPaginator && readyTotalCount > itemsPerPage) {
      const pagesCount = Math.ceil(readyTotalCount / itemsPerPage);
      readyPaginator = document.createElement('div');
      readyPaginator.setAttribute('class', 'paginator-ready');
      addClass(readyPaginator, 'paginator');
      addClass(readyPaginator, 'accordion');

      let page = '';
      const isEllipsis = pagesCount > 7;

      if (isEllipsis) {
        for (let i = 0; i < 7; i++) {
          if (i === 5) {
            page += '<span class="paginator-item" data-page="..."\>...</span>';
          } else if (i === 6) {
            page += '<span class="paginator-item" data-page=' + pagesCount + '\>' + pagesCount + '</span>';
          } else {
            page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
          }
        }
      } else {
        for (let i = 0; i < pagesCount; i++) {
          page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
        }
      }

      readyPaginator.innerHTML = page;

      const prev = document.createElement('span');
      prev.setAttribute('class', 'paginator-item prev');
      const next = document.createElement('span');
      next.setAttribute('class', 'paginator-item next');

      readyPaginator.prepend(prev);
      readyPaginator.appendChild(next);
    }

    let finishedPaginator = query(listResContainer, '.paginator-finished');
    if (!finishedPaginator && finishedTotalCount > itemsPerPage) {
      const pagesCount = Math.ceil(finishedTotalCount / itemsPerPage);
      finishedPaginator = document.createElement('div');
      finishedPaginator.setAttribute('class', 'paginator-finished');
      addClass(finishedPaginator, 'paginator');
      addClass(finishedPaginator, 'accordion');

      let page = '';
      const isEllipsis = pagesCount > 7;

      if (isEllipsis) {
        for (let i = 0; i < 7; i++) {
          if (i === 5) {
            page += '<span class="paginator-item" data-page="..."\>...</span>';
          } else if (i === 6) {
            page += '<span class="paginator-item" data-page=' + pagesCount + '\>' + pagesCount + '</span>';
          } else {
            page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
          }
        }
      } else {
        for (let i = 0; i < pagesCount; i++) {
          page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
        }
      }

      finishedPaginator.innerHTML = page;

      const prev = document.createElement('span');
      prev.setAttribute('class', 'paginator-item prev');
      const next = document.createElement('span');
      next.setAttribute('class', 'paginator-item next');

      finishedPaginator.prepend(prev);
      finishedPaginator.appendChild(next);
    }

    if (isReady) {
      _this.settings.tournamentsSection.accordionLayout.map(t => {
        t.show = t.type === 'readyCompetitions';
      });
      if (paginationArr && paginationArr.length) {
        let page = '';
        for (const i in paginationArr) {
          page += '<span class="paginator-item" data-page=' + paginationArr[i] + '\>' + paginationArr[i] + '</span>';
        }
        readyPaginator.innerHTML = page;

        readyPaginator.prepend(prev);
        readyPaginator.appendChild(next);
      }
    } else if (isFinished) {
      _this.settings.tournamentsSection.accordionLayout.map(t => {
        t.show = t.type === 'finishedCompetitions';
      });
      if (paginationArr && paginationArr.length) {
        let page = '';
        for (const i in paginationArr) {
          page += '<span class="paginator-item" data-page=' + paginationArr[i] + '\>' + paginationArr[i] + '</span>';
        }
        finishedPaginator.innerHTML = page;

        finishedPaginator.prepend(prev);
        finishedPaginator.appendChild(next);
      }
    } else {
      _this.settings.tournamentsSection.accordionLayout.map(t => {
        t.show = t.type === 'activeCompetitions';
      });
      if (paginationArr && paginationArr.length) {
        let page = '';
        for (const i in paginationArr) {
          page += '<span class="paginator-item" data-page=' + paginationArr[i] + '\>' + paginationArr[i] + '</span>';
        }
        paginator.innerHTML = page;

        paginator.prepend(prev);
        paginator.appendChild(next);
      }
    }

    preLoader.show(function () {
      listIcon.style.display = 'none';
      backIcon.style.display = 'block';
      const accordionObj = _this.tournamentsList(_this.settings.tournamentsSection.accordionLayout, function (accordionSection, listContainer, topEntryContainer, layout) {
        const tournamentData = _this.settings.lbWidget.settings.tournaments[layout.type];

        if (typeof tournamentData !== 'undefined') {
          if (tournamentData.length === 0) {
            accordionSection.style.display = 'none';
          }
          mapObject(tournamentData, function (tournament, key, count) {
            if ((count + 1) <= layout.showTopResults && query(topEntryContainer, '.cl-tournament-' + tournament.id) === null) {
              const topEntryContaineRlistItem = _this.tournamentItem(tournament);
              topEntryContainer.appendChild(topEntryContaineRlistItem);
            }

            if (query(listContainer, '.cl-tournament-' + tournament.id) === null) {
              const listItem = _this.tournamentItem(tournament);
              listContainer.appendChild(listItem);
            }
          });
        }
      });

      listResContainer.innerHTML = '';
      listResContainer.appendChild(accordionObj);

      if (finishedPaginator) {
        const finishedContainer = query(listResContainer, '.finishedCompetitions');
        if (finishedContainer) {
          const listContainer = query(finishedContainer, '.cl-accordion-list-container');
          const paginatorItems = query(finishedPaginator, '.paginator-item');
          paginatorItems.forEach(item => {
            removeClass(item, 'active');
            if (Number(item.dataset.page) === Number(finishedPageNumber)) {
              addClass(item, 'active');
            }
          });

          listContainer.appendChild(finishedPaginator);
        }
      }

      if (readyPaginator) {
        const readyContainer = query(listResContainer, '.readyCompetitions');
        if (readyContainer) {
          const listContainer = query(readyContainer, '.cl-accordion-list-container');
          const paginatorItems = query(readyPaginator, '.paginator-item');
          paginatorItems.forEach(item => {
            removeClass(item, 'active');
            if (Number(item.dataset.page) === Number(readyPageNumber)) {
              addClass(item, 'active');
            }
          });

          listContainer.appendChild(readyPaginator);
        }
      }

      if (paginator) {
        const activeContainer = query(listResContainer, '.activeCompetitions');
        if (activeContainer) {
          const listContainer = query(activeContainer, '.cl-accordion-list-container');
          const paginatorItems = query(paginator, '.paginator-item');
          paginatorItems.forEach(item => {
            removeClass(item, 'active');
            if (Number(item.dataset.page) === Number(activePageNumber)) {
              addClass(item, 'active');
            }
          });

          listContainer.appendChild(paginator);
        }
      }

      _this.settings.tournamentListContainer.style.display = 'block';
      setTimeout(function () {
        addClass(_this.settings.tournamentListContainer, 'cl-show');

        if (typeof callback === 'function') callback();

        preLoader.hide();
      }, 50);
    });
  };

  this.toggleCompetitionDescription = function () {
    const descriptionLabel = query(this.settings.section, '.cl-main-widget-lb-details-description-title');
    const description = query(this.settings.section, '.cl-main-widget-lb-details-description');
    const tcLabel = query(this.settings.section, '.cl-main-widget-lb-details-tc-title');
    const tc = query(this.settings.section, '.cl-main-widget-lb-details-tc');

    if (tc.style.display === 'block') {
      tcLabel.style.display = 'none';
      tc.style.display = 'none';
      descriptionLabel.style.display = 'block';
      description.style.display = 'block';
    } else {
      tcLabel.style.display = 'block';
      tc.style.display = 'block';
      descriptionLabel.style.display = 'none';
      description.style.display = 'none';
    }
  };

  this.toggleAchievementDescription = function () {
    const descriptionLabel = query(this.settings.section, '.cl-main-widget-ach-details-body-description-title');
    const description = query(this.settings.section, '.cl-main-widget-ach-details-body');
    const tcLabel = query(this.settings.section, '.cl-main-widget-ach-details-body-description-tc-title');
    const tc = query(this.settings.section, '.cl-main-widget-ach-details-tc');

    if (tc.style.display === 'block') {
      tcLabel.style.display = 'none';
      tc.style.display = 'none';
      descriptionLabel.style.display = 'block';
      description.style.display = 'block';
    } else {
      tcLabel.style.display = 'block';
      tc.style.display = 'block';
      descriptionLabel.style.display = 'none';
      description.style.display = 'none';
    }
  };

  this.hideCompetitionList = function (callback) {
    const _this = this;
    const listIcon = query(_this.settings.container, '.cl-main-widget-lb-header-list-icon');
    const backIcon = query(_this.settings.container, '.cl-main-widget-lb-header-back-icon');

    listIcon.style.display = 'block';
    backIcon.style.display = 'none';
    _this.hideEmbeddedCompetitionDetailsContent();
    _this.missingMemberReset();

    removeClass(_this.settings.tournamentListContainer, 'cl-show');

    setTimeout(function () {
      _this.settings.tournamentListContainer.style.display = 'none';

      if (typeof callback === 'function') callback();
    }, 200);
  };

  this.hideCompetitionDetails = function (callback) {
    const _this = this;

    removeClass(_this.settings.detailsContainer, 'cl-show');
    setTimeout(function () {
      _this.settings.detailsContainer.style.display = 'none';
      _this.settings.headerDate.style.display = 'block';

      if (typeof callback === 'function') callback();
    }, 200);
  };

  this.achievementItem = function (ach) {
    const listItem = document.createElement('div');
    listItem.setAttribute('class', 'cl-ach-list-item cl-ach-' + ach.id);
    listItem.dataset.id = ach.id;

    let isMore = false;
    let isEnter = false;
    let isLeave = false;
    let isProgress = false;

    if (Array.isArray(ach.constraints) && ach.constraints.includes('optinRequiredForEntrants')) {
      if (ach.optInStatus && ach.optInStatus >= 15 && ach.optInStatus <= 35) {
        isLeave = true;
      } else if (!isNaN(ach.optInStatus) && (ach.optInStatus === 10 || ach.optInStatus === 0)) {
        isProgress = true;
      } else {
        isEnter = true;
      }
    } else {
      isMore = true;
    }

    let bgImage = '';
    if (ach.iconLink) {
      bgImage = 'background-image: url(' + ach.iconLink + ')';
    }

    let rewardValue = '';
    if (ach.reward) {
      rewardValue = this.settings.lbWidget.settings.partialFunctions.rewardFormatter(ach.reward);
    }

    const template = require('../templates/mainWidget/achievementItem.hbs');
    listItem.innerHTML = template({
      id: ach.id,
      title: ach.name,
      bgImage: bgImage,
      rewardValue: rewardValue,
      moreLabel: this.settings.lbWidget.settings.translation.achievements.more,
      enterLabel: this.settings.lbWidget.settings.translation.achievements.listEnterBtn,
      leaveLabel: this.settings.lbWidget.settings.translation.achievements.listLeaveBtn,
      progressLabel: this.settings.lbWidget.settings.translation.achievements.listProgressionBtn,
      isMore: isMore,
      isEnter: isEnter,
      isLeave: isLeave,
      isProgress: isProgress
    });

    return listItem;
  };

  this.achievementItemUpdateProgression = function (id, percentageComplete) {
    const achList = query(
      this.settings.section,
      '.' + this.settings.lbWidget.settings.navigation.achievements.containerClass + ' .cl-main-widget-ach-list-body-res'
    );
    if (!achList) return;

    const ach = achList.querySelector('[data-id="' + id + '"]');
    if (!ach) return;

    const bar = query(ach, '.cl-ach-list-progression-bar');
    const barLabel = query(ach, '.cl-ach-list-progression-label');
    bar.style.width = ((percentageComplete > 1 || percentageComplete === 0) ? percentageComplete : 1) + '%';
    barLabel.innerHTML = percentageComplete + '/100';
  };

  this.achievementDashboardItemUpdateProgression = function (id, percentageComplete) {
    const achList = document.querySelector('.cl-main-widget-dashboard-achievements-list');
    if (!achList) return;

    const ach = achList.querySelector('[data-id="' + id + '"]');
    if (!ach) return;

    const bar = query(ach, '.cl-ach-list-progression-bar');
    const barLabel = query(ach, '.cl-ach-list-progression-label');
    bar.style.width = ((percentageComplete > 1 || percentageComplete === 0) ? percentageComplete : 1) + '%';
    barLabel.innerHTML = percentageComplete + '/100';
  };

  this.achievementListLayout = function (pageNumber, achievementData, paginationArr = null) {
    const _this = this;
    const achList = query(_this.settings.section, '.' + _this.settings.lbWidget.settings.navigation.achievements.containerClass + ' .cl-main-widget-ach-list-body-res');
    const totalCount = _this.settings.lbWidget.settings.achievements.totalCount;
    const itemsPerPage = _this.settings.lbWidget.settings.itemsPerPage;
    let paginator = query(achList, '.paginator');

    const prev = document.createElement('span');
    prev.setAttribute('class', 'paginator-item prev');
    const next = document.createElement('span');
    next.setAttribute('class', 'paginator-item next');

    achList.innerHTML = '';

    if (paginationArr && paginationArr.length) {
      let page = '';
      for (const i in paginationArr) {
        page += '<span class="paginator-item" data-page=' + paginationArr[i] + '\>' + paginationArr[i] + '</span>';
      }
      paginator.innerHTML = page;

      paginator.prepend(prev);
      paginator.appendChild(next);
    }

    if (!paginator && totalCount > itemsPerPage) {
      const pagesCount = Math.ceil(totalCount / 6);
      paginator = document.createElement('div');
      paginator.setAttribute('class', 'paginator');

      let page = '';
      const isEllipsis = pagesCount > 7;

      if (isEllipsis) {
        for (let i = 0; i < 7; i++) {
          if (i === 5) {
            page += '<span class="paginator-item" data-page="..."\>...</span>';
          } else if (i === 6) {
            page += '<span class="paginator-item" data-page=' + pagesCount + '\>' + pagesCount + '</span>';
          } else {
            page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
          }
        }
      } else {
        for (let i = 0; i < pagesCount; i++) {
          page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
        }
      }

      paginator.innerHTML = page;

      paginator.prepend(prev);
      paginator.appendChild(next);
    }

    mapObject(achievementData, function (ach) {
      if (query(achList, '.cl-ach-' + ach.id) === null) {
        const listItem = _this.achievementItem(ach);
        achList.appendChild(listItem);
      }
    });

    if (paginator) {
      const paginatorItems = query(paginator, '.paginator-item');
      paginatorItems.forEach(item => {
        removeClass(item, 'active');
        if (Number(item.dataset.page) === Number(pageNumber)) {
          addClass(item, 'active');
        }
      });

      achList.appendChild(paginator);
    }
  };

  this.loadAchievementDetails = async function (data, callback) {
    const _this = this;
    const label = query(_this.settings.achievement.detailsContainer, '.cl-main-widget-ach-details-header-label');
    const body = query(_this.settings.achievement.detailsContainer, '.cl-main-widget-ach-details-body');
    const descriptionLabel = query(_this.settings.achievement.detailsContainer, '.cl-main-widget-ach-details-body-description-title');
    const tc = query(_this.settings.achievement.detailsContainer, '.cl-main-widget-ach-details-tc');
    const tcLabel = query(_this.settings.achievement.detailsContainer, '.cl-main-widget-ach-details-body-description-tc-title');
    const image = query(_this.settings.achievement.detailsContainer, '.cl-main-widget-ach-details-body-image-cont');
    const pregressBar = query(_this.settings.achievement.detailsContainer, '.cl-main-widget-ach-details-body-progress-bar');
    const pregressLabel = query(_this.settings.achievement.detailsContainer, '.cl-main-widget-ach-details-body-progress-label');
    const reward = query(_this.settings.achievement.detailsContainer, '.cl-main-widget-ach-details-reward');

    tcLabel.style.display = 'none';
    tc.style.display = 'none';
    descriptionLabel.style.display = 'block';
    body.style.display = 'block';

    if (data.reward) {
      reward.innerHTML = this.settings.lbWidget.settings.partialFunctions.rewardFormatter(data.reward);
    } else {
      reward.innerHTML = '';
    }

    let optinRequiredForEntrants = false;

    if (data.constraints && data.constraints.length) {
      optinRequiredForEntrants = data.constraints.includes('optinRequiredForEntrants');
    }

    const optIn = query(_this.settings.achievement.detailsContainer, '.cl-main-widget-ach-details-optin-action');

    const memberAchievementOptInStatus = await _this.settings.lbWidget.getMemberAchievementOptInStatus(data.id);

    if (optinRequiredForEntrants) {
      if (
        memberAchievementOptInStatus.length &&
        memberAchievementOptInStatus[0].statusCode >= 15 &&
        memberAchievementOptInStatus[0].statusCode <= 35
      ) {
        optIn.innerHTML = _this.settings.lbWidget.settings.translation.achievements.leave;
        removeClass(optIn, 'cl-disabled');
        addClass(optIn, 'leave-achievement');
        optIn.style.display = 'block';
      } else if (
        memberAchievementOptInStatus.length &&
        (memberAchievementOptInStatus[0].statusCode === 10 || memberAchievementOptInStatus[0].statusCode === 0)
      ) {
        optIn.innerHTML = _this.settings.lbWidget.settings.translation.achievements.listProgressionBtn;
        removeClass(optIn, 'cl-disabled');
        addClass(optIn, 'leave-achievement');
        optIn.style.display = 'block';
      } else {
        optIn.innerHTML = _this.settings.lbWidget.settings.translation.achievements.enter;
        removeClass(optIn, 'cl-disabled');
        optIn.style.display = 'block';
      }
    } else {
      addClass(optIn, 'cl-disabled');
      optIn.style.display = 'none';
    }

    label.innerHTML = data.name;
    body.innerHTML = data.description ? data.description.replace(/&lt;/g, '<').replace(/&gt;/g, '>') : _this.settings.lbWidget.settings.translation.global.descriptionEmpty;
    tc.innerHTML = data.termsAndConditions
      ? data.termsAndConditions.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      : this.settings.lbWidget.settings.translation.global.tAndCEmpty;

    if (data && data.iconLink) {
      image.setAttribute('style', `background-image: url(${data.iconLink})`);
    }

    this.settings.lbWidget.checkForMemberAchievementsProgression([data.id], function (issued, progression) {
      if (issued && issued.length && issued[0].status === 'Completed') {
        pregressLabel.innerHTML = '100/100';
        pregressBar.style.width = '100%';
      } else if (progression && progression.length) {
        const perc = progression[0].percentageComplete ? parseInt(progression[0].percentageComplete) : 0;
        const percValue = ((perc > 1 || perc === 0) ? perc : 1) + '%';
        pregressLabel.innerHTML = perc + '/100';
        pregressBar.style.width = percValue;
      }
    });

    _this.settings.achievement.detailsContainer.style.display = 'block';
    setTimeout(function () {
      addClass(_this.settings.achievement.detailsContainer, 'cl-show');

      if (typeof callback === 'function') callback();
    }, 50);
  };

  this.hideAchievementDetails = function (callback) {
    const _this = this;

    removeClass(_this.settings.achievement.detailsContainer, 'cl-show');
    setTimeout(function () {
      _this.settings.achievement.detailsContainer.style.display = 'none';

      if (typeof callback === 'function') callback();
    }, 200);
  };

  this.loadRewardDetails = function (data, callback) {
    const _this = this;
    const label = query(_this.settings.reward.detailsContainer, '.cl-main-widget-reward-details-header-label');
    const body = query(_this.settings.reward.detailsContainer, '.cl-main-widget-reward-details-description');
    const image = query(_this.settings.reward.detailsContainer, '.cl-main-widget-reward-details-body-image-cont');
    const iconWrapp = query(_this.settings.reward.detailsContainer, '.cl-main-widget-reward-winnings-icon');
    const claimBtn = query(_this.settings.reward.detailsContainer, '.cl-main-widget-reward-claim-btn');
    const icon = query(_this.settings.reward.detailsContainer, '.cl-main-widget-reward-winnings-icon');
    const value = query(_this.settings.reward.detailsContainer, '.cl-main-widget-reward-winnings-value');

    label.innerHTML = data.name;
    body.innerHTML = data.description ? data.description.replace(/&lt;/g, '<').replace(/&gt;/g, '>') : '';
    value.innerHTML = _this.settings.lbWidget.settings.partialFunctions.rewardFormatter(data);
    claimBtn.dataset.id = data.id;

    if (data.claimed) {
      addClass(claimBtn, 'cl-claimed');
      claimBtn.innerHTML = _this.settings.lbWidget.settings.translation.rewards.claimed;
    } else {
      removeClass(claimBtn, 'cl-claimed');
      claimBtn.innerHTML = _this.settings.lbWidget.settings.translation.rewards.claim;
    }

    if (data.icon && typeof data.icon !== 'undefined') {
      icon.innerHTML = '';

      const _image = new Image();
      iconWrapp.style.background = 'none';
      _image.setAttribute('class', 'cl-reward-list-item-img');

      _image.src = data.icon;
      _image.alt = _this.settings.lbWidget.settings.partialFunctions.rewardFormatter(data);

      icon.appendChild(_image);
    } else {
      icon.innerHTML = '';
      iconWrapp.style.background = null;
    }

    objectIterator(query(body, 'img'), function (img, key, count) {
      if (count === 0) {
        const newImg = img.cloneNode(true);
        image.innerHTML = '';
        image.appendChild(newImg);

        remove(img);
      }
    });

    _this.settings.reward.detailsContainer.style.display = 'block';
    setTimeout(function () {
      addClass(_this.settings.reward.detailsContainer, 'cl-show');

      if (typeof callback === 'function') callback();
    }, 50);
  };

  this.loadMessageDetails = function (data, callback) {
    const _this = this;
    const label = query(_this.settings.messages.detailsContainer, '.cl-main-widget-inbox-details-header-label');
    const body = query(_this.settings.messages.detailsContainer, '.cl-main-widget-inbox-details-body');
    const date = query(_this.settings.messages.detailsContainer, '.cl-main-widget-inbox-details-header-date');

    if (!data || !data.subject) {
      return;
    }

    label.innerHTML = data.subject;
    date.innerHTML = (new Date(data.created)).toLocaleString('en-GB', { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'short' });
    let bodyHtml = data.body;
    bodyHtml = bodyHtml.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    body.innerHTML = bodyHtml;

    _this.settings.messages.detailsContainer.style.display = 'block';
    setTimeout(function () {
      addClass(_this.settings.messages.detailsContainer, 'cl-show');

      if (typeof callback === 'function') callback();
    }, 50);
  };

  this.loadMissionDetails = function (mission, callback) {
    this.settings.missions.mission = mission;
    const _this = this;
    const label = query(_this.settings.missions.detailsContainer, '.cl-main-widget-missions-details-header-label');
    const body = query(_this.settings.missions.detailsContainer, '.cl-main-widget-missions-details-description');
    const tc = query(_this.settings.missions.detailsContainer, '.cl-main-widget-missions-details-tc');
    const prizeValue = query(_this.settings.missions.detailsContainer, '.cl-main-widget-missions-details-prize-value');
    const icon = query(_this.settings.missions.detailsContainer, '.cl-main-widget-missions-details-body-image');

    if (!mission.data || !mission.data.name) {
      if (typeof callback === 'function') callback();
      return;
    }

    if (mission.data.iconLink) {
      icon.setAttribute('style', `background-image: url(${mission.data.iconLink})`);
      icon.classList.add('full-bg');
    }

    if (mission.data.reward && mission.data.reward.rewardValue) {
      prizeValue.innerHTML = _this.settings.lbWidget.settings.partialFunctions.rewardFormatter(mission.data.reward);
    }

    label.innerHTML = mission.data.name;
    body.innerHTML = mission.data.description
      ? mission.data.description.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      : this.settings.lbWidget.settings.translation.global.descriptionEmpty;
    tc.innerHTML = mission.data.termsAndConditions
      ? mission.data.termsAndConditions.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      : this.settings.lbWidget.settings.translation.global.tAndCEmpty;

    _this.settings.missions.detailsContainer.style.display = 'block';
    setTimeout(function () {
      addClass(_this.settings.missions.detailsContainer, 'cl-show');
      _this.hideMissionMap();

      if (typeof callback === 'function') callback();
    }, 50);
  };

  this.showMissionTC = function () {
    const body = query(this.settings.missions.detailsContainer, '.cl-main-widget-missions-details-description');
    const label = query(this.settings.missions.detailsContainer, '.cl-main-widget-missions-details-description-label');
    body.style.display = 'none';
    label.style.display = 'none';

    const tcBody = query(this.settings.missions.detailsContainer, '.cl-main-widget-missions-details-tc');
    const tcLabel = query(this.settings.missions.detailsContainer, '.cl-main-widget-missions-details-tc-label');
    tcBody.style.display = 'block';
    tcLabel.style.display = 'block';
  };

  this.hideMissionTC = function () {
    const body = query(this.settings.missions.detailsContainer, '.cl-main-widget-missions-details-description');
    const label = query(this.settings.missions.detailsContainer, '.cl-main-widget-missions-details-description-label');
    body.style.display = 'block';
    label.style.display = 'block';

    const tcBody = query(this.settings.missions.detailsContainer, '.cl-main-widget-missions-details-tc');
    const tcLabel = query(this.settings.missions.detailsContainer, '.cl-main-widget-missions-details-tc-label');
    tcBody.style.display = 'none';
    tcLabel.style.display = 'none';
  };

  this.loadMissionDetailsCyGraph = function () {
    const container = document.getElementById('cy');
    const mainWrapper = document.querySelector('.cl-main-widget-wrapper');
    const isLightTheme = mainWrapper.classList.contains('lightTheme');

    const nodeColor = isLightTheme ? '#BEE9F3' : '#2F0426';
    const nodeBorderColor = isLightTheme ? '#F7A1E4' : '#406A8C';
    const nodeLabelColor = isLightTheme ? '#141E28' : '#ffffff';

    const greenClassColor = isLightTheme ? '#219653' : '#6FCF97';
    const redClassColor = isLightTheme ? '#EB5757' : '#EB5757';
    const yellowClassColor = isLightTheme ? '#F2994A' : '#F2994A';

    if (container.style.display === 'block') {
      container.style.display = 'none';
      this.hideMissionTC();

      return;
    }

    this.showMissionTC();

    container.style.display = 'block';
    container.innerHTML = '';

    cytoscape.use(dagre);

    const nodes = [];
    const edges = [];

    this.settings.missions.mission.graph.nodes.forEach(n => {
      nodes.push({ data: { id: n.entityId, label: n.name } });
    });

    this.settings.missions.mission.graph.graphs[0].edges.forEach(e => {
      if (e.graphEdgeType === 'ROOT') return;
      let classes = '';
      switch (e.graphEdgeType) {
        case 'MUST':
          classes = 'green';
          break;
        case 'SHOULD':
          classes = 'yellow';
          break;
        case 'MUSTNOT':
          classes = 'red';
          break;
      }
      edges.push({ data: { source: e.headEntityId, target: e.tailEntityId, label: e.graphEdgeType.toLowerCase() }, classes: classes });
    });

    // eslint-disable-next-line
    const cy = cytoscape({
      container: document.getElementById('cy'),

      boxSelectionEnabled: false,
      autounselectify: true,

      style: [
        {
          selector: 'node',
          style: {
            height: '48px',
            width: '48px',
            'border-color': nodeBorderColor,
            'background-color': nodeColor,
            'border-width': 1,
            label: 'data(label)',
            color: nodeLabelColor,
            'font-size': '12px'
          }
        },
        {
          selector: 'edge',
          style: {
            'curve-style': 'taxi',
            width: 1,
            'target-arrow-shape': 'triangle',
            'line-color': greenClassColor,
            'target-arrow-color': greenClassColor,
            'line-style': 'dashed',
            label: 'data(label)',
            color: greenClassColor
          }
        },
        {
          selector: 'node[label]',
          css: {
            'text-margin-y': '-5px'
          }
        },
        {
          selector: 'edge[label]',
          css: {
            label: 'data(label)',
            'text-rotation': 'autorotate',
            'text-margin-x': '-10px',
            'text-margin-y': '-10px',
            'font-size': '12px'
          }
        },
        {
          selector: '.red',
          css: {
            'curve-style': 'taxi',
            width: 1,
            'target-arrow-shape': 'triangle',
            'line-color': redClassColor,
            'target-arrow-color': redClassColor,
            'line-style': 'dashed'
          }
        },
        {
          selector: '.yellow',
          css: {
            'curve-style': 'taxi',
            width: 1,
            'target-arrow-shape': 'triangle',
            'line-color': yellowClassColor,
            'target-arrow-color': yellowClassColor,
            'line-style': 'dashed'
          }
        },
        {
          selector: '.red[label]',
          css: {
            color: redClassColor
          }
        },
        {
          selector: '.yellow[label]',
          css: {
            color: yellowClassColor
          }
        }
      ],

      elements: {
        nodes: nodes,
        edges: edges
      },

      layout: {
        name: 'dagre',
        directed: true,
        rankDir: 'LR',
        padding: 30,
        fit: true,
        spacingFactor: 1.5
      }
    });

    cy.on('tap', 'node', function (evt) {
      const node = evt.target;
      console.log('id: ' + node.id());
    });
  };

  this.loadMissionMap = (mission, callback) => {
    this.settings.missions.mission = mission;
    const _this = this;
    const backBtn = document.querySelector('.cl-main-widget-mission-header-back-icon');

    backBtn.style.display = 'block';

    _this.settings.missions.mapContainer.style.display = 'block';

    setTimeout(function () {
      addClass(_this.settings.missions.mapContainer, 'cl-show');
      _this.loadMissionMapGraph();
      if (typeof callback === 'function') callback();
    }, 50);
  };

  this.loadMissionMapGraph = async () => {
    const _this = this;
    const container = document.getElementById('cy-map');
    const mainWrapper = document.querySelector('.cl-main-widget-wrapper');
    const isLightTheme = mainWrapper.classList.contains('lightTheme');
    const isMobile = window.screen.availWidth < 768;

    const itemBgEl = document.querySelector('.cl-main-widget-missions-map-graph-item-bg');
    const style = window.getComputedStyle(itemBgEl, false);

    const starEl3 = document.querySelector('.cl-main-widget-missions-map-graph-item-star-3');
    const starEl2 = document.querySelector('.cl-main-widget-missions-map-graph-item-star-2');
    const starEl1 = document.querySelector('.cl-main-widget-missions-map-graph-item-star-1');

    let itemBgSrc = style.backgroundImage.slice(4, -1).replace(/"/g, '');
    if (!itemBgSrc || itemBgSrc[0] === 'f') {
      itemBgSrc = 'https://ziqni.cdn.ziqni.com/ziqni-tech/ziqni-member-widget/images/map-item-bg.png';
    }

    let starEl3Src = window.getComputedStyle(starEl3, false).backgroundImage.slice(4, -1).replace(/"/g, '');
    let starEl2Src = window.getComputedStyle(starEl2, false).backgroundImage.slice(4, -1).replace(/"/g, '');
    let starEl1Src = window.getComputedStyle(starEl1, false).backgroundImage.slice(4, -1).replace(/"/g, '');

    if (starEl3Src[0] === 'f') {
      starEl3Src = 'https://ziqni.cdn.ziqni.com/ziqni-tech/ziqni-member-widget/images/rate3.svg';
      starEl2Src = 'https://ziqni.cdn.ziqni.com/ziqni-tech/ziqni-member-widget/images/rate2.svg';
      starEl1Src = 'https://ziqni.cdn.ziqni.com/ziqni-tech/ziqni-member-widget/images/rate1.svg';
    }

    const achIds = this.settings.missions.mission.graph.nodes.map(n => n.entityId);
    const achievements = await this.settings.lbWidget.getAchievementsByIds(achIds);
    const statuses = await this.settings.lbWidget.getMemberAchievementsOptInStatuses(achIds);
    // statuses[1].percentageComplete = 50;
    // statuses[4].percentageComplete = 100;
    // statuses[3].percentageComplete = 70;

    container.innerHTML = '';

    cytoscape.use(dagre);

    const nodes = [];
    const edges = [];

    this.settings.missions.mission.graph.nodes.forEach((n) => {
      let src = 'none';
      const idx = achievements.findIndex(a => a.id === n.entityId);
      if (idx !== -1) {
        if (achievements[idx].iconLink) {
          src = achievements[idx].iconLink;
        }
      }

      let starSrc = 'none';
      const statusIdx = statuses.findIndex(a => a.entityId === n.entityId);
      if (statusIdx !== -1) {
        if (statuses[statusIdx].percentageComplete >= 33 && statuses[statusIdx].percentageComplete < 66) starSrc = starEl1Src;
        if (statuses[statusIdx].percentageComplete >= 66 && statuses[statusIdx].percentageComplete < 100) starSrc = starEl2Src;
        if (statuses[statusIdx].percentageComplete === 100) starSrc = starEl3Src;
      }

      nodes.push({ data: { id: n.entityId, label: n.name, images: [itemBgSrc, src, starSrc, 'https://ziqni.cdn.ziqni.com/ziqni-tech/ziqni-member-widget/images/map-item-bottom.svg'] } });
    });

    this.settings.missions.mission.graph.graphs[0].edges.forEach(e => {
      if (e.graphEdgeType === 'ROOT') return;
      let classes = '';
      switch (e.graphEdgeType) {
        case 'MUST':
          classes = 'green';
          break;
        case 'SHOULD':
          classes = 'yellow';
          break;
        case 'MUSTNOT':
          classes = 'red';
          break;
      }
      edges.push({ data: { source: e.headEntityId, target: e.tailEntityId, label: e.graphEdgeType.toLowerCase() }, classes: classes });
    });

    const backgroundColor = isLightTheme ? '#EDF3F7' : '#0f1921';
    const nodeLabelColor = isLightTheme ? '#223241' : '#ffffff';
    const edgeLineColor = isLightTheme ? '#B9CEDF' : '#304F69';
    const graphDir = isMobile ? 'TB' : 'LR';

    const cy = cytoscape({
      container: document.getElementById('cy-map'),

      boxSelectionEnabled: false,
      autounselectify: true,
      zoom: 1,

      style: [
        {
          selector: 'node',
          style: {
            height: '90px',
            width: '90px',
            'background-color': backgroundColor,
            'background-image': 'data(images)',
            'background-fit': 'none cover none none',
            'background-clip': 'none node none none',
            'bounds-expansion': 60,
            'background-image-containment': 'over over over over',
            'background-repeat': 'no-repeat',
            label: 'data(label)',
            color: nodeLabelColor,
            'font-size': '12px',
            'text-valign': 'bottom',
            'text-halign': 'center'
          }
        },
        {
          selector: 'edge',
          style: {
            'curve-style': 'unbundled-bezier',
            width: 5,
            'line-color': edgeLineColor,
            'line-style': 'dashed',
            'line-dash-pattern': [0, 14],
            'line-cap': 'round'
          }
        },
        {
          selector: 'node[label]',
          css: {
            'text-margin-y': '25px'
          }
        }
      ],

      elements: {
        nodes: nodes,
        edges: edges
      },

      layout: {
        name: 'dagre',
        directed: true,
        rankDir: graphDir,
        padding: 20,
        fit: true,
        spacingFactor: 1.3
      }
    });

    cy.on('tap', 'node', function () {
      _this.loadMissionDetails(_this.settings.missions.mission, null);
    });
  };

  this.hideMissionMap = () => {
    const backBtn = document.querySelector('.cl-main-widget-mission-header-back-icon');
    const container = document.getElementById('cy-map');

    backBtn.style.display = 'none';
    container.innerHTML = '';

    this.settings.missions.mapContainer.style.display = 'none';
  };

  this.hideRewardDetails = function (callback) {
    const _this = this;

    removeClass(_this.settings.reward.detailsContainer, 'cl-show');
    setTimeout(function () {
      _this.settings.reward.detailsContainer.style.display = 'none';

      if (typeof callback === 'function') callback();
    }, 200);
  };

  this.hideMessageDetails = function (callback) {
    const _this = this;

    removeClass(_this.settings.messages.detailsContainer, 'cl-show');
    setTimeout(function () {
      _this.settings.messages.detailsContainer.style.display = 'none';

      if (typeof callback === 'function') callback();
    }, 200);
  };

  this.hideMissionDetails = function (callback) {
    const _this = this;

    const cyContainer = document.getElementById('cy');
    cyContainer.style.display = 'none';
    cyContainer.innerHTML = '';

    removeClass(_this.settings.missions.detailsContainer, 'cl-show');
    setTimeout(function () {
      _this.settings.missions.detailsContainer.style.display = 'none';

      if (typeof callback === 'function') callback();
    }, 200);
  };

  this.updateAchievementProgressionAndIssued = function (issued, progression) {
    const _this = this;
    const achList = query(_this.settings.section, '.' + _this.settings.lbWidget.settings.navigation.achievements.containerClass + ' .cl-main-widget-ach-list-body-res');
    const dashboardAchList = document.querySelector('.cl-main-widget-dashboard-achievements-list');

    objectIterator(query(achList, '.cl-ach-list-item'), function (ach) {
      const id = ach.dataset.id;
      const issuedStatus = (issued.findIndex(i => i.entityId === id) !== -1);

      let perc = 0;
      mapObject(progression, function (pr) {
        if (pr.entityId === id) {
          perc = pr.percentageComplete ? parseInt(pr.percentageComplete) : 0;
        }
      });

      if (ach !== null) {
        const bar = query(ach, '.cl-ach-list-progression-bar');
        const barLabel = query(ach, '.cl-ach-list-progression-label');

        if (issuedStatus) {
          addClass(bar, 'cl-ach-complete');
          barLabel.innerHTML = '100/100';
          bar.style.width = '100%';
        } else {
          const percValue = ((perc > 1 || perc === 0) ? perc : 1) + '%';
          barLabel.innerHTML = perc + '/100';
          bar.style.width = percValue;
        }
      }
    });

    objectIterator(query(dashboardAchList, '.cl-ach-list-item'), function (ach) {
      const id = ach.dataset.id;
      const issuedStatus = (issued.findIndex(i => i.entityId === id) !== -1);

      let perc = 0;
      mapObject(progression, function (pr) {
        if (pr.entityId === id) {
          perc = pr.percentageComplete ? parseInt(pr.percentageComplete) : 0;
        }
      });

      if (ach !== null) {
        const bar = query(ach, '.cl-ach-list-progression-bar');
        const barLabel = query(ach, '.cl-ach-list-progression-label');

        if (issuedStatus) {
          addClass(bar, 'cl-ach-complete');
          barLabel.innerHTML = '100/100';
          bar.style.width = '100%';
        } else {
          const percValue = ((perc > 1 || perc === 0) ? perc : 1) + '%';
          barLabel.innerHTML = perc + '/100';
          bar.style.width = percValue;
        }
      }
    });
  };

  this.loadAchievements = function (pageNumber, callback, paginationArr = null) {
    const _this = this;

    _this.settings.lbWidget.checkForAvailableAchievements(pageNumber, function (achievementData) {
      // _this.settings.lbWidget.updateAchievementNavigationCounts();
      _this.achievementListLayout(pageNumber, achievementData, paginationArr);

      const idList = _this.settings.lbWidget.settings.achievements.list.map(a => a.id);

      _this.settings.lbWidget.checkForMemberAchievementsProgression(idList, function (issued, progression) {
        _this.updateAchievementProgressionAndIssued(issued, progression);
      });

      if (typeof callback === 'function') {
        callback();
      }
    });
  };

  this.showLeaveAchievementPopup = function (activeAchievementId, isDashboard = false) {
    let container = null;
    if (isDashboard) {
      container = document.querySelector('.cl-main-widget-section-dashboard');
    } else {
      container = document.querySelector('.cl-main-widget-section-ach');
    }
    const popup = container.querySelector('.cl-main-widget-ach-list-popup-wrapp');
    const closeBtn = popup.querySelector('.cl-main-widget-ach-list-popup-close');
    const confirm = popup.querySelector('.cl-main-widget-ach-list-popup-confirm');
    const close = popup.querySelector('.cl-main-widget-ach-list-popup-cancel');

    const closePopup = () => {
      popup.style.display = 'none';
    };
    const leaveAchievement = () => {
      closePopup();
      this.settings.lbWidget.leaveAchievement(activeAchievementId, isDashboard);
    };

    popup.style.display = 'flex';

    closeBtn.removeEventListener('click', closePopup);
    close.removeEventListener('click', closePopup);
    confirm.removeEventListener('click', leaveAchievement);

    closeBtn.addEventListener('click', closePopup);
    close.addEventListener('click', closePopup);
    confirm.addEventListener('click', leaveAchievement);
  };

  this.dashboardTournamentItem = function (tournament, isReadyStatus = false) {
    const listItem = document.createElement('div');
    listItem.setAttribute('class', 'dashboard-tournament-item');
    listItem.setAttribute('data-id', tournament.id);

    let rewardValue = '';

    if (tournament.rewards && tournament.rewards.length) {
      const idx = tournament.rewards.findIndex(reward => {
        if (reward.rewardRank.indexOf('-') !== -1 || reward.rewardRank.indexOf(',') !== -1) {
          const rewardRankArr = reward.rewardRank.split(',');
          rewardRankArr.forEach(r => {
            const idx = r.indexOf('-');
            if (idx !== -1) {
              const start = parseInt(r);
              if (start === 1) {
                return true;
              }
            } else if (parseInt(r) === 1) {
              return true;
            }
            return false;
          });
        } else if (parseInt(reward.rewardRank) === 1) {
          return true;
        }
        return false;
      });

      if (idx !== -1) {
        rewardValue = this.settings.lbWidget.settings.partialFunctions.rewardFormatter(tournament.rewards[idx]);
      }
    }

    let itemBg = '';
    if (tournament.bannerLowResolutionLink) {
      itemBg = `background-image: url(${tournament.bannerLowResolutionLink})`;
    } else if (tournament.bannerLink) {
      itemBg = `background-image: url(${tournament.bannerLink})`;
    }

    const endsLabel = isReadyStatus
      ? this.settings.lbWidget.settings.translation.dashboard.startsTitle
      : this.settings.lbWidget.settings.translation.dashboard.endsTitle;

    const date = isReadyStatus ? new Date(tournament.scheduledStartDate) : new Date(tournament.scheduledEndDate);

    const template = require('../templates/dashboard/tournamentItem.hbs');
    listItem.innerHTML = template({
      title: tournament.name,
      itemBg: itemBg,
      endsLabel: endsLabel,
      endsValue: date.toLocaleString('en-GB', { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'short' }),
      prizeLabel: this.settings.lbWidget.settings.translation.dashboard.prizeTitle,
      prizeValue: rewardValue,
      seeMoreLabel: this.settings.lbWidget.settings.translation.dashboard.tournamentBtn
    });

    return listItem;
  };

  this.loadDashboardTournaments = async function () {
    const tournamentsList = query(this.settings.section, '.cl-main-widget-dashboard-tournaments-list');
    const tournamentsContainer = query(this.settings.section, '.cl-main-widget-dashboard-tournaments');
    const { activeCompetitions, readyCompetitions } = await this.settings.lbWidget.getDashboardCompetitions();

    tournamentsList.innerHTML = '';

    if (activeCompetitions && activeCompetitions.length) {
      tournamentsContainer.classList.remove('hidden');
      const title = document.querySelector('.cl-main-widget-dashboard-tournaments-title');
      title.innerHTML = this.settings.lbWidget.settings.translation.dashboard.tournamentsTitle;
      activeCompetitions.forEach(t => {
        const listItem = this.dashboardTournamentItem(t);
        tournamentsList.appendChild(listItem);
      });
    } else if (readyCompetitions && readyCompetitions.length) {
      tournamentsContainer.classList.remove('hidden');
      const title = document.querySelector('.cl-main-widget-dashboard-tournaments-title');
      title.innerHTML = this.settings.lbWidget.settings.translation.dashboard.upcomingTournamentsTitle;
      readyCompetitions.forEach(t => {
        const listItem = this.dashboardTournamentItem(t, true);
        tournamentsList.appendChild(listItem);
      });
    } else {
      tournamentsContainer.classList.add('hidden');
    }
  };

  this.loadDashboardAchievements = function (achievementData, callback) {
    const _this = this;
    const achList = query(this.settings.section, '.cl-main-widget-dashboard-achievements-list');
    const achContainer = query(this.settings.section, '.cl-main-widget-dashboard-achievements');
    achList.innerHTML = '';

    if (!achievementData.length) {
      achContainer.classList.add('hidden');
      return;
    }

    achContainer.classList.remove('hidden');

    if (achievementData.length > 2) {
      achievementData = achievementData.slice(0, 2);
    }

    mapObject(achievementData, function (ach) {
      if (query(achList, '.cl-ach-' + ach.id) === null) {
        const listItem = _this.achievementItem(ach);
        achList.appendChild(listItem);
      }
    });

    const idList = achievementData.map(a => a.id);

    _this.settings.lbWidget.checkForMemberAchievementsProgression(idList, function (issued, progression) {
      _this.updateAchievementProgressionAndIssued(issued, progression);
    });

    if (typeof callback === 'function') {
      callback();
    }
  };

  this.rewardItem = function (rew) {
    const listItem = document.createElement('div');
    listItem.setAttribute('class', 'cl-rew-list-item cl-rew-' + rew.id);
    listItem.dataset.id = rew.id;

    let iconLink = '';
    if (rew.rewardData && rew.rewardData.iconLink) {
      iconLink = `background-image: url(${rew.rewardData.iconLink})`;
    }

    const labelText = stripHtml(rew.name);
    const isClimeBtn = !rew.claimed && rew.statusCode !== 115;

    const template = require('../templates/mainWidget/rewardItem.hbs');
    listItem.innerHTML = template({
      isClimeBtn: isClimeBtn,
      claimBtnLabel: this.settings.lbWidget.settings.translation.rewards.claim,
      prize: this.settings.lbWidget.settings.partialFunctions.rewardFormatter(rew.rewardData),
      type: rew.rewardType.key,
      label: (labelText.length > 80) ? (labelText.substr(0, 80) + '...') : labelText,
      iconLink: iconLink
    });

    return listItem;
  };

  this.messageItem = function (inbox) {
    const listItem = document.createElement('div');
    listItem.setAttribute('class', 'cl-inbox-list-item cl-inbox-' + inbox.id);
    listItem.dataset.id = inbox.id;

    const content = stripHtml(inbox.body);

    const subject = (inbox.subject.length > 36) ? inbox.subject.substr(0, 36) + '...' : inbox.subject;
    const description = (content.length > 60) ? content.substr(0, 60) + '...' : content;
    const date = (new Date(inbox.created)).toLocaleString('en-GB', { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'short' });

    const template = require('../templates/mainWidget/messageItem.hbs');
    listItem.innerHTML = template({
      id: inbox.id,
      subject: subject,
      description: description,
      date: date
    });

    return listItem;
  };

  this.missionsItem = function (mission) {
    const listItem = document.createElement('div');
    listItem.setAttribute('class', 'cl-missions-list-item cl-mission-' + mission.id);
    listItem.dataset.id = mission.id;

    const name = (mission.name.length > 36) ? mission.name.substr(0, 36) + '...' : mission.name;
    const reward = mission.reward ? this.settings.lbWidget.settings.partialFunctions.rewardFormatter(mission.reward) : '';
    const actionsBtnLabel = this.settings.lbWidget.settings.translation.missions.btn;

    let bgImage = '';
    if (mission.bannerLowResolutionLink) {
      bgImage = `background-image: url(${mission.bannerLowResolutionLink})`;
    } else if (mission.bannerLink) {
      bgImage = `background-image: url(${mission.bannerLink})`;
    }

    const template = require('../templates/mainWidget/missionItem.hbs');
    listItem.innerHTML = template({
      name: name,
      reward: reward,
      actionsBtnLabel: actionsBtnLabel,
      bgImage: bgImage
    });

    return listItem;
  };

  this.tournamentItem = function (tournament) {
    const listItem = document.createElement('div');
    const detailsContainer = document.createElement('div');
    const label = document.createElement('div');
    const labelIcon = document.createElement('div');
    const period = document.createElement('div');
    const prize = document.createElement('div');

    let startDate = new Date(tournament.actualStartDate ?? tournament.scheduledStartDate);
    let endDate = new Date(tournament.actualEndDate ?? tournament.scheduledEndDate);
    startDate = startDate.toLocaleString('en-GB', { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'short' });
    endDate = endDate.toLocaleString('en-GB', { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'short' });

    listItem.setAttribute('class', 'cl-tour-list-item cl-tour-' + tournament.id);
    detailsContainer.setAttribute('class', 'cl-tour-list-details-cont');
    label.setAttribute('class', 'cl-tour-list-details-label');
    labelIcon.setAttribute('class', 'cl-tour-list-details-label-icon');
    period.setAttribute('class', 'cl-tour-list-details-period');
    prize.setAttribute('class', 'cl-tour-list-details-prize');

    listItem.dataset.id = tournament.id;
    label.innerHTML = tournament.name ?? '';
    period.innerHTML = startDate + ' - ' + endDate;

    if (this.settings.lbWidget.settings.tournaments.showTournamentsMenuPrizeColumn && tournament.rewards && tournament.rewards.length) {
      const firsReward = this.getTournamentReward(tournament, 1);

      if (firsReward) {
        prize.innerHTML = firsReward;
      }
    }

    detailsContainer.appendChild(labelIcon);
    detailsContainer.appendChild(label);
    detailsContainer.appendChild(period);
    if (this.settings.lbWidget.settings.tournaments.showTournamentsMenuPrizeColumn) {
      detailsContainer.appendChild(prize);
    }
    listItem.appendChild(detailsContainer);

    return listItem;
  };

  this.rewardsListLayout = function (
    pageNumber = 1,
    claimedPageNumber = 1,
    expiredPageNumber = 1,
    rewards,
    availableRewards,
    expiredRewards,
    paginationArr = null,
    isClaimed = false,
    isExpired = false
  ) {
    const _this = this;
    const rewardList = query(_this.settings.section, '.' + _this.settings.lbWidget.settings.navigation.rewards.containerClass + ' .cl-main-widget-reward-list-body-res');
    const totalCount = _this.settings.lbWidget.settings.awards.totalCount;
    const claimedTotalCount = _this.settings.lbWidget.settings.awards.claimedTotalCount;
    const itemsPerPage = 6;
    let paginator = query(rewardList, '.paginator-available');

    const prev = document.createElement('span');
    prev.setAttribute('class', 'paginator-item prev');
    const next = document.createElement('span');
    next.setAttribute('class', 'paginator-item next');

    if (!paginator && totalCount > itemsPerPage) {
      const pagesCount = Math.ceil(totalCount / itemsPerPage);
      paginator = document.createElement('div');
      paginator.setAttribute('class', 'paginator-available');
      addClass(paginator, 'paginator');
      addClass(paginator, 'accordion');

      let page = '';
      const isEllipsis = pagesCount > 7;

      if (isEllipsis) {
        for (let i = 0; i < 7; i++) {
          if (i === 5) {
            page += '<span class="paginator-item" data-page="..."\>...</span>';
          } else if (i === 6) {
            page += '<span class="paginator-item" data-page=' + pagesCount + '\>' + pagesCount + '</span>';
          } else {
            page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
          }
        }
      } else {
        for (let i = 0; i < pagesCount; i++) {
          page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
        }
      }

      paginator.innerHTML = page;

      const prev = document.createElement('span');
      prev.setAttribute('class', 'paginator-item prev');
      const next = document.createElement('span');
      next.setAttribute('class', 'paginator-item next');

      paginator.prepend(prev);
      paginator.appendChild(next);
    }

    let paginatorClaimed = query(rewardList, '.paginator-claimed');
    if (!paginatorClaimed && claimedTotalCount > itemsPerPage) {
      const pagesCount = Math.ceil(claimedTotalCount / itemsPerPage);
      paginatorClaimed = document.createElement('div');
      paginatorClaimed.setAttribute('class', 'paginator-claimed');
      addClass(paginatorClaimed, 'paginator');
      addClass(paginatorClaimed, 'accordion');

      let page = '';
      const isEllipsis = pagesCount > 7;

      if (isEllipsis) {
        for (let i = 0; i < 7; i++) {
          if (i === 5) {
            page += '<span class="paginator-item" data-page="..."\>...</span>';
          } else if (i === 6) {
            page += '<span class="paginator-item" data-page=' + pagesCount + '\>' + pagesCount + '</span>';
          } else {
            page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
          }
        }
      } else {
        for (let i = 0; i < pagesCount; i++) {
          page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
        }
      }

      paginatorClaimed.innerHTML = page;

      paginatorClaimed.prepend(prev);
      paginatorClaimed.appendChild(next);
    }

    if (isClaimed) {
      _this.settings.rewardsSection.accordionLayout.map(t => {
        if (t.type === 'claimedAwards') {
          t.show = true;
          if (paginationArr && paginationArr.length) {
            let page = '';
            for (const i in paginationArr) {
              page += '<span class="paginator-item" data-page=' + paginationArr[i] + '\>' + paginationArr[i] + '</span>';
            }
            paginatorClaimed.innerHTML = page;

            paginatorClaimed.prepend(prev);
            paginatorClaimed.appendChild(next);
          }
        } else {
          t.show = false;
        }
      });
    } else {
      _this.settings.rewardsSection.accordionLayout.map(t => {
        if (t.type === 'availableAwards') {
          t.show = true;
          if (paginationArr && paginationArr.length) {
            let page = '';
            for (const i in paginationArr) {
              page += '<span class="paginator-item" data-page=' + paginationArr[i] + '\>' + paginationArr[i] + '</span>';
            }
            paginator.innerHTML = page;

            paginator.prepend(prev);
            paginator.appendChild(next);
          }
        } else {
          t.show = false;
        }
      });
    }

    if (!totalCount) {
      if (claimedTotalCount) {
        _this.settings.rewardsSection.accordionLayout.map(t => {
          switch (t.type) {
            case 'availableAwards':
              t.show = false;
              break;
            case 'claimedAwards':
              t.show = true;
              break;
          }
        });
      } else {
        _this.settings.rewardsSection.accordionLayout.map(t => {
          switch (t.type) {
            case 'availableAwards':
              t.show = false;
              break;
            case 'claimedAwards':
              if (this.settings.lbWidget.settings.instantWins.enable) {
                t.show = false;
              } else {
                t.show = true;
              }
              break;
            case 'instantWins':
              if (this.settings.lbWidget.settings.instantWins.enable) {
                t.show = true;
              }
              break;
          }
        });
      }
    }

    const accordionObj = _this.awardsList(_this.settings.rewardsSection.accordionLayout, function (accordionSection, listContainer, topEntryContainer, layout, paginator) {
      let rewardData = _this.settings.lbWidget.settings.awards[layout.type];
      if (typeof rewardData !== 'undefined') {
        if (rewardData.length === 0) {
          accordionSection.style.display = 'none';
        }
        rewardData = rewardData.filter(r => r.rewardData);
        mapObject(rewardData, function (rew, key, count) {
          if ((count + 1) <= layout.showTopResults && query(topEntryContainer, '.cl-reward-' + rew.id) === null) {
            var topEntryContaineRlistItem = _this.rewardItem(rew);
            topEntryContainer.appendChild(topEntryContaineRlistItem);
          }

          if (query(listContainer, '.cl-reward-' + rew.id) === null) {
            var listItem = _this.rewardItem(rew);
            listContainer.appendChild(listItem);
          }
        });
      }
    });

    rewardList.innerHTML = '';
    rewardList.appendChild(accordionObj);

    if (paginator) {
      const paginatorItems = query(paginator, '.paginator-item');
      paginatorItems.forEach(item => {
        removeClass(item, 'active');
        if (Number(item.dataset.page) === Number(pageNumber)) {
          addClass(item, 'active');
        }
      });

      const availableRewards = query(rewardList, '.cl-accordion.availableAwards');
      if (availableRewards) {
        const container = query(availableRewards, '.cl-accordion-list-container');
        container.appendChild(paginator);
      }
    }

    if (paginatorClaimed) {
      const paginatorItems = query(paginatorClaimed, '.paginator-item');
      paginatorItems.forEach(item => {
        removeClass(item, 'active');
        if (Number(item.dataset.page) === Number(claimedPageNumber)) {
          addClass(item, 'active');
        }
      });
      const claimedRewards = query(rewardList, '.cl-accordion.claimedAwards');
      if (claimedRewards) {
        const container = query(claimedRewards, '.cl-accordion-list-container');
        container.appendChild(paginatorClaimed);
      }
    }

    const availableBtn = document.querySelector('.cl-main-accordion-container-menu-item.availableAwards');
    const claimedBtn = document.querySelector('.cl-main-accordion-container-menu-item.claimedAwards');

    if (!totalCount) {
      availableBtn.classList.add('not-available');
    } else {
      availableBtn.classList.remove('not-available');
    }

    if (!claimedTotalCount) {
      claimedBtn.classList.add('not-available');
    } else {
      claimedBtn.classList.remove('not-available');
    }
  };

  this.messagesListLayout = function (pageNumber, paginationArr) {
    const _this = this;
    const messageList = query(_this.settings.section, '.' + _this.settings.lbWidget.settings.navigation.inbox.containerClass + ' .cl-main-widget-inbox-list-body-res');
    const totalCount = _this.settings.lbWidget.settings.messages.totalCount;
    const itemsPerPage = 9;
    let paginator = query(messageList, '.paginator');

    const prev = document.createElement('span');
    prev.setAttribute('class', 'paginator-item prev');
    const next = document.createElement('span');
    next.setAttribute('class', 'paginator-item next');

    if (paginationArr && paginationArr.length) {
      let page = '';
      for (const i in paginationArr) {
        page += '<span class="paginator-item" data-page=' + paginationArr[i] + '\>' + paginationArr[i] + '</span>';
      }
      paginator.innerHTML = page;

      paginator.prepend(prev);
      paginator.appendChild(next);
    }

    if (!paginator && totalCount > itemsPerPage) {
      const pagesCount = Math.ceil(totalCount / itemsPerPage);
      paginator = document.createElement('div');
      paginator.setAttribute('class', 'paginator');

      let page = '';
      const isEllipsis = pagesCount > 7;

      if (isEllipsis) {
        for (let i = 0; i < 7; i++) {
          if (i === 5) {
            page += '<span class="paginator-item" data-page="..."\>...</span>';
          } else if (i === 6) {
            page += '<span class="paginator-item" data-page=' + pagesCount + '\>' + pagesCount + '</span>';
          } else {
            page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
          }
        }
      } else {
        for (let i = 0; i < pagesCount; i++) {
          page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
        }
      }

      paginator.innerHTML = page;

      paginator.prepend(prev);
      paginator.appendChild(next);
    }

    messageList.innerHTML = '';

    mapObject(_this.settings.lbWidget.settings.messages.messages, function (inboxItem, key, count) {
      const listItem = _this.messageItem(inboxItem);
      messageList.appendChild(listItem);
    });

    if (paginator) {
      const paginatorItems = query(paginator, '.paginator-item');
      paginatorItems.forEach(item => {
        removeClass(item, 'active');
        if (Number(item.dataset.page) === Number(pageNumber)) {
          addClass(item, 'active');
        }
      });

      messageList.appendChild(paginator);
    }
  };

  this.missionsListLayout = function (pageNumber, paginationArr = null) {
    const _this = this;
    const missionsList = query(_this.settings.section, '.' + _this.settings.lbWidget.settings.navigation.missions.containerClass + ' .cl-main-widget-missions-list-body-res');
    const totalCount = _this.settings.lbWidget.settings.missions.totalCount;
    const itemsPerPage = 6;
    let paginator = query(missionsList, '.paginator');

    const prev = document.createElement('span');
    prev.setAttribute('class', 'paginator-item prev');
    const next = document.createElement('span');
    next.setAttribute('class', 'paginator-item next');

    if (paginationArr && paginationArr.length) {
      let page = '';
      for (const i in paginationArr) {
        page += '<span class="paginator-item" data-page=' + paginationArr[i] + '\>' + paginationArr[i] + '</span>';
      }
      paginator.innerHTML = page;

      paginator.prepend(prev);
      paginator.appendChild(next);
    }

    if (!paginator && totalCount > itemsPerPage) {
      const pagesCount = Math.ceil(totalCount / itemsPerPage);
      paginator = document.createElement('div');
      paginator.setAttribute('class', 'paginator');

      let page = '';
      const isEllipsis = pagesCount > 7;

      if (isEllipsis) {
        for (let i = 0; i < 7; i++) {
          if (i === 5) {
            page += '<span class="paginator-item" data-page="..."\>...</span>';
          } else if (i === 6) {
            page += '<span class="paginator-item" data-page=' + pagesCount + '\>' + pagesCount + '</span>';
          } else {
            page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
          }
        }
      } else {
        for (let i = 0; i < pagesCount; i++) {
          page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
        }
      }

      paginator.innerHTML = page;

      paginator.prepend(prev);
      paginator.appendChild(next);
    }

    missionsList.innerHTML = '';

    mapObject(_this.settings.lbWidget.settings.missions.missions, function (missionsItem, key, count) {
      const listItem = _this.missionsItem(missionsItem);
      missionsList.appendChild(listItem);
    });

    if (paginator) {
      const paginatorItems = query(paginator, '.paginator-item');
      paginatorItems.forEach(item => {
        removeClass(item, 'active');
        if (Number(item.dataset.page) === Number(pageNumber)) {
          addClass(item, 'active');
        }
      });

      missionsList.appendChild(paginator);
    }
    setTimeout(function () {
      _this.updateMissionsTime();
    }, 1000);
  };

  this.updateMissionsTime = function () {
    const _this = this;

    if (_this.settings.missions.timerInterval) {
      clearTimeout(_this.settings.missions.timerInterval);
    }

    this.settings.lbWidget.settings.missions.missions.forEach(mission => {
      if (mission.scheduling.endDate) {
        const diff = moment(mission.scheduling.endDate).diff(moment());
        const date = _this.settings.lbWidget.formatMissionDateTime(moment.duration(diff));
        const el = document.querySelector(`.cl-missions-list-item[data-id="${mission.id}"]`);
        if (!el) return;
        const dateEl = el.querySelector('.cl-missions-list-details-date');
        if (!dateEl) return;
        dateEl.innerHTML = date;
      }
    });

    this.settings.missions.timerInterval = setTimeout(function () {
      _this.updateMissionsTime();
    }, 1000);
  };

  this.loadAwards = function (callback, pageNumber, claimedPageNumber, expiredPageNumber, paginationArr = null, isClaimed = false, isExpired = false) {
    const _this = this;
    _this.settings.lbWidget.checkForAvailableAwards(
      function (rewards, availableRewards, expiredRewards) {
        // _this.settings.lbWidget.updateRewardsNavigationCounts();
        _this.rewardsListLayout(pageNumber, claimedPageNumber, expiredPageNumber, rewards, availableRewards, expiredRewards, paginationArr, isClaimed, isExpired);

        if (typeof callback === 'function') {
          callback();
        }

        _this.loadInstantWins();
      },
      pageNumber,
      claimedPageNumber
    );
  };

  this.loadInstantWins = function () {
    const isMobile = window.screen.availWidth <= 768;

    const instantWinsContainer = document.querySelector('.cl-accordion.instantWins');
    const list = instantWinsContainer.querySelector('.cl-accordion-list');

    const wheel = document.createElement('div');
    const wheelLabel = document.createElement('div');
    const wheelImage = document.createElement('div');
    const wheelButton = document.createElement('div');

    const scratchcards = document.createElement('div');
    const scratchcardsLabel = document.createElement('div');
    const scratchcardsImage = document.createElement('div');
    const scratchcardsButton = document.createElement('div');

    const scratchcardsGame = document.createElement('div');
    const scratchcardsGameWrapper = document.createElement('div');
    const scratchcardsGameLabel = document.createElement('div');
    const scratchcardsGameContainer = document.createElement('div');
    const scratchcardsGameCardWrapper = document.createElement('div');
    const scratchcardsGameCardBlock = document.createElement('div');
    const scratchcardsGameCanvas = document.createElement('canvas');
    const scratchcardsGamePrize = document.createElement('div');
    const scratchcardsGamePrizeLabel = document.createElement('div');
    const scratchcardsGamePrizePrizes = document.createElement('div');
    const scratchcardsGamePrizePrizesPrize1 = document.createElement('div');
    const scratchcardsGamePrizePrizesPrize2 = document.createElement('div');
    const scratchcardsGamePrizePrizesPrize3 = document.createElement('div');
    const scratchcardsGamePrizePrizesPrize1Label = document.createElement('div');
    const scratchcardsGamePrizePrizesPrize2Label = document.createElement('div');
    const scratchcardsGamePrizePrizesPrize3Label = document.createElement('div');
    const scratchcardsGamePrizeButton = document.createElement('div');

    const scratchcardsPopup = document.createElement('div');
    const scratchcardsPopupLabel = document.createElement('div');
    const scratchcardsPopupDescription = document.createElement('div');
    const scratchcardsPopupButton = document.createElement('div');

    const singleWheel = document.createElement('div');
    const singleWheelWrapper = document.createElement('div');
    const singleWheelPopup = document.createElement('div');
    const singleWheelPopupLabel = document.createElement('div');
    const singleWheelPopupDescription = document.createElement('div');
    const singleWheelPopupButton = document.createElement('div');

    wheel.classList.add('wheel-item');
    wheelLabel.classList.add('wheel-label');
    wheelImage.classList.add('wheel-image');
    wheelButton.classList.add('wheel-button');

    scratchcards.classList.add('scratchcards-item');
    scratchcardsLabel.classList.add('scratchcards-label');
    scratchcardsImage.classList.add('scratchcards-image');
    scratchcardsButton.classList.add('scratchcards-button');

    singleWheel.classList.add('single-wheel');
    singleWheelWrapper.classList.add('single-wheel-wrapper');

    singleWheelPopup.classList.add('single-wheel-popup');
    singleWheelPopupLabel.classList.add('single-wheel-popup-label');
    singleWheelPopupDescription.classList.add('single-wheel-popup-description');
    singleWheelPopupButton.classList.add('single-wheel-popup-button');

    scratchcardsGame.classList.add('scratchcards-game');
    scratchcardsGameWrapper.classList.add('scratchcards-game-wrapper');
    scratchcardsGameLabel.classList.add('scratchcards-game-label');

    scratchcardsGameContainer.classList.add('scratchcards-game-container');
    scratchcardsGamePrize.classList.add('scratchcards-game-prize');
    scratchcardsGamePrizeLabel.classList.add('scratchcards-game-prize-label');
    scratchcardsGamePrizePrizes.classList.add('scratchcards-game-prize-prizes');
    scratchcardsGamePrizePrizesPrize1.classList.add('scratchcards-game-prize-prizes-first');
    scratchcardsGamePrizePrizesPrize2.classList.add('scratchcards-game-prize-prizes-second');
    scratchcardsGamePrizePrizesPrize3.classList.add('scratchcards-game-prize-prizes-third');
    scratchcardsGamePrizePrizesPrize1Label.classList.add('scratchcards-game-prize-prizes-label');
    scratchcardsGamePrizePrizesPrize2Label.classList.add('scratchcards-game-prize-prizes-label');
    scratchcardsGamePrizePrizesPrize3Label.classList.add('scratchcards-game-prize-prizes-label');
    scratchcardsGamePrizeButton.classList.add('scratchcards-game-prize-button');
    scratchcardsGameCardWrapper.classList.add('scratchcards-game-cardWrapper');
    scratchcardsGameCardBlock.classList.add('scratchcards-game-card-block');

    const wcardSize = isMobile ? '230' : '300';

    scratchcardsGameCanvas.classList.add('scratchcards-game-canvas');
    scratchcardsGameCanvas.setAttribute('width', wcardSize);
    scratchcardsGameCanvas.setAttribute('height', wcardSize);

    scratchcardsPopup.classList.add('scratchcards-popup');
    scratchcardsPopupLabel.classList.add('scratchcards-popup-label');
    scratchcardsPopupDescription.classList.add('scratchcards-popup-description');
    scratchcardsPopupButton.classList.add('scratchcards-popup-button');

    wheelLabel.innerHTML = this.settings.lbWidget.settings.translation.rewards.wheelLabel;
    scratchcardsLabel.innerHTML = this.settings.lbWidget.settings.translation.rewards.scratchcardsLabel;
    wheelButton.innerHTML = this.settings.lbWidget.settings.translation.rewards.wheelButton;
    scratchcardsButton.innerHTML = this.settings.lbWidget.settings.translation.rewards.scratchcardsButton;

    singleWheelPopupLabel.innerHTML = this.settings.lbWidget.settings.translation.rewards.singleWheelWinLabel;
    singleWheelPopupButton.innerHTML = this.settings.lbWidget.settings.translation.rewards.singleWheelWinButton;

    scratchcardsPopupLabel.innerHTML = this.settings.lbWidget.settings.translation.rewards.singleWheelWinLabel;
    scratchcardsPopupButton.innerHTML = this.settings.lbWidget.settings.translation.rewards.singleWheelWinButton;

    scratchcardsGameLabel.innerHTML = this.settings.lbWidget.settings.translation.rewards.scratchcardsLabel;
    scratchcardsGamePrizeLabel.innerHTML = this.settings.lbWidget.settings.translation.rewards.prizeLabel;
    scratchcardsGamePrizeButton.innerHTML = this.settings.lbWidget.settings.translation.rewards.prizeButton;

    scratchcardsGamePrizePrizesPrize1Label.innerHTML = 'First prize';
    scratchcardsGamePrizePrizesPrize2Label.innerHTML = 'Second prize';
    scratchcardsGamePrizePrizesPrize3Label.innerHTML = 'Third prize';

    scratchcardsPopup.appendChild(scratchcardsPopupLabel);
    scratchcardsPopup.appendChild(scratchcardsPopupDescription);
    scratchcardsPopup.appendChild(scratchcardsPopupButton);

    scratchcardsGamePrizePrizesPrize1.appendChild(scratchcardsGamePrizePrizesPrize1Label);
    scratchcardsGamePrizePrizesPrize2.appendChild(scratchcardsGamePrizePrizesPrize2Label);
    scratchcardsGamePrizePrizesPrize3.appendChild(scratchcardsGamePrizePrizesPrize3Label);

    scratchcardsGamePrizePrizes.appendChild(scratchcardsGamePrizePrizesPrize1);
    scratchcardsGamePrizePrizes.appendChild(scratchcardsGamePrizePrizesPrize2);
    scratchcardsGamePrizePrizes.appendChild(scratchcardsGamePrizePrizesPrize3);

    scratchcardsGamePrize.appendChild(scratchcardsGamePrizeLabel);
    scratchcardsGamePrize.appendChild(scratchcardsGamePrizePrizes);
    scratchcardsGamePrize.appendChild(scratchcardsGamePrizeButton);

    scratchcardsGameCardWrapper.appendChild(scratchcardsGameCanvas);
    scratchcardsGameCardWrapper.appendChild(scratchcardsGameCardBlock);

    scratchcardsGameContainer.appendChild(scratchcardsGameCardWrapper);
    scratchcardsGameContainer.appendChild(scratchcardsGamePrize);

    scratchcardsGameWrapper.appendChild(scratchcardsGameLabel);
    scratchcardsGameWrapper.appendChild(scratchcardsGameContainer);
    scratchcardsGame.appendChild(scratchcardsGameWrapper);
    scratchcardsGame.appendChild(scratchcardsPopup);

    singleWheelPopup.appendChild(singleWheelPopupLabel);
    singleWheelPopup.appendChild(singleWheelPopupDescription);
    singleWheelPopup.appendChild(singleWheelPopupButton);

    singleWheel.appendChild(singleWheelWrapper);
    singleWheel.appendChild(singleWheelPopup);

    wheel.appendChild(wheelLabel);
    wheel.appendChild(wheelImage);
    wheel.appendChild(wheelButton);

    scratchcards.appendChild(scratchcardsLabel);
    scratchcards.appendChild(scratchcardsImage);
    scratchcards.appendChild(scratchcardsButton);

    list.appendChild(wheel);
    list.appendChild(scratchcards);
    list.appendChild(singleWheel);
    list.appendChild(scratchcardsGame);
  };

  this.loadScratchCards = function () {
    const isMobile = window.screen.availWidth <= 768;
    const _this = this;
    const scratchcardsGame = document.querySelector('.scratchcards-game');
    const backBtn = document.querySelector('.cl-main-widget-reward-header-back');
    const scratchAllBtn = document.querySelector('.scratchcards-game-prize-button');
    const cardBlock = document.querySelector('.scratchcards-game-card-block');
    const themeWrapper = document.querySelector('.cl-widget-ms-wrapper');

    const isLightTheme = themeWrapper.classList.contains('lightTheme');

    cardBlock.innerHtml = '';
    while (cardBlock.firstChild) {
      cardBlock.removeChild(cardBlock.lastChild);
    }

    const prizeClasses = ['prize-1', 'prize-2', 'prize-3'];

    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.classList.add('scratchcards-game-card-cell');
      const randNum = Math.floor(Math.random() * 3);
      cell.classList.add(prizeClasses[randNum]);
      cardBlock.appendChild(cell);
    }

    scratchcardsGame.classList.add('cl-show');
    backBtn.style.display = 'block';

    const grid = [];
    for (let i = 0; i < 3; i++) {
      const row = [];
      for (let j = 0; j < 3; j++) {
        row.push({ image: getRandomImage(), scratched: false });
      }
      grid.push(row);
    }

    function getRandomImage () {
      return 'https://first-space.cdn.ziqni.com/member-home-page/img/second_prize.39d8d773.png';
    }

    const canvas = document.querySelector('.scratchcards-game-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const cellSize = isMobile ? 60 : 80;
    const spacing = isMobile ? 15 : 20;
    const borderRadius = 10;
    const cardSize = isMobile ? 212 : 300;

    ctx.clearRect(0, 0, cardSize, cardSize);

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const cell = grid[i][j];
        const x = j * (cellSize + spacing) + 10;
        const y = i * (cellSize + spacing) + 10;

        if (cell.scratched) {
          const image = new Image();
          image.src = cell.image;
          image.onload = () => {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x + borderRadius, y);
            ctx.arcTo(x + cellSize, y, x + cellSize, y + borderRadius, borderRadius);
            ctx.arcTo(x + cellSize, y + cellSize, x + cellSize - borderRadius, y + cellSize, borderRadius);
            ctx.arcTo(x, y + cellSize, x, y + cellSize - borderRadius, borderRadius);
            ctx.arcTo(x, y, x + borderRadius, y, borderRadius);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(image, x, y, cellSize, cellSize);

            ctx.restore();
          };
        } else {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x + borderRadius, y);
          ctx.arcTo(x + cellSize, y, x + cellSize, y + borderRadius, borderRadius);
          ctx.arcTo(x + cellSize, y + cellSize, x + cellSize - borderRadius, y + cellSize, borderRadius);
          ctx.arcTo(x, y + cellSize, x, y + cellSize - borderRadius, borderRadius);
          ctx.arcTo(x, y, x + borderRadius, y, borderRadius);
          ctx.closePath();
          ctx.shadowColor = isLightTheme ? 'rgba(238, 62, 200, 0.4)' : 'rgba(64, 106, 140, 0.5)';
          ctx.shadowBlur = 12;
          ctx.fillStyle = isLightTheme ? '#ffffff' : '#1A202C';
          ctx.fill();
          ctx.strokeStyle = isLightTheme ? '#F7A1E4' : '#406A8C';
          ctx.stroke();
          ctx.clip();

          ctx.fillStyle = '#BEE9F3';
          ctx.font = '40px Syne';

          const textWidth = ctx.measureText('?').width;
          const textX = x + (cellSize - textWidth) / 2;
          const textY = y + cellSize / 2 + 15;

          ctx.fillText('?', textX, textY);

          ctx.restore();
        }
      }
    }

    let isDrag = false;

    canvas.addEventListener('mousedown', function (event) {
      isDrag = true;
      clearArc(event.offsetX, event.offsetY);
      judgeVisible();
    }, false);

    canvas.addEventListener('mousemove', function (event) {
      if (!isDrag) {
        return;
      }
      clearArc(event.offsetX, event.offsetY);
      judgeVisible();
    }, false);

    canvas.addEventListener('mouseup', function (event) {
      isDrag = false;
    }, false);

    canvas.addEventListener('touchstart', function (event) {
      if (event.targetTouches.length !== 1) {
        return;
      }

      const r = canvas.getBoundingClientRect();
      const currX = event.touches[0].clientX - r.left;
      const currY = event.touches[0].clientY - r.top;

      event.preventDefault();

      isDrag = true;

      clearArc(currX, currY);
      judgeVisible();
    }, false);

    canvas.addEventListener('touchmove', function (event) {
      if (!isDrag || event.targetTouches.length !== 1) {
        return;
      }

      const r = canvas.getBoundingClientRect();
      const currX = event.touches[0].clientX - r.left;
      const currY = event.touches[0].clientY - r.top;

      event.preventDefault();
      clearArc(currX, currY);
      judgeVisible();
    }, false);

    canvas.addEventListener('touchend', function (event) {
      isDrag = false;
    }, false);

    function clearArc (x, y) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2, false);
      ctx.fill();
    }

    function judgeVisible () {
      const imageData = ctx.getImageData(0, 0, 300, 300);
      const pixels = imageData.data;
      const result = {};
      let i;
      let len;

      for (i = 3, len = pixels.length; i < len; i += 4) {
        result[pixels[i]] || (result[pixels[i]] = 0);
        result[pixels[i]]++;
      }

      let n = 0;
      for (let i = 0; i < pixels.length; i += 100) {
        if (pixels[i + 3] < 128) {
          n += 100;
        }
      }

      if (n >= pixels.length * 0.9) {
        ctx.globalCompositeOperation = 'destination-over';
        clearCanvas();
      }
    }

    function clearCanvas () {
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      showPopup();
    }

    function showPopup () {
      const popup = document.querySelector('.scratchcards-popup');
      popup.style.display = 'flex';

      const wrapp = document.querySelector('.scratchcards-game-wrapper');
      wrapp.classList.add('blur');

      const description = document.querySelector('.scratchcards-popup-description');
      description.innerHTML = _this.settings.lbWidget.settings.translation.rewards.singleWheelWinDescription + ' ' + 'First prize';
      description.innerHTML = _this.settings.lbWidget.settings.translation.rewards.singleWheelWinDescription + ' ' + 'First prize';

      const climeBtn = document.querySelector('.scratchcards-popup-button');
      climeBtn.addEventListener('click', () => {
        const popup = document.querySelector('.scratchcards-popup');
        const wrapp = document.querySelector('.scratchcards-game-wrapper');

        popup.style.display = 'none';
        wrapp.classList.remove('blur');
      });
    }

    scratchAllBtn.addEventListener('click', clearCanvas, false);
    document.addEventListener('DOMContentLoaded', judgeVisible, false);
  };

  this.loadSingleWheels = async function (singleWheelsData) {
    console.log('singleWheelsData:', singleWheelsData);
    const isMobile = window.screen.availWidth <= 768;
    const singleWheel = document.querySelector('.single-wheel');
    const singleWheelWrapper = singleWheel.querySelector('.single-wheel-wrapper');
    const backBtn = document.querySelector('.cl-main-widget-reward-header-back ');
    singleWheel.classList.add('cl-show');
    backBtn.style.display = 'block';

    if (singleWheelsData && singleWheelsData.length) {
      singleWheelsData.forEach((singleWheel, idx) => {
        const swDom = this.createSingleWheelDom(idx, singleWheel, isMobile);
        singleWheelWrapper.appendChild(swDom);
      });
      for (let i = 0; i < singleWheelsData.length; i++) {
        await this.loadSingleWheel(isMobile, singleWheelsData[i], i);
      }
    }
  };

  this.loadSingleWheel = async function (isMobile, singleWheel, idx) {
    const _this = this;
    const preLoader = _this.preloader();
    const tiles = singleWheel.tiles;

    const rand = (m, M) => Math.random() * (M - m) + m;
    const tot = tiles.length;
    const spinEl = document.querySelector('#spin-' + idx);
    const climeBtn = document.querySelector('.single-wheel-popup-button');
    const ctx = document.querySelector('#wheel-' + idx).getContext('2d');
    const dia = ctx.canvas.width;
    const rad = dia / 2;
    const PI = Math.PI;
    const TAU = 2 * PI;
    const arc = TAU / tiles.length;

    const friction = 0.991;
    let angVel = 0;
    let ang = 0;

    const wheelFont = isMobile ? '10px sans-serif' : 'bold 15px sans-serif';

    const getIndex = () => Math.floor(tot - (ang / TAU) * tot) % tot;

    const randomRgbColor = () => {
      const r = Math.floor(Math.random() * 256); // Random between 0-255
      const g = Math.floor(Math.random() * 256); // Random between 0-255
      const b = Math.floor(Math.random() * 256); // Random between 0-255
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    };

    const addImageProcess = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    // eslint-disable-next-line no-unused-vars
    const loadImage = async (ctx, src, rad, rot) => {
      const img = await addImageProcess(src);
      ctx.save();
      ctx.resetTransform();
      ctx.translate(rad, rad);
      ctx.rotate(rot);
      ctx.clip();
      ctx.drawImage(img, 0, -75, 150, 150);
      ctx.restore();
    };

    async function drawSector (sector, i) {
      const ang = arc * i;
      // eslint-disable-next-line no-unused-vars
      const rot = ang + arc / 2;
      ctx.save();
      // COLOR
      ctx.beginPath();
      ctx.fillStyle = randomRgbColor();
      ctx.strokeStyle = '#8D0C71';
      ctx.moveTo(rad, rad);
      ctx.arc(rad, rad, rad, ang, ang + arc);
      ctx.lineTo(rad, rad);
      ctx.fill();
      if (sector.iconLink) {
        await loadImage(ctx, sector.iconLink, rad, rot);
      }
      ctx.stroke();
      // TEXT
      ctx.translate(rad, rad);
      ctx.rotate(ang + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = wheelFont;
      ctx.strokeText(stripHtml(sector.text), rad - 15, 10);
      ctx.fillText(stripHtml(sector.text), rad - 15, 10);
      ctx.restore();
    }

    function rotate () {
      ctx.canvas.style.transform = `rotate(${ang - PI / 2}rad)`;
    }

    function frame () {
      if (!angVel) return;
      angVel *= friction;
      if (angVel < 0.002) {
        angVel = 0;
        const sector = tiles[getIndex()];

        const popup = document.querySelector('.single-wheel-popup');
        popup.style.display = 'flex';

        const wrapp = document.querySelector('.single-wheel-wrapper');
        wrapp.classList.add('blur');

        const description = document.querySelector('.single-wheel-popup-description');
        description.innerHTML = _this.settings.lbWidget.settings.translation.rewards.singleWheelWinDescription + ' ' + stripHtml(sector.text);
      } // Bring to stop
      ang += angVel; // Update angle
      ang %= TAU; // Normalize angle
      rotate();
    }

    function engine () {
      frame();
      requestAnimationFrame(engine);
    }
    async function init () {
      for (const [i, sector] of tiles.entries()) {
        await drawSector(sector, i);
      }
      // rotate();
      engine();
      spinEl.addEventListener('click', () => {
        const play = _this.settings.lbWidget.playInstantWin();
        console.log('play:', play);
        if (!angVel) angVel = rand(0.25, 0.45);
      });
      climeBtn.addEventListener('click', () => {
        const popup = document.querySelector('.single-wheel-popup');
        popup.style.display = 'none';

        const wrapp = document.querySelector('.single-wheel-wrapper');
        wrapp.classList.remove('blur');
      });
    }

    preLoader.show(async function () {
      await init();
      preLoader.hide();
    });
  };

  this.createSingleWheelDom = function (idx, singleWheel, isMobile) {
    const sw = document.createElement('div');
    sw.classList.add('single-wheel-element');
    sw.classList.add('single-wheel-element-' + idx);

    const wheelSize = isMobile ? '192' : '300';

    const template = require('../templates/mainWidget/singleWheelDom.hbs');
    sw.innerHTML = template({
      idx: idx,
      wheelSize: wheelSize,
      label: singleWheel.name ?? '',
      description: singleWheel.description ? stripHtml(singleWheel.description) : '',
      buttonLabel: 'Spin'
    });

    return sw;
  };

  this.hideInstantWins = function () {
    const singleWheel = document.querySelector('.single-wheel');
    const scratchcardsGame = document.querySelector('.scratchcards-game');
    const backBtn = document.querySelector('.cl-main-widget-reward-header-back ');

    singleWheel.classList.remove('cl-show');
    scratchcardsGame.classList.remove('cl-show');
    backBtn.style.display = 'none';
  };

  this.loadMessages = function (pageNumber, callback, paginationArr = null) {
    const _this = this;

    _this.settings.lbWidget.checkForAvailableMessages(pageNumber, function () {
      _this.messagesListLayout(pageNumber, paginationArr);
      // _this.settings.lbWidget.updateMessagesNavigationCounts();

      if (typeof callback === 'function') {
        callback();
      }
    });
  };

  this.loadMissions = function (pageNumber, callback, paginationArr = null) {
    const _this = this;

    _this.settings.lbWidget.checkForAvailableMissions(pageNumber, function () {
      _this.missionsListLayout(pageNumber, paginationArr);
      // _this.settings.lbWidget.updateMissionsNavigationCounts();

      if (typeof callback === 'function') {
        callback();
      }
    });
  };

  this.closeOpenedItems = function () {
    this.hideCompetitionList();
    this.hideAchievementDetails();
    this.hideRewardDetails();
    this.hideMessageDetails();
    this.hideMissionMap();
    this.hideMissionDetails();
  };

  let changeInterval;
  let changeContainerInterval;
  this.navigationSwitch = function (target, callback) {
    const _this = this;
    const preLoader = _this.preloader();

    const instantWinsBackIcon = query(_this.settings.container, '.cl-main-widget-reward-header-back');
    instantWinsBackIcon.style.display = 'none';

    if (_this.settings.navigationSwitchInProgress && _this.settings.navigationSwitchLastAtempt + 3000 < new Date().getTime()) {
      _this.settings.navigationSwitchInProgress = false;
    }

    if (!_this.settings.navigationSwitchInProgress) {
      _this.settings.navigationSwitchInProgress = true;
      _this.settings.navigationSwitchLastAtempt = new Date().getTime();

      if (!hasClass(target.parentNode, 'cl-active-nav')) {
        preLoader.show(function () {
          if (changeInterval) clearTimeout(changeInterval);
          if (changeContainerInterval) clearTimeout(changeContainerInterval);

          _this.closeOpenedItems();

          objectIterator(query(_this.settings.container, '.cl-main-widget-navigation-items .cl-active-nav'), function (obj) {
            removeClass(obj, 'cl-active-nav');
          });

          objectIterator(query(_this.settings.container, '.cl-main-widget-section-container .cl-main-active-section'), function (obj) {
            removeClass(obj, 'cl-main-active-section');
            obj.style.display = 'none';
          });

          changeContainerInterval = setTimeout(function () {
            if (target.classList.contains('cl-main-widget-navigation-dashboard') || target.closest('.cl-main-widget-navigation-dashboard')) {
              const dashboardContainer = query(_this.settings.container, '.cl-main-widget-section-container .' + _this.settings.lbWidget.settings.navigation.dashboard.containerClass);

              dashboardContainer.style.display = 'flex';

              if (_this.settings.lbWidget.settings.navigation.achievements.enable) {
                _this.settings.lbWidget.checkForAvailableAchievements(1, function (achievementData) {
                  _this.loadDashboardAchievements(achievementData);
                });
              }

              if (_this.settings.lbWidget.settings.navigation.tournaments.enable) {
                _this.loadDashboardTournaments();
              }

              changeInterval = setTimeout(function () {
                addClass(dashboardContainer, 'cl-main-active-section');
              }, 30);

              _this.loadAwards();

              preLoader.hide();

              _this.settings.navigationSwitchInProgress = false;
            } else if (target.classList.contains('cl-main-widget-navigation-lb') || target.closest('.cl-main-widget-navigation-lb')) {
              _this.settings.lbWidget.checkForAvailableRewards(1);
              _this.loadLeaderboard(function () {
                const lbContainer = query(_this.settings.container, '.cl-main-widget-section-container .' + _this.settings.lbWidget.settings.navigation.tournaments.containerClass);
                const missingMember = query(lbContainer, '.cl-main-widget-lb-missing-member');
                if (missingMember) {
                  missingMember.style.display = 'none';
                }

                lbContainer.style.display = 'flex';
                changeInterval = setTimeout(function () {
                  addClass(lbContainer, 'cl-main-active-section');
                }, 30);

                if (typeof callback === 'function') {
                  callback();
                }

                preLoader.hide();

                _this.settings.navigationSwitchInProgress = false;
              }, true);
            } else if (target.classList.contains('cl-main-widget-navigation-ach') || target.closest('.cl-main-widget-navigation-ach')) {
              _this.loadAchievements(1, function () {
                const achContainer = query(_this.settings.container, '.cl-main-widget-section-container .' + _this.settings.lbWidget.settings.navigation.achievements.containerClass);

                _this.settings.achievement.detailsContainer.style.display = 'none';

                achContainer.style.display = 'flex';
                changeInterval = setTimeout(function () {
                  addClass(achContainer, 'cl-main-active-section');

                  if (typeof callback === 'function') {
                    callback();
                  }
                }, 30);

                preLoader.hide();

                _this.settings.navigationSwitchInProgress = false;
              });
            } else if (target.classList.contains('cl-main-widget-navigation-rewards') || target.closest('.cl-main-widget-navigation-rewards')) {
              _this.loadAwards(
                function () {
                  const rewardsContainer = query(_this.settings.container, '.cl-main-widget-section-container .' + _this.settings.lbWidget.settings.navigation.rewards.containerClass);

                  rewardsContainer.style.display = 'flex';
                  changeInterval = setTimeout(function () {
                    addClass(rewardsContainer, 'cl-main-active-section');
                  }, 30);

                  if (typeof callback === 'function') {
                    callback();
                  }

                  preLoader.hide();

                  _this.settings.navigationSwitchInProgress = false;
                },
                1,
                1,
                1
              );
            } else if (target.classList.contains('cl-main-widget-navigation-inbox') || target.closest('.cl-main-widget-navigation-inbox')) {
              _this.loadMessages(1, function () {
                const inboxContainer = query(_this.settings.container, '.cl-main-widget-section-container .' + _this.settings.lbWidget.settings.navigation.inbox.containerClass);

                inboxContainer.style.display = 'flex';
                changeInterval = setTimeout(function () {
                  addClass(inboxContainer, 'cl-main-active-section');
                }, 30);

                preLoader.hide();

                _this.settings.navigationSwitchInProgress = false;
              });
            } else if (target.classList.contains('cl-main-widget-navigation-missions') || target.closest('.cl-main-widget-navigation-missions')) {
              _this.loadMissions(1, function () {
                const missionsContainer = query(_this.settings.container, '.cl-main-widget-section-container .' + _this.settings.lbWidget.settings.navigation.missions.containerClass);

                missionsContainer.style.display = 'flex';
                changeInterval = setTimeout(function () {
                  addClass(missionsContainer, 'cl-main-active-section');
                }, 30);

                preLoader.hide();

                _this.settings.navigationSwitchInProgress = false;
              });
            }
          }, 250);

          const targetBtn = target.classList.contains('cl-main-widget-navigation-item') ? target : target.closest('.cl-main-widget-navigation-item');

          addClass(targetBtn, 'cl-active-nav');
        });
      } else if (typeof callback === 'function') {
        _this.settings.navigationSwitchInProgress = false;
        callback();
      }
    }
  };

  this.resetNavigation = function (callback) {
    const _this = this;
    const listIcon = query(_this.settings.container, '.cl-main-widget-lb-header-list-icon');
    const backIcon = query(_this.settings.container, '.cl-main-widget-lb-header-back-icon');
    const missionBackIcon = query(_this.settings.container, '.cl-main-widget-mission-header-back-icon');

    objectIterator(query(_this.settings.container, '.cl-main-widget-navigation-items .cl-active-nav'), function (obj) {
      removeClass(obj, 'cl-active-nav');
    });

    objectIterator(query(_this.settings.container, '.cl-main-widget-section-container .cl-main-active-section'), function (obj) {
      obj.style.display = 'none';
      removeClass(obj, 'cl-main-active-section');
    });

    let activeNave = false;
    objectIterator(query(_this.settings.container, '.cl-main-widget-navigation-container .cl-main-widget-navigation-item'), function (navItem, key, count) {
      if (!activeNave && !hasClass(navItem, 'cl-hidden-navigation-item')) {
        _this.navigationSwitch(query(navItem, '.cl-main-navigation-item'));
        activeNave = true;
      }
    });

    listIcon.style.display = 'block';
    backIcon.style.display = 'none';
    missionBackIcon.style.display = 'none';
    _this.hideEmbeddedCompetitionDetailsContent();
    _this.hideCompetitionList();

    setTimeout(function () {
      if (typeof callback !== 'undefined') callback();
    }, 70);
  };

  this.initLayout = function (callback) {
    const _this = this;

    _this.settings.active = true;

    _this.loadLeaderboard(() => {}, true);

    setTimeout(function () {
      _this.settings.container.style.display = 'block';
      _this.settings.overlayContainer.style.display = 'block';
      addClass(_this.settings.container, 'cl-show');

      const member = query(_this.settings.leaderboard.resultContainer, '.cl-lb-member-row');
      if (member !== null) {
        _this.missingMember(_this.isElementVisibleInView(member, _this.settings.leaderboard.resultContainer));
      } else {
        _this.missingMemberReset();
      }

      _this.resetNavigation(callback);
    }, 200);
  };
};
