import Liftoff from 'liftoff';
import program from 'caporal';
import { ExtendRollupConfig } from 'bili/types/types';
import { jsVariants } from 'interpret';
import { tmpdir } from 'os';

import logger from './logger';
import registerActions from './actions';
import { version, description } from '../package.json';

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
}

const Dcm = new Liftoff({
  name: 'dcm',
  configName: 'dcmconfig',
  extensions: jsVariants
});

export default (argv: string[]) =>
  Dcm.prepare({}, env =>
    Dcm.execute(env, () => {
      const config: DcmConfig = env.configPath ? require(env.configPath).default : undefined;

      registerActions(config);

      program.logger().info(`You can find the log file in ${logDir}/${logFileName}`);
      program.parse(argv);
    })
  );
