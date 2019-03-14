import execa from 'execa';
import {resolve, sep} from 'path';
import uppercamelcase from 'uppercamelcase';

const cwd = resolve(__dirname, '..');
const dirname = process.cwd().split(sep).pop() as string;

export default () =>
  execa('npm', ['run', 'plop', 'component', process.cwd(), uppercamelcase(dirname)], {
    cwd,
    stdio: 'inherit'
  });