import { Request, Response } from 'express';
import { Driver } from '@dynamico/driver/lib';

export const get = (driver: Driver) => (req: Request, res: Response) => {
  const { name } = req.params;
  const { appVersion, componentVersion, latestComponentVersion } = req.query;

  const { version, getComponentCode } = driver.getComponent({
    name,
    appVersion,
    version: componentVersion
  });

  res.setHeader('Dynamico-Component-Version', version);

  if (latestComponentVersion === version) {
    return res.sendStatus(204);
  }

  return getComponentCode();
};
