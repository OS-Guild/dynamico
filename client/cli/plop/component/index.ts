import uppercamelcase from 'uppercamelcase';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

import { Plop } from '../typings';

export default (plop: Plop) => {
  plop.addHelper('upperCase', (word: string) => uppercamelcase(word));

  plop.setGenerator('component', {
    description: 'create a dynamic component',
    prompts: [
      {
        type: 'input',
        name: 'path'
      },
      {
        type: 'input',
        name: 'name',
        message: 'What is the name of your component?',
        validate: ({ length }) => length ? true : 'name is required'
      },
      {
        type: 'list',
        name: 'framework',
        message: 'What framework are you using?',
        choices: () => {
          console.log(__dirname);
          return readdirSync('./plop/component')
          .filter(filename => statSync(join('./plop/component', filename)).isDirectory())
          .map(value => ({ name: uppercamelcase(value), value }));
        }
      },
      {
        type: 'input',
        name: 'application-version',
        message: 'What is the supported application version of your component?',
        validate: version => /^\d+\.\d+\.\d+/.test(version) ? true : 'version format is: [major].[minor].[patch] e.g (4.304.0)'
      },
      {
        type: 'input',
        name: 'component-version',
        message: 'What is version of your component?',
        default: '1.0.0',
        validate: version => /^\d+\.\d+\.\d+/.test(version) ? true : 'version format is: [major].[minor].[patch]'
      }
    ],
    actions: [
      {
        type: 'add',
        path: '{{path}}/index.js',
        templateFile: 'plop/component/{{framework}}/index.hbs'
      },
      {
        type: 'add',
        path: '{{path}}/package.json',
        templateFile: 'plop/component/{{framework}}/package.hbs'
      }
    ]
  })
}