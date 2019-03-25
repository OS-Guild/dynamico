import * as liveServer from 'live-server';

import build from './build';

export const DEFAULT_PORT = 8383;

export default async ({ port = DEFAULT_PORT }): Promise<any> => {
  const { main } = await build();

  return liveServer.start({
    port,
    root: './dist',
    file: main,
    open: false,
    cors: true,
    middleware: [
      (req, res, next) => {
        res.setHeader('Access-Control-Expose-Headers', 'ETag');
        next();
      }
    ]
  });
};
