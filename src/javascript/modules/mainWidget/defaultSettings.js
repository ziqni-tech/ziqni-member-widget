export const defaultSettings = {
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
  achievementsSection: {
    accordionLayout: [
      {
        label: 'All',
        type: 'all',
        show: true,
        showTopResults: 1
      },
      {
        label: 'Daily',
        type: 'daily',
        show: false,
        showTopResults: 1
      },
      {
        label: 'Weekly',
        type: 'weekly',
        show: false,
        showTopResults: 1
      },
      {
        label: 'Monthly',
        type: 'monthly',
        show: false,
        showTopResults: 1
      },
      {
        label: 'Finished',
        type: 'finishedAchievements',
        show: false,
        showTopResults: 1
      }
    ]
  },
  instantWinsSection: {
    receivedAward: null
  },
  active: false,
  navigationSwitchLastAtempt: new Date().getTime(),
  navigationSwitchInProgress: false
};
