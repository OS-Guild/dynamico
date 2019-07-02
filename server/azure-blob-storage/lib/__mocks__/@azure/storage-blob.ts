let blockBlobURLMocks: Record<string, jest.Mock> = {};
let uploadStreamToBlockBlobMocks: Record<string, jest.Mock> = {};

const storage = jest.genMockFromModule<any>('@azure/storage-blob');

storage.BlockBlobURL = {
  fromContainerURL: (container: any, name: string) => {
    return blockBlobURLMocks[name];
  }
};

storage.addBlockBlobUrlMock = (key: string, mock: jest.Mock) => {
  blockBlobURLMocks[key] = mock;
};

storage.clearMocks = () => {
  blockBlobURLMocks = {};
  uploadStreamToBlockBlobMocks = {};
};

storage.uploadStreamToBlockBlob = (aborter: any, stream: any, indexBlobUrl: any, bufferSize: any, maxBuffers: any) => {
  return uploadStreamToBlockBlobMocks[indexBlobUrl.indexBlobName](
    aborter,
    stream,
    indexBlobUrl,
    bufferSize,
    maxBuffers
  );
};

storage.addUploadStreamToBlockBlobMocks = (key: string, mock: jest.Mock) => {
  uploadStreamToBlockBlobMocks[key] = mock;
};

export const {
  clearMocks,
  addBlockBlobUrlMock,
  BlockBlobURL,
  ContainerURL,
  Aborter,
  uploadStreamToBlockBlob,
  addUploadStreamToBlockBlobMocks
} = storage;
