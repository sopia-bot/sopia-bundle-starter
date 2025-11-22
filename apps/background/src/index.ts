import express from 'express';
import cors from 'cors';
import userRouter from './routes/user';
import djBoardRouter from './routes/dj-board';
import dataTableRouter from './routes/data-table';
import { API_BASE_URL } from './const';
import { rejectPromiseHandshake, resolvePromiseHandshake } from './promise-handshake';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.post('/resolve-handshake', async (req: express.Request, res: express.Response) => {
    const { id, data } = req.body;
    await resolvePromiseHandshake(id, data);
    res.json({ success: true });
});
  
app.post('/reject-handshake', async (req: express.Request, res: express.Response) => {
    const { id, data } = req.body;
    await rejectPromiseHandshake(id, data);
    res.json({ success: true });
});
app.use('/user', userRouter);
app.use('/api/dj-board', djBoardRouter);
app.use('/data-table', dataTableRouter);

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'dj-board-background',
    apiServer: API_BASE_URL
  });
});

export default app;
