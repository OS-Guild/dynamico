import { INT, STRING } from 'caporal';
import { getComponentDirectories } from '../../lib/utils';
import { mergeConfigs } from '../config';
import { registerCommand } from '../util';
import { start, DEFAULT_DEV_PORT } from '../../lib';
import { DcmConfig } from '..';

export default (config?: DcmConfig) =>
  registerCommand({
    name: 'start',
    description: 'Start dynamic component dev server',
    options: [
      ['-p, --port <port>', `dev server port`, INT, DEFAULT_DEV_PORT],
      ['-d, --dir <directory>', 'dir', STRING]
    ],
    action: async ({ options: { port, dir }, logger }) => {
      const dirs = getComponentDirectories(dir, config?.workspaces);
      const components = await Promise.all(
        dirs.map(async dir => {
          const workingConfig = await mergeConfigs(config, dir);
          return [dir, workingConfig?.modifyRollupConfig] as const;
        })
      );

      return start(logger, { port, components });
    }
  });
