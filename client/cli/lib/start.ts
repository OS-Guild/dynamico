import * as liveServer from 'live-server';
import { join, basename, dirname, extname } from 'path';

import build from './build';
import { getMainFile } from './utils';

export const DEFAULT_PORT = 8383;

export default async ({ port = DEFAULT_PORT }): Promise<any> => {
  const main = getMainFile();

  return Promise.all([
    build(),
    liveServer.start({
      port,
      file: join('dist', dirname(main), basename(main, extname(main)) + '.js'),
      open: false,
      cors: true,
      middleware: [
        (req, res, next) => {
          res.setHeader('Access-Control-Expose-Headers', 'ETag');
          next();
        }
      ]
    })
  ]);
};
