import express from 'express';
import apiRouter from '../server/api.js';

const app = express();
app.use(express.json());

// Mount API router
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
