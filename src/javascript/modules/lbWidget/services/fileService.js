import { FilesApiWs } from '@ziqni-tech/member-api-client';

let filesApiWsClient = null;

export const getFiles = (apiClient, fileRequest) => {
  if (!filesApiWsClient) {
    filesApiWsClient = new FilesApiWs(apiClient);
  }

  return new Promise((resolve) => {
    filesApiWsClient.getFiles(fileRequest, (res) => {
      resolve(res);
    });
  });
};
