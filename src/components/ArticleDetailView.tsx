import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  Copy,
  Edit3,
  Eye,
  Grid,
  Home,
  Image as ImageIcon,
  Link as LinkIcon,
  Newspaper,
  Send,
  Share2,
  Tag,
  Trash2,
  UserPen,
  Volume2,
  X,
} from 'lucide-react';
import { Article, ArticleImage, PageView, SectionType, User } from '../types';
import { AIVoiceReader } from './AIVoiceReader';
import { updatePageSEO } from '../utils/seo';
import { sanitizeHtml } from '../utils/sanitizer';

interface ArticleDetailViewProps {
  article: Article;
  allArticles?: Article[];
  currentUser?: User | null;
  siteConfig?: any;
  onBack: () => void;
  onGoHome: () => void;
  onOpenArticle?: (article: Article) => void;
  onSelectSection?: (section: PageView) => void;
  onEditArticle?: (article: Article) => void;
  onDeleteArticle?: (articleId: number) => void;
}

export const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({
  article,
  allArticles = [],
  currentUser = null,
  siteConfig,
  onBack,
  onGoHome,
  onOpenArticle,
  onSelectSection,
  onEditArticle,
  onDeleteArticle,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const shareDropdownRef = useRef<HTMLDivElement>(null);

  // Dynamic SEO update when article mounts
  useEffect(() => {
    updatePageSEO(article);
    return () => {
      updatePageSEO(null);
    };
  }, [article]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target as Node)) {
        setIsShareOpen(false);
      }
    };
    if (isShareOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isShareOpen]);

  const handleCopyLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  const paragraphs = (article.content || article.excerpt)
    .split('\n')
    .filter((p) => p.trim() !== '');

  const getCategoryLabel = (key: string) => {
    switch (key) {
      case 'ctd':
        return 'Công tác Đảng - CTCT';
      case 'hl':
        return 'Huấn luyện - SSCĐ';
      case 'bac':
        return 'Học tập theo Bác';
      case 'qs':
        return 'Quân sự - Quốc phòng';
      case 'hkt':
        return 'Hậu cần - Kỹ thuật';
      default:
        return 'Tin tức Hoạt động';
    }
  };

  const relatedArticles = allArticles
    .filter((a) => a.id !== article.id && (!a.status || a.status === 'approved' || a.status !== 'pending'))
    .slice(0, 3);

  const handleDelete = () => {
    if (!onDeleteArticle) return;
    onDeleteArticle(article.id);
    onBack();
  };

  // Group images by position
  const imagesList: ArticleImage[] =
    article.images && article.images.length > 0
      ? article.images
      : article.image
      ? [
          {
            id: 'default-img',
            url: article.image,
            caption: article.title,
            position: 'top',
          },
        ]
      : [];

  const topImages = imagesList.filter((img) => img.position === 'top');
  const middle1Images = imagesList.filter((img) => img.position === 'middle_1');
  const middle2Images = imagesList.filter((img) => img.position === 'middle_2');
  const bottomImages = imagesList.filter((img) => img.position === 'bottom');
  const floatLeftImages = imagesList.filter((img) => img.position === 'float_left');
  const floatRightImages = imagesList.filter((img) => img.position === 'float_right');
  const galleryImages = imagesList.filter((img) => img.position === 'gallery');

  return (
    <article className="bg-white rounded-lg p-5 sm:p-8 shadow-xs border border-gray-200 space-y-6">
      {/* 1. Clickable Breadcrumb & Admin Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
          <button
            type="button"
            onClick={onGoHome}
            className="hover:text-red-700 flex items-center gap-1 cursor-pointer font-semibold text-gray-700 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => onSelectSection && onSelectSection(article.sectionKey)}
            className="text-red-700 hover:text-red-800 font-bold hover:underline cursor-pointer transition-colors"
          >
            {getCategoryLabel(article.sectionKey)}
          </button>
          <span>/</span>
          <span className="text-gray-500 font-medium truncate max-w-[240px] bg-gray-100 px-2 py-0.5 rounded text-[11px]">
            {article.category}
          </span>
        </nav>

        {/* Admin Quick Action Controls */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            {onEditArticle && (
              <button
                type="button"
                onClick={() => onEditArticle(article)}
                className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Sửa bài & ảnh</span>
              </button>
            )}

            {onDeleteArticle && (
              showDeleteConfirm ? (
                <div className="flex items-center gap-1 bg-red-50 p-1 rounded-md border border-red-200">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-2 py-1 rounded transition-colors cursor-pointer"
                  >
                    Xác nhận xóa
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-2 py-1 rounded cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-100 hover:bg-red-200 text-red-900 border border-red-300 text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa bài viết</span>
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* 2. Main Title */}
      <h1 className="font-sans text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-tight">
        {article.title}
      </h1>

      {/* 3. Metadata Bar */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pb-4 border-b border-gray-200">
        <span className="flex items-center gap-1 text-gray-800 font-bold">
          <UserPen className="w-3.5 h-3.5 text-red-700" />
          <span>Tác giả: {article.author}</span>
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span>{article.date}</span>
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-3.5 h-3.5 text-gray-400" />
          <span>{article.views || 0} lượt xem</span>
        </span>
        <button
          type="button"
          onClick={() => onSelectSection && onSelectSection(article.sectionKey)}
          className="ml-auto inline-flex items-center gap-1 text-[11px] text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
        >
          <Tag className="w-3 h-3" />
          <span>Chuyên mục: {getCategoryLabel(article.sectionKey)}</span>
        </button>
      </div>

      {/* AI Voice Reader */}
      <div className="space-y-2.5">
        <AIVoiceReader
          title="Đọc bài viết báo chí"
          textToRead={`${article.title}. ${article.excerpt}. ${paragraphs.join('. ')}`}
          sourceType="article"
        />
      </div>

      {/* 4. Sapo / Lead Paragraph */}
      <div className="text-sm md:text-base font-bold text-gray-800 leading-relaxed bg-amber-50/70 p-4 rounded-md border-l-4 border-red-700">
        {article.excerpt}
      </div>

      {/* Embedded Media / Video / Iframe if available */}
      {article.embedCode && (
        <div className="my-5 p-3 sm:p-4 bg-slate-950 text-white rounded-xl shadow-md border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800 text-amber-300 font-bold">
            <span className="flex items-center gap-1.5 uppercase tracking-wide">
              <span>Nội dung đa phương tiện nhúng</span>
            </span>
            <span className="text-[10px] text-gray-400 font-normal">Iframe / Video phát trực tuyến</span>
          </div>
          <div
            className="overflow-hidden rounded-lg bg-black flex justify-center items-center"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.embedCode) }}
          />
        </div>
      )}

      {/* 5. TOP POSITION IMAGES */}
      {topImages.length > 0 && (
        <div className="space-y-4 my-6">
          {topImages.map((img) => (
            <figure key={img.id} className="text-center">
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-xs">
                <img
                  src={img.url}
                  alt={img.caption || article.title}
                  className="w-full max-h-[480px] object-cover"
                  loading="lazy"
                />
              </div>
              {img.caption && (
                <figcaption className="text-xs italic text-gray-600 mt-2 font-medium bg-gray-50 p-2 rounded-b border-t border-gray-100">
                  {img.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}

      {/* 6. Body Content with interleaved Images & Floats */}
      <div className="text-sm md:text-[15px] leading-relaxed text-gray-800 space-y-4 text-justify font-normal clear-both">
        {/* Float Right Image if any */}
        {floatRightImages.map((img) => (
          <div
            key={img.id}
            className="md:float-right md:w-5/12 md:ml-6 md:mb-4 w-full my-3 text-center"
          >
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-xs">
              <img
                src={img.url}
                alt={img.caption || article.title}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
            {img.caption && (
              <p className="text-[11px] italic text-gray-600 mt-1.5 font-medium bg-gray-50 p-1.5 rounded">
                {img.caption}
              </p>
            )}
          </div>
        ))}

        {/* Float Left Image if any */}
        {floatLeftImages.map((img) => (
          <div
            key={img.id}
            className="md:float-left md:w-5/12 md:mr-6 md:mb-4 w-full my-3 text-center"
          >
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-xs">
              <img
                src={img.url}
                alt={img.caption || article.title}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
            {img.caption && (
              <p className="text-[11px] italic text-gray-600 mt-1.5 font-medium bg-gray-50 p-1.5 rounded">
                {img.caption}
              </p>
            )}
          </div>
        ))}

        {/* Paragraphs rendering */}
        {paragraphs.map((p, idx) => (
          <React.Fragment key={idx}>
            <p className="indent-6">{p}</p>

            {/* Middle 1 position images (after paragraph 0) */}
            {idx === 0 && middle1Images.length > 0 && (
              <div className="my-5 space-y-3 clear-both">
                {middle1Images.map((img) => (
                  <figure key={img.id} className="text-center">
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-xs">
                      <img
                        src={img.url}
                        alt={img.caption || article.title}
                        className="w-full max-h-[460px] object-cover"
                        loading="lazy"
                      />
                    </div>
                    {img.caption && (
                      <figcaption className="text-xs italic text-gray-600 mt-2 font-medium bg-gray-50 p-2 rounded-b border-t border-gray-100">
                        {img.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}

            {/* Middle 2 position images (after paragraph 1) */}
            {idx === 1 && middle2Images.length > 0 && (
              <div className="my-5 space-y-3 clear-both">
                {middle2Images.map((img) => (
                  <figure key={img.id} className="text-center">
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-xs">
                      <img
                        src={img.url}
                        alt={img.caption || article.title}
                        className="w-full max-h-[460px] object-cover"
                        loading="lazy"
                      />
                    </div>
                    {img.caption && (
                      <figcaption className="text-xs italic text-gray-600 mt-2 font-medium bg-gray-50 p-2 rounded-b border-t border-gray-100">
                        {img.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* 7. BOTTOM POSITION IMAGES */}
      {bottomImages.length > 0 && (
        <div className="space-y-4 my-6 clear-both">
          {bottomImages.map((img) => (
            <figure key={img.id} className="text-center">
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-xs">
                <img
                  src={img.url}
                  alt={img.caption || article.title}
                  className="w-full max-h-[480px] object-cover"
                  loading="lazy"
                />
              </div>
              {img.caption && (
                <figcaption className="text-xs italic text-gray-600 mt-2 font-medium bg-gray-50 p-2 rounded-b border-t border-gray-100">
                  {img.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}

      {/* 8. GALLERY GRID (If any images designated as gallery) */}
      {galleryImages.length > 0 && (
        <div className="my-6 pt-4 border-t border-gray-200 clear-both space-y-3">
          <h4 className="text-xs font-black uppercase text-gray-900 flex items-center gap-1.5">
            <Grid className="w-4 h-4 text-red-700" />
            <span>Bộ sưu tập hình ảnh hoạt động ({galleryImages.length} ảnh)</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {galleryImages.map((img) => (
              <figure
                key={img.id}
                className="bg-gray-50 p-2 rounded-lg border border-gray-200 text-center flex flex-col justify-between"
              >
                <div className="h-40 rounded overflow-hidden bg-gray-200 mb-2">
                  <img
                    src={img.url}
                    alt={img.caption || 'Ảnh bộ sưu tập'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                </div>
                {img.caption && (
                  <figcaption className="text-[11px] italic text-gray-600 font-medium line-clamp-2">
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      )}

      {/* 9. Footer Action Buttons */}
      <div className="pt-5 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 clear-both">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-back-from-article"
            onClick={onBack}
            className="bg-gray-700 hover:bg-gray-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </button>

          <button
            type="button"
            onClick={onGoHome}
            className="bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Về Trang chủ</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectSection && onSelectSection(article.sectionKey)}
            className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Xem thêm bài viết chuyên trang</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Integrated Share Button with Dropdown Popover */}
          <div className="relative" ref={shareDropdownRef}>
            <button
              type="button"
              id="btn-share-article"
              onClick={() => setIsShareOpen(!isShareOpen)}
              className={`text-xs font-bold flex items-center gap-1.5 px-3.5 py-2 rounded-lg border transition-all cursor-pointer shadow-xs ${
                isShareOpen
                  ? 'bg-red-700 text-white border-red-700 shadow-md ring-2 ring-red-300'
                  : 'bg-white text-gray-700 hover:text-red-700 hover:bg-red-50 border-gray-300 hover:border-red-300'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Chia sẻ bài viết</span>
            </button>

            {/* Share Popover Menu */}
            {isShareOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 p-2.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 px-1">
                  <span className="text-[11px] font-black uppercase text-gray-800 flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5 text-red-700" />
                    <span>Chia sẻ lên nền tảng</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsShareOpen(false)}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {/* Facebook */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                      typeof window !== 'undefined' ? window.location.href : ''
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsShareOpen(false)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold text-gray-800 hover:bg-blue-50 hover:text-blue-700 transition-colors group cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#1877F2] text-white flex items-center justify-center font-bold text-xs shadow-2xs group-hover:scale-105 transition-transform">
                      f
                    </div>
                    <span>Facebook</span>
                  </a>

                  {/* Zalo */}
                  <a
                    href={`https://zalo.me/share?url=${encodeURIComponent(
                      typeof window !== 'undefined' ? window.location.href : ''
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsShareOpen(false)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold text-gray-800 hover:bg-blue-50 hover:text-blue-600 transition-colors group cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#0068FF] text-white flex items-center justify-center font-bold text-[10px] shadow-2xs group-hover:scale-105 transition-transform">
                      Z
                    </div>
                    <span>Zalo</span>
                  </a>

                  {/* X / Twitter */}
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                      typeof window !== 'undefined' ? window.location.href : ''
                    )}&text=${encodeURIComponent(article.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsShareOpen(false)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold text-gray-800 hover:bg-gray-100 hover:text-black transition-colors group cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center font-bold text-xs shadow-2xs group-hover:scale-105 transition-transform">
                      𝕏
                    </div>
                    <span>X (Twitter)</span>
                  </a>

                  {/* Telegram */}
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(
                      typeof window !== 'undefined' ? window.location.href : ''
                    )}&text=${encodeURIComponent(article.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsShareOpen(false)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold text-gray-800 hover:bg-sky-50 hover:text-[#229ED9] transition-colors group cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#229ED9] text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                      <Send className="w-3 h-3" />
                    </div>
                    <span>Telegram</span>
                  </a>

                  {/* Copy Link Button */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                      isCopied
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-gray-50 text-gray-800 hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs shadow-2xs ${
                        isCopied ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-white'
                      }`}>
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3 h-3" />}
                      </div>
                      <span>{isCopied ? 'Đã sao chép link!' : 'Sao chép liên kết'}</span>
                    </span>
                    {isCopied && <span className="text-[10px] text-emerald-600 font-bold">Xong</span>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 10. Related Articles Block */}
      {relatedArticles.length > 0 && (
        <div className="mt-8 pt-6 border-t-2 border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold uppercase text-gray-900 flex items-center gap-1.5">
              <Newspaper className="w-4 h-4 text-red-700" />
              <span>Tin tức liên quan & Bài viết khác</span>
            </h3>
            <button
              type="button"
              onClick={() => onSelectSection && onSelectSection(article.sectionKey)}
              className="text-xs text-red-700 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {relatedArticles.map((rel) => (
              <div
                key={rel.id}
                onClick={() => onOpenArticle && onOpenArticle(rel)}
                className="bg-gray-50 hover:bg-red-50/40 p-3 rounded-lg border border-gray-200 hover:border-red-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-28 rounded overflow-hidden mb-2 bg-gray-200">
                    <img
                      src={rel.image || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800'}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <span className="absolute top-1 left-1 bg-white/90 text-red-700 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
                      {rel.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 group-hover:text-red-700 transition-colors line-clamp-2 leading-snug">
                    {rel.title}
                  </h4>
                </div>
                <div className="mt-2 pt-1.5 border-t border-gray-200/60 flex items-center justify-between text-[10px] text-gray-500">
                  <span className="truncate max-w-[120px]">{rel.author}</span>
                  <span>{rel.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};
