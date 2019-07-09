# Overview
This is an implementation of a dynamico registry server that uses dynamico Azure Blob storage provider. That means the server exposes the endpoints dynamico middleware implements. The server is capable of registering hosts, serving components and saving components (when not in read only mode). We publish a docker image that runs this code.

## Usage
The server initializes an instance of `ContainerURL`. To do that it needs a SAS url for the container, that is going to be used to store dynamic components and the index for the hosts. The key should allow the server to list blobs as well as read and write blobs to the container. The server needs write permission regardless to whether it was defined in read-only mode or not as it uses Azure Blob storage to manage the index. You provide the SAS url by setting the environment variable `CONTAINER_SAS`.

## Environment Variables
To configure the server you can use these environment variables:

 - CONTAINER_SAS
    - passed to the `ContainerURL` constructor. Requires the host url as well as the SAS key query parameter.
- INDEX_BLOB_NAME
    - passed to AzureBlobStorage constructor as `indexBlobName`.
- BLOB_DOWNLOAD_TIMEOUT
    - converted to a number and passed to AzureBlobStorage constructor as `timeout`.
- BLOB_DOWNLOAD_CONCURRENT_CONNECTIONS
    - converted to a number and passed to AzureBlobStorage constructor as `concurrentConnections`.
- DYNAMICO_READONLY
    - If set to `true` makes the middleware run in read only mode. Read more [here]('../../server/express-middleware').
- PORT
    - Set the port on which the server will listen to. Defaults to `1234`.

## Running locally
To run locally you can use [Azurite](https://github.com/Azure/Azurite). Build and run the Azurite image, create a blob container and generate a SAS url for it. Update the SAS url to use the Azurite's container's IP, and provide this as `CONTAINER_SAS` to the registry's container.