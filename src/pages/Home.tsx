import { useState, useCallback } from 'react';
import { Download, Copy, Check, Loader2, Video, Image, FileText, Music, AlertCircle, ExternalLink } from 'lucide-react';

interface VideoData {
  videoUrl: string;
  coverUrl: string;
  caption: string;
  title?: string;
  author?: string;
  type?: string;
  images?: string[];
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
  const [linkCopied, setLinkCopied] = useState(false);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });

      const data: ParseResult = await response.json();
      setResult(data);
    } catch {
      setResult({ success: false, message: '网络错误，请稍后重试' });
    } finally {
      setIsLoading(false);
    }
  }, [inputText]);

  const handleDownload = useCallback(async (url: string, filename: string) => {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch {
        prompt('请手动复制下载链接:', url);
      }
    }
  }, []);

  const handleCopyCaption = useCallback(() => {
    if (result?.data?.caption) {
      navigator.clipboard.writeText(result.data.caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  const handleCopyLink = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, []);

  const handleClear = useCallback(() => {
    setInputText('');
    setResult(null);
  }, []);

  const isImageType = result?.data?.type === 'note' || result?.data?.type === 'slides';

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
              placeholder={"请在此粘贴包含抖音链接的文本...\n\n例如：\n7.87 Rss:/ 这首歌太好听了 https://v.douyin.com/xxxx/ 复制此链接"}
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
                {result.data.coverUrl && (
                  <div className="relative">
                    <img
                      src={result.data.coverUrl}
                      alt="视频封面"
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {result.data.author && (
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full">
                            @{result.data.author}
                          </span>
                        )}
                        {isImageType && (
                          <span className="px-3 py-1 bg-purple-500/60 backdrop-blur-sm text-white text-sm rounded-full">
                            图集
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {result.data.caption && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        视频文案
                      </h3>
                      <div className="relative">
                        <p className="text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4 min-h-[80px]">
                          {result.data.caption}
                        </p>
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
                      </div>
                    </div>
                  )}

                  {isImageType && result.data.images && result.data.images.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        图集 ({result.data.images.length}张)
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {result.data.images.map((img, idx) => (
                          <a
                            key={idx}
                            href={img}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                          >
                            <img
                              src={img}
                              alt={`图片 ${idx + 1}`}
                              className="w-full h-32 object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={`grid ${isImageType ? 'grid-cols-2' : 'grid-cols-3'} gap-4`}>
                    {!isImageType && result.data.videoUrl && (
                      <button
                        onClick={() => handleDownload(result.data.videoUrl, 'douyin_video.mp4')}
                        className="flex flex-col items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors group"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">下载视频</span>
                      </button>
                    )}

                    {result.data.coverUrl && (
                      <button
                        onClick={() => handleDownload(result.data.coverUrl, 'douyin_cover.jpg')}
                        className="flex flex-col items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Image className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">下载封面</span>
                      </button>
                    )}

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

                  {result.data.videoUrl && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <ExternalLink className="w-3 h-3" />
                        视频直链
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={result.data.videoUrl}
                          className="flex-1 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 truncate"
                        />
                        <button
                          onClick={() => handleCopyLink(result.data.videoUrl)}
                          className="px-3 py-2 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap"
                        >
                          {linkCopied ? '已复制' : '复制链接'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
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
              在抖音APP中点击分享按钮，选择「复制链接」
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
              将复制的文本粘贴到输入框中，系统会自动提取链接
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
              点击「开始解析」按钮或使用 Ctrl+Enter 快捷键
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
              解析成功后可下载视频/封面、复制文案或复制直链
            </li>
          </ul>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          <p>支持解析抖音（douyin.com）视频和图集链接</p>
        </div>
      </div>
    </div>
  );
}