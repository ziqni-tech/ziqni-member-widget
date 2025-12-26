import {
  CompetitionRequest,
  CompetitionsApiWs,
  ContestsApiWs,
  ContestRequest
} from '@ziqni-tech/member-api-client';
import { attachRewards } from './rewardService';
import { ITEMS_PER_PAGE } from '../../mainWidget/constants';

const stusCodes = {
  active: {
    moreThan: 20,
    lessThan: 30
  },
  ready: {
    moreThan: 10,
    lessThan: 20
  },
  finished: {
    moreThan: 30,
    lessThan: 50
  }
};

let competitionsApiWsClient = null;
let contestsApiWsClient = null;

const getCompetitionsApi = async (apiClient, competitionRequest) => {
  if (!competitionsApiWsClient) {
    competitionsApiWsClient = new CompetitionsApiWs(apiClient);
  }
  return new Promise((resolve, reject) => {
    competitionsApiWsClient.getCompetitions(competitionRequest, (json) => { resolve(json); });
  });
};

const getContestsApi = async (apiClient, contestRequest) => {
  if (!contestsApiWsClient) {
    contestsApiWsClient = new ContestsApiWs(apiClient);
  }
  return new Promise((resolve, reject) => {
    contestsApiWsClient.getContests(contestRequest, (json) => { resolve(json.data); });
  });
};

export async function getCompetitions({ apiClient, language, status, productIds, limit, skip, endDateRange = null }) {
  const request = CompetitionRequest.constructFromObject({
    languageKey: language,
    competitionFilter: {
      statusCode: stusCodes[status],
      productIds: Array.isArray(productIds) ? productIds : [],
      sortBy: [{
        queryField: 'created',
        order: 'Desc'
      }],
      limit: limit,
      skip: skip
    }
  }, null);

  if (endDateRange) {
    request.competitionFilter.endDateRange = endDateRange;
  }

  return await getCompetitionsApi(apiClient, request);
};

export async function getContests({ apiClient, language, competitionIds, limit, skip, sortBy = [], constraints = [] }) {
  const request = ContestRequest.constructFromObject({
    languageKey: language,
    contestFilter: {
      sortBy: sortBy,
      competitionIds: competitionIds,
      statusCode: {
        moreThan: 0,
        lessThan: 100
      },
      constraints: constraints,
      limit: limit,
      skip: skip
    }
  }, null);

  return await getContestsApi(apiClient, request);
}

async function enrichCompetitionsWithContests({
  apiClient,
  language,
  currencyKey,
  competitions,
  contestsLimit = 20,
  rewardsLimit = 20
}) {
  if (!competitions || !competitions.length) {
    return competitions;
  }

  const competitionIds = competitions.map(c => c.id);

  let contests = await getContests({
    apiClient,
    language,
    competitionIds,
    limit: contestsLimit,
    skip: 0
  });

  const contestIds = contests.map(c => c.id);

  if (contestIds.length) {
    contests = await attachRewards({
      apiClient,
      languageKey: language,
      entityArray: contests,
      currencyKey,
      entityType: 'Contest',
      entityIds: contestIds,
      skip: 0,
      limit: rewardsLimit
    });
  }

  return competitions.map(comp => {
    comp.contests = contests.filter(c => c.competitionId === comp.id);
    return comp;
  });
}

export async function fetchDashboardCompetitions({
  apiClient,
  language,
  currencyKey,
  productIds,
  limit = 2
}) {
  const [activeResponse, readyResponse] = await Promise.all([
    getCompetitions({
      apiClient,
      language,
      status: 'active',
      productIds,
      limit,
      skip: 0
    }),
    getCompetitions({
      apiClient,
      language,
      status: 'ready',
      productIds,
      limit,
      skip: 0
    })
  ]);

  let activeCompetitions = activeResponse.data || [];
  let readyCompetitions = readyResponse.data || [];

  if (activeCompetitions.length) {
    activeCompetitions = await enrichCompetitionsWithContests({
      apiClient,
      language,
      currencyKey,
      competitions: activeCompetitions,
      contestsLimit: 20,
      rewardsLimit: 20
    });
  }

  if (readyCompetitions.length) {
    readyCompetitions = await enrichCompetitionsWithContests({
      apiClient,
      language,
      currencyKey,
      competitions: readyCompetitions,
      contestsLimit: 20,
      rewardsLimit: 20
    });
  }

  return {
    activeCompetitions,
    readyCompetitions
  };
}

export async function fetchCompetitionsSummary({
  apiClient,
  language,
  currencyKey,
  productIds,
  showFinishedTournaments = false,
  finalisedCompetitionsDays = 30,
  readyPageNumber = 1,
  activePageNumber = 1,
  finishedPageNumber = 1,
  itemsPerPage = ITEMS_PER_PAGE.TOURNAMENTS
}) {
  const readySkip = (readyPageNumber - 1) * itemsPerPage;
  const activeSkip = (activePageNumber - 1) * itemsPerPage;
  const finishedSkip = (finishedPageNumber - 1) * itemsPerPage;

  const finishedDateFilter = new Date();
  finishedDateFilter.setDate(finishedDateFilter.getDate() - finalisedCompetitionsDays);
  const endDateRange = {
    before: new Date().toISOString(),
    after: finishedDateFilter.toISOString()
  };

  const [readyResponse, activeResponse] = await Promise.all([
    getCompetitions({
      apiClient,
      language,
      status: 'ready',
      productIds,
      limit: itemsPerPage,
      skip: readySkip
    }),
    getCompetitions({
      apiClient,
      language,
      status: 'active',
      productIds,
      limit: itemsPerPage,
      skip: activeSkip
    })
  ]);

  let readyCompetitions = readyResponse.data || [];
  let activeCompetitions = activeResponse.data || [];
  let finishedCompetitions = [];
  let finishedTotalCount = 0;

  if (showFinishedTournaments) {
    const finishedResponse = await getCompetitions({
      apiClient,
      language,
      status: 'finished',
      productIds,
      limit: itemsPerPage,
      skip: finishedSkip,
      endDateRange
    });
    finishedCompetitions = finishedResponse.data || [];
    finishedTotalCount = finishedResponse.meta?.totalRecordsFound || 0;
  }

  if (activeCompetitions.length) {
    activeCompetitions = await enrichCompetitionsWithContests({
      apiClient,
      language,
      currencyKey,
      competitions: activeCompetitions,
      contestsLimit: 20,
      rewardsLimit: 20
    });
  }

  if (readyCompetitions.length) {
    readyCompetitions = await enrichCompetitionsWithContests({
      apiClient,
      language,
      currencyKey,
      competitions: readyCompetitions,
      contestsLimit: 20,
      rewardsLimit: 20
    });
  }

  if (finishedCompetitions.length) {
    finishedCompetitions = await enrichCompetitionsWithContests({
      apiClient,
      language,
      currencyKey,
      competitions: finishedCompetitions,
      contestsLimit: 20,
      rewardsLimit: 20
    });
  }

  return {
    readyCompetitions,
    readyTotalCount: readyResponse.meta?.totalRecordsFound || 0,
    activeCompetitions,
    activeTotalCount: activeResponse.meta?.totalRecordsFound || 0,
    finishedCompetitions,
    finishedTotalCount
  };
}
