import {registerCommand} from '../util';
import {start} from '../../lib';

registerCommand({
  name: 'start',
  description: 'Start dynamic component dev server',
  action: () => start()
});