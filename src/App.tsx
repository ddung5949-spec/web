import React, { useEffect, useState } from 'react';
import {
  Article,
  DocumentItem,
  HomeAnnouncement,
  HomeCategoryColumn,
  LectureItem,
  MeetingDocumentItem,
  MeetingRoomItem,
  MeetingRoomSettings,
  MeetingVote,
  MilitaryProfile,
  PageView,
  QuickActionCard,
  RoleDefinition,
  SectionType,
  SiteConfig,
  UncleHoQuote,
  UncleHoSettings,
  User,
  UserRole,
} from './types';
import {
  defaultArticles,
  defaultDocuments,
  defaultLectures,
  defaultMeetingDocuments,
  defaultMeetingRooms,
  defaultMeetingSettings,
  defaultMilitaryProfiles,
  defaultRoles,
  defaultSiteConfig,
  defaultUncleHoQuotes,
  defaultUncleHoSettings,
  defaultUsers,
} from './data/initialData';
import { cloudStorage, isSupabaseConfigured, safeStore } from './utils/storage';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';

// Components
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { NewsTicker } from './components/NewsTicker';
import { HomeView } from './components/HomeView';
import { SectionView } from './components/SectionView';
import { ArticleDetailView } from './components/ArticleDetailView';
import { DocumentArchiveView } from './components/DocumentArchiveView';
import { LectureLibraryView } from './components/LectureLibraryView';
import { PartyMeetingRoom } from './components/PartyMeetingRoom';
import { ApprovalsView } from './components/ApprovalsView';
import { UserManagementView } from './components/UserManagementView';
import { Footer } from './components/Footer';

// Modals
import { AuthModal } from './components/modals/AuthModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { CustomizerModal } from './components/modals/CustomizerModal';
import { PostArticleModal } from './components/modals/PostArticleModal';
import { AddDocModal } from './components/modals/AddDocModal';
import { AddLectureModal } from './components/modals/AddLectureModal';
import { UncleHoManagerModal } from './components/modals/UncleHoManagerModal';
import { HomeAnnouncementManagerModal } from './components/modals/HomeAnnouncementManagerModal';
import { TabIntroManagerModal } from './components/modals/TabIntroManagerModal';
import { QuickActionManagerModal } from './components/modals/QuickActionManagerModal';
import { AccessDeniedModal } from './components/modals/AccessDeniedModal';
import { LayoutManagerModal } from './components/modals/LayoutManagerModal';

// Home Widgets for 3-Column Layout
import { UncleHoDailySection } from './components/UncleHoDailySection';
import { HomeAnnouncementsWidget } from './components/HomeAnnouncementsWidget';
import { HomeLatestNewsWidget } from './components/HomeLatestNewsWidget';
import { HomeQuickActionsWidget } from './components/HomeQuickActionsWidget';

export function App() {
  // State initialization with localStorage persistence
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() =>
    safeStore.get('mangyang_site_config', defaultSiteConfig)
  );

  const [users, setUsers] = useState<User[]>(() =>
    safeStore.get('mangyang_users', defaultUsers)
  );

  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    safeStore.get('mangyang_current_user', null)
  );

  const [articles, setArticles] = useState<Article[]>([]);

  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  const [lectures, setLectures] = useState<LectureItem[]>([]);

  const [uncleHoQuotes, setUncleHoQuotes] = useState<UncleHoQuote[]>([]);

  const [uncleHoSettings, setUncleHoSettings] = useState<UncleHoSettings>(() =>
    safeStore.get('mangyang_uncle_ho_settings', defaultUncleHoSettings)
  );

  const [meetingDocuments, setMeetingDocuments] = useState<MeetingDocumentItem[]>([]);

  const [meetingSettings, setMeetingSettings] = useState<MeetingRoomSettings>(() =>
    safeStore.get('mangyang_meeting_settings', defaultMeetingSettings)
  );

  const [meetingVotes, setMeetingVotes] = useState<Record<number, MeetingVote>>(() =>
    safeStore.get('mangyang_meeting_votes', {})
  );

  const [meetingRooms, setMeetingRooms] = useState<MeetingRoomItem[]>([]);

  const [roles, setRoles] = useState<RoleDefinition[]>(() =>
    safeStore.get('mangyang_custom_roles', defaultRoles)
  );

  const [militaryProfiles, setMilitaryProfiles] = useState<MilitaryProfile[]>(() =>
    safeStore.get('mangyang_military_profiles', defaultMilitaryProfiles)
  );

  // Navigation State
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const [previousPage, setPreviousPage] = useState<PageView>('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Modals state
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; tab: 'login' | 'register' }>({
    isOpen: false,
    tab: 'login',
  });
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [customizerModalOpen, setCustomizerModalOpen] = useState(false);
  const [uncleHoManagerOpen, setUncleHoManagerOpen] = useState(false);
  const [announcementManagerOpen, setAnnouncementManagerOpen] = useState(false);
  const [isQuickActionModalOpen, setIsQuickActionModalOpen] = useState(false);
  const [tabIntroModal, setTabIntroModal] = useState<{
    isOpen: boolean;
    tabKey: string;
  }>({
    isOpen: false,
    tabKey: 'doc',
  });
  const [postModal, setPostModal] = useState<{
    isOpen: boolean;
    section: SectionType;
    articleToEdit: Article | null;
  }>({
    isOpen: false,
    section: 'ctd',
    articleToEdit: null,
  });
  const [addDocModalOpen, setAddDocModalOpen] = useState(false);
  const [lectureModal, setLectureModal] = useState<{
    isOpen: boolean;
    lectureToEdit: LectureItem | null;
  }>({
    isOpen: false,
    lectureToEdit: null,
  });
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [accessDeniedModal, setAccessDeniedModal] = useState<{
    isOpen: boolean;
    title?: string;
    message?: string;
    requiredRole?: string;
  }>({
    isOpen: false,
  });

  // Global Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: ToastType, title: string, message?: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Global sync and loading state
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Initial Database-First fetch & Realtime subscription
  useEffect(() => {
    let isMounted = true;
    setIsLoadingData(true);

    // 1. Tải dữ liệu bài viết trực tiếp từ Supabase
    cloudStorage
      .loadArticles([])
      .then((data) => {
        if (isMounted) {
          setArticles(data || []);
        }
      })
      .catch((err) => {
        console.warn('[App] Error loading articles:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingData(false);
      });

    // 2. Tải các cấu hình và dữ liệu khác độc lập
    cloudStorage.loadSiteConfig(defaultSiteConfig).then((data) => {
      if (isMounted && data) setSiteConfig(data);
    }).catch(console.warn);

    cloudStorage.loadUsers(defaultUsers).then((data) => {
      if (isMounted && data && data.length > 0) setUsers(data);
    }).catch(console.warn);

    cloudStorage.loadDocuments([]).then((data) => {
      if (isMounted && data) setDocuments(data);
    }).catch(console.warn);

    cloudStorage.loadLectures([]).then((data) => {
      if (isMounted && data) setLectures(data);
    }).catch(console.warn);

    cloudStorage.loadUncleHoQuotes([]).then((data) => {
      if (isMounted && data) setUncleHoQuotes(data);
    }).catch(console.warn);

    cloudStorage.loadUncleHoSettings(defaultUncleHoSettings).then((data) => {
      if (isMounted && data) setUncleHoSettings(data);
    }).catch(console.warn);

    cloudStorage.loadMeetingRooms([]).then((data) => {
      if (isMounted && data) setMeetingRooms(data);
    }).catch(console.warn);

    cloudStorage.loadMeetingDocuments([]).then((data) => {
      if (isMounted && data) setMeetingDocuments(data);
    }).catch(console.warn);

    cloudStorage.loadMeetingSettings(defaultMeetingSettings).then((data) => {
      if (isMounted && data) setMeetingSettings(data);
    }).catch(console.warn);

    cloudStorage.loadMeetingVotes({}).then((data) => {
      if (isMounted && data) setMeetingVotes(data);
    }).catch(console.warn);

    // 3. Realtime Database-First subscription (Supabase postgres_changes)
    const unsub = cloudStorage.subscribeAll({
      onArticlesChange: (freshArticles) => {
        if (isMounted && freshArticles) {
          setArticles(freshArticles);
        }
      },
      onArticleInsert: (newArt) => {
        if (isMounted && newArt) {
          setArticles((prev) => {
            const next = [newArt, ...prev.filter((a) => String(a.id) !== String(newArt.id))];
            return next;
          });
        }
      },
      onArticleUpdate: (updatedArt) => {
        if (isMounted && updatedArt) {
          setArticles((prev) => {
            const next = prev.map((a) => (String(a.id) === String(updatedArt.id) ? updatedArt : a));
            return next;
          });
        }
      },
      onArticleDelete: (deletedId) => {
        if (isMounted && deletedId) {
          setArticles((prev) => {
            const next = prev.filter((a) => String(a.id) !== String(deletedId));
            return next;
          });
        }
      },
      onDocumentsChange: (freshDocs) => {
        if (isMounted && freshDocs) {
          setDocuments(freshDocs);
        }
      },
      onLecturesChange: (freshLectures) => {
        if (isMounted && freshLectures) {
          setLectures(freshLectures);
        }
      },
      onMeetingRoomsChange: (freshRooms) => {
        if (isMounted && freshRooms) {
          setMeetingRooms(freshRooms);
        }
      },
      onMeetingDocumentsChange: (freshMeetingDocs) => {
        if (isMounted && freshMeetingDocs) {
          setMeetingDocuments(freshMeetingDocs);
        }
      },
      onMeetingSettingsChange: (freshSettings) => {
        if (isMounted && freshSettings) {
          setMeetingSettings(freshSettings);
        }
      },
      onSiteConfigChange: (freshConfig) => {
        if (isMounted && freshConfig) {
          setSiteConfig(freshConfig);
        }
      },
      onUsersChange: (freshUsers) => {
        if (isMounted && freshUsers && freshUsers.length > 0) {
          setUsers(freshUsers);
        }
      },
    });

    return () => {
      isMounted = false;
      if (unsub) unsub();
    };
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    safeStore.set('mangyang_site_config', siteConfig);
  }, [siteConfig]);

  useEffect(() => {
    safeStore.set('mangyang_users', users);
  }, [users]);

  useEffect(() => {
    safeStore.set('mangyang_current_user', currentUser);
  }, [currentUser]);

  useEffect(() => {
    safeStore.set('mangyang_uncle_ho_quotes', uncleHoQuotes);
  }, [uncleHoQuotes]);

  useEffect(() => {
    safeStore.set('mangyang_uncle_ho_settings', uncleHoSettings);
  }, [uncleHoSettings]);

  useEffect(() => {
    safeStore.set('mangyang_articles', articles);
  }, [articles]);

  useEffect(() => {
    safeStore.set('mangyang_documents', documents);
  }, [documents]);

  useEffect(() => {
    safeStore.set('mangyang_lectures', lectures);
  }, [lectures]);

  useEffect(() => {
    safeStore.set('mangyang_meeting_docs', meetingDocuments);
  }, [meetingDocuments]);

  useEffect(() => {
    safeStore.set('mangyang_meeting_settings', meetingSettings);
  }, [meetingSettings]);

  useEffect(() => {
    safeStore.set('mangyang_meeting_votes', meetingVotes);
  }, [meetingVotes]);

  useEffect(() => {
    safeStore.set('mangyang_custom_roles', roles);
  }, [roles]);

  useEffect(() => {
    safeStore.set('mangyang_military_profiles', militaryProfiles);
  }, [militaryProfiles]);

  // Real-time activity timer: Increment active minutes for current logged-in user every minute
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(
        now.getMonth() + 1
      ).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      // Update current user
      setCurrentUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          totalActiveMinutes: (prev.totalActiveMinutes || 0) + 1,
          lastActiveAt: timeStr,
          isOnline: true,
        };
      });

      // Update users list
      setUsers((prev) =>
        prev.map((u) =>
          u.id === currentUser.id
            ? {
                ...u,
                totalActiveMinutes: (u.totalActiveMinutes || 0) + 1,
                lastActiveAt: timeStr,
                isOnline: true,
              }
            : u
        )
      );

      // Update linked military profile
      setMilitaryProfiles((prev) =>
        prev.map((p) =>
          p.userId === currentUser.id || p.username?.toLowerCase() === currentUser.username.toLowerCase()
            ? {
                ...p,
                totalActiveMinutes: (p.totalActiveMinutes || 0) + 1,
                lastActiveAt: timeStr,
                isOnline: true,
              }
            : p
        )
      );
    }, 60000); // every 60 seconds

    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.username]);

  // Derived Values
  const pendingDraftsCount = articles.filter((a) => a.status === 'pending').length;

  // Navigation Handlers
  const handleSelectPage = (page: PageView) => {
    // Access Control Guards
    if (page === 'meeting' && !currentUser?.canJoinPartyMeeting && currentUser?.role !== 'admin') {
      setAccessDeniedModal({
        isOpen: true,
        title: 'BẠN CHƯA CÓ QUYỀN TRUY CẬP PHÒNG HỌP ĐẢNG ỦY',
        message: 'Đồng chí chưa được cấp quyền tham gia Phòng họp Đảng ủy. Vui lòng liên hệ Ban Tổ chức Đảng ủy hoặc Quản trị viên để được phân quyền!',
        requiredRole: 'Đảng viên / Đại biểu chỉ định hoặc Quản trị viên',
      });
      return;
    }
    if (page === 'doc' && !currentUser?.canViewDoc && currentUser?.role !== 'admin') {
      setAccessDeniedModal({
        isOpen: true,
        title: 'BẠN CHƯA CÓ QUYỀN TRUY CẬP KHO VĂN BẢN QUÂN SỰ',
        message: 'Khu vực lưu trữ văn kiện, chỉ thị mật nội bộ đơn vị. Đồng chí chưa được cấp quyền xem tài liệu. Vui lòng liên hệ Ban Biên tập để được cấp quyền!',
        requiredRole: 'Cán bộ được cấp quyền hoặc Quản trị viên',
      });
      return;
    }
    if ((page === 'approvals' || page === 'users') && currentUser?.role !== 'admin') {
      setAccessDeniedModal({
        isOpen: true,
        title: 'BẠN CHƯA CÓ QUYỀN TRUY CẬP KHU VỰC QUẢN TRỊ NÀY',
        message: 'Khu vực phê duyệt tin bài và quản trị tài khoản quân nhân chỉ dành riêng cho Quản trị viên (Admin - Ban Biên tập Sư đoàn 10)!',
        requiredRole: 'Quản trị viên (Admin)',
      });
      return;
    }

    if (currentPage !== 'article_detail' && currentPage !== 'article-detail') {
      setPreviousPage(currentPage);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenArticle = (article: Article) => {
    // Increment view count
    const updatedViews = (article.views || 0) + 1;
    const updatedArticle = { ...article, views: updatedViews };

    setArticles((prev) =>
      prev.map((a) => (String(a.id) === String(article.id) ? updatedArticle : a))
    );
    cloudStorage.saveArticle(updatedArticle);

    if (currentPage !== 'article_detail' && currentPage !== 'article-detail') {
      setPreviousPage(currentPage);
    }
    setSelectedArticle(updatedArticle);
    setCurrentPage('article_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth Handlers
  const handleLogin = (username: string, pass: string): boolean => {
    const user = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === pass
    );
    if (user) {
      const now = new Date();
      const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(
        now.getMonth() + 1
      ).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      const updatedUser: User = {
        ...user,
        isOnline: true,
        sessionCount: (user.sessionCount || 0) + 1,
        lastActiveAt: timeStr,
      };

      setCurrentUser(updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
      cloudStorage.saveUser(updatedUser);

      // Also update linked military profile
      setMilitaryProfiles((prev) =>
        prev.map((p) =>
          p.userId === user.id || p.username?.toLowerCase() === username.toLowerCase()
            ? {
                ...p,
                isOnline: true,
                sessionCount: (p.sessionCount || 0) + 1,
                lastActiveAt: timeStr,
                userId: user.id,
                username: user.username,
              }
            : p
        )
      );

      return true;
    }
    return false;
  };

  const handleRegister = (data: {
    username: string;
    password: string;
    fullName: string;
    birthDate?: string;
    rank?: string;
    position?: string;
    rankUnit?: string;
  }): boolean => {
    const exists = users.some((u) => u.username.toLowerCase() === data.username.toLowerCase());
    if (exists) return false;

    const rankUnitStr =
      data.rankUnit ||
      (data.rank && data.position ? `${data.rank} - ${data.position}` : data.rank || data.position || 'Chiến sĩ');

    const newUser: User = {
      id: Date.now(),
      fullName: data.fullName,
      birthDate: data.birthDate || '',
      rank: data.rank || '',
      position: data.position || '',
      rankUnit: rankUnitStr,
      username: data.username,
      password: data.password,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      totalActiveMinutes: 0,
      sessionCount: 0,
      isOnline: false,
      canViewDoc: false,
      canUploadDoc: false,
      canJoinPartyMeeting: false,
      canUploadMeetingDoc: false,
      canDeleteMeetingDoc: false,
      canViewCollaborativeEdits: false,
      role: 'user',
    };

    setUsers((prev) => [...prev, newUser]);
    cloudStorage.saveUser(newUser);

    // If there is an unlinked soldier profile with matching name or username, link it automatically
    setMilitaryProfiles((prev) =>
      prev.map((p) => {
        if (!p.userId && p.fullName.trim().toLowerCase() === data.fullName.trim().toLowerCase()) {
          return {
            ...p,
            userId: newUser.id,
            username: newUser.username,
          };
        }
        return p;
      })
    );

    return true;
  };

  const handleLogout = () => {
    if (currentUser) {
      const now = new Date();
      const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(
        now.getMonth() + 1
      ).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === currentUser.id ? { ...u, isOnline: false, lastActiveAt: timeStr } : u
        )
      );

      setMilitaryProfiles((prev) =>
        prev.map((p) =>
          p.userId === currentUser.id || p.username?.toLowerCase() === currentUser.username.toLowerCase()
            ? { ...p, isOnline: false, lastActiveAt: timeStr }
            : p
        )
      );
    }

    setCurrentUser(null);
    if (currentPage === 'meeting' || currentPage === 'approvals' || currentPage === 'users') {
      setCurrentPage('home');
    }
  };

  const handleSaveProfile = (updated: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updated };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    cloudStorage.saveUser(updatedUser);

    // Sync to linked military profile
    setMilitaryProfiles((prev) =>
      prev.map((p) => {
        if (p.userId === currentUser.id || p.username?.toLowerCase() === currentUser.username.toLowerCase()) {
          return {
            ...p,
            fullName: updatedUser.fullName,
            rank: updatedUser.rank || p.rank,
            position: updatedUser.position || p.position,
            birthDate: updatedUser.birthDate || p.birthDate,
            avatar: updatedUser.avatar || p.avatar,
          };
        }
        return p;
      })
    );
  };

  // Military Profiles Handlers
  const handleSaveSoldierProfile = (
    profile: MilitaryProfile,
    syncUser?: { createAccount?: boolean; selectedUserId?: number | null }
  ) => {
    let targetUserId = profile.userId;
    let targetUsername = profile.username;

    // Option 1: Auto create new user account
    if (syncUser?.createAccount) {
      const newUserId = Date.now();
      const baseUsername = profile.militaryCode.toLowerCase().replace(/[^a-z0-9]/g, '') || `user_${newUserId}`;
      const newUser: User = {
        id: newUserId,
        username: baseUsername,
        password: '123456',
        fullName: profile.fullName,
        birthDate: profile.birthDate || '',
        rank: profile.rank,
        position: profile.position,
        rankUnit: `${profile.rank} - ${profile.unit}`,
        militaryCode: profile.militaryCode,
        avatar: profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        role: 'user',
        totalActiveMinutes: profile.totalActiveMinutes || 0,
        sessionCount: profile.sessionCount || 0,
        isOnline: false,
        canViewDoc: true,
        canUploadDoc: false,
        canJoinPartyMeeting: false,
        canUploadMeetingDoc: false,
        canDeleteMeetingDoc: false,
        canViewCollaborativeEdits: false,
      };

      setUsers((prev) => [newUser, ...prev]);
      cloudStorage.saveUser(newUser);
      targetUserId = newUserId;
      targetUsername = baseUsername;
    } else if (syncUser?.selectedUserId !== undefined) {
      // Option 2: Link to existing user or unlink
      targetUserId = syncUser.selectedUserId;
      const linked = users.find((u) => u.id === targetUserId);
      targetUsername = linked ? linked.username : undefined;
    }

    const updatedProfile: MilitaryProfile = {
      ...profile,
      userId: targetUserId,
      username: targetUsername,
    };

    setMilitaryProfiles((prev) => {
      const idx = prev.findIndex((p) => p.id === profile.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedProfile;
        return copy;
      }
      return [updatedProfile, ...prev];
    });

    // If profile is linked to a user, sync user's info directly
    if (targetUserId) {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === targetUserId) {
            const updatedUser: User = {
              ...u,
              fullName: profile.fullName,
              rank: profile.rank,
              position: profile.position,
              rankUnit: `${profile.rank} - ${profile.unit}`,
              militaryCode: profile.militaryCode,
              birthDate: profile.birthDate || u.birthDate,
              avatar: profile.avatar || u.avatar,
            };
            cloudStorage.saveUser(updatedUser);
            if (currentUser && currentUser.id === u.id) {
              setCurrentUser(updatedUser);
            }
            return updatedUser;
          }
          return u;
        })
      );
    }
  };

  const handleDeleteSoldierProfile = (profileId: number) => {
    const target = militaryProfiles.find((p) => p.id === profileId);
    setMilitaryProfiles((prev) => prev.filter((p) => p.id !== profileId));
    if (target?.userId) {
      setUsers((prev) =>
        prev.map((u) => (u.id === target.userId ? { ...u, militaryCode: undefined } : u))
      );
    }
  };

  const handleImportSoldiersExcel = (
    importedProfiles: MilitaryProfile[],
    options: {
      autoCreateAccounts: boolean;
      defaultPassword: string;
      defaultRole: string;
      overwriteExisting: boolean;
    }
  ) => {
    let newUsersToAdd: User[] = [];

    const finalProfiles = [...militaryProfiles];

    importedProfiles.forEach((newP) => {
      let createdUserId: number | null = null;
      let createdUsername: string | undefined = undefined;

      if (options.autoCreateAccounts) {
        const userId = Date.now() + Math.floor(Math.random() * 100000);
        createdUsername = newP.militaryCode.toLowerCase().replace(/[^a-z0-9]/g, '') || `qn_${userId}`;
        const newUser: User = {
          id: userId,
          username: createdUsername,
          password: options.defaultPassword || '123456',
          fullName: newP.fullName,
          birthDate: newP.birthDate || '',
          rank: newP.rank,
          position: newP.position,
          rankUnit: `${newP.rank} - ${newP.unit}`,
          militaryCode: newP.militaryCode,
          avatar: newP.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          role: options.defaultRole || 'user',
          totalActiveMinutes: 0,
          sessionCount: 0,
          isOnline: false,
          canViewDoc: true,
          canUploadDoc: false,
          canJoinPartyMeeting: false,
          canUploadMeetingDoc: false,
          canDeleteMeetingDoc: false,
          canViewCollaborativeEdits: false,
        };
        newUsersToAdd.push(newUser);
        createdUserId = userId;
      }

      const preparedProfile: MilitaryProfile = {
        ...newP,
        userId: createdUserId,
        username: createdUsername,
      };

      const existingIdx = finalProfiles.findIndex(
        (p) => p.militaryCode.toLowerCase() === newP.militaryCode.toLowerCase()
      );

      if (existingIdx >= 0 && options.overwriteExisting) {
        finalProfiles[existingIdx] = {
          ...finalProfiles[existingIdx],
          ...preparedProfile,
          id: finalProfiles[existingIdx].id,
        };
      } else if (existingIdx < 0) {
        finalProfiles.push(preparedProfile);
      }
    });

    setMilitaryProfiles(finalProfiles);

    if (newUsersToAdd.length > 0) {
      setUsers((prev) => [...newUsersToAdd, ...prev]);
      newUsersToAdd.forEach((u) => cloudStorage.saveUser(u));
    }
  };

  const handleBatchCreateAccounts = (
    newUsersList: Array<{
      username: string;
      password?: string;
      fullName: string;
      rankUnit: string;
      role: string;
      militaryCode: string;
      profileId: number;
    }>
  ) => {
    const createdUsers: User[] = [];
    const profileIdToUserIdMap = new Map<number, { userId: number; username: string }>();

    newUsersList.forEach((acc) => {
      const newUserId = Date.now() + Math.floor(Math.random() * 1000000);
      const roleDef = roles.find((r) => r.id === acc.role);
      const defaultPerms = roleDef?.defaultPermissions || {
        canViewDoc: true,
        canUploadDoc: false,
        canJoinPartyMeeting: false,
        canUploadMeetingDoc: false,
        canDeleteMeetingDoc: false,
        canViewCollaborativeEdits: false,
      };

      const newUser: User = {
        id: newUserId,
        username: acc.username,
        password: acc.password || '123456',
        fullName: acc.fullName,
        rankUnit: acc.rankUnit,
        militaryCode: acc.militaryCode,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        role: acc.role,
        totalActiveMinutes: 0,
        sessionCount: 0,
        isOnline: false,
        ...defaultPerms,
      };

      createdUsers.push(newUser);
      profileIdToUserIdMap.set(acc.profileId, { userId: newUserId, username: acc.username });
    });

    setUsers((prev) => [...createdUsers, ...prev]);
    createdUsers.forEach((u) => cloudStorage.saveUser(u));

    setMilitaryProfiles((prev) =>
      prev.map((p) => {
        if (profileIdToUserIdMap.has(p.id)) {
          const mapping = profileIdToUserIdMap.get(p.id)!;
          return {
            ...p,
            userId: mapping.userId,
            username: mapping.username,
          };
        }
        return p;
      })
    );
  };

  // User Management & RBAC Handlers
  const handleTogglePermission = async (
    userId: number,
    field:
      | 'canViewDoc'
      | 'canUploadDoc'
      | 'canJoinPartyMeeting'
      | 'canCreateMeeting'
      | 'canUploadMeetingDoc'
      | 'canDeleteMeetingDoc'
      | 'canViewCollaborativeEdits',
    checked: boolean
  ) => {
    let targetUser: User | null = null;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, [field]: checked };
          targetUser = updated;
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    if (targetUser) {
      const res = await cloudStorage.saveUser(targetUser);
      if (!res.success) {
        showToast('error', 'Lỗi lưu phân quyền', res.error);
      }
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    const res = await cloudStorage.saveUser(updatedUser);
    if (res.success) {
      showToast('success', 'Đã cập nhật hồ sơ quân nhân', `Thông tin đồng chí ${updatedUser.fullName} đã được lưu vào Cơ sở dữ liệu.`);
    } else {
      showToast('error', 'Lỗi lưu thông tin quân nhân', res.error);
    }
  };

  const handleChangeUserRole = async (userId: number, newRole: UserRole) => {
    let targetUser: User | null = null;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated: User = {
            ...u,
            role: newRole,
            // When promoted to admin, automatically grant all functional privileges
            ...(newRole === 'admin'
              ? {
                  canViewDoc: true,
                  canUploadDoc: true,
                  canJoinPartyMeeting: true,
                  canUploadMeetingDoc: true,
                  canDeleteMeetingDoc: true,
                  canViewCollaborativeEdits: true,
                }
              : {}),
          };
          targetUser = updated;
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    if (targetUser) {
      const res = await cloudStorage.saveUser(targetUser);
      if (res.success) {
        showToast('success', 'Đã cập nhật vai trò', `Phân quyền người dùng đã được cập nhật thành công.`);
      } else {
        showToast('error', 'Lỗi cập nhật vai trò', res.error);
      }
    }
  };

  const handleChangeUserPassword = async (userId: number, newPass: string) => {
    let targetUser: User | null = null;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, password: newPass };
          targetUser = updated;
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    if (targetUser) {
      const res = await cloudStorage.saveUser(targetUser);
      if (res.success) {
        showToast('success', 'Đã đổi mật khẩu', 'Mật khẩu tài khoản đã được cập nhật.');
      } else {
        showToast('error', 'Lỗi đổi mật khẩu', res.error);
      }
    }
  };

  const handleCreateUser = async (newUser: User) => {
    setUsers((prev) => [newUser, ...prev]);
    const res = await cloudStorage.saveUser(newUser);
    if (res.success) {
      showToast('success', 'Đã tạo tài khoản quân nhân mới', `Tài khoản ${newUser.username} (${newUser.fullName}) đã sẵn sàng hoạt động.`);
    } else {
      showToast('error', 'Lỗi tạo tài khoản', res.error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm('Đồng chí có chắc chắn muốn xóa tài khoản quân nhân này khỏi hệ thống?')) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      // Remove votes if any
      setMeetingVotes((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      const res = await cloudStorage.deleteUser(userId);
      if (res.success) {
        showToast('info', 'Đã xóa tài khoản', 'Tài khoản quân nhân đã được xóa khỏi Cơ sở dữ liệu.');
      } else {
        showToast('error', 'Lỗi xóa tài khoản', res.error);
      }
    }
  };

  // Role Management Handlers
  const handleSaveRole = (savedRole: RoleDefinition) => {
    setRoles((prev) => {
      const existingIdx = prev.findIndex((r) => r.id === savedRole.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = savedRole;
        return copy;
      }
      return [...prev, savedRole];
    });
  };

  const handleDeleteRole = (roleId: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
    setUsers((prev) =>
      prev.map((u) => (u.role === roleId ? { ...u, role: 'user' } : u))
    );
  };

  // Article Actions
  const handleOpenPostModal = (section: SectionType = 'ctd') => {
    setPostModal({
      isOpen: true,
      section,
      articleToEdit: null,
    });
  };

  const handleOpenEditArticleModal = (article: Article) => {
    setPostModal({
      isOpen: true,
      section: article.sectionKey,
      articleToEdit: article,
    });
  };

  const handlePostArticle = async (data: {
    title: string;
    category: string;
    author: string;
    image: string;
    images?: import('./types').ArticleImage[];
    excerpt: string;
    content: string;
    embedCode?: string;
    sectionKey: SectionType;
    status?: 'approved' | 'pending';
  }): Promise<boolean> => {
    try {
      const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'commander' || currentUser?.role === 'editor';
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(
        now.getMonth() + 1
      ).padStart(2, '0')}/${now.getFullYear()}`;

      const newArt: Article = {
        id: Date.now(),
        title: data.title.trim(),
        category: data.category || 'Tin tức hoạt động',
        author: data.author.trim() || (currentUser ? `${currentUser.fullName} (${currentUser.rankUnit || currentUser.rank || 'Đơn vị'})` : 'Cán bộ - Chiến sĩ'),
        date: dateStr,
        image: data.image || '',
        images: data.images && data.images.length > 0 ? data.images : undefined,
        excerpt: data.excerpt.trim(),
        content: data.content.trim(),
        embedCode: data.embedCode?.trim() || undefined,
        status: data.status || 'approved',
        views: 1,
        sectionKey: data.sectionKey || 'ctd',
      };

      // Immediately update local state so the UI reflects the post instantly
      setArticles((prev) => [newArt, ...prev.filter((a) => String(a.id) !== String(newArt.id))]);

      // Save to Cloud Firestore & Supabase & Local persistent cache
      const res = await cloudStorage.saveArticle(newArt);

      if (res.success) {
        // Background refresh to guarantee sync across database
        cloudStorage.loadArticles(defaultArticles).then((fresh) => {
          if (fresh && fresh.length > 0) setArticles(fresh);
        });

        if (newArt.status === 'approved') {
          showToast(
            'success',
            'Xuất bản tin bài thành công!',
            'Bài viết đã được lưu trực tiếp vào Cơ sở dữ liệu và hiển thị trực tuyến.'
          );
        } else {
          showToast(
            'info',
            'Đã gửi dự thảo tin bài',
            'Dự thảo đã được lưu vào hệ thống và chuyển đến Ban Biên tập để chờ phê duyệt.'
          );
        }
        return true;
      } else {
        console.error('cloudStorage.saveArticle error:', res.error);
        showToast(
          'error',
          'Lỗi lưu bài viết vào Cơ sở dữ liệu',
          res.error || 'Vui lòng kiểm tra lại kết nối mạng hoặc liên hệ quản trị viên.'
        );
        return false;
      }
    } catch (err: any) {
      console.error('Unhandled error in handlePostArticle:', err);
      showToast(
        'error',
        'Có lỗi xảy ra khi tạo bài viết',
        err?.message || 'Không thể hoàn tất việc đăng bài. Vui lòng kiểm tra lại thông tin.'
      );
      return false;
    }
  };

  const handleUpdateArticle = async (updated: Article): Promise<boolean> => {
    setArticles((prev) => prev.map((a) => (String(a.id) === String(updated.id) ? updated : a)));

    if (selectedArticle && String(selectedArticle.id) === String(updated.id)) {
      setSelectedArticle(updated);
    }

    const res = await cloudStorage.saveArticle(updated);
    if (res.success) {
      showToast(
        'success',
        'Cập nhật bài viết thành công!',
        'Nội dung và hình ảnh bài viết đã được cập nhật trực tiếp lên Cơ sở dữ liệu.'
      );
      return true;
    } else {
      showToast(
        'error',
        'Lỗi cập nhật bài viết',
        res.error || 'Không thể lưu thay đổi lên Cơ sở dữ liệu. Vui lòng thử lại.'
      );
      return false;
    }
  };

  const handleApproveArticle = async (articleId: number) => {
    let updatedArticle: Article | null = null;
    setArticles((prev) =>
      prev.map((a) => {
        if (String(a.id) === String(articleId)) {
          updatedArticle = { ...a, status: 'approved' as const };
          return updatedArticle;
        }
        return a;
      })
    );

    if (updatedArticle) {
      const res = await cloudStorage.saveArticle(updatedArticle);
      if (res.success) {
        showToast(
          'success',
          'Phê duyệt tin bài thành công!',
          'Bài viết đã được xuất bản công khai cho toàn thể cán bộ, chiến sĩ theo dõi.'
        );
      } else {
        showToast('error', 'Lỗi phê duyệt bài viết', res.error);
      }
    }
  };

  const handleRejectArticle = async (articleId: number) => {
    if (confirm('Từ chối và gỡ bỏ dự thảo bài viết này khỏi hệ thống?')) {
      setArticles((prev) => prev.filter((a) => String(a.id) !== String(articleId)));
      const res = await cloudStorage.deleteArticle(articleId);
      if (res.success) {
        showToast('info', 'Đã từ chối dự thảo', 'Dự thảo tin bài đã được xóa khỏi danh sách chờ duyệt.');
      } else {
        showToast('error', 'Lỗi gỡ bỏ dự thảo', res.error);
      }
    }
  };

  const handleDeleteArticle = async (articleId: number): Promise<boolean> => {
    if (confirm('Đồng chí có chắc chắn muốn xóa bài viết này vĩnh viễn?')) {
      setArticles((prev) => prev.filter((a) => String(a.id) !== String(articleId)));
      if (selectedArticle && String(selectedArticle.id) === String(articleId)) {
        setCurrentPage('home');
      }
      const res = await cloudStorage.deleteArticle(articleId);
      if (res.success) {
        showToast(
          'success',
          'Đã xóa bài viết thành công',
          'Bài viết đã được gỡ bỏ hoàn toàn khỏi Cơ sở dữ liệu.'
        );
        return true;
      } else {
        showToast('error', 'Lỗi xóa bài viết', res.error);
        return false;
      }
    }
    return false;
  };

  // Document Actions
  const handleAddDoc = async (doc: Omit<DocumentItem, 'id'>) => {
    const newDoc: DocumentItem = {
      id: Date.now(),
      ...doc,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    const res = await cloudStorage.saveDocument(newDoc);
    if (res.success) {
      showToast(
        'success',
        'Đã lưu văn bản vào Kho lưu trữ!',
        `Văn bản [${newDoc.code}] "${newDoc.title}" đã được lưu trữ vĩnh viễn vào Cơ sở dữ liệu.`
      );
    } else {
      showToast('error', 'Lỗi lưu văn bản', res.error || 'Vui lòng kiểm tra lại kết nối mạng.');
    }
  };

  const handleDeleteDoc = async (id: number) => {
    if (confirm('Đồng chí có chắc chắn muốn xóa văn bản này khỏi kho lưu trữ?')) {
      const targetDoc = documents.find((d) => d.id === id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      const res = await cloudStorage.deleteDocument(id);
      if (res.success) {
        showToast('info', 'Đã xóa văn bản', `Đã xóa văn bản [${targetDoc?.code || id}] khỏi hệ thống.`);
      } else {
        showToast('error', 'Lỗi xóa văn bản', res.error);
      }
    }
  };

  const handleUpdateDoc = async (updated: DocumentItem) => {
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    const res = await cloudStorage.saveDocument(updated);
    if (res.success) {
      showToast('success', 'Đã cập nhật văn bản', `Thông tin văn bản [${updated.code}] đã được lưu thay đổi.`);
    } else {
      showToast('error', 'Lỗi cập nhật văn bản', res.error);
    }
  };

  // Lecture Actions
  const handleOpenAddLectureModal = () => {
    setLectureModal({
      isOpen: true,
      lectureToEdit: null,
    });
  };

  const handleOpenEditLectureModal = (lecture: LectureItem) => {
    setLectureModal({
      isOpen: true,
      lectureToEdit: lecture,
    });
  };

  const handleAddLecture = async (lecture: Omit<LectureItem, 'id'>) => {
    const newLec: LectureItem = {
      id: Date.now(),
      ...lecture,
    };
    setLectures((prev) => [newLec, ...prev]);
    const res = await cloudStorage.saveLecture(newLec);
    if (res.success) {
      showToast(
        'success',
        'Đã thêm bài giảng điện tử!',
        `Bài giảng "${newLec.title}" đã được lưu trữ vào Thư viện giáo án số.`
      );
    } else {
      showToast('error', 'Lỗi lưu bài giảng', res.error || 'Vui lòng kiểm tra lại kết nối.');
    }
  };

  const handleDeleteLecture = async (id: number) => {
    if (confirm('Đồng chí có chắc chắn muốn xóa bài giảng này khỏi thư viện?')) {
      const target = lectures.find((l) => l.id === id);
      setLectures((prev) => prev.filter((l) => l.id !== id));
      const res = await cloudStorage.deleteLecture(id);
      if (res.success) {
        showToast('info', 'Đã xóa bài giảng', `Đã xóa bài giảng "${target?.title || id}" khỏi thư viện.`);
      } else {
        showToast('error', 'Lỗi xóa bài giảng', res.error);
      }
    }
  };

  const handleUpdateLecture = async (updated: LectureItem) => {
    setLectures((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    const res = await cloudStorage.saveLecture(updated);
    if (res.success) {
      showToast('success', 'Đã cập nhật bài giảng', `Thông tin bài giảng "${updated.title}" đã được cập nhật.`);
    } else {
      showToast('error', 'Lỗi cập nhật bài giảng', res.error);
    }
  };

  // Home Layout Settings Handler
  const handleSaveLayoutSettings = (newLayout: import('./types').HomeLayoutSettings) => {
    const updated: SiteConfig = {
      ...siteConfig,
      layoutSettings: newLayout,
    };
    handleSaveCustomizer(updated);
    showToast(
      'success',
      'Đã lưu bố cục Trang chủ',
      'Cấu hình bố cục hiển thị đã được đồng bộ lên Cơ sở dữ liệu và áp dụng toàn hệ thống.'
    );
  };

  // Party Meeting Document Actions
  const handleSaveMeetingDocument = async (doc: MeetingDocumentItem) => {
    const exists = meetingDocuments.some((d) => d.id === doc.id);
    if (exists) {
      setMeetingDocuments((prev) => prev.map((d) => (d.id === doc.id ? doc : d)));
    } else {
      setMeetingDocuments((prev) => [doc, ...prev]);
    }
    const res = await cloudStorage.saveMeetingDocument(doc);
    if (res.success) {
      showToast('success', 'Đã lưu tài liệu phòng họp', `Tài liệu "${doc.title}" đã được lưu trữ vào Cơ sở dữ liệu phòng họp.`);
    } else {
      showToast('error', 'Lỗi lưu tài liệu họp', res.error);
    }
  };

  const handleDeleteMeetingDocument = async (docId: number) => {
    setMeetingDocuments((prev) => prev.filter((d) => d.id !== docId));
    const res = await cloudStorage.deleteMeetingDocument(docId);
    if (res.success) {
      showToast('info', 'Đã xóa tài liệu phòng họp', 'Tài liệu đã được gỡ bỏ khỏi Cơ sở dữ liệu.');
    } else {
      showToast('error', 'Lỗi xóa tài liệu họp', res.error);
    }
  };

  const handleSaveMeetingSettings = async (settings: MeetingRoomSettings) => {
    setMeetingSettings(settings);
    const res = await cloudStorage.saveMeetingSettings(settings);
    if (res.success) {
      showToast('success', 'Đã cập nhật cấu hình phòng họp', 'Thiết lập mật khẩu và thông tin kỳ họp đã được đồng bộ lên Cơ sở dữ liệu.');
    } else {
      showToast('error', 'Lỗi lưu cấu hình phòng họp', res.error);
    }
  };

  const handleCastVote = (vote: MeetingVote) => {
    const voteKey = vote.docId ? `${vote.docId}_${vote.userId}` : `${vote.userId}`;
    setMeetingVotes((prev: any) => ({
      ...prev,
      [voteKey]: vote,
      [vote.userId]: vote,
    }));
    cloudStorage.saveMeetingVote(vote);
    showToast('success', 'Biểu quyết thành công', `Đồng chí ${vote.voterName} đã biểu quyết: [${vote.choice.toUpperCase()}].`);
  };

  const handleResetVotes = (docId?: number) => {
    if (docId !== undefined) {
      setMeetingVotes((prev) => {
        const copy: any = { ...prev };
        Object.keys(copy).forEach((k) => {
          if (copy[k]?.docId === docId) {
            delete copy[k];
          }
        });
        return copy;
      });
      showToast('info', 'Khởi tạo lại biểu quyết', 'Đã làm mới phiên biểu quyết cho văn bản này.');
    } else {
      setMeetingVotes({});
      cloudStorage.resetMeetingVotes();
      showToast('info', 'Khởi tạo lại toàn bộ', 'Đã làm mới toàn bộ kết quả biểu quyết trong kỳ họp Đảng ủy.');
    }
  };

  // Party Meeting Multi-Room Handlers
  const handleSaveMeetingRoom = async (room: MeetingRoomItem) => {
    let updatedRooms: MeetingRoomItem[] = [];
    setMeetingRooms((prev) => {
      const idx = prev.findIndex((r) => r.id === room.id);
      let updated: MeetingRoomItem[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = room;
      } else {
        if (prev.length >= 30) {
          alert('Đã đạt giới hạn tối đa 30 phòng họp đồng thời! Vui lòng kết thúc hoặc xóa bớt phòng họp cũ.');
          return prev;
        }
        updated = [room, ...prev];
      }
      updatedRooms = updated.slice(0, 30);
      safeStore.set('mangyang_meeting_rooms', updatedRooms);
      return updatedRooms;
    });

    const res = await cloudStorage.saveMeetingRoom(room, updatedRooms);
    if (res.success) {
      showToast('success', 'Đã lưu phòng họp trực tuyến', `Phòng họp "${room.title}" đã được lưu lên Cơ sở dữ liệu.`);
    } else {
      showToast('error', 'Lỗi lưu phòng họp', res.error);
    }
  };

  const handleDeleteMeetingRoom = async (roomId: string) => {
    let updatedRooms: MeetingRoomItem[] = [];
    setMeetingRooms((prev) => {
      const updated = prev.filter((r) => r.id !== roomId);
      updatedRooms = updated;
      safeStore.set('mangyang_meeting_rooms', updated);
      return updated;
    });

    const res = await cloudStorage.deleteMeetingRoom(roomId, updatedRooms);
    if (res.success) {
      showToast('info', 'Đã xóa phòng họp', 'Phòng họp đã được gỡ bỏ khỏi Cơ sở dữ liệu.');
    } else {
      showToast('error', 'Lỗi xóa phòng họp', res.error);
    }
  };

  const handleSaveMeetingRooms = (rooms: MeetingRoomItem[]) => {
    const limited = rooms.slice(0, 30);
    setMeetingRooms(limited);
    safeStore.set('mangyang_meeting_rooms', limited);
    cloudStorage.saveMeetingRooms(limited);
  };

  const handleSaveDocCategories = (newCats: string[]) => {
    const updated: SiteConfig = {
      ...siteConfig,
      sections: {
        ...siteConfig.sections,
        doc: {
          ...siteConfig.sections.doc,
          categories: newCats,
        },
      },
    };
    handleSaveCustomizer(updated);
    showToast('success', 'Đã lưu danh mục văn bản', 'Danh mục văn bản đã được lưu và đồng bộ lên Cơ sở dữ liệu.');
  };

  const handleRenameDocCategory = (oldCat: string, newCat: string) => {
    setDocuments((prev) => {
      const updated = prev.map((d) => (d.category === oldCat ? { ...d, category: newCat } : d));
      updated.forEach((d) => {
        if (d.category === newCat) {
          cloudStorage.saveDocument(d);
        }
      });
      return updated;
    });
  };

  const handleDeleteDocCategory = (catToDelete: string, fallbackCat: string) => {
    setDocuments((prev) => {
      const updated = prev.map((d) => (d.category === catToDelete ? { ...d, category: fallbackCat } : d));
      updated.forEach((d) => {
        if (d.category === fallbackCat) {
          cloudStorage.saveDocument(d);
        }
      });
      return updated;
    });
  };

  // Customizer Handler with Category Renaming Cascade
  const handleSaveCustomizer = async (
    newConfig: SiteConfig,
    categoryRenames?: { sectionKey: SectionType; oldName: string; newName: string }[]
  ) => {
    setSiteConfig(newConfig);
    try {
      await cloudStorage.saveSiteConfig(newConfig);
    } catch (e) {
      console.warn('handleSaveCustomizer caught:', e);
    }

    if (categoryRenames && categoryRenames.length > 0) {
      setArticles((prevArticles) => {
        let changed = false;
        const updatedArticles = prevArticles.map((art) => {
          const rename = categoryRenames.find(
            (r) => r.sectionKey === art.sectionKey && r.oldName === art.category
          );
          if (rename) {
            changed = true;
            const updatedArt = { ...art, category: rename.newName };
            cloudStorage.saveArticle(updatedArt);
            return updatedArt;
          }
          return art;
        });

        if (changed && selectedArticle) {
          const rename = categoryRenames.find(
            (r) =>
              r.sectionKey === selectedArticle.sectionKey &&
              r.oldName === selectedArticle.category
          );
          if (rename) {
            setSelectedArticle((prev) => (prev ? { ...prev, category: rename.newName } : null));
          }
        }

        return changed ? updatedArticles : prevArticles;
      });
    }
  };

  // Home Announcements Save Handler
  const handleSaveAnnouncements = async (updatedList: HomeAnnouncement[]) => {
    const updatedConfig: SiteConfig = {
      ...siteConfig,
      homeAnnouncements: updatedList,
    };
    setSiteConfig(updatedConfig);
    await cloudStorage.saveSiteConfig(updatedConfig);
    showToast('success', 'Đã lưu danh sách thông báo', 'Nội dung thông báo đã được lưu thành công.');
  };

  // Quick Action Cards Save Handler
  const handleSaveQuickActions = async (cards: QuickActionCard[]) => {
    const updatedConfig: SiteConfig = {
      ...siteConfig,
      quickActionCards: cards,
      homeQuickActions: cards,
    };
    setSiteConfig(updatedConfig);
    await cloudStorage.saveSiteConfig(updatedConfig);
    showToast('success', 'Đã lưu tiện ích truy cập nhanh', 'Danh sách tiện ích đã được cập nhật.');
  };

  // Spotlight Article Select Handler
  const handleSelectSpotlightArticle = async (articleId: number) => {
    const updatedConfig: SiteConfig = {
      ...siteConfig,
      spotlightArticleId: articleId,
    };
    setSiteConfig(updatedConfig);
    await cloudStorage.saveSiteConfig(updatedConfig);
  };

  // Home Category Columns Save Handler
  const handleSaveHomeCategoryColumns = async (columns: HomeCategoryColumn[]) => {
    const updatedConfig: SiteConfig = {
      ...siteConfig,
      homeCategoryColumns: columns,
    };
    setSiteConfig(updatedConfig);
    await cloudStorage.saveSiteConfig(updatedConfig);
    showToast('success', 'Đã lưu cấu hình chuyên mục', 'Cột hiển thị tin bài trang chủ đã được lưu.');
  };

  // Section Categories Handlers (CTĐ, Huấn luyện, Bác Hồ)
  const handleSaveSectionCategories = async (sectionKey: SectionType, newCats: string[]) => {
    const updatedConfig: SiteConfig = {
      ...siteConfig,
      sections: {
        ...siteConfig.sections,
        [sectionKey]: {
          ...siteConfig.sections[sectionKey],
          categories: newCats,
        },
      },
    };
    await handleSaveCustomizer(updatedConfig);
    showToast('success', 'Đã lưu danh mục chuyên mục', 'Cấu trúc danh mục mới đã được đồng bộ trực tiếp lên Cơ sở dữ liệu.');
  };

  const handleRenameSectionCategory = (sectionKey: SectionType, oldCat: string, newCat: string) => {
    setArticles((prev) => {
      const updated = prev.map((art) =>
        art.sectionKey === sectionKey && art.category === oldCat
          ? { ...art, category: newCat }
          : art
      );
      updated.forEach((art) => {
        if (art.sectionKey === sectionKey && art.category === newCat) {
          cloudStorage.saveArticle(art);
        }
      });
      return updated;
    });
  };

  const handleDeleteSectionCategory = (
    sectionKey: SectionType,
    catToDelete: string,
    fallbackCat: string
  ) => {
    setArticles((prev) => {
      const updated = prev.map((art) =>
        art.sectionKey === sectionKey && art.category === catToDelete
          ? { ...art, category: fallbackCat }
          : art
      );
      updated.forEach((art) => {
        if (art.sectionKey === sectionKey && art.category === fallbackCat) {
          cloudStorage.saveArticle(art);
        }
      });
      return updated;
    });
  };

  // Lecture Categories Handlers
  const handleSaveLectureCategories = async (newCats: string[]) => {
    const updatedConfig: SiteConfig = {
      ...siteConfig,
      sections: {
        ...siteConfig.sections,
        lecture: {
          ...siteConfig.sections.lecture,
          categories: newCats,
        },
      },
    };
    await handleSaveCustomizer(updatedConfig);
    showToast('success', 'Đã lưu danh mục bài giảng số', 'Danh mục bài giảng số đã được đồng bộ lên Cơ sở dữ liệu.');
  };

  const handleRenameLectureCategory = (oldCat: string, newCat: string) => {
    setLectures((prev) => {
      const updated = prev.map((l) => (l.category === oldCat ? { ...l, category: newCat } : l));
      updated.forEach((l) => {
        if (l.category === newCat) {
          cloudStorage.saveLecture(l);
        }
      });
      return updated;
    });
  };

  const handleDeleteLectureCategory = (catToDelete: string, fallbackCat: string) => {
    setLectures((prev) => {
      const updated = prev.map((l) => (l.category === catToDelete ? { ...l, category: fallbackCat } : l));
      updated.forEach((l) => {
        if (l.category === fallbackCat) {
          cloudStorage.saveLecture(l);
        }
      });
      return updated;
    });
  };

  // Uncle Ho Quotes & Settings Handlers
  const handleSaveUncleHoQuotes = async (newQuotes: UncleHoQuote[]) => {
    setUncleHoQuotes(newQuotes);
    await cloudStorage.saveUncleHoQuotes(newQuotes);
  };

  const handleSaveUncleHoSettings = async (newSettings: UncleHoSettings) => {
    setUncleHoSettings(newSettings);
    await cloudStorage.saveUncleHoSettings(newSettings);
  };

  const approvedArticles = articles.filter((a) => !a.status || a.status === 'approved' || a.status !== 'pending');

  const defaultHomeAnnouncements: HomeAnnouncement[] = [];

  const defaultQuickActionCards: QuickActionCard[] = [
    {
      id: 'card-exam',
      title: 'CUỘC THI TRỰC TUYẾN',
      subtitle: 'Tìm hiểu Nghị quyết Đại hội Đảng',
      iconName: 'exam',
      type: 'external',
      externalUrl: 'https://thitructuyen.quandoi.vn',
      openNewTab: true,
      bgGradient: 'from-red-700 via-red-800 to-rose-900',
      borderColor: 'border-red-500/30',
      textColor: 'text-yellow-300',
      heightSize: 'md',
      enabled: true,
    },
    {
      id: 'card-doc',
      title: 'TRA CỨU VĂN BẢN QUÂN SỰ',
      subtitle: 'Hệ thống chỉ thị & quy định',
      iconName: 'doc',
      type: 'internal',
      targetPage: 'doc',
      bgGradient: 'from-blue-800 via-blue-900 to-indigo-950',
      borderColor: 'border-blue-500/30',
      textColor: 'text-cyan-200',
      heightSize: 'md',
      enabled: true,
    },
    {
      id: 'card-lecture',
      title: 'BÀI GIẢNG ĐIỆN TỬ',
      subtitle: 'Giáo án & Video huấn luyện',
      iconName: 'video',
      type: 'internal',
      targetPage: 'lecture',
      bgGradient: 'from-emerald-900 via-teal-900 to-slate-900',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-200',
      heightSize: 'md',
      enabled: true,
    },
    {
      id: 'card-meeting',
      title: 'HỌP ĐẢNG ỦY & DƯ LUẬN',
      subtitle: 'Phòng họp trực tuyến & Biểu quyết',
      iconName: 'meeting',
      type: 'internal',
      targetPage: 'meeting',
      bgGradient: 'from-rose-900 via-pink-900 to-purple-950',
      borderColor: 'border-pink-500/30',
      textColor: 'text-pink-200',
      heightSize: 'md',
      enabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-gray-900 flex flex-col font-['Roboto',sans-serif]">
      {/* 1. Header */}
      <Header
        siteConfig={siteConfig}
        currentUser={currentUser}
        roles={roles}
        onOpenAuth={(tab) => setAuthModal({ isOpen: true, tab })}
        onOpenProfile={() => setProfileModalOpen(true)}
        onLogout={handleLogout}
        onGoHome={() => setCurrentPage('home')}
        onSelectPage={handleSelectPage}
        onOpenCustomizer={() => setCustomizerModalOpen(true)}
        onOpenUncleHoManager={() => setUncleHoManagerOpen(true)}
        onOpenAnnouncementManager={() => setAnnouncementManagerOpen(true)}
      />

      {/* 2. Sticky Navbar */}
      <Navbar
        currentPage={currentPage}
        onSelectPage={handleSelectPage}
        currentUser={currentUser}
        pendingDraftsCount={pendingDraftsCount}
        onOpenCustomizer={() => setCustomizerModalOpen(true)}
        siteConfig={siteConfig}
        armyGreenColor={siteConfig.colorGreen}
        primaryRedColor={siteConfig.colorRed}
      />

      {/* 3. News Ticker */}
      <NewsTicker
        siteConfig={siteConfig}
        tickerText={siteConfig.ticker}
        articles={articles}
        primaryRedColor={siteConfig.colorRed}
        onOpenArticle={handleOpenArticle}
        onTickerClick={() => handleSelectPage('home')}
      />

      {/* 4. Main Body Container */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-5">
        <div className="w-full">
          {/* Main Content Area */}
          <div className="w-full min-w-0">
            {currentPage === 'home' && (
              <HomeView
                articles={articles}
                documents={documents}
                lectures={lectures}
                uncleHoQuotes={uncleHoQuotes}
                uncleHoSettings={uncleHoSettings}
                currentUser={currentUser}
                siteConfig={siteConfig}
                isLoading={isLoadingData}
                onOpenArticle={handleOpenArticle}
                onSelectSection={handleSelectPage}
                onEditArticle={handleOpenEditArticleModal}
                onDeleteArticle={handleDeleteArticle}
                onOpenUncleHoManager={() => setUncleHoManagerOpen(true)}
                onSaveUncleHoQuotes={handleSaveUncleHoQuotes}
                onOpenAnnouncementManager={() => setAnnouncementManagerOpen(true)}
                onSaveQuickActions={handleSaveQuickActions}
                onSaveHomeCategoryColumns={handleSaveHomeCategoryColumns}
                onSaveLayoutSettings={handleSaveLayoutSettings}
                onSelectSpotlightArticle={handleSelectSpotlightArticle}
                onOpenAuthModal={(tab) => setAuthModal({ isOpen: true, tab })}
                onOpenProfileModal={() => setProfileModalOpen(true)}
                onLogout={handleLogout}
                onOpenCustomizer={() => setCustomizerModalOpen(true)}
              />
            )}

            {(currentPage === 'ctd' || currentPage === 'hl' || currentPage === 'bac') && (
              <SectionView
                sectionKey={currentPage}
                articles={articles}
                currentUser={currentUser}
                siteConfig={siteConfig}
                isLoading={isLoadingData}
                onOpenArticle={handleOpenArticle}
                onOpenPostModal={handleOpenPostModal}
                onEditArticle={handleOpenEditArticleModal}
                onDeleteArticle={handleDeleteArticle}
                onSelectSection={handleSelectPage}
                onGoHome={() => handleSelectPage('home')}
                onOpenTabIntroModal={(tabKey) => setTabIntroModal({ isOpen: true, tabKey })}
                onSaveCategories={(newCats) => handleSaveSectionCategories(currentPage, newCats)}
                onRenameCategory={(oldCat, newCat) =>
                  handleRenameSectionCategory(currentPage, oldCat, newCat)
                }
                onDeleteCategory={(catToDelete, fallbackCat) =>
                  handleDeleteSectionCategory(currentPage, catToDelete, fallbackCat)
                }
              />
            )}

            {(currentPage === 'article_detail' || currentPage === 'article-detail') &&
              selectedArticle && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                  {/* LEFT COLUMN: 1 fraction (1/4) */}
                  <div className="lg:col-span-1 flex flex-col gap-4">
                    {/* Top Block: Lời Bác dạy */}
                    <UncleHoDailySection
                      quotes={uncleHoQuotes}
                      settings={uncleHoSettings}
                      currentUser={currentUser}
                      isLoading={isLoadingData}
                      onOpenManager={() => setUncleHoManagerOpen(true)}
                      onSaveQuotes={handleSaveUncleHoQuotes}
                      layout="vertical"
                    />

                    {/* Bottom Block: Thông báo & Sự kiện */}
                    <HomeAnnouncementsWidget
                      announcements={siteConfig.homeAnnouncements || defaultHomeAnnouncements}
                      currentUser={currentUser}
                      articles={approvedArticles}
                      isLoading={isLoadingData}
                      onOpenArticle={handleOpenArticle}
                      onOpenAnnouncementManager={() => setAnnouncementManagerOpen(true)}
                    />
                  </div>

                  {/* MIDDLE COLUMN: 2 fractions (2/4) - Nội dung bài viết */}
                  <div className="lg:col-span-2 min-w-0">
                    <ArticleDetailView
                      article={selectedArticle}
                      allArticles={articles}
                      currentUser={currentUser}
                      siteConfig={siteConfig}
                      onBack={() => handleSelectPage(previousPage || 'home')}
                      onGoHome={() => handleSelectPage('home')}
                      onOpenArticle={handleOpenArticle}
                      onSelectSection={handleSelectPage}
                      onEditArticle={handleOpenEditArticleModal}
                      onDeleteArticle={handleDeleteArticle}
                    />
                  </div>

                  {/* RIGHT COLUMN: 1 fraction (1/4) */}
                  <div className="lg:col-span-1 flex flex-col gap-4">
                    {/* Top Block: Tin mới nhất */}
                    <HomeLatestNewsWidget
                      articles={approvedArticles}
                      isLoading={isLoadingData}
                      onOpenArticle={handleOpenArticle}
                      onSelectSection={handleSelectPage}
                    />

                    {/* Bottom Block: Tiện ích quân nhân */}
                    <HomeQuickActionsWidget
                      cards={
                        siteConfig.quickActionCards ||
                        siteConfig.homeQuickActions ||
                        defaultQuickActionCards
                      }
                      currentUser={currentUser}
                      onSelectSection={handleSelectPage}
                      onOpenQuickActionManager={() => setIsQuickActionModalOpen(true)}
                    />
                  </div>
                </div>
              )}

            {currentPage === 'doc' && (
              <DocumentArchiveView
                documents={documents}
                currentUser={currentUser}
                siteConfig={siteConfig}
                onOpenAuth={() => setAuthModal({ isOpen: true, tab: 'login' })}
                onOpenAddDocModal={() => setAddDocModalOpen(true)}
                onDeleteDoc={handleDeleteDoc}
                onUpdateDoc={handleUpdateDoc}
                onSelectSection={handleSelectPage}
                onGoHome={() => handleSelectPage('home')}
                onSaveCategories={handleSaveDocCategories}
                onRenameCategory={handleRenameDocCategory}
                onDeleteCategory={handleDeleteDocCategory}
                onOpenTabIntroModal={(tabKey) => setTabIntroModal({ isOpen: true, tabKey })}
              />
            )}

            {currentPage === 'lecture' && (
              <LectureLibraryView
                lectures={lectures}
                currentUser={currentUser}
                siteConfig={siteConfig}
                onOpenAddLectureModal={handleOpenAddLectureModal}
                onOpenEditLectureModal={handleOpenEditLectureModal}
                onDeleteLecture={handleDeleteLecture}
                onUpdateLecture={handleUpdateLecture}
                onSelectSection={handleSelectPage}
                onGoHome={() => handleSelectPage('home')}
                onOpenTabIntroModal={(tabKey) => setTabIntroModal({ isOpen: true, tabKey })}
                onSaveCategories={handleSaveLectureCategories}
                onRenameCategory={handleRenameLectureCategory}
                onDeleteCategory={handleDeleteLectureCategory}
              />
            )}

            {currentPage === 'meeting' && (
              <PartyMeetingRoom
                currentUser={currentUser}
                allUsers={users}
                meetingRooms={meetingRooms}
                onSaveMeetingRoom={handleSaveMeetingRoom}
                onDeleteMeetingRoom={handleDeleteMeetingRoom}
                onSaveMeetingRooms={handleSaveMeetingRooms}
                meetingDocuments={meetingDocuments}
                onSaveMeetingDocument={handleSaveMeetingDocument}
                onDeleteMeetingDocument={handleDeleteMeetingDocument}
                meetingSettings={meetingSettings}
                onSaveMeetingSettings={handleSaveMeetingSettings}
                meetingVotes={meetingVotes}
                onCastVote={handleCastVote}
                onResetVotes={handleResetVotes}
                onSelectSection={handleSelectPage}
                onGoHome={() => handleSelectPage('home')}
                siteConfig={siteConfig}
                onOpenTabIntroModal={(tabKey) => setTabIntroModal({ isOpen: true, tabKey })}
              />
            )}

            {currentPage === 'approvals' && (
              <ApprovalsView
                pendingArticles={articles.filter((a) => a.status === 'pending')}
                onOpenArticle={handleOpenArticle}
                onApproveArticle={handleApproveArticle}
                onRejectArticle={handleRejectArticle}
                onSelectSection={handleSelectPage}
                onGoHome={() => handleSelectPage('home')}
              />
            )}

            {currentPage === 'users' && (
              <UserManagementView
                users={users}
                currentUser={currentUser}
                roles={roles}
                militaryProfiles={militaryProfiles}
                onSaveSoldierProfile={handleSaveSoldierProfile}
                onDeleteSoldierProfile={handleDeleteSoldierProfile}
                onImportSoldiersExcel={handleImportSoldiersExcel}
                onBatchCreateAccounts={handleBatchCreateAccounts}
                onSaveRole={handleSaveRole}
                onDeleteRole={handleDeleteRole}
                onTogglePermission={handleTogglePermission}
                onUpdateUser={handleUpdateUser}
                onChangeUserRole={handleChangeUserRole}
                onChangeUserPassword={handleChangeUserPassword}
                onCreateUser={handleCreateUser}
                onDeleteUser={handleDeleteUser}
                onSelectSection={handleSelectPage}
                onGoHome={() => handleSelectPage('home')}
              />
            )}
          </div>
        </div>
      </main>

      {/* 5. Footer */}
      <Footer
        siteConfig={siteConfig}
        currentUser={currentUser}
        onSelectPage={handleSelectPage}
      />

      {/* 6. Modals */}
      <AuthModal
        isOpen={authModal.isOpen}
        initialTab={authModal.tab}
        onClose={() => setAuthModal({ isOpen: false, tab: 'login' })}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        currentUser={currentUser}
        onClose={() => setProfileModalOpen(false)}
        onSaveProfile={handleSaveProfile}
      />

      <CustomizerModal
        isOpen={customizerModalOpen}
        siteConfig={siteConfig}
        articles={articles}
        onClose={() => setCustomizerModalOpen(false)}
        onSave={handleSaveCustomizer}
      />

      <PostArticleModal
        isOpen={postModal.isOpen}
        sectionKey={postModal.section}
        articleToEdit={postModal.articleToEdit}
        currentUser={currentUser}
        siteConfig={siteConfig}
        onClose={() => setPostModal({ isOpen: false, section: 'ctd', articleToEdit: null })}
        onSubmitArticle={handlePostArticle}
        onUpdateArticle={handleUpdateArticle}
        onDeleteArticle={handleDeleteArticle}
      />

      <AddDocModal
        isOpen={addDocModalOpen}
        onClose={() => setAddDocModalOpen(false)}
        onAddDoc={handleAddDoc}
      />

      <AddLectureModal
        isOpen={lectureModal.isOpen}
        currentUser={currentUser}
        lectureToEdit={lectureModal.lectureToEdit}
        onClose={() => setLectureModal({ isOpen: false, lectureToEdit: null })}
        onAddLecture={handleAddLecture}
        onUpdateLecture={handleUpdateLecture}
      />

      <UncleHoManagerModal
        isOpen={uncleHoManagerOpen}
        onClose={() => setUncleHoManagerOpen(false)}
        quotes={uncleHoQuotes}
        settings={uncleHoSettings}
        onSaveQuotes={handleSaveUncleHoQuotes}
        onSaveSettings={handleSaveUncleHoSettings}
      />

      <HomeAnnouncementManagerModal
        isOpen={announcementManagerOpen}
        announcements={siteConfig.homeAnnouncements || []}
        onClose={() => setAnnouncementManagerOpen(false)}
        onSaveAnnouncements={handleSaveAnnouncements}
      />

      <TabIntroManagerModal
        isOpen={tabIntroModal.isOpen}
        initialTab={tabIntroModal.tabKey}
        siteConfig={siteConfig}
        onClose={() => setTabIntroModal({ isOpen: false, tabKey: 'doc' })}
        onSaveSiteConfig={handleSaveCustomizer}
      />

      {isQuickActionModalOpen && (
        <QuickActionManagerModal
          cards={
            siteConfig.quickActionCards ||
            siteConfig.homeQuickActions ||
            defaultQuickActionCards
          }
          onClose={() => setIsQuickActionModalOpen(false)}
          onSave={handleSaveQuickActions}
        />
      )}

      {/* Layout Manager Modal */}
      {isLayoutModalOpen && (
        <LayoutManagerModal
          isOpen={isLayoutModalOpen}
          siteConfig={siteConfig}
          onClose={() => setIsLayoutModalOpen(false)}
          onSaveLayout={handleSaveLayoutSettings}
        />
      )}

      {/* Access Denied Warning Modal */}
      <AccessDeniedModal
        isOpen={accessDeniedModal.isOpen}
        title={accessDeniedModal.title}
        message={accessDeniedModal.message}
        requiredRole={accessDeniedModal.requiredRole}
        onClose={() => setAccessDeniedModal({ isOpen: false })}
        onOpenLogin={() => {
          setAccessDeniedModal({ isOpen: false });
          setAuthModal({ isOpen: true, tab: 'login' });
        }}
        onGoHome={() => {
          setAccessDeniedModal({ isOpen: false });
          setCurrentPage('home');
        }}
      />

      {/* 7. Real-time Toast Notification Feedback */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
