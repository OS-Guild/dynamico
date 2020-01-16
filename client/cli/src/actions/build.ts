import { BOOLEAN, STRING } from 'caporal';
import { getComponentDirectories, getPackageJson } from '../../lib/utils';
import { registerCommand } from '../util';
import { build, BuildMode, BuildOptions } from '../../lib';
import { DcmConfig } from '..';

export default (config: DcmConfig) =>
  registerCommand({
    name: 'build',
    description: 'Build dynamic component',
    options: [
      ['-m, --mode <mode>', 'mode', STRING, BuildMode.development],
      ['-d, --dir <directory>', 'dir', STRING],
      ['-p, --parallel', 'parallel', BOOLEAN, false]
    ],
    action: async ({ options: { mode, dir, parallel }, logger }) => {
      const dirs = getComponentDirectories(dir, config && config.workspaces);

      const buildDir = async dir => {
        const { name } = getPackageJson(dir);
        logger.info(`Building ${name}...`);
        const buildConfig: BuildOptions = { mode, dir, modifyRollupConfig: config && config.modifyRollupConfig };
        await build(buildConfig);
      };

      if (parallel) {
        return Promise.all(dirs.map(buildDir));
      }

      for (const dir of dirs) {
        await buildDir(dir);
      }
    }
  });
