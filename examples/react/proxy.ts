import 'dotenv-extended/config';

import dynamico from '@dynamico/express-middleware';
import { FSStorage } from '@dynamico/fs-storage';

import Bundler from 'parcel-bundler';
import express from 'express';

const bundler = new Bundler('./index.html');

const app = express();

app.use('/api/components', dynamico(new FSStorage('./components')));

app.use(bundler.middleware());

app.listen(Number(process.env.PORT || 1234), () => {
  console.log(`Listening on port ${process.env.PORT}`);
});
