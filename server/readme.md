# Getting Started
Dynamico backend has two parts:

- [Registry Server](#Registry-Server)
- [Storage](#Storage)


## Registry Server

Dynamico backend service is powered by an express middleware that you can use along with any express server for both serving components and publishing components. However that's not necessarily a great production setup. Let's go over how you can implement a secure and reliable server for your dynamic components. It's easy, simple and quick! (and it's also fun!) 🙂

Let's start with simply integrating it into a server

<details>
<summary>Creating an express server from scratch</summary>


We're going to create a new node app. This app runs an express server that exposes dynamico endpoints. It'll require us to create and configure a storage provider. To learn more about how to properly set up storage for dynamico go to [Storage](#Storage).

Let's start by creating a new node app and install all of the required dependencies. Open a terminal and run these commands:

```bash
$ mkdir dynamico-registry
$ cd dynamico-registry
$ npm init -y
npm creates your node app with the name dynamico-registry
$ npm install express @dynamico/express-middleware --save
npm installation text
$ touch index.js
```

Now open the folder in your favorite IDE. Open `index.js` and write this code in it:

```javascript
const express = require('express');
const dynamico = require('@dynamico/express-middleware').default;

const storageProvider = /*Initialize your storage provider*/
const dynamicoMiddleware = dynamico(storageProvider);
const app = express();
app.use('/api/components', dynamicoMiddleware);
app.listen(Number(process.env.PORT || 1234), () => {
  console.log(`Listening on port ${process.env.PORT}`);
});
```

Now you can jump to the [Storage](#Storage) section to initialize the storage provider of your choice.
</details>

<details>
<summary>Integrate with an existing express server</summary>

We're going to integrate the dynamico handlers with an existing express application so it will expose the dynamico endpoints. It'll require us to create and configure a storage provider. To learn more about how to properly set up storage for dynamico go to [Storage](#Storage).

Let's start by adding the dependencies to your app:
```bash
$ npm install express @dynamico/express-middleware --save
npm installation text
```

Open your project using your favorite IDE and find the appropriate place to add a new route. Usually it'll be next to files that contain lines like this:

```javascript
app.use('some/path', someHandler);
```

Open or create the file  and add this `require` statements to the file:
```javascript
const dynamico = require('@dynamico/express-middleware').default;
```

And create a handler and add a route to the app (this code assumes that you initialized an express router):

```javascript
const storageProvider = /*Initialize your storage provider*/

const dynamicoMiddleware = dynamico(storageProvider);

// Use the middleware
```

Now you can jump to the [Storage](#Storage) section to initialize the storage provider of your choice.
</details>


## Storage

Dynamico backend uses the storage for saving and retrieving both components and an index of host apps that used it in the past. Currently dynamico officially supports these storage types:

[File System Storage](./fs-storage) - Can be used to save both the index and components to an the local file system. Alternatively can be used as a `ComponentsStorage` for a [composition storage](./composition-storage).

[S3 Storage](./s3-storage) - Can be used to save both the index and components to an S3 bucket. Alternatively can be used as a `ComponentsStorage` for a [composition storage](./composition-storage).

[Azure Blob Storage](./azure-blob-storage) - Can be used to save both the index and components to an Azure blob container. Alternatively can be used as a `ComponentsStorage` for a [composition storage](./composition-storage).

[Composition storage](./composition-storage) - This storage can be used to combine two storage providers to separate the way the server deals with index and components.

[redis index storage](./redis-storage) - This storage only implements `IndexStorage` and requires you to use [composition storage](./composition-storage).


If the storage solution you use isn't listed here you can implement it yourself, it's fun! Reach out if you need help and don't forget to post a PR 😉.

Now that you have a server that publishes components and serves them you can go over to the [Client docs](../client) and run a real client with it.
