import express from 'express';
import apiRouter from '../server/api.js';

const app = express();
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);

// Mount API router
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
