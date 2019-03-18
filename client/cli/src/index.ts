import program from 'caporal';

import { version, description } from '../package.json';

import './actions/init';
import './actions/start';

program.version(version).description(description);

export default argv => program.parse(argv);
