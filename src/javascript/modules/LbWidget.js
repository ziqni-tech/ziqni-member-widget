import 'regenerator-runtime/runtime';
import cssVars from 'css-vars-ponyfill';

import mergeObjects from '../utils/mergeObjects';
import mapObject from '../utils/mapObject';
import stringContains from '../utils/stringContains';
import objectIterator from '../utils/objectIterator';
import query from '../utils/query';
import hasClass from '../utils/hasClass';
import addClass from '../utils/addClass';
import removeClass from '../utils/removeClass';
import closest from '../utils/closest';
import isMobileTablet from '../utils/isMobileTablet';
import camelToKebabCase from '../utils/camelToKebabCase';
import pagination from '../utils/paginator';
import { ITEMS_PER_PAGE } from './mainWidget/constants';
import { defaultSettings } from './lbWidget/defaultSettings';
import { getCompetitions, getContests, fetchCompetitionsSummary, fetchDashboardCompetitions } from './lbWidget/services/competitionService';
import { getAchievements, fetchMissionsSummary, fetchDashboardMissions } from './lbWidget/services/achievementService';
import { attachReward, getRewards } from './lbWidget/services/rewardService';
import { getAwards, getAwardsByIds, claimAward, fetchAwardsSummary } from './lbWidget/services/awardService';
import { getSingleWheels, getSingleWheel, getInstantWinsAvailablePlays } from './lbWidget/services/instantWinService';
import { getMessages, getMessageById, updateMessageStatus } from './lbWidget/services/messageService';
import { getGraph } from './lbWidget/services/graphService';
import { getMember } from './lbWidget/services/memberService';
import { getFiles } from './lbWidget/services/fileService';
import { getActiveEntitiesCount } from './lbWidget/services/statsService';
import { subscribeToLeaderboard } from './lbWidget/services/leaderboardService';
import { manageOptIn, getOptInStatus } from './lbWidget/services/optInService';
import { animateIcon as animateNavIcon } from './lbWidget/ui/iconAnimation';

import competitionStatusMap from '../helpers/competitionStatuses';

import { Notifications } from './Notifications';
import { MiniScoreBoard } from './MiniScoreBoard';
import { MainWidget } from './MainWidget';

import { ApiClientStomp } from '@ziqni-tech/member-api-client';
import cloneDeep from 'lodash.clonedeep';

/**
 * Main leaderboard widget, controls all actions and initiation logic.
 * Main responsibility is to control the interactions between different widgets/plugins and user even actions
 * @param options {Object} setting parameters used to overwrite the default settings
 * @constructor
 */
export const LbWidget = function (options) {
  this.apiClientStomp = null;

  this.settings = defaultSettings;

  if (typeof options !== 'undefined') {
    this.settings = mergeObjects(this.settings, options);
  }

  // alias references to modules
  this.Notifications = Notifications;
  this.MiniScoreBoard = MiniScoreBoard;
  this.MainWidget = MainWidget;

  this.log = function (message) {
    if (this.settings.debug) {
      console.error(message);
    }
  };

  this.getDashboardMissions = async () => {
    return await fetchDashboardMissions({
      apiClient: this.apiClientStomp,
      language: this.settings.language,
      currencyKey: this.settings.currency,
      limit: 2
    });
  };

  this.getDashboardAwards = async function () {
    const awards = await getAwards({
      apiClient: this.apiClientStomp,
      language: this.settings.language,
      currencyKey: this.settings.currency,
      moreThan: 14,
      lessThan: 16,
      skip: 0,
      limit: 2
    });
    let awardsData = awards.data;

    const rewardIds = awardsData.map(c => c.rewardId);
    if (rewardIds.length) {
      const rewards = await getRewards({
        apiClient: this.apiClientStomp,
        language: this.settings.language,
        currencyKey: this.settings.currency,
        entityType: 'Reward',
        entityIds: rewardIds,
        skip: 0,
        limit: 20
      });
      const rewardsData = rewards.data;

      awardsData = awardsData.map(award => {
        const idx = rewardsData.findIndex(r => r.id === award.rewardId);
        if (idx !== -1) {
          award.rewardData = rewardsData[idx];
        }

        return award;
      });
    }

    return awardsData;
  };

  this.getDashboardCompetitions = async function () {
    const result = await fetchDashboardCompetitions({
      apiClient: this.apiClientStomp,
      language: this.settings.language,
      currencyKey: this.settings.currency,
      productIds: this.settings.productIds,
      limit: 2
    });

    return {
      activeCompetitions: result.activeCompetitions,
      readyCompetitions: result.readyCompetitions
    };
  };

  this.checkForAvailableCompetitions = async function (
    callback,
    readyPageNumber = 1,
    activePageNumber = 1,
    finishedPageNumber = 1
  ) {
    const result = await fetchCompetitionsSummary({
      apiClient: this.apiClientStomp,
      language: this.settings.language,
      currencyKey: this.settings.currency,
      productIds: this.settings.productIds,
      showFinishedTournaments: this.settings.navigation.tournaments.showFinishedTournaments,
      finalisedCompetitionsDays: this.settings.historicalData.finalisedCompetitions ?? 30,
      readyPageNumber,
      activePageNumber,
      finishedPageNumber
    });

    this.settings.tournaments.readyCompetitions = result.readyCompetitions;
    this.settings.tournaments.readyTotalCount = result.readyTotalCount;
    this.settings.tournaments.activeCompetitions = result.activeCompetitions;
    this.settings.tournaments.totalCount = result.activeTotalCount;
    this.settings.tournaments.finishedCompetitions = result.finishedCompetitions;
    this.settings.tournaments.finishedTotalCount = result.finishedTotalCount;

    if (typeof callback === 'function') {
      callback();
    }
  };

  this.getActiveEntitiesByProduct = async (modelCountRequest) => {
    if (!this.apiClientStomp) {
      await this.initApiClientStomp();
    }
    return await getActiveEntitiesCount(this.apiClientStomp, modelCountRequest);
  };

  this.getCompetitionsByProducts = async (productIds, statusCode = 'active') => {
    if (!this.apiClientStomp) {
      await this.initApiClientStomp();
    }

    return await getCompetitions({
      apiClient: this.apiClientStomp,
      language: this.settings.language,
      status: statusCode,
      productIds: productIds,
      limit: 20,
      skip: 0
    });
  };

  this.prepareActiveCompetition = async function (callback) {
    const _this = this;
    let activeCompetition = null;
    let activeCompetitionId = null;

    if (_this.settings.tournaments.activeCompetitionId !== null) {
      mapObject(_this.settings.tournaments.activeCompetitions, function (comp) {
        if (comp.id === _this.settings.tournaments.activeCompetitionId) {
          activeCompetition = comp;
        }
      });
      mapObject(_this.settings.tournaments.readyCompetitions, function (comp) {
        if (comp.id === _this.settings.tournaments.activeCompetitionId) {
          activeCompetition = comp;
        }
      });
      mapObject(_this.settings.tournaments.finishedCompetitions, function (comp) {
        if (comp.id === _this.settings.tournaments.activeCompetitionId) {
          activeCompetition = comp;
        }
      });

      if (activeCompetition !== null) {
        activeCompetitionId = _this.settings.tournaments.activeCompetitionId;
      } else {
        _this.settings.tournaments.activeCompetitionId = null;
      }
    }

    if (activeCompetition === null && _this.settings.tournaments.activeCompetitions.length > 0) {
      activeCompetition = _this.settings.tournaments.activeCompetitions[0];
      activeCompetitionId = activeCompetition.id;
    } else if (activeCompetition === null && _this.settings.tournaments.readyCompetitions.length > 0) {
      activeCompetition = _this.settings.tournaments.readyCompetitions[0];
      activeCompetitionId = activeCompetition.id;
    }

    if (activeCompetitionId === null) { // no active or ready competitions found
      _this.deactivateCompetitionsAndLeaderboards();
    } else {
      if (_this.settings.competition.activeCompetitionId !== activeCompetitionId) {
        if (_this.settings.competition.activeContestId) {
          this.settings.leaderboard.leaderboardData = [];
          subscribeToLeaderboard({
            apiClient: _this.apiClientStomp,
            entityId: _this.settings.competition.activeContestId,
            action: 'Unsubscribe',
            leaderboardFilter: {}
          }).then((json) => { });
        }
        _this.settings.competition.activeCompetition = activeCompetition;
        _this.settings.competition.activeCompetitionId = activeCompetitionId;
      }
      _this.loadActiveCompetition(async function (json) {
        await _this.setActiveCompetition(json, callback);
      });
    }
  };

  this.loadActiveCompetition = function (callback) {
    const availableCompetitions = [
      ...this.settings.tournaments.activeCompetitions,
      ...this.settings.tournaments.readyCompetitions,
      ...this.settings.tournaments.finishedCompetitions
    ];

    const competition = availableCompetitions.filter(c => {
      return c.id === this.settings.competition.activeCompetitionId;
    });

    this.settings.partialFunctions.activeCompetitionDataResponseParser(competition, function (compData) {
      if (typeof callback === 'function') {
        callback(compData);
      }
    });
  };

  this.setActiveCompetition = async function (json, callback) {
    const _this = this;
    this.settings.competition.activeCompetition = json[0];
    this.settings.tournaments.activeCompetitionId = json[0].id;
    this.settings.competition.activeContest = null;
    this.settings.competition.contests = null;
    this.settings.competition.activeContestId = null;

    const optInStatus = await this.getCompetitionOptInStatus(
      this.settings.competition.activeCompetition.id
    );

    this.settings.competition.activeCompetition.optInStatus = optInStatus;

    if (optInStatus.length && optInStatus[0].statusCode >= 15 && optInStatus[0].statusCode <= 35) {
      this.settings.competition.activeCompetition.optin = true;
    }

    const contests = await getContests({
      apiClient: this.apiClientStomp,
      language: this.settings.language,
      competitionIds: [json[0].id],
      limit: 20,
      skip: 0,
      sortBy: [35, 45].includes(json[0].statusCode) ? [{ queryField: 'scheduledEndDate', order: 'Desc' }] : [],
      constraints: ['hasOptInStatus']
    });

    if (contests.length) {
      this.settings.competition.contests = contests;
      if (json[0].statusCode === 15) {
        contests.forEach(contest => {
          if (contest.statusCode === 15) {
            this.settings.competition.activeContest = contest;
            this.settings.competition.activeContestId = contest.id;

            if (typeof this.settings.competition.activeContest.rewards === 'undefined') {
              this.settings.competition.activeContest.rewards = [];
            }
          }
        });
      } else {
        const activeContests = contests.filter(c => c.statusCode === 25);
        if (activeContests.length) {
          this.settings.competition.activeContest = activeContests[0];
          this.settings.competition.activeContestId = activeContests[0].id;
          if (typeof this.settings.competition.activeContest.rewards === 'undefined') {
            this.settings.competition.activeContest.rewards = [];
          }
        }

        contests.forEach(contest => {
          if (contest.statusCode < 50 && contest.statusCode > 20 && this.settings.competition.activeContest === null) {
            this.settings.competition.activeContest = contest;
            this.settings.competition.activeContestId = contest.id;

            if (typeof this.settings.competition.activeContest.rewards === 'undefined') {
              this.settings.competition.activeContest.rewards = [];
            }
          }
        });
      }

      if (this.settings.competition.activeContestId) {
        let ranksAboveToInclude = 0;
        let ranksBelowToInclude = 0;
        const count = (this.settings.miniScoreBoard.settings.active) ? 0 : this.settings.leaderboard.fullLeaderboardSize;

        if (this.settings.leaderboard.miniScoreBoard.enableRankings) {
          ranksAboveToInclude = this.settings.leaderboard.miniScoreBoard.rankingsCount;
          ranksBelowToInclude = this.settings.leaderboard.miniScoreBoard.rankingsCount;
        }

        subscribeToLeaderboard({
          apiClient: this.apiClientStomp,
          entityId: this.settings.competition.activeContestId,
          action: 'Subscribe',
          leaderboardFilter: {
            topRanksToInclude: count,
            ranksAboveToInclude: ranksAboveToInclude,
            ranksBelowToInclude: ranksBelowToInclude
          }
        }).then((data) => {
          if (data && data.leaderboardEntries) {
            _this.settings.leaderboard.leaderboardData = data.leaderboardEntries;
            _this.settings.callbacks.onLeaderboardUpdates(data);
          }
        });
      }
    }

    if (typeof callback === 'function') {
      callback();
    }
    this.settings.mainWidget.leaderboardDetailsUpdate();
  };

  this.getLeaderboardData = async function (count, callback) {
    const _this = this;
    if (this.settings.competition.activeContestId !== null) {
      let ranksAboveToInclude = 0;
      let ranksBelowToInclude = 0;

      if (this.settings.leaderboard.miniScoreBoard.enableRankings) {
        ranksAboveToInclude = this.settings.leaderboard.miniScoreBoard.rankingsCount;
        ranksBelowToInclude = this.settings.leaderboard.miniScoreBoard.rankingsCount;
      }

      const readyIdx = this.settings.tournaments.readyCompetitions.findIndex(r => r.id === this.settings.competition.activeCompetition.id);

      if (readyIdx !== -1) {
        this.settings.leaderboard.leaderboardData = [];
        callback();
      } else {
        subscribeToLeaderboard({
          apiClient: this.apiClientStomp,
          entityId: this.settings.competition.activeContestId,
          action: 'Subscribe',
          leaderboardFilter: {
            topRanksToInclude: count,
            ranksAboveToInclude: ranksAboveToInclude,
            ranksBelowToInclude: ranksBelowToInclude
          }
        })
          .then(data => {
            let leaderboardEntries = [];
            if (data && data.leaderboardEntries) {
              leaderboardEntries = data.leaderboardEntries;
            }
            _this.settings.leaderboard.leaderboardData = leaderboardEntries;
            this.settings.partialFunctions.leaderboardDataResponseParser(leaderboardEntries, function (lbData) {
              _this.settings.leaderboard.leaderboardData = lbData;
            });
            _this.settings.callbacks.onLeaderboardUpdates(data);
            callback(_this.settings.leaderboard.leaderboardData);
          })
          .catch(error => {
            this.log(error);
          });
      }
    } else if (this.settings.competition.activeCompetition.statusCode === 35 || this.settings.competition.activeCompetition.statusCode === 45) {
      subscribeToLeaderboard({
        apiClient: this.apiClientStomp,
        entityId: this.settings.competition.activeCompetition.id,
        action: 'Subscribe',
        leaderboardFilter: {
          topRanksToInclude: count,
          ranksAboveToInclude: this.settings.leaderboard.miniScoreBoard.rankingsCount,
          ranksBelowToInclude: this.settings.leaderboard.miniScoreBoard.rankingsCount
        }
      })
        .then(data => {
          let leaderboardEntries = [];
          if (data && data.leaderboardEntries) {
            leaderboardEntries = data.leaderboardEntries;
          }
          _this.settings.leaderboard.leaderboardData = leaderboardEntries;
          this.settings.partialFunctions.leaderboardDataResponseParser(leaderboardEntries, function (lbData) {
            _this.settings.leaderboard.leaderboardData = lbData;
          });
          _this.settings.callbacks.onLeaderboardUpdates(data);
          callback(_this.settings.leaderboard.leaderboardData);
        })
        .catch(error => {
          this.log(error);
        });
    } else {
      this.settings.leaderboard.leaderboardData = [];
      callback();
    }
  };

  this.checkForAvailableAchievements = async function (pageNumber, callback, current = 'all') {
    const _this = this;

    const allPageNumber = current === 'all' ? pageNumber : 1;
    const finishedPageNumber = current === 'finished' ? pageNumber : 1;
    const dailyPageNumber = current === 'daily' ? pageNumber : 1;
    const weeklyPageNumber = current === 'weekly' ? pageNumber : 1;
    const monthlyPageNumber = current === 'monthly' ? pageNumber : 1;

    const moreValue = this.settings.navigation.achievements.showReadyAchievements ? 10 : 20;

    const finishedDateFilter = new Date();
    finishedDateFilter.setDate(finishedDateFilter.getDate() - 30);

    const json = await getAchievements({
      apiClient: this.apiClientStomp,
      language: this.settings.language,
      productIds: Array.isArray(this.settings.productIds) ? this.settings.productIds : [],
      moreThan: moreValue,
      lessThan: 30,
      skip: (allPageNumber - 1) * 6,
      limit: 6,
      constraints: ['withoutMissions']
    });
    _this.settings.achievements.list = json.data;
    _this.settings.achievements.totalCount = json.meta.totalRecordsFound || 0;

    const optInAchievements = json.data.filter(a => a.constraints && a.constraints.includes('optinRequiredForEntrants'));
    let optInIds = [];
    if (optInAchievements.length) {
      optInIds = optInAchievements.map(a => {
        if (a.constraints && a.constraints.includes('optinRequiredForEntrants')) {
          return a.id;
        }
      });
    }

    if (optInIds.length) {
      const statuses = await _this.getMemberAchievementsOptInStatuses(optInIds);
      if (statuses.length) {
        statuses.forEach(s => {
          const idx = _this.settings.achievements.list.findIndex(a => a.id === s.entityId);
          if (idx !== -1) {
            _this.settings.achievements.list[idx].optInStatus = s.statusCode;
          }
        });
      }
    }

    if (_this.settings.achievements.list.length) {
      const ids = _this.settings.achievements.list.map(a => a.id);

      _this.settings.achievements.list = await attachReward({
        apiClient: this.apiClientStomp,
        language: this.settings.language,
        entityArray: _this.settings.achievements.list,
        currencyKey: this.settings.currency,
        entityType: 'Achievement',
        entityIds: ids,
        skip: 0,
        limit: 20
      });
    }

    if (this.settings.showAchievementsFilter) {
      const dailyRequest = {
        apiClient: this.apiClientStomp,
        language: this.settings.language,
        productIds: Array.isArray(this.settings.productIds) ? this.settings.productIds : [],
        moreThan: moreValue,
        lessThan: 30,
        scheduleTypes: ['Daily'],
        skip: (dailyPageNumber - 1) * 6,
        limit: 6,
        constraints: ['withoutMissions']
      };

      const weeklyRequest = cloneDeep(dailyRequest);
      weeklyRequest.scheduleTypes = ['Weekly'];
      weeklyRequest.skip = (weeklyPageNumber - 1) * 6;

      const monthlyRequest = cloneDeep(dailyRequest);
      monthlyRequest.scheduleTypes = ['Monthly'];
      monthlyRequest.skip = (monthlyPageNumber - 1) * 6;

      const dailyJson = await getAchievements(dailyRequest);
      this.settings.achievements.daily = dailyJson.data;

      const optInDailyAchievements = dailyJson.data.filter(a => a.constraints && a.constraints.includes('optinRequiredForEntrants'));
      let optInDailyIds = [];

      if (optInDailyAchievements.length) {
        optInDailyIds = optInDailyAchievements.map(a => {
          if (a.constraints && a.constraints.includes('optinRequiredForEntrants')) {
            return a.id;
          }
        });
      }

      if (optInDailyIds.length) {
        const statusesDaily = await _this.getMemberAchievementsOptInStatuses(optInDailyIds);
        if (statusesDaily.length) {
          statusesDaily.forEach(s => {
            const idx = this.settings.achievements.daily.findIndex(a => a.id === s.entityId);
            if (idx !== -1) {
              _this.settings.achievements.daily[idx].optInStatus = s.statusCode;
            }
          });
        }
      }

      if (_this.settings.achievements.daily.length) {
        const ids = _this.settings.achievements.daily.map(a => a.id);

        _this.settings.achievements.daily = await attachReward({
          apiClient: this.apiClientStomp,
          language: this.settings.language,
          entityArray: _this.settings.achievements.daily,
          currencyKey: this.settings.currency,
          entityType: 'Achievement',
          entityIds: ids,
          skip: 0,
          limit: 20
        });
      }

      const weeklyJson = await getAchievements(weeklyRequest);
      this.settings.achievements.weekly = weeklyJson.data;

      const optInWeeklyAchievements = weeklyJson.data.filter(a => a.constraints && a.constraints.includes('optinRequiredForEntrants'));
      let optInWeeklyIds = [];

      if (optInWeeklyAchievements.length) {
        optInWeeklyIds = optInWeeklyAchievements.map(a => {
          if (a.constraints && a.constraints.includes('optinRequiredForEntrants')) {
            return a.id;
          }
        });
      }

      if (optInWeeklyIds.length) {
        const statuses = await _this.getMemberAchievementsOptInStatuses(optInWeeklyIds);
        if (statuses.length) {
          statuses.forEach(s => {
            const idx = this.settings.achievements.weekly.findIndex(a => a.id === s.entityId);
            if (idx !== -1) {
              _this.settings.achievements.weekly[idx].optInStatus = s.statusCode;
            }
          });
        }
      }

      if (_this.settings.achievements.weekly.length) {
        const ids = _this.settings.achievements.weekly.map(a => a.id);

        _this.settings.achievements.weekly = await attachReward({
          apiClient: this.apiClientStomp,
          language: this.settings.language,
          entityArray: _this.settings.achievements.weekly,
          currencyKey: this.settings.currency,
          entityType: 'Achievement',
          entityIds: ids,
          skip: 0,
          limit: 20
        });
      }

      const monthlyJson = await getAchievements(monthlyRequest);
      this.settings.achievements.monthly = monthlyJson.data;

      const optInMonthlyAchievements = monthlyJson.data.filter(a => a.constraints && a.constraints.includes('optinRequiredForEntrants'));
      let optInMonthlyIds = [];

      if (optInMonthlyAchievements.length) {
        optInMonthlyIds = optInMonthlyAchievements.map(a => {
          if (a.constraints && a.constraints.includes('optinRequiredForEntrants')) {
            return a.id;
          }
        });
      }

      if (optInMonthlyIds.length) {
        const statuses = await _this.getMemberAchievementsOptInStatuses(optInWeeklyIds);
        if (statuses.length) {
          statuses.forEach(s => {
            const idx = this.settings.achievements.monthly.findIndex(a => a.id === s.entityId);
            if (idx !== -1) {
              _this.settings.achievements.monthly[idx].optInStatus = s.statusCode;
            }
          });
        }
      }

      if (_this.settings.achievements.monthly.length) {
        const ids = _this.settings.achievements.monthly.map(a => a.id);

        _this.settings.achievements.monthly = await attachReward({
          apiClient: this.apiClientStomp,
          language: this.settings.language,
          entityArray: _this.settings.achievements.monthly,
          currencyKey: this.settings.currency,
          entityType: 'Achievement',
          entityIds: ids,
          skip: 0,
          limit: 20
        });
      }

      const finishedJson = await getAchievements({
        apiClient: this.apiClientStomp,
        language: this.settings.language,
        productIds: Array.isArray(this.settings.productIds) ? this.settings.productIds : [],
        endDate: {
          before: (new Date()).toISOString(),
          after: finishedDateFilter.toISOString()
        },
        moreThan: 30,
        lessThan: 40,
        skip: (finishedPageNumber - 1) * 6,
        limit: 6,
        constraints: ['withoutMissions']
      });
      this.settings.achievements.finished = finishedJson.data;
      this.settings.achievements.finishedTotalCount = finishedJson.meta.totalRecordsFound || 0;

      if (_this.settings.achievements.finished.length) {
        const ids = _this.settings.achievements.finished.map(a => a.id);

        _this.settings.achievements.finished = await attachReward({
          apiClient: this.apiClientStomp,
          language: this.settings.language,
          entityArray: _this.settings.achievements.finished,
          currencyKey: this.settings.currency,
          entityType: 'Achievement',
          entityIds: ids,
          skip: 0,
          limit: 20
        });
      }
    }

    this.settings.achievements.all = this.settings.achievements.list;

    const achData = {
      list: this.settings.achievements.all,
      all: this.settings.achievements.all,
      daily: this.settings.achievements.daily,
      weekly: this.settings.achievements.weekly,
      monthly: this.settings.achievements.monthly,
      finishedAchievements: this.settings.achievements.finished
    };

    if (typeof callback === 'function') callback(achData);
  };

  this.getSingleWheel = async function (id) {
    const wheel = await getSingleWheel({
      apiClient: this.apiClientStomp,
      language: this.settings.language,
      currencyKey: this.settings.currency,
      id: id
    });

    return wheel.data;
  };

  this.getSingleWheels = async function (callback) {
    const singleWheels = await getSingleWheels({
      apiClient: this.apiClientStomp,
      language: this.settings.language,
      currencyKey: this.settings.currency,
      limit: 20,
      skip: 0
    });
    let singleWheelsData = singleWheels.data;

    // TODO: remove after InstantWinRequest update
    singleWheelsData = singleWheelsData.filter(s => s.statusCode === 25);

    if (this.settings.instantWins.showIWOnlyWithAvailPlays) {
      const ids = singleWheelsData.map(s => s.id);
      let availablePlays = await getInstantWinsAvailablePlays(this.apiClientStomp, ids);

      availablePlays = availablePlays.filter(a => a.remainingPlays > 0);
      const availablePlayIds = availablePlays.map(a => a.instantWinId);

      singleWheelsData = singleWheelsData.filter(s => availablePlayIds.includes(s.id));
    }

    if (typeof callback === 'function') {
      callback(singleWheelsData);
    }

    return singleWheelsData;
  };

  this.getSettingsFile = async function (fileName) {
    const filePath = `https://${this.settings.member.spaceName}.cdn.ziqni.com/system-resources/instant-wins/${fileName}`;

    return new Promise((resolve, reject) => {
      fetch(filePath)
        .then((data) => {
          return data.json();
        })
        .then((data) => {
          resolve(data);
        })
        .catch((err) => {
          console.log('instant win settings file err', err);
          reject(err);
        });
    });
  };

  this.getFileUri = async (id) => {
    const fileRequest = {
      ids: [id],
      limit: 1,
      skip: 0
    };

    const res = await getFiles(this.apiClientStomp, fileRequest);
    return res.data[0].uri;
  };

  this.getAchievement = function (achievementId, callback) {
    const achievementData = this.settings.achievements.list.filter(a => a.id === achievementId);

    if (typeof callback === 'function' && achievementData.length) {
      callback(achievementData[0]);
    }
  };

  this.leaveAchievement = function (activeAchievementId, isDashboard = false) {
    const _this = this;

    const preLoader = this.settings.mainWidget.preloader();
    preLoader.show(async function () {
      await manageOptIn({
        apiClient: _this.apiClientStomp,
        entityId: activeAchievementId,
        entityType: 'Achievement',
        action: 'leave'
      });

      setTimeout(function () {
        if (isDashboard) {
          _this.checkForAvailableAchievements(1, function (achievementData) {
            _this.settings.mainWidget.loadDashboardAchievements(achievementData.list, function () {
              preLoader.hide();
            });
          });
        } else {
          _this.settings.mainWidget.loadAchievements(1, function () {
            preLoader.hide();
          });
        }
      }, 2000);
    });
  };

  this.getAward = async function (awardId, callback) {
    let awardData = null;
    const awards = [...this.settings.awards.availableAwards, ...this.settings.awards.claimedAwards, ...this.settings.awards.expiredAwards];
    const idx = awards.findIndex(r => r.id === awardId);
    if (idx !== -1) {
      awardData = awards[idx];

      const reward = await getRewards({
        apiClient: this.apiClientStomp,
        language: this.settings.language,
        currencyKey: this.settings.currency,
        entityType: 'Reward',
        entityIds: [awardData.rewardId],
        skip: 0,
        limit: 1
      });

      if (reward.data && reward.data.length && reward.data[0].icon) {
        const file = await this.getFile(reward.data[0].icon);
        if (file && file.data && file.data.length && file.data[0].uri) {
          awardData.icon = file.data[0].uri;
        }
      }
    }

    if (typeof callback === 'function') {
      callback(awardData);
    }
  };

  this.getFile = async function (id) {
    const fileRequest = {
      ids: [id],
      limit: 1,
      skip: 0
    };

    return await getFiles(this.apiClientStomp, fileRequest);
  };

  this.getReward = function (rewardId, callback) {
    let rewardData = null;
    const idx = this.settings.rewards.rewards.findIndex(r => r.id === rewardId);
    if (idx !== -1) {
      rewardData = this.settings.rewards.rewards[idx];
    }

    if (typeof callback === 'function') {
      callback(rewardData);
    }
  };

  this.getMessage = async function (messageId, callback, isSys = false) {
    if (isSys) {
      const json = await getMessageById({
        apiClient: this.apiClientStomp,
        language: this.settings.language,
        messageId: messageId
      });

      if (json.data && json.data.length) {
        if (json.data[0].messageType === 'Notification') {
          if (this.settings.enableNotifications) {
            this.settings.notifications.addEvent({
              subject: json.data[0].subject,
              body: json.data[0].body,
              id: json.data[0].id
            });
          }
        }
        if (json.data[0].messageType === 'InboxItem') {
          this.checkForAvailableMessages(1, function () {
            if (typeof callback === 'function') {
              callback();
            }
          });
        }
      }
    } else {
      const json = await getMessageById({
        apiClient: this.apiClientStomp,
        language: this.settings.language,
        messageId: messageId
      });

      if (json.data.length) {
        if (typeof callback === 'function') {
          callback(json.data[0]);
        }
      } else {
        if (typeof callback === 'function') {
          callback(null);
        }
      }
    }
  };

  this.checkForMemberAchievementsProgression = async function (idList, callback) {
    const statuses = await this.getMemberAchievementsOptInStatuses(idList);
    const issued = [];
    const progression = [];

    statuses.forEach(s => {
      if (s.status === 'Completed') {
        issued.push(s);
      } else {
        progression.push(s);
      }
    });

    if (typeof callback === 'function') {
      callback(issued, progression);
    }
  };

  this.checkForAvailableAwards = async function (callback, pageNumber = 1, claimedPageNumber = 1) {
    const { claimed, available, expired } = await fetchAwardsSummary({
      apiClient: this.apiClientStomp,
      language: this.settings.language,
      currencyKey: this.settings.currency,
      availablePage: pageNumber,
      claimedPage: claimedPageNumber,
      expiredPage: claimedPageNumber, // або окремий параметр, якщо треба
      pageSize: 6,
      rewardsPageSize: 20
    });

    this.settings.awards.claimedAwards = claimed.awards;
    this.settings.awards.availableAwards = available.awards;
    this.settings.awards.expiredAwards = expired.awards;
    this.settings.awards.claimedTotalCount = claimed.totalCount;
    this.settings.awards.totalCount = available.totalCount;
    this.settings.awards.expiredTotalCount = expired.totalCount || 0;

    if (typeof callback === 'function') {
      callback(claimed.awards, available.awards, expired.awards);
    }
  };

  this.animateIcon = function (entity) {
    animateNavIcon({
      container: this.settings.mainWidget.settings.container,
      navigation: this.settings.navigation,
      entity,
      iconIntervalId: this.settings.iconIntervalId,
      setIconIntervalId: (id) => { this.settings.iconIntervalId = id; }
    });
  };

  this.checkForAvailableRewards = async function (pageNumber, callback) {
    this.settings.rewards.rewards = [];
    this.settings.rewards.availableRewards = [];
    this.settings.rewards.expiredRewards = [];
    this.settings.rewards.totalCount = 0;

    if (this.settings.competition.activeContestId) {
      const json = await getRewards({
        apiClient: this.apiClientStomp,
        language: this.settings.language,
        currencyKey: this.settings.currency,
        entityType: 'Contest',
        entityIds: [this.settings.competition.activeContestId],
        skip: 0,
        limit: 20
      });

      this.settings.rewards.rewards = json.data ?? [];
      this.settings.rewards.availableRewards = json.data ?? [];
      this.settings.rewards.expiredRewards = [];
      this.settings.rewards.totalCount = (json.meta && json.meta.totalRecordsFound) ? json.meta.totalRecordsFound : 0;
      if (this.settings.competition.activeContest && json.data) {
        this.settings.competition.activeContest.rewards = json.data;
      }
      if (typeof callback === 'function') {
        callback();
      }
    } else if (typeof callback === 'function') {
      callback(
        this.settings.rewards.rewards,
        this.settings.rewards.availableRewards,
        this.settings.rewards.expiredRewards
      );
    }
  };

  this.checkForAvailableMessages = async function (pageNumber, callback) {
    const createdDateFilter = new Date();
    createdDateFilter.setDate(createdDateFilter.getDate() - this.settings.historicalData.messagesForTheLast ?? 30);

    const json = await getMessages({
      apiClient: this.apiClientStomp,
      language: this.settings.language,
      messageType: 'InboxItem',
      status: ['New', 'Read'],
      after: createdDateFilter.toISOString(),
      skip: (pageNumber - 1) * 9,
      limit: 9
    });

    this.settings.messages.messages = json.data ?? [];
    this.settings.messages.totalCount = (json.meta && json.meta.totalRecordsFound) ? json.meta.totalRecordsFound : 0;
    if (typeof callback === 'function') {
      callback(this.settings.messages.messages);
    }
  };

  this.checkForAvailableMissions = async function (pageNumber, callback) {
    const result = await fetchMissionsSummary({
      apiClient: this.apiClientStomp,
      language: this.settings.language,
      currencyKey: this.settings.currency,
      pageNumber,
      itemsPerPage: 6
    });

    this.settings.missions.missions = result.missions;
    this.settings.missions.totalCount = result.totalCount;

    if (typeof callback === 'function') {
      callback(this.settings.missions.missions);
    }
  };

  this.getMission = async function (id, callback) {
    const json = await getAchievements({
      apiClient: this.apiClientStomp,
      language: this.settings.language,
      moreThan: 0,
      lessThan: 100,
      ids: [id],
      skip: 0,
      limit: 1
    });

    const mainData = json.data[0];

    const rewardRaw = await getRewards({
      apiClient: this.apiClientStomp,
      language: this.settings.language,
      currencyKey: this.settings.currency,
      entityType: 'Achievement',
      entityIds: [mainData.id],
      skip: 0,
      limit: 20
    });

    if (rewardRaw && rewardRaw.data && rewardRaw.data.length) {
      mainData.reward = rewardRaw.data[0];
    }

    const graphJson = await getGraph({
      apiClient: this.apiClientStomp,
      ids: [id],
      includes: ['iconLink', 'termsAndConditions', 'description']
    });

    if (typeof callback === 'function') {
      const data = {
        data: mainData,
        graph: graphJson.data
      };
      callback(data);
    }
  };

  this.getMissionListItemData = async (id) => {
    let mission = await getAchievements({
      apiClient: this.apiClientStomp,
      language: this.settings.language,
      moreThan: 0,
      lessThan: 100,
      ids: [id],
      skip: 0,
      limit: 1
    });
    mission = mission.data[0];
    mission.dependencies = [];

    const rewards = await getRewards({
      apiClient: this.apiClientStomp,
      language: this.settings.language,
      currencyKey: this.settings.currency,
      entityType: 'Achievement',
      entityIds: [id],
      skip: 0,
      limit: 20
    });
    mission.reward = rewards.data[0];

    const graphResponse = await getGraph({
      apiClient: this.apiClientStomp,
      ids: [id],
      includes: ['scheduling']
    });
    const graph = graphResponse.data;

    if (graph.graphs[0] && graph.graphs[0].edges && graph.graphs[0].edges.length) {
      const filtered = graph.graphs[0].edges.filter(edge => edge.graphEdgeType !== 'ROOT');

      for (const edge of filtered) {
        const idx = graph.nodes.findIndex(n => n.entityId === edge.tailEntityId);
        const achievement = graph.nodes[idx];

        const rewards = await getRewards({
          apiClient: this.apiClientStomp,
          language: this.settings.language,
          currencyKey: this.settings.currency,
          entityType: 'Achievement',
          entityIds: [edge.tailEntityId],
          skip: 0,
          limit: 5
        });
        const rewardsData = rewards.data;

        achievement.reward = rewardsData && rewardsData[0] ? rewardsData[0] : null;

        mission.dependencies.push({
          ordering: edge.ordering,
          achievement: achievement
        });
      }
    }

    return mission;
  };

  this.optInMemberToActiveCompetition = async function (callback) {
    await manageOptIn({
      apiClient: this.apiClientStomp,
      entityId: this.settings.competition.activeCompetition.id,
      entityType: 'Competition',
      action: 'join'
    });

    if (typeof callback === 'function') {
      callback();
    }

    this.settings.competition.activeCompetition.optInStatus = await this.getCompetitionOptInStatus(
      this.settings.competition.activeCompetition.id
    );
  };

  var revalidationCount = 0;
  this.revalidateIfSuccessfullOptIn = function (callback) {
    var _this = this;

    _this.loadActiveCompetition(function (competitionJson) {
      if (typeof competitionJson.data.optin === 'boolean' && !competitionJson.data.optin) {
        revalidationCount++;

        if (revalidationCount < 5) {
          setTimeout(function () {
            _this.revalidateIfSuccessfullOptIn(callback);
          }, 100);
        } else {
          revalidationCount = 0;
        }
      } else if (typeof competitionJson.data.optin === 'boolean' && competitionJson.data.optin) {
        callback(competitionJson);
      }
    });
  };

  this.leaderboardDataRefresh = async function () {
    var _this = this;

    if (_this.settings.leaderboard.refreshLbDataInterval) {
      clearTimeout(_this.settings.leaderboard.refreshLbDataInterval);
    }

    if (
      (
        _this.settings.competition.activeCompetition !== null &&
        (
          !_this.settings.competition.activeCompetition.constraints ||
          !_this.settings.competition.activeCompetition.constraints.includes('optinRequiredForEntrants')
        )
      ) ||
      (
        _this.settings.competition.activeCompetition !== null &&
        typeof _this.settings.competition.activeCompetition.optin === 'boolean' &&
        _this.settings.competition.activeCompetition.optin
      )
    ) {
      var count = (_this.settings.miniScoreBoard.settings.active) ? 0 : _this.settings.leaderboard.fullLeaderboardSize;
      _this.getLeaderboardData(count, function (data) {
        if (_this.settings.miniScoreBoard.settings.active) _this.settings.miniScoreBoard.loadScoreBoard();
        if (_this.settings.mainWidget.settings.active) _this.settings.mainWidget.loadLeaderboard(() => { }, false);
      });
    }

    _this.settings.leaderboard.refreshLbDataInterval = setTimeout(function () {
      _this.leaderboardDataRefresh();
    }, _this.settings.leaderboard.refreshIntervalMillis);
  };

  this.activeDataRefreshSimple = async function (callback) {
    const _this = this;
    await _this.prepareActiveCompetition(function () {
      // clear to not clash with LB refresh that could happen at same time
      if (_this.settings.leaderboard.refreshInterval) {
        clearTimeout(_this.settings.leaderboard.refreshInterval);
      }

      if (_this.settings.miniScoreBoard.settings.active || _this.settings.mainWidget.settings.active) {
        if (
          (_this.settings.competition.activeCompetition !== null && typeof _this.settings.competition.activeCompetition.optinRequired === 'boolean' && !_this.settings.competition.activeCompetition.optinRequired) ||
          (_this.settings.competition.activeCompetition !== null && typeof _this.settings.competition.activeCompetition.optin === 'boolean' && _this.settings.competition.activeCompetition.optin)
        ) {
          _this.leaderboardDataRefresh();

          if (typeof callback === 'function') {
            callback();
          }
        } else {
          if (_this.settings.miniScoreBoard.settings.active) {
            _this.settings.miniScoreBoard.loadScoreBoard();
          }
          if (_this.settings.mainWidget.settings.active) {
            _this.settings.mainWidget.loadLeaderboard(() => { }, true);
          }

          // restart leaderboard refresh
          _this.leaderboardDataRefresh();

          if (typeof callback === 'function') {
            callback();
          }
        }
      } else {
        if (_this.settings.miniScoreBoard.settings.active) _this.settings.miniScoreBoard.loadScoreBoard();

        if (typeof callback === 'function') {
          callback();
        }
      }
    });
  };

  this.activeDataRefresh = function (callback = null, isReloadTime = false) {
    var _this = this;

    if (_this.settings.competition.refreshInterval) {
      clearTimeout(_this.settings.competition.refreshInterval);
    }

    _this.checkForAvailableCompetitions(async function () {
      await _this.prepareActiveCompetition(function () {
        // clear to not clash with LB refresh that could happen at same time
        if (_this.settings.leaderboard.refreshInterval) {
          clearTimeout(_this.settings.leaderboard.refreshInterval);
        }

        if (_this.settings.miniScoreBoard.settings.active || _this.settings.mainWidget.settings.active) {
          if (
            (_this.settings.competition.activeCompetition !== null && typeof _this.settings.competition.activeCompetition.optinRequired === 'boolean' && !_this.settings.competition.activeCompetition.optinRequired) ||
            (_this.settings.competition.activeCompetition !== null && typeof _this.settings.competition.activeCompetition.optin === 'boolean' && _this.settings.competition.activeCompetition.optin)
          ) {
            _this.leaderboardDataRefresh();

            if (typeof callback === 'function') {
              callback();
            }
          } else {
            if (_this.settings.miniScoreBoard.settings.active) {
              _this.settings.miniScoreBoard.loadScoreBoard();
            }
            if (_this.settings.mainWidget.settings.active) {
              _this.settings.mainWidget.loadLeaderboard(() => { }, isReloadTime);
            }

            // restart leaderboard refresh
            _this.leaderboardDataRefresh();

            if (typeof callback === 'function') {
              callback();
            }
          }
        } else {
          if (_this.settings.miniScoreBoard.settings.active) _this.settings.miniScoreBoard.loadScoreBoard();

          if (typeof callback === 'function') {
            callback();
          }
        }
        _this.checkForAvailableRewards(1, function () {
          if (_this.settings.mainWidget.settings.active) {
            _this.settings.mainWidget.updateLeaderboard();
          }
        });
      });
    });

    _this.settings.competition.refreshInterval = setTimeout(function () {
      _this.activeDataRefresh();
    }, _this.settings.competition.refreshIntervalMillis);
  };

  this.deactivateCompetitionsAndLeaderboards = function (callback) {
    var _this = this;

    if (_this.settings.leaderboard.refreshInterval) {
      clearTimeout(_this.settings.leaderboard.refreshInterval);
    }

    if (_this.settings.miniScoreBoard) {
      _this.settings.miniScoreBoard.clearAll();
    }
    if (_this.settings.mainWidget) {
      _this.settings.mainWidget.clearAll();
    }

    if (typeof callback === 'function') {
      callback();
    }
  };

  this.stopActivity = function (callback) {
    var _this = this;

    if (_this.settings.leaderboard.refreshInterval) {
      clearTimeout(_this.settings.leaderboard.refreshInterval);
      clearInterval(_this.settings.leaderboard.refreshInterval);
    }

    if (_this.settings.competition.refreshInterval) {
      clearTimeout(_this.settings.competition.refreshInterval);
      clearInterval(_this.settings.competition.refreshInterval);
    }

    if (_this.settings.leaderboard.refreshLbDataInterval) {
      clearTimeout(_this.settings.leaderboard.refreshLbDataInterval);
      clearInterval(_this.settings.leaderboard.refreshLbDataInterval);
    }

    if (_this.settings.miniScoreBoard.settings.updateInterval) {
      clearTimeout(_this.settings.miniScoreBoard.settings.updateInterval);
      clearInterval(_this.settings.leaderboard.refreshInterval);
    }

    if (typeof callback === 'function') {
      callback();
    }
  };

  this.restartActivity = function (callback) {
    var _this = this;

    _this.settings.miniScoreBoard.updateScoreBoard();

    if (typeof callback === 'function') {
      callback();
    }
  };

  this.loadMember = async function (callback) {
    if (!this.apiClientStomp) {
      await this.initApiClientStomp();
    }

    const member = await getMember(this.apiClientStomp);
    this.settings.member = member.data;
    callback(member.data);
  };

  this.loadWidgetTranslations = function (callback) {
    const _this = this;

    if (typeof _this.settings.uri.translationPath === 'string' && _this.settings.uri.translationPath.length > 0 && _this.settings.loadCustomTranslations) {
      const url = (stringContains(_this.settings.uri.translationPath, 'http')) ? _this.settings.uri.translationPath.replace(':language', _this.settings.language) : '';

      fetch(url, { method: 'GET' })
        .then(response => response.json())
        .then(json => {
          _this.settings.translation = mergeObjects(_this.settings.translation, json);
          callback();
        })
        .catch(error => {
          _this.log('no translation foound ' + error);
          callback();
        });
    } else {
      if (_this.settings.language) {
        let translation;
        try {
          translation = require(`../../i18n/translation_${_this.settings.language}.json`);
        } catch (e) {
          translation = require('../../i18n/translation_en.json');
        }

        _this.settings.translation = mergeObjects(_this.settings.translation, translation);
      }

      callback();
    }
  };

  this.startup = function () {
    const _this = this;

    if (screen.width <= 360 && this.settings.layout.miniScoreBoardOrientation !== 'auto') {
      this.settings.layout.miniScoreBoardOrientation = 'vertical';
    }

    _this.settings.miniScoreBoard.initLayout(function () {
      _this.settings.miniScoreBoard.settings.active = true;
      _this.activeDataRefresh(function () {
        _this.settings.partialFunctions.startupCallback(_this);
      });

      if (_this.settings.enableNotifications) {
        _this.settings.notifications.init();
      }

      _this.cleanup();

      if (typeof _this.settings.callback === 'function') {
        _this.settings.callback();
      }
    });
  };

  var _cleanupInstance;
  this.cleanup = function () {
    var _this = this;

    if (_cleanupInstance) {
      clearTimeout(_cleanupInstance);
    }

    _cleanupInstance = setTimeout(function () {
      _this.settings.mainWidget.preLoaderRerun();

      _this.cleanup();
    }, 3000);
  };

  this.loadStylesheet = function (callback) {
    var _this = this;
    var createdResources = false;
    var availableLinks = [];

    objectIterator(query('link'), function (link) {
      if (link !== null) {
        availableLinks.push(new URL(link.href, document.baseURI).href);
      }
    });

    mapObject(_this.settings.resources, function (resource, key, count) {
      var exists = false;

      mapObject(availableLinks, function (link) {
        if (link === new URL(resource, document.baseURI).href) {
          exists = true;
        }
      });

      if (!exists) {
        var link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('type', 'text/css');
        link.setAttribute('href', resource);

        if (count === 0) {
          link.onload = function () {
            if (typeof callback === 'function') {
              callback();
            }
          };

          link.onerror = function (e) {
            if (typeof callback === 'function') {
              callback();
            }
          };
        }

        document.body.appendChild(link);

        createdResources = true;
      }
    });

    if (!createdResources && typeof callback === 'function') {
      callback();
    }
  };

  this.clickedMiniScoreBoard = function () {
    var _this = this;

    if (!_this.settings.miniScoreBoard.settings.dragging) {
      this.settings.callbacks.onMainWidgetOpen();
      _this.deactivateCompetitionsAndLeaderboards(function () {
        _this.settings.leaderboard.leaderboardData = [];
        _this.settings.mainWidget.initLayout(function () {
          // load tournaments data
          if (_this.settings.navigation.tournaments.enable) {
            const lbIcon = document.querySelector('.cl-main-widget-navigation-lb-icon').parentElement;
            lbIcon.classList.remove('hidden');

            _this.activeDataRefreshSimple();
          }

          // load achievement data
          if (_this.settings.navigation.achievements.enable) {
            const achievementsIcon = document.querySelector('.cl-main-widget-navigation-ach-icon').parentElement;
            if (!_this.settings.hideEmptyTabs) {
              achievementsIcon.classList.remove('hidden');
            }

            _this.checkForAvailableAchievements(1, function (achievements) {
              if (!_this.settings.hideEmptyTabs) return;

              if (!achievementsIcon) return;

              if (!achievements.list || !achievements.list.length) {
                achievementsIcon.classList.add('hidden');
              } else {
                achievementsIcon.classList.remove('hidden');
              }
            });
          }

          // load initial available reward data
          if (_this.settings.navigation.rewards.enable) {
            const awardsIcon = document.querySelector('.cl-main-widget-navigation-rewards-icon').parentElement;
            if (!_this.settings.hideEmptyTabs) {
              awardsIcon.classList.remove('hidden');
            }

            _this.checkForAvailableAwards(
              function (claimedAwards, availableAwards) {
                if (!_this.settings.hideEmptyTabs) return;

                if (!awardsIcon) return;

                if ((!claimedAwards || !claimedAwards.length) && (!availableAwards || !availableAwards.length) && !_this.settings.instantWins.enable) {
                  awardsIcon.classList.add('hidden');
                } else {
                  awardsIcon.classList.remove('hidden');
                }
              },
              1,
              1
            );
            _this.checkForAvailableRewards(1);
          }

          // load initial available messages data
          if (_this.settings.navigation.inbox.enable) {
            const messagesIcon = document.querySelector('.cl-main-widget-navigation-inbox-icon').parentElement;
            if (!_this.settings.hideEmptyTabs) {
              messagesIcon.classList.remove('hidden');
            }

            _this.checkForAvailableMessages(1, function (messages) {
              if (!_this.settings.hideEmptyTabs) return;

              if (!messagesIcon) return;

              if (!messages || !messages.length) {
                messagesIcon.classList.add('hidden');
              } else {
                messagesIcon.classList.remove('hidden');
              }
            });
          }

          // load initial available messages data
          if (_this.settings.navigation.missions.enable) {
            const missionsIcon = document.querySelector('.cl-main-widget-navigation-missions-icon').parentElement;
            if (!_this.settings.hideEmptyTabs) {
              missionsIcon.classList.remove('hidden');
            }

            _this.checkForAvailableMissions(1, function (missions) {
              if (!_this.settings.hideEmptyTabs) return;

              if (!missionsIcon) return;

              if (!missions || !missions.length) {
                missionsIcon.classList.add('hidden');
              } else {
                missionsIcon.classList.remove('hidden');
              }
            });
          }
        });
        setTimeout(function () {
          _this.settings.miniScoreBoard.settings.container.style.display = 'none';
        }, 200);
      });
    }
  };

  /**
   * Open main widget and open specific tab and loads relevant action
   * @memberOf LbWidget
   * @param tab String
   * @param actionCallback Function
   */
  this.openWithTabAndAction = function (tab, actionCallback) {
    var _this = this;

    if (_this.settings.mainWidget.settings.active) {
      var loadTab = query(_this.settings.mainWidget.settings.container, tab);
      _this.settings.mainWidget.navigationSwitch(loadTab, function () {
        _this.activeDataRefresh();

        if (typeof actionCallback === 'function') {
          actionCallback();
        }
      });

      setTimeout(function () {
        _this.settings.miniScoreBoard.settings.container.style.display = 'none';
      }, 200);
    } else {
      _this.deactivateCompetitionsAndLeaderboards(function () {
        _this.settings.mainWidget.initLayout(function () {
          _this.settings.mainWidget.navigationSwitch(query(_this.settings.mainWidget.settings.container, tab), function () {
            _this.activeDataRefresh();

            if (typeof actionCallback === 'function') {
              actionCallback();
            }
          });
        });
        setTimeout(function () {
          _this.settings.miniScoreBoard.settings.container.style.display = 'none';
        }, 200);
      });
    }
  };

  this.eventHandlers = async function (el) {
    const _this = this;

    // mini scoreboard opt-in action
    if (hasClass(el, 'cl-widget-ms-optin-action') && !hasClass(el, 'checking')) {
      addClass(el, 'checking');

      await this.optInMemberToActiveCompetition();

      // Leaderboard details opt-in action
    } else if (hasClass(el, 'cl-main-widget-lb-details-optin-action') && !hasClass(el, 'checking')) {
      addClass(el, 'checking');

      _this.optInMemberToActiveCompetition(function () {
        _this.revalidateIfSuccessfullOptIn(function (competitionJson) {
          _this.settings.competition.activeCompetition = competitionJson.data;
          _this.settings.mainWidget.competitionDetailsOptInButtonState();

          removeClass(el, 'checking');
        });
      });

      // Leaderboard details opt-in action
    } else if (hasClass(el, 'cl-main-widget-lb-optin-action') && !hasClass(el, 'checking')) {
      addClass(el, 'checking');

      const preLoader = _this.settings.mainWidget.preloader();
      preLoader.show(async function () {
        await _this.optInMemberToActiveCompetition(function () {
          setTimeout(function () {
            preLoader.hide();
            _this.settings.mainWidget.loadLeaderboard(() => { }, true);
          }, 3000);
        });
      });

      // Achievement details opt-in action
    } else if (hasClass(el, 'cl-main-widget-ach-details-optin-action')) {
      if (_this.settings.achievements.activeAchievementId) {
        const preLoader = _this.settings.mainWidget.preloader();

        preLoader.show(async function () {
          await manageOptIn({
            apiClient: _this.apiClientStomp,
            entityId: _this.settings.achievements.activeAchievementId,
            entityType: 'Achievement',
            action: hasClass(el, 'leave-achievement') ? 'leave' : 'join'
          });

          setTimeout(function () {
            preLoader.hide();
            _this.settings.mainWidget.hideAchievementDetails(
              _this.checkForAvailableAchievements(1)
            );
          }, 2000);
        });
      }

      // Achievement list opt-in action
    } else if (hasClass(el, 'cl-ach-list-enter')) {
      addClass(el, 'checking');
      const activeAchievementId = el.dataset.id;

      const isDashboard = closest(el, '.cl-main-widget-dashboard-achievements-list');

      const preLoader = _this.settings.mainWidget.preloader();
      preLoader.show(async function () {
        await manageOptIn({
          apiClient: _this.apiClientStomp,
          entityId: activeAchievementId,
          entityType: 'Achievement',
          action: 'join'
        });

        setTimeout(function () {
          if (isDashboard) {
            _this.checkForAvailableAchievements(1, function (achievementData) {
              _this.settings.mainWidget.loadDashboardAchievements(achievementData.list, function () {
                preLoader.hide();
              });
            });
          } else {
            _this.settings.mainWidget.loadAchievements(1, function () {
              preLoader.hide();
            });
          }
        }, 2000);
      });

      // Achievement list leave action
    } else if (hasClass(el, 'cl-ach-list-leave')) {
      const activeAchievementId = el.dataset.id;

      if (closest(el, '.cl-main-widget-dashboard-achievements-list')) {
        this.settings.mainWidget.showLeaveAchievementPopup(activeAchievementId, true);
      } else {
        this.settings.mainWidget.showLeaveAchievementPopup(activeAchievementId);
      }
      // close mini scoreboard info area
    } else if (hasClass(el, 'cl-widget-ms-information-close') && !hasClass(el, 'checking')) {
      _this.settings.miniScoreBoard.clearAll();

      // close notification window
    } else if (hasClass(el, 'cl-widget-notif-information-close') && !hasClass(el, 'checking')) {
      _this.settings.notifications.hideNotification();

      // close leaderboard window
    } else if (
      hasClass(el, 'cl-main-widget-lb-header-close') ||
      hasClass(el, 'cl-main-widget-ach-header-close') ||
      hasClass(el, 'cl-main-widget-reward-header-close') ||
      hasClass(el, 'cl-main-widget-inbox-header-close') ||
      hasClass(el, 'cl-widget-main-widget-overlay-wrapper') ||
      hasClass(el, 'cl-main-widget-dashboard-header-close') ||
      hasClass(el, 'cl-main-widget-missions-header-close') ||
      hasClass(el, 'cl-landscape-close')
    ) {
      _this.settings.mainWidget.hide(function () {
        _this.settings.miniScoreBoard.settings.active = true;
        _this.settings.miniScoreBoard.settings.container.style.display = 'block';

        _this.settings.callbacks.onMainWidgetClose();

        _this.activeDataRefresh();
      });

      // load embedded competition details
    } else if (
      !_this.settings.leaderboard.layoutSettings.titleLinkToDetailsPage &&
      (hasClass(el, 'cl-main-widget-lb-details-content') ||
        closest(el, '.cl-main-widget-lb-details-content') !== null)
    ) {
      const preLoader = _this.settings.mainWidget.preloader();
      preLoader.show(function () {
        _this.settings.mainWidget.showEmbeddedCompetitionDetailsContent(function () {
          preLoader.hide();
        });
      });

      // load embedded competition details
    } else if (hasClass(el, 'connections-table_round-item') || closest(el, '.connections-table_round-item') !== null) {
      const item = hasClass(el, 'connections-table_round-item') ? el : closest(el, '.connections-table_round-item');
      const preLoader = _this.settings.mainWidget.preloader();

      if (_this.settings.competition.activeContestId && _this.settings.competition.activeContestId === item.dataset.connectId) {
        return;
      }

      preLoader.show(async function () {
        if (_this.settings.competition.activeContestId && _this.settings.competition.activeContest.statusCode !== 15) {
          await subscribeToLeaderboard({
            apiClient: _this.apiClientStomp,
            entityId: _this.settings.competition.activeContestId,
            action: 'Unsubscribe'
          });
        }

        _this.settings.competition.activeContestId = item.dataset.connectId;
        const activeContestIdx = _this.settings.competition.contests.findIndex(c => c.id === _this.settings.competition.activeContestId);
        if (activeContestIdx !== -1) {
          _this.settings.competition.activeContest = _this.settings.competition.contests[activeContestIdx];
        }

        let ranksAboveToInclude = 0;
        let ranksBelowToInclude = 0;

        if (_this.settings.leaderboard.miniScoreBoard.enableRankings) {
          ranksAboveToInclude = _this.settings.leaderboard.miniScoreBoard.rankingsCount;
          ranksBelowToInclude = _this.settings.leaderboard.miniScoreBoard.rankingsCount;
        }

        if (_this.settings.competition.activeContest.statusCode === 15) {
          _this.checkForAvailableRewards(1, () => {
            _this.settings.mainWidget.showEmbeddedCompetitionDetailsContent(() => { });
            _this.settings.mainWidget.loadLeaderboard(() => { }, true);
            preLoader.hide();
          });
        } else {
          subscribeToLeaderboard({
            apiClient: _this.apiClientStomp,
            entityId: _this.settings.competition.activeContestId,
            action: 'Subscribe',
            leaderboardFilter: {
              topRanksToInclude: _this.settings.leaderboard.fullLeaderboardSize,
              ranksAboveToInclude: ranksAboveToInclude,
              ranksBelowToInclude: ranksBelowToInclude
            }
          })
            .then(data => {
              let leaderboardEntries = [];
              if (data && data.leaderboardEntries) {
                leaderboardEntries = data.leaderboardEntries;
              }
              _this.settings.leaderboard.leaderboardData = leaderboardEntries;
              _this.settings.partialFunctions.leaderboardDataResponseParser(leaderboardEntries, function (lbData) {
                _this.settings.leaderboard.leaderboardData = lbData;
              });
              _this.settings.callbacks.onLeaderboardUpdates(data);
              _this.settings.mainWidget.leaderboardDetailsUpdate();
              _this.settings.mainWidget.showEmbeddedCompetitionDetailsContent(function () { });
              _this.checkForAvailableRewards(1);
            })
            .catch(error => {
              _this.log(error);
            });

          preLoader.hide();
        }
      });

      // hide embedded competition details
    } else if (
      !_this.settings.leaderboard.layoutSettings.titleLinkToDetailsPage &&
      (
        hasClass(el, 'cl-main-widget-lb-details-description-close') ||
        hasClass(el, 'cl-main-widget-lb-header-back-icon') ||
        hasClass(el, 'cl-main-widget-lb-details-description-header-back') ||
        hasClass(el, 'cl-main-widget-lb-details-description-gotolb')
      )
    ) {
      const missingMember = document.querySelector('.cl-main-widget-lb-missing-member');
      if (missingMember) {
        missingMember.style.display = 'none';
      }
      _this.settings.mainWidget.hideEmbeddedCompetitionDetailsContent(function () { });
      _this.settings.mainWidget.hideCompetitionList();

      const member = query(_this.settings.mainWidget.settings.leaderboard.resultContainer, '.cl-lb-member-row');
      if (member !== null) {
        _this.settings.mainWidget.missingMember(_this.settings.mainWidget.isElementVisibleInView(member, _this.settings.mainWidget.settings.leaderboard.resultContainer));
      } else {
        _this.settings.mainWidget.missingMemberReset();
      }

      // hide mission map
    } else if (hasClass(el, 'cl-main-widget-mission-header-back-icon')) {
      _this.settings.mainWidget.hideMissionMap();

      // load competition details
    } else if (hasClass(el, 'cl-main-widget-lb-details-content-label') || closest(el, '.cl-main-widget-lb-details-content-label') !== null) {
      if (_this.settings.competition.activeContest !== null) {
        _this.settings.mainWidget.loadCompetitionDetails(function () {
        });
      }

      // pagination
    } else if (hasClass(el, 'paginator-item')) {
      const preLoader = _this.settings.mainWidget.preloader();
      if (el.closest('.cl-main-widget-ach-list-body-res')) {
        if (el.closest('.paginator-finished')) {
          let pageNumber;
          const pagesCount = Math.ceil(_this.settings.achievements.finishedTotalCount / 6);
          let isPrev = false;
          let isNext = false;

          if (el.dataset && el.dataset.page === '...') {
            if (el.previousSibling.dataset && el.previousSibling.dataset.page && el.previousSibling.dataset.page === '1') {
              isPrev = true;
            } else {
              isNext = true;
            }
          }

          if (el.classList.contains('prev') || isPrev) {
            const activePage = Number(el.closest('.paginator-finished').querySelector('.active').dataset.page);
            if (activePage > 1) {
              pageNumber = activePage - 1;
            } else {
              return;
            }
          } else if (el.classList.contains('next') || isNext) {
            const activePage = Number(el.closest('.paginator-finished').querySelector('.active').dataset.page);
            if (activePage < pagesCount) {
              pageNumber = activePage + 1;
            } else {
              return;
            }
          } else {
            pageNumber = Number(el.dataset.page);
          }

          let paginationArr = null;
          if (pagesCount > 7) {
            paginationArr = pagination(6, pageNumber, pagesCount);
          }

          preLoader.show(async function () {
            _this.settings.mainWidget.loadAchievements(pageNumber, preLoader.hide(), paginationArr, 'finished');
          });
        } else {
          let pageNumber;
          const pagesCount = Math.ceil(_this.settings.achievements.totalCount / 6);
          let isPrev = false;
          let isNext = false;

          if (el.dataset && el.dataset.page === '...') {
            if (el.previousSibling.dataset && el.previousSibling.dataset.page && el.previousSibling.dataset.page === '1') {
              isPrev = true;
            } else {
              isNext = true;
            }
          }

          if (el.classList.contains('prev') || isPrev) {
            const activePage = Number(el.closest('.paginator').querySelector('.active').dataset.page);
            if (activePage > 1) {
              pageNumber = activePage - 1;
            } else {
              return;
            }
          } else if (el.classList.contains('next') || isNext) {
            const activePage = Number(el.closest('.paginator').querySelector('.active').dataset.page);
            if (activePage < pagesCount) {
              pageNumber = activePage + 1;
            } else {
              return;
            }
          } else {
            pageNumber = Number(el.dataset.page);
          }

          let paginationArr = null;
          if (pagesCount > 7) {
            paginationArr = pagination(6, pageNumber, pagesCount);
          }

          preLoader.show(async function () {
            _this.settings.mainWidget.loadAchievements(pageNumber, preLoader.hide(), paginationArr);
          });
        }
      }
      if (el.closest('.cl-main-widget-reward-list-body-res')) {
        if (el.closest('.paginator-claimed')) {
          let pageNumber;
          const pagesCount = Math.ceil(_this.settings.awards.claimedTotalCount / 6);
          let isPrev = false;
          let isNext = false;

          if (el.dataset && el.dataset.page === '...') {
            if (el.previousSibling.dataset && el.previousSibling.dataset.page && el.previousSibling.dataset.page === '1') {
              isPrev = true;
            } else {
              isNext = true;
            }
          }

          if (el.classList.contains('prev') || isPrev) {
            const activePage = Number(el.closest('.paginator').querySelector('.active').dataset.page);
            if (activePage > 1) {
              pageNumber = activePage - 1;
            } else {
              return;
            }
          } else if (el.classList.contains('next') || isNext) {
            const activePage = Number(el.closest('.paginator').querySelector('.active').dataset.page);
            if (activePage < pagesCount) {
              pageNumber = activePage + 1;
            } else {
              return;
            }
          } else {
            pageNumber = Number(el.dataset.page);
          }

          let paginationArr = null;
          if (pagesCount > 7) {
            paginationArr = pagination(6, pageNumber, pagesCount);
          }

          preLoader.show(async function () {
            _this.settings.mainWidget.loadAwards(preLoader.hide(), 1, pageNumber, 1, paginationArr, true, false);
          });
        }
        if (el.closest('.paginator-available')) {
          let pageNumber;
          const pagesCount = Math.ceil(_this.settings.awards.totalCount / 6);
          let isPrev = false;
          let isNext = false;

          if (el.dataset && el.dataset.page === '...') {
            if (el.previousSibling.dataset && el.previousSibling.dataset.page && el.previousSibling.dataset.page === '1') {
              isPrev = true;
            } else {
              isNext = true;
            }
          }

          if (el.classList.contains('prev') || isPrev) {
            const activePage = Number(el.closest('.paginator').querySelector('.active').dataset.page);
            if (activePage > 1) {
              pageNumber = activePage - 1;
            } else {
              return;
            }
          } else if (el.classList.contains('next') || isNext) {
            const activePage = Number(el.closest('.paginator').querySelector('.active').dataset.page);
            if (activePage < pagesCount) {
              pageNumber = activePage + 1;
            } else {
              return;
            }
          } else {
            pageNumber = Number(el.dataset.page);
          }

          let paginationArr = null;
          if (pagesCount > 7) {
            paginationArr = pagination(6, pageNumber, pagesCount);
          }

          preLoader.show(async function () {
            _this.settings.mainWidget.loadAwards(preLoader.hide(), pageNumber, 1, 1, paginationArr, false, false);
          });
        }
      }
      if (el.closest('.cl-main-widget-inbox-list-body-res')) {
        let pageNumber;
        const pagesCount = Math.ceil(_this.settings.messages.totalCount / 9);
        let isPrev = false;
        let isNext = false;

        if (el.dataset && el.dataset.page === '...') {
          if (el.previousSibling.dataset && el.previousSibling.dataset.page && el.previousSibling.dataset.page === '1') {
            isPrev = true;
          } else {
            isNext = true;
          }
        }

        if (el.classList.contains('prev') || isPrev) {
          const activePage = Number(el.closest('.paginator').querySelector('.active').dataset.page);
          if (activePage > 1) {
            pageNumber = activePage - 1;
          } else {
            return;
          }
        } else if (el.classList.contains('next') || isNext) {
          const activePage = Number(el.closest('.paginator').querySelector('.active').dataset.page);
          if (activePage < pagesCount) {
            pageNumber = activePage + 1;
          } else {
            return;
          }
        } else {
          pageNumber = Number(el.dataset.page);
        }

        let paginationArr = null;
        if (pagesCount > 7) {
          paginationArr = pagination(6, pageNumber, pagesCount);
        }

        preLoader.show(async function () {
          _this.settings.mainWidget.loadMessages(pageNumber, preLoader.hide(), paginationArr);
        });
      }
      if (el.closest('.cl-main-widget-missions-list-body-res')) {
        let pageNumber;
        const pagesCount = Math.ceil(_this.settings.missions.totalCount / 6);
        let isPrev = false;
        let isNext = false;

        if (el.dataset && el.dataset.page === '...') {
          if (el.previousSibling.dataset && el.previousSibling.dataset.page && el.previousSibling.dataset.page === '1') {
            isPrev = true;
          } else {
            isNext = true;
          }
        }

        if (el.classList.contains('prev') || isPrev) {
          const activePage = Number(el.closest('.paginator').querySelector('.active').dataset.page);
          if (activePage > 1) {
            pageNumber = activePage - 1;
          } else {
            return;
          }
        } else if (el.classList.contains('next') || isNext) {
          const activePage = Number(el.closest('.paginator').querySelector('.active').dataset.page);
          if (activePage < pagesCount) {
            pageNumber = activePage + 1;
          } else {
            return;
          }
        } else {
          pageNumber = Number(el.dataset.page);
        }

        let paginationArr = null;
        if (pagesCount > 7) {
          paginationArr = pagination(6, pageNumber, pagesCount);
        }

        _this.settings.mainWidget.loadMissions(pageNumber, null, paginationArr);
      }
      if (el.closest('.paginator-finished')) {
        let pageNumber;
        const pagesCount = Math.ceil(_this.settings.tournaments.finishedTotalCount / ITEMS_PER_PAGE.TOURNAMENTS);
        let isPrev = false;
        let isNext = false;

        if (el.dataset && el.dataset.page === '...') {
          if (el.previousSibling.dataset && el.previousSibling.dataset.page && el.previousSibling.dataset.page === '1') {
            isPrev = true;
          } else {
            isNext = true;
          }
        }

        if (el.classList.contains('prev') || isPrev) {
          const activePage = Number(el.closest('.paginator-finished').querySelector('.active').dataset.page);
          if (activePage > 1) {
            pageNumber = activePage - 1;
          } else {
            return;
          }
        } else if (el.classList.contains('next') || isNext) {
          const activePage = Number(el.closest('.paginator-finished').querySelector('.active').dataset.page);
          const pagesCount = Math.ceil(_this.settings.tournaments.finishedTotalCount / ITEMS_PER_PAGE.TOURNAMENTS);
          if (activePage < pagesCount) {
            pageNumber = activePage + 1;
          } else {
            return;
          }
        } else {
          pageNumber = Number(el.dataset.page);
        }

        let paginationArr = null;
        if (pagesCount > 7) {
          paginationArr = pagination(6, pageNumber, pagesCount);
        }
        preLoader.show(async function () {
          await _this.checkForAvailableCompetitions(null, 1, 1, pageNumber);
          _this.settings.mainWidget.loadCompetitionList(preLoader.hide(), 1, 1, pageNumber, paginationArr, false, false, true);
        });
      }
      if (el.closest('.paginator-ready')) {
        let pageNumber;
        const pagesCount = Math.ceil(_this.settings.tournaments.readyTotalCount / ITEMS_PER_PAGE.TOURNAMENTS);
        let isPrev = false;
        let isNext = false;

        if (el.dataset && el.dataset.page === '...') {
          if (el.previousSibling.dataset && el.previousSibling.dataset.page && el.previousSibling.dataset.page === '1') {
            isPrev = true;
          } else {
            isNext = true;
          }
        }

        if (el.classList.contains('prev') || isPrev) {
          const activePage = Number(el.closest('.paginator-ready').querySelector('.active').dataset.page);
          if (activePage > 1) {
            pageNumber = activePage - 1;
          } else {
            return;
          }
        } else if (el.classList.contains('next') || isNext) {
          const activePage = Number(el.closest('.paginator-ready').querySelector('.active').dataset.page);
          const pagesCount = Math.ceil(_this.settings.tournaments.readyTotalCount / ITEMS_PER_PAGE.TOURNAMENTS);
          if (activePage < pagesCount) {
            pageNumber = activePage + 1;
          } else {
            return;
          }
        } else {
          pageNumber = Number(el.dataset.page);
        }

        let paginationArr = null;
        if (pagesCount > 7) {
          paginationArr = pagination(6, pageNumber, pagesCount);
        }
        preLoader.show(async function () {
          await _this.checkForAvailableCompetitions(null, pageNumber, 1, 1);
          _this.settings.mainWidget.loadCompetitionList(preLoader.hide(), pageNumber, 1, 1, paginationArr, true, false, false);
        });
      }
      if (el.closest('.paginator-active')) {
        let pageNumber;
        const pagesCount = Math.ceil(_this.settings.tournaments.totalCount / ITEMS_PER_PAGE.TOURNAMENTS);
        let isPrev = false;
        let isNext = false;

        if (el.dataset && el.dataset.page === '...') {
          if (el.previousSibling.dataset && el.previousSibling.dataset.page && el.previousSibling.dataset.page === '1') {
            isPrev = true;
          } else {
            isNext = true;
          }
        }

        if (el.classList.contains('prev') || isPrev) {
          const activePage = Number(el.closest('.paginator-active').querySelector('.active').dataset.page);
          if (activePage > 1) {
            pageNumber = activePage - 1;
          } else {
            return;
          }
        } else if (el.classList.contains('next') || isNext) {
          const activePage = Number(el.closest('.paginator-active').querySelector('.active').dataset.page);
          const pagesCount = Math.ceil(_this.settings.tournaments.totalCount / ITEMS_PER_PAGE.TOURNAMENTS);
          if (activePage < pagesCount) {
            pageNumber = activePage + 1;
          } else {
            return;
          }
        } else {
          pageNumber = Number(el.dataset.page);
        }

        let paginationArr = null;
        if (pagesCount > 7) {
          paginationArr = pagination(6, pageNumber, pagesCount);
        }

        preLoader.show(async function () {
          await _this.checkForAvailableCompetitions(null, 1, pageNumber, 1);
          _this.settings.mainWidget.loadCompetitionList(preLoader.hide(), 1, pageNumber, 1, paginationArr, false, true, false);
        });
      }

      // load dashboard awards
    } else if (hasClass(el, 'cl-main-widget-dashboard-awards-list-more')) {
      const preLoader = _this.settings.mainWidget.preloader();
      const dashboard = document.querySelector('.cl-main-widget-section-dashboard');
      const dashboardIcon = document.querySelector('.cl-main-widget-navigation-dashboard');
      const awardsIcon = document.querySelector('.cl-main-widget-navigation-rewards');

      preLoader.show(function () {
        awardsIcon.classList.add('cl-active-nav');
        dashboard.style.display = 'none';
        dashboardIcon.classList.remove('cl-active-nav');

        _this.settings.mainWidget.loadAwards(function () {
          const awardsContainer = query(_this.settings.mainWidget.settings.container, '.cl-main-widget-section-container .' + _this.settings.navigation.rewards.containerClass);

          _this.settings.mainWidget.settings.achievement.detailsContainer.style.display = 'none';

          awardsContainer.style.display = 'flex';
          setTimeout(function () {
            addClass(awardsContainer, 'cl-main-active-section');
          }, 30);

          preLoader.hide();
        });
      });

      // load dashboard achievements
    } else if (hasClass(el, 'cl-main-widget-dashboard-achievements-list-more')) {
      const preLoader = _this.settings.mainWidget.preloader();
      const dashboard = document.querySelector('.cl-main-widget-section-dashboard');
      const dashboardIcon = document.querySelector('.cl-main-widget-navigation-dashboard');
      const achIcon = document.querySelector('.cl-main-widget-navigation-ach');

      preLoader.show(function () {
        achIcon.classList.add('cl-active-nav');
        dashboard.style.display = 'none';
        dashboardIcon.classList.remove('cl-active-nav');

        _this.settings.mainWidget.loadAchievements(1, function () {
          const achContainer = query(_this.settings.mainWidget.settings.container, '.cl-main-widget-section-container .' + _this.settings.navigation.achievements.containerClass);

          _this.settings.mainWidget.settings.achievement.detailsContainer.style.display = 'none';

          achContainer.style.display = 'flex';
          setTimeout(function () {
            addClass(achContainer, 'cl-main-active-section');
          }, 30);

          preLoader.hide();
        });
      });

      // load dashboard mission
    } else if (hasClass(el, 'cl-main-widget-dashboard-missions-list-more')) {
      const preLoader = _this.settings.mainWidget.preloader();
      const dashboard = document.querySelector('.cl-main-widget-section-dashboard');
      const dashboardIcon = document.querySelector('.cl-main-widget-navigation-dashboard');
      const missionsIcon = document.querySelector('.cl-main-widget-navigation-missions');

      preLoader.show(function () {
        missionsIcon.classList.add('cl-active-nav');
        dashboard.style.display = 'none';
        dashboardIcon.classList.remove('cl-active-nav');

        _this.settings.mainWidget.loadMissions(1, function () {
          const missionsContainer = query(_this.settings.mainWidget.settings.container, '.cl-main-widget-section-container .' + _this.settings.navigation.missions.containerClass);

          missionsContainer.style.display = 'flex';
          setTimeout(function () {
            addClass(missionsContainer, 'cl-main-active-section');
          }, 30);

          preLoader.hide();
        });
      });

      // load dashboard competitions
    } else if (hasClass(el, 'cl-main-widget-dashboard-tournaments-list-more')) {
      const preLoader = _this.settings.mainWidget.preloader();
      const dashboard = document.querySelector('.cl-main-widget-section-dashboard');
      const dashboardIcon = document.querySelector('.cl-main-widget-navigation-dashboard');
      const compIcon = document.querySelector('.cl-main-widget-navigation-lb');

      preLoader.show(function () {
        compIcon.classList.add('cl-active-nav');
        dashboard.style.display = 'none';
        dashboardIcon.classList.remove('cl-active-nav');

        _this.checkForAvailableRewards(1);
        _this.settings.mainWidget.loadLeaderboard(function () {
          const lbContainer = query(_this.settings.mainWidget.settings.container, '.cl-main-widget-section-container .' + _this.settings.navigation.tournaments.containerClass);

          lbContainer.style.display = 'flex';
          setTimeout(function () {
            addClass(lbContainer, 'cl-main-active-section');
            _this.settings.mainWidget.loadCompetitionList();
          }, 30);

          preLoader.hide();
        }, true);
      });

      // load achievement details
    } else if (hasClass(el, 'cl-ach-list-more') || closest(el, '.cl-ach-list-details-cont') !== null) {
      const id = closest(el, '.cl-ach-list-item').dataset.id;

      if (closest(el, '.cl-main-widget-dashboard-achievements-list')) {
        const dashboard = document.querySelector('.cl-main-widget-section-dashboard');
        const dashboardIcon = document.querySelector('.cl-main-widget-navigation-dashboard');
        const achIcon = document.querySelector('.cl-main-widget-navigation-ach');
        const detailsContainer = document.querySelector('.cl-main-widget-ach-details-container');

        dashboard.style.display = 'none';
        dashboardIcon.classList.remove('cl-active-nav');
        achIcon.classList.add('cl-active-nav');
        detailsContainer.classList.add('cl-show');
        detailsContainer.style.display = 'block';

        _this.settings.mainWidget.loadAchievements(1, function () {
          const achContainer = query(_this.settings.mainWidget.settings.container, '.cl-main-widget-section-container .' + _this.settings.navigation.achievements.containerClass);

          achContainer.style.display = 'flex';
          addClass(achContainer, 'cl-main-active-section');

          _this.getAchievement(id, function (data) {
            _this.settings.achievements.activeAchievementId = data.id;
            _this.settings.mainWidget.loadAchievementDetails(data, function () {
            });
          });

          _this.settings.navigationSwitchInProgress = false;
        });
      } else {
        _this.getAchievement(id, function (data) {
          _this.settings.achievements.activeAchievementId = data.id;
          _this.settings.mainWidget.loadAchievementDetails(data, function () {
          });
        });
      }

      // dashboard wheel button
    } else if (hasClass(el, 'cl-main-widget-dashboard-instant-wins-more') || hasClass(el, '.cl-main-widget-dashboard-instant-wins-wheel-button')) {
      const dashboard = document.querySelector('.cl-main-widget-section-dashboard');
      const dashboardIcon = document.querySelector('.cl-main-widget-navigation-dashboard');
      const awardsIcon = document.querySelector('.cl-main-widget-navigation-rewards');
      const preLoader = _this.settings.mainWidget.preloader();

      dashboard.style.display = 'none';
      dashboardIcon.classList.remove('cl-active-nav');
      awardsIcon.classList.add('cl-active-nav');

      const rewardsContainer = query(_this.settings.mainWidget.settings.container, '.cl-main-widget-section-container .' + _this.settings.navigation.rewards.containerClass);
      rewardsContainer.style.display = 'flex';

      preLoader.show(async function () {
        await _this.settings.mainWidget.loadAwards(
          async function () {
            _this.settings.mainWidget.loadInstantWins();

            const container = document.querySelector('.cl-main-widget-reward-list-body-res');
            const sections = container.querySelectorAll('.cl-accordion');
            const instantWinsSection = container.querySelector('.cl-accordion.instantWins');
            const menuItems = container.querySelectorAll('.cl-main-accordion-container-menu-item');
            const instantMenuItem = container.querySelector('.cl-main-accordion-container-menu-item.instantWins');

            menuItems.forEach(i => i.classList.remove('active'));
            instantMenuItem.classList.add('active');
            sections.forEach(s => s.classList.remove('cl-shown'));
            instantWinsSection.classList.add('cl-shown');

            if (hasClass(el, '.cl-main-widget-dashboard-instant-wins-wheel-button')) {
              const id = el.dataset.id;
              await _this.settings.mainWidget.loadSingleWheel(id);
            }
            addClass(rewardsContainer, 'cl-main-active-section');
            preLoader.hide();
          }
        );
      });

      // dashboard scratchcards button
    } else if (hasClass(el, 'cl-main-widget-dashboard-instant-wins-cards-button')) {
      const dashboard = document.querySelector('.cl-main-widget-section-dashboard');
      const dashboardIcon = document.querySelector('.cl-main-widget-navigation-dashboard');
      const awardsIcon = document.querySelector('.cl-main-widget-navigation-rewards');

      dashboard.style.display = 'none';
      dashboardIcon.classList.remove('cl-active-nav');
      awardsIcon.classList.add('cl-active-nav');

      const rewardsContainer = query(_this.settings.mainWidget.settings.container, '.cl-main-widget-section-container .' + _this.settings.navigation.rewards.containerClass);
      rewardsContainer.style.display = 'flex';
      addClass(rewardsContainer, 'cl-main-active-section');

      const container = document.querySelector('.cl-main-widget-reward-list-body-res');
      const sections = container.querySelectorAll('.cl-accordion');
      const instantWinsSection = container.querySelector('.cl-accordion.instantWins');
      const menuItems = container.querySelectorAll('.cl-main-accordion-container-menu-item');
      const instantMenuItem = container.querySelector('.cl-main-accordion-container-menu-item.instantWins');

      menuItems.forEach(i => i.classList.remove('active'));
      instantMenuItem.classList.add('active');
      sections.forEach(s => s.classList.remove('cl-shown'));
      instantWinsSection.classList.add('cl-shown');

      // dashboard competition button
    } else if (hasClass(el, 'dashboard-tournament-item') || closest(el, '.dashboard-tournament-item')) {
      const tournamentId = hasClass(el, 'dashboard-tournament-item')
        ? el.dataset.id
        : closest(el, '.dashboard-tournament-item').dataset.id;
      const dashboard = document.querySelector('.cl-main-widget-section-dashboard');
      const dashboardIcon = document.querySelector('.cl-main-widget-navigation-dashboard');
      const lbIcon = document.querySelector('.cl-main-widget-navigation-lb');

      dashboard.style.display = 'none';
      dashboardIcon.classList.remove('cl-active-nav');
      lbIcon.classList.add('cl-active-nav');
      const preLoader = _this.settings.mainWidget.preloader();

      preLoader.show(function () {
        _this.settings.mainWidget.clearLeaderboard();
        _this.settings.mainWidget.populateLeaderboardResultsWithDefaultEntries(true);
        _this.settings.mainWidget.settings.active = true;
        _this.settings.tournaments.activeCompetitionId = tournamentId;
        _this.activeDataRefresh(function () {
          _this.settings.mainWidget.hideCompetitionList(async function () {
            if (!_this.settings.leaderboard.layoutSettings.titleLinkToDetailsPage) {
              await _this.settings.mainWidget.showEmbeddedCompetitionDetailsContent(function () { });
            } else if (_this.settings.competition.activeContest !== null) {
              _this.settings.mainWidget.loadCompetitionDetails(function () { });
            }

            const lbContainer = query(_this.settings.mainWidget.settings.container, '.cl-main-widget-section-container .' + _this.settings.navigation.tournaments.containerClass);
            lbContainer.style.display = 'flex';
            addClass(lbContainer, 'cl-main-active-section');

            preLoader.hide();
          });
        }, true);
      });

      // leaderboard details back button
    } else if (hasClass(el, 'cl-main-widget-lb-details-back-btn')) {
      _this.settings.mainWidget.hideCompetitionDetails();

      // achievements details back button
    } else if (hasClass(el, 'cl-main-widget-ach-details-back-btn')) {
      _this.settings.mainWidget.hideAchievementDetails(function () {
      });

      // rewards details back button
    } else if (hasClass(el, 'cl-main-widget-reward-details-back-btn')) {
      _this.settings.mainWidget.hideRewardDetails(function () {
      });

      // play spinner back button
    } else if (hasClass(el, 'play-single-wheel-back-btn')) {
      _this.settings.mainWidget.hideSingleWheel();

      // messages details back button
    } else if (hasClass(el, 'cl-main-widget-inbox-details-back-btn')) {
      _this.settings.mainWidget.hideMessageDetails(() => { }, true);

      // mission details back button
    } else if (hasClass(el, 'cl-main-widget-missions-details-back-btn')) {
      _this.settings.mainWidget.hideMissionDetails(function () {
      }, true);

      // competition details info button
    } else if (hasClass(el, 'cl-main-widget-lb-details-description-info')) {
      _this.settings.mainWidget.toggleCompetitionDescription();

      // achievement details info button
    } else if (hasClass(el, 'cl-main-widget-ach-details-header-info')) {
      _this.settings.mainWidget.toggleAchievementDescription();

      // mission details info button
    } else if (hasClass(el, 'cl-main-widget-missions-details-info-btn')) {
      _this.settings.mainWidget.loadMissionDetailsCyGraph();

      // Single Wheel
    } else if (hasClass(el, 'wheel-button')) {
      await _this.getSingleWheels(function (data) {
        _this.settings.mainWidget.loadSingleWheels(data);
      });

      // Single Wheel
    } else if (hasClass(el, 'instant-wins-card-button')) {
      const id = el.dataset.id;
      this.settings.mainWidget.loadSingleWheel(id);

      // Single Wheel
    } else if (hasClass(el, 'scratchcards-button')) {

      // claim award
    } else if (hasClass(el, 'cl-rew-list-details-claim')) {
      const awardId = closest(el, '.cl-rew-list-item').dataset.id;
      const preLoader = _this.settings.mainWidget.preloader();
      preLoader.show(async function () {
        await claimAward(_this.apiClientStomp, awardId, function () {
          setTimeout(function () {
            preLoader.hide();
          }, 3500);
        });
      });

      // claim dashboard award
    } else if (hasClass(el, 'cl-rew-dashboard-details-claim')) {
      const awardId = closest(el, '.dashboard-award-item').dataset.id;
      const preLoader = _this.settings.mainWidget.preloader();
      preLoader.show(async function () {
        await claimAward(_this.apiClientStomp, awardId, function () {
          setTimeout(function () {
            _this.settings.mainWidget.loadDashboardAwards();

            if (
              _this.settings.instantWins.enable &&
              _this.settings.navigation.dashboard.showInstantWins
            ) {
              _this.settings.mainWidget.loadDashboardInstantWins();
            }

            preLoader.hide();
          }, 3500);
        });
      });

      // load rewards details
    } else if (hasClass(el, 'cl-rew-list-item') || closest(el, '.cl-rew-list-item') !== null) {
      var awardId = (hasClass(el, 'cl-rew-list-item')) ? el.dataset.id : closest(el, '.cl-rew-list-item').dataset.id;
      _this.getAward(awardId, function (data) {
        _this.settings.mainWidget.loadRewardDetails(data, function () {
        });
      });

      // load inbox details
    } else if (
      (hasClass(el, 'cl-inbox-list-item') || closest(el, '.cl-inbox-list-item') !== null) &&
      !closest(el, '.checkbox-container')
    ) {
      const messageId = (hasClass(el, 'cl-inbox-list-item')) ? el.dataset.id : closest(el, '.cl-inbox-list-item').dataset.id;
      _this.getMessage(messageId, function (data) {
        _this.settings.mainWidget.loadMessageDetails(data, function () { });
        updateMessageStatus(_this.apiClientStomp, [messageId], 'Read');
      });

      // delete selected messages
    } else if (el.classList.contains('cl-main-widget-inbox-list-delete-selected')) {
      const checkedMessages = document.querySelectorAll('input[name="checkMessage"]:checked');
      const deleteSelected = document.querySelector('.cl-main-widget-inbox-list-delete-selected');
      const ids = [];
      const preLoader = _this.settings.mainWidget.preloader();

      if (checkedMessages && checkedMessages.length) {
        checkedMessages.forEach((message) => {
          const messageId = message.closest('.cl-inbox-list-item').dataset.id;
          ids.push(messageId);
        });
      }

      preLoader.show(async () => {
        await updateMessageStatus(_this.apiClientStomp, ids, 'Deleted');
        deleteSelected.style.display = 'none';
        setTimeout(function () {
          _this.settings.mainWidget.loadMessages(1, () => { preLoader.hide(); });
        }, 2500);
      });

      // load mission details
    } else if (hasClass(el, 'cl-missions-list-item') || closest(el, '.cl-missions-list-item') !== null) {
      const missionId = (hasClass(el, 'cl-missions-list-item')) ? el.dataset.id : closest(el, '.cl-missions-list-item').dataset.id;
      const preLoader = _this.settings.mainWidget.preloader();

      if (el.closest('.cl-main-widget-dashboard-missions-list')) {
        const dashboard = document.querySelector('.cl-main-widget-section-dashboard');
        const dashboardIcon = document.querySelector('.cl-main-widget-navigation-dashboard');
        const missionsIcon = document.querySelector('.cl-main-widget-navigation-missions');
        const detailsContainer = document.querySelector('.cl-main-widget-ach-details-container');

        dashboard.style.display = 'none';
        dashboardIcon.classList.remove('cl-active-nav');
        missionsIcon.classList.add('cl-active-nav');
        detailsContainer.classList.add('cl-show');
        detailsContainer.style.display = 'block';

        preLoader.show(function () {
          missionsIcon.classList.add('cl-active-nav');
          dashboard.style.display = 'none';
          dashboardIcon.classList.remove('cl-active-nav');

          _this.settings.mainWidget.loadMissions(1, function () {
            const missionsContainer = query(_this.settings.mainWidget.settings.container, '.cl-main-widget-section-container .' + _this.settings.navigation.missions.containerClass);

            missionsContainer.style.display = 'flex';
            setTimeout(function () {
              addClass(missionsContainer, 'cl-main-active-section');
            }, 30);

            _this.getMission(missionId, function (data) {
              _this.settings.mainWidget.loadMissionMap(data, function () {
                preLoader.hide();
              });
            });
          });
        });
      } else {
        preLoader.show(function () {
          _this.getMission(missionId, function (data) {
            _this.settings.mainWidget.loadMissionMap(data, function () {
              preLoader.hide();
            });
          });
        });
      }

      // claim reward
    } else if (hasClass(el, 'cl-main-widget-reward-claim-btn')) {
      const preLoader = _this.settings.mainWidget.preloader();
      preLoader.show(async function () {
        await claimAward(_this.apiClientStomp, el.dataset.id, function (data) {
          if (data.data[0].claimed) {
            addClass(el, 'cl-claimed');
            el.innerHTML = _this.settings.translation.rewards.claimed;
          } else {
            removeClass(el, 'cl-claimed');
            el.innerHTML = _this.settings.translation.rewards.claim;
          }
          setTimeout(function () {
            _this.settings.mainWidget.loadAwards(
              function () {
                preLoader.hide();
                _this.settings.mainWidget.hideRewardDetails();
              },
              1
            );
          }, 2000);
        });
      });

      // load achievement details window from notification window
    } else if (hasClass(el, 'cl-widget-notif-information-details-wrapper') || closest(el, '.cl-widget-notif-information-details-wrapper') !== null) {
      _this.openWithTabAndAction('.cl-main-widget-navigation-ach-icon', function () {
        var id = (hasClass(el, 'cl-widget-notif-information-details-wrapper')) ? el.dataset.id : closest(el, '.cl-widget-notif-information-details-wrapper').dataset.id;
        _this.settings.notifications.hideNotification();
        _this.settings.mainWidget.hideAchievementDetails(function () {
          _this.getAchievement(id, function (data) {
            _this.settings.mainWidget.loadAchievementDetails(data);
          });
        });
      });

      // primary widget navigation
    } else if (el.closest('.cl-main-widget-navigation-items')) {
      if (hasClass(el, 'cl-main-widget-navigation-items')) return;

      _this.settings.mainWidget.navigationSwitch(el);

      // competition list
    } else if (hasClass(el, 'cl-main-widget-lb-header-list-icon')) {
      if (_this.settings.leaderboard.refreshInterval) {
        clearTimeout(_this.settings.leaderboard.refreshInterval);
      }
      _this.settings.mainWidget.loadCompetitionList();

      // load competition
    } else if (hasClass(el, 'cl-tour-list-item') || closest(el, '.cl-tour-list-item') !== null) {
      const tournamentId = (hasClass(el, 'cl-tour-list-item')) ? el.dataset.id : closest(el, '.cl-tour-list-item').dataset.id;
      const preLoader = _this.settings.mainWidget.preloader();

      preLoader.show(function () {
        _this.settings.mainWidget.clearLeaderboard();
        _this.settings.mainWidget.populateLeaderboardResultsWithDefaultEntries(true);
        _this.settings.mainWidget.settings.active = true;
        _this.settings.tournaments.activeCompetitionId = tournamentId;
        _this.activeDataRefreshSimple(function () {
          _this.settings.mainWidget.hideCompetitionList(async function () {
            _this.settings.mainWidget.hideEmbeddedCompetitionDetailsContent(function () { });
            _this.checkForAvailableRewards(1, function () {
              if (_this.settings.mainWidget.settings.active) {
                _this.settings.mainWidget.updateLeaderboard();
              }
            });
            preLoader.hide();
          });
        });
      });

      // hide competition list view
    } else if (hasClass(el, 'cl-main-widget-tournaments-back-btn') || hasClass(el, 'cl-main-widget-lb-header-back-icon')) {
      _this.settings.mainWidget.hideCompetitionList();

      // hide Instant Wins
    } else if (hasClass(el, 'cl-main-widget-reward-header-back')) {
      _this.settings.mainWidget.hideInstantWins();

      // mini scoreboard action to open primary widget
    } else if ((hasClass(el, 'cl-widget-ms-icon-wrapper') || closest(el, '.cl-widget-ms-icon-wrapper') !== null) || (hasClass(el, 'cl-widget-ms-information-wrapper') || closest(el, '.cl-widget-ms-information-wrapper') !== null)) {
      _this.clickedMiniScoreBoard();

      // accordion navigation
    } else if (hasClass(el, 'cl-accordion-label')) {
      _this.settings.mainWidget.accordionNavigation(el);
    } else if (hasClass(el, 'cl-main-accordion-container-menu-item')) {
      if (el.classList.contains('not-available')) return;
      _this.settings.mainWidget.listsNavigation(el);

      // mobile theme switcher
    } else if (hasClass(el, 'cl-mobile-theme-switcher')) {
      const mainContainer = document.querySelector('.cl-main-widget-wrapper');
      const msContainer = document.querySelector('.cl-widget-ms-wrapper');
      const notifContainer = document.querySelector('.cl-widget-notif-wrapper');
      if (mainContainer.classList.contains('lightTheme')) {
        mainContainer.classList.remove('lightTheme');
        msContainer.classList.remove('lightTheme');
        if (notifContainer) notifContainer.classList.remove('lightTheme');
        localStorage.setItem('zqTheme', 'dark');
      } else {
        mainContainer.classList.add('lightTheme');
        msContainer.classList.add('lightTheme');
        if (notifContainer) notifContainer.classList.add('lightTheme');
        localStorage.setItem('zqTheme', 'light');
      }
    }
  };

  this.eventListeners = function () {
    var _this = this;

    window.addEventListener('online', async () => {
      await this.initApiClientStomp(true);
    });

    document.body.addEventListener('keyup', function (event) {
      switch (event.keyCode) {
        case 27: // on escape
          if (_this.settings.mainWidget.settings.active) {
            _this.settings.mainWidget.hide(function () {
              _this.settings.miniScoreBoard.settings.active = true;
              _this.settings.miniScoreBoard.settings.container.style.display = 'block';

              _this.activeDataRefresh();
            });
          }
          break;
      }
    });

    document.body.addEventListener('click', function (event) {
      const el = event.target;

      _this.eventHandlers(el).then(() => { });
    });
  };

  this.getCompetitionOptInStatus = async function (competitionId) {
    return getOptInStatus({
      apiClient: this.apiClientStomp,
      entityTypes: ['Competition'],
      ids: [competitionId]
    });
  };

  this.getMemberAchievementOptInStatus = async function (achievementId) {
    return getOptInStatus({
      apiClient: this.apiClientStomp,
      entityTypes: ['Achievement'],
      ids: [achievementId]
    });
  };

  this.getMemberAchievementsOptInStatuses = async function (achievementIds) {
    return getOptInStatus({
      apiClient: this.apiClientStomp,
      entityTypes: ['Achievement'],
      ids: achievementIds,
      limit: achievementIds.length
    });
  };

  this.closeEverything = function () {
    var _this = this;

    _this.deactivateCompetitionsAndLeaderboards(function () {
      _this.settings.leaderboard.leaderboardData = [];
      setTimeout(function () {
        _this.settings.miniScoreBoard.settings.container.style.display = 'none';
      }, 200);
    });

    _this.settings.mainWidget.hide();
    _this.settings.mainWidget.settings.preLoader.preLoaderActive = false;
    this.stopActivity();
    this.apiClientStomp.disconnect();
    this.apiClientStomp = null;
  };

  var restartReloadInterval;
  this.restart = function () {
    var _this = this;

    _this.settings.mainWidget.hide(() => {
      _this.deactivateCompetitionsAndLeaderboards(() => {
        _this.stopActivity(() => {
          _this.loadMember((member) => {
            _this.loadWidgetTranslations(() => {
              if (restartReloadInterval) {
                clearTimeout(restartReloadInterval);
              }
              _this.settings.mainWidget.destroyLayout();

              restartReloadInterval = setTimeout(function () {
                _this.settings.miniScoreBoard.settings.active = true;
                _this.settings.miniScoreBoard.settings.container.style.display = 'block';
                _this.startup();
              }, 300);
            });
          });
        });
      });
    });
  };

  this.isMobile = function () {
    return isMobileTablet();
  };

  this.applyAppearance = function () {
    if (this.settings.styles !== null) {
      const styles = Object.keys(this.settings.styles).reduce((accumulator, currentValue) => {
        return {
          ...accumulator,
          [`--lb3-${camelToKebabCase(currentValue)}`]: this.settings.styles[currentValue]
        };
      }, {});

      cssVars({
        include: 'link[rel=stylesheet],style',
        watch: true,
        onlyLegacy: false,
        variables: { ...styles }
      });
    }
  };

  this.initApiClientStomp = async function (isRefresh = false) {
    const _this = this;
    this.settings.authToken = null;

    if (this.settings.memberToken) {
      this.settings.authToken = this.settings.memberToken;
    } else {
      await this.generateUserToken();
    }

    if (this.apiClientStomp) {
      await this.apiClientStomp.disconnect();
      this.apiClientStomp = null;
    }

    if (this.settings.authToken) {
      this.apiClientStomp = ApiClientStomp.instance;

      if (this.settings.isStaging) {
        ApiClientStomp.updateInstancePaths(
          'wss://member-api.staging.ziqni.io/ws',
          'https://member-api.staging.ziqni.io/ws'
        );
        this.apiClientStomp = ApiClientStomp.instance;
      }

      if (!this.settings.debug) {
        this.apiClientStomp.client.debug = () => { };
      }
      await this.apiClientStomp.connect({ token: this.settings.authToken });

      if (isRefresh) {
        if (this.settings.competition.activeContestId) {
          let ranksAboveToInclude = 0;
          let ranksBelowToInclude = 0;
          const count = (this.settings.miniScoreBoard.settings.active) ? 0 : this.settings.leaderboard.fullLeaderboardSize;

          if (this.settings.leaderboard.miniScoreBoard.enableRankings) {
            ranksAboveToInclude = this.settings.leaderboard.miniScoreBoard.rankingsCount;
            ranksBelowToInclude = this.settings.leaderboard.miniScoreBoard.rankingsCount;
          }

          subscribeToLeaderboard({
            apiClient: this.apiClientStomp,
            entityId: this.settings.competition.activeContestId,
            action: 'Subscribe',
            leaderboardFilter: {
              topRanksToInclude: count,
              ranksAboveToInclude: ranksAboveToInclude,
              ranksBelowToInclude: ranksBelowToInclude
            }
          }).then((data) => {
            if (data && data.leaderboardEntries) {
              _this.settings.leaderboard.leaderboardData = data.leaderboardEntries;
              _this.settings.callbacks.onLeaderboardUpdates(data);
            }
          });
        } else {
          this.activeDataRefresh();
        }
      }

      this.apiClientStomp.sendSys('', {}, (json, headers) => {
        if (headers && headers.objectType === 'Error') {
          this.settings.callbacks.onStompError(json);
        }

        if (headers && headers.objectType === 'Leaderboard') {
          if (json.id && json.id === this.settings.competition.activeContestId) {
            const leaderboardEntries = json.leaderboardEntries ?? [];
            this.settings.leaderboard.leaderboardData = leaderboardEntries;
            this.settings.partialFunctions.leaderboardDataResponseParser(leaderboardEntries, function (lbData) {
              _this.settings.leaderboard.leaderboardData = lbData;
            });
            _this.settings.callbacks.onLeaderboardUpdates(json);
            this.settings.mainWidget.loadLeaderboard(() => { }, false);
          }
        }

        if (json && json.entityType === 'Message') {
          setTimeout(async () => {
            await _this.getMessage(json.entityId, () => { }, true);
          }, 2000);

          const messagesTab = document.querySelector('.cl-main-widget-section-inbox');
          if (json.typeOffChange === 1) {
            if (_this.settings.navigation.inbox.enable) {
              const messagesEl = document.querySelector('.cl-main-widget-navigation-inbox-icon');
              if (messagesEl) {
                const messagesIcon = messagesEl.parentElement;
                messagesIcon.classList.remove('hidden');
              }
            }

            if (messagesTab && messagesTab.classList.contains('cl-main-active-section')) {
              _this.settings.mainWidget.loadMessages(1, () => { });
            }
          }
        }

        if (json && json.entityType === 'Award') {
          setTimeout(async () => {
            const dashboard = document.querySelector('.cl-main-widget-section-dashboard');
            const awardData = await getAwardsByIds({
              apiClient: _this.apiClientStomp,
              language: _this.settings.language,
              currencyKey: _this.settings.currency,
              ids: [json.entityId]
            });

            if (
              awardData.data &&
              awardData.data.length &&
              awardData.data[0].rewardType.key.startsWith('$iw')
            ) {
              if (!['Claimed', 'Expired'].includes(awardData.data[0].status)) {
                const iwAward = awardData.data[0];
                await claimAward(_this.apiClientStomp, iwAward.id, () => { });
                setTimeout(async () => {
                  await _this.settings.mainWidget.loadDashboardInstantWins();
                }, 2000);
              }
            } else if (dashboard && dashboard.classList.contains('cl-main-active-section')) {
              await _this.settings.mainWidget.loadDashboardAwards(function () { _this.animateIcon('Award'); });
            } else {
              _this.settings.mainWidget.loadAwards(function () { _this.animateIcon('Award'); }, 1);
            }
          }, 2000);
        }

        if (json && json.entityType === 'Contest') {
          _this.checkForAvailableCompetitions(async function () {
          });
          if (headers.callback && headers.callback === 'entityStateChanged') {
            if (typeof this.settings.callbacks.onContestStatusChanged === 'function') {
              const currentState = competitionStatusMap[json.currentState] ?? json.currentState;
              const previousState = competitionStatusMap[json.previousState] ?? json.previousState;
              this.settings.callbacks.onContestStatusChanged(json.entityId, currentState, previousState);
            }
          }
        }

        if (json && json.entityType === 'Competition') {
          const isDashboard = document.querySelector('.cl-main-widget-section-dashboard').classList.contains('cl-main-active-section');
          _this.checkForAvailableCompetitions(async function () {
            if (
              _this.settings.navigation.tournaments.enable &&
              _this.settings.navigation.dashboard.showTournaments &&
              isDashboard
            ) {
              _this.settings.mainWidget.loadDashboardTournaments();
            }
          });

          if (headers.callback && headers.callback === 'entityStateChanged') {
            if (typeof this.settings.callbacks.onCompetitionStatusChanged === 'function') {
              const currentState = competitionStatusMap[json.currentState] ?? json.currentState;
              const previousState = competitionStatusMap[json.previousState] ?? json.previousState;
              this.settings.callbacks.onCompetitionStatusChanged(json.entityId, currentState, previousState);
            }
          }
        }

        if (json && json.entityType === 'Achievement') {
          if (headers.callback === 'optinStatus') {
            _this.settings.mainWidget.achievementItemUpdateProgression(json.entityId, json.percentageComplete);
            _this.settings.mainWidget.achievementDashboardItemUpdateProgression(json.entityId, json.percentageComplete);

            _this.settings.mainWidget.missionItemUpdateProgression(json.entityId, json.percentageComplete);
            _this.settings.mainWidget.missionDashboardItemUpdateProgression(json.entityId, json.percentageComplete);
          } else {
            const isDashboard = document.querySelector('.cl-main-widget-section-dashboard').classList.contains('cl-main-active-section');
            if (
              _this.settings.navigation.achievements.enable &&
              _this.settings.navigation.dashboard.showAchievements &&
              isDashboard
            ) {
              _this.checkForAvailableAchievements(1, function (achievementData) {
                _this.settings.mainWidget.loadDashboardAchievements(achievementData.list);
              });
            }
            _this.settings.mainWidget.loadAchievements();
          }
        }
      });
    }
  };

  this.generateUserToken = async function () {
    let memberTokenRequest;

    if (this.settings.memberRefId) {
      memberTokenRequest = {
        member: this.settings.memberRefId,
        apiKey: this.settings.apiKey,
        isReferenceId: true,
        expires: this.settings.expires
      };
    } else {
      memberTokenRequest = {
        member: 'PUBLIC',
        apiKey: this.settings.apiKey,
        isReferenceId: false,
        expires: this.settings.expires
      };
    }

    let tokenUrl = ' https://member-api.ziqni.com/member-token';
    if (this.settings.isStaging) {
      tokenUrl = 'https://member-api.staging.ziqni.io/member-token';
    }

    const response = await fetch(tokenUrl, {
      method: 'post',
      body: JSON.stringify(memberTokenRequest),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const body = await response.json();

    if (body.data && body.data.jwtToken) {
      this.settings.authToken = body.data.jwtToken;
    } else {
      console.warn('Member Token Error');
    }
  };

  this.refreshMemberToken = async function (memberToken) {
    this.settings.memberToken = memberToken;
    await this.initApiClientStomp(true);
  };

  /**
   * Init LbWidget method
   * @method
   * @memberOf LbWidget
   * @return {undefined}
   */
  this.init = async function () {
    await this.initApiClientStomp();

    if (!this.settings.memberToken) {
      setInterval(async () => {
        await this.initApiClientStomp(true);
      }, 5 * 60 * 1000);
    }

    if (this.settings.authToken) {
      this.loadStylesheet(() => {
        this.applyAppearance();

        this.loadMember((member) => {
          this.loadWidgetTranslations(() => {
            if (this.settings.miniScoreBoard === null) {
              this.settings.notifications = new Notifications();
              this.settings.miniScoreBoard = new MiniScoreBoard({
                active: true
              });
              this.settings.mainWidget = new MainWidget();

              this.settings.notifications.settings.lbWidget = this;
              this.settings.miniScoreBoard.settings.lbWidget = this;
              this.settings.mainWidget.settings.lbWidget = this;

              this.startup();
              this.eventListeners();
            } else {
              this.settings.mainWidget.hide(() => {
                this.deactivateCompetitionsAndLeaderboards(() => {
                  this.settings.miniScoreBoard.settings.active = true;
                  this.settings.miniScoreBoard.settings.container.style.display = 'block';
                  this.startup();
                });
              });
            }
          });
        });
      });
    } else if (this.settings.memberRefId) {
      setTimeout(async () => {
        await this.init();
      }, 3000);
    }
  };

  if (this.settings.autoStart) {
    this.init();
  }
};
