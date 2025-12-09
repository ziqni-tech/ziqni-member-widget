import { StatsApiWs } from '@ziqni-tech/member-api-client';

let statsApiWs = null;
export const getActiveEntitiesCount = async (apiClient, modelCountRequest) => {
  if (!statsApiWs) {
    statsApiWs = new StatsApiWs(apiClient);
  }

  return new Promise((resolve, reject) => {
    statsApiWs.getActiveEntitiesCount(modelCountRequest, (json) => {
      resolve(json);
    });
  });
};
