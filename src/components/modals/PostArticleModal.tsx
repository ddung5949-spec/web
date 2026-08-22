import React, { useEffect, useRef, useState } from 'react';
import {
  AlignLeft,
  AlignRight,
  CheckCircle2,
  Code,
  FileEdit,
  Grid,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
  Upload,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  Article,
  ArticleImage,
  ArticleImagePosition,
  SectionType,
  SiteConfig,
  User,
} from '../../types';
import { defaultSiteConfig } from '../../data/initialData';

interface PostArticleModalProps {
  isOpen: boolean;
  sectionKey: SectionType;
  currentUser: User | null;
  siteConfig?: SiteConfig;
  articleToEdit?: Article | null;
  onClose: () => void;
  onSubmitArticle: (data: {
    title: string;
    category: string;
    author: string;
    image: string;
    images?: ArticleImage[];
    excerpt: string;
    content: string;
    embedCode?: string;
    sectionKey: SectionType;
    status?: 'approved' | 'pending';
  }) => Promise<boolean | void> | boolean | void;
  onUpdateArticle?: (updated: Article) => Promise<boolean | void> | boolean | void;
  onDeleteArticle?: (articleId: number) => Promise<boolean | void> | boolean | void;
}

const getDraftKey = (articleId?: number | null) =>
  articleId ? `mangyang_article_draft_${articleId}` : 'mangyang_article_draft_new';

export const PostArticleModal: React.FC<PostArticleModalProps> = ({
  isOpen,
  sectionKey,
  currentUser,
  siteConfig,
  articleToEdit = null,
  onClose,
  onSubmitArticle,
  onUpdateArticle,
  onDeleteArticle,
}) => {
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const activeSessionTargetRef = useRef<string | null>(null);

  const [selectedSection, setSelectedSection] = useState<SectionType>(sectionKey);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [author, setAuthor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [articleImages, setArticleImages] = useState<ArticleImage[]>([]);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [status, setStatus] = useState<'approved' | 'pending'>('pending');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  const isEditing = Boolean(articleToEdit);

  const currentSectionConfig =
    siteConfig?.sections?.[selectedSection] || defaultSiteConfig.sections[selectedSection];
  const categories = currentSectionConfig?.categories || [];

  // Initialize form state ONLY when modal transitions from closed to open or a different article is selected
  useEffect(() => {
    if (!isOpen) {
      activeSessionTargetRef.current = null;
      setFormError(null);
      setIsSubmitting(false);
      setIsDeleting(false);
      setDraftRestored(false);
      return;
    }

    const currentSessionTarget = articleToEdit ? `edit_${articleToEdit.id}` : 'new_article';

    // If modal is already open for this exact target, DO NOT re-initialize (protects active user typing)
    if (activeSessionTargetRef.current === currentSessionTarget) {
      return;
    }

    activeSessionTargetRef.current = currentSessionTarget;
    setFormError(null);
    setDraftRestored(false);

    const draftKey = getDraftKey(articleToEdit ? articleToEdit.id : null);
    let savedDraft: any = null;

    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        savedDraft = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not parse localStorage draft', e);
    }

    if (articleToEdit) {
      // If there's a draft that is newer or has unsaved edits, we can restore it
      if (savedDraft && (savedDraft.title || savedDraft.content)) {
        setSelectedSection(savedDraft.sectionKey || articleToEdit.sectionKey);
        setTitle(savedDraft.title || articleToEdit.title || '');
        setCategory(savedDraft.category || articleToEdit.category || '');
        setAuthor(savedDraft.author || articleToEdit.author || '');
        setImageUrl(savedDraft.imageUrl || articleToEdit.image || '');
        setEmbedCode(savedDraft.embedCode || articleToEdit.embedCode || '');
        setArticleImages(
          savedDraft.articleImages && savedDraft.articleImages.length > 0
            ? savedDraft.articleImages
            : articleToEdit.images && articleToEdit.images.length > 0
            ? articleToEdit.images
            : articleToEdit.image
            ? [{ id: 'img-main', url: articleToEdit.image, caption: articleToEdit.title, position: 'top' }]
            : []
        );
        setExcerpt(savedDraft.excerpt || articleToEdit.excerpt || '');
        setContent(savedDraft.content || articleToEdit.content || '');
        setStatus(savedDraft.status || articleToEdit.status || 'approved');
        setDraftRestored(true);
      } else {
        setSelectedSection(articleToEdit.sectionKey);
        setTitle(articleToEdit.title || '');
        setCategory(articleToEdit.category || '');
        setAuthor(articleToEdit.author || '');
        setImageUrl(articleToEdit.image || '');
        setEmbedCode(articleToEdit.embedCode || '');
        setArticleImages(
          articleToEdit.images && articleToEdit.images.length > 0
            ? articleToEdit.images
            : articleToEdit.image
            ? [{ id: 'img-main', url: articleToEdit.image, caption: articleToEdit.title, position: 'top' }]
            : []
        );
        setExcerpt(articleToEdit.excerpt || '');
        setContent(articleToEdit.content || '');
        setStatus(articleToEdit.status || 'approved');
      }
    } else {
      // New article draft check
      if (savedDraft && (savedDraft.title || savedDraft.content || savedDraft.excerpt)) {
        setSelectedSection(savedDraft.sectionKey || sectionKey);
        setTitle(savedDraft.title || '');
        setCategory(savedDraft.category || categories[0] || 'Tin tức hoạt động');
        setAuthor(
          savedDraft.author ||
            (currentUser ? `${currentUser.fullName} (${currentUser.rankUnit})` : '')
        );
        setImageUrl(savedDraft.imageUrl || '');
        setEmbedCode(savedDraft.embedCode || '');
        setArticleImages(savedDraft.articleImages || []);
        setExcerpt(savedDraft.excerpt || '');
        setContent(savedDraft.content || '');
        setStatus(savedDraft.status || (currentUser?.role === 'admin' ? 'approved' : 'pending'));
        setDraftRestored(true);
      } else {
        setSelectedSection(sectionKey);
        const defaultCats =
          siteConfig?.sections?.[sectionKey]?.categories ||
          defaultSiteConfig.sections[sectionKey]?.categories ||
          [];
        setCategory(defaultCats[0] || 'Tin tức hoạt động');
        if (currentUser) {
          setAuthor(`${currentUser.fullName} (${currentUser.rankUnit})`);
        } else {
          setAuthor('');
        }
        setTitle('');
        setImageUrl('');
        setEmbedCode('');
        setArticleImages([]);
        setExcerpt('');
        setContent('');
        setStatus(currentUser?.role === 'admin' ? 'approved' : 'pending');
      }
    }
  }, [isOpen, articleToEdit]);

  // Real-time Auto-save Draft to localStorage while typing
  useEffect(() => {
    if (!isOpen) return;
    const draftKey = getDraftKey(articleToEdit ? articleToEdit.id : null);

    // If there is any content, save to localStorage
    if (title || content || excerpt || author || imageUrl || articleImages.length > 0 || embedCode) {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            sectionKey: selectedSection,
            title,
            category,
            author,
            imageUrl,
            articleImages,
            excerpt,
            content,
            embedCode,
            status,
            savedAt: new Date().toISOString(),
          })
        );
      } catch (err) {
        console.warn('LocalStorage draft save error', err);
      }
    }
  }, [
    isOpen,
    articleToEdit,
    selectedSection,
    title,
    category,
    author,
    imageUrl,
    articleImages,
    excerpt,
    content,
    embedCode,
    status,
  ]);

  // When section changes, ensure valid category
  const handleSectionChange = (newSec: SectionType) => {
    setSelectedSection(newSec);
    const newCats =
      siteConfig?.sections?.[newSec]?.categories ||
      defaultSiteConfig.sections[newSec]?.categories ||
      [];
    if (!newCats.includes(category)) {
      setCategory(newCats[0] || '');
    }
  };

  // Handle single / main image upload
  const handleMainImageFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP, GIF)!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      if (result) {
        setImageUrl(result);
        // Also add to articleImages if not present
        const newImg: ArticleImage = {
          id: `img-${Date.now()}`,
          url: result,
          caption: title || file.name.replace(/\.[^/.]+$/, ''),
          position: 'top',
        };
        setArticleImages((prev) => {
          if (prev.length === 0) return [newImg];
          return prev;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle multiple image upload
  const handleMultipleImageUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, idx) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result as string;
        if (result) {
          const newImg: ArticleImage = {
            id: `img-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
            url: result,
            caption: `Hình: ${file.name.replace(/\.[^/.]+$/, '')}`,
            position: idx === 0 && articleImages.length === 0 ? 'top' : idx % 2 === 1 ? 'middle_1' : 'gallery',
          };
          setArticleImages((prev) => [...prev, newImg]);
          if (!imageUrl && idx === 0) {
            setImageUrl(result);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Add image via URL
  const handleAddImageUrl = (url: string) => {
    if (!url.trim()) return;
    const newImg: ArticleImage = {
      id: `img-${Date.now()}`,
      url: url.trim(),
      caption: title || 'Hình ảnh minh họa',
      position: 'middle_1',
    };
    setArticleImages((prev) => [...prev, newImg]);
    if (!imageUrl) setImageUrl(url.trim());
  };

  // Update image caption or position
  const handleUpdateImage = (id: string, field: 'caption' | 'position', value: string) => {
    setArticleImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, [field]: value } : img))
    );
  };

  // Delete an image from list
  const handleDeleteImage = (id: string) => {
    setArticleImages((prev) => {
      const remaining = prev.filter((img) => img.id !== id);
      if (remaining.length > 0 && (!imageUrl || !remaining.some((r) => r.url === imageUrl))) {
        setImageUrl(remaining[0].url);
      } else if (remaining.length === 0) {
        setImageUrl('');
      }
      return remaining;
    });
  };

  // Set as representative thumbnail
  const handleSetMainThumbnail = (url: string) => {
    setImageUrl(url);
    alert('Đã đặt làm ảnh đại diện bài viết!');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleImageUpload(e.dataTransfer.files);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Vui lòng nhập tiêu đề bài viết (*)!');
      return;
    }
    if (!author.trim()) {
      setFormError('Vui lòng nhập tác giả / đơn vị (*)!');
      return;
    }
    if (!excerpt.trim()) {
      setFormError('Vui lòng nhập tóm tắt trích yếu bài viết (*)!');
      return;
    }
    if (!content.trim()) {
      setFormError('Vui lòng nhập nội dung chi tiết bài viết (*)!');
      return;
    }

    setIsSubmitting(true);

    try {
      const defaultImg =
        selectedSection === 'ctd'
          ? 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop'
          : selectedSection === 'hl'
          ? 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=800&auto=format&fit=crop'
          : 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop';

      const finalImage = imageUrl.trim() || (articleImages[0]?.url) || defaultImg;

      // Ensure articleImages has at least 1 image item if image exists
      const finalImagesList =
        articleImages.length > 0
          ? articleImages
          : [
              {
                id: 'img-1',
                url: finalImage,
                caption: title.trim(),
                position: 'top' as ArticleImagePosition,
              },
            ];

      if (isEditing && articleToEdit && onUpdateArticle) {
        const updated: Article = {
          ...articleToEdit,
          title: title.trim(),
          category: category || categories[0] || 'Thông tin chung',
          author: author.trim(),
          image: finalImage,
          images: finalImagesList,
          excerpt: excerpt.trim(),
          content: content.trim(),
          embedCode: embedCode.trim() || undefined,
          sectionKey: selectedSection,
          status: status,
        };
        const res = await onUpdateArticle(updated);
        if (res === false) {
          throw new Error('Lưu cập nhật bài viết không thành công');
        }
      } else {
        const res = await onSubmitArticle({
          title: title.trim(),
          category: category || categories[0] || 'Thông tin chung',
          author: author.trim(),
          image: finalImage,
          images: finalImagesList,
          excerpt: excerpt.trim(),
          content: content.trim(),
          embedCode: embedCode.trim() || undefined,
          sectionKey: selectedSection,
          status: status,
        });
        if (res === false) {
          throw new Error('Tạo bài viết mới không thành công');
        }
      }

      // Success: clear saved localStorage draft and close modal
      const draftKey = getDraftKey(articleToEdit ? articleToEdit.id : null);
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // Ignore
      }
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      console.error('Error submitting article:', err);
      setFormError(
        err?.message ||
          'Có lỗi xảy ra trong quá trình lưu dữ liệu vào hệ thống. Toàn bộ nội dung bản thảo đã được bảo toàn nguyên vẹn 100% để đồng chí bấm thử lại.'
      );
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!articleToEdit || !onDeleteArticle) return;
    if (!confirm('Đồng chí có chắc chắn muốn xóa bài viết này vĩnh viễn?')) return;
    setIsDeleting(true);
    setFormError(null);
    try {
      const res = await onDeleteArticle(articleToEdit.id);
      if (res === false) {
        throw new Error('Xóa bài viết thất bại');
      }
      const draftKey = getDraftKey(articleToEdit.id);
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // Ignore
      }
      setIsDeleting(false);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Lỗi khi xóa bài viết');
      setIsDeleting(false);
    }
  };

  const handleClearDraft = () => {
    if (confirm('Đồng chí có chắc muốn làm trống biểu mẫu và xóa bản nháp đang lưu tạm?')) {
      const draftKey = getDraftKey(articleToEdit ? articleToEdit.id : null);
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // Ignore
      }
      if (articleToEdit) {
        setTitle(articleToEdit.title || '');
        setContent(articleToEdit.content || '');
        setExcerpt(articleToEdit.excerpt || '');
        setImageUrl(articleToEdit.image || '');
        setArticleImages(articleToEdit.images || []);
        setEmbedCode(articleToEdit.embedCode || '');
      } else {
        setTitle('');
        setContent('');
        setExcerpt('');
        setImageUrl('');
        setArticleImages([]);
        setEmbedCode('');
      }
      setDraftRestored(false);
      setFormError(null);
    }
  };

  const positionLabels: Record<ArticleImagePosition, string> = {
    top: 'Đầu bài viết (Banner dưới tiêu đề)',
    middle_1: 'Giữa bài viết (Sau đoạn 1)',
    middle_2: 'Giữa bài viết (Sau đoạn 2)',
    bottom: 'Cuối bài viết',
    float_left: 'Trôi bên trái văn bản (Float Left)',
    float_right: 'Trôi bên phải văn bản (Float Right)',
    gallery: 'Bộ sưu tập lưới ảnh (Gallery)',
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#b91c1c] text-white p-3.5 px-5 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-2 font-bold text-amber-300 text-sm md:text-base">
            <FileEdit className="w-5 h-5" />
            <span>
              {isEditing ? 'CHỈNH SỬA BÀI VIẾT & HÌNH ẢNH' : 'ĐĂNG TẢI TIN BÀI & BỘ SƯU TẬP ẢNH'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isDeleting}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Draft Auto-Recovery & Protection Banner */}
        <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 text-[11px] text-amber-950 flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-medium">
              {draftRestored
                ? 'Đã tự động khôi phục bản nháp chưa lưu trước đó từ thiết bị của đồng chí.'
                : 'Cơ chế Auto-Draft tự động sao lưu dữ liệu gõ phím tức thì chống mất mát nội dung.'}
            </span>
          </span>
          {(title || content || excerpt) && (
            <button
              type="button"
              onClick={handleClearDraft}
              className="text-red-700 hover:text-red-900 hover:underline font-bold cursor-pointer text-[10px] uppercase tracking-wider"
            >
              Làm mới biểu mẫu
            </button>
          )}
        </div>

        {formError && (
          <div className="bg-red-50 border-b border-red-200 p-3 px-5 text-xs text-red-800 font-medium flex items-center gap-2">
            <X className="w-4 h-4 text-red-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Section & Category Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Chuyên mục xuất bản (*):
              </label>
              <select
                value={selectedSection}
                onChange={(e) => handleSectionChange(e.target.value as SectionType)}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-700 focus:outline-hidden font-bold"
              >
                <option value="ctd">Công tác Đảng - CTCT</option>
                <option value="hl">Huấn luyện - Sẵn sàng chiến đấu</option>
                <option value="bac">Học tập và làm theo Bác</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Thể loại bài viết (*):
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-700 focus:outline-hidden font-bold"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Tiêu đề bài viết (*):
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề tin bài (ví dụ: Sư đoàn 10 tổ chức diễn tập...)..."
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-700 focus:outline-hidden font-bold text-gray-900 text-sm"
              required
            />
          </div>

          {/* Author */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Tác giả / Đơn vị (*):
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Ví dụ: Đại úy Nguyễn Văn A - Ban Tuyên huấn..."
              className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-700 focus:outline-hidden font-medium"
              required
            />
          </div>

          {/* =========================================================================
              MULTIPLE IMAGES MANAGEMENT (UPLOAD, POSITION, CAPTION)
             ========================================================================= */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-800" />
                <span className="font-extrabold text-amber-950 text-xs uppercase">
                  HÌNH ẢNH BÀI VIẾT & VỊ TRÍ HIỂN THỊ ({articleImages.length} ảnh)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => multiFileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-[#b91c1c] hover:bg-red-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ Chọn tệp ảnh từ máy</span>
                </button>
              </div>
            </div>

            {/* Hidden multi-file input */}
            <input
              type="file"
              ref={multiFileInputRef}
              onChange={(e) => handleMultipleImageUpload(e.target.files)}
              accept="image/*"
              multiple
              className="hidden"
            />

            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => multiFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-red-600 bg-red-50'
                  : 'border-amber-300 bg-white/70 hover:bg-amber-50/80'
              }`}
            >
              <UploadCloud className="w-6 h-6 text-amber-700 mx-auto mb-1" />
              <p className="text-[11px] font-bold text-gray-700">
                Kéo & thả nhiều tệp ảnh vào đây, hoặc <span className="text-red-700 underline">nhấn để chọn từ máy</span>
              </p>
              <p className="text-[10px] text-gray-500">
                Hỗ trợ tải lên cùng lúc nhiều hình ảnh minh họa cho các đoạn văn trong bài viết.
              </p>
            </div>

            {/* List of uploaded images with position and caption controls */}
            {articleImages.length > 0 && (
              <div className="space-y-2.5 pt-1">
                {articleImages.map((img, index) => {
                  const isMain = img.url === imageUrl;
                  return (
                    <div
                      key={img.id}
                      className="bg-white p-3 rounded-lg border border-gray-200 shadow-2xs space-y-2"
                    >
                      <div className="flex items-start gap-3">
                        {/* Thumbnail */}
                        <div className="relative shrink-0 w-20 h-16 rounded-md overflow-hidden border border-gray-300 bg-gray-100">
                          <img
                            src={img.url}
                            alt={img.caption || `Ảnh ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {isMain && (
                            <span className="absolute top-0.5 left-0.5 bg-red-600 text-white text-[8px] font-black px-1 rounded">
                              ĐẠI DIỆN
                            </span>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* Position Selector */}
                            <div>
                              <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                                Vị trí xuất hiện trên bài viết:
                              </label>
                              <select
                                value={img.position}
                                onChange={(e) =>
                                  handleUpdateImage(img.id, 'position', e.target.value)
                                }
                                className="w-full p-1.5 bg-gray-50 border border-gray-300 rounded text-[11px] font-bold text-gray-800 focus:bg-white focus:border-red-700 focus:outline-hidden"
                              >
                                <option value="top">Đầu bài viết (Dưới tiêu đề / Banner)</option>
                                <option value="middle_1">Giữa bài viết (Sau đoạn 1)</option>
                                <option value="middle_2">Giữa bài viết (Sau đoạn 2)</option>
                                <option value="bottom">Cuối bài viết</option>
                                <option value="float_left">Trôi bên trái đoạn văn (Float Left)</option>
                                <option value="float_right">Trôi bên phải đoạn văn (Float Right)</option>
                                <option value="gallery">Bộ sưu tập lưới ảnh (Gallery)</option>
                              </select>
                            </div>

                            {/* Caption Input */}
                            <div>
                              <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                                Nội dung chú thích ảnh (*):
                              </label>
                              <input
                                type="text"
                                value={img.caption || ''}
                                onChange={(e) =>
                                  handleUpdateImage(img.id, 'caption', e.target.value)
                                }
                                placeholder="Ví dụ: Hình 1: Cán bộ, chiến sĩ thực hành..."
                                className="w-full p-1.5 bg-gray-50 border border-gray-300 rounded text-[11px] font-medium text-gray-900 focus:bg-white focus:border-red-700 focus:outline-hidden"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleSetMainThumbnail(img.url)}
                              className={`font-bold hover:underline cursor-pointer ${
                                isMain ? 'text-red-700 font-black' : 'text-gray-600'
                              }`}
                            >
                              {isMain ? '✓ Đang là ảnh đại diện bài' : 'Đặt làm ảnh đại diện chính'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteImage(img.id)}
                              className="text-red-500 hover:text-red-700 font-bold flex items-center gap-0.5 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Xóa ảnh này</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Tóm tắt trích yếu bài viết (*):
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Nhập phần tóm tắt ngắn gọn hiển thị ở trang chủ và danh sách tin..."
              rows={2}
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-700 focus:outline-hidden"
              required
            />
          </div>

          {/* Full Content */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Nội dung chi tiết bài viết (*):
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập toàn bộ nội dung bài viết (mỗi đoạn văn cách nhau 1 dòng)..."
              rows={7}
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-700 focus:outline-hidden text-xs leading-relaxed"
              required
            />
          </div>

          {/* Embed Code (YouTube, Iframe, Audio, Video, External Media) */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-indigo-700" />
                <span>Nhúng Video / Iframe / Âm thanh từ trang khác (Tùy chọn):</span>
              </label>
              <span className="text-[10px] text-gray-500">
                YouTube, Facebook, QPVN, iframe HTML...
              </span>
            </div>
            <textarea
              value={embedCode}
              onChange={(e) => setEmbedCode(e.target.value)}
              placeholder='Dán mã nhúng (iframe, video, audio hoặc link nhúng HTML vào đây)...'
              rows={2}
              className="w-full p-2 font-mono text-[11px] bg-slate-900 text-green-400 border border-slate-700 rounded-lg focus:outline-hidden"
            />
            {embedCode.trim() && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-900 block">
                  Xem trước nội dung nhúng:
                </span>
                <div
                  className="p-2 bg-white rounded-lg border border-gray-300 max-h-48 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: embedCode }}
                />
              </div>
            )}
          </div>

          {/* Admin Approval Switch */}
          {currentUser?.role === 'admin' && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
              <span className="font-bold text-gray-800">Trạng thái phê duyệt tin bài:</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 font-bold text-emerald-800 cursor-pointer">
                  <input
                    type="radio"
                    name="article-status"
                    checked={status === 'approved'}
                    onChange={() => setStatus('approved')}
                    className="accent-emerald-700"
                  />
                  <span>Xuất bản ngay</span>
                </label>

                <label className="flex items-center gap-1.5 font-bold text-amber-800 cursor-pointer">
                  <input
                    type="radio"
                    name="article-status"
                    checked={status === 'pending'}
                    onChange={() => setStatus('pending')}
                    className="accent-amber-700"
                  />
                  <span>Lưu dự thảo</span>
                </label>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-between border-t border-gray-200">
            {isEditing && onDeleteArticle ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg flex items-center gap-1.5 border border-red-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isDeleting ? 'Đang xóa...' : 'Xóa bài viết'}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isDeleting}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className="px-5 py-2 bg-[#b91c1c] hover:bg-red-800 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-md cursor-pointer text-xs disabled:opacity-60 transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isEditing ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>
                  {isSubmitting
                    ? 'ĐANG LƯU VÀO DATABASE...'
                    : isEditing
                    ? 'LƯU THAY ĐỔI'
                    : currentUser?.role === 'admin'
                    ? 'XUẤT BẢN TIN BÀI'
                    : 'GỬI DUYỆT BÀI VIẾT'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
