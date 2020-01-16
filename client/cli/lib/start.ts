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

  app.get('/:component', (req, res) => {
    const componentName = req.params.component;

    if (!(componentName in index)) {
      logger.warn(`component "${componentName}" was not found`);
      return res.sendStatus(404);
    }

    const component = index[componentName];

    res.setHeader('Access-Control-Expose-Headers', 'ETag');
    res.sendFile(resolve(process.cwd(), component.dir, 'dist', component.main));
  });

  app.post('/host/register', (req, res) => {
    Object.entries(index).forEach(([componentName, { peerDependencies }]) => {
      validateDependencies(req.body, peerDependencies, componentName, logger);
    });

    res.sendStatus(200);
  });

  app.use((req, res) => {
    res.sendStatus(404);
  });

  return app.listen(port, () => logger.info(`started dev server on port ${port}`));
};
