# Client

The client folder contains both the `dcm` CLI and the client side code for using Dynamico in production. Both are the client side for the server. The CLI uses the server to publish new components and the client side code fetches components from it.

## Overview
### DCM
This is the command line utility you use to manage component creation, development and delivery processes. To learn more about how you can use it, read the [README](./cli).

### Client
The client is used by your app to retrieve components from the server. It's responsible for registering the host, fetching component code from the server, manage cache and evaluate your code. You should choose the appropriate client according to your app.
#### Core
This is dynamico client for vanlia JS. You can learn more about how to use it in the [README](./core);
#### React
These are React bindings for dynamico. This is what you use for React apps (either web or React Native or any other environment supported by React). It uses the [Core](#Core) to retrieve dynamic components and in turn renders them as React components. You can learn more about how to use it in the [README](./react).