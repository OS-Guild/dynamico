import { existsSync, writeFileSync } from 'fs';
import glob from 'glob';
import { resolve } from 'path';

type Dependencies = Record<string, string>;

export const getPackageJsonPath = (dir: string = '.') => resolve(dir, 'package.json');

export const getPackageJson = (dir?: string) => require(getPackageJsonPath(dir));

export const updatePackageJson = (newContents, dir?: string) =>
  writeFileSync(getPackageJsonPath(dir), JSON.stringify(newContents, null, 2));

export const getMainFile = (dir?: string): string => {
  const { main } = getPackageJson(dir);

  if (!main) {
    throw `package.json is missing "main" file`;
  }

  return main;
};

export const validateDependencies = (host: Dependencies, client: Dependencies, componentName: string, logger) => {
  Object.entries(client).forEach(([dep, version]) => {
    if (host[dep] && host[dep] !== version) {
      logger.warn(
        `host version received for ${dep} was ${host[dep]} but component ${componentName} is asking for version ${version}. Please consider matching the versions in order to prevent problems.`
      );
    }
  });
};

export const getComponentDirectories = (dir?: string, workspaces?: string[]) => {
  let globs: string[];
  if (dir) {
    globs = [dir];
  } else if (workspaces && workspaces.length > 0) {
    globs = workspaces;
  } else {
    return ['.'];
  }

  return globs
    .flatMap(dir => {
      if (!dir.endsWith('/')) {
        dir += '/';
      }

      return glob.sync(dir);
    })
    .filter(dir => existsSync(getPackageJsonPath(dir)));
};
