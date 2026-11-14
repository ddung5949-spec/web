import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Car,
  ChevronRight,
  Code,
  Crosshair,
  Download,
  Edit2,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  FileType,
  FileSpreadsheet,
  Flag,
  FolderArchive,
  FolderLock,
  Globe,
  HardDriveDownload,
  Heart,
  Image as ImageIcon,
  Laptop,
  Layers,
  Layout,
  LayoutGrid,
  Maximize2,
  Newspaper,
  Plus,
  PlusCircle,
  Presentation,
  Shield,
  ShieldAlert,
  Sliders,
  Sparkles,
  Star,
  Trash2,
  UserPen,
  UsersRound,
  Video,
  X,
} from 'lucide-react';
import {
  Article,
  DailyWidgetItem,
  DocumentItem,
  HomeAnnouncement,
  HomeCategoryColumn,
  HomeLayoutSettings,
  LectureItem,
  PageView,
  QuickActionCard,
  SidebarWidgetId,
  SidebarWidgetSetting,
  SiteConfig,
  UncleHoQuote,
  UncleHoSettings,
  User,
  CategoryConfig,
} from '../types';
import { defaultCategoriesConfig, defaultSidebarWidgets, defaultArticles, defaultUncleHoQuotes } from '../data/initialData';
import { ArticleCard } from './ArticleCard';
import { DailyWidgetsSection } from './DailyWidgetsSection';
import { DailyPosterWidget } from './DailyPosterWidget';
import { HomeAnnouncementsWidget } from './HomeAnnouncementsWidget';
import { HomeLatestNewsWidget } from './HomeLatestNewsWidget';
import { HomeMiddleFeaturedSlider } from './HomeMiddleFeaturedSlider';
import { HomeQuickActionsWidget } from './HomeQuickActionsWidget';
import { HomeSpotlightSection } from './HomeSpotlightSection';
import { UncleHoDailySection } from './UncleHoDailySection';
import { QuickActionManagerModal } from './modals/QuickActionManagerModal';
import { HomeSectionManagerModal, normalizeYouTubeEmbedUrl } from './modals/HomeSectionManagerModal';
import { LayoutManagerModal, normalizeWidgetsList } from './modals/LayoutManagerModal';
import {
  DailyPosterModal,
  POSTER_ID_SAFETY,
  POSTER_ID_TRAFFIC,
  SavedDailyPosterPayload,
} from './modals/DailyPosterModal';
import { getSupabase } from '../utils/supabase';

interface HomeViewProps {
  articles: Article[];
  documents?: DocumentItem[];
  lectures?: LectureItem[];
  uncleHoQuotes?: UncleHoQuote[];
  uncleHoSettings?: UncleHoSettings;
  dailyPosters?: Record<string, any>;
  currentUser?: User | null;
  siteConfig?: SiteConfig;
  categories?: CategoryConfig[];
  isLoading?: boolean;
  onOpenArticle: (article: Article) => void;
  onSelectSection: (section: PageView) => void;
  onEditArticle?: (article: Article) => void;
  onDeleteArticle?: (articleId: number) => void;
  onOpenUncleHoManager?: () => void;
  onSaveUncleHoQuotes?: (quotes: UncleHoQuote[]) => void;
  onOpenAnnouncementManager?: () => void;
  onSaveQuickActions?: (cards: QuickActionCard[]) => void;
  onSaveHomeCategoryColumns?: (columns: HomeCategoryColumn[]) => void;
  onSaveLayoutSettings?: (layout: HomeLayoutSettings) => void;
  onSaveDailyWidgets?: (widgets: DailyWidgetItem[]) => Promise<void> | void;
  onSelectSpotlightArticle?: (articleId: number) => void;
  onOpenAuthModal?: (tab: 'login' | 'register') => void;
  onOpenProfileModal?: () => void;
  onLogout?: () => void;
  onOpenCustomizer?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  articles = [],
  documents = [],
  lectures = [],
  uncleHoQuotes = [],
  uncleHoSettings = {
    autoPostEnabled: true,
    dailyPostTime: '06:00',
    autoSelectToday: true,
    activeQuoteId: '08-19',
  },
  currentUser = null,
  siteConfig,
  categories,
  dailyPosters: propsDailyPosters,
  isLoading = false,
  onOpenArticle,
  onSelectSection,
  onEditArticle,
  onDeleteArticle,
  onOpenUncleHoManager = () => {},
  onSaveUncleHoQuotes,
  onOpenAnnouncementManager = () => {},
  onSaveQuickActions,
  onSaveHomeCategoryColumns,
  onSaveLayoutSettings,
  onSaveDailyWidgets,
  onSelectSpotlightArticle,
  onOpenAuthModal = () => {},
  onOpenProfileModal = () => {},
  onLogout = () => {},
  onOpenCustomizer = () => {},
}) => {
  const isAdmin = currentUser?.role === 'admin';

  // Hàm chuẩn hóa chuỗi tiếng Việt (chuyển về chữ thường, xóa dấu, trim)
  const norm = (s: unknown): string => {
    if (s === null || s === undefined) return '';
    return String(s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Live state đồng bộ an toàn từ CSDL nếu props ban đầu rỗng
  const [liveArticles, setLiveArticles] = useState<Article[]>([]);
  const [liveDocuments, setLiveDocuments] = useState<DocumentItem[]>([]);
  const [liveLectures, setLiveLectures] = useState<LectureItem[]>([]);
  const [liveUncleHoQuotes, setLiveUncleHoQuotes] = useState<UncleHoQuote[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const effectiveArticles = (articles && articles.length > 0)
    ? articles
    : (liveArticles.length > 0 ? liveArticles : defaultArticles);

  const effectiveDocuments = (documents && documents.length > 0)
    ? documents
    : liveDocuments;

  const effectiveLectures = (lectures && lectures.length > 0)
    ? lectures
    : liveLectures;

  const effectiveUncleHoQuotes = (uncleHoQuotes && uncleHoQuotes.length > 0)
    ? uncleHoQuotes
    : (liveUncleHoQuotes.length > 0 ? liveUncleHoQuotes : defaultUncleHoQuotes);

  // Không lọc cứng status === 'published' (chấp nhận cả bài viết có status rỗng/null/approved/published)
  const approvedArticles = (effectiveArticles || []).filter(
    (a) => Boolean(a) && a.status !== 'pending'
  );

  // Modals state for Admin
  const [isQuickActionModalOpen, setIsQuickActionModalOpen] = useState(false);
  const [isSectionManagerModalOpen, setIsSectionManagerModalOpen] = useState(false);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [editingPoster, setEditingPoster] = useState<{
    id: string;
    category_name: string;
    title: string;
    image_url: string;
    aspect_ratio: 'auto' | 'portrait' | 'landscape';
  } | null>(null);
  const [lightboxPoster, setLightboxPoster] = useState<{
    title: string;
    image_url: string;
    isTraffic: boolean;
  } | null>(null);

  // Helper rút gọn metadata poster trước khi lưu cache localStorage - TUYỆT ĐỐI KHÔNG LƯU ẢNH BASE64
  const sanitizePostersForCache = (posters: any[]) => {
    return (posters || []).map((p) => ({
      id: p.id || p.key || p.widget_id,
      title: p.title || '',
      category_name: p.category_name || p.categoryName || '',
      aspect_ratio: p.aspect_ratio || p.aspectRatio || 'auto',
      updated_at: p.updated_at || p.updatedAt || '',
      // Xóa chuỗi ảnh Base64 khỏi localStorage
      image_url:
        p.image_url && typeof p.image_url === 'string' && !p.image_url.startsWith('data:') && p.image_url.length <= 500
          ? p.image_url
          : '',
    }));
  };

  // Dữ liệu gốc trực tiếp từ Supabase bảng 'daily_posters' (ưu tiên tuyệt đối, không bị localStorage/fallback ghi đè)
  const [supabasePosters, setSupabasePosters] = useState<Record<string, SavedDailyPosterPayload>>({});

  // State nạp poster từ bảng 'daily_posters' trên Supabase và cache localStorage
  const [dailyPosters, setDailyPosters] = useState<Record<string, { image_data: string; image_url?: string; aspect_ratio?: string; title?: string; category_name?: string; updated_at?: string }>>(() => {
    try {
      const cached = localStorage.getItem('daily_posters') || localStorage.getItem('daily_posters_cache');
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  const effectiveDailyPosters = React.useMemo(() => {
    // Luôn ưu tiên dữ liệu đã fetch/lưu từ Supabase lên trên propsDailyPosters và localStorage
    const merged: Record<string, any> = {
      ...(dailyPosters || {}),
      ...(propsDailyPosters || {}),
    };
    Object.entries(supabasePosters || {}).forEach(([k, val]) => {
      if (val && (val.image_url || val.category_name)) {
        merged[k] = {
          ...(merged[k] || {}),
          ...val,
          image_data: val.image_url || merged[k]?.image_data || '',
        };
      }
    });
    return merged;
  }, [dailyPosters, propsDailyPosters, supabasePosters]);

  // CƠ CHẾ FETCH DỮ LIỆU AN TOÀN, CÓ TIMEOUT 5 GIÂY, CHỐNG TREO LOADING VÔ TẬN
  React.useEffect(() => {
    let isMounted = true;

    // Helper hàm timeout an toàn: sau 5s nếu mạng treo tự ngắt và trả về fallback
    const withTimeout = <T,>(promise: PromiseLike<T>, ms = 5000, fallback: T): Promise<T> => {
      return Promise.race([
        Promise.resolve(promise),
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
      ]);
    };

    // 1. fetchPosters
    const fetchPosters = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;

        const res = await withTimeout(
          supabase.from('daily_posters').select('*'),
          5000,
          { data: null, error: new Error('Timeout') } as any
        );
        const data = !res?.error ? res?.data : null;

        if (!res?.error && data && Array.isArray(data) && data.length > 0) {
          const map: Record<string, { image_data: string; image_url?: string; aspect_ratio?: string; title?: string; category_name?: string; updated_at?: string }> = {};
          const sbLockedMap: Record<string, SavedDailyPosterPayload> = {};

          // Ưu tiên tìm đúng bản ghi id === 'thong-diep-an-toan' và id === 'tinh-huong-giao-thong'
          const exactSafetyRow = data.find((r: any) => r?.id === POSTER_ID_SAFETY);
          const exactTrafficRow = data.find((r: any) => r?.id === POSTER_ID_TRAFFIC);

          const toSavedPayload = (row: any, lockedId: string): SavedDailyPosterPayload => ({
            id: lockedId,
            category_name: row.category_name || row.categoryName || '',
            title: row.title || '',
            image_url: row.image_url || row.image_data || row.imageUrl || row.image || '',
            aspect_ratio: row.aspect_ratio || row.aspectRatio || row.aspectRatioMode || 'portrait',
            updated_at: row.updated_at || '',
          });

          if (exactSafetyRow && (exactSafetyRow.image_url || exactSafetyRow.image_data || exactSafetyRow.category_name)) {
            sbLockedMap[POSTER_ID_SAFETY] = toSavedPayload(exactSafetyRow, POSTER_ID_SAFETY);
          } else {
            const legacySafety = data.find((r: any) => r?.id === 'safety_message' || r?.id === 'safety');
            if (legacySafety && (legacySafety.image_url || legacySafety.image_data || legacySafety.category_name)) {
              sbLockedMap[POSTER_ID_SAFETY] = toSavedPayload(legacySafety, POSTER_ID_SAFETY);
            }
          }

          if (exactTrafficRow && (exactTrafficRow.image_url || exactTrafficRow.image_data || exactTrafficRow.category_name)) {
            sbLockedMap[POSTER_ID_TRAFFIC] = toSavedPayload(exactTrafficRow, POSTER_ID_TRAFFIC);
          } else {
            const legacyTraffic = data.find((r: any) => r?.id === 'traffic_situation' || r?.id === 'traffic' || r?.id === 'tinh_huong_giao_thong');
            if (legacyTraffic && (legacyTraffic.image_url || legacyTraffic.image_data || legacyTraffic.category_name)) {
              sbLockedMap[POSTER_ID_TRAFFIC] = toSavedPayload(legacyTraffic, POSTER_ID_TRAFFIC);
            }
          }

          data.forEach((row: any) => {
            const rawId = (row.id || row.key || row.widget_id || '').replace(/^widget_/, '');
            const isSafety =
              rawId === POSTER_ID_SAFETY ||
              rawId === 'safety_message' ||
              rawId === 'safety';
            const isTraffic =
              rawId === POSTER_ID_TRAFFIC ||
              rawId === 'tinh_huong_giao_thong' ||
              rawId === 'traffic_situation' ||
              rawId === 'traffic';

            const normKey =
              rawId === 'uncle_ho' || rawId === 'uncleHo' || rawId === 'bac_ho'
                ? 'uncle_ho'
                : isSafety
                ? POSTER_ID_SAFETY
                : isTraffic
                ? POSTER_ID_TRAFFIC
                : rawId === 'good_deed'
                ? 'good_deed'
                : rawId;

            if (normKey) {
              const url = row.image_url || row.image_data || row.imageUrl || row.image || '';
              const entry = {
                image_data: url,
                image_url: url,
                aspect_ratio: row.aspect_ratio || row.aspectRatio || row.aspectRatioMode || 'auto',
                title: row.title || '',
                category_name: row.category_name || row.categoryName || '',
                updated_at: row.updated_at || '',
              };
              map[rawId] = entry;
              // Chỉ gán khóa chuẩn nếu chưa có bản ghi chính xác hoặc chính là bản ghi chính xác
              if (
                !map[normKey] ||
                rawId === normKey ||
                (!map[normKey].image_url && url)
              ) {
                map[normKey] = entry;
              }
              if (isSafety) {
                map['safety'] = map[POSTER_ID_SAFETY] || entry;
                map['safety_message'] = map[POSTER_ID_SAFETY] || entry;
              }
              if (isTraffic) {
                map['traffic'] = map[POSTER_ID_TRAFFIC] || entry;
                map['traffic_situation'] = map[POSTER_ID_TRAFFIC] || entry;
              }
            }
          });

          if (isMounted) {
            if (Object.keys(sbLockedMap).length > 0) {
              setSupabasePosters((prev) => ({ ...prev, ...sbLockedMap }));
            }
            setDailyPosters((prev) => ({ ...prev, ...map }));
          }

          // Lưu cache: Chỉ lưu danh sách ID và Tiêu đề ngắn gọn, không lưu ảnh Base64
          try {
            localStorage.setItem('cached_posters', JSON.stringify(sanitizePostersForCache(data)));
          } catch {
            console.warn('Bỏ qua lưu cache posters vào localStorage do hạn mức trình duyệt');
          }

          try {
            const currentCache = localStorage.getItem('daily_posters') || localStorage.getItem('daily_posters_cache');
            const mergedCache = currentCache ? { ...JSON.parse(currentCache), ...map } : map;
            const lightweightMap: Record<string, any> = {};
            Object.entries(mergedCache).forEach(([k, v]: [string, any]) => {
              const isHeavy =
                v &&
                ((typeof v.image_data === 'string' && v.image_data.startsWith('data:') && v.image_data.length > 500) ||
                  (typeof v.image_url === 'string' && v.image_url.startsWith('data:') && v.image_url.length > 500));
              lightweightMap[k] = isHeavy ? { ...v, image_data: '', image_url: '' } : v;
            });
            localStorage.setItem('daily_posters', JSON.stringify(lightweightMap));
            localStorage.setItem('daily_posters_cache', JSON.stringify(lightweightMap));
          } catch {
            console.warn('Bỏ qua lưu cache posters vào localStorage do hạn mức trình duyệt');
          }
        }
      } catch (err) {
        console.warn('[HomeView] fetchPosters error caught gracefully:', err);
      }
    };

    // 2. fetchArticles
    const fetchArticles = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;

        let res = await withTimeout(
          supabase.from('articles').select('*').order('published_at', { ascending: false }).limit(50),
          5000,
          { data: null, error: new Error('Timeout') } as any
        );
        if (res?.error) {
          res = await withTimeout(
            supabase.from('articles').select('*').order('created_at', { ascending: false }).limit(50),
            5000,
            { data: null, error: new Error('Timeout') } as any
          );
        }
        const artData = !res?.error ? res?.data : null;

        if (isMounted && !res?.error && artData && Array.isArray(artData) && artData.length > 0) {
          const mapped: Article[] = artData.map((row: any) => ({
            id: Number(row.id),
            title: row.title || '',
            excerpt: row.summary || row.excerpt || '',
            summary: row.summary || row.excerpt || '',
            content: row.content || '',
            category: row.category || 'Tin tức',
            category_id: row.category_id,
            subCategory: row.sub_category || row.subcategory || row.subCategory || '',
            sub_category: row.sub_category || row.subcategory || row.subCategory || '',
            subcategory: row.subcategory || row.sub_category || row.subCategory || '',
            sectionKey: row.section_key || row.category_id || row.category || 'all',
            author: row.author || 'Ban Biên tập',
            authorRole: row.author_role || row.authorRole || '',
            date: row.published_at
              ? new Date(row.published_at).toLocaleDateString('vi-VN')
              : row.date || 'Hôm nay',
            image: row.image_url || row.image || '',
            images: Array.isArray(row.images) ? row.images : row.image_url ? [row.image_url] : [],
            views: Number(row.views || 0),
            isFeatured: !!row.is_featured,
            status: row.status ?? '',
          })) as any;
          setLiveArticles(mapped);
        }
      } catch (err) {
        console.warn('[HomeView] fetchArticles error caught gracefully:', err);
      }
    };

    // 3. fetchDocuments (gọi trực tiếp Supabase lấy 5 văn bản mới nhất nếu props truyền vào rỗng)
    const fetchDocuments = async () => {
      try {
        if (documents && documents.length > 0) return;
        const supabase = getSupabase();
        if (!supabase) return;

        let res = await withTimeout(
          supabase.from('documents').select('*').order('published_at', { ascending: false }).limit(5),
          5000,
          { data: null, error: new Error('Timeout') } as any
        );
        if (res?.error) {
          res = await withTimeout(
            supabase.from('documents').select('*').limit(5),
            5000,
            { data: null, error: new Error('Timeout') } as any
          );
        }
        const docData = !res?.error ? res?.data : null;

        if (isMounted && !res?.error && Array.isArray(docData)) {
          const mappedDocs: DocumentItem[] = docData.map((item: any) => ({
            id: Number(item.id),
            code: item.document_number || item.code || item.code_number || 'VB',
            title: item.title || '',
            category: item.category || 'Văn bản chỉ đạo',
            issuer: item.issuer || 'Trung đoàn 95',
            date: item.published_at ? new Date(item.published_at).toLocaleDateString('vi-VN') : 'Mới nhất',
            type: (item.file_type || item.type || 'pdf').toLowerCase(),
            fileUrl: item.file_url || item.fileUrl,
            fileName: item.file_name || item.fileName,
            fileSize: item.file_size || item.fileSize,
            downloads: Number(item.downloads || 0),
            secretLevel: item.secret_level || 'normal',
          }));
          setLiveDocuments(mappedDocs);
        }
      } catch (err) {
        console.warn('[HomeView] fetchDocuments error caught gracefully:', err);
      }
    };

    // 4. fetchLectures (gọi trực tiếp Supabase lấy 5 bài giảng mới nhất nếu props truyền vào rỗng)
    const fetchLectures = async () => {
      try {
        if (lectures && lectures.length > 0) return;
        const supabase = getSupabase();
        if (!supabase) return;

        let res = await withTimeout(
          supabase.from('lectures').select('*').order('published_at', { ascending: false }).limit(5),
          5000,
          { data: null, error: new Error('Timeout') } as any
        );
        if (res?.error) {
          res = await withTimeout(
            supabase.from('lectures').select('*').order('created_at', { ascending: false }).limit(5),
            5000,
            { data: null, error: new Error('Timeout') } as any
          );
        }
        if (res?.error) {
          res = await withTimeout(
            supabase.from('lectures').select('*').limit(5),
            5000,
            { data: null, error: new Error('Timeout') } as any
          );
        }
        const lecData = !res?.error ? res?.data : null;

        if (isMounted && !res?.error && Array.isArray(lecData)) {
          const mappedLectures: LectureItem[] = lecData.map((item: any) => ({
            id: Number(item.id),
            title: item.title || '',
            category: item.category || item.subject || 'Bài giảng số',
            target: item.target || item.audience || item.category || 'Toàn đơn vị',
            duration: item.duration || '45 phút',
            author: item.author || item.instructor || 'Ban Tuyên huấn',
            date: item.published_at
              ? new Date(item.published_at).toLocaleDateString('vi-VN')
              : item.created_at
              ? new Date(item.created_at).toLocaleDateString('vi-VN')
              : 'Mới nhất',
            desc: item.description || item.desc || '',
            fileType: (item.file_type || item.fileType || 'pptx').toLowerCase() as any,
            fileName: item.file_name || item.fileName,
            fileSize: item.file_size || item.fileSize,
            fileUrl: item.file_url || item.fileUrl,
          }));
          setLiveLectures(mappedLectures);
        }
      } catch (err) {
        console.warn('[HomeView] fetchLectures error caught gracefully:', err);
      }
    };

    // 5. fetchUncleHo
    const fetchUncleHo = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;

        const res = await withTimeout(
          supabase.from('uncle_ho_quotes').select('*').limit(366),
          5000,
          { data: null, error: new Error('Timeout') } as any
        );
        const qData = !res?.error ? res?.data : null;

        if (isMounted && !res?.error && qData && Array.isArray(qData) && qData.length > 0) {
          setLiveUncleHoQuotes(qData as any);
        } else {
          // Fallback sang uncle_ho_teachings
          const fbRes = await withTimeout(
            supabase.from('uncle_ho_teachings').select('*').limit(366),
            5000,
            { data: null, error: new Error('Timeout') } as any
          );
          if (isMounted && !fbRes?.error && fbRes?.data && Array.isArray(fbRes.data) && fbRes.data.length > 0) {
            setLiveUncleHoQuotes(fbRes.data as any);
          } else if (isMounted) {
            setLiveUncleHoQuotes(defaultUncleHoQuotes);
          }
        }
      } catch (err) {
        console.warn('[HomeView] fetchUncleHo error caught gracefully:', err);
        if (isMounted) setLiveUncleHoQuotes(defaultUncleHoQuotes);
      }
    };

    // Khởi chạy tất cả fetch an toàn độc lập, LUÔN LUÔN gọi setLoading(false) trong finally
    const loadAllDataSafely = async () => {
      setLoading(true);
      try {
        await Promise.allSettled([
          fetchPosters(),
          fetchArticles(),
          fetchDocuments(),
          fetchLectures(),
          fetchUncleHo(),
        ]);
      } catch (globalErr) {
        console.warn('[HomeView] loadAllDataSafely error caught:', globalErr);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAllDataSafely();

    const handlePosterUpdated = (e: any) => {
      const p = e?.detail?.poster;
      const id = e?.detail?.id;
      if (p && isMounted) {
        if (id === POSTER_ID_SAFETY || id === 'safety' || id === 'safety_message') {
          setSupabasePosters((prev) => ({
            ...prev,
            [POSTER_ID_SAFETY]: {
              id: POSTER_ID_SAFETY,
              category_name: p.category_name || p.categoryName || 'MỖI NGÀY MỘT THÔNG ĐIỆP AN TOÀN',
              title: p.title || '',
              image_url: p.image_url || p.image_data || p.imageUrl || '',
              aspect_ratio: p.aspect_ratio || p.aspectRatio || 'portrait',
              updated_at: p.updated_at || new Date().toISOString(),
            },
          }));
        } else if (
          id === POSTER_ID_TRAFFIC ||
          id === 'tinh_huong_giao_thong' ||
          id === 'traffic' ||
          id === 'traffic_situation'
        ) {
          setSupabasePosters((prev) => ({
            ...prev,
            [POSTER_ID_TRAFFIC]: {
              id: POSTER_ID_TRAFFIC,
              category_name: p.category_name || p.categoryName || 'MỖI NGÀY MỘT TÌNH HUỐNG GIAO THÔNG',
              title: p.title || '',
              image_url: p.image_url || p.image_data || p.imageUrl || '',
              aspect_ratio: p.aspect_ratio || p.aspectRatio || 'portrait',
              updated_at: p.updated_at || new Date().toISOString(),
            },
          }));
        }

        setDailyPosters((prev) => {
          const next = { ...prev, [id]: p };
          if (id === POSTER_ID_TRAFFIC || id === 'traffic' || id === 'traffic_situation') {
            next[POSTER_ID_TRAFFIC] = p;
            next['traffic'] = p;
            next['traffic_situation'] = p;
          } else if (id === POSTER_ID_SAFETY || id === 'safety' || id === 'safety_message') {
            next[POSTER_ID_SAFETY] = p;
            next['safety'] = p;
            next['safety_message'] = p;
          }
          return next;
        });
      }
    };
    window.addEventListener('daily_posters_updated', handlePosterUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('daily_posters_updated', handlePosterUpdated);
    };
  }, []);

  // Tổng hợp danh sách dailyWidgets bao gồm dữ liệu từ dailyPosters state
  const mergedDailyWidgets: DailyWidgetItem[] = React.useMemo(() => {
    const list: DailyWidgetItem[] = Array.isArray(siteConfig?.dailyWidgets)
      ? [...siteConfig.dailyWidgets]
      : [];

    Object.entries(effectiveDailyPosters).forEach(([id, poster]) => {
      const cleanId = id.replace(/^widget_/, '');
      const isTraffic =
        cleanId === 'tinh-huong-giao-thong' ||
        cleanId === 'tinh_huong_giao_thong' ||
        cleanId === 'traffic_situation' ||
        cleanId === 'traffic';

      const posterKey = cleanId === 'safety_message' ? 'safety' : isTraffic ? 'tinh-huong-giao-thong' : cleanId;
      const targetId = posterKey === 'safety' ? 'safety_message' : isTraffic ? 'traffic_situation' : 'good_deed';
      const defaultCategory =
        targetId === 'safety_message'
          ? 'MỖI NGÀY MỘT THÔNG ĐIỆP AN TOÀN'
          : isTraffic
          ? 'MỖI NGÀY MỘT TÌNH HUỐNG GIAO THÔNG'
          : 'MỖI NGÀY MỘT HÀNH ĐỘNG ĐẸP';

      const idx = list.findIndex(
        (w) =>
          w.id === targetId ||
          w.id === id ||
          (posterKey === 'safety' && (w.id === 'safety' || w.id === 'safety_message')) ||
          (isTraffic && (w.id === 'traffic' || w.id === 'traffic_situation' || w.id === 'tinh-huong-giao-thong')) ||
          (posterKey === 'good_deed' && (w.id === 'good_deed' || w.id === 'widget_good_deed'))
      );

      const itemData: DailyWidgetItem = {
        id: targetId,
        categoryName: poster.category_name || defaultCategory,
        title: poster.title || '',
        imageUrl: poster.image_data,
        aspectRatioMode: (poster.aspect_ratio as any) || 'auto',
      };

      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          categoryName: poster.category_name || list[idx].categoryName || defaultCategory,
          title: poster.title || list[idx].title || '',
          imageUrl: poster.image_data || list[idx].imageUrl,
          aspectRatioMode: (poster.aspect_ratio as any) || list[idx].aspectRatioMode,
        };
      } else {
        list.push(itemData);
      }
    });

    return list.length > 0 ? list : (siteConfig?.dailyWidgets as any) || [];
  }, [siteConfig?.dailyWidgets, effectiveDailyPosters]);

  // Lấy dữ liệu cho 2 khung Poster khóa cứng ID: ưu tiên tuyệt đối Supabase ('daily_posters')
  const getLockedPosterData = (posterId: typeof POSTER_ID_SAFETY | typeof POSTER_ID_TRAFFIC) => {
    const isTraffic = posterId === POSTER_ID_TRAFFIC;
    const defaultCategory = isTraffic
      ? 'MỖI NGÀY MỘT TÌNH HUỐNG GIAO THÔNG'
      : 'MỖI NGÀY MỘT THÔNG ĐIỆP AN TOÀN';

    // 1. Ưu tiên cao nhất: bản ghi trực tiếp từ Supabase (hoặc vừa lưu xong)
    const fromSb = supabasePosters?.[posterId];

    // 2. Fallback phụ từ state/props/siteConfig nếu Supabase chưa có trường đó
    const legacyKeys = isTraffic
      ? [POSTER_ID_TRAFFIC, 'tinh_huong_giao_thong', 'traffic_situation', 'traffic']
      : [POSTER_ID_SAFETY, 'safety_message', 'safety'];

    let fromProps: any = null;
    for (const k of legacyKeys) {
      const candidate = propsDailyPosters?.[k] || dailyPosters?.[k];
      if (candidate && (candidate.image_url || candidate.image_data || candidate.imageUrl || candidate.category_name)) {
        fromProps = candidate;
        break;
      }
    }

    const fromSiteWidgets = Array.isArray(siteConfig?.dailyWidgets)
      ? siteConfig.dailyWidgets.find((w) => legacyKeys.includes(w.id))
      : undefined;

    const category_name =
      (fromSb?.category_name && fromSb.category_name.trim()) ||
      (fromProps?.category_name && String(fromProps.category_name).trim()) ||
      (fromProps?.categoryName && String(fromProps.categoryName).trim()) ||
      (fromSiteWidgets?.categoryName && fromSiteWidgets.categoryName.trim()) ||
      defaultCategory;

    const title =
      (fromSb?.title && fromSb.title.trim()) ||
      (fromProps?.title && String(fromProps.title).trim()) ||
      (fromSiteWidgets?.title && fromSiteWidgets.title.trim()) ||
      '';

    const image_url =
      (fromSb?.image_url && fromSb.image_url.trim()) ||
      (fromProps?.image_url && String(fromProps.image_url).trim()) ||
      (fromProps?.image_data && String(fromProps.image_data).trim()) ||
      (fromProps?.imageUrl && String(fromProps.imageUrl).trim()) ||
      (fromSiteWidgets?.imageUrl && fromSiteWidgets.imageUrl.trim()) ||
      '';

    const rawRatio =
      fromSb?.aspect_ratio ||
      fromProps?.aspect_ratio ||
      fromProps?.aspectRatio ||
      fromProps?.aspectRatioMode ||
      fromSiteWidgets?.aspectRatioMode ||
      'portrait';

    const aspect_ratio: 'auto' | 'portrait' | 'landscape' =
      rawRatio === 'portrait' || rawRatio === 'landscape' || rawRatio === 'auto'
        ? rawRatio
        : 'portrait';

    const updated_at = fromSb?.updated_at || fromProps?.updated_at || fromSiteWidgets?.updatedAt || '';

    return {
      id: posterId,
      category_name,
      title,
      image_url,
      aspect_ratio,
      updated_at,
    };
  };

  const renderLockedPosterCard = (
    posterId: typeof POSTER_ID_SAFETY | typeof POSTER_ID_TRAFFIC,
    reactKey: string
  ) => {
    const isTraffic = posterId === POSTER_ID_TRAFFIC;
    const data = getLockedPosterData(posterId);
    const IconComp = isTraffic ? Car : ShieldAlert;
    const headerBg = isTraffic
      ? 'bg-gradient-to-r from-amber-700 to-yellow-800'
      : 'bg-gradient-to-r from-red-800 to-rose-900';
    const borderColor = isTraffic
      ? 'border-amber-200 hover:border-amber-400'
      : 'border-red-200 hover:border-red-400';

    const aspectClass =
      data.aspect_ratio === 'portrait'
        ? 'aspect-[3/4] object-cover'
        : data.aspect_ratio === 'landscape'
        ? 'aspect-video object-cover'
        : 'w-full h-auto max-h-[550px] object-contain';

    const displaySrc = data.image_url
      ? data.image_url.startsWith('data:')
        ? data.image_url
        : `${data.image_url.split('?')[0]}?t=${new Date(data.updated_at || Date.now()).getTime()}`
      : '';

    const handleOpenPosterEdit = () => {
      setEditingPoster({
        id: posterId,
        category_name: data.category_name,
        title: data.title,
        image_url: data.image_url,
        aspect_ratio: data.aspect_ratio,
      });
    };

    return (
      <div
        key={reactKey}
        id={`daily-poster-widget-${posterId}`}
        className={`bg-white rounded-xl border ${borderColor} shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className={`${headerBg} text-white px-3.5 py-2.5 flex items-center justify-between shadow-2xs`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded-md bg-white/20 shrink-0 shadow-inner">
              <IconComp className="w-4 h-4 text-amber-300" />
            </span>
            <span className="font-bold text-sm sm:text-base tracking-wide uppercase text-white truncate">
              {data.category_name}
            </span>
          </div>

          {isAdmin && (
            <button
              type="button"
              id={`edit-poster-btn-${posterId}`}
              onClick={handleOpenPosterEdit}
              className="bg-white/20 hover:bg-white/35 text-amber-200 hover:text-white px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs shrink-0"
              title="Chỉnh sửa ảnh Poster chuyên mục này"
            >
              <Edit3 className="w-3 h-3" />
              <span>Sửa</span>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-2 sm:p-2.5 bg-slate-50/50 flex flex-col items-center justify-center">
          {displaySrc ? (
            <div
              onClick={() =>
                setLightboxPoster({
                  title: data.category_name,
                  image_url: displaySrc,
                  isTraffic,
                })
              }
              className="relative w-full rounded-lg overflow-hidden bg-slate-900/5 border border-gray-200/80 shadow-2xs group cursor-zoom-in transition-all flex items-center justify-center"
              title="Bấm để phóng to xem trọn vẹn poster"
            >
              <img
                key={data.updated_at || displaySrc}
                src={displaySrc}
                alt={data.category_name}
                className={`rounded-lg transition-transform duration-300 group-hover:scale-[1.02] ${aspectClass}`}
                loading="eager"
                decoding="async"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold pointer-events-none backdrop-blur-[1px]">
                <Maximize2 className="w-4 h-4 text-amber-300" />
                <span>Phóng to</span>
              </div>
            </div>
          ) : (
            <div
              onClick={isAdmin ? handleOpenPosterEdit : undefined}
              className={`w-full py-10 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 gap-2 bg-white ${
                isAdmin ? 'cursor-pointer hover:border-amber-400 hover:bg-amber-50/40' : ''
              }`}
            >
              <ImageIcon className="w-8 h-8 text-gray-300" />
              <span className="text-xs font-medium">Chưa có ảnh poster</span>
              {isAdmin && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  Bấm để tải ảnh lên
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Layout Settings
  const layout = siteConfig?.layoutSettings || {};
  const showFeaturedSlider = layout.showFeaturedSlider !== false;
  const showSpotlight = layout.showSpotlightSection !== false;
  const showCategoryColumns = layout.showCategoryColumns !== false;
  const showQuickLibrary = layout.showQuickLibrarySection !== false;

  // Dynamic Sidebar Widgets setup
  const configuredSidebarWidgets: SidebarWidgetSetting[] = React.useMemo(() => {
    const fromLayout = siteConfig?.layoutSettings?.sidebarWidgets || siteConfig?.home_layout?.sidebarWidgets;
    const fromConfig = siteConfig?.sidebarWidgets;
    const list =
      fromLayout && fromLayout.length > 0
        ? fromLayout
        : fromConfig && fromConfig.length > 0
        ? fromConfig
        : defaultSidebarWidgets;

    return normalizeWidgetsList(list);
  }, [siteConfig?.layoutSettings?.sidebarWidgets, siteConfig?.home_layout?.sidebarWidgets, siteConfig?.sidebarWidgets]);

  const leftWidgets = React.useMemo(() => {
    return configuredSidebarWidgets
      .filter((w) => w.side === 'left' && w.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [configuredSidebarWidgets]);

  const rightWidgets = React.useMemo(() => {
    return configuredSidebarWidgets
      .filter((w) => w.side === 'right' && w.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [configuredSidebarWidgets]);

  const hasLeftColumn = leftWidgets.length > 0;
  const hasRightColumn = rightWidgets.length > 0;
  const hasMiddleColumn = showFeaturedSlider || showSpotlight;

  // Quick Action Cards from siteConfig (support both property keys) or default
  const quickActionCards: QuickActionCard[] =
    siteConfig?.quickActionCards ||
    siteConfig?.homeQuickActions || [
    {
      id: 'card-doc',
      title: 'VĂN BẢN - CHỈ THỊ',
      subtitle: 'Kho tài liệu tác chiến & quân sự',
      iconName: 'doc',
      type: 'internal',
      targetPage: 'doc',
      bgGradient: 'from-blue-900 via-indigo-900 to-slate-900',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-200',
      heightSize: 'md',
      enabled: true,
    },
    {
      id: 'card-lecture',
      title: 'BÀI GIẢNG SỐ HÓA',
      subtitle: 'Thư viện giáo án điện tử Sư đoàn',
      iconName: 'lecture',
      type: 'internal',
      targetPage: 'lecture',
      bgGradient: 'from-emerald-900 via-teal-900 to-slate-900',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-200',
      heightSize: 'md',
      enabled: true,
    },
    {
      id: 'card-bac',
      title: 'HỌC TẬP THEO BÁC',
      subtitle: 'Lời Bác dạy & tư liệu lịch sử',
      iconName: 'book',
      type: 'internal',
      targetPage: 'bac',
      bgGradient: 'from-amber-900 via-red-950 to-orange-950',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-200',
      heightSize: 'md',
      enabled: true,
    },
    {
      id: 'card-online-exam',
      title: 'THI TÌM HIỂU TRỰC TUYẾN',
      subtitle: 'Nghị quyết Đại hội Đảng các cấp',
      iconName: 'exam',
      type: 'external',
      externalUrl: 'https://thitimhieunghiquyet.vn',
      bgGradient: 'from-purple-900 via-violet-900 to-slate-900',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-200',
      heightSize: 'md',
      enabled: true,
    },
  ];

  // Lấy danh sách chuyên mục động thực tế từ hệ thống (từ Tab 3, Tab 4)
  const availableCategories: CategoryConfig[] = React.useMemo(() => {
    const raw =
      (Array.isArray(categories) && categories.length > 0 ? categories : null) ||
      (Array.isArray(siteConfig?.categories_config) && siteConfig.categories_config.length > 0
        ? siteConfig.categories_config
        : null) ||
      (Array.isArray(siteConfig?.categories) && siteConfig.categories.length > 0
        ? (siteConfig.categories as any[])
        : null) ||
      defaultCategoriesConfig;
    return raw.filter((c: any) => c && typeof c === 'object');
  }, [categories, siteConfig?.categories_config, siteConfig?.categories]);

  // Tạo danh sách cột chuyên mục mặc định đồng bộ 100% theo categories thực tế (loại bỏ 3 danh mục tĩnh cũ)
  const defaultDynamicColumns: HomeCategoryColumn[] = React.useMemo(() => {
    const validCats = availableCategories.filter(
      (c) => c.enabled !== false && c.type !== 'external'
    );
    const colorPresets = ['bg-red-800', 'bg-emerald-800', 'bg-amber-800', 'bg-blue-800', 'bg-indigo-900', 'bg-slate-900'];
    return validCats.map((cat, idx) => ({
      id: `col-${cat.id}`,
      title: cat.name,
      subtitle:
        Array.isArray(cat.subcategories) && cat.subcategories.length > 0
          ? cat.subcategories.join(' • ')
          : cat.description || '',
      type: 'category_articles',
      sectionKey: cat.id,
      categoryFilter: 'all',
      articleLimit: 5,
      headerBgColor: colorPresets[idx % colorPresets.length],
      headerTextColor: 'text-amber-200',
      iconName: idx % 3 === 0 ? 'flag' : idx % 3 === 1 ? 'crosshair' : 'heart',
      enabled: true,
      colSpan: '1',
      heightMode: 'auto',
    }));
  }, [availableCategories]);

  // Dynamic Category Columns from siteConfig (home_sections hoặc homeCategoryColumns) or localStorage, fallback default only when both are empty
  const configuredColumns: HomeCategoryColumn[] = React.useMemo(() => {
    let rawCols: any[] | null =
      (Array.isArray((siteConfig as any)?.home_sections) && (siteConfig as any).home_sections.length > 0
        ? (siteConfig as any).home_sections
        : null) ||
      (Array.isArray((siteConfig as any)?.config?.home_sections) &&
      (siteConfig as any).config.home_sections.length > 0
        ? (siteConfig as any).config.home_sections
        : null) ||
      (Array.isArray(siteConfig?.homeCategoryColumns) && siteConfig.homeCategoryColumns.length > 0
        ? siteConfig.homeCategoryColumns
        : null) ||
      (Array.isArray((siteConfig as any)?.home_layout) && (siteConfig as any).home_layout.length > 0
        ? (siteConfig as any).home_layout
        : null);

    if (!rawCols) {
      try {
        const cacheKeys = ['cached_home_sections', 'cached_home_category_columns', 'cached_home_layout'];
        for (const key of cacheKeys) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              rawCols = parsed;
              break;
            }
          }
        }
        if (!rawCols) {
          const rawCfg =
            localStorage.getItem('mangyang_site_config') ||
            localStorage.getItem('site_config_cache') ||
            localStorage.getItem('cached_site_config');
          if (rawCfg) {
            const parsedCfg = JSON.parse(rawCfg);
            const nested =
              (Array.isArray(parsedCfg?.home_sections) && parsedCfg.home_sections.length > 0
                ? parsedCfg.home_sections
                : null) ||
              (Array.isArray(parsedCfg?.config?.home_sections) && parsedCfg.config.home_sections.length > 0
                ? parsedCfg.config.home_sections
                : null) ||
              (Array.isArray(parsedCfg?.homeCategoryColumns) && parsedCfg.homeCategoryColumns.length > 0
                ? parsedCfg.homeCategoryColumns
                : null);
            if (nested) rawCols = nested;
          }
        }
      } catch {}
    }

    const effectiveCols = rawCols && rawCols.length > 0 ? rawCols : defaultDynamicColumns;

    return effectiveCols.map((col: any, idx: number): HomeCategoryColumn => {
      const rawEmbed = col?.embedCode ?? col?.embedHtml ?? '';
      const hasEmbed =
        col?.type === 'embed_code' ||
        col?.type === 'embed' ||
        col?.type === 'video' ||
        (typeof rawEmbed === 'string' && rawEmbed.trim() !== '') ||
        (typeof col?.embedUrl === 'string' && col.embedUrl.trim() !== '');

      const normalizedBase: HomeCategoryColumn = {
        ...col,
        id: col?.id || `col-${idx}`,
        type: hasEmbed ? 'embed_code' : (col?.type || 'category_articles'),
        headerBgColor: col?.headerBgColor || col?.color || (hasEmbed ? 'bg-indigo-900' : 'bg-red-800'),
        iconName: col?.iconName || col?.icon || (hasEmbed ? 'video' : 'flag'),
        heightMode: col?.heightMode || col?.height || 'auto',
      };

      if (hasEmbed) return normalizedBase;

      const matched = availableCategories.find(
        (c) => c.id === normalizedBase.sectionKey || c.sectionKey === normalizedBase.sectionKey
      );
      if (matched) {
        return {
          ...normalizedBase,
          title: normalizedBase.title || matched.name || '',
          subtitle:
            normalizedBase.subtitle !== undefined && normalizedBase.subtitle !== ''
              ? normalizedBase.subtitle
              : Array.isArray(matched.subcategories) && matched.subcategories.length > 0
              ? matched.subcategories.join(' • ')
              : '',
        };
      }
      return normalizedBase;
    });
  }, [
    (siteConfig as any)?.home_sections,
    (siteConfig as any)?.config?.home_sections,
    (siteConfig as any)?.home_layout,
    siteConfig?.homeCategoryColumns,
    defaultDynamicColumns,
    availableCategories,
  ]);

  const activeColumns = configuredColumns
    .filter((col) => col.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const getColumnIcon = (iconName?: string) => {
    switch (iconName) {
      case 'flag':
        return <Flag className="w-4 h-4 text-red-600" />;
      case 'crosshair':
        return <Crosshair className="w-4 h-4 text-emerald-600" />;
      case 'shield':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'layers':
        return <Layers className="w-4 h-4 text-indigo-600" />;
      case 'book':
        return <BookOpen className="w-4 h-4 text-teal-600" />;
      case 'video':
        return <Video className="w-4 h-4 text-rose-600" />;
      case 'code':
        return <Code className="w-4 h-4 text-purple-600" />;
      case 'globe':
        return <Globe className="w-4 h-4 text-cyan-600" />;
      default:
        return <Newspaper className="w-4 h-4 text-red-600" />;
    }
  };

  const announcements: HomeAnnouncement[] = siteConfig?.homeAnnouncements || [
    {
      id: 'ann-1',
      title: 'Kết quả Cuộc thi tìm hiểu trực tuyến Đại hội XIV của Đảng, Đại hội Đảng bộ Quân đội lần thứ XII và Đại hội Đảng bộ Trung đoàn 95 nhiệm kỳ 2025-2030 (Tuần thứ 3)',
      date: '19/08/2026',
      highlight: true,
    },
    {
      id: 'ann-2',
      title: 'Kết quả Cuộc thi tìm hiểu trực tuyến Đại hội XIV của Đảng, Đại hội Đảng bộ Quân đội lần thứ XII và Đại hội Đảng bộ Trung đoàn 95 nhiệm kỳ 2025-2030 (Tuần thứ nhất)',
      date: '12/08/2026',
    },
    {
      id: 'ann-3',
      title: 'VIETTEL TUNG NHIỀU ƯU ĐÃI KHUYẾN KHÍCH CÁN BỘ CHIẾN SĨ SỚM XÁC THỰC THÔNG TIN THUÊ BAO CHÍNH CHỦ',
      date: '08/08/2026',
    },
  ];

  // Top fast download handler
  const handleFastDownloadDoc = (doc: DocumentItem) => {
    const defaultFileName =
      doc.fileName ||
      `${doc.code.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}.${doc.type || 'pdf'}`;

    if (doc.fileUrl) {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = defaultFileName;
      if (doc.fileUrl.startsWith('http')) link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const blobContent = `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\nBỘ TƯ LỆNH SƯ ĐOÀN 10 - ĐOÀN MANG YANG\n${doc.issuer.toUpperCase()}\n\nSố/Ký hiệu: ${doc.code}\nNgày ban hành: ${doc.date}\nTiểu mục: ${doc.category || 'Văn bản hành chính'}\n\nTRÍCH YẾU NỘI DUNG:\n${doc.title}\n\n${doc.description || 'Văn bản quy định lưu hành nội bộ đơn vị.'}`;
      const blob = new Blob([blobContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFileName.endsWith('.txt') ? defaultFileName : `${defaultFileName}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleFastDownloadLecture = (lec: LectureItem) => {
    const defaultFileName =
      lec.fileName ||
      `${lec.title.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}.${
        lec.fileType === 'word' ? 'docx' : lec.fileType === 'pdf' ? 'pdf' : 'pptx'
      }`;

    if (lec.fileUrl) {
      const link = document.createElement('a');
      link.href = lec.fileUrl;
      link.download = defaultFileName;
      if (lec.fileUrl.startsWith('http')) link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const content = `QUÂN ĐỘI NHÂN DÂN VIỆT NAM\nSƯ ĐOÀN 10 - ĐOÀN MANG YANG\n\nBÀI GIẢNG ĐIỆN TỬ: ${lec.title}\nĐối tượng: ${lec.target}\nGiáo viên: ${lec.author}\nNgày: ${lec.date}\n\n${lec.desc}`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Admin Action Bar for Layout Customization */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-indigo-950 border border-amber-500/40 rounded-xl p-2.5 px-4 text-white flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <Sliders className="w-4 h-4" />
            <span>BẢNG ĐIỀU KHIỂN BỐ CỤC TRANG CHỦ (ADMIN)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLayoutModalOpen(true)}
              className="bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-105"
            >
              <Layout className="w-3.5 h-3.5" />
              <span>BẬT/TẮT BỐ CỤC TRANG CHỦ</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSectionManagerModalOpen(true)}
              className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-300" />
              <span>QUẢN LÝ CHUYÊN MỤC</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          1. 4-FRACTION TOP MAIN SECTION
          - Left Column (1/4):
              + Lời Bác dạy ngày này năm xưa (if enabled)
              + Thông báo & Sự kiện quan trọng (if enabled)
          - Center Column (2/4):
              + Featured Carousel Slider (if enabled)
              + Bài đăng mới nhất, tiêu biểu (if enabled)
          - Right Column (1/4):
              + Tin mới nhất (if enabled)
              + Tiện ích quân nhân / Cuộc thi trực tuyến (if enabled)
         ======================================================== */}
      {/* ========================================================
          1. 3-COLUMN SMART TOP MAIN SECTION
          - Dynamic Left / Right widget placement
          - Intelligent auto-expansion (50% Center with both, 75% Center with one side, 100% Center without sidebars)
         ======================================================== */}
      {(hasLeftColumn || hasMiddleColumn || hasRightColumn) && (
        <div
          className={`grid grid-cols-1 gap-4 lg:gap-5 items-start w-full ${
            hasLeftColumn && hasMiddleColumn && hasRightColumn
              ? 'lg:grid-cols-[22%_1fr_22%] xl:grid-cols-[21.5%_1fr_21.5%]'
              : hasLeftColumn && hasMiddleColumn && !hasRightColumn
              ? 'lg:grid-cols-[23%_1fr]'
              : !hasLeftColumn && hasMiddleColumn && hasRightColumn
              ? 'lg:grid-cols-[1fr_23%]'
              : hasLeftColumn && !hasMiddleColumn && hasRightColumn
              ? 'lg:grid-cols-2'
              : 'grid-cols-1'
          }`}
        >
          {/* LEFT COLUMN */}
          {hasLeftColumn && (
            <div className="flex flex-col gap-4 w-full">
              {(leftWidgets || []).map((widget) => {
                switch (widget.id) {
                  case 'uncle_ho':
                    return (
                      <UncleHoDailySection
                        key="widget-uncle-ho"
                        quotes={effectiveUncleHoQuotes}
                        settings={uncleHoSettings}
                        currentUser={currentUser}
                        isLoading={isLoading}
                        onOpenManager={onOpenUncleHoManager}
                        onSaveQuotes={onSaveUncleHoQuotes}
                        layout="vertical"
                      />
                    );
                  case 'safety_message':
                  case 'widget_safety_message':
                    return renderLockedPosterCard(POSTER_ID_SAFETY, `widget-left-safety-${widget.id}`);
                  case 'traffic_situation':
                  case 'widget_traffic_situation':
                    return renderLockedPosterCard(POSTER_ID_TRAFFIC, `widget-left-traffic-${widget.id}`);
                  case 'good_deed':
                  case 'widget_good_deed':
                    return (
                      <DailyPosterWidget
                        key={`widget-left-deed-${widget.id}`}
                        widgetId="good_deed"
                        dailyWidgets={mergedDailyWidgets}
                        dailyPosters={effectiveDailyPosters}
                        currentUser={currentUser}
                        onSaveDailyWidgets={onSaveDailyWidgets || (() => {})}
                      />
                    );
                  case 'daily_widgets':
                    return (
                      <div key="widget-left-daily-widgets-group" className="flex flex-col gap-4">
                        {renderLockedPosterCard(POSTER_ID_SAFETY, 'widget-left-group-safety')}
                        {renderLockedPosterCard(POSTER_ID_TRAFFIC, 'widget-left-group-traffic')}
                        <DailyPosterWidget
                          widgetId="good_deed"
                          dailyWidgets={mergedDailyWidgets}
                          dailyPosters={effectiveDailyPosters}
                          currentUser={currentUser}
                          onSaveDailyWidgets={onSaveDailyWidgets || (() => {})}
                        />
                      </div>
                    );
                  case 'announcements':
                    return (
                      <HomeAnnouncementsWidget
                        key="widget-announcements"
                        announcements={announcements}
                        currentUser={currentUser}
                        articles={approvedArticles}
                        isLoading={isLoading}
                        onOpenArticle={onOpenArticle}
                        onOpenAnnouncementManager={onOpenAnnouncementManager}
                      />
                    );
                  case 'latest_news':
                    return (
                      <HomeLatestNewsWidget
                        key="widget-latest-news"
                        articles={approvedArticles}
                        isLoading={isLoading}
                        onOpenArticle={onOpenArticle}
                        onSelectSection={onSelectSection}
                      />
                    );
                  case 'quick_actions':
                    return (
                      <HomeQuickActionsWidget
                        key="widget-quick-actions"
                        cards={quickActionCards}
                        currentUser={currentUser}
                        onSelectSection={onSelectSection}
                        onOpenQuickActionManager={() => setIsQuickActionModalOpen(true)}
                      />
                    );
                  default:
                    return null;
                }
              })}
            </div>
          )}

          {/* MIDDLE COLUMN: Auto-expand depending on active sidebars */}
          {hasMiddleColumn && (
            <div className="flex flex-col gap-4.5 w-full min-w-0">
              {showFeaturedSlider && (
                <HomeMiddleFeaturedSlider
                  articles={approvedArticles}
                  currentUser={currentUser}
                  isLoading={isLoading}
                  onOpenArticle={onOpenArticle}
                  onEditArticle={onEditArticle}
                  onDeleteArticle={onDeleteArticle}
                />
              )}

              {showSpotlight && (
                <HomeSpotlightSection
                  articles={approvedArticles}
                  spotlightArticleId={siteConfig?.spotlightArticleId}
                  currentUser={currentUser}
                  isLoading={isLoading}
                  onOpenArticle={onOpenArticle}
                  onEditArticle={onEditArticle}
                  onSelectSpotlightArticle={onSelectSpotlightArticle}
                />
              )}
            </div>
          )}

          {/* RIGHT COLUMN */}
          {hasRightColumn && (
            <div className="flex flex-col gap-4 w-full">
              {(rightWidgets || []).map((widget) => {
                switch (widget.id) {
                  case 'uncle_ho':
                    return (
                      <UncleHoDailySection
                        key="widget-uncle-ho"
                        quotes={effectiveUncleHoQuotes}
                        settings={uncleHoSettings}
                        currentUser={currentUser}
                        isLoading={isLoading}
                        onOpenManager={onOpenUncleHoManager}
                        onSaveQuotes={onSaveUncleHoQuotes}
                        layout="vertical"
                      />
                    );
                  case 'safety_message':
                  case 'widget_safety_message':
                    return renderLockedPosterCard(POSTER_ID_SAFETY, `widget-right-safety-${widget.id}`);
                  case 'traffic_situation':
                  case 'widget_traffic_situation':
                    return renderLockedPosterCard(POSTER_ID_TRAFFIC, `widget-right-traffic-${widget.id}`);
                  case 'good_deed':
                  case 'widget_good_deed':
                    return (
                      <DailyPosterWidget
                        key={`widget-right-deed-${widget.id}`}
                        widgetId="good_deed"
                        dailyWidgets={mergedDailyWidgets}
                        dailyPosters={effectiveDailyPosters}
                        currentUser={currentUser}
                        onSaveDailyWidgets={onSaveDailyWidgets || (() => {})}
                      />
                    );
                  case 'daily_widgets':
                    return (
                      <div key="widget-right-daily-widgets-group" className="flex flex-col gap-4">
                        {renderLockedPosterCard(POSTER_ID_SAFETY, 'widget-right-group-safety')}
                        {renderLockedPosterCard(POSTER_ID_TRAFFIC, 'widget-right-group-traffic')}
                        <DailyPosterWidget
                          widgetId="good_deed"
                          dailyWidgets={mergedDailyWidgets}
                          dailyPosters={effectiveDailyPosters}
                          currentUser={currentUser}
                          onSaveDailyWidgets={onSaveDailyWidgets || (() => {})}
                        />
                      </div>
                    );
                  case 'announcements':
                    return (
                      <HomeAnnouncementsWidget
                        key="widget-announcements"
                        announcements={announcements}
                        currentUser={currentUser}
                        articles={approvedArticles}
                        isLoading={isLoading}
                        onOpenArticle={onOpenArticle}
                        onOpenAnnouncementManager={onOpenAnnouncementManager}
                      />
                    );
                  case 'latest_news':
                    return (
                      <HomeLatestNewsWidget
                        key="widget-latest-news"
                        articles={approvedArticles}
                        isLoading={isLoading}
                        onOpenArticle={onOpenArticle}
                        onSelectSection={onSelectSection}
                      />
                    );
                  case 'quick_actions':
                    return (
                      <HomeQuickActionsWidget
                        key="widget-quick-actions"
                        cards={quickActionCards}
                        currentUser={currentUser}
                        onSelectSection={onSelectSection}
                        onOpenQuickActionManager={() => setIsQuickActionModalOpen(true)}
                      />
                    );
                  default:
                    return null;
                }
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          2. BOTTOM SECTION: TIN TỨC & SỰ KIỆN THEO CHUYÊN MỤC
         ======================================================== */}
      {showCategoryColumns && (
        <div className="space-y-4 pt-2">
          {/* Banner Title Bar */}
          <div className="bg-linear-to-r from-red-800 via-red-900 to-amber-950 text-white px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-between border-l-4 border-amber-400">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-amber-300" />
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-200">
                TIN TỨC, HOẠT ĐỘNG TOÀN DIỆN ĐƠN VỊ
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsSectionManagerModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 hover:text-white border border-amber-300/40 text-[10px] sm:text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  title="Thêm / Sửa / Nhúng nội dung các chuyên mục trang chủ"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-amber-300" />
                  <span>QUẢN LÝ CHUYÊN MỤC</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onSelectSection('ctd')}
                className="text-[11px] text-amber-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Tất cả tin bài</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Dynamic Equal-Height / Dynamic Size Categories & Embedded Content Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {(activeColumns || []).map((col) => {
              const rawEmbedHtml = (col.embedCode || col.embedHtml || '').trim();
              const isDirectEmbedUrl =
                /^https?:\/\//i.test(rawEmbedHtml) && !rawEmbedHtml.includes('<');
              const resolvedEmbedUrl = isDirectEmbedUrl
                ? normalizeYouTubeEmbedUrl(rawEmbedHtml)
                : col.embedUrl
                ? normalizeYouTubeEmbedUrl(col.embedUrl)
                : '';
              const isEmbed =
                col.type === 'embed_code' ||
                (col.type as string) === 'embed' ||
                (col.type as string) === 'video' ||
                Boolean(rawEmbedHtml) ||
                Boolean(resolvedEmbedUrl);
              const matchedCat = isEmbed
                ? undefined
                : (availableCategories || []).find(
                    (c) =>
                      c.id === col.sectionKey ||
                      c.sectionKey === col.sectionKey ||
                      norm(c.name) === norm(col.title)
                  );
              const displayTitle = isEmbed ? col.title : col.title || matchedCat?.name || '';
              const displaySubtitle = isEmbed
                ? col.subtitle || ''
                : col.subtitle !== undefined && col.subtitle !== ''
                ? col.subtitle
                : matchedCat && Array.isArray(matchedCat.subcategories) && matchedCat.subcategories.length > 0
                ? matchedCat.subcategories.join(' • ')
                : '';

              const sectionIds = [col.sectionKey, matchedCat?.id, matchedCat?.sectionKey].filter(Boolean);
              const sectionNameNorm = norm(displayTitle);
              const sectionNavNorm = norm(matchedCat?.navName);
              const sectionSubcategories = [
                ...(Array.isArray(matchedCat?.subcategories) ? matchedCat.subcategories : []),
                ...(col.categoryFilter && col.categoryFilter !== 'all' ? [col.categoryFilter] : []),
              ]
                .map((s) => norm(s))
                .filter(Boolean);

              const colArticles = isEmbed
                ? []
                : (approvedArticles || [])
                    .filter((a: any) => {
                      // 1. article.category_id === section.id (hoặc sectionKey khớp)
                      const matchId =
                        (a.category_id && sectionIds.includes(a.category_id)) ||
                        (a.sectionKey && sectionIds.includes(a.sectionKey));

                      // 2. norm(article.category) khớp hoặc chứa norm(section.name || section.title)
                      const artCatNorm = norm(a.category);
                      const matchSectionName =
                        Boolean(artCatNorm) &&
                        ((Boolean(sectionNameNorm) &&
                          (artCatNorm === sectionNameNorm ||
                            artCatNorm.includes(sectionNameNorm) ||
                            sectionNameNorm.includes(artCatNorm))) ||
                          (Boolean(sectionNavNorm) &&
                            (artCatNorm === sectionNavNorm ||
                              artCatNorm.includes(sectionNavNorm) ||
                              sectionNavNorm.includes(artCatNorm))));

                      // 3. norm(article.sub_category || article.subcategory || article.category) khớp với bất kỳ tiểu mục nào trong section.subcategories
                      const artSubNorm = norm(a.sub_category || a.subcategory || a.subCategory || a.category);
                      const matchSubcategory = sectionSubcategories.some(
                        (subNorm) =>
                          (artSubNorm &&
                            (artSubNorm === subNorm ||
                              artSubNorm.includes(subNorm) ||
                              subNorm.includes(artSubNorm))) ||
                          (artCatNorm &&
                            (artCatNorm === subNorm ||
                              artCatNorm.includes(subNorm) ||
                              subNorm.includes(artCatNorm)))
                      );

                      return Boolean(matchId || matchSectionName || matchSubcategory);
                    })
                    .slice(0, col.articleLimit || 5);

              // Fallback cho 2 khung VĂN BẢN - CHỈ THỊ và BÀI GIẢNG SỐ nếu chưa có bài trong articles
              const colKeyNorm = norm(`${col.sectionKey || ''} ${displayTitle}`);
              const isDocSection =
                col.sectionKey === 'doc' ||
                colKeyNorm.includes('van ban') ||
                colKeyNorm.includes('chi thi');
              const isLectureSection =
                col.sectionKey === 'lecture' ||
                colKeyNorm.includes('bai giang');

              const fallbackDocs =
                !isEmbed && colArticles.length === 0 && isDocSection
                  ? (effectiveDocuments || []).slice(0, 4)
                  : [];
              const fallbackLectures =
                !isEmbed && colArticles.length === 0 && isLectureSection
                  ? (effectiveLectures || []).slice(0, 4)
                  : [];

              const colSpanClass =
                col.colSpan === 'full' || col.colSpan === '3'
                  ? 'col-span-1 md:col-span-2 lg:col-span-3'
                  : col.colSpan === '2'
                  ? 'col-span-1 md:col-span-2'
                  : 'col-span-1';

              return (
                <div
                  key={col.id}
                  className={`${colSpanClass} bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex flex-col justify-between h-auto hover:shadow-lg transition-all duration-200 group`}
                >
                  <div className="flex-1 flex flex-col">
                    {/* Column Header */}
                    <div
                      className={`px-3.5 py-2.5 ${
                        col.headerBgColor || 'bg-red-50'
                      } border-b border-gray-200/80 flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-1.5 font-black text-xs uppercase truncate">
                        {getColumnIcon(col.iconName)}
                        <span
                          className={`${
                            col.headerTextColor || 'text-gray-900'
                          } truncate font-extrabold`}
                        >
                          {displayTitle}
                        </span>
                      </div>
                      {!isEmbed && col.sectionKey && (
                        <button
                          type="button"
                          onClick={() => onSelectSection(col.sectionKey as PageView)}
                          className="text-[10px] text-gray-600 hover:text-gray-900 font-bold shrink-0 hover:underline cursor-pointer"
                        >
                          Xem thêm →
                        </button>
                      )}
                    </div>

                    {/* Subtitle if any */}
                    {displaySubtitle && (
                      <div className="px-3.5 py-1 bg-gray-50/70 border-b border-gray-100 text-[10px] text-gray-500 truncate">
                        {displaySubtitle}
                      </div>
                    )}

                    {/* Column Body: Either Embedded Code, Articles, or Documents/Lectures fallback */}
                    {isEmbed ? (
                      <div className="p-3 flex-1 flex flex-col justify-center">
                        {rawEmbedHtml && !isDirectEmbedUrl ? (
                          <div
                            className={`w-full rounded-lg overflow-hidden border border-gray-200 bg-black/5 [&_iframe]:w-full [&_iframe]:border-0 [&_iframe]:rounded-lg ${
                              (rawEmbedHtml.includes('youtube') ||
                                rawEmbedHtml.includes('youtu.be') ||
                                rawEmbedHtml.includes('vimeo')) &&
                              col.heightMode !== 'expanded'
                                ? 'aspect-video [&_iframe]:h-full'
                                : col.heightMode === 'expanded'
                                ? 'min-h-[400px] [&_iframe]:min-h-[400px]'
                                : col.heightMode === 'compact'
                                ? 'min-h-[200px] [&_iframe]:min-h-[200px]'
                                : 'min-h-[260px] [&_iframe]:min-h-[260px]'
                            }`}
                            dangerouslySetInnerHTML={{ __html: rawEmbedHtml }}
                          />
                        ) : resolvedEmbedUrl ? (
                          <div
                            className={`w-full rounded-lg overflow-hidden border border-gray-200 bg-black ${
                              col.heightMode === 'expanded' ? 'min-h-[400px]' : 'aspect-video'
                            }`}
                          >
                            <iframe
                              src={resolvedEmbedUrl}
                              title={displayTitle || 'Nội dung nhúng'}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : (
                          <div className="text-center text-xs text-gray-400 py-8 italic flex-1 flex items-center justify-center">
                            Chưa cấu hình mã nhúng hoặc liên kết nguồn
                          </div>
                        )}
                      </div>
                    ) : colArticles && colArticles.length > 0 ? (
                      <div className="p-3 space-y-2 flex-1">
                        {(colArticles || []).map((art) => (
                          <div
                            key={art.id}
                            onClick={() => onOpenArticle(art)}
                            className="p-2.5 rounded-xl border border-gray-100 hover:border-red-200 bg-white hover:bg-amber-50/50 shadow-xs hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group/item cursor-pointer transform"
                          >
                            <h4 className="text-xs font-bold text-gray-800 group-hover/item:text-red-700 leading-snug line-clamp-2 transition-colors">
                              {art.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                              <span className="truncate max-w-[120px]">{art.author}</span>
                              <span>•</span>
                              <span>{art.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : fallbackDocs.length > 0 ? (
                      <div className="p-3 space-y-2 flex-1">
                        {fallbackDocs.map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => onSelectSection('doc')}
                            className="p-2.5 rounded-xl border border-gray-100 hover:border-blue-200 bg-white hover:bg-blue-50/50 shadow-xs transition-all duration-200 group/item cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-mono text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 truncate">
                                {doc.code || 'VĂN BẢN'}
                              </span>
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                {(doc.type || 'pdf').toUpperCase()}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-gray-800 group-hover/item:text-blue-800 leading-snug line-clamp-2 transition-colors">
                              {doc.title}
                            </h4>
                          </div>
                        ))}
                      </div>
                    ) : fallbackLectures.length > 0 ? (
                      <div className="p-3 space-y-2 flex-1">
                        {fallbackLectures.map((lec) => (
                          <div
                            key={lec.id}
                            onClick={() => onSelectSection('lecture')}
                            className="p-2.5 rounded-xl border border-gray-100 hover:border-teal-200 bg-white hover:bg-teal-50/50 shadow-xs transition-all duration-200 group/item cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 truncate">
                                {lec.target || lec.category || 'Bài giảng'}
                              </span>
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                {(lec.fileType || 'pptx').toUpperCase()}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-gray-800 group-hover/item:text-teal-800 leading-snug line-clamp-2 transition-colors">
                              {lec.title}
                            </h4>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center py-6 text-gray-400 flex-1">
                        <p className="text-xs italic">Đang cập nhật tin bài...</p>
                      </div>
                    )}
                  </div>

                  {/* Column Footer */}
                  <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center mt-auto">
                    {!isEmbed && col.sectionKey ? (
                      <button
                        type="button"
                        onClick={() => onSelectSection(col.sectionKey as PageView)}
                        className="text-[11px] font-bold text-teal-800 hover:text-teal-950 inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Vào chuyên mục {displayTitle}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ) : isEmbed && resolvedEmbedUrl ? (
                      <a
                        href={resolvedEmbedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Xem nguồn trực tiếp</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-medium">
                        Khung nhúng nội dung số
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          3. QUICK LIBRARY & LEARNING ASSETS PREVIEW
         ======================================================== */}
      {showQuickLibrary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Quick Documents Preview */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex flex-col">
            <div className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                <FolderArchive className="w-4 h-4" />
                <span>KHO VĂN BẢN QUÂN SỰ MỚI NHẤT</span>
              </div>
              <button
                type="button"
                onClick={() => onSelectSection('doc')}
                className="text-[11px] text-amber-200 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-3 divide-y divide-gray-100 space-y-2 flex-1">
              {(effectiveDocuments || []).length > 0 ? (
                (effectiveDocuments || []).slice(0, 5).map((d) => {
                  const docExt = (d.type || 'pdf').toUpperCase();
                  return (
                    <div key={d.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2.5 group">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                            {d.code || 'VB'}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {docExt}
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">{d.date}</span>
                        </div>
                        <h4
                          onClick={() => onSelectSection('doc')}
                          className="text-xs font-bold text-gray-800 hover:text-blue-800 line-clamp-1 cursor-pointer mt-1"
                        >
                          {d.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {d.fileUrl ? (
                          <a
                            href={d.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Xem tài liệu"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Xem</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelectSection('doc')}
                            className="px-2 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Xem tài liệu"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Xem</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleFastDownloadDoc(d)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-800 text-blue-800 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Tải về tệp này"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs italic text-gray-400">
                  Chưa có tài liệu nào được cập nhật
                </div>
              )}
            </div>
          </div>

          {/* Quick Lectures Preview */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex flex-col">
            <div className="bg-teal-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-teal-200">
                <Laptop className="w-4 h-4 text-teal-300" />
                <span>BÀI GIẢNG ĐIỆN TỬ SỐ HÓA</span>
              </div>
              <button
                type="button"
                onClick={() => onSelectSection('lecture')}
                className="text-[11px] text-teal-200 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-3 divide-y divide-gray-100 space-y-2 flex-1">
              {(effectiveLectures || []).length > 0 ? (
                (effectiveLectures || []).slice(0, 5).map((l) => {
                  const lecExt = (l.fileType || 'pptx').toUpperCase();
                  return (
                    <div key={l.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2.5 group">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            {l.target || l.category || 'Bài giảng'}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {lecExt}
                          </span>
                          <span className="text-[10px] text-gray-500">{l.author}</span>
                        </div>
                        <h4
                          onClick={() => onSelectSection('lecture')}
                          className="text-xs font-bold text-gray-800 hover:text-teal-800 line-clamp-1 cursor-pointer mt-1"
                        >
                          {l.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {l.fileUrl ? (
                          <a
                            href={l.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 bg-slate-100 hover:bg-teal-100 text-slate-700 hover:text-teal-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Xem bài giảng"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Xem</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelectSection('lecture')}
                            className="px-2 py-1 bg-slate-100 hover:bg-teal-100 text-slate-700 hover:text-teal-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Xem bài giảng"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Xem</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleFastDownloadLecture(l)}
                          className="p-1.5 bg-teal-50 hover:bg-teal-800 text-teal-800 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Tải bài giảng về"
                        >
                          <HardDriveDownload className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs italic text-gray-400">
                  Chưa có tài liệu nào được cập nhật
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Manager Modal */}
      {isQuickActionModalOpen && (
        <QuickActionManagerModal
          cards={quickActionCards}
          onSave={(updatedCards) => {
            if (onSaveQuickActions) {
              onSaveQuickActions(updatedCards);
            }
          }}
          onClose={() => setIsQuickActionModalOpen(false)}
        />
      )}

      {/* Home Section Manager Modal */}
      {isSectionManagerModalOpen && siteConfig && (
        <HomeSectionManagerModal
          isOpen={isSectionManagerModalOpen}
          siteConfig={siteConfig}
          categories={availableCategories}
          onClose={() => setIsSectionManagerModalOpen(false)}
          onSaveColumns={(columns) => {
            if (onSaveHomeCategoryColumns) {
              onSaveHomeCategoryColumns(columns);
            }
          }}
        />
      )}

      {/* Layout Manager Modal for Admin */}
      {isLayoutModalOpen && siteConfig && (
        <LayoutManagerModal
          isOpen={isLayoutModalOpen}
          onClose={() => setIsLayoutModalOpen(false)}
          siteConfig={siteConfig}
          onSaveLayout={(newLayout) => {
            if (onSaveLayoutSettings) {
              onSaveLayoutSettings(newLayout);
            }
          }}
        />
      )}

      {/* Daily Poster Modal (Khóa cứng ID 'thong-diep-an-toan' & 'tinh-huong-giao-thong') */}
      <DailyPosterModal
        isOpen={!!editingPoster}
        onClose={() => setEditingPoster(null)}
        posterId={editingPoster?.id}
        initialCategory={editingPoster?.category_name}
        initialTitle={editingPoster?.title}
        initialImage={editingPoster?.image_url}
        initialAspectRatio={editingPoster?.aspect_ratio || 'portrait'}
        onSaved={(saved) => {
          setSupabasePosters((prev) => ({
            ...prev,
            [saved.id]: saved,
          }));
          setDailyPosters((prev) => ({
            ...prev,
            [saved.id]: {
              ...saved,
              image_data: saved.image_url,
            },
          }));
        }}
      />

      {/* Lightbox Zoom cho 2 khung Poster */}
      {lightboxPoster && lightboxPoster.image_url && (
        <div
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setLightboxPoster(null)}
        >
          <div
            className="relative max-w-5xl max-h-[95vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between text-white pb-3 px-2 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {lightboxPoster.isTraffic ? (
                  <Car className="w-5 h-5 text-amber-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <h3 className="font-bold text-sm sm:text-base text-amber-200 truncate">
                  {lightboxPoster.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxPoster(null)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                title="Đóng xem toàn màn hình"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="relative overflow-hidden rounded-xl bg-black/40 border border-white/10 shadow-2xl flex items-center justify-center max-h-[85vh]">
              <img
                src={lightboxPoster.image_url}
                alt={lightboxPoster.title}
                className="max-h-[82vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
