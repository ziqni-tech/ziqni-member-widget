const translation = require(`../../../i18n/translation_${process.env.LANG}.json`);

export const defaultSettings = {
  debug: false,
  isStaging: false,
  bindContainer: document.body,
  autoStart: true,
  notifications: null,
  miniScoreBoard: null,
  canvasAnimation: null,
  enableNotifications: false,
  hideEmptyTabs: false,
  defaultLightTheme: false,
  showAchievementsFilter: true,
  mainWidget: null,
  language: process.env.LANG,
  currency: '',
  spaceName: '',
  memberId: '',
  memberRefId: '',
  apiClientStomp: null,
  authToken: null,
  memberNameLength: 0,
  groups: '',
  gameId: '',
  enforceGameLookup: false, // tournament lookup will include/exclude game only requests
  apiKey: '',
  memberToken: '',
  expires: 36000000,
  member: null,
  itemsPerPage: 10,
  timeZone: 'UTC',
  productIds: [],
  layout: {
    logoUrl: '',
    showThemeSwitcher: true,
    enableMiniScoreBoardDragging: true, // enable/disable dragging with mouse/touch
    miniScoreBoardPosition: { // default position of mini scoreboard left/right/bottom/top (Example: top: '20px')
      left: null,
      right: null,
      top: null,
      bottom: null
    },
    allowOrientationChange: true, // allows the switch between horizontal/vertical orientation
    miniScoreBoardOrientation: 'horizontal' // vertical/horizontal => default is horizontal
  },
  historicalData: {
    finalisedCompetitions: 30,
    messagesForTheLast: 30
  },
  competition: {
    activeCompetitionId: null,
    activeContestId: null,
    activeCompetition: null,
    contests: null,
    activeContest: null,
    refreshInterval: null,
    refreshIntervalMillis: 1000000,
    allowNegativeCountdown: false, // false: will mark competition as finishing, true: will continue to countdown into negative
    includeMetadata: false,
    extractImageHeader: true // will extract the first found image inside the body tag and move it on top
  },
  achievements: {
    activeAchievementId: null,
    limit: 100,
    totalCount: 0,
    finishedTotalCount: 0,
    list: [],
    all: [],
    daily: [],
    weekly: [],
    monthly: [],
    finished: [],
    availableRewards: [],
    rewards: [],
    expiredRewards: [],
    extractImageHeader: true // will extract the first found image inside the body tag and move it on top
  },
  rewards: {
    availableRewards: [],
    rewards: [],
    totalCount: 0,
    expiredRewards: []
  },
  awards: {
    availableAwards: [],
    claimedAwards: [],
    expiredAwards: [],
    rewards: [],
    totalCount: 0,
    claimedTotalCount: 0,
    intervalId: null,
    showExpiredAwards: false
  },
  iconIntervalId: null,
  messages: {
    messages: [],
    totalCount: 0
  },
  missions: {
    missions: [],
    totalCount: 0
  },
  instantWins: {
    enable: false,
    showIWOnlyWithAvailPlays: true
  },
  tournaments: {
    showBannerTimer: true,
    showDashboardTime: true,
    showTournamentsMenuPrizeColumn: true,
    showTotalPrize: false,
    activeCompetitionId: null,
    readyCompetitions: [],
    activeCompetitions: [],
    finishedCompetitions: [],
    totalCount: 0,
    readyTotalCount: 0,
    finishedTotalCount: 0
  },
  leaderboard: {
    topResultSize: 3,
    defaultEmptyList: 20,
    fullLeaderboardSize: 100,
    refreshIntervalMillis: 1000000,
    refreshInterval: null,
    refreshLbDataInterval: null,
    leaderboardData: [],
    loadLeaderboardHistory: {},
    layoutSettings: {
      // tournamentList: true,
      imageBanner: true,
      // title: true,
      titleLinkToDetailsPage: false // if set to false will make the description available under title
    },
    miniScoreBoard: {
      enableRankings: true, // enabled rankings before after rankings of members [-2 YOU +2]
      rankingsCount: 2
    },
    pointsFormatter: function (points) {
      return points;
    }
  },
  navigation: { // primary navigation items, if all are disabled init will fail, if only 1 is enabled items will be hidden
    dashboard: {
      enable: true,
      showInstantWins: true,
      showAchievements: true,
      showTournaments: true,
      showAvailableAwards: false,
      showMissions: false,
      navigationClass: 'cl-main-widget-navigation-dashboard',
      navigationClassIcon: 'cl-main-widget-navigation-dashboard-icon',
      containerClass: 'cl-main-widget-section-dashboard',
      order: 1
    },
    tournaments: {
      enable: true,
      showFinishedTournaments: true,
      navigationClass: 'cl-main-widget-navigation-lb',
      navigationClassIcon: 'cl-main-widget-navigation-lb-icon',
      containerClass: 'cl-main-widget-lb',
      order: 2
    },
    achievements: {
      enable: true,
      showReadyAchievements: false,
      navigationClass: 'cl-main-widget-navigation-ach',
      navigationClassIcon: 'cl-main-widget-navigation-ach-icon',
      containerClass: 'cl-main-widget-section-ach',
      order: 3
    },
    rewards: {
      enable: true,
      navigationClass: 'cl-main-widget-navigation-rewards',
      navigationClassIcon: 'cl-main-widget-navigation-rewards-icon',
      containerClass: 'cl-main-widget-section-reward',
      order: 4
    },
    inbox: {
      enable: true,
      navigationClass: 'cl-main-widget-navigation-inbox',
      navigationClassIcon: 'cl-main-widget-navigation-inbox-icon',
      containerClass: 'cl-main-widget-section-inbox',
      order: 5
    },
    missions: {
      enable: true,
      navigationClass: 'cl-main-widget-navigation-missions',
      navigationClassIcon: 'cl-main-widget-navigation-missions-icon',
      containerClass: 'cl-main-widget-section-missions',
      order: 6
    }
  },
  apiWs: {
    achievementsApiWsClient: null,
    leaderboardApiWsClient: null,
    competitionsApiWsClient: null,
    contestsApiWsClient: null,
    membersApiWsClient: null,
    optInApiWsClient: null,
    rewardsApiWsClient: null,
    awardsApiWsClient: null,
    messagesApiWsClient: null,
    missionsApiWsClient: null,
    filesApiWsClient: null,
    instantWinsApiWsClient: null
  },
  uri: {
    assets: '/assets/attachments/:attachmentId',
    memberSSE: '/api/v1/:space/sse/reference/:id',
    memberSSEHeartbeat: '/api/v1/:space/sse/reference/:id/heartbeat',
    achievementsProgression: '/api/v1/:space/members/reference/:id/achievements',
    memberRewardClaim: '/api/v1/:space/members/reference/:id/award/:awardId/award',
    memberCompetitionOptIn: '/api/v1/:space/members/reference/:id/competition/:competitionId/optin',
    memberCompetitionOptInCheck: '/api/v1/:space/members/reference/:id/competition/:competitionId/optin-check',
    translationPath: '' // ../i18n/translation_:language.json
  },
  loadCustomTranslations: true,
  showCopyright: true,
  translation: translation,
  resources: [], // Example: ["http://example.com/style.css", "http://example.com/my-fonts.css"]
  styles: null, // Example: {widgetBgColor: '#1f294a', widgetIcon: 'url(../../../examples/images/logo-icon-3.png)'}
  partialFunctions: {
    startupCallback: function (instance) { },
    rewardFormatter: function (reward) {
      const rewardValue = reward.rewardValue;
      const formattedValue = Number(Number(rewardValue).toFixed(2));

      return reward.rewardType?.uomSymbol
        ? reward.rewardType.uomSymbol + formattedValue
        : formattedValue;
    },
    competitionDataAvailableResponseParser: function (competitionData, callback) { callback(competitionData); },
    competitionDataFinishedResponseParser: function (competitionData, callback) { callback(competitionData); },
    activeCompetitionDataResponseParser: function (competitionData, callback) { callback(competitionData); },
    activeContestDataResponseParser: function (contestData, callback) { callback(contestData); },
    leaderboardDataResponseParser: function (leaderboardData, callback) { callback(leaderboardData); },
    achievementDataForAllResponseParser: function (achievementData, callback) { callback(achievementData); },
    achievementDataForMemberGroupResponseParser: function (achievementData, callback) { callback(achievementData); },
    achievementDataResponseParser: function (achievementData, callback) { callback(achievementData); },
    rewardDataResponseParser: function (rewardData, callback) { callback(rewardData); },
    messageDataResponseParser: function (messageData, callback) { callback(messageData); },
    claimRewardDataResponseParser: function (claimRewardData, callback) { callback(claimRewardData); },
    issuedAchievementsDataResponseParser: function (issuedAchievementsData, callback) { callback(issuedAchievementsData); },
    memberAchievementsProgressionDataResponseParser: function (memberAchievementsProgressionData, callback) { callback(memberAchievementsProgressionData); },
    claimedRewardsDataResponseParser: function (claimedRewardsData, callback) { callback(claimedRewardsData); },
    notClaimedRewardsDataResponseParser: function (notClaimedRewardsData, callback) { callback(notClaimedRewardsData); },
    expiredRewardsDataResponseParser: function (expiredRewardsData, callback) { callback(expiredRewardsData); },
    availableMessagesDataResponseParser: function (availableMessagesData, callback) { callback(availableMessagesData); }
  },
  callbacks: {
    onMainWidgetOpen: function () { },
    onMainWidgetClose: function () { },
    onContestStatusChanged: function (contestId, currentState, previousState) { },
    onCompetitionStatusChanged: function (competitionId, currentState, previousState) { },
    onStompError: function () { },
    onLeaderboardUpdates: function (leaderboardData) { }
  },
  callback: null
};
