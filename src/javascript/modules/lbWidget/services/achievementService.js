import { AchievementsApiWs, AchievementRequest } from '@ziqni-tech/member-api-client';

let achievementsApiWsClient = null;

const getAchievementsApi = async function (apiClient, achievementRequest) {
  if (!achievementsApiWsClient) {
    achievementsApiWsClient = new AchievementsApiWs(apiClient);
  }
  return new Promise((resolve, reject) => {
    achievementsApiWsClient.getAchievements(achievementRequest, (json) => { resolve(json); });
  });
};

export async function getAchievements({
  apiClient,
  language,
  productTags = [],
  productIds = [],
  tags = [],
  startDate = null,
  endDate = null,
  ids = [],
  scheduleTypes = [],
  moreThan = 10,
  lessThan = 30,
  skip = 0,
  limit = 6,
  constraints = []
}) {
  const request = AchievementRequest.constructFromObject({
    languageKey: language,
    achievementFilter: {
      productTags: productTags,
      productIds: productIds,
      tags: tags,
      startDate: startDate,
      endDate: endDate,
      ids: ids,
      scheduleTypes: scheduleTypes,
      statusCode: {
        moreThan: moreThan,
        lessThan: lessThan
      },
      sortBy: [{
        queryField: 'created',
        order: 'Desc'
      }],
      skip: skip,
      limit: limit,
      constraints: constraints
    }
  }, null);

  return await getAchievementsApi(apiClient, request);
};
