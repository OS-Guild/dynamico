import program from 'caporal';

import { version, description } from '../package.json';

import './actions/init';
import './actions/start';
import './actions/build';

program.version(version).description(description);

export default (argv: string[]) => program.parse(argv);
