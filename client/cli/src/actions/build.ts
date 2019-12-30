import { STRING } from 'caporal';
import glob from 'glob';
import { getPackageJson } from '../../lib/utils';
import { registerCommand } from '../util';
import { build, BuildMode, BuildOptions } from '../../lib';
import { DcmConfig } from '..';

export default (config: DcmConfig) =>
  registerCommand({
    name: 'build',
    description: 'Build dynamic component',
    options: [['-m, --mode <mode>', 'mode', STRING, BuildMode.development], ['-d --dir <directory>', 'dir', STRING]],
    action: async ({ options: { mode, dir }, logger }) => {
      const workspaces: string[] = dir ? [dir] : (config && config.workspaces) || [process.cwd()];

      const dirs = workspaces.reduce(
        (acc: string[], dir: string) => {
          if (!dir.endsWith('/')) {
            dir += '/';
          }
          return [...acc, ...glob.sync(dir)];
        },
        [] as string[]
      );

      for (const dir of dirs) {
        const { name } = getPackageJson(dir);
        logger.info(`Building ${name}`);
        const buildConfig: BuildOptions = { mode, dir, modifyRollupConfig: config && config.modifyRollupConfig };
        await build(buildConfig);
      }
    }
  });
