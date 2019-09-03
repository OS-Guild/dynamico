# Dynamico CLI

The dynamic component manager or in short the dcm is a cli tool to help you work and maintain a dynamic component.

## Installation
As a global cli tool
``` bash
$ yarn global add @dynamico/cli
```

As a local cli tool or to use programmatically
``` bash
$ yarn add -D @dynamico/cli
```

Use instantly
``` bash
$ npx dcm
```
## Usage
### CLI
#### Options
```bash

$  dcm 0.0.1 - Dynamic components manager

   USAGE

     dcm <command> [options]

   COMMANDS

     init                Init your dynamic component
     build               Build dynamic component
     start               Start dynamic component dev server
     publish             Publish your dynamic component
     bump                Bump dynamic component version in package.json file
     help <command>      Display help for a specific command

   GLOBAL OPTIONS

     -h, --help         Display help
     -V, --version      Display version
     --no-color         Disable colors
     --quiet            Quiet mode - only displays warn and error messages
     -v, --verbose      Verbose mode - will also output debug messages
     
```

#### Synonym
This module is exported as `dcm`.

#### Init
```bash=
mkdir my-component
cd ./my-component
git init
dcm init
yarn
```

In order to properly init your new dynamic component create a new folder and init a new git repository, use the cli to init your new component, you will be asked several questions that will help you get started with your favorite framework / language.

We use [plop](https://github.com/amwmedia/plop), it's a micro generator that will help you to create up-to date components with ease.

Just follow the instructions and enjoy the magic. 

#### build
```bash
dcm build
```

`dcm` has a built-in bundler called [bili](https://github.com/egoist/bili) with support for all transpilers and languages as long as you have the correct loader installed.

So all you have to do is develop your dynamic component and let us handle the bundling for you.

###### options

| Paramerter  | Description | Default
| - | - | - |
| `-m, --mode` | Bundle mode | development
| `-f, --file` | Entry file | `main` property from `package.json`

#### start
```bash
dcm start
```

In order to develop your dynamic component we've provided a live-server that handles bundling and serving of your component.

> Unless the port was changed, live-server will serve to `http://localhost:8383/`

Since it's only one part of the equation, you'd have to specify you are in dev mode in your dynamico client (e.g [@dynamico/react](), [@dynamico/angular](), etc..)

###### options

| Paramerter  | Description | Default
| - | - | - |
| `-p, --port` | live server port | `8383`

#### publish

```bash
dcm publish
```

Before you feel you're ready to publish your component and start using it dynamically, make sure you fill In the `registry` property in the `dcm.config` file that was created during the [init](#init) phase.

This command will bundle your component in production mode and will publish it to your dynamico registry server.

###### options

| Paramerter  | Description | Default
| - | - | - |
| `-u, --url` | registry url | `registry` property from the `dcm.config` file

#### bump

```bash
dcm bump
```

This command advances the version field in you `package.json` file. You can control which part of the version to advance by specifying the `releaseType` option. If no option is specified you will be prompted for the value. The version field must be in a valid semver format.

###### options

| Paramerter  | Description | Default
| - | - | - |
| `-r, --releaseType` | releaseType, must be one of [major, minor, patch, premajor, preminor, prepatch] | N/A

### Programmatically

> TODO

### dcm.config file

dcm gets its config settings from the command line, environment variables, and **dcm.config** files. dcm.config is a javascript file that should export an object with the following properties:

#### Config Settings
##### registry
* Type: `string`

The base URL of the dynamico components registry.


##### middleware
* Type: `Function`

Middleware for the publish api, transform the request just before sending the code to the registry. This is where you can add authentication settings (e.g. API key).

##### modifyRollupConfig
* Type: `Function`
Use this function to modify the Rollup config used by `dcm`. You can use this function to add Rollup plugins. Read more [here](https://rollupjs.org/guide/en/#rolluprollup).

#### NOTE

Since we use [Liftoff](https://github.com/js-cli/js-liftoff),
dcm will automatically attempt to load the config via the correct module for any javascript variant supported by [interpret](https://github.com/js-cli/js-interpret) as long as you have the correct loader installed.
