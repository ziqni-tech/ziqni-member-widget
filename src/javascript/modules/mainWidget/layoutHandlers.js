import addClass from '../../utils/addClass';

export function leaderboardAreaLayout(widget) {
  const sectionLB = document.createElement('div');
  sectionLB.setAttribute('class', widget.settings.lbWidget.settings.navigation.tournaments.containerClass + ' cl-main-section-item cl-main-active-section');

  const template = require('../../templates/mainWidget/leaderboard.hbs');
  sectionLB.innerHTML = template({
    tournamentsLabel: widget.settings.lbWidget.settings.translation.tournaments.label,
    descriptionLabel: widget.settings.lbWidget.settings.translation.global.descriptionLabel,
    tAndCLabel: widget.settings.lbWidget.settings.translation.global.tAndCLabel,
    enterLabel: widget.settings.lbWidget.settings.translation.tournaments.enter,
    gotolbLabel: widget.settings.lbWidget.settings.translation.tournaments.goToLbLabel,
    globalCopy: widget.settings.lbWidget.settings.translation.global.copy,
    monthsFull: widget.settings.lbWidget.settings.translation.time.monthsFull,
    daysFull: widget.settings.lbWidget.settings.translation.time.daysFull,
    hoursFull: widget.settings.lbWidget.settings.translation.time.hoursFull,
    minutesFull: widget.settings.lbWidget.settings.translation.time.minutesFull,
    secondsFull: widget.settings.lbWidget.settings.translation.time.secondsFull,
    isBannerTimer: widget.settings.lbWidget.settings.tournaments.showBannerTimer
  });

  return sectionLB;
}

export function achievementsAreaLayout(widget) {
  const sectionACH = document.createElement('div');
  sectionACH.setAttribute('class', widget.settings.lbWidget.settings.navigation.achievements.containerClass + ' cl-main-section-item');

  const template = require('../../templates/layouts/achievementsAreaLayout.hbs');
  sectionACH.innerHTML = template({
    leavePopupTitle: widget.settings.lbWidget.settings.translation.achievements.leavePopupTitle,
    leavePopupDescription: widget.settings.lbWidget.settings.translation.achievements.leavePopupDescription,
    leavePopupActionConfirm: widget.settings.lbWidget.settings.translation.achievements.leavePopupConfirm,
    leavePopupActionCancel: widget.settings.lbWidget.settings.translation.achievements.leavePopupClose,
    descriptionLabel: widget.settings.lbWidget.settings.translation.global.descriptionLabel,
    tAndCLabel: widget.settings.lbWidget.settings.translation.global.tAndCLabel,
    progressLabel: widget.settings.lbWidget.settings.translation.achievements.progress,
    headerLabel: widget.settings.lbWidget.settings.translation.achievements.label,
    globalCopy: widget.settings.lbWidget.settings.translation.global.copy,
    enterLabel: widget.settings.lbWidget.settings.translation.achievements.enter
  });

  return sectionACH;
}

export function rewardsAreaLayout(widget) {
  const sectionRewards = document.createElement('div');
  sectionRewards.setAttribute('class', widget.settings.lbWidget.settings.navigation.rewards.containerClass + ' cl-main-section-item');

  const template = require('../../templates/layouts/awardsAreaLayout.hbs');
  sectionRewards.innerHTML = template({
    headerLabel: widget.settings.lbWidget.settings.translation.rewards.label,
    headerInstantWinsLabel: widget.settings.lbWidget.settings.translation.rewards.instantWinsLabel,
    globalCopy: widget.settings.lbWidget.settings.translation.global.copy,
    claimBtn: widget.settings.lbWidget.settings.translation.rewards.claim
  });

  return sectionRewards;
}

export function inboxAreaLayout(widget) {
  const sectionInbox = document.createElement('div');
  sectionInbox.setAttribute('class', widget.settings.lbWidget.settings.navigation.inbox.containerClass + ' cl-main-section-item');

  const template = require('../../templates/layouts/inboxAreaLayout.hbs');
  sectionInbox.innerHTML = template({
    headerLabel: widget.settings.lbWidget.settings.translation.messages.label,
    globalCopy: widget.settings.lbWidget.settings.translation.global.copy
  });

  return sectionInbox;
}

export function missionsAreaLayout(widget) {
  const sectionMissions = document.createElement('div');
  sectionMissions.setAttribute('class', widget.settings.lbWidget.settings.navigation.missions.containerClass + ' cl-main-section-item');

  const template = require('../../templates/layouts/missionsAreaLayout.hbs');
  sectionMissions.innerHTML = template({
    headerLabel: widget.settings.lbWidget.settings.translation.missions.label,
    globalCopy: widget.settings.lbWidget.settings.translation.global.copy,
    descriptionLabel: widget.settings.lbWidget.settings.translation.global.descriptionLabel,
    tAndCLabel: widget.settings.lbWidget.settings.translation.global.tAndCLabel,
    prizeLabel: widget.settings.lbWidget.settings.translation.missions.prizeLabel + ':',
    mapHeaderLabel: widget.settings.lbWidget.settings.translation.missions.mapLabel
  });

  return sectionMissions;
}

export function dashboardAreaLayout(widget) {
  const sectionDashboard = document.createElement('div');
  sectionDashboard.setAttribute('class', widget.settings.lbWidget.settings.navigation.dashboard.containerClass + ' cl-main-section-item');

  const template = require('../../templates/layouts/dashboardAreaLayout.hbs');
  sectionDashboard.innerHTML = template({
    isAwards: widget.settings.lbWidget.settings.navigation.rewards.enable,
    isInstantWins: widget.settings.lbWidget.settings.instantWins.enable,
    isAchievements: widget.settings.lbWidget.settings.navigation.achievements.enable,
    isTournaments: widget.settings.lbWidget.settings.navigation.tournaments.enable,
    isMissions: widget.settings.lbWidget.settings.navigation.missions.enable,
    seeAllLabel: widget.settings.lbWidget.settings.translation.dashboard.seeAll,
    headerLabel: widget.settings.lbWidget.settings.translation.dashboard.label,
    tournamentsTitle: widget.settings.lbWidget.settings.translation.dashboard.tournamentsTitle,
    achievementsTitle: widget.settings.lbWidget.settings.translation.dashboard.achievementsTitle,
    instantWinsTitle: widget.settings.lbWidget.settings.translation.dashboard.instantWinsTitle,
    leavePopupTitle: widget.settings.lbWidget.settings.translation.achievements.leavePopupTitle,
    leavePopupDescription: widget.settings.lbWidget.settings.translation.achievements.leavePopupDescription,
    leavePopupActionConfirm: widget.settings.lbWidget.settings.translation.achievements.leavePopupConfirm,
    leavePopupActionCancel: widget.settings.lbWidget.settings.translation.achievements.leavePopupClose,
    instantWinsWheelTitle: widget.settings.lbWidget.settings.translation.dashboard.singleWheelTitle,
    instantWinsWheelButton: widget.settings.lbWidget.settings.translation.dashboard.singleWheelButton,
    instantWinsCardsTitle: widget.settings.lbWidget.settings.translation.dashboard.scratchcardsTitle,
    instantWinsCardsButton: widget.settings.lbWidget.settings.translation.dashboard.scratchcardsButton
  });

  return sectionDashboard;
}

export function leaderboardHeader(widget) {
  addClass(widget.settings.leaderboard.header, 'cl-reward-enabled');

  const rewardEnabled = typeof widget.settings.lbWidget.settings.competition.activeContest !== 'undefined' &&
        widget.settings.lbWidget.settings.competition.activeContest !== null &&
        typeof widget.settings.lbWidget.settings.competition.activeContest.rewards !== 'undefined' &&
        widget.settings.lbWidget.settings.competition.activeContest.rewards.length > 0;

  const template = require('../../templates/mainWidget/leaderboardHeader.hbs');
  widget.settings.leaderboard.header.innerHTML = template({
    rewardEnabled: rewardEnabled,
    rankColLabel: widget.settings.lbWidget.settings.translation.leaderboard.rank,
    nameColLabel: widget.settings.lbWidget.settings.translation.leaderboard.name,
    pointsColLabel: widget.settings.lbWidget.settings.translation.leaderboard.points,
    rewardColLabel: widget.settings.lbWidget.settings.translation.leaderboard.prize
  });
}
