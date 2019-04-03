import FormData from 'form-data';
import fetch from 'node-fetch';
import { createReadStream, createWriteStream, unlinkSync } from 'fs';
import tar from 'tar';
import { tmpdir } from 'os';
import { join } from 'path';
import build, { Mode } from './build';
import urlJoin from 'url-join';
import promisePipe from 'promisepipe';

export default async (basePath: string, middleware?: Function) => {
  const body = new FormData();
  const filename = `dcmtmp${new Date().getTime()}.tgz`;
  const file = join(tmpdir(), filename);

  const { name, version, hostVersion, main } = await build({ mode: Mode.production });

  await promisePipe(tar.create({ gzip: true, cwd: './dist' }, [main, 'package.json']), createWriteStream(file));

  body.append('package', createReadStream(file));

  let request = {
    method: 'POST',
    body
  };

  if (middleware) {
    if (typeof middleware !== 'function') {
      throw new Error(`Middleware has to be a function`);
    }

    request = await middleware(request);

    if (!request) {
      throw new Error(`Got an empty request object from middleware. Did you forget to return it from the middleware?`);
    }
  }

  const response = await fetch(urlJoin(basePath, name.toLowerCase(), hostVersion, version), request);

  unlinkSync(file);

  if (response.status >= 400) {
    throw new Error(`Failed uploading bundle with status code: ${response.status}`);
  }

  return response;
};
