import execa from 'execa';
import { resolve, sep } from 'path';

const cwd = resolve(__dirname, '..');
const dirname = process
  .cwd()
  .split(sep)
  .pop() as string;

export default () =>
  execa('npm', ['run', 'plop', 'component', process.cwd(), dirname], {
    cwd,
    stdio: 'inherit'
  });
