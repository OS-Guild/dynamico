import { createLogger, format, transports, config, Logger } from 'winston';
const { combine, timestamp, label, printf, colorize } = format;

const formatter = printf(
  ({ level, message, label, timestamp }) =>
    `${new Date(timestamp).toLocaleTimeString()} [${label}] ${level}: ${message}`
);
const baseFormat = combine(label({ label: 'dcm' }), timestamp(), colorize({ level: true }), formatter);

interface LogOptions {
  logDir: string;
  logFileName: string;
}

export default ({ logDir, logFileName }: LogOptions) =>
  createLogger({
    format: baseFormat,
    transports: [
      new transports.Console({}),
      new transports.File({
        filename: logFileName,
        dirname: logDir
      })
    ],
    levels: config.cli.levels,
    level: 'info'
  });
