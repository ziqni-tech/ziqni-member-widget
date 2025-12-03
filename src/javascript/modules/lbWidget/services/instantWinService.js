import {
  InstantWinsApiWs,
  InstantWinRequest,
  InstantWinPlayRequest, InstantWinAvailablePlaysRequest
} from '@ziqni-tech/member-api-client';

let instantWinsApiWsClient = null;

const getInstantWinsApi = async function (apiClient, instantWinRequest) {
  if (!instantWinsApiWsClient) {
    instantWinsApiWsClient = new InstantWinsApiWs(apiClient);
  }
  return new Promise((resolve, reject) => {
    instantWinsApiWsClient.listInstantWins(instantWinRequest, (json) => { resolve(json); });
  });
};

export async function getSingleWheels({
  apiClient,
  language,
  currencyKey,
  limit,
  skip
}) {
  const request = InstantWinRequest.constructFromObject({
    languageKey: language,
    currencyKey: currencyKey,
    instantWinFilter: {
      instantWinTypes: [1],
      limit: limit,
      skip: skip
    }
  }, null);

  return await getInstantWinsApi(apiClient, request);
}

export async function getSingleWheel({
  apiClient,
  language,
  currencyKey,
  id
}) {
  const request = InstantWinRequest.constructFromObject({
    languageKey: language,
    currencyKey: currencyKey,
    instantWinFilter: {
      ids: [id],
      limit: 1,
      skip: 0
    }
  }, null);

  return await getInstantWinsApi(apiClient, request);
}

export async function playInstantWin(apiClient, id) {
  if (!instantWinsApiWsClient) {
    instantWinsApiWsClient = new InstantWinsApiWs(apiClient);
  }

  const request = InstantWinPlayRequest.constructFromObject({
    instantWinId: id
  }, null);

  return new Promise((resolve, reject) => {
    instantWinsApiWsClient.playInstantWin(request, (json) => {
      resolve(json.data);
    });
  });
}

export async function getInstantWinsAvailablePlays(apiClient, ids) {
  if (!instantWinsApiWsClient) {
    instantWinsApiWsClient = new InstantWinsApiWs(apiClient);
  }

  const request = InstantWinAvailablePlaysRequest.constructFromObject({
    instantWinIds: ids
  }, null);

  return new Promise((resolve, reject) => {
    instantWinsApiWsClient.getInstantWinAvailablePlays(request, (json) => {
      resolve(json.data);
    });
  });
}
