# S3 Storage
A storage provider that can be used by `@dynamico/driver` to manage components in S3.

## General
S3 storage hosts components in a specific bucket and expects to receive an initialized S3 client. It needs to have permissions for listing the objects in the bucket as well as read and write permissions. The write permission is required regardless of whether the server is set up to be read-only or not. The reason for this is that the server manages an index, which is saved as an object in the bucket. It uses the list permission to create the components versioning structure which is then used by the middleware when resolving the best component version.

__Note:__ this guide assumes you have an express server set up along with the express middleware. If this is not the case refer to our [Getting Started - Backend](../readme.md) guide.

## Getting Started With S3 Storage

Let's set up an S3 storage provider, it won't take more than a few minutes!

Start by installing the dependencies in your server:
```bash
$ npm install @dynamico/s3-storage aws-sdk --save
```

Now find the file where you initialized dynamico middleware and add the following `require` statements.

```javascript
const { S3Storage } = require('@dynamico/s3-storage');
const { S3 } = require('aws-sdk');
```

And initialize the client and the provider as  well as the middleware:

```javascript
const s3Client = new S3({
    credentials: {
        accessKeyId: /*Your access key ID*/,
        secretAccessKey: /*Your secret access key*/,
        region: /*The region in which the bucket is defined*/
    },
    apiVersion: '2006-03-01'
});
const bucketName = 'dynamic-components';
const storageProvider = new S3Storage({s3Client, bucketName});
const dynamicoMiddleware = dynamico(storageProvider);
// Use the middleware
```

And that's it! you now have a server that uses S3 storage to manage dynamic components.

The full code looks something like this:

```javascript
const express = require('express');
const dynamico = require('@dynamico/express-middleware');
const { S3Storage } = require('@dynamico/s3-storage');
const { S3 } = require('aws-sdk');

const s3Client = new S3({
    credentials: {
        accessKeyId: /*Your access key ID*/,
        secretAccessKey: /*Your secret access key*/,
        region: /*The region in which the bucket is defined*/
    },
    apiVersion: '2006-03-01'
});
const bucketName = 'dynamic-components';
const storageProvider = new S3Storage({s3Client, bucketName});

const app = express();
app.use('/api/components', dynamico(storageProvider);
app.listen(Number(process.env.PORT || 1234), () => {
  console.log(`Listening on port ${process.env.PORT}`);
});
```

You can now test your code by running the server and opening a browser and in `http://localhost:1234/api/components/someComponent`

The response should be 500 with an `InvalidVersionError`.

## API
* Constructor
    ```typescript
    constructor({ s3Client, bucketName }: Config)
    ```
    * Arguments
        * Config
            * s3Client
                * A properly initialized S3 client that conforms to the aws-sdk implementation.
            * bucketName
                * A string to be used as the bucket name for the components. You need to create the bucket and make sure the server has proper permissions for it.
    * Returns
        * A newly initialized S3 storage provider.
        
* getIndex
    ```typescript
    getIndex(): Promise<Index>
    ```
    * Returns
        * A promise that will be resolved to an object that implements the Index interface exported by `@dynamic/driver`. The index is created by getting an object named `index.json` that was created previously by the provider (or an empty object if it wasn't found).

* upsertIndex
    ```typescript
    upsertIndex(index: Index): Promise<void>
    ```
    * Arguments
        * An object that implements the Index interface exported by `@dynamico/driver`,to either replace the existing object or created for the first time.
    * Returns
        * Promise that will be resolved as soon as the object upload process finishes.

* getComponentTree
    ```typescript
    getComponentTree(): Promise<ComponentTree> 
    ```
    * Returns
        * A promise, that resolves to an object that implements the ComponentTree interface exported by `@dynamico/driver`. This object is constructed by listing the bucket's contents, and mapping the components names and versions to a function that reads the `package.json` object, using the provided S3 client.

* getComponent
    ```typescript
    getComponent(name: string, version: string): Promise<Maybe<ComponentGetter>>
    ```
    * Arguments
        * name
            * The requested component name.
        * version
            * The version in which this component's code should retrieved.
    * Returns
        * A promise, that, in case the component wasn't found will be resolved to `undefined` or an object that implements the ComponentGetter interface exported `@dynamico/driver`. The component will be searched in the bucket in `${name}/${version}/package.json`.

* saveComponent
    ```typescript
    saveComponent(component: Component, files: File[]): Promise<void>
    ```
    * Arguments
        * component
            * An object that implements the Component interface exported by `@dynamico/driver`.
        * files
            * An array of objects that implement the File interface exported by `@dynamico/driver`.
    * Returns
        * A promise that will be resolved when uploading all the provided files finishes. The files will be uploaded, prefixed with `${component.name.toLowerCase()}/${component.version}`.
    * Throws
        * `Missing package.json file`
            * If non of the files is named `package.json`.