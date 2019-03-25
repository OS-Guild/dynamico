import FormData from 'form-data';
import fetch from 'node-fetch';
import { createReadStream, createWriteStream } from 'fs';
import tar from 'tar';
import { tmpdir } from 'os';
import { join } from 'path';
import build, { Mode } from './build';
import urlJoin from 'url-join';

export default async (basePath: string) => {
  const body = new FormData();

  const file = join(tmpdir(), 'tmp.tgz');

  const { name, version, hostVersion, main } = await build({ mode: Mode.production });

  return new Promise((resolve, reject) => {
    tar
      .create({ gzip: true, cwd: './dist' }, [main, 'package.json'])
      .pipe(createWriteStream(file))
      .on('error', reject)
      .on('finish', () => {
        body.append('package', createReadStream(file));

        resolve(
          fetch(urlJoin(basePath, name.toLowerCase(), hostVersion, version), {
            method: 'POST',
            body
          })
        );
      });
  });
};
