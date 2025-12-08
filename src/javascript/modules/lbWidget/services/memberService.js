import { MemberRequest, MembersApiWs } from '@ziqni-tech/member-api-client';

let membersApiWsClient = null;

const getMemberApi = async (apiClient, memberRequest) => {
  if (!membersApiWsClient) {
    membersApiWsClient = new MembersApiWs(apiClient);
  }

  return new Promise((resolve, reject) => {
    membersApiWsClient.getMember(memberRequest, (json) => {
      resolve(json);
    });
  });
};

export async function getMember(apiClient) {
  const memberRequest = MemberRequest.constructFromObject({
    includeFields: [
      'id',
      'memberRefId',
      'memberType',
      'name',
      'jsonClass',
      'accountId',
      'groups',
      'created',
      'tags',
      'spaceName'
    ],
    includeCustomFields: [],
    includeMetaDataFields: []
  }, null);

  return await getMemberApi(apiClient, memberRequest);
}
