import { STRING } from 'caporal';
import { registerCommand } from '../util';
import { publish } from '../../lib';
import { DcmConfig } from '..';

export default (config: DcmConfig) =>
  registerCommand({
    name: 'publish',
    description: 'Publish your dynamic component',
    options: [['-u, --url <url>', 'url', STRING], ['-d --dir <directory>', 'dir', STRING]],
    action: ({ options: { url, dir }, logger }) => {
      if (!url) {
        if (!config) {
          return logger.error(`Couldn't find 'dcmconfig' file, did you forget to create it?`);
        }

        if (!config.registry) {
          return logger.error(`Couldn't find 'registry' property in 'dcmconfig' file or it's empty`);
        }

        url = config.registry;
      }

      logger.info('Publishing...');

      return publish(url, config && config.middleware, { dir, modifyRollupConfig: config && config.modifyRollupConfig })
        .then(({ name, version }: any) => logger.info(`Successfully published ${name}@${version}`))
        .catch(({ message }) => logger.error(message));
    }
  });
