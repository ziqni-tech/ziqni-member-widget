import { MessagesApiWs, MessageRequest } from '@ziqni-tech/member-api-client';
import { ITEMS_PER_PAGE } from '../../mainWidget/constants';

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

  const ids = Array.isArray(messageIds) ? messageIds : [messageIds];
  const payload = [{
    id: ids,
    status: status
  }];

  await messagesApiWsClient.updateMessagesState(payload, (json) => { });
}

export async function fetchMessagesSummary({
  apiClient,
  language,
  messageType = 'InboxItem',
  status = ['New', 'Read'],
  pageNumber = 1,
  itemsPerPage = ITEMS_PER_PAGE.MESSAGES,
  messagesForTheLast = 30
}) {
  const createdDateFilter = new Date();
  createdDateFilter.setDate(createdDateFilter.getDate() - messagesForTheLast);
  const skip = (pageNumber - 1) * itemsPerPage;

  const response = await getMessages({
    apiClient,
    language,
    messageType,
    status,
    after: createdDateFilter.toISOString(),
    skip,
    limit: itemsPerPage
  });

  return {
    messages: response.data || [],
    totalCount: response.meta?.totalRecordsFound || 0
  };
}

export async function markMessagesAsRead({ apiClient, messageIds }) {
  const ids = Array.isArray(messageIds) ? messageIds : [messageIds];
  await updateMessageStatus(apiClient, ids, 'Read');
}

export async function deleteMessages({ apiClient, messageIds }) {
  const ids = Array.isArray(messageIds) ? messageIds : [messageIds];
  await updateMessageStatus(apiClient, ids, 'Deleted');
}
