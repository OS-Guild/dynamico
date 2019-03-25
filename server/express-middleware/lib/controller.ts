import { Request, Response } from 'express';
import { Driver, File } from '@dynamico/driver';
import tar from 'tar-stream';
import zlib from 'zlib';
import intoStream from 'into-stream';
import { Stream, Writable } from 'stream';

export const get = (driver: Driver) => (req: Request, res: Response) => {
  const { name } = req.params;
  const { hostVersion, componentVersion, latestComponentVersion } = req.query;

  const { version, getComponentCode } = driver.getComponent({
    name,
    hostVersion,
    version: componentVersion
  });

  res.setHeader('Dynamico-Component-Version', version);

  if (latestComponentVersion === version) {
    return res.sendStatus(204);
  }

  return getComponentCode();
};

export const save = (driver: Driver) => async (req: Request, res: Response) => {
  const { name, hostVersion, componentVersion } = req.params;

  const files: File[] = [];
  intoStream(req.file.buffer)
    .pipe(zlib.createGunzip())
    .pipe(tar.extract())
    .on('entry', (header, stream: Stream, next) => {
      files.push({ name: header.name, stream: stream.on('finish', next) });
    })
    .on('finish', () => {
      driver.saveComponent(
        {
          name,
          hostVersion,
          version: componentVersion
        },
        files
      );
    });
};
