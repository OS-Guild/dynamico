# `s3-storage`
A storage provider that can be used by `@dynamico/driver` to manage components in S3.

## General
The storage provider is used by `@dynamico/driver` directly so usually the only part of the API you'll use is the constructor. To get started quickly you can just got to the [Installation](#Installation) and [Initialization](#Initialization) sections. If you want to learn more about the provider you can take a look at the [API](#API) section.

## Installation
```bash
yarn add aws-sdk
yarn add @dynamic/s3-storage
```

## Initialization
```javascript
const S3Storage = require('@dynamic/s3-storage');
... initialize an s3 client instance from aws-sdk
const storage = new S3Storage({s3Client, bucketName});
```

## API
* Constructor
    ```typescript
    constructor({ s3Client, bucketName }: Config)
    ```
    * Arguments
        * Config
            * s3Client
                * A properly initialized S3 client that conforms to the aws-sdk implementation.
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