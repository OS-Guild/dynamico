const path = require('path');
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageDirectory: `../../coverage/${path
    .normalize(__dirname)
    .split('/')
    .pop()}/`
};
