import express from 'express';
import cors from 'cors';
import routes from './routes';
import { notFound, errorHandler } from './middleware/error.middleware'

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.use(notFound)
app.use(errorHandler)

export default app;