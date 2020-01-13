import cors from 'cors';
import express from 'express';
import { resolve } from 'path';

import build, { Options } from './build';
import { getComponentDirectories, validateDependencies } from './utils';

export const DEFAULT_PORT = 8383;

export type StartOptions = {
  port?: number;
  workspaces?: string[];
};

export default async (
  logger,
  { port = DEFAULT_PORT, workspaces }: StartOptions,
  buildOptions?: Options
): Promise<any> => {
  const dir = buildOptions?.dir;

  const dirs = getComponentDirectories(dir, workspaces);
  const builds = await Promise.all(
    dirs.map(async dir => {
      const result = await build({ ...buildOptions, dir });
      return { ...result, dir };
    })
  );

  const index: Record<string, any> = builds.reduce(
    (acc, { name, ...result }) => ({
      ...acc,
      [name]: result
    }),
    {}
  );

  const app = express();

  app.set('etag', 'strong');

  app.use(express.json(), cors());

  app
    .route('/:component')
    .all((req, res, next) => {
      if (!(req.params.component in index)) {
        logger.warn(`component "${req.params.component}" was not found`);
        return res.sendStatus(404);
      }
      req.params.component = index[req.params.component];
      next();
    })
    .get((req, res) => {
      res.setHeader('Access-Control-Expose-Headers', 'ETag');
      const component = req.params.component;
      res.sendFile(resolve(process.cwd(), component.dir, 'dist', component.main));
    })
    .post((req, res) => {
      const component = req.params.component;
      validateDependencies(req.body, component.peerDependencies);
      res.sendStatus(200);
    })
    .all((req, res) => {
      return res.sendStatus(404);
    });

  app.post('/host/register', (req, res) => {
    res.sendStatus(200);
  });

  app.use((req, res) => {
    res.sendStatus(404);
  });

  return app.listen(port, () => logger.info(`started dev server on port ${port}`));
};
