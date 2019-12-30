import { STRING } from 'caporal';
import { registerCommand } from '../util';
import { build, BuildMode, BuildOptions } from '../../lib';
import { DcmConfig } from '..';

export default (config: DcmConfig) =>
  registerCommand({
    name: 'build',
    description: 'Build dynamic component',
    options: [['-m, --mode <mode>', 'mode', STRING, BuildMode.development], ['-d --dir <directory>', 'dir', STRING]],
    action: ({ options: { mode, dir } }) => {
      let buildConfig: BuildOptions = { mode, dir, modifyRollupConfig: config && config.modifyRollupConfig };
      return build(buildConfig);
    }
  });
