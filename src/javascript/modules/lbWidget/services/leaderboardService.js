import { LeaderboardApiWs, LeaderboardSubscriptionRequest } from '@ziqni-tech/member-api-client';

let leaderboardApiWsClient = null;

export async function subscribeToLeaderboard({ apiClient, entityId, action, leaderboardFilter = {} }) {
  if (!leaderboardApiWsClient) {
    leaderboardApiWsClient = new LeaderboardApiWs(apiClient);
  }

  const leaderboardSubscriptionRequest = LeaderboardSubscriptionRequest.constructFromObject({
    entityId: entityId,
    action: action,
    leaderboardFilter: leaderboardFilter
  });

  return new Promise((resolve, reject) => {
    leaderboardApiWsClient.subscribeToLeaderboard(leaderboardSubscriptionRequest, (json) => {
      resolve(json.data);
    });
  });
}
