import express from 'express';
import jsonErrorHandler from 'express-json-error-handler';
import dynamico from '@dynamico/express-middleware';
import { AzureBlobStorage } from '@dynamico/azure-blob-storage';
import { RedisIndexStorage } from '@dynamico/redis-index-storage';
import { CompositionStorage } from '@dynamico/composition-storage';
import { ContainerURL, StorageURL, AnonymousCredential } from '@azure/storage-blob';
import redis from 'redis';
import cors from 'cors';
import nconf from 'nconf';

const filePath = process.env.CONFIG_FILE_PATH ? process.env.CONFIG_FILE_PATH : './config.json';

const azureSecretsFilePath = process.env.AZURE_SECRET_FILE_PATH
  ? process.env.AZURE_SECRET_FILE_PATH
  : '/run/secrets/azure-uri';
const redisSecretsFilePath = process.env.REDIS_SECRETS_FILE_PATH
  ? process.env.REDIS_SECRETS_FILE_PATH
  : '/run/secrets/redis-config';

nconf
  .argv()
  .file('azure', azureSecretsFilePath)
  .file('redis', redisSecretsFilePath)
  .file('config', filePath)
  .env({ lowerCase: true });

const app = express();
if (!nconf.get('container_sas')) {
  throw new Error(`Can't start server, missing SAS key`);
}

if (!nconf.get('redis_config')) {
  throw new Error(`Can't start server, missing redis configuration`);
}

const container = new ContainerURL(nconf.get('container_sas'), StorageURL.newPipeline(new AnonymousCredential()));
const componentsStorageProvider = new AzureBlobStorage({
  container,
  indexBlobName: nconf.get('index_blob_name'),
  timeout: Number(nconf.get('blob_download_timeout')),
  concurrentConnections: Number(nconf.get('blob_download_concurrent_connections'))
});

const redisClient = redis.createClient(nconf.get('redis_config'));
const indexStorageProvider = new RedisIndexStorage(redisClient, nconf.get('index_key_name'));

const serverTimeout = Number(nconf.get('server_timeout') || 3 * 60 * 1000);
const dynamicoMiddleware = dynamico(new CompositionStorage(indexStorageProvider, componentsStorageProvider), {
  readOnly: nconf.get('dynamico_readonly') === 'true'
});
app.use(cors());
app.use(dynamicoMiddleware);
app.use(jsonErrorHandler({ log: console.log }));
app.get('/monitoring/healthz', (req, res) => res.sendStatus(200));
const port = Number(nconf.get('port') || 1234);
app
  .listen(port, () => {
    console.log(`Dynamico Redis and Azure Blob Storage registry listening on ${port}`);
  })
  .setTimeout(serverTimeout);
