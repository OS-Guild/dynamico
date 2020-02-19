import { getPackageJson, updatePackageJson } from './utils';
import semver from 'semver';
import prompts from 'prompts';
import { writeFileSync } from 'fs';

interface Options {
  releaseType?: ReleaseType;
  dir?: string;
}

export const releaseTypes = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease'] as const;
type ReleaseType = typeof releaseTypes[number];

export default async ({ releaseType, dir }: Options = {}, logger: any) => {
  const packageJson = getPackageJson(dir);
  const currentVersion = packageJson.version;
  if (!semver.valid(currentVersion)) {
    return logger.error(`Component's version (${currentVersion}) is not in a valid semver format`);
  }

  if (!releaseType) {
    releaseType = (await prompts({
      type: 'select',
      name: 'releaseType',
      message: 'What is the version you would like to bump to?',
      choices: releaseTypes.map(type => ({ title: `${semver.inc(currentVersion, type)}`, value: type }))
    })).releaseType as ReleaseType;
  }

  packageJson.version = semver.inc(currentVersion, releaseType);
  updatePackageJson(packageJson, dir);
  logger.info(`Updated package version to ${packageJson.version}`);
};
