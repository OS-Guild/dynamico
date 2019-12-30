import { STRING } from 'caporal';
import { getComponentDirectories, getPackageJson } from '../../lib/utils';
import { registerCommand } from '../util';
import { build, BuildMode, BuildOptions } from '../../lib';
import { DcmConfig } from '..';

export default (config: DcmConfig) =>
  registerCommand({
    name: 'build',
    description: 'Build dynamic component',
    options: [['-m, --mode <mode>', 'mode', STRING, BuildMode.development], ['-d --dir <directory>', 'dir', STRING]],
    action: async ({ options: { mode, dir }, logger }) => {
      const dirs = getComponentDirectories(dir, config && config.workspaces);

      for (const dir of dirs) {
        const { name } = getPackageJson(dir);
        logger.info(`Building ${name}...`);
        const buildConfig: BuildOptions = { mode, dir, modifyRollupConfig: config && config.modifyRollupConfig };
        await build(buildConfig);
      }
    }
  });
