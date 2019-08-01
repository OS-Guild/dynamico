import { registerCommand } from '../util';
import { bumpVersion, releaseTypes } from '../../lib';

export default () =>
  registerCommand({
    name: 'version',
    description: 'Bump dynamic component version in package.json file',
    options: [
      ['-r, --releaseType <releaseType>', `releaseType, must be one of <${releaseTypes.join(', ')}>`, releaseTypes]
    ],
    action: ({ options: { releaseType }, logger }) => bumpVersion({ releaseType }, logger)
  });
