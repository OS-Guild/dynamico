import * as liveServer from 'live-server';

export default () => {
  liveServer.start({
    port: 8383,
    file: "index.js",
    open: false,
    cors: true,
    middleware: [(req, res, next) => {
      res.setHeader('Access-Control-Expose-Headers', 'ETag');
      next();
    }]
  })
}