import express from 'express';
import axios from 'axios';
import { API_BASE_URL } from '../const';

const router = express.Router();

/**
 * 데이터 테이블 생성/업데이트
 * POST /data-table/
 */
router.post('/', async (req, res) => {
  try {
    console.log('[Background] POST /data-table/');
    console.log('[Background] Request body:', JSON.stringify(req.body, null, 2));

    const response = await axios.post(`${API_BASE_URL}/data-table/`, req.body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[Background] API response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('[Background] Error in POST /data-table/:', error);
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * 데이터 테이블 조회 (tid)
 * GET /data-table/:tid
 */
router.get('/:tid', async (req, res) => {
  try {
    const { tid } = req.params;
    console.log(`[Background] GET /data-table/${tid}`);

    const response = await axios.get(`${API_BASE_URL}/data-table/${tid}`);

    console.log('[Background] API response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error(`[Background] Error in GET /data-table/:tid:`, error);
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * 데이터 테이블 조회 (idx)
 * GET /data-table/by-idx/:idx
 */
router.get('/by-idx/:idx', async (req, res) => {
  try {
    const { idx } = req.params;
    console.log(`[Background] GET /data-table/by-idx/${idx}`);

    const response = await axios.get(`${API_BASE_URL}/data-table/by-idx/${idx}`);

    console.log('[Background] API response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error(`[Background] Error in GET /data-table/by-idx/:idx:`, error);
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * 데이터 테이블 삭제
 * DELETE /data-table/:tid
 */
router.delete('/:tid', async (req, res) => {
  try {
    const { tid } = req.params;
    console.log(`[Background] DELETE /data-table/${tid}`);

    const response = await axios.delete(`${API_BASE_URL}/data-table/${tid}`);

    console.log('[Background] API response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error(`[Background] Error in DELETE /data-table/:tid:`, error);
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;

