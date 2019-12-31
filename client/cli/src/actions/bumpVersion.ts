import { STRING } from 'caporal';
import { DcmConfig } from '..';
import { registerCommand } from '../util';
import { bumpVersion, releaseTypes } from '../../lib';

export default (config: DcmConfig) =>
  registerCommand({
    name: 'version',
    description: 'Bump dynamic component version in package.json file',
    options: [
      ['-r, --releaseType <releaseType>', `releaseType, must be one of <${releaseTypes.join(', ')}>`, releaseTypes],
      ['-d, --dir <directory>', 'dir', STRING]
    ],
    action: ({ options: { releaseType, dir }, logger }) => {
      if (config && config.workspaces) {
        if (!dir) {
          return logger.error('Please specify component');
        }
      }

      return bumpVersion({ releaseType, dir }, logger);
    }
  });
