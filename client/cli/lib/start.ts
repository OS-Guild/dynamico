import * as liveServer from 'live-server';
import { Bundler } from 'bili';
import { join, resolve, basename, dirname, extname } from 'path';

const dir = process.cwd();

export const DEFAULT_PORT = 8383;

export default async ({ port = DEFAULT_PORT }): Promise<any> => {
  const { main } = require(resolve(dir, `package.json`));

  if (!main) {
    throw `package.json is missing "main" file`;
  }

  const bundler = new Bundler({
    input: resolve(dir, main),
    bundleNodeModules: true,
    plugins: {
      'peer-deps-external': true
    }
  });

  return Promise.all([
    bundler.run({
      watch: true
    }),
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
