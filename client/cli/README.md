# Dynamico CLI

The dynamic component manager or in short the dcm is a cli tool to help you work and maintain a dynamic component.

## Installation

As a global cli tool

```bash
$ yarn global add @dynamico/cli
```

As a local cli tool or to use programmatically

```bash
$ yarn add -D @dynamico/cli
```

Use instantly

```bash
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

Just follow the instructions and enjoy and magic.

#### build

```bash
dcm build
```

`dcm` has a built-in bundler called [bili](https://github.com/egoist/bili) with support for all transpilers and languages.

So all you have to do is develop your dynamic component and let us handle the bundling for you.

###### options

| Paramerter   | Description | Default                             |
| ------------ | ----------- | ----------------------------------- |
| `-m, --mode` | Bundle mode | development                         |
| `-f, --file` | Entry file  | `main` property from `package.json` |

#### start

```bash
dcm start
```

In order to develop your dynamic component we've provided a live-server that handles bundling and serving of your component.

> Unless the port has changed, live-server will serve to `http://localhost:8383/`

Since it's only one part of the equation, you'd have to specify you are in dev mode in your dynamico client (e.g [@dynamico/react](), [@dynamico/angular](), etc..)

###### options

| Paramerter   | Description      | Default |
| ------------ | ---------------- | ------- |
| `-p, --port` | live server port | `8383`  |

#### publish

```bash
dcm publish
```

Before you feel you're ready to publish your component and start using it dynamically, make sure you fill In the `registry` property in the `dcmconfig` file that was created during the [init](#init) phase.

This command will bundle your component in production mode and will publish it to your dynamico registry server.

###### options

| Paramerter  | Description  | Default                                       |
| ----------- | ------------ | --------------------------------------------- |
| `-u, --url` | registry url | `registry` property from the `dcmconfig` file |

### Programmatically

> TODO

### dcmconfig file

dcm gets its config settings from the command line, environment variables, and **dcmconfig** files.

#### Config Settings

##### registry

- Type: url

The base URL of the dynamico components registry.

##### middleware

- Type: function

Middleware for the publish api, transform the request just before sending the code to the registry

#### NOTE

Since we use [Liftoff](https://github.com/js-cli/js-liftoff) dcm will automatically attempt to load the config via the correct module for any javascript variant supported by [interpret](https://github.com/js-cli/js-interpret) (as long as it does not require a register method).
