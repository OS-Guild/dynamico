import { STRING } from 'caporal';
import { registerCommand } from '../util';
import { build, BuildMode } from '../../lib';

registerCommand({
  name: 'build',
  description: 'Build dynamic component',
  options: [['-m, --mode <mode>', 'mode', STRING, BuildMode.development], ['-f --file <file>', 'file', STRING]],
  action: ({ options: { mode } }) => build({ mode })
});
