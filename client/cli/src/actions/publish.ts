import { STRING } from 'caporal';
import { getComponentDirectories, getPackageJson } from '../../lib/utils';
import { registerCommand } from '../util';
import { publish } from '../../lib';
import { DcmConfig } from '..';

export default (config: DcmConfig) =>
  registerCommand({
    name: 'publish',
    description: 'Publish your dynamic component',
    options: [['-u, --url <url>', 'url', STRING], ['-d --dir <directory>', 'dir', STRING]],
    action: async ({ options: { url, dir }, logger }) => {
      if (!url) {
        if (!config) {
          return logger.error(`Couldn't find 'dcmconfig' file, did you forget to create it?`);
        }

        if (!config.registry) {
          return logger.error(`Couldn't find 'registry' property in 'dcmconfig' file or it's empty`);
        }

        url = config.registry;
      }

      const dirs = getComponentDirectories(dir, config && config.workspaces);

      for (const dir of dirs) {
        const { name } = getPackageJson(dir);
        logger.info(`Publishing ${name}...`);

        try {
          const { name, version } = await publish(url, config && config.middleware, {
            dir,
            modifyRollupConfig: config && config.modifyRollupConfig
          });
          logger.info(`Successfully published ${name}@${version}`);
        } catch (err) {
          return logger.error(`Failed publishing ${name}: ${err.message}`);
        }
      }
    }
  });
