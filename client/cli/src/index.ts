import Liftoff from 'liftoff';
import program from 'caporal';
import { jsVariants } from 'interpret';

import registerActions from './actions';
import { version, description } from '../package.json';

program.version(version).description(description);

export interface DcmConfig {
  baseUrl: string;
  middleware?: Function;
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

      program.parse(argv);
    })
  );
