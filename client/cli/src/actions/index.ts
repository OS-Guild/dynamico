import init from './init';
import build from './build';
import start from './start';
import publish from './publish';
import { DcmConfig } from '..';

export default (config: DcmConfig) => {
  [init, build, start, publish].forEach(action => {
    action(config);
  });
};
