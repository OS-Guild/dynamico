import { Request, Response } from 'express';
import { Driver, File } from '@dynamico/driver';
import tar from 'tar-stream';
import zlib from 'zlib';
import intoStream from 'into-stream';
import { valid, clean } from 'semver';
import sanitizeFilename from 'sanitize-filename';
import { Stream } from 'stream';
import promisePipe from 'promisepipe';
import { InvalidVersionError } from './errors';
import ReadableStreamClone from 'readable-stream-clone';

export const get = (driver: Driver) => async (req: Request, res: Response) => {
  if (req.query.componentVersion && !valid(req.query.componentVersion)) {
    throw new InvalidVersionError({ componentVersion: req.query.componentVersion });
  }

  const name = sanitizeFilename(req.params.name);
  const { hostId, componentVersion } = req.query;

  const { version, getCode } = await driver.getComponent({
    hostId,
    name,
    version: componentVersion
  });

  res.setHeader('Dynamico-Component-Version', version);

  return getCode();
};

export const registerHost = (driver: Driver) => async (req: Request) => driver.registerHost(req.body);

export const save = (driver: Driver) => async (req: Request, res: Response) => {
  const name = sanitizeFilename(req.params.name);
  if (!valid(req.params.componentVersion)) {
    throw new InvalidVersionError({ componentVersion: req.params.componentVersion });
  }
  let componentVersion = clean(req.params.componentVersion) as string;
  const files: File[] = [];

  await promisePipe(
    intoStream(req.file.buffer),
    zlib.createGunzip(),
    tar.extract().on('entry', (header, stream: Stream, next) => {
      files.push({ name: sanitizeFilename(header.name), stream: new ReadableStreamClone(stream) });
      next();
    })
  );

  const issues = await driver.saveComponent(
    {
      name,
      version: componentVersion,
      dependencies: JSON.parse(req.body.peerDependencies)
    },
    files
  );

  res.json(issues);
};
