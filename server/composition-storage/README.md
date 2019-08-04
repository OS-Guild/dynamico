# Composition Storage
A storage provider that allows you to separate the way you save dynamico's index from your components' code.

## General
Composition storage implements the `Storage` interface by proxying calls to an `IndexStorage` when saving and retrieving the index and proxying calls to a `ComponentsStorage` when saving, retrieving and listing components. The index's job is to map host apps to the relevant component version. This mapping helps dynamico server to figure out the correct version of the component the client should get. That means that the faster this storage responds the faster clients get a response when retrieving a component (or just making sure their local cache is up to date). For components you can use a slower and cheaper storage (e.g. S3). That's because the component's code is cached locally at the client so these downloads won't happen too often. Also, these types of storage often come hand in hand with a CDN solution that is easily deployed (e.g. CloudFront), giving you even faster access to the code, while it might not be relevant for an index.

__Note:__ this guide assumes you have an express server set up along with the express middleware. If this is not the case refer to our [Getting Started - Backend](../readme.md) guide.

## Getting Started With Composition Storage
Let's set up a composition storage with redis and S3. It'll only take a few moments and it's totally worth it!

In this guide we'll initialize a [dynamico S3 storage provider](../s3-storage/README.md), which implements the `ComponentsStorage` interface and a [dynamico redis index storage](../redis-storage/README.md), which implements the `IndexStorage` interface. When we have both set up and ready we will create a `CompositionStorage` that will use both to provide storage services for our server.

First, let's start by installing all of the required dependencies:
```bash
$ npm install @dynamico/s3-storage aws-sdk @dynamico/redis-index-storage redis @dynamico/composition-storage --save
```

We install 5 packages here:
* `@dynamico/s3-storage` - required for the server to access our components' storage.
* `aws-sdk` - required by `@dynamico/s3-storage` to access our S3 bucket.
* `@dynamico/redis-index-storage` - required for the server to access our index storage.
* `redis` - required by `@dynamico/redis-index-storage` to access our redis key.
* `@dynamico/composition-storage` - required to connect the two types of storage and provide a full implementation of the `Storage` interface the server requires.

Next we want to initialize our storage providers. We'll start with our S3 storage provider.

Find the file where you initialized dynamico middleware and add the following `require` statements:
```javascript
const { S3Storage } = require('@dynamico/s3-storage');
const { S3 } = require('aws-sdk');
```

Now we'll initialize the client and storage providere:
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
const componentsStorage = new S3Storage({s3Client, bucketName});
```

Now that we have our components storage set up let's create a redis index provider.

In the same file add these `require` statements:
```javascript
const redis = require('redis');
const { RedisIndexStorage } = require('@dynamico/redis-index-storage');
```

And add the initialization code:
```javascript
const redisClient = redis.createClient(/*options for connecting to your redis instance*/);
const indexKeyName = 'dynamico-index';
const indexStorage = new RedisIndexStorage(redisClient, indexKeyName);
```

At this point we have everything we need to set up our composition storage and pass it to our middleware!

In the same file add this `require` statement:
```javascript
const { CompositionStorage } = require('@dynamico/composition-storage');
```

And add these lines after the initialization of both storage providers:
```javascript
const storageProvider = new CompositionStorage(indexStorage, componentsStorage);
const dynamicoMiddleware = dynamico(storageProvider);
// Use the middleware
```

That is it! You now have a dynamico server that has two storage providers, one redis connection to manage index and one S3 to manage components!

The full code looks like this:
```javascript
const express = require('express');
const { S3Storage } = require('@dynamico/s3-storage');
const { S3 } = require('aws-sdk');
const redis = require('redis');
const { RedisIndexStorage } = require('@dynamico/redis-index-storage');
const { CompositionStorage } = require('@dynamico/composition-storage');

const s3Client = new S3({
    credentials: {
        accessKeyId: /*Your access key ID*/,
        secretAccessKey: /*Your secret access key*/,
        region: /*The region in which the bucket is defined*/
    },
    apiVersion: '2006-03-01'
});
const bucketName = 'dynamic-components';
const componentsStorage = new S3Storage({s3Client, bucketName});

const redisClient = redis.createClient(/*options for connecting to your redis instance*/);
const indexKeyName = 'dynamico-index';
const indexStorage = new RedisIndexStorage(redisClient, indexKeyName);

const storageProvider = new CompositionStorage(indexStorage, componentsStorage);
const dynamicoMiddleware = dynamico(storageProvider);

const app = express();
app.use('/api/components', dynamico(storageProvider);
app.listen(Number(process.env.PORT || 1234), () => {
  console.log(`Listening on port ${process.env.PORT}`);
});
```

You can now test your code by running the server and opening a browser and in `http://localhost:1234/api/components/someComponent`

The response should be 500 with an `InvalidVersionError`.

## API
* constructor
    ```typescript
    constructor(indexStorage: IndexStorage, componentsStorage: ComponentsStorage)
    ```
    * Arguments
        * indexStorage
            * an initialized object that conforms to the 
            `IndexStorage` interface.
        * componentsStorage
            * an initialized object that conforms to the `ComponentsStorage` interface.
    * Returns
        * A newly initialized composition storage provider.
* getIndex
    ```typescript
    getIndex(): Promise<Index>
    ```
    * Returns
        * The result of calling this function on the index storage that was provided in the contructor.
* upsertIndex
    ```typescript
    upsertIndex(index: Index): Promise<void>
    ```
    * Arguments
        * index
            * An object that implements the Index interface exported by `@dynamico/driver`, to either replace the existing object or created for the first time. This argument is passed to the index storage that was provided in the contructor.
    * Returns
        * The result of calling this function on the index storage that was provided in the contructor.
* getComponentTree
    ```typescript
    getComponentTree(): Promise<ComponentTree>
    ```
    * Returns
        * The result of calling this function on the components storage that was provided in the contructor.
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
        * The result of calling this function on the components storage that was provided in the contructor.
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
        * The result of calling this function on the components storage that was provided in the contructor.