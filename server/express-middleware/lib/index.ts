import bodyParser from 'body-parser';
import { AsyncRouter, AsyncRouterInstance } from 'express-async-router';
import { Storage, Driver } from '@dynamico/driver';
import multer from 'multer';

import * as controller from './controller';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

interface Options {
  readOnly?: boolean;
}

export default (storage: Storage, { readOnly }: Options = {}): AsyncRouterInstance => {
  const router = AsyncRouter();
  const driver = new Driver(storage);

  router.post('/host/register', bodyParser.json(), controller.registerHost(driver));

  router.get('/:name', controller.get(driver));

  if (!readOnly) {
    router.use(bodyParser.raw());
    router.post('/:name/:componentVersion', upload.single('package'), controller.save(driver));
  }

  return router;
};
