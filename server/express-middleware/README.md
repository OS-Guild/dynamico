# `express-middleware`
An express middleware to serve and register remote dynamic components.

## General
The middleware is used by `@dynamico/core` and `@dynamico/cli` so usually you won't have to call the routes here your self. If you still want to learn more go to the [Routes](#Routes) section. If you just want to start using `@dynamico` jump straight in to the [Installation](#Installation) and [Initialization](#Initialization) sections.

## Installation
Add the library along with the required dependencies to your server. You need to provide some storage provider. This is example uses the file system storage provider:
``` bash
$ yarn add @dynamico/express-middleware
$ yarn add @dynamico/driver
$ yarn add @dynamico/fs-storage
```
## Initialization
The middleware takes as an argument an instance of a `@dynamico/driver` initialized with an object that implements the `Storage` interface exported by the driver. In this example we'll use `@dynamico/fs-storage`, but you should check out the other options (or implement a better one!).
Here is an example for initializing the middleware, prefixing the route with `/api/components`.
``` javascript
const dynamicoMiddleware = require('@dynamico/express-middleware');
app.use('/api/components', dynamicoMiddleware(new FSStorage('./components')));
```

## API
``` typescript
dynamicoMiddleware(storage: Storage, { readOnly }: Options = {}): AsyncRouterInstance
```
### Arguments
* storage (required) 
    * An implementation of the Storage interface exported from `@dynamico/driver`. (Check out `@dynamico/s3-storage` for production usage).
* Options (optional)
    * readOnly: boolean? - whether or not the middleware should expose an endpoint to save a component. use this option to create a separate server.

### Returns
* A middleware ready to be used by your express app.

## Routes
The middleware exposes a few routes that both `@dynamico/core` and `@dynamico/cli` know how to use.
* `POST /host/register`
    * This route is used by host apps to register their dependencies with the server and get a hostId to be used in later requests for components. This route uses `@dynamico/driver` to index the host and retrieve the hostId.
    * Body
        * The body of the request is expected to be in JSON format (uses `bodyParser.json` behind the scenes).
        * The body is expected to be a simple object that maps dependencies to their corresponding version in semver compatible format, similar the dependencies section of a `package.json` file.
    * Returns
        * Body
            * `id` - the calculated host Id as determined by the provided `@dynamico/driver`.
            * `issues` - version mismatches the driver found during the indexing process between the host's dependencies and the dependencies of all other currently available components.
            
                **Note:** This will be returned only the first time a certain list of dependencies is registered, as the rest of the time the default driver implementation calculates the hostId, figures out it was already indexed and just returns it.
* `GET /:name`
    * This route is used by host apps to retrieve components code. This route uses `@dynamico/driver` to figure out the best version and retrieve the code from the Storage instance it was initialized with.
    * Route parameters
        * `/:name`
            * Expected to be an existing component's name as mentioned in the component's package.json file when it was uploaded.
    * Query parameters
        * `hostId`
            * An ID that was previously retrieved by calling `/host/register`.
                * Used by `@dynamico/driver` to find the best matching component version quickly.
        * `latestComponentVersion` (optional)
            * If present, expected to be a version in a valid semver format. 
            * Used by the controller to determine whether the caller should get a new version of the code or use the one it has cached locally.
        * `componentVersion` (optional)
            * If present, expected to be a version in a valid semver format.
            * Used by `@dynamico/driver` to get a specific component version. If specified no resolution process will happen and the driver will just return this version if it exists or throw an error if it doesn't.
    * Returns
        * Status code:
            * 200
                * Everything went well and the server was able to retrieve a component's code the matches the parameters you provided.
            * 204
                * Everything went well and the server determined that you can use the version of the component you provided in `latestComponentVersion` parameter.
            * 500
                * An error occurred during the resolution process.
        * Body
            * If a status code of 200 was returned you can expect the body of the response to be the code of the resolved component.
        * Headers
            * `Dynamico-Component-Version`
                * This will contain the resolved component's version.
        * Errors
            * `Invalid component version`
                * If either `latestComponentVersion` or `componentVersion` query parameters are not in a valid semver format.

* `POST /:name/:componentVersion`
    * This route is used by `@dynamico/cli` to publish new component code and verify with which already registered host apps this component is going to be compatible and provides insights into possible issues. This endpoint is exposed only if the middleware wasn't initialized in read only mode.
    * Route Parameters
        * `:name`
            * The name of the component that is uploaded in this request.
        * `:componentVersion`
            * The version of the component the is uploaded in this request. Expected to be in a valid semver format.
    * Body
        * The body of the request is expected to be in `multipart` upload format that provides both the component's package.json and the code for the component, in a gzipped tarball format. uses `multer` and `bodyParser.raw` behind the scenes.
    * Returns
        * Status
            * 200
                * Everything went well and the component was published successfully.
        * Body
            * `issues`
                * Will contain the version mismatches the `@dynamico/driver` between the component's dependencies (taken from the `peerDependencies` section) and all the previously registered host app.
        * Errors
            * 'Invalid component version`
                * If `:componentVersion` route parameter is not a valid semver.
        
        