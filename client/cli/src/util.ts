import program from 'caporal';
import updateNotifier from 'update-notifier';
import pTry from 'p-try';

import pkg from '../package.json';

export const notifier = updateNotifier({ pkg });

interface Command {
  name: string;
  alias?: string;
  description: string;
  action: Function;
  args?: string[][];
  options?: any[][];
}

interface ProcessError extends Error {
  isFatal: boolean;
}

const errorHandler = (err: ProcessError) => {
  console.error(err);
  if (err.isFatal) {
    process.exit(1);
  }
};

export const registerCommand = ({ name, alias, description, action, args = [], options = [] }: Command) => {
  const command = program.command(name, description);

  if (alias) {
    command.alias(alias);
  }

  args.forEach(([synopsis, description, ...args]) => command.argument(synopsis, description, ...args));

  options.forEach(([synopsis, description, ...options]) => command.option(synopsis, description, ...options));

  command.action((args, options, logger) =>
    pTry(() => action({ args, options, logger }))
      .then(() => notifier.notify())
      .catch(errorHandler)
  );
};
