import { resolve } from 'path';

const dir = process.cwd();

export const getPackageJson = () => require(resolve(dir, `package.json`));

export const getMainFile = (): string => {
  const { main } = getPackageJson();

  if (!main) {
    throw `package.json is missing "main" file`;
  }

  return main;
};
