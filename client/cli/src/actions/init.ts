import { registerCommand } from '../util';
import { init } from '../../lib';

export default () =>
  registerCommand({
    name: 'init',
    description: 'Init your dynamic component',
    action: () => init()
  });
