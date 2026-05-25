import express from 'express';
import puppeteer, { type Browser, type Page } from 'puppeteer-core';
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

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    try {
      await browserInstance.version();
      return browserInstance;
    } catch {
      browserInstance = null;
    }
  }

  const executablePath = process.env.CHROME_PATH || '/usr/bin/google-chrome-stable';

  browserInstance = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--no-first-run',
      '--disable-background-networking',
      '--disable-sync',
      '--metrics-recording-only',
      '--mute-audio',
    ],
  });

  return browserInstance;
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

function extractVideoFromDetail(detail: any): VideoData | null {
  if (!detail) return null;

  const videoUrl =
    detail.video?.play_addr?.url_list?.[0]
    || detail.video?.playAddr?.url_list?.[0]
    || detail.video?.download_addr?.url_list?.[0]
    || detail.video?.downloadAddr?.url_list?.[0]
    || '';
  const coverUrl =
    detail.video?.cover?.url_list?.[0]
    || detail.video?.origin_cover?.url_list?.[0]
    || detail.video?.poster?.url_list?.[0]
    || '';
  const caption = detail.desc || detail.description || '';
  const author = detail.author?.nickname || detail.author?.name || '';

  if (videoUrl || coverUrl) {
    return {
      videoUrl,
      coverUrl,
      caption,
      title: caption,
      author,
      type: detail.images ? 'note' : 'video',
      images: detail.images?.map((img: any) => img.url_list?.[0] || '').filter(Boolean),
    };
  }

  return null;
}

async function parseWithMobileShare(videoId: string): Promise<ParseResponse> {
  console.log('[MobileShare] Trying iesdouyin.com/share/video/' + videoId);
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    );
    await page.setViewport({ width: 375, height: 812 });
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'zh-CN,zh;q=0.9' });

    const shareUrl = `https://www.iesdouyin.com/share/video/${videoId}/`;
    console.log('[MobileShare] Loading:', shareUrl);

    try {
      await page.goto(shareUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    } catch (e) {
      console.log('[MobileShare] Page load error:', (e as Error).message?.substring(0, 80));
    }
    await new Promise((r) => setTimeout(r, 3000));

    const result: any = await page.evaluate(
      '(() => {'
      + 'var r={videoUrl:"",coverUrl:"",caption:"",title:"",author:"",type:"video",images:[],dbg:{}};'
      + 'try {'
      + 'var videoEl=document.querySelector("video");'
      + 'if(videoEl){var src=videoEl.src||"";if(src.indexOf("blob:")!==0&&src.length>0)r.videoUrl=src;r.coverUrl=videoEl.poster||"";r.dbg.videoSrc=src.substring(0,100);}'
      + 'var ss=document.querySelectorAll("source");for(var i=0;i<ss.length;i++){if(ss[i].src&&ss[i].src.indexOf("blob:")!==0){r.videoUrl=ss[i].src;break;}}'
      + 'var ogVid=document.querySelector("meta[property=\\"og:video\\"]");if(ogVid&&!r.videoUrl)r.videoUrl=ogVid.getAttribute("content")||"";'
      + 'var ogImg=document.querySelector("meta[property=\\"og:image\\"]");if(ogImg)r.coverUrl=r.coverUrl||ogImg.getAttribute("content")||"";'
      + 'var ogDesc=document.querySelector("meta[property=\\"og:description\\"]");if(ogDesc)r.caption=ogDesc.getAttribute("content")||"";'
      + 'var ogTitle=document.querySelector("meta[property=\\"og:title\\"]");if(ogTitle)r.title=ogTitle.getAttribute("content")||"";'
      + 'r.dbg.url=window.location.href;'
      + 'r.dbg.htmlLen=document.documentElement.outerHTML.length;'

      + 'var rd=document.getElementById("RENDER_DATA");if(rd){r.dbg.hasRD=true;try{var dec=decodeURIComponent(rd.textContent||"");var jd=JSON.parse(dec);r.dbg.rdLen=dec.length;'
      + '(function scan(o,d){if(!o||typeof o!=="object"||d>25)return;if(o.aweme_id!==undefined||o.awemeId!==undefined){if(o.video||o.desc||o.author){r.dbg.scanFound=true;r.dbg.scanPath=d;var v=o.video||{};var pa=v.play_addr||v.playAddr;var da=v.download_addr||v.downloadAddr;var cv=v.cover||v.origin_cover||v.poster;r.videoUrl=(pa&&pa.url_list&&pa.url_list[0])||(da&&da.url_list&&da.url_list[0])||r.videoUrl;r.coverUrl=(cv&&cv.url_list&&cv.url_list[0])||r.coverUrl;r.caption=o.desc||o.description||r.caption;r.author=(o.author&&o.author.nickname)||(o.author&&o.author.name)||r.author;return;}}for(var k in o){if(o[k]!==null&&typeof o[k]==="object")scan(o[k],d+1);}})(jd,0);'
      + '}catch(e){r.dbg.rdErr=e.message;}}'

      + 'try{var routerData=window._ROUTER_DATA||window.__ROUTER_DATA__;if(routerData){r.dbg.hasRouter=true;r.dbg.routerKeys=Object.keys(routerData).join(",");'
      + 'if(routerData.loaderData){r.dbg.loaderKeys=Object.keys(routerData.loaderData).join(",");for(var lk in routerData.loaderData){var lv=routerData.loaderData[lk];if(lv&&typeof lv==="object"){r.dbg["loader_"+lk]=Object.keys(lv).join(",").substring(0,200);if(lv.videoInfo||lv.videoDetail||lv.awemeDetail||lv.aweme_detail||lv.detail){var det=lv.videoInfo||lv.videoDetail||lv.awemeDetail||lv.aweme_detail||lv.detail;if(det&&typeof det==="object"){r.dbg.detKeys=Object.keys(det).join(",").substring(0,300);var v2=det.video||{};var pa2=v2.play_addr||v2.playAddr;var da2=v2.download_addr||v2.downloadAddr;var cv2=v2.cover||v2.origin_cover||v2.poster;r.videoUrl=(pa2&&pa2.url_list&&pa2.url_list[0])||(da2&&da2.url_list&&da2.url_list[0])||r.videoUrl;r.coverUrl=(cv2&&cv2.url_list&&cv2.url_list[0])||r.coverUrl;r.caption=det.desc||det.description||r.caption;r.author=(det.author&&det.author.nickname)||(det.author&&det.author.name)||r.author;}}}}}}'
      + '}catch(e){r.dbg.routerErr=e.message;}'

      + 'if(!r.videoUrl){var allScripts=document.querySelectorAll("script");for(var si=0;si<allScripts.length;si++){var st=allScripts[si].textContent||"";var mp4Match=st.match(/https?:\\/\\/[^"\\'\s]+\\.mp4[^"\\'\s]*/);if(mp4Match&&!mp4Match[0].includes("effectcdn")&&!mp4Match[0].includes("douyinstatic")){r.videoUrl=mp4Match[0];r.dbg.foundInScript=true;break;}}}'
      + '}catch(e){r.dbg.err=e.message;}'
      + 'return r;'
      + '})()'
    );

    console.log('[MobileShare] Debug:', JSON.stringify(result.dbg));
    console.log('[MobileShare] videoUrl:', result.videoUrl);
    console.log('[MobileShare] coverUrl:', result.coverUrl);
    console.log('[MobileShare] caption:', result.caption?.substring(0, 50));

    await page.close().catch(() => {});

    if (result.videoUrl || result.coverUrl) {
      return {
        success: true,
        data: {
          videoUrl: result.videoUrl,
          coverUrl: result.coverUrl,
          caption: result.caption || result.title || '',
          title: result.title || '',
          author: result.author || '',
          type: result.type || 'video',
          images: result.images || [],
        },
      };
    }

    return { success: false, message: '移动端分享页未能提取视频信息' };
  } catch (error) {
    console.error('[MobileShare] Error:', error);
    return { success: false, message: '移动端解析失败' };
  }
}

async function parseWithDirectApi(videoId: string, cookies: Record<string, string>): Promise<ParseResponse> {
  console.log('[DirectAPI] Trying direct API call for video:', videoId);
  try {
    const cookieStr = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
    const apiUrl = `https://www.douyin.com/aweme/v1/web/aweme/detail/?aweme_id=${videoId}&aid=6383&channel=channel_pc_web&device_platform=webapp&pc_client_type=1`;

    const resp = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': `https://www.douyin.com/video/${videoId}`,
        'Cookie': cookieStr,
      },
      timeout: 15000,
    });

    console.log('[DirectAPI] Status:', resp.status, 'Data type:', typeof resp.data, 'Keys:', Object.keys(resp.data || {}).join(','));

    if (resp.data?.aweme_detail) {
      const videoData = extractVideoFromDetail(resp.data.aweme_detail);
      if (videoData) return { success: true, data: videoData };
    }

    return { success: false, message: '直接API调用未返回视频数据' };
  } catch (error) {
    console.error('[DirectAPI] Error:', (error as Error).message?.substring(0, 100));
    return { success: false, message: '直接API调用失败' };
  }
}

async function parseWithPuppeteer(url: string): Promise<ParseResponse> {
  let page: Page | null = null;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'zh-CN,zh;q=0.9' });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      (window as any).chrome = { runtime: {} };
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh', 'en'] });
    });

    const isShortUrl = url.includes('v.douyin.com') || url.includes('iesdouyin.com');

    console.log('[Step1] Getting cookies from douyin.com...');
    try {
      await page.goto('https://www.douyin.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });
      await new Promise((r) => setTimeout(r, 3000));
    } catch (e) {
      console.log('[Step1] Homepage error:', (e as Error).message?.substring(0, 80));
    }

    let videoPageUrl = url;
    let videoId: string | null = null;

    if (isShortUrl) {
      console.log('[Step2] Resolving short link:', url);

      const fetchUrl = await page.evaluate(async (shortUrl: string) => {
        try {
          const resp = await fetch(shortUrl, { method: 'GET', redirect: 'follow', credentials: 'include' });
          return resp.url;
        } catch {
          return null;
        }
      }, url);
      console.log('[Step2] Fetch resolved:', fetchUrl);

      if (fetchUrl && (fetchUrl.includes('/video/') || fetchUrl.includes('/note/'))) {
        videoPageUrl = fetchUrl;
      } else {
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
          await new Promise((r) => setTimeout(r, 3000));
          const navUrl = page.url();
          console.log('[Step2] Nav resolved:', navUrl);
          if (navUrl.includes('/video/') || navUrl.includes('/note/')) {
            videoPageUrl = navUrl;
          } else {
            const content = await page.content();
            const idMatch = content.match(/video\/(\d{19})/) || content.match(/"aweme_id"\s*:\s*"(\d+)"/);
            if (idMatch) {
              videoId = idMatch[1];
              videoPageUrl = `https://www.douyin.com/video/${idMatch[1]}`;
              console.log('[Step2] Found video ID in page:', idMatch[1]);
            }
          }
        } catch (e) {
          console.log('[Step2] Nav error:', (e as Error).message?.substring(0, 80));
        }
      }
    }

    if (!videoId) {
      const m = videoPageUrl.match(/video\/(\d+)/) || videoPageUrl.match(/note\/(\d+)/) || videoPageUrl.match(/aweme\/(\d+)/);
      if (m) videoId = m[1];
    }

    console.log('[Step3] videoId:', videoId, 'videoPageUrl:', videoPageUrl);

    const browserCookies = await page.cookies();
    const cookieMap: Record<string, string> = {};
    for (const c of browserCookies) {
      cookieMap[c.name] = c.value;
    }

    await page.close().catch(() => {});
    page = null;

    if (videoId) {
      console.log('[Step3b] Trying direct API call...');
      const apiResult = await parseWithDirectApi(videoId, cookieMap);
      if (apiResult.success) return apiResult;

      console.log('[Step3b] Direct API failed, trying mobile share page...');
      const mobileResult = await parseWithMobileShare(videoId);
      if (mobileResult.success) return mobileResult;

      console.log('[Step3b] Mobile share failed, trying full page load...');
    }

    const videoPage = await browser.newPage();
    await videoPage.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );
    await videoPage.setViewport({ width: 1920, height: 1080 });
    await videoPage.setExtraHTTPHeaders({ 'Accept-Language': 'zh-CN,zh;q=0.9' });

    await videoPage.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      (window as any).chrome = { runtime: {} };
    });

    const interceptedDetails: any[] = [];
    const interceptedVideoUrls: string[] = [];

    videoPage.on('response', async (response) => {
      const respUrl = response.url();
      if (respUrl.includes('aweme/detail')) {
        try {
          const text = await response.text();
          if (text.length > 10) {
            try {
              const json = JSON.parse(text);
              if (json.aweme_detail) {
                interceptedDetails.push(json.aweme_detail);
                console.log('[Intercept] Got aweme_detail!');
              }
            } catch {}
          }
        } catch {}
      }
      if (respUrl.includes('.mp4') && !respUrl.includes('douyinstatic.com') && !respUrl.includes('effectcdn')) {
        interceptedVideoUrls.push(respUrl);
      }
    });

    try {
      await videoPage.goto(videoPageUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (e) {
      console.log('[Step4] Page load error:', (e as Error).message?.substring(0, 80));
    }
    await new Promise((r) => setTimeout(r, 5000));

    if (interceptedDetails.length > 0) {
      console.log('[Step4] Using intercepted API data');
      const detail = videoId
        ? interceptedDetails.find((d) => String(d.aweme_id) === videoId) || interceptedDetails[0]
        : interceptedDetails[0];
      const videoData = extractVideoFromDetail(detail);
      if (videoData) {
        await videoPage.close().catch(() => {});
        return { success: true, data: videoData };
      }
    }

    console.log('[Step5] Parsing RENDER_DATA...');

    const pageResult: any = await videoPage.evaluate(
      '(() => {'
      + 'var r={videoUrl:"",coverUrl:"",caption:"",title:"",author:"",type:"video",images:[],dbg:{}};'
      + 'try {'
      + 'var vid=null;'
      + 'var pm=window.location.pathname.match(/video\\/(\\d+)/);'
      + 'var nm=window.location.pathname.match(/note\\/(\\d+)/);'
      + 'vid=(pm?pm[1]:null)||(nm?nm[1]:null);'
      + 'var modalM=window.location.search.match(/modal_id=(\\d+)/);'
      + 'if(!vid&&modalM)vid=modalM[1];'
      + 'r.dbg.vid=vid||"";'
      + 'r.dbg.url=window.location.href;'

      + 'var found=null;'

      + 'var rd=document.getElementById("RENDER_DATA");'
      + 'r.dbg.hasRD=!!rd;'
      + 'if(rd){'
      + 'var dec=decodeURIComponent(rd.textContent||"");'
      + 'r.dbg.rdLen=dec.length;'
      + 'try{'
      + 'var jd=JSON.parse(dec);'
      + 'r.dbg.topKeys=Object.keys(jd).join(",");'

      + 'if(jd.app){'
      + 'r.dbg.appKeys=Object.keys(jd.app).join(",").substring(0,500);'

      + 'if(jd.app.videoDetail){'
      + 'var vd=jd.app.videoDetail;'
      + 'r.dbg.vdKeys=Object.keys(vd).join(",").substring(0,500);'
      + 'if(vd.video){r.dbg.vdVideoKeys=Object.keys(vd.video).join(",").substring(0,300);}'
      + 'if(vid&&String(vd.awemeId||vd.aweme_id||"")===vid){found=vd;r.dbg.vdMatch="id";}else if(!vid){found=vd;r.dbg.vdMatch="noid";}'
      + '}'

      + 'if(!found&&jd.app.preloadAwemeList&&jd.app.preloadAwemeList.length>0){'
      + 'for(var pi=0;pi<jd.app.preloadAwemeList.length;pi++){'
      + 'var pa=jd.app.preloadAwemeList[pi];'
      + 'if(vid&&String(pa.awemeId||pa.aweme_id||"")===vid){found=pa;r.dbg.preloadMatch=pi;break;}'
      + '}'
      + 'if(!found){found=jd.app.preloadAwemeList[0];r.dbg.preloadMatch="first";}'
      + '}'
      + '}'

      + 'if(!found){'
      + 'var candidates=[];'
      + '(function scan(o,d,p){'
      + 'if(!o||typeof o!=="object"||d>25)return;'
      + 'if(Array.isArray(o)){for(var i=0;i<o.length;i++)scan(o[i],d+1,p+"["+i+"]");return;}'
      + 'var hasId=o.aweme_id!==undefined||o.awemeId!==undefined;'
      + 'var hasVideo=o.video!==undefined&&typeof o.video==="object";'
      + 'var hasDesc=o.desc!==undefined||o.description!==undefined;'
      + 'if(hasId&&(hasVideo||hasDesc)){candidates.push({p:p,d:o});return;}'
      + 'for(var k in o){if(o[k]!==null&&typeof o[k]==="object")scan(o[k],d+1,p+"."+k);}'
      + '})(jd,0,"root");'

      + 'r.dbg.candCount=candidates.length;'
      + 'r.dbg.candPaths=candidates.map(function(c){return c.p;}).join(" | ");'

      + 'if(vid){for(var ci=0;ci<candidates.length;ci++){if(String(candidates[ci].d.aweme_id||candidates[ci].d.awemeId||"")===vid){found=candidates[ci].d;break;}}}'
      + 'if(!found&&candidates.length>0){found=candidates[0].d;}'
      + '}'

      + 'if(found){'
      + 'r.dbg.foundKeys=Object.keys(found).join(",").substring(0,300);'
      + 'var fv=found.video||{};'
      + 'r.dbg.foundVideoKeys=Object.keys(fv).join(",").substring(0,300);'
      + 'var pa=fv.play_addr||fv.playAddr;'
      + 'var da=fv.download_addr||fv.downloadAddr;'
      + 'var cv=fv.cover||fv.origin_cover||fv.poster;'
      + 'r.videoUrl=(pa&&pa.url_list&&pa.url_list[0])||(da&&da.url_list&&da.url_list[0])||"";'
      + 'r.coverUrl=(cv&&cv.url_list&&cv.url_list[0])||"";'
      + 'r.caption=found.desc||found.description||"";'
      + 'r.author=(found.author&&found.author.nickname)||(found.author&&found.author.name)||"";'
      + 'r.title=found.desc||found.description||"";'
      + 'if(found.images&&found.images.length>0){r.type="note";r.images=found.images.map(function(img){return img.url_list&&img.url_list[0]||"";}).filter(Boolean);}'
      + '}'
      + '}catch(e){r.dbg.rdErr=e.message;}'
      + '}'

      + 'if(!r.videoUrl){var ve=document.querySelector("video");if(ve){var vs=ve.src||"";if(vs.indexOf("blob:")!==0)r.videoUrl=vs;r.coverUrl=r.coverUrl||ve.poster||"";}}'
      + 'if(!r.coverUrl){var oi=document.querySelector("meta[property=\\"og:image\\"]");if(oi)r.coverUrl=oi.getAttribute("content")||"";}'
      + 'if(!r.caption){var od=document.querySelector("meta[property=\\"og:description\\"]");if(od)r.caption=od.getAttribute("content")||"";var de=document.querySelector("[data-e2e=\\"video-desc\\"]");if(de)r.caption=de.textContent.trim()||r.caption;var ae=document.querySelector("[data-e2e=\\"video-author\\"]");if(ae)r.author=ae.textContent.trim()||"";}'
      + 'if(!r.title){var te=document.querySelector("title");if(te)r.title=te.textContent.trim()||"";}'
      + '}catch(e){r.dbg.outerErr=e.message;}'
      + 'return r;'
      + '})()'
    );

    console.log('=== DEBUG ===');
    console.log('URL:', pageResult.dbg?.url);
    console.log('Video ID:', pageResult.dbg?.vid);
    console.log('Has RD:', pageResult.dbg?.hasRD, 'Len:', pageResult.dbg?.rdLen);
    console.log('App keys:', pageResult.dbg?.appKeys);
    console.log('VD keys:', pageResult.dbg?.vdKeys);
    console.log('VD video keys:', pageResult.dbg?.vdVideoKeys);
    console.log('VD match:', pageResult.dbg?.vdMatch);
    console.log('Candidate count:', pageResult.dbg?.candCount);
    console.log('Candidate paths:', pageResult.dbg?.candPaths);
    console.log('Found keys:', pageResult.dbg?.foundKeys);
    console.log('Found video keys:', pageResult.dbg?.foundVideoKeys);
    console.log('RD error:', pageResult.dbg?.rdErr);
    console.log('Video URL:', pageResult.videoUrl);
    console.log('Cover URL:', pageResult.coverUrl);
    console.log('Caption:', pageResult.caption?.substring(0, 50));
    console.log('Author:', pageResult.author);

    if (!pageResult.videoUrl && interceptedVideoUrls.length > 0) {
      pageResult.videoUrl = interceptedVideoUrls[0];
    }

    if (pageResult.videoUrl || pageResult.coverUrl) {
      return {
        success: true,
        data: {
          videoUrl: pageResult.videoUrl,
          coverUrl: pageResult.coverUrl,
          caption: pageResult.caption || pageResult.title || '',
          title: pageResult.title || '',
          author: pageResult.author || '',
          type: pageResult.type || 'video',
          images: pageResult.images || [],
        },
      };
    }

    return { success: false, message: '未能从页面中提取视频信息，请确保链接有效' };
  } catch (error) {
    console.error('Parse error:', error);
    return { success: false, message: '解析失败，请稍后重试' };
  } finally {
    if (page) await page.close().catch(() => {});
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

  console.log('Parsing URL:', url);

  const result = await parseWithPuppeteer(url);
  res.json(result);
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

process.on('SIGINT', async () => {
  if (browserInstance) {
    await browserInstance.close();
  }
  process.exit(0);
});

export default router;
