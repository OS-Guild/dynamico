import { resolve } from 'path';

const dir = process.cwd();

export const getMainFile = (): string => {
  const { main } = require(resolve(dir, `package.json`));

  if (!main) {
    throw `package.json is missing "main" file`;
  }

  return main;
};
