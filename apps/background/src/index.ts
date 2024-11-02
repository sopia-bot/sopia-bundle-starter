import express, {Request, Response, NextFunction} from 'express';

const app = express();
app.use(express.json());

const router = express.Router();
router.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.status(200).send('hello').end();
});

app.use('/', router);

module.exports = app;