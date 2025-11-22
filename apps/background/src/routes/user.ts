import { Router } from 'express';
import { createPromiseHandshake } from '../promise-handshake';
const { BrowserWindow } = require('electron');

const router = Router();

router.post('/spoon-login', async (req, res) => {
    const handshake = await createPromiseHandshake();
    const window = BrowserWindow.getAllWindows()[0];
    window.webContents.send(
      'dj-board.sopia.dev/renderer',
      { channel: 'spoon-login', id: handshake.id },
    );
    const result = await handshake.promise;
    console.log('result', result);
    res.status(200).json(result);
});
export default router;