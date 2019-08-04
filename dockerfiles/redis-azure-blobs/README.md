# Overview
This is an implementation of a dynamico registry server that uses dynamico Azure Blob storage provider to manage componens and dynamico redis index storage to manage the index. That means the server exposes the endpoints dynamico middleware implements. The server is capable of registering hosts, serving components and saving components (when not in read only mode). We publish a docker image that runs this code.

## Usage
### Configuration
The server uses [nconf](https://github.com/indexzero/nconf) to load configurations. It supports getting configurations through process arguments, a configuration file called `config.json` that is expected to be found in the server's folder or environment variables.

### Azure Blobs as Components Storage
The server initializes an instance of `ContainerURL`. To do that it needs a SAS url for the container, that is going to be used to store dynamic components. The key should allow the server to list blobs as well as read and write blobs to the container. You provide the SAS url by setting `container_sas` in your configuration.

### Redis as Index Storage
The server uses the official [redis client for node](https://github.com/NodeRedis/node_redis). It uses the `createClient` function to initialize a redis client, and expects a configuration object to be passed via the `redis_config` configuration key.

### Configuration Keys
To configure the server you can use these configuration keys:

 - container_sas
    - passed to the `ContainerURL` constructor. Requires the host url as well as the SAS key query parameter.
- blob_download_timeout
    - converted to a number and passed to AzureBlobStorage constructor as `timeout`.
- blob_download_concurrent_connections
    - converted to a number and passed to AzureBlobStorage constructor as `concurrentConnections`.
- redis_config
    - A configuration object that corresponds to the object expected by redis's `createClient` function. See more [here](https://github.com/NodeRedis/node_redis#rediscreateclient).
- index_key_name
    - The key name to be used by redis to save the index. deault: `index`.
- dynamico_readonly
    - If set to `true` makes the middleware run in read only mode. Read more [here]('../../server/express-middleware').
- port
    - Set the port on which the server will listen to. Defaults to `1234`.
- server_timeout
    - Sets the timeout for requests in the server, uses node's `setTimeout`.
## Running locally
To run locally you can use [Azurite](https://github.com/Azure/Azurite). Build and run the Azurite image, create a blob container and generate a SAS url for it. Update the SAS url to use the Azurite's container's IP, and provide this as `container_sas` to the registry's container.