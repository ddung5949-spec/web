import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  FileText,
  FileCheck,
  BookOpen,
  GraduationCap,
  Calendar,
  User,
  Eye,
  Download,
  ExternalLink,
  Clock,
  ArrowRight,
  CornerDownLeft,
  Tag,
  Building,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Article, DocumentItem, LectureItem, PageView } from '../../types';

export type SearchResultType = 'article' | 'document' | 'lecture';

export interface UnifiedSearchResult {
  id: string | number;
  type: SearchResultType;
  title: string;
  category?: string;
  date?: string;
  authorOrIssuer?: string;
  excerpt?: string;
  fullContent?: string;
  code?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  views?: number;
  rawItem: Article | DocumentItem | LectureItem;
  matchScore: number;
  matchedIn: ('title' | 'code' | 'category' | 'author' | 'content')[];
}

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  documents: DocumentItem[];
  lectures: LectureItem[];
  onOpenArticle: (article: Article) => void;
  onSelectPage: (page: PageView) => void;
  primaryRedColor?: string;
  armyGreenColor?: string;
}

const POPULAR_SEARCH_TAGS = [
  'Trung đoàn 95',
  'Huấn luyện chiến đấu',
  'Nghị quyết Đảng bộ',
  'Giáo án chính trị',
  'Sư đoàn 2',
  'Kế hoạch công tác',
  'Thi đua quyết thắng',
  'Điều lệnh quân đội',
];

const RECENT_SEARCHES_STORAGE_KEY = 'mangyang_recent_global_searches';

/**
 * Normalizes Vietnamese diacritics for flexible fuzzy searching
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/**
 * Highlights matching search tokens within a text string
 */
const HighlightedText: React.FC<{ text: string; query: string; className?: string }> = ({
  text,
  query,
  className = '',
}) => {
  if (!text) return null;
  if (!query || !query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const queryTerms = query
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0)
    .map((term) => removeVietnameseTones(term));

  if (queryTerms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Create a regex from the raw query tokens for direct matching
  const escapedTerms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  const regexPattern = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
  const parts = text.split(regexPattern);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const normalizedPart = removeVietnameseTones(part);
        const isMatch = queryTerms.some((qt) => normalizedPart.includes(qt));
        if (isMatch) {
          return (
            <mark
              key={i}
              className="bg-amber-200 text-red-950 font-bold px-0.5 rounded-xs transition-colors"
            >
              {part}
            </mark>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
};

/**
 * Extracts a relevant snippet surrounding the first match in body text
 */
function extractMatchingSnippet(content: string, query: string, maxLength = 160): string {
  if (!content) return '';
  // Strip HTML tags for clean snippet
  const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!query || !query.trim()) {
    return plainText.slice(0, maxLength) + (plainText.length > maxLength ? '...' : '');
  }

  const normalizedText = removeVietnameseTones(plainText);
  const normalizedQuery = removeVietnameseTones(query.trim());

  const matchIndex = normalizedText.indexOf(normalizedQuery);
  if (matchIndex === -1) {
    // Check individual words
    const words = normalizedQuery.split(/\s+/).filter(Boolean);
    let bestIndex = -1;
    for (const w of words) {
      const idx = normalizedText.indexOf(w);
      if (idx !== -1 && (bestIndex === -1 || idx < bestIndex)) {
        bestIndex = idx;
      }
    }
    if (bestIndex === -1) {
      return plainText.slice(0, maxLength) + (plainText.length > maxLength ? '...' : '');
    }
    const start = Math.max(0, bestIndex - 40);
    const end = Math.min(plainText.length, bestIndex + maxLength - 40);
    return (start > 0 ? '...' : '') + plainText.slice(start, end).trim() + (end < plainText.length ? '...' : '');
  }

  const start = Math.max(0, matchIndex - 40);
  const end = Math.min(plainText.length, matchIndex + maxLength - 40);
  return (start > 0 ? '...' : '') + plainText.slice(start, end).trim() + (end < plainText.length ? '...' : '');
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  articles,
  documents,
  lectures,
  onOpenArticle,
  onSelectPage,
  primaryRedColor = '#b91c1c',
  armyGreenColor = '#143d2b',
}) => {
  const [query, setQuery] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | SearchResultType>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [detailItem, setDetailItem] = useState<UnifiedSearchResult | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setRecentSearches(parsed.slice(0, 8));
          }
        }
      } catch {
        // ignore
      }
      // Focus input on open
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  // Handle keyboard navigation (Escape, Up, Down, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const removeRecentSearch = (termToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== termToRemove);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Compute unified search results
  const allResults = useMemo<UnifiedSearchResult[]>(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const normalizedQuery = removeVietnameseTones(trimmed);
    const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);

    const matches: UnifiedSearchResult[] = [];

    // 1. Articles Search
    articles.forEach((art) => {
      // Only approved articles or all if admin
      if (art.status && art.status !== 'approved') return;

      const titleNorm = removeVietnameseTones(art.title || '');
      const excerptNorm = removeVietnameseTones(art.excerpt || art.summary || '');
      const contentNorm = removeVietnameseTones(art.content || '');
      const authorNorm = removeVietnameseTones(art.author || '');
      const catNorm = removeVietnameseTones(art.category || '');

      let score = 0;
      const matchedIn: ('title' | 'code' | 'category' | 'author' | 'content')[] = [];

      // Check title
      if (titleNorm.includes(normalizedQuery)) {
        score += 100;
        matchedIn.push('title');
      } else if (queryWords.every((w) => titleNorm.includes(w))) {
        score += 60;
        matchedIn.push('title');
      }

      // Check category
      if (catNorm.includes(normalizedQuery)) {
        score += 40;
        matchedIn.push('category');
      }

      // Check author
      if (authorNorm.includes(normalizedQuery)) {
        score += 35;
        matchedIn.push('author');
      }

      // Check excerpt / summary
      if (excerptNorm.includes(normalizedQuery)) {
        score += 30;
        if (!matchedIn.includes('content')) matchedIn.push('content');
      }

      // Check content body
      if (contentNorm.includes(normalizedQuery)) {
        score += 25;
        if (!matchedIn.includes('content')) matchedIn.push('content');
      } else if (queryWords.length > 1 && queryWords.every((w) => contentNorm.includes(w))) {
        score += 15;
        if (!matchedIn.includes('content')) matchedIn.push('content');
      }

      if (score > 0) {
        matches.push({
          id: art.id,
          type: 'article',
          title: art.title,
          category: art.category,
          date: art.date,
          authorOrIssuer: art.author,
          excerpt: art.excerpt || art.summary || extractMatchingSnippet(art.content, trimmed),
          fullContent: art.content,
          views: art.views,
          rawItem: art,
          matchScore: score,
          matchedIn,
        });
      }
    });

    // 2. Documents Search
    documents.forEach((doc) => {
      const titleNorm = removeVietnameseTones(doc.title || '');
      const codeNorm = removeVietnameseTones(doc.code || '');
      const descNorm = removeVietnameseTones(doc.description || '');
      const issuerNorm = removeVietnameseTones(doc.issuer || '');
      const catNorm = removeVietnameseTones(doc.category || '');

      let score = 0;
      const matchedIn: ('title' | 'code' | 'category' | 'author' | 'content')[] = [];

      if (codeNorm.includes(normalizedQuery)) {
        score += 120; // Exact document code matches are high priority
        matchedIn.push('code');
      }

      if (titleNorm.includes(normalizedQuery)) {
        score += 90;
        matchedIn.push('title');
      } else if (queryWords.every((w) => titleNorm.includes(w))) {
        score += 55;
        matchedIn.push('title');
      }

      if (issuerNorm.includes(normalizedQuery)) {
        score += 40;
        matchedIn.push('author');
      }

      if (catNorm.includes(normalizedQuery)) {
        score += 35;
        matchedIn.push('category');
      }

      if (descNorm.includes(normalizedQuery)) {
        score += 30;
        matchedIn.push('content');
      } else if (queryWords.every((w) => descNorm.includes(w))) {
        score += 15;
        matchedIn.push('content');
      }

      if (score > 0) {
        matches.push({
          id: doc.id,
          type: 'document',
          title: doc.title,
          code: doc.code,
          category: doc.category,
          date: doc.date,
          authorOrIssuer: doc.issuer,
          excerpt: doc.description || (doc.code ? `Số hiệu: ${doc.code} • Cơ quan ban hành: ${doc.issuer}` : ''),
          fileUrl: doc.fileUrl,
          fileName: doc.fileName,
          fileType: doc.type,
          rawItem: doc,
          matchScore: score,
          matchedIn,
        });
      }
    });

    // 3. Lectures Search
    lectures.forEach((lec) => {
      const titleNorm = removeVietnameseTones(lec.title || '');
      const authorNorm = removeVietnameseTones(lec.author || '');
      const targetNorm = removeVietnameseTones(lec.target || '');
      const descNorm = removeVietnameseTones(lec.desc || '');
      const catNorm = removeVietnameseTones(lec.category || '');

      let score = 0;
      const matchedIn: ('title' | 'code' | 'category' | 'author' | 'content')[] = [];

      if (titleNorm.includes(normalizedQuery)) {
        score += 90;
        matchedIn.push('title');
      } else if (queryWords.every((w) => titleNorm.includes(w))) {
        score += 55;
        matchedIn.push('title');
      }

      if (authorNorm.includes(normalizedQuery)) {
        score += 40;
        matchedIn.push('author');
      }

      if (catNorm.includes(normalizedQuery)) {
        score += 35;
        matchedIn.push('category');
      }

      if (targetNorm.includes(normalizedQuery)) {
        score += 30;
        matchedIn.push('content');
      }

      if (descNorm.includes(normalizedQuery)) {
        score += 25;
        if (!matchedIn.includes('content')) matchedIn.push('content');
      } else if (queryWords.every((w) => descNorm.includes(w))) {
        score += 15;
        if (!matchedIn.includes('content')) matchedIn.push('content');
      }

      if (score > 0) {
        matches.push({
          id: lec.id,
          type: 'lecture',
          title: lec.title,
          category: lec.category,
          date: lec.date,
          authorOrIssuer: lec.author,
          excerpt: lec.desc || (lec.target ? `Đối tượng huấn luyện: ${lec.target}` : ''),
          fileUrl: lec.fileUrl,
          fileName: lec.fileName,
          fileType: lec.fileType,
          rawItem: lec,
          matchScore: score,
          matchedIn,
        });
      }
    });

    // Sort by match score descending
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }, [query, articles, documents, lectures]);

  // Filtered by active tab
  const filteredResults = useMemo(() => {
    if (activeTypeFilter === 'all') return allResults;
    return allResults.filter((r) => r.type === activeTypeFilter);
  }, [allResults, activeTypeFilter]);

  // Counts for tabs
  const countArticles = useMemo(() => allResults.filter((r) => r.type === 'article').length, [allResults]);
  const countDocs = useMemo(() => allResults.filter((r) => r.type === 'document').length, [allResults]);
  const countLectures = useMemo(() => allResults.filter((r) => r.type === 'lecture').length, [allResults]);

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults.length, activeTypeFilter]);

  // Handle Enter key or click to open item
  const handleSelectResult = (item: UnifiedSearchResult) => {
    saveRecentSearch(query);
    onClose();

    if (item.type === 'article') {
      onOpenArticle(item.rawItem as Article);
    } else if (item.type === 'document') {
      onSelectPage('doc');
    } else if (item.type === 'lecture') {
      onSelectPage('lecture');
    }
  };

  // Keyboard navigation up / down / enter inside list
  const handleKeyDownInInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : prev));
      scrollToSelectedItem(selectedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      scrollToSelectedItem(selectedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults.length > 0 && filteredResults[selectedIndex]) {
        handleSelectResult(filteredResults[selectedIndex]);
      }
    }
  };

  const scrollToSelectedItem = (idx: number) => {
    const el = document.getElementById(`search-result-item-${idx}`);
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };

  const handleDownloadDirect = (url?: string, filename?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = filename || 'tai-lieu';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-5 md:p-6 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] mt-4 sm:mt-8 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-label="Tìm kiếm toàn hệ thống"
      >
        {/* Search Header Bar */}
        <div
          className="p-3.5 sm:p-4 text-white flex items-center gap-3 relative shrink-0 border-b border-white/15"
          style={{ backgroundColor: primaryRedColor }}
        >
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 text-amber-300">
            <Search className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDownInInput}
                placeholder="Nhập từ khóa tìm kiếm tin bài, văn bản, bài giảng số... (tiêu đề hoặc nội dung)"
                className="w-full bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-gray-900 placeholder:text-white/70 focus:placeholder:text-gray-400 text-sm sm:text-base font-semibold px-3.5 py-2 sm:py-2.5 rounded-xl border border-white/25 focus:border-amber-400 focus:outline-hidden transition-all shadow-inner"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2.5 p-1 rounded-md text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                  title="Xóa từ khóa"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-black/20 hover:bg-black/35 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Đóng cửa sổ tìm kiếm (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs Bar */}
        <div className="bg-gray-50 px-3 sm:px-4 py-2 border-b border-gray-200 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTypeFilter === 'all'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
              }`}
            >
              <span>Tất cả</span>
              {query.trim() && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                    activeTypeFilter === 'all' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {allResults.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTypeFilter('article')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTypeFilter === 'article'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tin bài</span>
              {query.trim() && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                    activeTypeFilter === 'article' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {countArticles}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTypeFilter('document')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTypeFilter === 'document'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Văn bản tài liệu</span>
              {query.trim() && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                    activeTypeFilter === 'document' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {countDocs}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTypeFilter('lecture')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTypeFilter === 'lecture'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Bài giảng số</span>
              {query.trim() && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                    activeTypeFilter === 'lecture' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {countLectures}
                </span>
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-gray-500 font-medium shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Tìm kiếm siêu tốc theo Tiêu đề & Nội dung</span>
          </div>
        </div>

        {/* Search Body Content */}
        <div ref={resultsContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-gray-100">
          {/* STATE 1: Empty Query - Show Suggestions & Recent Searches */}
          {!query.trim() && (
            <div className="py-4 space-y-6">
              {/* Popular Search Suggestions */}
              <div>
                <div className="flex items-center gap-2 mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <Tag className="w-3.5 h-3.5 text-red-700" />
                  <span>Từ khóa gợi ý tìm kiếm phổ biến</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCH_TAGS.map((tag, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setQuery(tag);
                        inputRef.current?.focus();
                      }}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-gray-200 text-gray-700 text-xs font-semibold rounded-full transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Search className="w-3 h-3 text-gray-400" />
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Tìm kiếm gần đây</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearAllRecent}
                      className="text-[11px] font-bold text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      Xóa lịch sử
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setQuery(term);
                          inputRef.current?.focus();
                        }}
                        className="group pl-3 pr-1.5 py-1 bg-amber-50/70 hover:bg-amber-100/90 text-amber-950 border border-amber-200 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>{term}</span>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(term, e)}
                          className="p-1 rounded-full text-amber-600 hover:text-red-700 hover:bg-red-100 transition-colors"
                          title="Xóa mục này"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* System Scope Stats Summary */}
              <div className="bg-gradient-to-r from-gray-50 via-slate-50 to-emerald-50/40 rounded-xl p-4 border border-gray-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-700" />
                  Kho dữ liệu số Trung đoàn 95 - Sư đoàn 2
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                  <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-xs flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-base font-black text-gray-900">{articles.length}</div>
                      <div className="text-[11px] font-semibold text-gray-500">Tin bài & Phóng sự</div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-xs flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-base font-black text-gray-900">{documents.length}</div>
                      <div className="text-[11px] font-semibold text-gray-500">Văn bản & Chỉ thị</div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-xs flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-base font-black text-gray-900">{lectures.length}</div>
                      <div className="text-[11px] font-semibold text-gray-500">Bài giảng số & Giáo án</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: Query entered but no results */}
          {query.trim() && filteredResults.length === 0 && (
            <div className="py-12 text-center">
              <div className="w-14 h-14 mx-auto mb-3.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-xs">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-gray-800 mb-1">
                Không tìm thấy kết quả phù hợp với "{query}"
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed mb-4">
                Không có tin bài, văn bản hoặc bài giảng số nào chứa từ khóa này trong tiêu đề hoặc nội dung toàn văn.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>Gợi ý: Hãy thử từ khóa ngắn gọn hơn hoặc tìm theo số hiệu, tên tác giả, cơ quan ban hành.</span>
              </div>
            </div>
          )}

          {/* STATE 3: Query entered and has matching results */}
          {query.trim() && filteredResults.length > 0 && (
            <div className="space-y-2 py-1">
              <div className="text-xs font-bold text-gray-500 px-2 py-1 flex items-center justify-between">
                <span>Tìm thấy {filteredResults.length} kết quả phù hợp</span>
                <span className="text-[11px] text-gray-400 font-normal">Dùng phím ↑ ↓ để chọn, Enter để mở</span>
              </div>

              {filteredResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const isArticle = item.type === 'article';
                const isDoc = item.type === 'document';
                const isLecture = item.type === 'lecture';

                const typeBadgeColor = isArticle
                  ? 'bg-red-100 text-red-800 border-red-200'
                  : isDoc
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                const typeLabel = isArticle ? 'Tin bài' : isDoc ? 'Văn bản' : 'Bài giảng số';
                const TypeIcon = isArticle ? FileText : isDoc ? FileCheck : GraduationCap;

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    id={`search-result-item-${idx}`}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => handleSelectResult(item)}
                    className={`group p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-50/50 border-red-300 shadow-sm ring-1 ring-red-300'
                        : 'bg-white hover:bg-gray-50/80 border-gray-200/80 hover:border-gray-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Type Icon Badge */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${typeBadgeColor}`}
                      >
                        <TypeIcon className="w-4 h-4" />
                      </div>

                      {/* Info & Excerpt */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${typeBadgeColor}`}
                          >
                            {typeLabel}
                          </span>

                          {item.code && (
                            <span className="text-[11px] font-mono font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                              Số: <HighlightedText text={item.code} query={query} />
                            </span>
                          )}

                          {item.category && (
                            <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                              <HighlightedText text={item.category} query={query} />
                            </span>
                          )}

                          {item.date && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-1 ml-auto">
                              <Calendar className="w-3 h-3" />
                              <span>{item.date}</span>
                            </span>
                          )}
                        </div>

                        {/* Title with Highlight */}
                        <h4 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-red-700 transition-colors leading-snug line-clamp-2">
                          <HighlightedText text={item.title} query={query} />
                        </h4>

                        {/* Excerpt / Matching Snippet */}
                        {item.excerpt && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed font-normal">
                            <HighlightedText text={item.excerpt} query={query} />
                          </p>
                        )}

                        {/* Metadata Footer */}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-gray-500 font-medium">
                          {item.authorOrIssuer && (
                            <span className="flex items-center gap-1 text-gray-700">
                              <User className="w-3 h-3 text-gray-400" />
                              <span>
                                {isDoc ? 'Cơ quan ban hành: ' : isArticle ? 'Tác giả: ' : 'Biên soạn: '}
                                <strong>
                                  <HighlightedText text={item.authorOrIssuer} query={query} />
                                </strong>
                              </span>
                            </span>
                          )}

                          {typeof item.views === 'number' && (
                            <span className="flex items-center gap-1 text-gray-400">
                              <Eye className="w-3 h-3" />
                              <span>{item.views} lượt xem</span>
                            </span>
                          )}

                          {item.fileType && (
                            <span className="uppercase text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              Định dạng: {item.fileType}
                            </span>
                          )}

                          {/* Quick Action Button for Direct Download if file exists */}
                          {item.fileUrl && (
                            <button
                              type="button"
                              onClick={(e) => handleDownloadDirect(item.fileUrl, item.fileName, e)}
                              className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md font-bold text-[11px] transition-colors cursor-pointer"
                              title="Tải về tệp tin đính kèm"
                            >
                              <Download className="w-3 h-3" />
                              <span>Tải về</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right Arrow indicator */}
                      <div className="shrink-0 self-center hidden sm:flex text-gray-300 group-hover:text-red-700 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer with Keyboard Shortcuts & Status */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-mono shadow-2xs font-bold text-gray-700">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-mono shadow-2xs font-bold text-gray-700">
                ↓
              </kbd>
              <span>Di chuyển</span>
            </span>

            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-mono shadow-2xs font-bold text-gray-700">
                ↵ Enter
              </kbd>
              <span>Mở mục</span>
            </span>

            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-mono shadow-2xs font-bold text-gray-700">
                Esc
              </kbd>
              <span>Đóng</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
