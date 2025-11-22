import { Router } from 'express';
import axios from 'axios';
import { API_BASE_URL } from '../const';

const router = Router();

/**
 * 페이지 리스트 조회 (GET)
 * Frontend: stp://dj-board.sopia.dev/pages/list/:userId
 * Backend: GET /api/dj-board/pages/list/:userId
 */
router.get('/pages/list/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`[DJ Board] Fetching page list for userId: ${userId}`);
    
    const response = await axios.get(`${API_BASE_URL}/dj-board/pages/list/${userId}`);
    
    console.log(`[DJ Board] Page list found:`, response.data.data?.length || 0, 'pages');
    res.json(response.data);
    
  } catch (error: any) {
    console.error('[DJ Board] Error fetching page list:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: 'No pages found',
        userId: req.params.userId 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

/**
 * 페이지 조회 (GET) - 메인 페이지
 * Frontend: stp://dj-board.sopia.dev/pages/:userId/
 * Backend: GET /api/dj-board/pages/:userId
 */
router.get('/pages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const url = '/'; // 메인 페이지
    
    console.log(`[DJ Board] Fetching main page for userId: ${userId}`);
    
    const response = await axios.get(`${API_BASE_URL}/dj-board/pages/${userId}/${url}`);
    
    console.log(`[DJ Board] Page found`);
    res.json(response.data);
    
  } catch (error: any) {
    console.error('[DJ Board] Error fetching page:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: 'Page not found',
        userId: req.params.userId,
        url: '/'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

/**
 * 페이지 조회 (GET) - 특정 페이지
 * Frontend: stp://dj-board.sopia.dev/pages/:userId/:url
 * Backend: GET /api/dj-board/pages/:userId/:url
 */
router.get('/pages/:userId/:url', async (req, res) => {
  try {
    const { userId, url } = req.params;
    
    console.log(`[DJ Board] Fetching page for userId: ${userId}, url: ${url}`);
    
    const response = await axios.get(`${API_BASE_URL}/dj-board/pages/${userId}/${url}`);
    
    console.log(`[DJ Board] Page found`);
    res.json(response.data);
    
  } catch (error: any) {
    console.error('[DJ Board] Error fetching page:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: 'Page not found',
        userId: req.params.userId,
        url: req.params.url
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

/**
 * 페이지 저장 (POST)
 * Frontend: stp://dj-board.sopia.dev/pages
 * Backend: POST /api/dj-board/pages
 */
router.post('/pages', async (req, res) => {
  try {
    const { userId, title, content, url } = req.body;
    
    if (!userId || !content) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'content']
      });
    }
    
    console.log(`[DJ Board] Saving page for userId: ${userId}, url: ${url || '(main)'}`);
    console.log(`[DJ Board] Content size:`, JSON.stringify(content).length, 'bytes');
    
    const response = await axios.post(`${API_BASE_URL}/dj-board/pages`, {
      userId,
      title: title || 'Untitled',
      content,
      url: url || '/' // url이 없으면 기본값 '/' 사용
    });
    
    console.log(`[DJ Board] Page saved successfully`);
    res.status(201).json(response.data);
    
  } catch (error: any) {
    console.error('[DJ Board] Error saving page:', error.message);
    
    res.status(500).json({ 
      error: 'Failed to save page',
      message: error.message 
    });
  }
});

/**
 * 페이지 삭제 (DELETE)
 * Frontend: stp://dj-board.sopia.dev/pages
 * Backend: DELETE /api/dj-board/pages
 */
router.delete('/pages', async (req, res) => {
  try {
    const { userId, url } = req.body;
    
    if (!userId || !url) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'url']
      });
    }
    
    console.log(`[DJ Board] Deleting page for userId: ${userId}, url: ${url}`);
    
    const response = await axios.delete(`${API_BASE_URL}/dj-board/pages`, {
      data: { userId, url }
    });
    
    console.log(`[DJ Board] Page deleted successfully`);
    res.json(response.data);
    
  } catch (error: any) {
    console.error('[DJ Board] Error deleting page:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: 'Page not found',
        userId: req.body.userId,
        url: req.body.url
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to delete page',
      message: error.message 
    });
  }
});

export default router;

