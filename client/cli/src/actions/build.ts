import { STRING } from 'caporal';
import { registerCommand } from '../util';
import { build, BuildMode, BuildOptions } from '../../lib';
import { DcmConfig } from '..';

export default (config: DcmConfig) =>
  registerCommand({
    name: 'build',
    description: 'Build dynamic component',
    options: [['-m, --mode <mode>', 'mode', STRING, BuildMode.development], ['-f --file <file>', 'file', STRING]],
    action: ({ options: { mode } }) => {
      let buildConfig: BuildOptions = { mode, modifyRollupConfig: config && config.modifyRollupConfig };
      return build(buildConfig);
    }
  });
