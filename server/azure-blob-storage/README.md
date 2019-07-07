# Azure Blob Storage
A storage provider that can be used by `@dynamico/driver` to manage components over Azure Blob Storage.

## General
`azure-blob-storage` saves components in a specific container. It expects to be initialized with a `ContainerURL` instance, specific for the container to be used. It needs to have permissions for listing the blobs in the container as well as read and write permissions. The write permission is required regardless of whether the server is set up to be read-only or not. The reason for this is that the server manages an index, which is saved as a blob in the container. It uses the list permission to create the components versioning structure which is then used by the middleware when resolving the best component version.

__Note:__ this guide assumes you have an express server set up along with the express middleware. If this is not the case refer to our [Getting Started - Backend](../readme.md) guide.

## Getting Started With Azure Blob Storage

Let's setup an Azure blob storage provider, it'll take only a few minutes! In this guide we'll initialize the connection to Azure Blob storage via a SAS key. We think that this is the most secure way to handle storage access on Azure Blobs. It doesn't actually matter to the provider as long as you provide a valid `ContainerURL` instance. Check the [docs](https://docs.microsoft.com/en-us/javascript/api/@azure/storage-blob/containerurl?view=azure-node-preview) for `ContainerURL` for more.

Start by installing the required dependencies:
```bash
$ npm install @dynamico/azure-blob-storage @azure/storage-blob --save
```

Now find the file where you initialized dynamico middleware and add the following `import` statements.

```javascript
import { AzureBlobStorage } from '@dynamico/azure-blob-storage';
import { ContainerURL, StorageURL, AnonymousCredential } from '@azure/storage-blob';
```

Now let's initialize the `ContainerURL` instance and pass it on to the storage provider:

```javascript
const container = new ContainerURL(process.env.CONTAINER_SAS, StorageURL.newPipeline(new AnonymousCredential()));
const storageProvider = new AzureBlobStorage({
  container
});

const dynamicoMiddleware = dynamico(storageProvider);
```

And that is all! You have a server that uses Azure Blob storage to manage dynamic components.

The full code looks something like this:
```javascript
import express from 'express';
import dynamico from '@dynamico/express-middleware';
import { AzureBlobStorage } from '@dynamico/azure-blob-storage';
import { ContainerURL, StorageURL, AnonymousCredential } from '@azure/storage-blob';

const container = new ContainerURL(process.env.CONTAINER_SAS, StorageURL.newPipeline(new AnonymousCredential()));
const storageProvider = new AzureBlobStorage({
  container
});

const dynamicoMiddleware = dynamico(storageProvider);

const app = express();
app.use('/api/components', dynamico(storageProvider);
app.listen(Number(process.env.PORT || 1234), () => {
  console.log(`Listening on port ${process.env.PORT}`);
});
```

## API
* Constructor
    ```typescript
    constructor({container, indexBlobName = 'index.json', timeout = 30 * 60000, concurrentConnections = 5 }: AzureBlobStorageOptions)
    ```
    * Arguments
        * Config
            * container
                * An initialized instance of `ContainerURL` from `@azure/storage-blob`.
            * indexBlobName
                * The blob name to use when saving and reading the index. Defaults to `index.json`.
            * timeout
                * The timeout for downloading a blob. Defaults to 30 seconds.
            * concurrentConnections
                * Defines how many connections to open when downloading a blob. Defaults to 5.
    * Returns
        * A newly initialized AzureBlobStorage provider instance.
* getIndex
    ```typescript
    getIndex(): Promise<Index>
    ```
    * Returns
         * A promise that will be resolved to an object that implements the Index interface exported by `@dynamic/driver`. The index is created by getting a blob, named by the indexBlobName parameter sent to the constructor, that was created previously by the provider (or an empty object if it wasn't found).
* upsertIndex
    ```typescript
    upsertIndex(index: Index): Promise<void>
    ```
    * Arguments
        * An object that implements the Index interface exported by `@dynamico/driver`,to either replace the existing blob or created for the first time.
    * Returns
        * Promise that will be resolved as soon as the blob upload process finishes.
* getComponentTree
    ```typescript
    getComponentTree(): Promise<ComponentTree> 
    ```
    * Returns
        * A promise, that resolves to an object that implements the ComponentTree interface exported by `@dynamico/driver`. This object is constructed by listing the container's contents, and mapping the components names and versions to a function that reads the `package.json` object, using the provided `ContainerURL` instance.
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
        * A promise, that, in case the component wasn't found will be resolved to an empty object or an object that implements the ComponentGetter interface exported by `@dynamico/driver`. The component will be searched in the container in `${name}/${version}/package.json`.

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