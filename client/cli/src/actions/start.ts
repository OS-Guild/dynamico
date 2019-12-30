import { INT, STRING } from 'caporal';
import { registerCommand } from '../util';
import { start, DEFAULT_DEV_PORT } from '../../lib';
import { DcmConfig } from '..';

export default (config: DcmConfig) =>
  registerCommand({
    name: 'start',
    description: 'Start dynamic component dev server',
    options: [['-p, --port <port>', `dev server port`, INT, DEFAULT_DEV_PORT], ['-d --dir <directory>', 'dir', STRING]],
    action: ({ options: { port, dir }, logger }) =>
      start(
        logger,
        { port, workspaces: config && config.workspaces },
        { dir, modifyRollupConfig: config && config.modifyRollupConfig }
      )
  });
