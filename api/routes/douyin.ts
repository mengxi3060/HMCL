import express from 'express';
import axios from 'axios';

const router = express.Router();

interface VideoData {
  videoUrl: string;
  coverUrl: string;
  caption: string;
  title?: string;
  author?: string;
  type?: string;
  images?: string[];
}

interface ParseResponse {
  success: boolean;
  message?: string;
  data?: VideoData;
}

function extractDouyinUrl(text: string): string | null {
  const patterns = [
    /https?:\/\/v\.douyin\.com\/[A-Za-z0-9]+\/?/gi,
    /https?:\/\/(?:www\.)?douyin\.com\/video\/\d+[^\s]*/gi,
    /https?:\/\/(?:www\.)?douyin\.com\/note\/\d+[^\s]*/gi,
    /https?:\/\/(?:www\.)?douyin\.com\/aweme\/\d+[^\s]*/gi,
    /https?:\/\/(?:www\.)?douyin\.com\/share\/[^\s]+/gi,
    /https?:\/\/(?:www\.)?douyin\.cn\/[^\s]+/gi,
    /https?:\/\/(?:www\.)?iesdouyin\.com\/[^\s]+/gi,
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) return matches[0];
  }

  const generalPattern = /https?:\/\/[^\s]*douyin[^\s]*/gi;
  const generalMatches = text.match(generalPattern);
  if (generalMatches) return generalMatches[0];

  return null;
}

const API_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'application/json',
};

async function parseWithApiByte(url: string): Promise<ParseResponse> {
  try {
    const resp = await axios.get('https://apione.apibyte.cn/douyinparse', {
      params: { url },
      timeout: 30000,
      headers: API_HEADERS,
    });

    if (resp.data?.code === 200 && resp.data?.data) {
      const d = resp.data.data;
      const videoUrl = d.video?.['1080p'] || d.video?.['720p'] || d.video?.play_url || '';
      const coverUrl = d.cover || '';
      const caption = d.title || '';
      const author = d.author?.nickname || '';
      const type = d.type === 'note' || d.type === 'slides' ? 'note' : 'video';
      const images = d.images || [];

      if (videoUrl || coverUrl || images.length > 0) {
        return { success: true, data: { videoUrl, coverUrl, caption, title: caption, author, type, images } };
      }
    }
    return { success: false, message: 'apibyte未返回数据' };
  } catch {
    return { success: false, message: 'apibyte调用失败' };
  }
}

async function parseWithSzfx(url: string): Promise<ParseResponse> {
  try {
    const resp = await axios.get('https://api.szfx.top/douyin/', {
      params: { url },
      timeout: 30000,
      headers: API_HEADERS,
    });

    if (resp.data) {
      const d = resp.data.data || resp.data;
      const videoUrl = d.video || d.video_url || d.nwm_video_url || '';
      const coverUrl = d.cover || d.cover_url || '';
      const caption = d.desc || d.title || '';
      const author = d.author?.name || d.author?.nickname || '';
      const images = d.images || [];

      if (videoUrl || coverUrl || images.length > 0) {
        return { success: true, data: { videoUrl, coverUrl, caption, title: caption, author, type: images.length > 0 ? 'note' : 'video', images } };
      }
    }
    return { success: false, message: 'szfx未返回数据' };
  } catch {
    return { success: false, message: 'szfx调用失败' };
  }
}

async function parseWithHhlqilongzhu(url: string): Promise<ParseResponse> {
  try {
    const resp = await axios.get('https://www.hhlqilongzhu.cn/api/sp_douyin.php', {
      params: { url },
      timeout: 30000,
      headers: API_HEADERS,
    });

    if (resp.data) {
      const d = resp.data.data || resp.data;
      const videoUrl = d.video || d.video_url || d.nwm_video_url || '';
      const coverUrl = d.cover || d.cover_url || '';
      const caption = d.desc || d.title || '';
      const author = d.author?.name || d.author?.nickname || '';
      const images = d.images || [];

      if (videoUrl || coverUrl || images.length > 0) {
        return { success: true, data: { videoUrl, coverUrl, caption, title: caption, author, type: images.length > 0 ? 'note' : 'video', images } };
      }
    }
    return { success: false, message: 'hhlqilongzhu未返回数据' };
  } catch {
    return { success: false, message: 'hhlqilongzhu调用失败' };
  }
}

async function parseWithPearktrue(url: string): Promise<ParseResponse> {
  try {
    const resp = await axios.get('https://api.pearktrue.cn/api/video/douyin', {
      params: { url },
      timeout: 30000,
      headers: API_HEADERS,
    });

    if (resp.data?.code === 200 && resp.data?.data) {
      const d = resp.data.data;
      const videoUrl = d.video_url || d.video || '';
      const coverUrl = d.cover || d.cover_url || '';
      const caption = d.title || d.desc || '';
      const author = d.author?.name || d.author?.nickname || '';
      const images = d.images || [];

      if (videoUrl || coverUrl || images.length > 0) {
        return { success: true, data: { videoUrl, coverUrl, caption, title: caption, author, type: images.length > 0 ? 'note' : 'video', images } };
      }
    }
    return { success: false, message: 'pearktrue未返回数据' };
  } catch {
    return { success: false, message: 'pearktrue调用失败' };
  }
}

async function parseDouyinUrl(url: string): Promise<ParseResponse> {
  console.log('Parsing URL:', url);

  const apis: { name: string; fn: (url: string) => Promise<ParseResponse> }[] = [
    { name: 'apibyte', fn: parseWithApiByte },
    { name: 'szfx', fn: parseWithSzfx },
    { name: 'hhlqilongzhu', fn: parseWithHhlqilongzhu },
    { name: 'pearktrue', fn: parseWithPearktrue },
  ];

  const urlsToTry = [url];
  const videoIdMatch = url.match(/video\/(\d+)/) || url.match(/note\/(\d+)/);
  if (videoIdMatch) {
    urlsToTry.push(`https://v.douyin.com/${videoIdMatch[1]}`);
  }

  for (const tryUrl of urlsToTry) {
    for (const api of apis) {
      console.log(`[Parse] Trying ${api.name} with ${tryUrl.substring(0, 60)}...`);
      const result = await api.fn(tryUrl);
      if (result.success) {
        console.log(`[Parse] Success with ${api.name}`);
        return result;
      }
      console.log(`[Parse] ${api.name} failed: ${result.message}`);
    }
  }

  return {
    success: false,
    message: '解析失败，所有解析接口均未返回数据。建议：1. 使用抖音APP分享的短链接（v.douyin.com格式）；2. 确认视频未被删除或设为私密；3. 稍后重试',
  };
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

  const result = await parseDouyinUrl(url);
  res.json(result);
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

export default router;
