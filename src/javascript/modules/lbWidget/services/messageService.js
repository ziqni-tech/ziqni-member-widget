import { MessagesApiWs, MessageRequest } from '@ziqni-tech/member-api-client';

let messagesApiWsClient = null;

const getMessagesApi = async function (apiClient, messageRequest) {
  if (!messagesApiWsClient) {
    messagesApiWsClient = new MessagesApiWs(apiClient);
  }
  return new Promise((resolve, reject) => {
    messagesApiWsClient.getMessages(messageRequest, (json) => {
      resolve(json);
    });
  });
};

export async function getMessages ({ apiClient, language, messageType, status, after, skip, limit }) {
  const request = MessageRequest.constructFromObject({
    languageKey: language,
    messageFilter: {
      messageType: messageType,
      status: status,
      createdDateRange: {
        before: (new Date()).toISOString(),
        after: after
      },
      sortBy: [{
        queryField: 'created',
        order: 'Desc'
      }],
      skip: skip,
      limit: limit
    }
  }, null);

  return await getMessagesApi(apiClient, request);
}

export async function getMessageById({ apiClient, language, messageId }) {
  const request = {
    languageKey: language,
    messageFilter: {
      ids: [messageId],
      skip: 0,
      limit: 1
    }
  };

  return await getMessagesApi(apiClient, request);
}

export async function updateMessageStatus(apiClient, messageIds, status) {
  if (!messagesApiWsClient) {
    messagesApiWsClient = new MessagesApiWs(apiClient);
  }

  const payload = [{
    id: messageIds,
    status: status
  }];

  await messagesApiWsClient.updateMessagesState(payload, (json) => { });
}
