import init from './init';
import build from './build';
import start from './start';
import publish from './publish';
import bumpVersion from './bumpVersion';
import { DcmConfig } from '..';

export default (config: DcmConfig) => {
  [init, build, start, publish, bumpVersion].forEach(action => {
    action(config);
  });
};
