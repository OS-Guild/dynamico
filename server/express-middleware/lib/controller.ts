import { Request, Response } from 'express';
import { Driver, File } from '@dynamico/driver';
import tar from 'tar-stream';
import zlib from 'zlib';
import intoStream from 'into-stream';
import { Stream } from 'stream';
import promisePipe from 'promisepipe';

export const get = (driver: Driver) => (req: Request, res: Response) => {
  const { name } = req.params;
  const { hostId, componentVersion, latestComponentVersion } = req.query;

  const { version, getCode } = driver.getComponent({
    hostId,
    name,
    version: componentVersion
  });

  res.setHeader('Dynamico-Component-Version', version);

  if (latestComponentVersion === version) {
    return res.sendStatus(204);
  }

  return getCode();
};

export const registerHost = (driver: Driver) => async (req: Request) => driver.registerHost(req.body);

export const save = (driver: Driver) => async (req: Request, res: Response) => {
  const { name, componentVersion } = req.params;
  const files: File[] = [];

  await promisePipe(
    intoStream(req.file.buffer),
    zlib.createGunzip(),
    tar.extract().on('entry', (header, stream: Stream, next) => {
      files.push({ name: header.name, stream: stream.on('finish', next) });
    })
  );

  driver.saveComponent(
    {
      name,
      version: componentVersion,
      dependencies: JSON.parse(req.body.peerDependencies)
    },
    files
  );

  res.sendStatus(201);
};
