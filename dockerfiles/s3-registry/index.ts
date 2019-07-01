import express from 'express';
import jsonErrorHandler from 'express-json-error-handler';
import dynamico from '@dynamico/express-middleware';
import { S3Storage } from '@dynamico/s3-storage';
const { S3 } = require('aws-sdk');

const app = express();

let s3Config: any = {
  apiVersion: '2006-03-01'
};
if (process.env.SECRETACCESSKEY) {
  s3Config = {
    ...s3Config,
    accessKeyId: process.env.ACCESSKEYID,
    secretAccessKey: process.env.SECRETACCESSKEY,
    region: process.env.REGION,
    endpoint: process.env.ENDPOINT,
    s3ForcePathStyle: process.env.FORCEPATHFILE === 'true'
  };
}
const s3Client = new S3(s3Config);

const bucketName = process.env.BUCKETNAME || 'dynamico';
const storageProvider = new S3Storage({ s3Client, bucketName });

app.use(dynamico(storageProvider, { readOnly: process.env.DYNAMICO_READONLY === 'true' }));
app.use(jsonErrorHandler({ log: console.log }));

const port = Number(process.env.PORT || 1234);
app.listen(port, () => {
  console.log(`Dynamico S3 registry listening on ${port}`);
});
