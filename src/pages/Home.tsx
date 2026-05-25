import { useState, useCallback } from 'react';
import { Download, Copy, Check, Loader2, Video, Image, FileText, Music } from 'lucide-react';

interface VideoData {
  videoUrl: string;
  coverUrl: string;
  caption: string;
  title?: string;
  author?: string;
}

interface ParseResult {
  success: boolean;
  message?: string;
  data?: VideoData;
}

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleParse = useCallback(async () => {
    if (!inputText.trim()) {
      setResult({ success: false, message: '请输入包含抖音链接的文本' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/douyin/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      const data: ParseResult = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, message: '网络错误，请稍后重试' });
    } finally {
      setIsLoading(false);
    }
  }, [inputText]);

  const handleDownload = useCallback(async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const urlObject = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlObject;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(urlObject);
    } catch (error) {
      alert('下载失败，请手动复制链接');
    }
  }, []);

  const handleCopyCaption = useCallback(() => {
    if (result?.data?.caption) {
      navigator.clipboard.writeText(result.data.caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  const handleClear = useCallback(() => {
    setInputText('');
    setResult(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl mb-4 shadow-lg">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent mb-2">
            抖音视频解析器
          </h1>
          <p className="text-gray-500">输入包含抖音链接的文本，一键解析视频、封面和文案</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请在此粘贴包含抖音链接的文本...&#10;&#10;例如：&#10;这是一个有趣的视频 https://v.douyin.com/xxxx/ 快来看看"
              className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl resize-none focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all text-gray-700 placeholder-gray-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleParse();
                }
              }}
            />
            {inputText && (
              <button
                onClick={handleClear}
                className="absolute top-3 right-3 px-3 py-1 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                清空
              </button>
            )}
          </div>
          
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleParse}
              disabled={isLoading}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  解析中...
                </>
              ) : (
                '开始解析'
              )}
            </button>
          </div>
          
          <p className="mt-3 text-xs text-gray-400 text-center">
            快捷键: Ctrl + Enter 快速解析
          </p>
        </div>

        {result && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {result.success && result.data ? (
              <>
                <div className="relative">
                  <img
                    src={result.data.coverUrl}
                    alt="视频封面"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                    <div className="flex items-center gap-2">
                      {result.data.author && (
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full">
                          {result.data.author}
                        </span>
                      )}
                      {result.data.title && (
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full">
                          {result.data.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      视频文案
                    </h3>
                    <div className="relative">
                      <p className="text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4 min-h-[80px]">
                        {result.data.caption || '暂无文案'}
                      </p>
                      {result.data.caption && (
                        <button
                          onClick={handleCopyCaption}
                          className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="复制文案"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => handleDownload(result.data.videoUrl, 'douyin_video.mp4')}
                      className="flex flex-col items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors group"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Video className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">下载视频</span>
                    </button>

                    <button
                      onClick={() => handleDownload(result.data.coverUrl, 'douyin_cover.jpg')}
                      className="flex flex-col items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Image className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">下载封面</span>
                    </button>

                    <button
                      onClick={handleCopyCaption}
                      disabled={!result.data.caption}
                      className="flex flex-col items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        {copied ? (
                          <Check className="w-6 h-6 text-white" />
                        ) : (
                          <Copy className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {copied ? '已复制' : '复制文案'}
                      </span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-gray-600 text-lg font-medium mb-2">解析失败</p>
                <p className="text-gray-400">{result.message}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-white/50 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">使用说明</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
              将包含抖音链接的文本粘贴到输入框中
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
              点击「开始解析」按钮或使用 Ctrl+Enter 快捷键
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
              解析成功后可下载视频、封面图片或复制文案
            </li>
          </ul>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          <p>支持解析抖音（douyin.com）和 TikTok（tiktok.com）链接</p>
        </div>
      </div>
    </div>
  );
}