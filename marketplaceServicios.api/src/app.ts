import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { engine } from 'express-handlebars';
import routes from './routes';
import viewRoutes from './routes/views.routes';
import { notFound, errorHandler } from './middleware/error.middleware';

const app = express();

app.engine('handlebars', engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/', viewRoutes);
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
