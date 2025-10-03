import express from 'express';
import routes from './routes/user';

const app = express();
app.use(express.json());

// 라우터 연결
app.use('/user', routes);

export default app;