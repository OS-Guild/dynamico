import {registerCommand} from '../util';
import {init} from '../../lib';

registerCommand({
  name: 'init',
  description: 'Init your dynamic component',
  action: () => init()
});
