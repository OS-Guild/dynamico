import FormData from 'form-data';
import fetch from 'node-fetch';
import { createReadStream, createWriteStream } from 'fs';
import tar from 'tar';
import { tmpdir } from 'os';
import { join } from 'path';
import build, { Mode } from './build';
import urlJoin from 'url-join';
import promisePipe from 'promisepipe';

export default async (basePath: string, middleware?: Function) => {
  const body = new FormData();

  const file = join(tmpdir(), 'tmp.tgz');

  const { name, version, hostVersion, main } = await build({ mode: Mode.production });
  await promisePipe(tar.create({ gzip: true, cwd: './dist' }, [main, 'package.json']), createWriteStream(file));
  body.append('package', createReadStream(file));
  const request = {
    method: 'POST',
    body
  };
  if (middleware) {
    await middleware(request);
  }
  const res = await fetch(urlJoin(basePath, name.toLowerCase(), hostVersion, version), request);
  if (res.status >= 400) throw new Error(`Failed uploading bundle with status code: ${res.status}`);
  return res;
};
