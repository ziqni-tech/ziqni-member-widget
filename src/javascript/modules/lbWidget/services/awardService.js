import {
  AwardsApiWs,
  AwardRequest,
  ClaimAwardRequest
} from '@ziqni-tech/member-api-client';

let awardsApiWsClient = null;

const getAwardsApi = async function (apiClient, awardRequest) {
  if (!awardsApiWsClient) {
    awardsApiWsClient = new AwardsApiWs(apiClient);
  }
  return new Promise((resolve, reject) => {
    awardsApiWsClient.getAwards(awardRequest, (json) => { resolve(json); });
  });
};

export async function getAwards({
  apiClient,
  language,
  currencyKey,
  moreThan,
  lessThan,
  skip,
  limit
}) {
  const request = AwardRequest.constructFromObject({
    languageKey: language,
    currencyKey: currencyKey,
    awardFilter: {
      statusCode: {
        moreThan: moreThan,
        lessThan: lessThan
      },
      sortBy: [{
        queryField: 'created',
        order: 'Desc'
      }],
      skip: skip,
      limit: limit
    }
  }, null);

  return await getAwardsApi(apiClient, request);
}

export async function getAwardsByIds({
  apiClient,
  language,
  currencyKey,
  ids
}) {
  const request = AwardRequest.constructFromObject({
    languageKey: language,
    currencyKey: currencyKey,
    awardFilter: {
      ids: ids,
      skip: 0,
      limit: 1
    }
  }, null);

  return await getAwardsApi(apiClient, request);
}

export async function claimAward(apiClient, rewardId, callback) {
  if (!awardsApiWsClient) {
    awardsApiWsClient = new AwardsApiWs(apiClient);
  }

  const claimAwardRequest = ClaimAwardRequest.constructFromObject({
    awardIds: [rewardId]
  });

  awardsApiWsClient.claimAwards(claimAwardRequest, (json) => {
    if (typeof callback === 'function') {
      callback(json);
    }
  });
}
