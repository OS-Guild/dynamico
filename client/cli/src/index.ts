import { ExtendRollupConfig } from 'bili/types/types';
import program from 'caporal';
import { tmpdir } from 'os';
import { description, version } from '../package.json';
import registerActions from './actions';
import { getConfig } from './config';

import logger from './logger';

const logDir = `${tmpdir()}\dcm`;
const logFileName = `dcm-${new Date().toLocaleString().replace(' ', '_')}`;

program
  .version(version)
  .description(description)
  .logger(logger({ logDir, logFileName }) as any);

export interface DcmConfig {
  registry: string;
  middleware?: Function;
  modifyRollupConfig?: ExtendRollupConfig;
  workspaces?: string[];
}

export default (argv: string[]) =>
  getConfig().then(config => {
    registerActions(config);

    program.logger().info(`You can find the log file in ${logDir}/${logFileName}`);
    program.parse(argv);
  });
