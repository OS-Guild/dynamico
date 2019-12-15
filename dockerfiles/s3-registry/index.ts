import express from 'express';
import jsonErrorHandler from 'express-json-error-handler';
import dynamico from '@dynamico/express-middleware';
import { S3Storage } from '@dynamico/s3-storage';
const { S3 } = require('aws-sdk');
import cors from 'cors';
import nconf from 'nconf';

const app = express();

const secretsFilePath = process.env.SECRETS_FILE_PATH ? process.env.SECRETS_FILE_PATH : '/run/secrets/s3-access-keys';

nconf.file(secretsFilePath).env();

let s3Config: any = {
  apiVersion: '2006-03-01'
};

const secretAccessKey = nconf.get('SECRETACCESSKEY');
if (secretAccessKey) {
  s3Config = {
    ...s3Config,
    accessKeyId: nconf.get('ACCESSKEYID'),
    secretAccessKey: secretAccessKey,
    region: nconf.get('REGION'),
    endpoint: nconf.get('ENDPOINT'),
    s3ForcePathStyle: nconf.get('FORCEPATHFILE') === 'true'
  };
}
const s3Client = new S3(s3Config);

const bucketName = nconf.get('BUCKETNAME') || 'dynamico';
const storageProvider = new S3Storage({ s3Client, bucketName });

app.use(cors());
app.use(dynamico(storageProvider, { readOnly: nconf.get('DYNAMICO_READONLY') === 'true' }));
app.use(jsonErrorHandler({ log: console.log }));
app.get('/monitoring/healthz', (req, res) => res.sendStatus(200));
const port = Number(nconf.get('PORT') || 1234);
app.listen(port, () => {
  console.log(`Dynamico S3 registry listening on ${port}`);
});
