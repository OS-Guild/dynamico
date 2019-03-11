import { AsyncRouter, AsyncRouterInstance } from 'express-async-router';
import { Storage, Driver } from '@dynamico/driver';
import * as controller from './controller';

export default (storage: Storage): AsyncRouterInstance => {
  const router = AsyncRouter();
  const driver = new Driver(storage)

  router.get('/:name', controller.get(driver));
  router.post('/');

  return router;
};