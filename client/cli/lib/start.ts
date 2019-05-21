import * as liveServer from 'live-server';
import bodyParser from 'body-parser';

import build from './build';
import { validateDependencies } from './utils';

export const DEFAULT_PORT = 8383;

export default async ({ port = DEFAULT_PORT }): Promise<any> => {
  const { main, peerDependencies } = await build();

  return liveServer.start({
    port,
    root: './dist',
    file: main,
    open: false,
    cors: true,
    middleware: [
      bodyParser.json(),
      (req, res, next) => {
        if (req.method == 'GET') {
          res.setHeader('Access-Control-Expose-Headers', 'ETag');
        }

        if (req.method === 'POST') {
          validateDependencies(req.body, peerDependencies);
        }

        next();
      }
    ]
  });
};
