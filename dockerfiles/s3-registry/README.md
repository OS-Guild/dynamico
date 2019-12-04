# Overview
This is an implementation of a dynamico registry server that uses dynamico S3 storage provider. That means the server exposes the endpoints dynamico middleware implements. The server is capable of registering hosts, serving components and saving components (when not in read only mode). We publish a docker image that runs this code.

## Usage
The server needs to initialize the `aws-sdk`. You can either use the environment variables, we search for, or you can rely on the S3 SDK's automatic authentication and configuration capability. Read more [here](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html).

### Environment variables

To set the behavior of the middleware and configure the `aws-sdk` you can use the following environment variables:
 - ACCESSKEYID
    - Passed to the `aws-sdk` constructor configuration as `accessKeyId`
- SECRETACCESSKEY
    - Passed to the `aws-sdk` constructor configuration as `secretAccessKey`
- REGION
    - Passed to the `aws-sdk` constructor configuration as `region`
- ENDPOINT
    - Passed to the `aws-sdk` constructor configuration as `endpoint`
- FORCEPATHFILE
    - If set to `true` it sets the `s3ForcePathStyle` configuration property to true. Use this to support S3 compliant emulators like [Minio](https://github.com/minio/minio).
- BUCKETNAME
    - Set the bucket name the server will use to save components to as well as retrieve them from there. Defaults to `dynamico`.
- DYNAMICO_READONLY
    - If set to `true` makes the middleware run in read only mode. Read more [here]('../../server/express-middleware').
- PORT
    - Set the port on which the server will listen to. Defaults to `1234`.
- SECRETS_FILE_PATH
    - Path to optional s3 access keys file, defaults to `'/run/secrets/s3-access-keys'`.

### Docker secrets

Since some of your configuration may contain sensitive data, we have included support for docker secrets for the ACCESSKEYID and SECRETACCESSKEY values. Read more [here](https://docs.docker.com/engine/swarm/secrets/). Secrets are loaded from a `.json` file and can be placed in a configurable path in the container (SECRETS_FILE_PATH environment variable). Take a look at the [example secrets file](./access-keys.json) which is used by the compose file.

## Running locally
You can use the compose file we have here to run the server locally along with an emulator (we use [Minio](https://github.com/minio/minio)). All you have to do is:
```bash
$ docker-compose up --build
```

And the server will be available in `127.0.0.1:1234`
Use this address as the URL in the CLI or the dynamico client to play with it locally.