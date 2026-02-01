import React, { useState, useRef } from "react";
import {
  Calendar,
  Image as ImageIcon,
  Video,
  Hash,
  Clock,
  Heart,
  MessageSquare,
  Share2,
  Trash2,
  X,
  PlayCircle,
  Smartphone,
  BookOpen,
  Archive,
  ChevronDown,
  Maximize2,
  Copy,
  Check,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { usePosts } from "./hooks/usePosts";
import type { Post } from "./types/database";

// --- 工具函数 ---
// 将帖子按日期分组
const groupPostsByDate = (posts: Post[]) => {
  const groups: Record<string, Post[]> = {};
  posts.forEach((post) => {
    const dateObj = new Date(post.timestamp);
    // 格式化为：2023年10月27日 星期五
    const dateKey = dateObj.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(post);
  });
  return groups;
};

// --- 组件定义 ---

// 1. 顶部导航栏
const Navbar = () => (
  <nav className="sticky top-0 z-50 bg-white border-b border-gray-300 px-4 py-3 flex justify-between items-center shadow-sm">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-linear-to-br from-indigo-600 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
        <Archive size={18} />
      </div>
      <h1 className="text-xl font-bold text-gray-900 tracking-tight">
        LifeStore{" "}
        <span className="text-sm font-medium text-gray-600 ml-1">
          个人档案馆
        </span>
      </h1>
    </div>
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border border-gray-300 cursor-pointer">
        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
          alt="User"
        />
      </div>
    </div>
  </nav>
);

// 2. 侧边统计/日历
const Sidebar = ({ posts }: { posts: Post[] }) => {
  return (
    <div className="hidden lg:block w-80 shrink-0 p-6 sticky top-20 h-fit">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-300 mb-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-base">
          <Calendar size={18} className="text-indigo-600" />
          档案馆概览
        </h3>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-black text-indigo-700">
            {posts.length}
          </span>
          <span className="text-gray-900 text-sm font-bold">篇内容已归档</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2 mb-4 overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full"
            style={{ width: "70%" }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-700 font-medium">
          <span>上次更新</span>
          <span className="text-indigo-700">刚刚</span>
        </div>
      </div>
    </div>
  );
};

// 3. 核心：发布编辑器
interface CreateEditorProps {
  onAddPost: (
    post: Omit<Post, "id" | "timestamp">,
    mediaFile?: File,
  ) => Promise<void>;
}

const CreateEditor = ({ onAddPost }: CreateEditorProps) => {
  const [platform, setPlatform] = useState("xhs");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currTag, setCurrTag] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 支持回车或空格生成标签
    if ((e.key === "Enter" || e.key === " ") && currTag.trim()) {
      e.preventDefault();
      // 如果用户输入带#，自动去掉
      const cleanTag = currTag.trim().replace(/^#/, "");
      if (cleanTag && !tags.includes(cleanTag)) {
        setTags([...tags, cleanTag]);
      }
      setCurrTag("");
    }
  };

  // 智能粘贴处理
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteContent = e.clipboardData.getData("text");

    // 如果粘贴内容包含 #，则触发智能解析
    if (pasteContent.includes("#")) {
      e.preventDefault();

      const extractedTags = pasteContent
        .split(/[\s\n,]+/)
        .filter(
          (segment: string) => segment.startsWith("#") && segment.length > 1,
        )
        .map((segment: string) => segment.slice(1));

      const uniqueNewTags = extractedTags.filter(
        (tag: string) => !tags.includes(tag),
      );

      if (uniqueNewTags.length > 0) {
        setTags((prev) => [...prev, ...uniqueNewTags]);
        setCurrTag("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
      setMediaFile(file); // 保存文件引用用于上传
      if (file.type.startsWith("video/")) {
        setMediaType("video");
        setPlatform("tiktok");
      } else {
        setMediaType("image");
        setPlatform("xhs");
      }
    }
  };

  const handleSubmit = async () => {
    if (!title && !content) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newPost = {
        platform,
        title,
        content,
        tags,
        mediaType,
        mediaUrl: mediaFile ? "" : mediaUrl, // 如果有文件，URL 由上传服务生成
        likes: 0,
      };

      await onAddPost(newPost, mediaFile || undefined);
      setTitle("");
      setContent("");
      setTags([]);
      setMediaUrl("");
      setMediaFile(null);
      setIsExpanded(false);
    } catch (err) {
      console.error("提交失败:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchPlatform = (p: string) => {
    setPlatform(p);
    if (!mediaUrl) {
      setMediaType(p === "tiktok" ? "video" : "image");
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-200 mb-8 transition-all duration-300 overflow-hidden ${isExpanded ? "p-6 ring-4 ring-indigo-50 border-indigo-100" : "p-4"}`}
    >
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
        <div className="flex justify-between items-center mb-2">
          <div className="flex bg-gray-200 p-1 rounded-lg gap-1">
            <button
              onClick={() => switchPlatform("xhs")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-black transition-all ${platform === "xhs" ? "bg-white text-rose-600 shadow-md" : "text-gray-700 hover:text-gray-900"}`}
            >
              <BookOpen size={16} /> 小红书
            </button>
            <button
              onClick={() => switchPlatform("tiktok")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-black transition-all ${platform === "tiktok" ? "bg-black text-white shadow-md border border-gray-700" : "text-gray-700 hover:text-gray-900"}`}
            >
              <Smartphone size={16} /> 抖音
            </button>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-gray-900 hover:text-black p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <input
          type="text"
          placeholder={
            platform === "xhs" ? "输入文章标题..." : "输入视频描述..."
          }
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-xl font-black placeholder-gray-500 border-none outline-none focus:ring-0 px-0 text-gray-900"
          autoFocus
        />

        <textarea
          placeholder={
            platform === "xhs" ? "在这里撰写文章正文..." : "记录拍摄时的想法..."
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-32 resize-none text-gray-900 font-medium placeholder-gray-500 border-none outline-none focus:ring-0 px-0 text-lg leading-relaxed"
        />

        <div className="flex gap-4">
          {mediaUrl ? (
            <div
              className={`relative group rounded-xl overflow-hidden border border-gray-200 w-full bg-black/5 ${platform === "tiktok" ? "h-64 max-w-[180px]" : "h-40"}`}
            >
              {mediaType === "image" ? (
                <div className="relative w-full aspect-[3/4]">
                  <img
                    src={mediaUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white flex-col">
                  <Video size={32} />
                  <span className="text-xs mt-2 text-gray-400">视频已就绪</span>
                </div>
              )}
              <button
                onClick={() => setMediaUrl("")}
                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMediaType("image");
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition text-sm font-medium border border-gray-200 border-dashed"
              >
                <ImageIcon size={18} /> 上传配图
              </button>
              <button
                onClick={() => {
                  setMediaType("video");
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition text-sm font-medium border border-gray-200 border-dashed"
              >
                <Video size={18} /> 上传视频
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 min-h-[40px] border-t border-gray-300 pt-3">
          <Hash size={16} className="text-gray-600 font-bold" />
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-black flex items-center gap-1 border border-indigo-200"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-indigo-900"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder="粘贴 #话题 或输入按空格生成"
            value={currTag}
            onChange={(e) => setCurrTag(e.target.value)}
            onKeyDown={handleAddTag}
            onPaste={handlePaste}
            className="text-sm border-none outline-none focus:ring-0 min-w-[200px] flex-1 text-gray-900 font-bold placeholder-gray-500"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSubmit}
            disabled={!title || isSubmitting}
            className={`px-6 py-2 rounded-full font-bold text-white transition-all transform active:scale-95 flex items-center gap-2 ${title && !isSubmitting ? "bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200" : "bg-gray-300 cursor-not-allowed"}`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Archive size={16} />
                存入档案
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// 4. 内容卡片组件 (更新：移除正文显示，优化底部)
const PostCard = ({
  post,
  onDelete,
  onClick,
}: {
  post: Post;
  onDelete: (id: number | string) => void;
  onClick: (post: Post) => void;
}) => {
  const isTikTok = post.platform === "tiktok";

  return (
    <div className="relative pl-8 pb-10 group">
      {/* 坐标轴连线装饰 */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 ml-[-1px]"></div>

      <div
        onClick={() => onClick(post)}
        className="rounded-3xl shadow-sm border-2 overflow-hidden hover:shadow-xl transition-all duration-500 cursor-pointer bg-white group-hover:scale-[1.01] border-gray-300 hover:border-indigo-600"
      >
        {/* 统一的卡片顶部：使用颜色条作为平台区分 */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 rounded-full bg-rose-500"></div>
            <span className="text-[12px] font-black uppercase tracking-widest text-gray-900 flex items-center gap-1.5">
              <BookOpen size={14} /> {isTikTok ? "抖音" : "小红书"}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(post.id);
            }}
            className="text-gray-400 hover:text-red-700 p-1 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-[280px]">
          {/* 媒体区域：根据平台自动适配比例 */}
          {post.mediaUrl && (
            <div className="md:w-64 shrink-0 relative bg-gray-100 border-r border-gray-100 overflow-hidden">
              {post.mediaType === "image" ? (
                <div
                  className={`w-full h-full relative overflow-hidden ${isTikTok ? "aspect-[9/16]" : "aspect-[3/4]"}`}
                >
                  <img
                    src={post.mediaUrl}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              ) : (
                <div
                  className={`w-full h-full relative overflow-hidden ${isTikTok ? "aspect-[9/16]" : "aspect-[3/4]"}`}
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors z-10"></div>
                  <img
                    src="https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&q=80&w=800"
                    className="w-full h-full object-cover"
                    alt="Video preview"
                  />
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-md border border-white/50 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <PlayCircle
                        size={32}
                        className="text-white fill-white/20"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 文字内容区域：统一排版 */}
          <div className="p-7 flex-1 flex flex-col justify-between bg-[#FCFCFD] overflow-hidden">
            <div>
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-black text-2xl leading-tight text-gray-900 group-hover:text-black transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <Maximize2
                  size={16}
                  className="text-gray-400 group-hover:text-indigo-600 transition-colors mt-1"
                />
              </div>

              <p className="text-sm font-bold text-gray-500 leading-relaxed mb-6 line-clamp-3">
                {post.content}
              </p>

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {post.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-black px-2.5 py-1 rounded-lg border-2 text-rose-600 border-rose-100 bg-rose-50"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 底部互动信息：统一视觉高度 */}
            <div className="flex items-center justify-between pt-5 mt-4 border-t border-gray-200">
              <div className="flex gap-6">
                <div className="flex items-center gap-1.5 text-sm font-black text-gray-800">
                  <Clock size={18} className="text-indigo-600" />
                  <span>已存档于系统</span>
                </div>
              </div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                ID: {post.id}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. 日期分组组件
const DateGroup = ({
  dateLabel,
  groupPosts,
  onDeletePost,
  onPostClick,
}: {
  dateLabel: string;
  groupPosts: Post[];
  onDeletePost: (id: number | string) => void;
  onPostClick: (post: Post) => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center mb-6 -ml-4 md:-ml-10">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="pointer-events-auto bg-white text-gray-900 px-5 py-2 rounded-full text-base font-black shadow-md border-2 border-indigo-100 flex items-center gap-2 hover:border-indigo-600 transition-all cursor-pointer select-none group"
        >
          <div
            className={`w-2.5 h-2.5 rounded-full bg-indigo-600 transition-all duration-300 ${!isOpen && "bg-gray-600"}`}
          ></div>
          <span>{dateLabel}</span>
          <ChevronDown
            size={16}
            className={`text-gray-900 font-bold transition-transform duration-300 ${!isOpen && "-rotate-90"}`}
          />
        </button>

        {!isOpen && (
          <span className="ml-3 text-sm text-indigo-700 bg-white px-3 py-1 rounded-full border-2 border-indigo-100 font-black shadow-sm animate-in fade-in zoom-in-95">
            {groupPosts.length} 篇归档
          </span>
        )}
      </div>

      <div
        className={`space-y-0 transition-all duration-300 ease-in-out origin-top overflow-hidden ${isOpen ? "opacity-100 max-h-[5000px]" : "opacity-0 max-h-0"}`}
      >
        {groupPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onDelete={onDeletePost}
            onClick={onPostClick}
          />
        ))}
      </div>
    </div>
  );
};

// 6. 详情卡片 Modal (新增：复制功能)
const PostDetailModal = ({
  post,
  onClose,
}: {
  post: Post | null;
  onClose: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!post) return null;
  const isTikTok = post.platform === "tiktok";

  const handleCopy = () => {
    // 组合文本：标题 + 换行 + 正文 + 换行 + 话题
    const tagsText = post.tags ? post.tags.map((t) => `#${t}`).join(" ") : "";
    const textToCopy = `${post.title}\n\n${post.content}\n\n${tagsText}`;

    // 使用临时 textarea 进行复制，兼容性更好
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
    document.body.removeChild(textArea);
  };

  // 一键下载媒体文件
  const handleDownload = async () => {
    if (!post.mediaUrl || downloading) return;

    setDownloading(true);
    try {
      // 获取媒体数据
      const response = await fetch(post.mediaUrl);
      const blob = await response.blob();

      // 生成文件名
      const extension = post.mediaType === "video" ? "mp4" : "jpg";
      const platformLabel = isTikTok ? "抖音" : "小红书";
      const safeTitle = post.title
        .replace(/[^\w\u4e00-\u9fa5]/g, "_")
        .slice(0, 20);
      const filename = `${platformLabel}_${safeTitle}_${post.id}.${extension}`;

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("下载失败:", err);
      alert("下载失败，请稍后再试");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 bg-white text-gray-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full transition-colors bg-gray-100 hover:bg-gray-200 text-gray-500"
        >
          <X size={24} />
        </button>

        {/* Left: Media Section - 按平台比例自动裁剪 */}
        <div className="md:w-3/5 h-[40%] md:h-full bg-gray-100 flex items-center justify-center relative overflow-hidden">
          {post.mediaUrl ? (
            post.mediaType === "image" ? (
              <div
                className={`relative w-full h-full flex items-center justify-center bg-black/5 overflow-hidden`}
              >
                <div
                  className={`relative ${isTikTok ? "aspect-[9/16]" : "aspect-[3/4]"} h-full`}
                >
                  <img
                    src={post.mediaUrl}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div
                className={`relative w-full h-full flex items-center justify-center bg-gray-900 overflow-hidden`}
              >
                <div
                  className={`relative ${isTikTok ? "aspect-[9/16]" : "aspect-[3/4]"} h-full`}
                >
                  <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/20 pointer-events-none z-10"></div>
                  <img
                    src="https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&q=80&w=1200"
                    className="w-full h-full object-cover opacity-60"
                    alt="Video cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <PlayCircle size={64} className="text-white opacity-80" />
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
              <span className="text-6xl mb-4">📝</span>
              <p>纯文字记录</p>
            </div>
          )}
        </div>

        {/* Right: Content Section */}
        <div className="md:w-2/5 flex flex-col h-full relative">
          {/* Header: User Info */}
          <div className="p-6 pr-16 border-b flex items-center justify-between border-gray-100">
            {" "}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                  alt="User"
                />
              </div>
              <div>
                <div className="font-bold text-sm">Felix</div>
                <div className="text-xs mt-0.5 text-gray-500">
                  {new Date(post.timestamp).toLocaleString("zh-CN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
            <div className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-500">
              {isTikTok ? "抖音" : "小红书"}
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 border-t border-gray-300 bg-gray-50 shadow-inner shadow-gray-300/20">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b leading-snug border-gray-200">
              {post.title}
            </h2>
            <div className="whitespace-pre-wrap leading-7 text-[15px] text-gray-600 mb-8">
              {post.content}
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-4 border-t rounded-lg p-4 border-gray-300 bg-gray-50/50">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer: Actions */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-between items-center max-w-xs mx-auto md:max-w-none">
              <button className="flex flex-col items-center gap-1 group w-16">
                <div className="p-2.5 rounded-full transition-transform group-active:scale-90 bg-white group-hover:bg-rose-50 shadow-sm">
                  <Heart
                    size={20}
                    className="transition-colors text-gray-400 group-hover:text-rose-500"
                  />
                </div>
                <span className="text-xs font-medium text-gray-400">
                  {post.likes}
                </span>
              </button>

              <button className="flex flex-col items-center gap-1 group w-16">
                <div className="p-2.5 rounded-full transition-transform group-active:scale-90 bg-white group-hover:bg-blue-50 shadow-sm">
                  <MessageSquare
                    size={20}
                    className="transition-colors text-gray-400 group-hover:text-blue-500"
                  />
                </div>
                <span className="text-xs font-medium text-gray-400">评论</span>
              </button>

              <button className="flex flex-col items-center gap-1 group w-16">
                <div className="p-2.5 rounded-full transition-transform group-active:scale-90 bg-white group-hover:bg-green-50 shadow-sm">
                  <Share2
                    size={20}
                    className="transition-colors text-gray-400 group-hover:text-green-500"
                  />
                </div>
                <span className="text-xs font-medium text-gray-400">分享</span>
              </button>

              {/* 新增：复制按钮 */}
              <button
                onClick={handleCopy}
                className="flex flex-col items-center gap-1 group w-16"
              >
                <div className="p-2.5 rounded-full transition-transform group-active:scale-90 bg-white group-hover:bg-indigo-50 shadow-sm">
                  {copied ? (
                    <Check size={20} className="text-green-500" />
                  ) : (
                    <Copy
                      size={20}
                      className="transition-colors text-gray-400 group-hover:text-indigo-500"
                    />
                  )}
                </div>
                <span
                  className={`text-xs font-medium transition-colors ${copied ? "text-green-500" : "text-gray-400"}`}
                >
                  {copied ? "已复制" : "复制"}
                </span>
              </button>

              {/* 新增：下载按钮 */}
              {post.mediaUrl && (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex flex-col items-center gap-1 group w-16"
                >
                  <div
                    className={`p-2.5 rounded-full transition-transform group-active:scale-90 shadow-sm ${downloading ? "bg-amber-100" : "bg-white group-hover:bg-amber-50"}`}
                  >
                    {downloading ? (
                      <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Download
                        size={20}
                        className="transition-colors text-gray-400 group-hover:text-amber-600"
                      />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium transition-colors ${downloading ? "text-amber-600" : "text-gray-400"}`}
                  >
                    {downloading ? "下载中" : "下载"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 7. 主应用
const App = () => {
  const [currentTab, setCurrentTab] = useState("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // 使用 usePosts Hook 管理数据
  const { posts, loading, error, addPost, removePost } = usePosts();

  const filteredPosts = posts.filter((post) => {
    if (currentTab === "all") return true;
    return post.platform === currentTab;
  });

  const sortedPosts = [...filteredPosts].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );

  const groupedPosts = groupPostsByDate(sortedPosts);

  // 处理删除帖子
  const handleDeletePost = async (id: number | string) => {
    try {
      await removePost(id);
    } catch (err) {
      console.error("删除失败:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-gray-800 font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto pt-8 px-4 flex gap-8 items-start">
        <div className="flex-1 min-w-0">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">我的档案</h2>

            <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
              <button
                onClick={() => setCurrentTab("all")}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentTab === "all" ? "bg-indigo-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"}`}
              >
                全部
              </button>
              <button
                onClick={() => setCurrentTab("xhs")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentTab === "xhs" ? "bg-indigo-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"}`}
              >
                <BookOpen size={16} /> 小红书
              </button>
              <button
                onClick={() => setCurrentTab("tiktok")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentTab === "tiktok" ? "bg-indigo-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"}`}
              >
                <Smartphone size={16} /> 抖音
              </button>
            </div>
          </div>

          {/* 发布编辑器 - 条件显示 */}
          {showEditor && <CreateEditor onAddPost={addPost} />}

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* 加载状态 */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2
                size={32}
                className="animate-spin text-indigo-600 mb-4"
              />
              <span className="text-sm font-medium">正在加载档案...</span>
            </div>
          ) : (
            <div className="pl-4 md:pl-10 relative min-h-[300px]">
              {Object.keys(groupedPosts).length > 0 ? (
                // 遍历日期分组
                Object.entries(groupedPosts).map(([dateLabel, groupPosts]) => (
                  <DateGroup
                    key={dateLabel}
                    dateLabel={dateLabel}
                    groupPosts={groupPosts}
                    onDeletePost={handleDeletePost}
                    onPostClick={setSelectedPost}
                  />
                ))
              ) : (
                <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border border-gray-200 border-dashed">
                  <p>该分类下暂无档案，开始存入你的第一篇内容吧！</p>
                </div>
              )}
            </div>
          )}

          <div className="text-center py-16 flex flex-col items-center gap-3 text-gray-900">
            <Archive size={32} className="text-indigo-700" />
            <span className="text-sm font-black tracking-widest uppercase">
              所有历史档案已加载完毕
            </span>
          </div>
        </div>

        <Sidebar posts={posts} />
      </main>

      {/* 详情弹窗 */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
};

export default App;
