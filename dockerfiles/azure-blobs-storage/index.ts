import express from 'express';
import jsonErrorHandler from 'express-json-error-handler';
import dynamico from '@dynamico/express-middleware';
import { AzureBlobStorage } from '@dynamico/azure-blob-storage';
import { ContainerURL, StorageURL, AnonymousCredential } from '@azure/storage-blob';

const app = express();
if (!process.env.CONTAINER_SAS) {
  throw new Error(`Can't start server, missing SAS key`);
}
const container = new ContainerURL(process.env.CONTAINER_SAS, StorageURL.newPipeline(new AnonymousCredential()));
const storageProvider = new AzureBlobStorage({
  container,
  indexBlobName: process.env.INDEX_BLOB_NAME,
  timeout: Number(process.env.BLOB_DOWNLOAD_TIMEOUT),
  concurrentConnections: Number(process.env.BLOB_DOWNLOAD_CONCURRENT_CONNECTIONS)
});

app.use(dynamico(storageProvider, { readOnly: process.env.DYNAMICO_READONLY === 'true' }));
app.use(jsonErrorHandler({ log: console.log }));

const port = Number(process.env.PORT || 1234);
app.listen(port, () => {
  console.log(`Dynamico Azure Blob Storage registry listening on ${port}`);
});
