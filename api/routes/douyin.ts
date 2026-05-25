import express from 'express';
import axios from 'axios';

const router = express.Router();

interface ParseResponse {
  success: boolean;
  message?: string;
  data?: {
    videoUrl: string;
    coverUrl: string;
    caption: string;
    title?: string;
    author?: string;
  };
}

function extractDouyinUrl(text: string): string | null {
  const regex = /https?:\/\/(?:www\.)?(?:douyin|tiktok)\.(?:com|cn)\/[^\s]+/gi;
  const matches = text.match(regex);
  return matches ? matches[0] : null;
}

async function fetchDouyinVideoInfo(url: string): Promise<ParseResponse> {
  try {
    const response = await axios.get('https://www.douyin.com/aweme/v1/web/aweme/detail/', {
      params: {
        aweme_id: extractAwemeId(url),
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.douyin.com/',
        'Cookie': '',
      },
    });

    if (response.data && response.data.aweme_detail) {
      const detail = response.data.aweme_detail;
      return {
        success: true,
        data: {
          videoUrl: detail.video.play_addr.url_list?.[0] || detail.video.download_addr.url_list?.[0] || '',
          coverUrl: detail.video.cover.url_list?.[0] || '',
          caption: detail.desc || '',
          title: detail.title || '',
          author: detail.author?.nickname || '',
        },
      };
    }
    return { success: false, message: '未能获取视频信息' };
  } catch (error) {
    console.error('Fetch error:', error);
    return await fallbackParse(url);
  }
}

function extractAwemeId(url: string): string {
  const match = url.match(/video\/(\d+)/);
  if (match) return match[1];
  
  const secMatch = url.match(/aweme\/(\d+)/);
  if (secMatch) return secMatch[1];
  
  const itemMatch = url.match(/item_id=(\d+)/);
  if (itemMatch) return itemMatch[1];
  
  return '';
}

async function fallbackParse(url: string): Promise<ParseResponse> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const html = response.data;
    
    const videoMatch = html.match(/"playAddr":\s*"([^"]+)"/);
    const coverMatch = html.match(/"cover":\s*"([^"]+)"/);
    const captionMatch = html.match(/"desc":\s*"([^"]+)"/);

    if (videoMatch && coverMatch) {
      return {
        success: true,
        data: {
          videoUrl: decodeURIComponent(videoMatch[1]),
          coverUrl: decodeURIComponent(coverMatch[1]),
          caption: captionMatch ? decodeURIComponent(captionMatch[1]) : '',
        },
      };
    }
    
    const videoMatch2 = html.match(/playAddr":"([^"]+)"/);
    const coverMatch2 = html.match(/cover":"([^"]+)"/);
    
    if (videoMatch2 && coverMatch2) {
      return {
        success: true,
        data: {
          videoUrl: decodeURIComponent(videoMatch2[1]),
          coverUrl: decodeURIComponent(coverMatch2[1]),
          caption: '',
        },
      };
    }
    
    return { success: false, message: '未能解析视频链接' };
  } catch (error) {
    console.error('Fallback error:', error);
    return { success: false, message: '解析失败，请确保链接有效' };
  }
}

router.post('/parse', async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.json({ success: false, message: '请输入包含抖音链接的文本' });
  }

  const url = extractDouyinUrl(text);
  
  if (!url) {
    return res.json({ success: false, message: '未找到有效的抖音链接' });
  }

  const result = await fetchDouyinVideoInfo(url);
  res.json(result);
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

export default router;