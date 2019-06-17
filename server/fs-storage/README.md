# File system storage

File system saves components in a specific folder provided in initialization. It uses node file system APIs and needs both read and write permissions as well as permissions to list the folder. Generally this isn't a production grade solution as it's not scalable and should be used mostly when playing around.

Let's set up a file system storage provider. It'll take just a few minutes!

__Note:__ this guide assumes you have an express server set up along with the express middleware. If this is not the case refer to our [Getting Started - Backend](../readme.md) guide.

## Getting Started With File System Storage

Let's start by adding the dependency:
```bash
$ npm install @dynamico/fs-storage --save
```

Now find the file where you initialized dynamico middleware and add the following `require` statement.

```javascript
const { FSStorage } = require('@dynamico/fs-storage');
```

And initialize the provider and middleware:

```javascript
const storageProvider = new FSStorage('./components');
const dynamicoMiddleware = dynamico(storageProvider);
// Use the middleware
```

And that's it! you now have a server that uses file system to manage dynamic components.

The full code looks something like this:

```javascript
const express = require('express');
const dynamico = require('@dynamico/express-middleware');
const { FSStorage } = require('@dynamico/fs-storage');

const storageProvider = new FSStorage('./components');
const dynamicoMiddleware = dynamico(storageProvider);

const app = express();
app.use('/api/components', dynamico(storageProvider);
app.listen(Number(process.env.PORT || 1234), () => {
  console.log(`Listening on port ${process.env.PORT}`);
});
```