import FormData from 'form-data';
import fetch from 'node-fetch';
import { createReadStream, createWriteStream, unlinkSync } from 'fs';
import tar from 'tar';
import { tmpdir } from 'os';
import { join } from 'path';
import build, { Mode, Options } from './build';
import urlJoin from 'url-join';
import promisePipe from 'promisepipe';

export default async (basePath: string, middleware?: Function, buildOptions?: Options) => {
  const body = new FormData();
  const filename = `dcmtmp${new Date().getTime()}.tgz`;
  const file = join(tmpdir(), filename);

  const { name, version, main, peerDependencies } = await build({ ...buildOptions, mode: Mode.production });

  await promisePipe(tar.create({ gzip: true, cwd: './dist' }, [main, 'package.json']), createWriteStream(file));

  body.append('peerDependencies', JSON.stringify(peerDependencies));
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

  const response = await fetch(urlJoin(basePath, name.toLowerCase(), version), request);

  unlinkSync(file);

  if (response.status >= 400) {
    throw new Error(`Failed uploading bundle with status code: ${response.status}`);
  }

  const issues = Object.entries(await response.json()) as any;

  if (issues.length) {
    issues.forEach(([id, { mismatches }]) => {
      Object.entries(mismatches).forEach(([dependency, { host, component }]: any) =>
        console.warn(
          `WARNING: ${id} requires ${dependency}@${component} but host provides ${host}. Please consider upgrade to version ${component}`
        )
      );
    });
  }

  return { name, version };
};
