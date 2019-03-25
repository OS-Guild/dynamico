import { STRING } from 'caporal';
import { registerCommand } from '../util';
import { publish } from '../../lib';
import { DcmConfig } from '..';

export default (config: DcmConfig) =>
  registerCommand({
    name: 'publish',
    description: 'Publish your dynamic component',
    options: [['-u, --url <url>', 'url', STRING]],
    action: ({ options: { url }, logger }) => {
      if (!config) {
        return logger.error(`Couldn't find 'dcmconfig' file, did you forget to create it?`);
      }

      if (!config.baseUrl) {
        return logger.error(`Couldn't find 'baseUrl' property in 'dcmconfig' file or it's empty`);
      }

      return publish(url || config.baseUrl)
        .then(({ url }: any) => logger.info('Successfully published to', url))
        .catch(logger.error);
    }
  });
