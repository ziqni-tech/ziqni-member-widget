import {
  CompetitionRequest,
  CompetitionsApiWs,
  ContestsApiWs,
  ContestRequest
} from '@ziqni-tech/member-api-client';

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
};
