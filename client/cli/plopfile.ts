import {readdirSync, statSync} from 'fs';
import {join} from 'path';

module.exports = plop => {
    readdirSync('./plop')
        .filter(filename => statSync(join('./plop', filename)).isDirectory())
        .forEach(folder => require(`./plop/${folder}`).default(plop));
};