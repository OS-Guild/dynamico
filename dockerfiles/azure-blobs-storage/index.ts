import express from 'express';
import jsonErrorHandler from 'express-json-error-handler';
import dynamico from '@dynamico/express-middleware';
import { AzureBlobStorage } from '@dynamico/azure-blob-storage';
import { ContainerURL, StorageURL, AnonymousCredential } from '@azure/storage-blob';
import cors from 'cors';
import nconf from 'nconf';

const secretsFilePath = process.env.SECRET_FILE_PATH ? process.env.SECRET_FILE_PATH : '/run/secrets/azure-uri';

nconf.file(secretsFilePath).env({ lowerCase: true });

const app = express();
if (!nconf.get('container_sas')) {
  throw new Error(`Can't start server, missing SAS key`);
}

const container = new ContainerURL(nconf.get('container_sas'), StorageURL.newPipeline(new AnonymousCredential()));
const storageProvider = new AzureBlobStorage({
  container,
  indexBlobName: nconf.get('index_blob_name'),
  timeout: Number(nconf.get('blob_download_timeout')),
  concurrentConnections: Number(nconf.get('blob_download_concurrent_connections'))
});
const serverTimeout = Number(nconf.get('server_timeout') || 3 * 60 * 1000);
app.use(cors());
app.use(dynamico(storageProvider, { readOnly: nconf.get('dynamico_readonly') === 'true' }));
app.use(jsonErrorHandler({ log: console.log }));
app.get('/monitoring/healthz', (req, res) => res.sendStatus(200));
const port = Number(nconf.get('port') || 1234);
app
  .listen(port, () => {
    console.log(`Dynamico Azure Blob Storage registry listening on ${port}`);
  })
  .setTimeout(serverTimeout);
