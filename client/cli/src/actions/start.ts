import { INT } from 'caporal';
import { registerCommand } from '../util';
import { start, DEFAULT_DEV_PORT } from '../../lib';

registerCommand({
  name: 'start',
  description: 'Start dynamic component dev server',
  options: [['-p, --port <port>', `dev server port`, INT, DEFAULT_DEV_PORT]],
  action: ({ options: { port } }) => start({ port })
});
