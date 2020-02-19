import { STRING } from 'caporal';
import { getPackageJson } from '../../lib/utils';
import { registerCommand } from '../util';
import { publish } from '../../lib';
import { DcmConfig } from '..';
import { mergeConfigs } from '../config';

export default (config?: DcmConfig) =>
  registerCommand({
    name: 'publish',
    description: 'Publish your dynamic component',
    options: [
      ['-u, --url <url>', 'url', STRING],
      ['-d, --dir <directory>', 'dir', STRING]
    ],
    action: async ({ options: { url, dir }, logger }) => {
      if (config && config.workspaces && !dir) {
        return logger.error('Please specify directory to publish');
      }

      config = await mergeConfigs(config, dir);

      if (!url) {
        if (!config) {
          return logger.error(`Couldn't find 'dcmconfig' file, did you forget to create it?`);
        }

        if (!config.registry) {
          return logger.error(`Couldn't find 'registry' property in 'dcmconfig' file or it's empty`);
        }

        url = config.registry;
      }

      const { name } = getPackageJson(dir);
      logger.info(`Publishing ${name}...`);

      try {
        const { name, version } = await publish(url, config?.middleware, {
          dir,
          modifyRollupConfig: config?.modifyRollupConfig
        });
        logger.info(`Successfully published ${name}@${version}`);
      } catch (err) {
        return logger.error(`Failed publishing ${name}: ${err.message}`);
      }
    }
  });
