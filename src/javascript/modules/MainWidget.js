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
import Graph from 'graphology';
import Sigma from 'sigma';
import circular from 'graphology-layout/circular';
import rotation from 'graphology-layout/rotation';
import forceAtlas2 from 'graphology-layout-forceatlas2';

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
      mission: null
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
        }
        // {
        //   label: 'Expired Rewards',
        //   type: 'expiredRewards',
        //   show: false,
        //   showTopResults: 1
        // }
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
    const instantWinsTitle = document.createElement('div');

    availableTitle.setAttribute('class', 'cl-main-accordion-container-menu-item availableAwards');
    claimedTitle.setAttribute('class', 'cl-main-accordion-container-menu-item claimedAwards');
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
        case 'instantWins':
          instantWinsTitle.classList.add('active');
          break;
      }
    }

    availableTitle.innerHTML = _this.settings.lbWidget.settings.translation.rewards.availableRewards;
    claimedTitle.innerHTML = _this.settings.lbWidget.settings.translation.rewards.claimed;
    instantWinsTitle.innerHTML = _this.settings.lbWidget.settings.translation.rewards.instantWins;

    statusMenu.appendChild(availableTitle);
    statusMenu.appendChild(claimedTitle);
    statusMenu.appendChild(instantWinsTitle);

    accordionWrapper.appendChild(statusMenu);

    mapObject(data, function (entry) {
      const accordionSection = document.createElement('div');
      // const accordionLabel = document.createElement('div');
      const topShownEntry = document.createElement('div');
      const accordionListContainer = document.createElement('div');
      const accordionList = document.createElement('div');

      accordionSection.setAttribute('class', 'cl-accordion ' + entry.type + ((typeof entry.show === 'boolean' && entry.show) ? ' cl-shown' : ''));
      // accordionLabel.setAttribute('class', 'cl-accordion-label');
      topShownEntry.setAttribute('class', 'cl-accordion-entry');
      accordionListContainer.setAttribute('class', 'cl-accordion-list-container');
      accordionList.setAttribute('class', 'cl-accordion-list');

      // if (typeof _this.settings.lbWidget.settings.translation.rewards[entry.type] !== 'undefined') {
      //   accordionLabel.innerHTML = _this.settings.lbWidget.settings.translation.rewards[entry.type];
      // } else if (typeof _this.settings.lbWidget.settings.translation.tournaments[entry.type] !== 'undefined') {
      //   accordionLabel.innerHTML = _this.settings.lbWidget.settings.translation.tournaments[entry.type];
      // } else {
      //   accordionLabel.innerHTML = entry.label;
      // }

      if (typeof onLayout === 'function') {
        onLayout(accordionSection, accordionList, topShownEntry, entry);
      }

      accordionListContainer.appendChild(accordionList);

      // accordionSection.appendChild(accordionLabel);
      // accordionSection.appendChild(topShownEntry);
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
      // accordionLabel.setAttribute('class', 'cl-accordion-label');
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
      header.appendChild(headerPrize);

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
  };

  this.accordionNavigation = function (element) {
    // var _this = this;
    var parentEl = element.parentNode;

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
    var _this = this;

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

      // var navigationItemCount = document.createElement('div');

      navigationItem.setAttribute('class', _this.settings.lbWidget.settings.navigation[val.key].navigationClass + ' cl-main-widget-navigation-item' + (_this.settings.lbWidget.settings.navigation[val.key].enable ? '' : ' cl-hidden-navigation-item'));
      navigationItemIcon.setAttribute('class', _this.settings.lbWidget.settings.navigation[val.key].navigationClassIcon + ' cl-main-navigation-item');
      navigationItemTitle.setAttribute('class', 'cl-main-navigation-item-title');
      // navigationItemCount.setAttribute('class', 'cl-main-navigation-item-count');

      // navigationItemIcon.appendChild(navigationItemCount);
      navigationItem.appendChild(navigationItemIcon);
      navigationItem.appendChild(navigationItemTitle);
      container.appendChild(navigationItem);
    });
  };

  this.overlayLayout = function () {
    var wrapper = document.createElement('div');

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

    mainSectionContainer.appendChild(sectionLB);
    mainSectionContainer.appendChild(sectionACH);
    mainSectionContainer.appendChild(sectionRewards);
    mainSectionContainer.appendChild(sectionInbox);
    mainSectionContainer.appendChild(sectionMissions);
    mainSectionContainer.appendChild(preLoaderContainer);

    innerWrapper.appendChild(navigationContainer);
    innerWrapper.appendChild(mainSectionContainer);
    wrapper.appendChild(innerWrapper);

    return wrapper;
  };

  this.mainNavigationCheck = function () {
    var _this = this;
    var navItems = query(_this.settings.container, '.cl-main-widget-navigation-item');
    var checkEnabled = 0;

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
    var _this = this;
    var sectionLB = document.createElement('div');

    var sectionLBHeader = document.createElement('div');
    var sectionLBHeaderList = document.createElement('div');
    var sectionLBHeaderListIcon = document.createElement('div');
    const sectionLBHeaderBackIcon = document.createElement('div');
    var sectionLBHeaderLabel = document.createElement('div');
    var sectionLBHeaderDate = document.createElement('div');
    var sectionLBHeaderClose = document.createElement('div');

    var sectionLBDetails = document.createElement('div');
    var sectionLBDetailsInfo = document.createElement('div');
    var sectionLBDetailsInfoIcon = document.createElement('div');
    var sectionLBDetailsImageContainer = document.createElement('div');
    var sectionLBDetailsContentContainer = document.createElement('div');
    var sectionLBDetailsContentContainerLabel = document.createElement('div');
    var sectionLBDetailsContentContainerLabelText = document.createElement('span');
    var sectionLBDetailsContentContainerDate = document.createElement('span');
    const sectionLBDetailsContentContainerDateHeaders = document.createElement('div');
    const sectionLBDetailsContentContainerDateDays = document.createElement('div');
    const sectionLBDetailsContentContainerDateHours = document.createElement('div');
    const sectionLBDetailsContentContainerDateMinutes = document.createElement('div');
    const sectionLBDetailsContentContainerDateSeconds = document.createElement('div');
    var sectionLBDetailsDescriptionContainer = document.createElement('div');
    const sectionLBDetailsDescriptionHeader = document.createElement('div');
    const sectionLBDetailsDescriptionHeaderTitle = document.createElement('div');
    const sectionLBDetailsDescriptionHeaderBack = document.createElement('div');
    const sectionLBDetailsDescriptionBanner = document.createElement('div');

    const sectionLBDetailsDescriptionLabel = document.createElement('div');
    const sectionLBDetailsDescriptionLabelText = document.createElement('span');
    const sectionLBDetailsDescriptionDate = document.createElement('span');
    const sectionLBDetailsDescriptionDateHeaders = document.createElement('div');
    const sectionLBDetailsDescriptionDateDays = document.createElement('div');
    const sectionLBDetailsDescriptionDateHours = document.createElement('div');
    const sectionLBDetailsDescriptionDateMinutes = document.createElement('div');
    const sectionLBDetailsDescriptionDateSeconds = document.createElement('div');

    var sectionLBDetailsDescription = document.createElement('div');
    var sectionLBDetailsDescriptionClose = document.createElement('span');

    var sectionLBLeaderboard = document.createElement('div');
    var sectionLBLeaderboardHeader = document.createElement('div');
    var sectionLBLeaderboardHeaderLabels = document.createElement('div');
    var sectionLBLeaderboardResultsContainer = document.createElement('div');
    var sectionLBLeaderboardHeaderTopResults = document.createElement('div');
    var sectionLBLeaderboardBody = document.createElement('div');
    var sectionLBLeaderboardBodyResults = document.createElement('div');

    var sectionLBMissingMember = document.createElement('div');
    var sectionLBMissingMemberDetails = document.createElement('div');

    var sectionLBOptInContainer = document.createElement('div');
    var sectionLBOptInAction = document.createElement('a');

    var sectionLBFooter = document.createElement('div');
    var sectionLBFooterContent = document.createElement('div');

    var sectionTournamentDetailsContainer = document.createElement('div');
    var sectionTournamentDetailsHeader = document.createElement('div');
    var sectionTournamentDetailsHeaderLabel = document.createElement('div');
    var sectionTournamentDetailsHeaderDate = document.createElement('div');
    var sectionTournamentDetailsBackBtn = document.createElement('a');
    var sectionTournamentDetailsBodyContainer = document.createElement('div');
    var sectionTournamentDetailsBodyImageContainer = document.createElement('div');
    var sectionTournamentDetailsBody = document.createElement('div');
    var sectionTournamentDetailsOptInContainer = document.createElement('div');
    var sectionTournamentDetailsOptInAction = document.createElement('a');

    var sectionTournamentList = document.createElement('div');
    var sectionTournamentListBody = document.createElement('div');
    var sectionTournamentListBodyResults = document.createElement('div');
    // var sectionTournamentBackAction = document.createElement('a');

    sectionLB.setAttribute('class', _this.settings.lbWidget.settings.navigation.tournaments.containerClass + ' cl-main-section-item cl-main-active-section' + (_this.settings.lbWidget.settings.leaderboard.layoutSettings.imageBanner ? ' cl-main-section-image-banner-active' : ''));
    sectionLBHeader.setAttribute('class', 'cl-main-widget-lb-header');
    sectionLBHeaderList.setAttribute('class', 'cl-main-widget-lb-header-list');
    sectionLBHeaderListIcon.setAttribute('class', 'cl-main-widget-lb-header-list-icon');
    sectionLBHeaderBackIcon.setAttribute('class', 'cl-main-widget-lb-header-back-icon');
    sectionLBHeaderLabel.setAttribute('class', 'cl-main-widget-lb-header-label');
    sectionLBHeaderDate.setAttribute('class', 'cl-main-widget-lb-header-date');
    sectionLBHeaderClose.setAttribute('class', 'cl-main-widget-lb-header-close');

    sectionLBDetails.setAttribute('class', 'cl-main-widget-lb-details');
    sectionLBDetailsInfo.setAttribute('class', 'cl-main-widget-lb-details-info');
    sectionLBDetailsInfoIcon.setAttribute('class', 'cl-main-widget-lb-details-info-icon');
    sectionLBDetailsImageContainer.setAttribute('class', 'cl-main-widget-lb-details-image-container');
    sectionLBDetailsContentContainer.setAttribute('class', 'cl-main-widget-lb-details-content');
    sectionLBDetailsContentContainerLabel.setAttribute('class', 'cl-main-widget-lb-details-content-label');
    sectionLBDetailsContentContainerLabelText.setAttribute('class', 'cl-main-widget-lb-details-content-label-text');

    sectionLBDetailsContentContainerDate.setAttribute('class', 'cl-main-widget-lb-details-content-date');
    sectionLBDetailsContentContainerDateHeaders.setAttribute('class', 'cl-main-widget-lb-details-content-date-headers');
    sectionLBDetailsContentContainerDateDays.setAttribute('class', 'cl-main-widget-lb-details-content-date-headers-item days');
    sectionLBDetailsContentContainerDateHours.setAttribute('class', 'cl-main-widget-lb-details-content-date-headers-item hours');
    sectionLBDetailsContentContainerDateMinutes.setAttribute('class', 'cl-main-widget-lb-details-content-date-headers-item minutes');
    sectionLBDetailsContentContainerDateSeconds.setAttribute('class', 'cl-main-widget-lb-details-content-date-headers-item seconds');

    sectionLBDetailsDescriptionContainer.setAttribute('class', 'cl-main-widget-lb-details-description-container');
    sectionLBDetailsDescription.setAttribute('class', 'cl-main-widget-lb-details-description');
    sectionLBDetailsDescriptionHeader.setAttribute('class', 'cl-main-widget-lb-details-description-header');
    sectionLBDetailsDescriptionHeaderTitle.setAttribute('class', 'cl-main-widget-lb-details-description-header-title');
    sectionLBDetailsDescriptionHeaderBack.setAttribute('class', 'cl-main-widget-lb-details-description-header-back');
    sectionLBDetailsDescriptionBanner.setAttribute('class', 'cl-main-widget-lb-details-description-banner');

    sectionLBDetailsDescriptionLabel.setAttribute('class', 'cl-main-widget-lb-details-description-label');
    sectionLBDetailsDescriptionLabelText.setAttribute('class', 'cl-main-widget-lb-details-description-label-text');

    sectionLBDetailsDescriptionDate.setAttribute('class', 'cl-main-widget-lb-details-description-date');
    sectionLBDetailsDescriptionDateHeaders.setAttribute('class', 'cl-main-widget-lb-details-description-date-headers');
    sectionLBDetailsDescriptionDateDays.setAttribute('class', 'cl-main-widget-lb-details-description-date-headers-item days');
    sectionLBDetailsDescriptionDateHours.setAttribute('class', 'cl-main-widget-lb-details-description-date-headers-item hours');
    sectionLBDetailsDescriptionDateMinutes.setAttribute('class', 'cl-main-widget-lb-details-description-date-headers-item minutes');
    sectionLBDetailsDescriptionDateSeconds.setAttribute('class', 'cl-main-widget-lb-details-description-date-headers-item seconds');

    sectionLBDetailsDescriptionClose.setAttribute('class', 'cl-main-widget-lb-details-description-close');

    // Leaderboard result container
    sectionLBLeaderboard.setAttribute('class', 'cl-main-widget-lb-leaderboard');
    sectionLBLeaderboardHeader.setAttribute('class', 'cl-main-widget-lb-leaderboard-header');
    sectionLBLeaderboardHeaderLabels.setAttribute('class', 'cl-main-widget-lb-leaderboard-header-labels');
    sectionLBLeaderboardResultsContainer.setAttribute('class', 'cl-main-widget-lb-leaderboard-res-container');
    sectionLBLeaderboardHeaderTopResults.setAttribute('class', 'cl-main-widget-lb-leaderboard-header-top-res');
    sectionLBLeaderboardBody.setAttribute('class', 'cl-main-widget-lb-leaderboard-body');
    sectionLBLeaderboardBodyResults.setAttribute('class', 'cl-main-widget-lb-leaderboard-body-res');

    sectionLBMissingMember.setAttribute('class', 'cl-main-widget-lb-missing-member');
    sectionLBMissingMemberDetails.setAttribute('class', 'cl-main-widget-lb-missing-member-details');

    // footer
    sectionLBFooter.setAttribute('class', 'cl-main-widget-lb-footer');
    sectionLBFooterContent.setAttribute('class', 'cl-main-widget-lb-footer-content');

    // details section
    sectionTournamentDetailsContainer.setAttribute('class', 'cl-main-widget-lb-details-container');
    sectionTournamentDetailsHeader.setAttribute('class', 'cl-main-widget-lb-details-header');
    sectionTournamentDetailsHeaderLabel.setAttribute('class', 'cl-main-widget-lb-details-header-label');
    sectionTournamentDetailsHeaderDate.setAttribute('class', 'cl-main-widget-lb-details-header-date');
    sectionTournamentDetailsBackBtn.setAttribute('class', 'cl-main-widget-lb-details-back-btn');
    sectionTournamentDetailsBodyContainer.setAttribute('class', 'cl-main-widget-lb-details-body-container');
    sectionTournamentDetailsBodyImageContainer.setAttribute('class', 'cl-main-widget-lb-details-body-image-cont');
    sectionTournamentDetailsBody.setAttribute('class', 'cl-main-widget-lb-details-body');
    sectionTournamentDetailsOptInContainer.setAttribute('class', 'cl-main-widget-lb-details-optin-container');
    sectionTournamentDetailsOptInAction.setAttribute('class', 'cl-main-widget-lb-details-optin-action');

    sectionTournamentList.setAttribute('class', 'cl-main-widget-tournaments-list');
    // sectionTournamentBackAction.setAttribute('class', 'cl-main-widget-tournaments-back-btn');
    sectionTournamentListBody.setAttribute('class', 'cl-main-widget-tournaments-list-body');
    sectionTournamentListBodyResults.setAttribute('class', 'cl-main-widget-tournaments-list-body-res');

    sectionLBOptInContainer.setAttribute('class', 'cl-main-widget-lb-optin-container');
    sectionLBOptInAction.setAttribute('class', 'cl-main-widget-lb-optin-action');

    sectionLBHeaderLabel.innerHTML = _this.settings.lbWidget.settings.translation.tournaments.label;
    sectionLBFooterContent.innerHTML = _this.settings.lbWidget.settings.translation.global.copy;
    sectionTournamentDetailsOptInAction.innerHTML = _this.settings.lbWidget.settings.translation.tournaments.enter;
    sectionTournamentDetailsOptInAction.href = 'javascript:void(0);';
    sectionLBOptInAction.innerHTML = _this.settings.lbWidget.settings.translation.tournaments.enter;
    sectionLBOptInAction.href = 'javascript:void(0);';

    sectionLBHeaderList.appendChild(sectionLBHeaderListIcon);
    sectionLBHeaderList.appendChild(sectionLBHeaderBackIcon);
    sectionLBHeader.appendChild(sectionLBHeaderList);
    sectionLBHeader.appendChild(sectionLBHeaderLabel);
    sectionLBHeader.appendChild(sectionLBHeaderDate);
    sectionLBHeader.appendChild(sectionLBHeaderClose);

    sectionLBDetailsContentContainerDateDays.innerHTML = this.settings.lbWidget.settings.translation.time.daysFull;
    sectionLBDetailsContentContainerDateHours.innerHTML = this.settings.lbWidget.settings.translation.time.hoursFull;
    sectionLBDetailsContentContainerDateMinutes.innerHTML = this.settings.lbWidget.settings.translation.time.minutesFull;
    sectionLBDetailsContentContainerDateSeconds.innerHTML = this.settings.lbWidget.settings.translation.time.secondsFull;

    sectionLBDetailsContentContainerDateHeaders.appendChild(sectionLBDetailsContentContainerDateDays);
    sectionLBDetailsContentContainerDateHeaders.appendChild(sectionLBDetailsContentContainerDateHours);
    sectionLBDetailsContentContainerDateHeaders.appendChild(sectionLBDetailsContentContainerDateMinutes);
    sectionLBDetailsContentContainerDateHeaders.appendChild(sectionLBDetailsContentContainerDateSeconds);

    sectionLBDetailsInfo.appendChild(sectionLBDetailsInfoIcon);
    sectionLBDetailsContentContainerLabel.appendChild(sectionLBDetailsContentContainerLabelText);
    sectionLBDetailsContentContainerLabel.appendChild(sectionLBDetailsContentContainerDate);
    sectionLBDetailsContentContainerLabel.appendChild(sectionLBDetailsContentContainerDateHeaders);
    sectionLBDetailsContentContainer.appendChild(sectionLBDetailsContentContainerLabel);
    sectionLBDetails.appendChild(sectionLBDetailsInfo);

    if (_this.settings.lbWidget.settings.leaderboard.layoutSettings.imageBanner) {
      sectionLBDetails.appendChild(sectionLBDetailsImageContainer);
    }

    sectionLBDetails.appendChild(sectionLBDetailsContentContainer);

    if (!_this.settings.lbWidget.settings.leaderboard.layoutSettings.titleLinkToDetailsPage) {
      sectionLBDetailsDescriptionHeader.appendChild(sectionLBDetailsDescriptionHeaderBack);
      sectionLBDetailsDescriptionHeader.appendChild(sectionLBDetailsDescriptionHeaderTitle);

      sectionLBDetailsDescriptionDateDays.innerHTML = this.settings.lbWidget.settings.translation.time.daysFull;
      sectionLBDetailsDescriptionDateHours.innerHTML = this.settings.lbWidget.settings.translation.time.hoursFull;
      sectionLBDetailsDescriptionDateMinutes.innerHTML = this.settings.lbWidget.settings.translation.time.minutesFull;
      sectionLBDetailsDescriptionDateSeconds.innerHTML = this.settings.lbWidget.settings.translation.time.secondsFull;

      sectionLBDetailsDescriptionDateHeaders.appendChild(sectionLBDetailsDescriptionDateDays);
      sectionLBDetailsDescriptionDateHeaders.appendChild(sectionLBDetailsDescriptionDateHours);
      sectionLBDetailsDescriptionDateHeaders.appendChild(sectionLBDetailsDescriptionDateMinutes);
      sectionLBDetailsDescriptionDateHeaders.appendChild(sectionLBDetailsDescriptionDateSeconds);

      sectionLBDetailsDescriptionLabel.appendChild(sectionLBDetailsDescriptionLabelText);
      sectionLBDetailsDescriptionLabel.appendChild(sectionLBDetailsDescriptionDate);
      sectionLBDetailsDescriptionLabel.appendChild(sectionLBDetailsDescriptionDateHeaders);

      sectionLBDetailsDescriptionBanner.appendChild(sectionLBDetailsDescriptionLabel);

      sectionLBDetailsDescriptionContainer.appendChild(sectionLBDetailsDescriptionHeader);
      sectionLBDetailsDescriptionContainer.appendChild(sectionLBDetailsDescriptionBanner);
      sectionLBDetailsDescriptionContainer.appendChild(sectionLBDetailsDescription);
      sectionLBDetailsDescriptionContainer.appendChild(sectionLBDetailsDescriptionClose);
      sectionLBDetailsDescriptionContainer.appendChild(sectionLBMissingMemberDetails);
      sectionLBDetails.appendChild(sectionLBDetailsDescriptionContainer);
    }

    sectionLBLeaderboardHeader.appendChild(sectionLBLeaderboardHeaderLabels);
    sectionLBLeaderboard.appendChild(sectionLBLeaderboardHeader);
    // sectionLBLeaderboard.appendChild(sectionLBLeaderboardHeaderTopResults);
    // sectionLBLeaderboardBody.appendChild(sectionLBLeaderboardBodyResults);
    // sectionLBLeaderboard.appendChild(sectionLBLeaderboardBody);

    sectionLBLeaderboardResultsContainer.appendChild(sectionLBLeaderboardHeaderTopResults);
    sectionLBLeaderboardBody.appendChild(sectionLBLeaderboardBodyResults);
    sectionLBLeaderboardResultsContainer.appendChild(sectionLBLeaderboardBody);
    sectionLBLeaderboard.appendChild(sectionLBLeaderboardResultsContainer);
    sectionLBLeaderboard.appendChild(sectionLBMissingMember);

    sectionLBFooter.appendChild(sectionLBFooterContent);

    sectionTournamentListBody.appendChild(sectionTournamentListBodyResults);
    sectionTournamentList.appendChild(sectionTournamentListBody);
    // sectionTournamentList.appendChild(sectionTournamentBackAction);

    sectionTournamentDetailsHeader.appendChild(sectionTournamentDetailsHeaderLabel);
    sectionTournamentDetailsHeader.appendChild(sectionTournamentDetailsHeaderDate);
    sectionTournamentDetailsContainer.appendChild(sectionTournamentDetailsHeader);
    sectionTournamentDetailsContainer.appendChild(sectionTournamentDetailsBackBtn);
    sectionTournamentDetailsBodyContainer.appendChild(sectionTournamentDetailsBodyImageContainer);
    sectionTournamentDetailsBodyContainer.appendChild(sectionTournamentDetailsBody);
    sectionTournamentDetailsContainer.appendChild(sectionTournamentDetailsBodyContainer);
    sectionTournamentDetailsOptInContainer.appendChild(sectionTournamentDetailsOptInAction);
    sectionTournamentDetailsContainer.appendChild(sectionTournamentDetailsOptInContainer);

    sectionLBOptInContainer.appendChild(sectionLBOptInAction);

    sectionLB.appendChild(sectionLBHeader);
    sectionLB.appendChild(sectionLBDetails);
    sectionLB.appendChild(sectionLBLeaderboard);
    // sectionLB.appendChild(sectionLBMissingMember);
    sectionLB.appendChild(sectionLBOptInContainer);
    sectionLB.appendChild(sectionLBFooter);
    sectionLB.appendChild(sectionTournamentDetailsContainer);
    sectionLB.appendChild(sectionTournamentList);

    return sectionLB;
  };

  this.achievementsAreaLayout = function () {
    var _this = this;
    var sectionACH = document.createElement('div');

    var sectionACHHeader = document.createElement('div');
    var sectionACHHeaderLabel = document.createElement('div');
    var sectionACHHeaderDate = document.createElement('div');
    var sectionACHHeaderClose = document.createElement('div');

    var sectionACHDetails = document.createElement('div');
    var sectionACHDetailsInfo = document.createElement('div');
    var sectionACHDetailsInfoIcon = document.createElement('div');
    var sectionACHDetailsContentContainer = document.createElement('div');
    var sectionACHDetailsContentContainerLabel = document.createElement('div');
    var sectionACHDetailsContentContainerDate = document.createElement('div');

    var sectionACHList = document.createElement('div');
    var sectionACHListBody = document.createElement('div');
    var sectionACHListBodyResults = document.createElement('div');

    var sectionACHFooter = document.createElement('div');
    var sectionACHFooterContent = document.createElement('div');

    var sectionAchievementDetailsContainer = document.createElement('div');
    const sectionAchievementDetailsWrapper = document.createElement('div');
    var sectionAchievementDetailsHeader = document.createElement('div');
    var sectionAchievementDetailsHeaderLabel = document.createElement('div');
    var sectionAchievementDetailsHeaderDate = document.createElement('div');
    var sectionAchievementDetailsBackBtn = document.createElement('a');
    var sectionAchievementDetailsBodyContainer = document.createElement('div');
    var sectionAchievementDetailsBodyImageContainer = document.createElement('div');
    var sectionAchievementDetailsBody = document.createElement('div');

    var sectionAchievementDetailsOptInContainer = document.createElement('div');
    var sectionAchievementDetailsOptInAction = document.createElement('a');

    sectionACH.setAttribute('class', _this.settings.lbWidget.settings.navigation.achievements.containerClass + ' cl-main-section-item');
    sectionACHHeader.setAttribute('class', 'cl-main-widget-ach-header');
    sectionACHHeaderLabel.setAttribute('class', 'cl-main-widget-ach-header-label');
    sectionACHHeaderDate.setAttribute('class', 'cl-main-widget-ach-header-date');
    sectionACHHeaderClose.setAttribute('class', 'cl-main-widget-ach-header-close');

    sectionACHDetails.setAttribute('class', 'cl-main-widget-ach-details');
    sectionACHDetailsInfo.setAttribute('class', 'cl-main-widget-ach-details-info');
    sectionACHDetailsInfoIcon.setAttribute('class', 'cl-main-widget-ach-details-info-icon');
    sectionACHDetailsContentContainer.setAttribute('class', 'cl-main-widget-ach-details-content');
    sectionACHDetailsContentContainerLabel.setAttribute('class', 'cl-main-widget-ach-details-content-label');
    sectionACHDetailsContentContainerDate.setAttribute('class', 'cl-main-widget-ach-details-content-date');

    // Leaderboard result container
    sectionACHList.setAttribute('class', 'cl-main-widget-ach-list');
    sectionACHListBody.setAttribute('class', 'cl-main-widget-ach-list-body');
    sectionACHListBodyResults.setAttribute('class', 'cl-main-widget-ach-list-body-res');

    // footer
    sectionACHFooter.setAttribute('class', 'cl-main-widget-ach-footer');
    sectionACHFooterContent.setAttribute('class', 'cl-main-widget-ach-footer-content');

    // details section
    sectionAchievementDetailsContainer.setAttribute('class', 'cl-main-widget-ach-details-container');
    sectionAchievementDetailsWrapper.setAttribute('class', 'cl-main-widget-ach-details-wrapper');
    sectionAchievementDetailsHeader.setAttribute('class', 'cl-main-widget-ach-details-header');
    sectionAchievementDetailsHeaderLabel.setAttribute('class', 'cl-main-widget-ach-details-header-label');
    sectionAchievementDetailsHeaderDate.setAttribute('class', 'cl-main-widget-ach-details-header-date');
    sectionAchievementDetailsBackBtn.setAttribute('class', 'cl-main-widget-ach-details-back-btn');
    sectionAchievementDetailsBodyContainer.setAttribute('class', 'cl-main-widget-ach-details-body-container');
    sectionAchievementDetailsBodyImageContainer.setAttribute('class', 'cl-main-widget-ach-details-body-image-cont');
    sectionAchievementDetailsBody.setAttribute('class', 'cl-main-widget-ach-details-body');
    sectionAchievementDetailsOptInContainer.setAttribute('class', 'cl-main-widget-ach-details-optin-container');
    sectionAchievementDetailsOptInAction.setAttribute('class', 'cl-main-widget-ach-details-optin-action');

    sectionACHHeaderLabel.innerHTML = _this.settings.lbWidget.settings.translation.achievements.label;
    sectionACHFooterContent.innerHTML = _this.settings.lbWidget.settings.translation.global.copy;

    sectionAchievementDetailsOptInAction.innerHTML = _this.settings.lbWidget.settings.translation.tournaments.enter;
    sectionAchievementDetailsOptInAction.href = 'javascript:void(0);';

    sectionAchievementDetailsOptInContainer.appendChild(sectionAchievementDetailsOptInAction);

    sectionAchievementDetailsHeader.appendChild(sectionAchievementDetailsBackBtn);
    sectionAchievementDetailsHeader.appendChild(sectionAchievementDetailsHeaderLabel);
    sectionAchievementDetailsHeader.appendChild(sectionAchievementDetailsHeaderDate);
    // sectionAchievementDetailsContainer.appendChild(sectionAchievementDetailsHeader);
    // sectionAchievementDetailsContainer.appendChild(sectionAchievementDetailsBackBtn);
    sectionAchievementDetailsBodyContainer.appendChild(sectionAchievementDetailsBodyImageContainer);
    sectionAchievementDetailsBodyContainer.appendChild(sectionAchievementDetailsBody);
    sectionAchievementDetailsBodyContainer.appendChild(sectionAchievementDetailsOptInContainer);

    sectionAchievementDetailsWrapper.appendChild(sectionAchievementDetailsHeader);
    sectionAchievementDetailsWrapper.appendChild(sectionAchievementDetailsBodyContainer);

    sectionAchievementDetailsContainer.appendChild(sectionAchievementDetailsWrapper);

    sectionACHHeader.appendChild(sectionACHHeaderLabel);
    sectionACHHeader.appendChild(sectionACHHeaderDate);
    sectionACHHeader.appendChild(sectionACHHeaderClose);

    sectionACHDetailsInfo.appendChild(sectionACHDetailsInfoIcon);
    sectionACHDetailsContentContainer.appendChild(sectionACHDetailsContentContainerLabel);
    sectionACHDetailsContentContainer.appendChild(sectionACHDetailsContentContainerDate);
    sectionACHDetails.appendChild(sectionACHDetailsInfo);
    sectionACHDetails.appendChild(sectionACHDetailsContentContainer);

    // sectionAchievementDetailsContainer.appendChild(sectionAchievementDetailsOptInContainer);

    sectionACHListBody.appendChild(sectionACHListBodyResults);
    sectionACHList.appendChild(sectionACHListBody);

    sectionACHFooter.appendChild(sectionACHFooterContent);

    sectionACH.appendChild(sectionACHHeader);
    sectionACH.appendChild(sectionACHDetails);
    sectionACH.appendChild(sectionACHList);
    sectionACH.appendChild(sectionACHFooter);
    sectionACH.appendChild(sectionAchievementDetailsContainer);

    return sectionACH;
  };

  this.rewardsAreaLayout = function () {
    var _this = this;
    var sectionRewards = document.createElement('div');

    var sectionRewardsHeader = document.createElement('div');
    var sectionRewardsHeaderLabel = document.createElement('div');
    var sectionRewardsHeaderDate = document.createElement('div');
    var sectionRewardsHeaderClose = document.createElement('div');

    var sectionRewardsDetails = document.createElement('div');
    var sectionRewardsDetailsInfo = document.createElement('div');
    var sectionRewardsDetailsInfoIcon = document.createElement('div');
    var sectionRewardsDetailsContentContainer = document.createElement('div');
    const sectionRewardsDetailsContentWrapper = document.createElement('div');
    var sectionRewardsDetailsContentContainerLabel = document.createElement('div');
    var sectionRewardsDetailsContentContainerDate = document.createElement('div');

    var sectionRewardsList = document.createElement('div');
    var sectionRewardsListBody = document.createElement('div');
    var sectionRewardsListBodyResults = document.createElement('div');

    var sectionRewardsFooter = document.createElement('div');
    var sectionRewardsFooterContent = document.createElement('div');

    var sectionRewardsDetailsContainer = document.createElement('div');
    var sectionRewardsDetailsHeader = document.createElement('div');
    var sectionRewardsDetailsHeaderLabel = document.createElement('div');
    var sectionRewardsDetailsHeaderDate = document.createElement('div');
    var sectionRewardsDetailsBackBtn = document.createElement('a');
    var sectionRewardsDetailsBodyContainer = document.createElement('div');
    var sectionRewardsDetailsBodyImageContainer = document.createElement('div');
    var sectionRewardsDetailsBody = document.createElement('div');
    const sectionRewardsDetailsDescription = document.createElement('div');
    var sectionRewardsWinningsContainer = document.createElement('div');
    var sectionRewardsWinningsIcon = document.createElement('div');
    var sectionRewardsWinningsValue = document.createElement('div');
    var sectionRewardsClaimContainer = document.createElement('div');
    var sectionRewardsClaimBtn = document.createElement('a');

    sectionRewards.setAttribute('class', _this.settings.lbWidget.settings.navigation.rewards.containerClass + ' cl-main-section-item');
    sectionRewardsHeader.setAttribute('class', 'cl-main-widget-reward-header');
    sectionRewardsHeaderLabel.setAttribute('class', 'cl-main-widget-reward-header-label');
    sectionRewardsHeaderDate.setAttribute('class', 'cl-main-widget-reward-header-date');
    sectionRewardsHeaderClose.setAttribute('class', 'cl-main-widget-reward-header-close');

    sectionRewardsDetails.setAttribute('class', 'cl-main-widget-reward-details');
    sectionRewardsDetailsInfo.setAttribute('class', 'cl-main-widget-reward-details-info');
    sectionRewardsDetailsInfoIcon.setAttribute('class', 'cl-main-widget-reward-details-info-icon');
    sectionRewardsDetailsContentContainer.setAttribute('class', 'cl-main-widget-reward-details-content');
    sectionRewardsDetailsContentWrapper.setAttribute('class', 'cl-main-widget-reward-details-wrapper');
    sectionRewardsDetailsContentContainerLabel.setAttribute('class', 'cl-main-widget-reward-details-content-label');
    sectionRewardsDetailsContentContainerDate.setAttribute('class', 'cl-main-widget-reward-details-content-date');

    // Leaderboard result container
    sectionRewardsList.setAttribute('class', 'cl-main-widget-reward-list');
    sectionRewardsListBody.setAttribute('class', 'cl-main-widget-reward-list-body');
    sectionRewardsListBodyResults.setAttribute('class', 'cl-main-widget-reward-list-body-res');

    // footer
    sectionRewardsFooter.setAttribute('class', 'cl-main-widget-reward-footer');
    sectionRewardsFooterContent.setAttribute('class', 'cl-main-widget-reward-footer-content');

    // details section
    sectionRewardsDetailsContainer.setAttribute('class', 'cl-main-widget-reward-details-container');
    sectionRewardsDetailsHeader.setAttribute('class', 'cl-main-widget-reward-details-header');
    sectionRewardsDetailsHeaderLabel.setAttribute('class', 'cl-main-widget-reward-details-header-label');
    sectionRewardsDetailsHeaderDate.setAttribute('class', 'cl-main-widget-reward-details-header-date');
    sectionRewardsDetailsBackBtn.setAttribute('class', 'cl-main-widget-reward-details-back-btn');
    sectionRewardsDetailsBodyContainer.setAttribute('class', 'cl-main-widget-reward-details-body-container');
    sectionRewardsDetailsBodyImageContainer.setAttribute('class', 'cl-main-widget-reward-details-body-image-cont');
    sectionRewardsDetailsBody.setAttribute('class', 'cl-main-widget-reward-details-body');
    sectionRewardsDetailsDescription.setAttribute('class', 'cl-main-widget-reward-details-description');
    sectionRewardsWinningsContainer.setAttribute('class', 'cl-main-widget-reward-winnings-container');
    sectionRewardsWinningsIcon.setAttribute('class', 'cl-main-widget-reward-winnings-icon');
    sectionRewardsWinningsValue.setAttribute('class', 'cl-main-widget-reward-winnings-value');
    sectionRewardsClaimContainer.setAttribute('class', 'cl-main-widget-reward-claim-container');
    sectionRewardsClaimBtn.setAttribute('class', 'cl-main-widget-reward-claim-btn');

    sectionRewardsHeaderLabel.innerHTML = _this.settings.lbWidget.settings.translation.rewards.label;
    sectionRewardsFooterContent.innerHTML = _this.settings.lbWidget.settings.translation.global.copy;
    sectionRewardsClaimBtn.innerHTML = _this.settings.lbWidget.settings.translation.rewards.claim;

    sectionRewardsWinningsContainer.appendChild(sectionRewardsWinningsIcon);
    sectionRewardsWinningsContainer.appendChild(sectionRewardsWinningsValue);
    sectionRewardsClaimContainer.appendChild(sectionRewardsClaimBtn);

    sectionRewardsDetailsHeader.appendChild(sectionRewardsDetailsBackBtn);
    sectionRewardsDetailsHeader.appendChild(sectionRewardsDetailsHeaderLabel);
    sectionRewardsDetailsHeader.appendChild(sectionRewardsDetailsHeaderDate);

    sectionRewardsDetailsBody.appendChild(sectionRewardsWinningsContainer);
    sectionRewardsDetailsBody.appendChild(sectionRewardsDetailsDescription);

    // sectionRewardsDetailsContainer.appendChild(sectionRewardsDetailsHeader);
    // sectionRewardsDetailsContainer.appendChild(sectionRewardsDetailsBackBtn);
    sectionRewardsDetailsBodyContainer.appendChild(sectionRewardsDetailsBodyImageContainer);
    sectionRewardsDetailsBodyContainer.appendChild(sectionRewardsDetailsBody);
    // sectionRewardsDetailsBodyContainer.appendChild(sectionRewardsWinningsContainer);
    sectionRewardsDetailsBodyContainer.appendChild(sectionRewardsClaimContainer);

    sectionRewardsDetailsContentWrapper.appendChild(sectionRewardsDetailsHeader);
    sectionRewardsDetailsContentWrapper.appendChild(sectionRewardsDetailsBodyContainer);

    sectionRewardsDetailsContainer.appendChild(sectionRewardsDetailsContentWrapper);
    // sectionRewardsDetailsContainer.appendChild(sectionRewardsClaimContainer);

    sectionRewardsHeader.appendChild(sectionRewardsHeaderLabel);
    sectionRewardsHeader.appendChild(sectionRewardsHeaderDate);
    sectionRewardsHeader.appendChild(sectionRewardsHeaderClose);

    sectionRewardsDetailsInfo.appendChild(sectionRewardsDetailsInfoIcon);
    sectionRewardsDetailsContentContainer.appendChild(sectionRewardsDetailsContentContainerLabel);
    sectionRewardsDetailsContentContainer.appendChild(sectionRewardsDetailsContentContainerDate);
    sectionRewardsDetails.appendChild(sectionRewardsDetailsInfo);
    sectionRewardsDetails.appendChild(sectionRewardsDetailsContentContainer);

    sectionRewardsListBody.appendChild(sectionRewardsListBodyResults);
    sectionRewardsList.appendChild(sectionRewardsListBody);

    sectionRewardsFooter.appendChild(sectionRewardsFooterContent);

    sectionRewards.appendChild(sectionRewardsHeader);
    sectionRewards.appendChild(sectionRewardsDetails);
    sectionRewards.appendChild(sectionRewardsList);
    sectionRewards.appendChild(sectionRewardsFooter);
    sectionRewards.appendChild(sectionRewardsDetailsContainer);

    return sectionRewards;
  };

  this.inboxAreaLayout = function () {
    var _this = this;
    var sectionInbox = document.createElement('div');

    var sectionInboxHeader = document.createElement('div');
    var sectionInboxHeaderLabel = document.createElement('div');
    // var sectionInboxHeaderDate = document.createElement('div');
    var sectionInboxHeaderClose = document.createElement('div');

    var sectionInboxDetails = document.createElement('div');
    var sectionInboxDetailsInfo = document.createElement('div');
    var sectionInboxDetailsInfoIcon = document.createElement('div');
    var sectionInboxDetailsContentContainer = document.createElement('div');
    var sectionInboxDetailsContentContainerLabel = document.createElement('div');
    var sectionInboxDetailsContentContainerDate = document.createElement('div');

    var sectionInboxList = document.createElement('div');
    var sectionInboxListBody = document.createElement('div');
    var sectionInboxListBodyResults = document.createElement('div');

    var sectionInboxFooter = document.createElement('div');
    var sectionInboxFooterContent = document.createElement('div');

    var sectionInboxDetailsContainer = document.createElement('div');
    const sectionInboxDetailsWrapper = document.createElement('div');
    var sectionInboxDetailsHeader = document.createElement('div');
    var sectionInboxDetailsHeaderLabel = document.createElement('div');
    var sectionInboxDetailsHeaderDate = document.createElement('div');
    var sectionInboxDetailsBackBtn = document.createElement('a');
    var sectionInboxDetailsBodyContainer = document.createElement('div');
    var sectionInboxDetailsBody = document.createElement('div');

    sectionInbox.setAttribute('class', _this.settings.lbWidget.settings.navigation.inbox.containerClass + ' cl-main-section-item');
    sectionInboxHeader.setAttribute('class', 'cl-main-widget-inbox-header');
    sectionInboxHeaderLabel.setAttribute('class', 'cl-main-widget-inbox-header-label');
    // sectionInboxHeaderDate.setAttribute('class', 'cl-main-widget-inbox-header-date');
    sectionInboxHeaderClose.setAttribute('class', 'cl-main-widget-inbox-header-close');

    sectionInboxDetails.setAttribute('class', 'cl-main-widget-inbox-details');
    sectionInboxDetailsInfo.setAttribute('class', 'cl-main-widget-inbox-details-info');
    sectionInboxDetailsInfoIcon.setAttribute('class', 'cl-main-widget-inbox-details-info-icon');
    sectionInboxDetailsContentContainer.setAttribute('class', 'cl-main-widget-inbox-details-content');
    sectionInboxDetailsContentContainerLabel.setAttribute('class', 'cl-main-widget-inbox-details-content-label');
    sectionInboxDetailsContentContainerDate.setAttribute('class', 'cl-main-widget-inbox-details-content-date');

    // Leaderboard result container
    sectionInboxList.setAttribute('class', 'cl-main-widget-inbox-list');
    sectionInboxListBody.setAttribute('class', 'cl-main-widget-inbox-list-body');
    sectionInboxListBodyResults.setAttribute('class', 'cl-main-widget-inbox-list-body-res');

    // footer
    sectionInboxFooter.setAttribute('class', 'cl-main-widget-inbox-footer');
    sectionInboxFooterContent.setAttribute('class', 'cl-main-widget-inbox-footer-content');

    // details section
    sectionInboxDetailsContainer.setAttribute('class', 'cl-main-widget-inbox-details-container');
    sectionInboxDetailsWrapper.setAttribute('class', 'cl-main-widget-inbox-details-wrapper');
    sectionInboxDetailsHeader.setAttribute('class', 'cl-main-widget-inbox-details-header');
    sectionInboxDetailsHeaderLabel.setAttribute('class', 'cl-main-widget-inbox-details-header-label');
    sectionInboxDetailsHeaderDate.setAttribute('class', 'cl-main-widget-inbox-details-header-date');
    sectionInboxDetailsBackBtn.setAttribute('class', 'cl-main-widget-inbox-details-back-btn');
    sectionInboxDetailsBodyContainer.setAttribute('class', 'cl-main-widget-inbox-details-body-container');
    sectionInboxDetailsBody.setAttribute('class', 'cl-main-widget-inbox-details-body');

    sectionInboxHeaderLabel.innerHTML = _this.settings.lbWidget.settings.translation.messages.label;
    sectionInboxFooterContent.innerHTML = _this.settings.lbWidget.settings.translation.global.copy;

    sectionInboxHeader.appendChild(sectionInboxHeaderLabel);
    // sectionInboxHeader.appendChild(sectionInboxHeaderDate);
    sectionInboxHeader.appendChild(sectionInboxHeaderClose);

    sectionInboxDetailsInfo.appendChild(sectionInboxDetailsInfoIcon);
    sectionInboxDetailsContentContainer.appendChild(sectionInboxDetailsContentContainerLabel);
    sectionInboxDetailsContentContainer.appendChild(sectionInboxDetailsContentContainerDate);
    sectionInboxDetails.appendChild(sectionInboxDetailsInfo);
    sectionInboxDetails.appendChild(sectionInboxDetailsContentContainer);

    sectionInboxListBody.appendChild(sectionInboxListBodyResults);
    sectionInboxList.appendChild(sectionInboxListBody);

    sectionInboxDetailsHeader.appendChild(sectionInboxDetailsBackBtn);
    sectionInboxDetailsHeader.appendChild(sectionInboxDetailsHeaderLabel);
    sectionInboxDetailsHeader.appendChild(sectionInboxDetailsHeaderDate);
    sectionInboxDetailsWrapper.appendChild(sectionInboxDetailsHeader);
    sectionInboxDetailsBodyContainer.appendChild(sectionInboxDetailsBody);
    sectionInboxDetailsWrapper.appendChild(sectionInboxDetailsBodyContainer);
    sectionInboxDetailsContainer.appendChild(sectionInboxDetailsWrapper);

    sectionInboxFooter.appendChild(sectionInboxFooterContent);

    sectionInbox.appendChild(sectionInboxHeader);
    sectionInbox.appendChild(sectionInboxDetails);
    sectionInbox.appendChild(sectionInboxList);
    sectionInbox.appendChild(sectionInboxFooter);
    sectionInbox.appendChild(sectionInboxDetailsContainer);

    return sectionInbox;
  };

  this.missionsAreaLayout = function () {
    const _this = this;
    const sectionMissions = document.createElement('div');

    const sectionMissionsHeader = document.createElement('div');
    const sectionMissionsHeaderLabel = document.createElement('div');
    const sectionMissionsHeaderDate = document.createElement('div');
    const sectionMissionsHeaderClose = document.createElement('div');

    const sectionMissionsDetails = document.createElement('div');
    const sectionMissionsDetailsInfo = document.createElement('div');
    const sectionMissionsDetailsInfoIcon = document.createElement('div');
    const sectionMissionsDetailsContentContainer = document.createElement('div');
    const sectionMissionsDetailsContentContainerLabel = document.createElement('div');
    const sectionMissionsDetailsContentContainerDate = document.createElement('div');

    const sectionMissionsList = document.createElement('div');
    const sectionMissionsListBody = document.createElement('div');
    const sectionMissionsListBodyResults = document.createElement('div');

    const sectionMissionsFooter = document.createElement('div');
    const sectionMissionsFooterContent = document.createElement('div');

    const sectionMissionsDetailsContainer = document.createElement('div');
    const sectionMissionsDetailsContainerWrapper = document.createElement('div');
    const sectionMissionsDetailsWrapper = document.createElement('div');
    const sectionMissionsDetailsHeader = document.createElement('div');
    const sectionMissionsDetailsHeaderLabel = document.createElement('div');
    const sectionMissionsDetailsHeaderDate = document.createElement('div');
    const sectionMissionsDetailsBackBtn = document.createElement('a');
    const sectionMissionsDetailsInfoBtn = document.createElement('a');
    const sectionMissionsDetailsBodyContainer = document.createElement('div');
    const sectionMissionsDetailsBodyWrapper = document.createElement('div');
    const sectionMissionsDetailsBodyImage = document.createElement('div');
    const sectionMissionsDetailsDescriptionLabel = document.createElement('div');
    const sectionMissionsDetailsBody = document.createElement('div');
    const sectionMissionsDetailsPrize = document.createElement('div');
    const sectionMissionsDetailsPrizeLabel = document.createElement('div');
    const sectionMissionsDetailsPrizeValue = document.createElement('div');

    const sectionMissionsGraph = document.createElement('div');
    const graphImage = document.createElement('div');

    graphImage.setAttribute('class', 'cl-main-widget-missions-graph-image');

    sectionMissionsGraph.setAttribute('id', 'graph-container');
    sectionMissionsGraph.setAttribute('class', 'cl-main-widget-missions-graph-container');

    sectionMissions.setAttribute('class', _this.settings.lbWidget.settings.navigation.missions.containerClass + ' cl-main-section-item');
    sectionMissionsHeader.setAttribute('class', 'cl-main-widget-missions-header');
    sectionMissionsHeaderLabel.setAttribute('class', 'cl-main-widget-missions-header-label');
    sectionMissionsHeaderDate.setAttribute('class', 'cl-main-widget-missions-header-date');
    sectionMissionsHeaderClose.setAttribute('class', 'cl-main-widget-missions-header-close');

    sectionMissionsDetails.setAttribute('class', 'cl-main-widget-missions-details');
    sectionMissionsDetailsInfo.setAttribute('class', 'cl-main-widget-missions-details-info');
    sectionMissionsDetailsInfoIcon.setAttribute('class', 'cl-main-widget-missions-details-info-icon');
    sectionMissionsDetailsContentContainer.setAttribute('class', 'cl-main-widget-missions-details-content');
    sectionMissionsDetailsContentContainerLabel.setAttribute('class', 'cl-main-widget-missions-details-content-label');
    sectionMissionsDetailsContentContainerDate.setAttribute('class', 'cl-main-widget-missions-details-content-date');

    // Leaderboard result container
    sectionMissionsList.setAttribute('class', 'cl-main-widget-missions-list');
    sectionMissionsListBody.setAttribute('class', 'cl-main-widget-missions-list-body');
    sectionMissionsListBodyResults.setAttribute('class', 'cl-main-widget-missions-list-body-res');

    // footer
    sectionMissionsFooter.setAttribute('class', 'cl-main-widget-missions-footer');
    sectionMissionsFooterContent.setAttribute('class', 'cl-main-widget-missions-footer-content');

    // details section
    sectionMissionsDetailsContainer.setAttribute('class', 'cl-main-widget-missions-details-container');
    sectionMissionsDetailsContainerWrapper.setAttribute('class', 'cl-main-widget-missions-details-container-wrapper');
    sectionMissionsDetailsWrapper.setAttribute('class', 'cl-main-widget-missions-details-wrapper');
    sectionMissionsDetailsHeader.setAttribute('class', 'cl-main-widget-missions-details-header');
    sectionMissionsDetailsHeaderLabel.setAttribute('class', 'cl-main-widget-missions-details-header-label');
    sectionMissionsDetailsHeaderDate.setAttribute('class', 'cl-main-widget-missions-details-header-date');
    sectionMissionsDetailsBackBtn.setAttribute('class', 'cl-main-widget-missions-details-back-btn');
    sectionMissionsDetailsInfoBtn.setAttribute('class', 'cl-main-widget-missions-details-info-btn');
    sectionMissionsDetailsBodyContainer.setAttribute('class', 'cl-main-widget-missions-details-body-container');
    sectionMissionsDetailsBodyWrapper.setAttribute('class', 'cl-main-widget-missions-details-body-wrapper');
    sectionMissionsDetailsBodyImage.setAttribute('class', 'cl-main-widget-missions-details-body-image');
    sectionMissionsDetailsDescriptionLabel.setAttribute('class', 'cl-main-widget-missions-details-description-label');
    sectionMissionsDetailsBody.setAttribute('class', 'cl-main-widget-missions-details-description');
    sectionMissionsDetailsPrize.setAttribute('class', 'cl-main-widget-missions-details-prize');
    sectionMissionsDetailsPrizeLabel.setAttribute('class', 'cl-main-widget-missions-details-prize-label');
    sectionMissionsDetailsPrizeValue.setAttribute('class', 'cl-main-widget-missions-details-prize-value');

    sectionMissionsHeaderLabel.innerHTML = _this.settings.lbWidget.settings.translation.missions.label;
    sectionMissionsFooterContent.innerHTML = _this.settings.lbWidget.settings.translation.global.copy;
    sectionMissionsDetailsInfoBtn.innerHTML = 'i';
    sectionMissionsDetailsDescriptionLabel.innerHTML = _this.settings.lbWidget.settings.translation.missions.descriptionLabel;
    sectionMissionsDetailsPrizeLabel.innerHTML = _this.settings.lbWidget.settings.translation.missions.prizeLabel + ':';

    sectionMissionsHeader.appendChild(sectionMissionsHeaderLabel);
    sectionMissionsHeader.appendChild(sectionMissionsHeaderDate);
    sectionMissionsHeader.appendChild(sectionMissionsHeaderClose);

    sectionMissionsDetailsPrize.appendChild(sectionMissionsDetailsPrizeLabel);
    sectionMissionsDetailsPrize.appendChild(sectionMissionsDetailsPrizeValue);

    sectionMissionsDetailsInfo.appendChild(sectionMissionsDetailsInfoIcon);
    sectionMissionsDetailsContentContainer.appendChild(sectionMissionsDetailsContentContainerLabel);
    sectionMissionsDetailsContentContainer.appendChild(sectionMissionsDetailsContentContainerDate);
    sectionMissionsDetails.appendChild(sectionMissionsDetailsInfo);
    sectionMissionsDetails.appendChild(sectionMissionsDetailsContentContainer);

    sectionMissionsListBody.appendChild(sectionMissionsListBodyResults);
    sectionMissionsList.appendChild(sectionMissionsListBody);

    sectionMissionsDetailsHeader.appendChild(sectionMissionsDetailsBackBtn);
    // sectionMissionsDetailsHeader.appendChild(sectionMissionsDetailsHeaderLabel);
    sectionMissionsDetailsHeader.appendChild(sectionMissionsDetailsInfoBtn);
    // sectionMissionsDetailsHeader.appendChild(sectionMissionsDetailsHeaderDate);

    // sectionMissionsDetailsContainer.appendChild(sectionMissionsDetailsHeader);
    sectionMissionsDetailsBodyContainer.appendChild(sectionMissionsDetailsHeaderLabel);
    sectionMissionsDetailsBodyContainer.appendChild(sectionMissionsDetailsDescriptionLabel);
    sectionMissionsDetailsBodyContainer.appendChild(sectionMissionsDetailsBody);
    sectionMissionsDetailsBodyContainer.appendChild(sectionMissionsDetailsPrize);

    sectionMissionsDetailsBodyWrapper.appendChild(sectionMissionsDetailsBodyImage);
    sectionMissionsDetailsBodyWrapper.appendChild(sectionMissionsDetailsBodyContainer);

    sectionMissionsDetailsBodyContainer.appendChild(graphImage);
    // sectionMissionsDetailsBodyContainer.appendChild(sectionMissionsGraph);

    sectionMissionsDetailsWrapper.appendChild(sectionMissionsDetailsHeader);
    sectionMissionsDetailsWrapper.appendChild(sectionMissionsDetailsBodyWrapper);

    sectionMissionsDetailsContainerWrapper.appendChild(sectionMissionsDetailsWrapper);
    sectionMissionsDetailsContainerWrapper.appendChild(sectionMissionsGraph);

    sectionMissionsDetailsContainer.appendChild(sectionMissionsDetailsContainerWrapper);

    sectionMissionsFooter.appendChild(sectionMissionsFooterContent);

    sectionMissions.appendChild(sectionMissionsHeader);
    sectionMissions.appendChild(sectionMissionsDetails);
    sectionMissions.appendChild(sectionMissionsList);
    sectionMissions.appendChild(sectionMissionsFooter);
    sectionMissions.appendChild(sectionMissionsDetailsContainer);

    return sectionMissions;
  };

  this.leaderboardHeader = function () {
    var _this = this;
    var rankCol = document.createElement('div');
    var iconCol = document.createElement('div');
    var nameCol = document.createElement('div');
    var growthCol = document.createElement('div');
    var pointsCol = document.createElement('div');

    rankCol.setAttribute('class', 'cl-rank-col cl-col');
    iconCol.setAttribute('class', 'cl-icon-col cl-col');
    nameCol.setAttribute('class', 'cl-name-col cl-col');
    growthCol.setAttribute('class', 'cl-growth-col cl-col');
    pointsCol.setAttribute('class', 'cl-points-col cl-col');

    rankCol.innerHTML = _this.settings.lbWidget.settings.translation.leaderboard.rank;
    iconCol.innerHTML = '';
    nameCol.innerHTML = _this.settings.lbWidget.settings.translation.leaderboard.name;
    growthCol.innerHTML = '';
    pointsCol.innerHTML = _this.settings.lbWidget.settings.translation.leaderboard.points;

    _this.settings.leaderboard.header.appendChild(rankCol);
    _this.settings.leaderboard.header.appendChild(iconCol);
    _this.settings.leaderboard.header.appendChild(nameCol);
    _this.settings.leaderboard.header.appendChild(growthCol);
    _this.settings.leaderboard.header.appendChild(pointsCol);

    var rewardCol = document.createElement('div');
    var rewardEnabled = (typeof _this.settings.lbWidget.settings.competition.activeContest !== 'undefined' && _this.settings.lbWidget.settings.competition.activeContest !== null && typeof _this.settings.lbWidget.settings.competition.activeContest.rewards !== 'undefined' && _this.settings.lbWidget.settings.competition.activeContest.rewards.length > 0);
    rewardCol.setAttribute('class', 'cl-reward-col cl-col' + (rewardEnabled ? ' cl-col-reward-enabled' : ''));
    rewardCol.innerHTML = _this.settings.lbWidget.settings.translation.leaderboard.prize;

    addClass(_this.settings.leaderboard.header, 'cl-reward-enabled');

    _this.settings.leaderboard.header.appendChild(rewardCol);
  };

  this.leaderboardRow = function (rank, icon, name, change, growth, points, reward, count, memberFound) {
    var _this = this;
    var cellWrapper = document.createElement('div');
    var rankCel = document.createElement('div');
    var rankCelValue = document.createElement('div');
    var iconCel = document.createElement('div');
    var iconCelImg = document.createElement('div');
    var nameCel = document.createElement('div');
    var growthCel = document.createElement('div');
    var pointsCel = document.createElement('div');
    var memberFoundClass = (memberFound) ? ' cl-lb-member-row' : '';

    cellWrapper.setAttribute('class', 'cl-lb-row cl-lb-rank-' + rank + ' cl-lb-count-' + count + memberFoundClass);
    rankCel.setAttribute('class', 'cl-rank-col cl-col cl-rank-' + rank);
    rankCelValue.setAttribute('class', 'cl-rank-col-value');
    iconCel.setAttribute('class', 'cl-icon-col cl-col');
    iconCelImg.setAttribute('class', 'cl-icon-col-img');
    nameCel.setAttribute('class', 'cl-name-col cl-col');
    growthCel.setAttribute('class', 'cl-growth-col cl-col');
    pointsCel.setAttribute('class', 'cl-points-col cl-col');

    cellWrapper.dataset.rank = rank;

    rankCelValue.innerHTML = rank;
    nameCel.innerHTML = name;
    growthCel.dataset.growth = (change < 0) ? 'down' : (change > 0 ? 'up' : 'same');
    growthCel.dataset.change = change;
    growthCel.innerHTML = growth;
    pointsCel.innerHTML = points;

    iconCelImg.innerHTML = icon;

    rankCel.appendChild(rankCelValue);
    cellWrapper.appendChild(rankCel);
    iconCel.appendChild(iconCelImg);
    cellWrapper.appendChild(iconCel);
    cellWrapper.appendChild(nameCel);
    cellWrapper.appendChild(growthCel);
    cellWrapper.appendChild(pointsCel);

    var rewardCel = document.createElement('div');
    var rewardEnabled = (typeof _this.settings.lbWidget.settings.competition.activeContest !== 'undefined' && _this.settings.lbWidget.settings.competition.activeContest !== null && typeof _this.settings.lbWidget.settings.competition.activeContest.rewards !== 'undefined' && _this.settings.lbWidget.settings.competition.activeContest.rewards.length > 0);
    rewardCel.setAttribute('class', 'cl-reward-col cl-col' + (rewardEnabled ? ' cl-col-reward-enabled' : ''));
    rewardCel.innerHTML = (typeof reward !== 'undefined' && reward !== null) ? reward : '';

    addClass(cellWrapper, 'cl-reward-enabled');

    cellWrapper.appendChild(rewardCel);

    return cellWrapper;
  };

  this.leaderboardRowUpdate = function (rank, icon, name, change, growth, points, reward, count, memberFound, onMissing) {
    var _this = this;
    var cellRow = query(_this.settings.leaderboard.container, '.cl-lb-rank-' + rank + '.cl-lb-count-' + count);

    if (cellRow === null) {
      onMissing(rank, name ? name[0] : '', name, change, growth, points, reward, count, memberFound);
    } else {
      var rankCel = query(cellRow, '.cl-rank-col-value');
      var iconCel = query(cellRow, '.cl-icon-col-img');
      var nameCel = query(cellRow, '.cl-name-col');
      var growthCel = query(cellRow, '.cl-growth-col');
      var pointsCel = query(cellRow, '.cl-points-col');
      var memberFoundClass = 'cl-lb-member-row';
      var rowHasClass = hasClass(cellRow, memberFoundClass);

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
        var rewardCel = query(cellRow, '.cl-reward-col');
        if (rewardCel !== null) {
          rewardCel.innerHTML = (typeof reward !== 'undefined' && reward !== null) ? reward : '';
        }
      }
    }
  };

  this.populateLeaderboardResultsWithDefaultEntries = function (clearPrize = false) {
    var _this = this;
    var topResults = [];
    var remainingResults = [];

    for (let i = 0; i < _this.settings.leaderboard.topResultSize; i++) {
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
      _this.settings.lbWidget.settings.leaderboard.fullLeaderboardSize < _this.settings.leaderboard.defaultEmptyList
    )
      ? _this.settings.lbWidget.settings.leaderboard.fullLeaderboardSize + 1
      : _this.settings.leaderboard.defaultEmptyList;

    for (let s = _this.settings.leaderboard.topResultSize; s < emptyListLength; s++) {
      const rank = s + 1;

      remainingResults.push({
        name: '--',
        rank: rank,
        score: '--',
        memberId: '',
        memberRefId: ''
      });
    }

    _this.updateLeaderboardTopResults(topResults, clearPrize);
    _this.updateLeaderboardResults(remainingResults, clearPrize);
  };

  this.updateLeaderboardTopResults = function (topResults, clearPrize = false) {
    var _this = this;
    var rankCheck = [];
    var cleanupRankCheck = [];

    // cleanup
    mapObject(topResults, function (lb) {
      cleanupRankCheck.push(lb.rank);
      objectIterator(query(_this.settings.leaderboard.topResults, '.cl-lb-rank-' + lb.rank + '.cl-shared-rank'), function (obj) {
        remove(obj);
      });
    });

    objectIterator(query(_this.settings.leaderboard.topResults, '.cl-lb-row'), function (obj) {
      var rank = parseInt(obj.dataset.rank);
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
      var count = 0;
      // const icon = memberLbName && memberLbName.length ? memberLbName[0] : '';
      const memberFound = lb.members && lb.members.findIndex(m => m.memberRefId === _this.settings.lbWidget.settings.memberRefId) !== -1;

      var memberName = (memberFound) ? _this.settings.lbWidget.settings.translation.leaderboard.you : memberLbName;
      var memberNameLength = _this.settings.lbWidget.settings.memberNameLength;
      var reward = clearPrize ? '' : _this.getReward(lb.rank);
      var change = (typeof lb.change === 'undefined') ? 0 : lb.change;
      var growthType = (change < 0) ? 'down' : (change > 0 ? 'up' : 'same');
      var growthIcon = "<span class='cl-growth-icon cl-growth-" + growthType + "'></span>";
      var formattedPoints = _this.settings.lbWidget.settings.leaderboard.pointsFormatter(lb.score);

      if (rankCheck.indexOf(lb.rank) !== -1) {
        for (var rc = 0; rc < rankCheck.length; rc++) {
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
          var newRow = _this.leaderboardRow(rank, name ? name[0] : '', name, change, growth, points, reward, count, memberFound);
          var prevCellRow = query(_this.settings.leaderboard.container, '.cl-lb-rank-' + rank + '.cl-lb-count-' + (count - 1));

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

  this.getReward = function (rank) {
    var _this = this;
    var rewardResponse = [];

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

        // if (rank !== 0 && reward.rewardRank.indexOf(rank) !== -1) {
        //   rewardResponse.push(_this.settings.lbWidget.settings.partialFunctions.rewardFormatter(reward));
        // } else if (reward.rewardRank.indexOf('-') !== -1) {
        //   const rewardRankArr = reward.rewardRank.split(',');
        //   rewardRankArr.forEach(r => {
        //     const idx = r.indexOf('-');
        //     if (idx !== -1) {
        //       const start = parseInt(r);
        //       const end = parseInt(r.substring(idx + 1));
        //       if (rank > start && rank < end) {
        //         rewardResponse.push(_this.settings.lbWidget.settings.partialFunctions.rewardFormatter(reward));
        //       }
        //     }
        //   });
        // }
      });
    }

    return rewardResponse.join(', ');
  };

  this.updateLeaderboardResults = function (remainingResults, clearPrize = false) {
    var _this = this;
    var rankCheck = [];
    var cleanupRankCheck = [];

    // cleanup
    mapObject(remainingResults, function (lb) {
      cleanupRankCheck.push(lb.rank);
      objectIterator(query(_this.settings.leaderboard.list, '.cl-lb-rank-' + lb.rank + '.cl-shared-rank'), function (obj) {
        remove(obj);
      });
    });

    objectIterator(query(_this.settings.leaderboard.container, '.cl-lb-row'), function (obj) {
      var rank = parseInt(obj.dataset.rank);
      if (cleanupRankCheck.indexOf(rank) === -1 && (rank > _this.settings.leaderboard.defaultEmptyList || rank === 0)) {
        remove(obj);
      }
    });

    mapObject(remainingResults, function (lb) {
      // let memberId = '';
      let memberNames = '';
      let memberLbName = '';
      if (lb.members && lb.members.length) {
        // memberId = lb.members[0].memberId;
        memberNames = lb.members.map((m) => m.name);
        memberLbName = memberNames.join();
      } else {
        // memberId = lb.memberId;
        memberLbName = lb.name;
      }
      var count = 0;
      const icon = memberLbName && memberLbName.length ? memberLbName[0] : '';
      const memberFound = lb.members && lb.members.findIndex(m => m.memberRefId === _this.settings.lbWidget.settings.memberRefId) !== -1;
      var memberName = (memberFound) ? _this.settings.lbWidget.settings.translation.leaderboard.you : memberLbName;
      var memberNameLength = _this.settings.lbWidget.settings.memberNameLength;
      var reward = clearPrize ? '' : _this.getReward(lb.rank);
      var change = (typeof lb.change === 'undefined') ? 0 : lb.change;
      var growthType = (change < 0) ? 'down' : (change > 0 ? 'up' : 'same');
      var growthIcon = "<span class='cl-growth-icon cl-growth-" + growthType + "'></span>";
      var formattedPoints = _this.settings.lbWidget.settings.leaderboard.pointsFormatter(lb.score);

      if (rankCheck.indexOf(lb.rank) !== -1) {
        for (var rc = 0; rc < rankCheck.length; rc++) {
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
        icon, // icon
        memberName,
        change,
        growthIcon, // growth
        formattedPoints,
        reward,
        count,
        memberFound,
        function (rank, icon, name, change, growth, points, reward, count, memberFound) {
          var newRow = _this.leaderboardRow(rank, icon, name, name, growth, points, reward, count, memberFound);
          var prevCellRow = query(_this.settings.leaderboard.container, '.cl-lb-rank-' + rank + '.cl-lb-count-' + (count - 1));

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
    var _this = this;
    var topResults = [];
    var remainingResults = [];

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

    var member = query(_this.settings.leaderboard.list, '.cl-lb-member-row');
    var memberInTop = query(_this.settings.leaderboard.topResults, '.cl-lb-member-row');

    if (member !== null) {
      _this.missingMember(_this.isElementVisibleInView(member, _this.settings.leaderboard.list.parentNode));
      _this.missingMember(_this.isElementVisibleInView(member, _this.settings.leaderboard.resultContainer));
    } else if (memberInTop !== null) {
      _this.missingMember(true);
    } else {
      _this.missingMemberReset();
    }
  };

  this.updateLeaderboardTime = function () {
    var _this = this;
    if (!_this.settings.lbWidget.settings.competition.activeContest) {
      _this.settings.headerDate.innerHTML = '';
      _this.settings.labelDate.innerHTML = '';
      _this.settings.descriptionDate.innerHTML = '';
      _this.settings.detailsContainerDate.innerHTML = '';
      _this.settings.labelDateHeaders.innerHTML = '';
      _this.settings.detailsDateHeaders.innerHTML = '';
    } else {
      let diff = moment(_this.settings.lbWidget.settings.competition.activeContest.scheduledStartDate).diff(moment());
      let date = _this.settings.lbWidget.settings.translation.miniLeaderboard.startsIn + ': ' + _this.settings.lbWidget.formatDateTime(moment.duration(diff));
      let labelDate = _this.settings.lbWidget.settings.translation.miniLeaderboard.startsIn + ': ' + _this.settings.lbWidget.formatBannerDateTime(moment.duration(diff));
      let descriptionDate = _this.settings.lbWidget.settings.translation.miniLeaderboard.startsIn + ': ' + _this.settings.lbWidget.formatBannerDateTime(moment.duration(diff));

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

        if (diff <= 0) {
          date = _this.settings.lbWidget.settings.translation.tournaments.finishing;
          labelDate = _this.settings.lbWidget.settings.translation.tournaments.finishing;
          descriptionDate = _this.settings.lbWidget.settings.translation.tournaments.finishing;
          _this.settings.labelDateHeaders.innerHTML = '';
          _this.settings.detailsDateHeaders.innerHTML = '';
        }
      } else if (_this.settings.lbWidget.settings.competition.activeContest.statusCode === 30) {
        date = _this.settings.lbWidget.settings.translation.tournaments.finishing;
        labelDate = _this.settings.lbWidget.settings.translation.tournaments.finishing;
        descriptionDate = _this.settings.lbWidget.settings.translation.tournaments.finishing;
        _this.settings.labelDateHeaders.innerHTML = '';
        _this.settings.detailsDateHeaders.innerHTML = '';
      } else if (_this.settings.lbWidget.settings.competition.activeContest.statusCode >= 35) {
        date = _this.settings.lbWidget.settings.translation.tournaments.finished;
        labelDate = _this.settings.lbWidget.settings.translation.tournaments.finished;
        descriptionDate = _this.settings.lbWidget.settings.translation.tournaments.finished;
        _this.settings.labelDateHeaders.innerHTML = '';
        _this.settings.detailsDateHeaders.innerHTML = '';
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
    return (
      this.settings.lbWidget.settings.competition.activeContest !== null &&
      this.settings.lbWidget.settings.competition.activeContest.name
    )
      ? this.settings.lbWidget.settings.competition.activeContest.name
      : this.settings.lbWidget.settings.translation.tournaments.noAvailableCompetitions;
  };

  this.getActiveCompetitionDescription = function () {
    return (this.settings.lbWidget.settings.competition.activeContest !== null &&
        this.settings.lbWidget.settings.competition.activeContest.description &&
        this.settings.lbWidget.settings.competition.activeContest.description.length > 0)
      ? this.settings.lbWidget.settings.competition.activeContest.description
      : ((this.settings.lbWidget.settings.competition.activeCompetition !== null &&
            this.settings.lbWidget.settings.competition.activeCompetition.description &&
            this.settings.lbWidget.settings.competition.activeCompetition.description.length > 0)
        ? this.settings.lbWidget.settings.competition.activeCompetition.description : '');
  };

  this.extractImage = function (body, imageContainer, isBodyVirtualOpt) {
    const _this = this;
    const activeImageContainer = closest(body, '.cl-main-section-image-banner-active');
    let imageFound = false;
    const isBodyVirtual = (typeof isBodyVirtualOpt === 'boolean') ? isBodyVirtualOpt : false;

    if (_this.settings.lbWidget.settings.competition.extractImageHeader) {
      objectIterator(query(body, 'img'), function (img, key, count) {
        if (count === 0) {
          imageFound = true;
          var newImg = img.cloneNode(true);
          addClass(newImg, 'cl-main-widget-lb-details-image');
          imageContainer.innerHTML = '';
          imageContainer.appendChild(newImg);

          remove(img);
        }
      });
      if (!imageFound) {
        const urlRegex = (/(https?:\/\/[^ ]*\.(?:gif|png|jpg|jpeg))/i);
        if (body.innerText) {
          const url = body.innerText.match(urlRegex);
          if (url && url.length) {
            const currentImg = imageContainer.getElementsByTagName('img');
            let currentImgSrc = '';

            if (currentImg.length) {
              currentImgSrc = currentImg[0].src;
            }

            if (url[0] !== currentImgSrc) {
              const newImg = document.createElement('img');
              newImg.setAttribute('src', url[0]);
              addClass(newImg, 'cl-main-widget-lb-details-image');
              imageContainer.appendChild(newImg);
            }

            body.innerHTML = body.innerHTML.replace(url[0], '');
            imageFound = true;
          }
        }
      }
    }

    if (!imageFound && activeImageContainer !== null) {
      removeClass(activeImageContainer, 'cl-main-section-image-banner-active');
      const detailsImageContainer = query(activeImageContainer, '.cl-main-widget-lb-details-image-container');
      detailsImageContainer.innerHTML = '';
    } else if (imageFound && activeImageContainer === null && _this.settings.lbWidget.settings.leaderboard.layoutSettings.imageBanner && !isBodyVirtual) {
      addClass(closest(body, '.cl-main-section-item'), 'cl-main-section-image-banner-active');
    }
  };

  this.leaderboardDetailsUpdate = function () {
    var _this = this;
    var mainLabel = query(_this.settings.section, '.cl-main-widget-lb-details-content-label-text');
    var body = null;
    let title = null;
    let bannerTitle = null;
    _this.settings.descriptionDate = query(_this.settings.container, '.cl-main-widget-lb-details-description-date');

    if (!_this.settings.lbWidget.settings.leaderboard.layoutSettings.titleLinkToDetailsPage) {
      body = query(_this.settings.section, '.cl-main-widget-lb-details-description');
      title = query(_this.settings.section, '.cl-main-widget-lb-details-description-header-title');
      bannerTitle = query(_this.settings.section, '.cl-main-widget-lb-details-description-label-text');
      if (!body) return;
      body.innerHTML = _this.getActiveCompetitionDescription();
      title.innerHTML = _this.getActiveContestTitle();
      bannerTitle.innerHTML = _this.getActiveContestTitle();
    }

    if (_this.settings.lbWidget.settings.leaderboard.layoutSettings.imageBanner) {
      var imageContainer = query(_this.settings.section, '.cl-main-widget-lb-details-image-container');
      // imageContainer.innerHTML = '';

      if (body === null) {
        body = document.createElement('div');
        body.innerHTML = _this.getActiveCompetitionDescription();

        _this.extractImage(body, imageContainer, true);
      } else {
        _this.extractImage(body, imageContainer, false);
      }
    }

    mainLabel.innerHTML = (_this.settings.lbWidget.settings.competition.activeContest !== null)
      ? _this.settings.lbWidget.settings.competition.activeContest.name
      : _this.settings.lbWidget.settings.translation.tournaments.noAvailableCompetitions;
  };

  this.showEmbeddedCompetitionDetailsContent = function (callback) {
    const listIcon = query(this.settings.container, '.cl-main-widget-lb-header-list-icon');
    const backIcon = query(this.settings.container, '.cl-main-widget-lb-header-back-icon');

    listIcon.style.display = 'none';
    backIcon.style.display = 'block';

    if (hasClass(this.settings.section, 'cl-main-active-embedded-description')) {
      removeClass(this.settings.section, 'cl-main-active-embedded-description');
    } else {
      addClass(this.settings.section, 'cl-main-active-embedded-description');
    }
    if (typeof callback === 'function') callback();
  };

  this.hideEmbeddedCompetitionDetailsContent = function (callback) {
    const listIcon = query(this.settings.container, '.cl-main-widget-lb-header-list-icon');
    const backIcon = query(this.settings.container, '.cl-main-widget-lb-header-back-icon');

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
        optIn.parentNode.style.display = 'block';
      } else {
        optIn.innerHTML = this.settings.lbWidget.settings.translation.tournaments.enter;
        optIn.parentNode.style.display = 'block';
        removeClass(optIn, 'checking');
      }
    } else {
      optIn.parentNode.style.display = 'none';
    }
  };

  // cleanup/recover activity
  this.preLoaderRerun = function () {
    var _this = this;

    if (_this.settings.preLoader.preLoaderActive && _this.settings.preLoader.preloaderCallbackRecovery !== null &&
      _this.settings.preLoader.preLoaderlastAttempt !== null && typeof _this.settings.preLoader.preLoaderlastAttempt === 'number' &&
      (_this.settings.preLoader.preLoaderlastAttempt + 8000) < new Date().getTime()) {
      _this.settings.preLoader.preloaderCallbackRecovery();
    }
  };

  this.preloader = function () {
    var _this = this;
    var preLoader = query(_this.settings.section, '.cl-main-widget-pre-loader');
    // var content = query(_this.settings.section, '.cl-main-widget-pre-loader-content');

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
    var _this = this;

    if (_this.settings.container !== null) {
      remove(_this.settings.container);
      remove(_this.settings.overlayContainer);
    }

    _this.settings.container = null;
    _this.settings.overlayContainer = null;
  };

  this.loadLeaderboard = function (callback) {
    var _this = this;

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

      _this.mainNavigationCheck();
      _this.leaderboardHeader();
    }

    _this.eventListeners();

    _this.leaderboardOptInCheck();
    _this.leaderboardDetailsUpdate();
    _this.updateLeaderboard();

    if (_this.settings.lbWidget.settings.competition.activeContest !== null) {
      _this.updateLeaderboardTime();
    } else {
      _this.settings.labelDateHeaders.innerHTML = '';
      _this.settings.detailsDateHeaders.innerHTML = '';
    }

    if (typeof callback === 'function') {
      callback();
    }
  };

  this.clearAll = function () {
    var _this = this;

    _this.settings.active = false;

    if (_this.settings.leaderboard.timerInterval) {
      clearTimeout(_this.settings.leaderboard.timerInterval);
    }

    _this.settings.preLoader.preLoaderActive = false;
  };

  this.hide = function (callback) {
    var _this = this;

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
    var _this = this;
    var area = query(_this.settings.container, '.cl-main-widget-lb-missing-member');
    var areaDetails = query(_this.settings.container, '.cl-main-widget-lb-missing-member-details');
    var member = query(_this.settings.leaderboard.list, '.cl-lb-member-row');

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
    var position = el.getBoundingClientRect();
    var elemContainer = container.getBoundingClientRect();
    var elemTop = position.top;
    var elemBottom = position.bottom;
    var elemHeight = position.height;

    return (elemTop - 110) <= elemContainer.top
      ? elemContainer.top - (elemTop - 110) <= elemHeight : elemBottom - elemContainer.bottom <= elemHeight;
  };

  var onresizeInitialised = false;
  this.eventListeners = function () {
    var _this = this;

    // unique solution to support horizontal mobile orientation
    if (_this.settings.leaderboard.resultContainer !== null && _this.settings.leaderboard.resultContainer.onscroll === null) {
      _this.settings.leaderboard.resultContainer.onscroll = function (evt) {
        evt.preventDefault();
        var member = query(_this.settings.leaderboard.list, '.cl-lb-member-row');

        if (member !== null) {
          _this.missingMember(_this.isElementVisibleInView(member, evt.target));
        }
      };
    }

    if (_this.settings.leaderboard.list !== null && _this.settings.leaderboard.list.parentNode.onscroll === null) {
      _this.settings.leaderboard.list.parentNode.onscroll = function (evt) {
        evt.preventDefault();
        var member = query(_this.settings.leaderboard.list, '.cl-lb-member-row');

        if (member !== null) {
          _this.missingMember(_this.isElementVisibleInView(member, evt.target));
        }
      };
    }

    if (!onresizeInitialised) {
      onresizeInitialised = true;
      window.onresize = function (evt) {
        var member = query(_this.settings.leaderboard.list, '.cl-lb-member-row');

        if (member !== null) {
          _this.missingMember(_this.isElementVisibleInView(member, _this.settings.leaderboard.list.parentNode));
          _this.missingMember(_this.isElementVisibleInView(member, _this.settings.leaderboard.resultContainer));
        }
      };
    }
  };

  // this.checkLeaderboardScrollContainer = function(){
  //  var _this = this,
  //    lbScrollContainer = query(_this.settings.leaderboard.container, ".cl-main-widget-lb-leaderboard-body");
  //
  //  if( scrollEnabled(lbScrollContainer) ){
  //    addClass(lbScrollContainer, "cl-element-scrollable");
  //  }else{
  //    removeClass(lbScrollContainer, "cl-element-scrollable");
  //  }
  // };

  this.competitionDetailsOptInButtonState = function () {
    var _this = this;
    var optIn = query(_this.settings.detailsContainer, '.cl-main-widget-lb-details-optin-action');

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
    var _this = this;
    var label = query(_this.settings.detailsContainer, '.cl-main-widget-lb-details-header-label');
    // var date = query(_this.settings.detailsContainer, '.cl-main-widget-lb-details-header-date');
    var body = query(_this.settings.detailsContainer, '.cl-main-widget-lb-details-body');
    var image = query(_this.settings.detailsContainer, '.cl-main-widget-lb-details-body-image-cont');
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

    _this.extractImage(body, image);

    setTimeout(function () {
      addClass(_this.settings.detailsContainer, 'cl-show');

      if (typeof callback === 'function') callback();
    }, 50);
  };

  this.loadCompetitionList = function (
    callback,
    readyPageNumber = 1,
    activePageNumber = 1,
    finishedPageNumber = 1
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

    let paginator = query(listResContainer, '.paginator-active');
    if (!paginator && totalCount > itemsPerPage) {
      const pagesCount = Math.ceil(totalCount / itemsPerPage);
      paginator = document.createElement('div');
      paginator.setAttribute('class', 'paginator-active');
      addClass(paginator, 'paginator');
      addClass(paginator, 'accordion');

      let page = '';

      for (let i = 0; i < pagesCount; i++) {
        page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
      }
      paginator.innerHTML = page;
    }

    let readyPaginator = query(listResContainer, '.paginator-ready');
    if (!readyPaginator && readyTotalCount > itemsPerPage) {
      const pagesCount = Math.ceil(readyTotalCount / itemsPerPage);
      readyPaginator = document.createElement('div');
      readyPaginator.setAttribute('class', 'paginator-ready');
      addClass(readyPaginator, 'paginator');
      addClass(readyPaginator, 'accordion');

      let page = '';

      for (let i = 0; i < pagesCount; i++) {
        page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
      }
      readyPaginator.innerHTML = page;
    }

    let finishedPaginator = query(listResContainer, '.paginator-finished');
    if (!finishedPaginator && finishedTotalCount > itemsPerPage) {
      const pagesCount = Math.ceil(finishedTotalCount / itemsPerPage);
      finishedPaginator = document.createElement('div');
      finishedPaginator.setAttribute('class', 'paginator-finished');
      addClass(finishedPaginator, 'paginator');
      addClass(finishedPaginator, 'accordion');

      let page = '';

      for (let i = 0; i < pagesCount; i++) {
        page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
      }
      finishedPaginator.innerHTML = page;

      const prev = document.createElement('span');
      prev.setAttribute('class', 'paginator-item prev');
      const next = document.createElement('span');
      next.setAttribute('class', 'paginator-item next');

      finishedPaginator.prepend(prev);
      finishedPaginator.appendChild(next);
    }

    if (readyPageNumber > 1) {
      _this.settings.tournamentsSection.accordionLayout.map(t => {
        t.show = t.type === 'readyCompetitions';
      });
    } else if (finishedPageNumber > 1) {
      _this.settings.tournamentsSection.accordionLayout.map(t => {
        t.show = t.type === 'finishedCompetitions';
      });
    } else {
      _this.settings.tournamentsSection.accordionLayout.map(t => {
        t.show = t.type === 'activeCompetitions';
      });
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

  this.hideCompetitionList = function (callback) {
    var _this = this;
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
    var _this = this;

    removeClass(_this.settings.detailsContainer, 'cl-show');
    setTimeout(function () {
      _this.settings.detailsContainer.style.display = 'none';
      _this.settings.headerDate.style.display = 'block';

      if (typeof callback === 'function') callback();
    }, 200);
  };

  this.achievementItem = function (ach, achieved, perc) {
    const _this = this;
    const listItem = document.createElement('div');
    const detailsContainer = document.createElement('div');
    const detailsWrapper = document.createElement('div');
    const icon = document.createElement('div');
    const label = document.createElement('div');
    // var description = document.createElement('div');
    const progressionWrapper = document.createElement('div');
    const progressionCont = document.createElement('div');
    const progressionBar = document.createElement('div');
    const progressionLabel = document.createElement('div');
    const actionsWrapper = document.createElement('div');
    const moreButton = document.createElement('a');
    const enterButton = document.createElement('a');
    const leaveButton = document.createElement('a');
    const progressionButton = document.createElement('a');
    // var cpomntainsImage = (typeof ach.icon !== 'undefined' && ach.icon.length > 0);

    listItem.setAttribute('class', 'cl-ach-list-item cl-ach-' + ach.id);
    detailsContainer.setAttribute('class', 'cl-ach-list-details-cont');
    icon.setAttribute('class', 'cl-ach-list-icon');
    detailsWrapper.setAttribute('class', 'cl-ach-list-details-wrap');
    label.setAttribute('class', 'cl-ach-list-details-label');
    // description.setAttribute('class', 'cl-ach-list-details-description');
    progressionWrapper.setAttribute('class', 'cl-ach-list-progression');
    progressionCont.setAttribute('class', 'cl-ach-list-progression-cont');
    progressionBar.setAttribute('class', 'cl-ach-list-progression-bar');
    progressionLabel.setAttribute('class', 'cl-ach-list-progression-label');
    actionsWrapper.setAttribute('class', 'cl-ach-list-actions');
    moreButton.setAttribute('class', 'cl-ach-list-more');
    enterButton.setAttribute('class', 'cl-ach-list-enter');
    leaveButton.setAttribute('class', 'cl-ach-list-leave');
    progressionButton.setAttribute('class', 'cl-ach-list-in-progress');

    moreButton.dataset.id = ach.id;
    moreButton.innerHTML = _this.settings.lbWidget.settings.translation.achievements.more;
    moreButton.href = 'javascript:void(0);';

    enterButton.dataset.id = ach.id;
    enterButton.innerHTML = _this.settings.lbWidget.settings.translation.achievements.listEnterBtn;
    enterButton.href = 'javascript:void(0);';

    leaveButton.dataset.id = ach.id;
    leaveButton.innerHTML = _this.settings.lbWidget.settings.translation.achievements.listLeaveBtn;
    leaveButton.href = 'javascript:void(0);';

    progressionButton.dataset.id = ach.id;
    progressionButton.innerHTML = _this.settings.lbWidget.settings.translation.achievements.listProgressionBtn;
    progressionButton.href = 'javascript:void(0);';

    listItem.dataset.id = ach.id;

    label.innerHTML = ach.name;

    // detailsWrapper.appendChild(description);

    // if (cpomntainsImage) {
    //   var image = new Image();
    //   var imageIconWrapper = document.createElement('div');
    //   imageIconWrapper.setAttribute('class', 'cl-ach-list-item-img-wrapper');
    //   image.setAttribute('class', 'cl-ach-list-item-img');
    //
    //   image.src = _this.settings.lbWidget.settings.uri.gatewayDomain + _this.settings.lbWidget.settings.uri.assets.replace(':attachmentId', ach.icon);
    //   image.alt = ach.name;
    //
    //   imageIconWrapper.appendChild(image);
    //   detailsContainer.appendChild(imageIconWrapper);
    // }

    detailsContainer.appendChild(icon);

    detailsContainer.appendChild(detailsWrapper);

    progressionCont.appendChild(progressionBar);
    progressionWrapper.appendChild(progressionCont);

    // TODO: remove
    progressionLabel.innerHTML = '0/100';
    progressionWrapper.appendChild(progressionLabel);

    detailsWrapper.appendChild(label);
    detailsWrapper.appendChild(progressionWrapper);

    actionsWrapper.appendChild(moreButton);

    if (Array.isArray(ach.constraints) && ach.constraints.includes('optinRequiredForEntrants')) {
      if (ach.optInStatus && ach.optInStatus >= 15 && ach.optInStatus <= 35) {
        actionsWrapper.appendChild(leaveButton);
      } else if (!isNaN(ach.optInStatus) && (ach.optInStatus === 10 || ach.optInStatus === 0)) {
        actionsWrapper.appendChild(progressionButton);
      } else {
        actionsWrapper.appendChild(enterButton);
      }
      addClass(listItem, 'cl-ach-list-item--notentered');
    }

    listItem.appendChild(detailsContainer);
    listItem.appendChild(actionsWrapper);

    return listItem;
  };

  this.achievementListLayout = function (pageNumber, achievementData) {
    const _this = this;
    const achList = query(_this.settings.section, '.' + _this.settings.lbWidget.settings.navigation.achievements.containerClass + ' .cl-main-widget-ach-list-body-res');
    const totalCount = _this.settings.lbWidget.settings.achievements.totalCount;
    const itemsPerPage = _this.settings.lbWidget.settings.itemsPerPage;
    let paginator = query(achList, '.paginator');

    achList.innerHTML = '';

    if (!paginator && totalCount > itemsPerPage) {
      const pagesCount = Math.ceil(totalCount / 6);
      paginator = document.createElement('div');
      paginator.setAttribute('class', 'paginator');

      let page = '';

      for (let i = 0; i < pagesCount; i++) {
        page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
      }
      paginator.innerHTML = page;
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
    const image = query(_this.settings.achievement.detailsContainer, '.cl-main-widget-ach-details-body-image-cont');

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
        optIn.parentNode.style.display = 'block';
      } else if (
        memberAchievementOptInStatus.length &&
        (memberAchievementOptInStatus[0].statusCode === 10 || memberAchievementOptInStatus[0].statusCode === 0)
      ) {
        optIn.innerHTML = _this.settings.lbWidget.settings.translation.achievements.listProgressionBtn;
        removeClass(optIn, 'cl-disabled');
        addClass(optIn, 'leave-achievement');
        optIn.parentNode.style.display = 'block';
      } else {
        optIn.innerHTML = _this.settings.lbWidget.settings.translation.achievements.enter;
        removeClass(optIn, 'cl-disabled');
        optIn.parentNode.style.display = 'block';
      }
    } else {
      addClass(optIn, 'cl-disabled');
      optIn.parentNode.style.display = 'none';
    }

    label.innerHTML = data.name;
    body.innerHTML = data.description;

    if (_this.settings.lbWidget.settings.achievements.extractImageHeader) {
      var imageLookup = query(body, 'img');
      objectIterator(imageLookup, function (img, key, count) {
        if (count === 0) {
          var newImg = img.cloneNode(true);
          image.appendChild(newImg);

          remove(img);
        }
      });
    }

    _this.settings.achievement.detailsContainer.style.display = 'block';
    setTimeout(function () {
      addClass(_this.settings.achievement.detailsContainer, 'cl-show');

      if (typeof callback === 'function') callback();
    }, 50);
  };

  this.hideAchievementDetails = function (callback) {
    var _this = this;

    removeClass(_this.settings.achievement.detailsContainer, 'cl-show');
    setTimeout(function () {
      _this.settings.achievement.detailsContainer.style.display = 'none';

      if (typeof callback === 'function') callback();
    }, 200);
  };

  this.loadRewardDetails = function (data, callback) {
    var _this = this;
    var label = query(_this.settings.reward.detailsContainer, '.cl-main-widget-reward-details-header-label');
    var body = query(_this.settings.reward.detailsContainer, '.cl-main-widget-reward-details-description');
    var image = query(_this.settings.reward.detailsContainer, '.cl-main-widget-reward-details-body-image-cont');
    var iconWrapp = query(_this.settings.reward.detailsContainer, '.cl-main-widget-reward-winnings-icon');
    var claimBtn = query(_this.settings.reward.detailsContainer, '.cl-main-widget-reward-claim-btn');
    var icon = query(_this.settings.reward.detailsContainer, '.cl-main-widget-reward-winnings-icon');
    var value = query(_this.settings.reward.detailsContainer, '.cl-main-widget-reward-winnings-value');

    label.innerHTML = data.name;
    body.innerHTML = data.description;
    value.innerHTML = _this.settings.lbWidget.settings.partialFunctions.awardFormatter(data);
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

      var _image = new Image();
      // var imageIconWrapper = document.createElement('div');
      // imageIconWrapper.setAttribute('class', 'cl-reward-list-item-img-wrapper');
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
        var newImg = img.cloneNode(true);
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
    if (!mission.data || !mission.data.name) {
      if (typeof callback === 'function') callback();
      return;
    }

    label.innerHTML = mission.data.name;
    body.innerHTML = mission.data.description;

    _this.settings.missions.detailsContainer.style.display = 'block';
    setTimeout(function () {
      addClass(_this.settings.missions.detailsContainer, 'cl-show');

      if (typeof callback === 'function') callback();
    }, 50);

    const graphContainer = document.getElementById('graph-container');
    graphContainer.style.display = 'none';
  };

  this.loadMissionDetailsGraph = function () {
    const container = document.getElementById('graph-container');

    if (container.style.display === 'block') {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    container.innerHTML = '';

    const graph = new Graph();
    this.settings.missions.mission.graph.nodes.forEach((n) => {
      let color = '#2F0426';
      if (n.entityId === this.settings.missions.mission.data.id) {
        color = '#2F0426';
      }
      graph.addNode(n.entityId, { size: 20, label: n.name, color: color });
    });

    const MUST_NOT_COLOR = '#e74a39';
    const SHOULD_COLOR = '#f48f3b';
    const MUST_COLOR = '#3bb54c';

    this.settings.missions.mission.graph.graphs[0].edges.forEach(e => {
      if (e.graphEdgeType !== 'ROOT') {
        let color = 'black';
        switch (e.graphEdgeType) {
          case 'MUST NOT':
            color = MUST_NOT_COLOR;
            break;
          case 'SHOULD':
            color = SHOULD_COLOR;
            break;
          case 'MUST':
            color = MUST_COLOR;
            break;
        }
        graph.addEdge(
          e.headEntityId,
          e.tailEntityId,
          { weight: 1, type: 'arrow', label: e.graphEdgeType, size: 5, color: color, labelColor: 'red' }
        );
      }
    });

    circular.assign(graph);
    rotation.assign(graph, 10);

    const settings = {
      linLogMode: false,
      outboundAttractionDistribution: false,
      adjustSizes: false,
      edgeWeightInfluence: 1,
      scalingRatio: 10,
      strongGravityMode: true,
      gravity: 1,
      slowDown: 3.7,
      barnesHutOptimize: false,
      barnesHutTheta: 0.5
    };

    forceAtlas2.assign(graph, { settings, iterations: 600 });

    // eslint-disable-next-line
    const renderer = new Sigma(graph, container, {
      renderLabels: true,
      renderEdgeLabels: true,
      enableEdgeWheelEvents: false,
      allowInvalidContainer: true,
      minCameraRatio: null, // 1.3
      maxCameraRatio: null, // 1.3
      labelFont: 'Gotham',
      labelColor: { color: '#fff' },
      edgeLabelFont: 'Gotham',
      edgeLabelWeight: 'bold'
    });
  };

  this.hideRewardDetails = function (callback) {
    var _this = this;

    removeClass(_this.settings.reward.detailsContainer, 'cl-show');
    setTimeout(function () {
      _this.settings.reward.detailsContainer.style.display = 'none';

      if (typeof callback === 'function') callback();
    }, 200);
  };

  this.hideMessageDetails = function (callback) {
    var _this = this;

    removeClass(_this.settings.messages.detailsContainer, 'cl-show');
    setTimeout(function () {
      _this.settings.messages.detailsContainer.style.display = 'none';

      if (typeof callback === 'function') callback();
    }, 200);
  };

  this.hideMissionDetails = function (callback) {
    const _this = this;

    removeClass(_this.settings.missions.detailsContainer, 'cl-show');
    setTimeout(function () {
      _this.settings.missions.detailsContainer.style.display = 'none';

      if (typeof callback === 'function') callback();
    }, 200);
  };

  this.updateAchievementProgressionAndIssued = function (issued, progression) {
    const _this = this;
    const achList = query(_this.settings.section, '.' + _this.settings.lbWidget.settings.navigation.achievements.containerClass + ' .cl-main-widget-ach-list-body-res');

    objectIterator(query(achList, '.cl-ach-list-item'), function (ach) {
      var id = ach.dataset.id;
      var issuedStatus = (issued.findIndex(i => i.entityId === id) !== -1);

      var perc = 0;
      mapObject(progression, function (pr) {
        if (pr.entityId === id) {
          perc = parseInt(pr.percentageComplete);
        }
      });

      if (ach !== null) {
        var bar = query(ach, '.cl-ach-list-progression-bar');
        const barLabel = query(ach, '.cl-ach-list-progression-label');

        if (issuedStatus) {
          addClass(bar, 'cl-ach-complete');
          barLabel.innerHTML = '100/100';
          bar.style.width = '100%';
        } else {
          var percValue = ((perc > 1 || perc === 0) ? perc : 1) + '%';
          barLabel.innerHTML = perc + '/100';
          bar.style.width = percValue;
        }
      }
    });
  };

  this.loadAchievements = function (pageNumber, callback) {
    const _this = this;

    _this.settings.lbWidget.checkForAvailableAchievements(pageNumber, function (achievementData) {
      // _this.settings.lbWidget.updateAchievementNavigationCounts();
      _this.achievementListLayout(pageNumber, achievementData);

      const idList = _this.settings.lbWidget.settings.achievements.list.map(a => a.id);

      _this.settings.lbWidget.checkForMemberAchievementsProgression(idList, function (issued, progression) {
        _this.updateAchievementProgressionAndIssued(issued, progression);
      });

      if (typeof callback === 'function') {
        callback();
      }
    });
  };

  this.rewardItem = function (rew) {
    const listItem = document.createElement('div');
    const detailsContainer = document.createElement('div');
    const detailsWrapper = document.createElement('div');
    const expires = document.createElement('div');
    const icon = document.createElement('div');
    const label = document.createElement('div');
    const type = document.createElement('div');
    const prize = document.createElement('div');
    const claimBtn = document.createElement('div');

    listItem.setAttribute('class', 'cl-rew-list-item cl-rew-' + rew.id);
    detailsContainer.setAttribute('class', 'cl-rew-list-details-cont');
    detailsWrapper.setAttribute('class', 'cl-rew-list-details-wrap');
    label.setAttribute('class', 'cl-rew-list-details-label');
    expires.setAttribute('class', 'cl-rew-list-details-expires');
    icon.setAttribute('class', 'cl-rew-list-details-icon');
    type.setAttribute('class', 'cl-rew-list-details-type');
    prize.setAttribute('class', 'cl-rew-list-details-prize');
    claimBtn.setAttribute('class', 'cl-rew-list-details-claim');

    listItem.dataset.id = rew.id;

    const labelText = stripHtml(rew.name);
    label.innerHTML = (labelText.length > 80) ? (labelText.substr(0, 80) + '...') : labelText;
    claimBtn.innerHTML = this.settings.lbWidget.settings.translation.rewards.claim;
    type.innerHTML = rew.rewardType.key;
    prize.innerHTML = rew.rewardValue;

    detailsWrapper.appendChild(expires);
    detailsWrapper.appendChild(icon);
    detailsWrapper.appendChild(label);
    detailsWrapper.appendChild(type);
    detailsWrapper.appendChild(prize);
    if (!rew.claimed) {
      detailsWrapper.appendChild(claimBtn);
    }
    detailsContainer.appendChild(detailsWrapper);
    listItem.appendChild(detailsContainer);

    return listItem;
  };

  this.messageItem = function (inbox) {
    // var _this = this;
    const listItem = document.createElement('div');
    const detailsContainer = document.createElement('div');
    const detailsWrapper = document.createElement('div');
    const label = document.createElement('div');
    const description = document.createElement('div');
    const date = document.createElement('div');
    const content = stripHtml(inbox.body);

    listItem.setAttribute('class', 'cl-inbox-list-item cl-inbox-' + inbox.id);
    detailsContainer.setAttribute('class', 'cl-inbox-list-details-cont');
    detailsWrapper.setAttribute('class', 'cl-inbox-list-details-wrap');
    label.setAttribute('class', 'cl-inbox-list-details-label');
    description.setAttribute('class', 'cl-inbox-list-details-description');
    date.setAttribute('class', 'cl-inbox-list-details-date');

    listItem.dataset.id = inbox.id;
    label.innerHTML = (inbox.subject.length > 36) ? inbox.subject.substr(0, 36) + '...' : inbox.subject;
    description.innerHTML = (content.length > 60) ? content.substr(0, 60) + '...' : content;
    date.innerHTML = (new Date(inbox.created)).toLocaleString('en-GB', { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'short' });

    detailsWrapper.appendChild(label);
    detailsWrapper.appendChild(description);
    detailsContainer.appendChild(detailsWrapper);
    detailsContainer.appendChild(date);
    listItem.appendChild(detailsContainer);

    return listItem;
  };

  this.missionsItem = function (mission) {
    const listItem = document.createElement('div');
    const detailsContainer = document.createElement('div');
    const detailsWrapper = document.createElement('div');
    const image = document.createElement('div');
    const date = document.createElement('div');
    const label = document.createElement('div');
    const progress = document.createElement('div');
    const progressCont = document.createElement('div');
    const progressBar = document.createElement('div');
    const progressLabel = document.createElement('div');
    const actions = document.createElement('div');
    const actionsReward = document.createElement('div');
    const actionsBtn = document.createElement('div');

    listItem.setAttribute('class', 'cl-missions-list-item cl-mission-' + mission.id);
    detailsContainer.setAttribute('class', 'cl-missions-list-details-cont');
    detailsWrapper.setAttribute('class', 'cl-missions-list-details-wrap');
    image.setAttribute('class', 'cl-missions-list-details-img');
    date.setAttribute('class', 'cl-missions-list-details-date');
    label.setAttribute('class', 'cl-missions-list-details-label');
    progress.setAttribute('class', 'cl-missions-list-details-progress');
    progressCont.setAttribute('class', 'cl-missions-list-details-progress-cont');
    progressBar.setAttribute('class', 'cl-missions-list-details-progress-bar');
    progressLabel.setAttribute('class', 'cl-missions-list-details-progress-label');
    actions.setAttribute('class', 'cl-missions-list-details-actions');
    actionsReward.setAttribute('class', 'cl-missions-list-details-actions-reward');
    actionsBtn.setAttribute('class', 'cl-missions-list-details-actions-btn');

    listItem.dataset.id = mission.id;
    label.innerHTML = (mission.name.length > 36) ? mission.name.substr(0, 36) + '...' : mission.name;

    progressLabel.innerHTML = '0/100';

    progressCont.appendChild(progressBar);
    progressCont.appendChild(progressBar);
    progress.appendChild(progressCont);
    progress.appendChild(progressLabel);

    actionsBtn.innerHTML = this.settings.lbWidget.settings.translation.missions.btn;

    actions.appendChild(actionsReward);
    actions.appendChild(actionsBtn);

    image.appendChild(date);
    detailsWrapper.appendChild(image);
    detailsWrapper.appendChild(label);
    detailsWrapper.appendChild(progress);
    detailsWrapper.appendChild(actions);
    detailsContainer.appendChild(detailsWrapper);
    listItem.appendChild(detailsContainer);

    return listItem;
  };

  this.tournamentItem = function (tournament) {
    // var _this = this;
    const listItem = document.createElement('div');
    const detailsContainer = document.createElement('div');
    // const detailsWrapper = document.createElement('div');
    const label = document.createElement('div');
    const labelIcon = document.createElement('div');
    const period = document.createElement('div');

    let startDate = new Date(tournament.actualStartDate ?? tournament.scheduledStartDate);
    let endDate = new Date(tournament.actualEndDate ?? tournament.scheduledEndDate);
    startDate = startDate.toLocaleString('en-GB', { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'short' });
    endDate = endDate.toLocaleString('en-GB', { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'short' });

    // var description = document.createElement('div');
    // var descriptionContent = stripHtml(tournament.description);

    listItem.setAttribute('class', 'cl-tour-list-item cl-tour-' + tournament.id);
    detailsContainer.setAttribute('class', 'cl-tour-list-details-cont');
    // detailsWrapper.setAttribute('class', 'cl-tour-list-details-wrap');
    label.setAttribute('class', 'cl-tour-list-details-label');
    labelIcon.setAttribute('class', 'cl-tour-list-details-label-icon');
    period.setAttribute('class', 'cl-tour-list-details-period');
    // description.setAttribute('class', 'cl-tour-list-details-description');

    listItem.dataset.id = tournament.id;
    label.innerHTML = tournament.name ?? '';
    period.innerHTML = startDate + ' - ' + endDate;
    /// description.innerHTML = (descriptionContent.length > 100) ? descriptionContent.substr(0, 100) + '...' : descriptionContent;

    // detailsWrapper.appendChild(label);
    // detailsWrapper.appendChild(period);
    // detailsWrapper.appendChild(description);
    detailsContainer.appendChild(labelIcon);
    detailsContainer.appendChild(label);
    detailsContainer.appendChild(period);
    listItem.appendChild(detailsContainer);

    return listItem;
  };

  this.rewardsListLayout = function (pageNumber = 1, claimedPageNumber = 1, rewards, availableRewards, expiredRewards) {
    const _this = this;
    const rewardList = query(_this.settings.section, '.' + _this.settings.lbWidget.settings.navigation.rewards.containerClass + ' .cl-main-widget-reward-list-body-res');
    const totalCount = _this.settings.lbWidget.settings.awards.totalCount;
    const claimedTotalCount = _this.settings.lbWidget.settings.awards.claimedTotalCount;
    const itemsPerPage = 6;
    let paginator = query(rewardList, '.paginator-available');

    if (!paginator && totalCount > itemsPerPage) {
      const pagesCount = Math.ceil(totalCount / itemsPerPage);
      paginator = document.createElement('div');
      paginator.setAttribute('class', 'paginator-available');
      addClass(paginator, 'paginator');
      addClass(paginator, 'accordion');

      let page = '';

      for (let i = 0; i < pagesCount; i++) {
        page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
      }
      paginator.innerHTML = page;
    }

    let paginatorClaimed = query(rewardList, '.paginator-claimed');
    if (!paginatorClaimed && claimedTotalCount > itemsPerPage) {
      const pagesCount = Math.ceil(claimedTotalCount / itemsPerPage);
      paginatorClaimed = document.createElement('div');
      paginatorClaimed.setAttribute('class', 'paginator-claimed');
      addClass(paginatorClaimed, 'paginator');
      addClass(paginatorClaimed, 'accordion');

      let page = '';

      for (let i = 0; i < pagesCount; i++) {
        page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
      }
      paginatorClaimed.innerHTML = page;
    }

    if (claimedPageNumber > 1) {
      _this.settings.rewardsSection.accordionLayout.map(t => {
        if (t.type === 'claimedAwards') {
          t.show = true;
        } else {
          t.show = false;
        }
      });
    } else {
      _this.settings.rewardsSection.accordionLayout.map(t => {
        if (t.type === 'availableAwards') {
          t.show = true;
        } else {
          t.show = false;
        }
      });
    }

    const accordionObj = _this.awardsList(_this.settings.rewardsSection.accordionLayout, function (accordionSection, listContainer, topEntryContainer, layout, paginator) {
      const rewardData = _this.settings.lbWidget.settings.awards[layout.type];

      if (typeof rewardData !== 'undefined') {
        if (rewardData.length === 0) {
          accordionSection.style.display = 'none';
        }
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
  };

  this.messagesListLayout = function (pageNumber) {
    const _this = this;
    const messageList = query(_this.settings.section, '.' + _this.settings.lbWidget.settings.navigation.inbox.containerClass + ' .cl-main-widget-inbox-list-body-res');
    const totalCount = _this.settings.lbWidget.settings.messages.totalCount;
    const itemsPerPage = 9;
    let paginator = query(messageList, '.paginator');

    if (!paginator && totalCount > itemsPerPage) {
      const pagesCount = Math.ceil(totalCount / itemsPerPage);
      paginator = document.createElement('div');
      paginator.setAttribute('class', 'paginator');

      let page = '';

      for (let i = 0; i < pagesCount; i++) {
        page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
      }
      paginator.innerHTML = page;
    }

    messageList.innerHTML = '';

    mapObject(_this.settings.lbWidget.settings.messages.messages, function (inboxItem, key, count) {
      var listItem = _this.messageItem(inboxItem);
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

  this.missionsListLayout = function (pageNumber) {
    const _this = this;
    const missionsList = query(_this.settings.section, '.' + _this.settings.lbWidget.settings.navigation.missions.containerClass + ' .cl-main-widget-missions-list-body-res');
    const totalCount = _this.settings.lbWidget.settings.missions.totalCount;
    const itemsPerPage = 15;
    let paginator = query(missionsList, '.paginator');

    if (!paginator && totalCount > itemsPerPage) {
      const pagesCount = Math.ceil(totalCount / itemsPerPage);
      paginator = document.createElement('div');
      paginator.setAttribute('class', 'paginator');

      let page = '';

      for (let i = 0; i < pagesCount; i++) {
        page += '<span class="paginator-item" data-page=' + (i + 1) + '\>' + (i + 1) + '</span>';
      }
      paginator.innerHTML = page;
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
  };

  this.loadAwards = function (callback, pageNumber, claimedPageNumber) {
    const _this = this;
    _this.settings.lbWidget.checkForAvailableAwards(
      function (rewards, availableRewards, expiredRewards) {
        // _this.settings.lbWidget.updateRewardsNavigationCounts();
        _this.rewardsListLayout(pageNumber, claimedPageNumber, rewards, availableRewards, expiredRewards);

        if (typeof callback === 'function') {
          callback();
        }
      },
      pageNumber,
      claimedPageNumber
    );
  };

  this.loadMessages = function (pageNumber, callback) {
    var _this = this;

    _this.settings.lbWidget.checkForAvailableMessages(pageNumber, function () {
      _this.messagesListLayout(pageNumber);
      // _this.settings.lbWidget.updateMessagesNavigationCounts();

      if (typeof callback === 'function') {
        callback();
      }
    });
  };

  this.loadMissions = function (pageNumber, callback) {
    const _this = this;

    _this.settings.lbWidget.checkForAvailableMissions(pageNumber, function () {
      _this.missionsListLayout(pageNumber);
      // _this.settings.lbWidget.updateMissionsNavigationCounts();

      if (typeof callback === 'function') {
        callback();
      }
    });
  };

  var changeInterval;
  var changeContainerInterval;
  this.navigationSwitch = function (target, callback) {
    var _this = this;
    var preLoader = _this.preloader();

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

          objectIterator(query(_this.settings.container, '.cl-main-widget-navigation-items .cl-active-nav'), function (obj) {
            removeClass(obj, 'cl-active-nav');
          });

          objectIterator(query(_this.settings.container, '.cl-main-widget-section-container .cl-main-active-section'), function (obj) {
            removeClass(obj, 'cl-main-active-section');
            obj.style.display = 'none';
          });

          changeContainerInterval = setTimeout(function () {
            if (hasClass(target, 'cl-main-widget-navigation-lb-icon')) {
              _this.settings.lbWidget.checkForAvailableRewards(1);
              _this.loadLeaderboard(function () {
                var lbContainer = query(_this.settings.container, '.cl-main-widget-section-container .' + _this.settings.lbWidget.settings.navigation.tournaments.containerClass);

                lbContainer.style.display = 'block';
                changeInterval = setTimeout(function () {
                  addClass(lbContainer, 'cl-main-active-section');
                }, 30);

                if (typeof callback === 'function') {
                  callback();
                }

                preLoader.hide();

                _this.settings.navigationSwitchInProgress = false;
              });
            } else if (hasClass(target, 'cl-main-widget-navigation-ach-icon')) {
              _this.loadAchievements(1, function () {
                var achContainer = query(_this.settings.container, '.cl-main-widget-section-container .' + _this.settings.lbWidget.settings.navigation.achievements.containerClass);

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
            } else if (hasClass(target, 'cl-main-widget-navigation-rewards-icon')) {
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
                1
              );
            } else if (hasClass(target, 'cl-main-widget-navigation-inbox-icon')) {
              _this.loadMessages(1, function () {
                var inboxContainer = query(_this.settings.container, '.cl-main-widget-section-container .' + _this.settings.lbWidget.settings.navigation.inbox.containerClass);

                inboxContainer.style.display = 'flex';
                changeInterval = setTimeout(function () {
                  addClass(inboxContainer, 'cl-main-active-section');
                }, 30);

                preLoader.hide();

                _this.settings.navigationSwitchInProgress = false;
              });
            } else if (hasClass(target, 'cl-main-widget-navigation-missions-icon')) {
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

          addClass(target.parentNode, 'cl-active-nav');
        });
      } else if (typeof callback === 'function') {
        _this.settings.navigationSwitchInProgress = false;
        callback();
      }
    }
  };

  this.resetNavigation = function (callback) {
    var _this = this;
    const listIcon = query(_this.settings.container, '.cl-main-widget-lb-header-list-icon');
    const backIcon = query(_this.settings.container, '.cl-main-widget-lb-header-back-icon');

    objectIterator(query(_this.settings.container, '.cl-main-widget-navigation-items .cl-active-nav'), function (obj) {
      removeClass(obj, 'cl-active-nav');
    });

    objectIterator(query(_this.settings.container, '.cl-main-widget-section-container .cl-main-active-section'), function (obj) {
      obj.style.display = 'none';
      removeClass(obj, 'cl-main-active-section');
    });

    var activeNave = false;
    objectIterator(query(_this.settings.container, '.cl-main-widget-navigation-container .cl-main-widget-navigation-item'), function (navItem, key, count) {
      if (!activeNave && !hasClass(navItem, 'cl-hidden-navigation-item')) {
        _this.navigationSwitch(query(navItem, '.cl-main-navigation-item'));
        activeNave = true;
      }
    });

    listIcon.style.display = 'block';
    backIcon.style.display = 'none';
    _this.hideEmbeddedCompetitionDetailsContent();
    _this.hideCompetitionList();

    setTimeout(function () {
      if (typeof callback !== 'undefined') callback();
    }, 70);
  };

  this.initLayout = function (callback) {
    var _this = this;

    _this.settings.active = true;

    _this.loadLeaderboard();

    _this.settings.container.style.display = 'block';
    _this.settings.overlayContainer.style.display = 'block';
    setTimeout(function () {
      addClass(_this.settings.container, 'cl-show');

      var member = query(_this.settings.leaderboard.list, '.cl-lb-member-row');
      if (member !== null) {
        _this.missingMember(_this.isElementVisibleInView(member, _this.settings.leaderboard.list.parentNode));
        _this.missingMember(_this.isElementVisibleInView(member, _this.settings.leaderboard.resultContainer));
      } else {
        _this.missingMemberReset();
      }

      _this.resetNavigation(callback);
    }, 30);
  };
};
