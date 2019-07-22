# Redis Index Storage
An index storage provider that can be used along with a components storage by `@dynamico/driver` to manage index in redis.

## General
Redis index storage expects to receive an initialized redis client and optionally a key name to use to save the index. It saves the index as a JSON string in a string typed value.

__Note:__ this guide assumes you have an express server set up along with the dynamico express middleware, and have [composition storage](../composition-storage/README.md) ready to be used. If this is not the case refer to our [Getting Started - Backend](../readme.md) guide.

## Getting Started With redis index storage
Let's setup a redis index stroage provider, it'll be super fast and super fun!
Start by installing the required dependencies in your server:
```
$ npm install @dynamico/redis-index-storage redis --save
```
Now find the file where you initialized dynamico middleware and add the following `require` statements:
```javascript
const { RedisIndexStorage } = require('@dynamico/redis-index-storage');
const { redis } = require('redis');
```
Now let's create a redis client and use it to initialize the storage.
```javascript
const redisClient = redis.createClient(/*options for connecting to your redis instance*/);
const indexKeyName = 'dynamico-index';
const indexStorage = new RedisIndexStorage(redisClient, indexKeyName);
```

With this we have everything we need to initialize our [CompositionStorage](../composition-storage/README.md).

## API
* constructor
    ```typescript
    constructor(redisClient: RedisClient, indexKeyName = 'index')
    ```
    * Arguments
        * redisClient
            * An initialized and authenticated redisClient that conforms to node redis client.
        * indexKeyName
            * An optional argument to change the key name that is used to save the index. Defaults to `index`.
* getIndex
    ```typescript
    getIndex(): Promise<Index>
    ```
    * Returns
        * A promise that will be resolved to an object that implements the Index interface exported by `@dynamic/driver`. The index is create by reading the key name that was provided in the contructor and `JSON.parse`ing it. If no value is found for this key an empty object is returned.
* upsertIndex
    ```typescript
    upsertIndex(index: Index): Promise<void>
    ```
    * Arguments
        * index
            * An object that implements the Index interface exported by `@dynamico/driver`,to either replace the existing object or created for the first time.
    * Returns
        * A promise that will be resolved as soon as the index is converted into a string by running `JSON.strigify` on it and saving it to the storage.