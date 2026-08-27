import React, { useEffect, useRef, useState } from 'react';
import mammoth from 'mammoth';
import {
  AlertTriangle,
  ArrowLeft,
  Bold,
  Calendar,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Columns,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileCheck,
  FileCode,
  FileEdit,
  FilePlus,
  FileText,
  FileUp,
  FolderLock,
  HelpCircle,
  Highlighter,
  Home,
  Italic,
  KeyRound,
  Landmark,
  Layers,
  Lock,
  Play,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Search,
  Settings,
  Shield,
  Square,
  Timer,
  Trash2,
  Underline,
  Unlock,
  Users,
  Vote,
  X,
  XCircle,
} from 'lucide-react';
import {
  MeetingDocumentItem,
  MeetingRoomItem,
  MeetingRoomSettings,
  MeetingVote,
  PageView,
  SiteConfig,
  User,
  VoteChoice,
} from '../types';
import { getSupabase } from '../utils/supabase';

interface OnlineParticipant {
  userId: number;
  userName: string;
  rankUnit: string;
  avatar?: string;
  joinedAt: string;
}

interface DocLockInfo {
  userId: number;
  userName: string;
  userRankUnit?: string;
  timestamp: number;
}

interface PartyMeetingRoomProps {
  currentUser: User | null;
  allUsers: User[];
  meetingRooms?: MeetingRoomItem[];
  onSaveMeetingRoom?: (room: MeetingRoomItem) => void;
  onDeleteMeetingRoom?: (roomId: string) => void;
  onSaveMeetingRooms?: (rooms: MeetingRoomItem[]) => void;
  meetingDocuments: MeetingDocumentItem[];
  siteConfig?: SiteConfig;
  onSaveMeetingDocument: (doc: MeetingDocumentItem) => void;
  onDeleteMeetingDocument: (docId: number) => void;
  meetingSettings: MeetingRoomSettings;
  onSaveMeetingSettings: (settings: MeetingRoomSettings) => void;
  meetingVotes: Record<string, MeetingVote> | Record<number, MeetingVote>;
  onCastVote: (vote: MeetingVote) => void;
  onResetVotes?: (docId?: number) => void;
  onSelectSection?: (section: PageView) => void;
  onGoHome?: () => void;
  onOpenTabIntroModal?: (tabKey: string) => void;
}

export const PartyMeetingRoom: React.FC<PartyMeetingRoomProps> = ({
  currentUser,
  allUsers,
  meetingRooms = [],
  onSaveMeetingRoom,
  onDeleteMeetingRoom,
  onSaveMeetingRooms,
  meetingDocuments,
  siteConfig,
  onSaveMeetingDocument,
  onDeleteMeetingDocument,
  meetingSettings,
  onSaveMeetingSettings,
  meetingVotes,
  onCastVote,
  onResetVotes,
  onSelectSection,
  onGoHome,
  onOpenTabIntroModal,
}) => {
  // Navigation within Party Meeting Section: 'list' (Rooms list) or 'room' (inside a room)
  const [activeRoomId, setActiveRoomId] = useState<string | null>(() => {
    // If there is an ongoing room or at least 1 room, we can start in list view or pick first
    return null; // start at list view to see all 30 rooms easily, or user can click into one
  });

  // Room search & filter in list view
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [roomStatusFilter, setRoomStatusFilter] = useState<'all' | 'in_progress' | 'scheduled' | 'ended'>('all');
  const [confirmDeleteRoomId, setConfirmDeleteRoomId] = useState<string | null>(null);

  // Multi-room limit
  const MAX_ROOMS = 30;

  // Selected Room Object
  const currentRoom = meetingRooms.find((r) => r.id === activeRoomId) || null;

  // Permission Checks
  const isAdmin = currentUser?.role === 'admin';
  const canCreateMeeting = isAdmin || currentUser?.canCreateMeeting === true;
  const canUpload = isAdmin || currentUser?.canUploadMeetingDoc === true;
  const canDelete = isAdmin || currentUser?.canDeleteMeetingDoc === true;
  const canViewCollab = isAdmin || currentUser?.canViewCollaborativeEdits === true;
  const canManageActiveRoom =
    isAdmin || (currentRoom && currentRoom.createdByUserId === currentUser?.id);

  // Password Unlock per room
  const [unlockedRooms, setUnlockedRooms] = useState<Record<string, boolean>>(() => {
    try {
      const stored = sessionStorage.getItem('mangyang_unlocked_rooms');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const isRoomUnlocked = (room: MeetingRoomItem | null): boolean => {
    if (!room) return false;
    if (isAdmin) return true;
    if (!room.passwordRequired) return true;
    return !!unlockedRooms[room.id];
  };

  const handleUnlockRoom = (e: React.FormEvent, room: MeetingRoomItem) => {
    e.preventDefault();
    if (passwordInput.trim() === (room.roomPassword || '1945')) {
      const updated = { ...unlockedRooms, [room.id]: true };
      setUnlockedRooms(updated);
      sessionStorage.setItem('mangyang_unlocked_rooms', JSON.stringify(updated));
      setPasswordError('');
      setPasswordInput('');
    } else {
      setPasswordError('Mật khẩu không chính xác. Vui lòng kiểm tra lại với Ban Tổ chức Đảng ủy!');
    }
  };

  // Create / Edit Room Modal State
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomFormCode, setRoomFormCode] = useState('');
  const [roomFormTitle, setRoomFormTitle] = useState('');
  const [roomFormSessionNumber, setRoomFormSessionNumber] = useState('');
  const [roomFormChairPerson, setRoomFormChairPerson] = useState('');
  const [roomFormSecretary, setRoomFormSecretary] = useState('');
  const [roomFormDescription, setRoomFormDescription] = useState('');
  const [roomFormUnitTarget, setRoomFormUnitTarget] = useState('Đảng ủy Sư đoàn 10');
  const [roomFormPasswordRequired, setRoomFormPasswordRequired] = useState(true);
  const [roomFormPassword, setRoomFormPassword] = useState('1945');
  const [roomFormStatus, setRoomFormStatus] = useState<'scheduled' | 'in_progress' | 'ended'>('scheduled');
  const [roomFormStartTime, setRoomFormStartTime] = useState('');
  const [roomFormEndTime, setRoomFormEndTime] = useState('');

  const handleOpenCreateRoomModal = () => {
    if (meetingRooms.length >= MAX_ROOMS) {
      alert(`Hệ thống đã đạt giới hạn tối đa ${MAX_ROOMS} phòng họp Đảng ủy đồng thời. Vui lòng kết thúc hoặc xóa bớt phòng họp cũ trước khi tạo mới!`);
      return;
    }
    const nextIndex = meetingRooms.length + 1;
    setEditingRoomId(null);
    setRoomFormCode(`PH-ĐU-${nextIndex < 10 ? '0' + nextIndex : nextIndex}`);
    setRoomFormTitle(`Hội nghị Đảng ủy Sư đoàn 10 (Phiên họp ${nextIndex})`);
    setRoomFormSessionNumber(`Kỳ họp chuyên đề Quý III/2026`);
    setRoomFormChairPerson(currentUser?.fullName ? `Đồng chí ${currentUser.fullName}` : 'Đồng chí Bí thư Đảng ủy');
    setRoomFormSecretary('Đồng chí Văn phòng Đảng ủy');
    setRoomFormDescription('Thảo luận và biểu quyết dự thảo nghị quyết lãnh đạo thực hiện nhiệm vụ chính trị, quân sự.');
    setRoomFormUnitTarget('Đảng ủy Sư đoàn 10');
    setRoomFormPasswordRequired(true);
    setRoomFormPassword('1945');
    setRoomFormStatus('in_progress');
    const nowStr = new Date().toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    setRoomFormStartTime(nowStr);
    setRoomFormEndTime('');
    setIsRoomModalOpen(true);
  };

  const handleOpenEditRoomModal = (room: MeetingRoomItem) => {
    setEditingRoomId(room.id);
    setRoomFormCode(room.roomCode);
    setRoomFormTitle(room.title);
    setRoomFormSessionNumber(room.sessionNumber);
    setRoomFormChairPerson(room.chairPerson);
    setRoomFormSecretary(room.secretary);
    setRoomFormDescription(room.description || '');
    setRoomFormUnitTarget(room.unitTarget || 'Đảng ủy Sư đoàn 10');
    setRoomFormPasswordRequired(room.passwordRequired);
    setRoomFormPassword(room.roomPassword || '1945');
    setRoomFormStatus(room.status);
    setRoomFormStartTime(room.startTime || '');
    setRoomFormEndTime(room.endTime || '');
    setIsRoomModalOpen(true);
  };

  const handleSaveRoomForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomFormTitle.trim() || !roomFormCode.trim()) {
      alert('Vui lòng nhập đầy đủ mã phòng và tên phiên họp!');
      return;
    }

    if (editingRoomId) {
      // Update existing room
      const existing = meetingRooms.find((r) => r.id === editingRoomId);
      if (!existing) return;

      const updatedRoom: MeetingRoomItem = {
        ...existing,
        roomCode: roomFormCode.trim().toUpperCase(),
        title: roomFormTitle.trim(),
        sessionNumber: roomFormSessionNumber.trim(),
        chairPerson: roomFormChairPerson.trim(),
        secretary: roomFormSecretary.trim(),
        description: roomFormDescription.trim(),
        unitTarget: roomFormUnitTarget.trim(),
        passwordRequired: roomFormPasswordRequired,
        roomPassword: roomFormPassword.trim(),
        status: roomFormStatus,
        startTime: roomFormStartTime || existing.startTime,
        endTime: roomFormEndTime || existing.endTime,
      };

      if (onSaveMeetingRoom) {
        onSaveMeetingRoom(updatedRoom);
      }
      setIsRoomModalOpen(false);
    } else {
      // Create new room
      if (meetingRooms.length >= MAX_ROOMS) {
        alert(`Đã đạt giới hạn tối đa ${MAX_ROOMS} phòng họp!`);
        return;
      }

      const newRoom: MeetingRoomItem = {
        id: `room-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        roomCode: roomFormCode.trim().toUpperCase(),
        title: roomFormTitle.trim(),
        sessionNumber: roomFormSessionNumber.trim(),
        chairPerson: roomFormChairPerson.trim(),
        secretary: roomFormSecretary.trim(),
        description: roomFormDescription.trim(),
        unitTarget: roomFormUnitTarget.trim(),
        passwordRequired: roomFormPasswordRequired,
        roomPassword: roomFormPassword.trim(),
        createdByUserId: currentUser?.id || 1,
        createdByUserName: currentUser?.fullName || 'Cán bộ quản trị',
        createdAt: new Date().toISOString(),
        status: roomFormStatus,
        startTime: roomFormStartTime || new Date().toLocaleString('vi-VN'),
        endTime: roomFormEndTime,
        documents: meetingDocuments && meetingDocuments.length > 0 ? [...meetingDocuments] : [],
        votes: {},
      };

      if (onSaveMeetingRoom) {
        onSaveMeetingRoom(newRoom);
      }
      // Unlock new room automatically for creator
      const updatedUnlocked = { ...unlockedRooms, [newRoom.id]: true };
      setUnlockedRooms(updatedUnlocked);
      sessionStorage.setItem('mangyang_unlocked_rooms', JSON.stringify(updatedUnlocked));

      setIsRoomModalOpen(false);
      setActiveRoomId(newRoom.id);
    }
  };

  const handleDeleteRoom = (room: MeetingRoomItem) => {
    if (onDeleteMeetingRoom) {
      onDeleteMeetingRoom(room.id);
    }
    if (activeRoomId === room.id) {
      setActiveRoomId(null);
    }
    setConfirmDeleteRoomId(null);
  };

  // Time & Session Control inside active room
  const handleStartMeetingNow = (room: MeetingRoomItem) => {
    const nowStr = new Date().toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const updated: MeetingRoomItem = {
      ...room,
      status: 'in_progress',
      startTime: nowStr,
    };
    if (onSaveMeetingRoom) onSaveMeetingRoom(updated);
  };

  const handleEndMeetingNow = (room: MeetingRoomItem) => {
    if (confirm(`Xác nhận bế mạc và kết thúc phiên họp "${room.title}"? Thống kê thời gian và kết quả biểu quyết sẽ được lưu trữ vĩnh viễn.`)) {
      const nowStr = new Date().toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const updated: MeetingRoomItem = {
        ...room,
        status: 'ended',
        endTime: nowStr,
      };
      if (onSaveMeetingRoom) onSaveMeetingRoom(updated);
    }
  };

  // Active documents in the current room
  const currentRoomDocs: MeetingDocumentItem[] =
    currentRoom && currentRoom.documents && currentRoom.documents.length > 0
      ? currentRoom.documents
      : meetingDocuments;

  const [activeDocId, setActiveDocId] = useState<number>(() => {
    return currentRoomDocs.length > 0 ? currentRoomDocs[0].id : 1;
  });
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docCategoryFilter, setDocCategoryFilter] = useState('ALL');
  const [activeRoomTab, setActiveRoomTab] = useState<'workspace' | 'collab_studio'>('workspace');

  // -------------------------------------------------------------
  // REAL-TIME SUPABASE PRESENCE & DOCUMENT EDITING LOCK
  // -------------------------------------------------------------
  const [onlineMembers, setOnlineMembers] = useState<OnlineParticipant[]>([]);
  const [docLocks, setDocLocks] = useState<Record<number, DocLockInfo>>({});
  const [isCurrentlyEditing, setIsCurrentlyEditing] = useState(false);

  // Supabase Presence Tracking & Document Lock Realtime Channel
  useEffect(() => {
    const supabase = getSupabase();
    const targetRoomKey = activeRoomId || 'main-meeting-hall';

    if (!supabase) {
      if (currentUser) {
        setOnlineMembers([
          {
            userId: currentUser.id,
            userName: currentUser.fullName,
            rankUnit: currentUser.rankUnit || currentUser.rank || 'Đảng ủy viên',
            avatar: currentUser.avatar,
            joinedAt: new Date().toISOString(),
          },
        ]);
      }
      return;
    }

    const channelName = `meeting-room-${targetRoomKey}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: currentUser ? String(currentUser.id) : `guest-${Date.now()}`,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const members: OnlineParticipant[] = [];
        const seenUserIds = new Set<string | number>();

        Object.values(state).forEach((presenceList: any) => {
          if (Array.isArray(presenceList)) {
            presenceList.forEach((item: any) => {
              const uid = item.userId || item.id;
              if (uid && !seenUserIds.has(uid)) {
                seenUserIds.add(uid);
                members.push({
                  userId: Number(uid) || 0,
                  userName: item.userName || 'Đảng ủy viên',
                  rankUnit: item.rankUnit || '',
                  avatar: item.avatar,
                  joinedAt: item.joinedAt || new Date().toISOString(),
                });
              }
            });
          }
        });
        setOnlineMembers(members);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[Presence] Member joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[Presence] Member left:', key, leftPresences);
      })
      .on('broadcast', { event: 'doc_lock_change' }, ({ payload }) => {
        if (payload && payload.docId) {
          if (payload.isEditing) {
            setDocLocks((prev) => ({
              ...prev,
              [payload.docId]: {
                userId: payload.userId,
                userName: payload.userName,
                userRankUnit: payload.userRankUnit,
                timestamp: payload.timestamp || Date.now(),
              },
            }));
          } else {
            setDocLocks((prev) => {
              const next = { ...prev };
              delete next[payload.docId];
              return next;
            });
          }
        }
      })
      .on('broadcast', { event: 'doc_saved' }, ({ payload }) => {
        if (payload && payload.doc) {
          onSaveMeetingDocument(payload.doc);
          if (currentRoom && onSaveMeetingRoom) {
            const updatedDocs = currentRoomDocs.map((d) =>
              d.id === payload.doc.id ? payload.doc : d
            );
            onSaveMeetingRoom({ ...currentRoom, documents: updatedDocs });
          }
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && currentUser) {
          await channel.track({
            userId: currentUser.id,
            userName: currentUser.fullName,
            rankUnit: currentUser.rankUnit || currentUser.rank || 'Đảng ủy viên',
            avatar: currentUser.avatar,
            joinedAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      // Release any locks held by current user before leaving channel
      if (activeDocId && isCurrentlyEditing && currentUser) {
        try {
          channel.send({
            type: 'broadcast',
            event: 'doc_lock_change',
            payload: {
              docId: activeDocId,
              isEditing: false,
              userId: currentUser.id,
            },
          });
        } catch {
          // ignore
        }
      }
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  }, [activeRoomId, currentUser?.id]);

  // Release lock when switching document
  useEffect(() => {
    if (isCurrentlyEditing && currentUser && activeDocId) {
      const supabase = getSupabase();
      if (supabase && activeRoomId) {
        supabase.channel(`meeting-room-${activeRoomId}`).send({
          type: 'broadcast',
          event: 'doc_lock_change',
          payload: {
            docId: activeDocId,
            isEditing: false,
            userId: currentUser.id,
          },
        });
      }
      setIsCurrentlyEditing(false);
    }
  }, [activeDocId]);

  // Reset active doc when entering another room
  useEffect(() => {
    if (currentRoomDocs && currentRoomDocs.length > 0) {
      if (!currentRoomDocs.some((d) => d.id === activeDocId)) {
        setActiveDocId(currentRoomDocs[0].id);
      }
    }
  }, [currentRoom?.id, currentRoomDocs]);

  // Selected Document object
  const activeDocument =
    currentRoomDocs.find((d) => d.id === activeDocId) || currentRoomDocs[0] || null;

  // Add Document Modal State inside current room
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [newDocCode, setNewDocCode] = useState('');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<
    'Nghị quyết' | 'Báo cáo' | 'Kế hoạch' | 'Biên bản' | 'Tờ trình'
  >('Nghị quyết');
  const [newDocContentHtml, setNewDocContentHtml] = useState('');
  const [newDocIsSecret, setNewDocIsSecret] = useState(false);
  const addDocFileInputRef = useRef<HTMLInputElement>(null);

  // Document Editor State
  const editorRef = useRef<HTMLDivElement>(null);
  const wordImportInputRef = useRef<HTMLInputElement>(null);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Sync editor content when active document changes
  useEffect(() => {
    if (editorRef.current && activeDocument) {
      editorRef.current.innerHTML = activeDocument.contentHtml || '';
    }
  }, [activeDocId, activeDocument?.id, activeRoomId]);

  // Eligible Voters list
  const eligibleVoters = allUsers.filter((u) => u.canJoinPartyMeeting || u.role === 'admin');
  const totalEligible = eligibleVoters.length;

  // Extract votes for a specific document within this room
  const getVotesForDoc = (docId: number) => {
    // Check room votes first if present, then global meetingVotes
    if (currentRoom && currentRoom.votes) {
      const roomVotesArray = Object.values(currentRoom.votes) as MeetingVote[];
      const matchInRoom = roomVotesArray.filter((v) =>
        v.docId !== undefined ? v.docId === docId : docId === currentRoomDocs[0]?.id
      );
      if (matchInRoom.length > 0) return matchInRoom;
    }
    const allVotes = Object.values(meetingVotes) as MeetingVote[];
    return allVotes.filter((v) =>
      v.docId !== undefined ? v.docId === docId : docId === currentRoomDocs[0]?.id
    );
  };

  const activeDocVotes = activeDocument ? getVotesForDoc(activeDocument.id) : [];
  const currentVote = currentUser
    ? activeDocVotes.find((v) => v.userId === currentUser.id)
    : undefined;

  let countAgree = 0;
  let countDisagree = 0;
  let countOther = 0;

  activeDocVotes.forEach((vote) => {
    if (vote.choice === 'Tán thành') countAgree++;
    else if (vote.choice === 'Không tán thành') countDisagree++;
    else countOther++;
  });

  const totalVoted = activeDocVotes.length;
  const percentAgree = totalEligible > 0 ? Math.round((countAgree / totalEligible) * 100) : 0;
  const percentDisagree = totalEligible > 0 ? Math.round((countDisagree / totalEligible) * 100) : 0;
  const percentOther = totalEligible > 0 ? Math.round((countOther / totalEligible) * 100) : 0;

  // Handle voting choice
  const handleVoteChoice = (choice: VoteChoice) => {
    if (!currentUser) {
      alert('Đồng chí vui lòng đăng nhập tài khoản Đảng ủy viên để thực hiện quyền biểu quyết!');
      return;
    }
    if (!currentUser.canJoinPartyMeeting && currentUser.role !== 'admin') {
      alert('Tài khoản của đồng chí chưa được cấp quyền biểu quyết trong Hội nghị Đảng ủy!');
      return;
    }
    if (!activeDocument) return;

    const nowStr = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });

    const newVote: MeetingVote = {
      docId: activeDocument.id,
      userId: currentUser.id,
      voterName: currentUser.fullName,
      rankUnit: currentUser.rankUnit || 'Đảng ủy viên',
      choice,
      time: nowStr,
    };

    onCastVote(newVote);

    // Also persist inside the current room's votes
    if (currentRoom && onSaveMeetingRoom) {
      const voteKey = `${activeDocument.id}_${currentUser.id}`;
      const updatedVotes = {
        ...(currentRoom.votes || {}),
        [voteKey]: newVote,
      };
      onSaveMeetingRoom({
        ...currentRoom,
        votes: updatedVotes,
      });
    }
  };

  // Editor formatting functions
  const handleFormat = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
  };

  const handleHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      alert('Đồng chí vui lòng bôi đen đoạn văn bản cần đánh dấu ý kiến đóng góp!');
      return;
    }

    const officerName = currentUser?.fullName || 'Đảng ủy viên';
    const tag = ` [Góp ý của: ${officerName}] `;

    const span = document.createElement('span');
    span.style.backgroundColor = '#fef08a';
    span.style.color = '#854d0e';
    span.style.fontWeight = 'bold';
    span.style.padding = '2px 4px';
    span.style.borderRadius = '4px';
    span.title = `Ý kiến đóng góp chỉnh sửa bởi đồng chí ${officerName}`;
    span.textContent = selection.toString() + tag;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(span);
  };

  // Start editing active document (Broadcast lock)
  const handleStartEditDoc = () => {
    if (!activeDocument || !currentUser) {
      alert('Đồng chí vui lòng đăng nhập để thực hiện chỉnh sửa văn bản!');
      return;
    }

    const currentLock = docLocks[activeDocument.id];
    if (currentLock && currentLock.userId !== currentUser.id) {
      alert(
        `⚠️ Đồng chí ${currentLock.userName} (${currentLock.userRankUnit || 'Đảng ủy viên'}) đang chỉnh sửa văn bản này! Vui lòng chờ đồng chí ấy lưu xong.`
      );
      return;
    }

    setIsCurrentlyEditing(true);
    const supabase = getSupabase();
    if (supabase && activeRoomId) {
      const channelName = `meeting-room-${activeRoomId}`;
      supabase.channel(channelName).send({
        type: 'broadcast',
        event: 'doc_lock_change',
        payload: {
          docId: activeDocument.id,
          isEditing: true,
          userId: currentUser.id,
          userName: currentUser.fullName,
          userRankUnit: currentUser.rankUnit || currentUser.rank || 'Đảng ủy viên',
          timestamp: Date.now(),
        },
      });
    }
  };

  // Cancel editing active document (Release lock)
  const handleCancelEditDoc = () => {
    if (editorRef.current && activeDocument) {
      editorRef.current.innerHTML = activeDocument.contentHtml || '';
    }
    setIsCurrentlyEditing(false);
    const supabase = getSupabase();
    if (supabase && activeRoomId && currentUser && activeDocument) {
      const channelName = `meeting-room-${activeRoomId}`;
      supabase.channel(channelName).send({
        type: 'broadcast',
        event: 'doc_lock_change',
        payload: {
          docId: activeDocument.id,
          isEditing: false,
          userId: currentUser.id,
        },
      });
    }
  };

  // Save document editor content (Save and Release lock)
  const handleSaveActiveDoc = () => {
    if (!editorRef.current || !activeDocument) return;
    const updatedHtml = editorRef.current.innerHTML;
    const updatedDoc: MeetingDocumentItem = {
      ...activeDocument,
      contentHtml: updatedHtml,
    };

    onSaveMeetingDocument(updatedDoc);

    if (currentRoom && onSaveMeetingRoom) {
      const updatedDocs = currentRoomDocs.map((d) => (d.id === updatedDoc.id ? updatedDoc : d));
      onSaveMeetingRoom({
        ...currentRoom,
        documents: updatedDocs,
      });
    }

    // Release editing lock and broadcast saved document
    setIsCurrentlyEditing(false);
    const supabase = getSupabase();
    if (supabase && activeRoomId && currentUser) {
      const channelName = `meeting-room-${activeRoomId}`;
      supabase.channel(channelName).send({
        type: 'broadcast',
        event: 'doc_lock_change',
        payload: {
          docId: activeDocument.id,
          isEditing: false,
          userId: currentUser.id,
        },
      });
      supabase.channel(channelName).send({
        type: 'broadcast',
        event: 'doc_saved',
        payload: {
          doc: updatedDoc,
        },
      });
    }

    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  // Handle Word (.docx) import
  const handleWordImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      if (editorRef.current) {
        editorRef.current.innerHTML = result.value;
        handleSaveActiveDoc();
        alert('Đã nhập thành công nội dung từ tệp Word (.docx) vào văn bản!');
      }
    } catch (err) {
      console.error('Error parsing docx:', err);
      alert('Không thể đọc tệp Word. Vui lòng kiểm tra định dạng .docx!');
    }
  };

  // Handle Word upload for creating new document
  const handleNewDocWordUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setNewDocContentHtml(result.value);
      if (!newDocTitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        setNewDocTitle(cleanName);
      }
    } catch (err) {
      console.error('Error parsing docx:', err);
      alert('Không thể đọc tệp Word. Vui lòng kiểm tra định dạng .docx!');
    }
  };

  // Create new document inside room
  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) {
      alert('Vui lòng nhập tên trích yếu văn bản!');
      return;
    }

    const defaultInitialContent = `<div style="text-align: center; margin-bottom: 20px;">
  <p style="font-weight: bold; margin: 0; font-size: 14px; text-transform: uppercase;">ĐẢNG BỘ SƯ ĐOÀN 10<br><strong>BAN CHẤP HÀNH ĐẢNG BỘ</strong></p>
  <p style="margin: 4px 0; font-size: 12px;">Số: ${newDocCode || '.../ĐU'}</p>
  <h3 style="font-size: 16px; font-weight: bold; color: #831843; text-transform: uppercase; margin: 12px 0;">
    ${newDocTitle.toUpperCase()}
  </h3>
</div>
<p><strong>I. TÌNH HÌNH & KẾT QUẢ ĐẠT ĐƯỢC:</strong></p>
<p>- Toàn đơn vị duy trì nghiêm chế độ trực chỉ huy, trực SSCĐ, tuần tra canh gác an toàn tuyệt đối...</p>
<p><strong>II. PHƯƠNG HƯỚNG & NHIỆM VỤ TRỌNG TÂM:</strong></p>
<p>- Tập trung lãnh đạo hoàn thành xuất sắc các nội dung diễn tập, bắn đạn thật và công tác xây dựng Đảng trong sạch, vững mạnh.</p>`;

    const newDoc: MeetingDocumentItem = {
      id: Date.now(),
      code: newDocCode || `VB-${currentRoomDocs.length + 1}`,
      title: newDocTitle,
      category: newDocCategory,
      contentHtml: newDocContentHtml || defaultInitialContent,
      uploadedBy: currentUser ? `${currentUser.fullName} (${currentUser.rankUnit || 'Cán bộ'})` : 'Ban Quản trị',
      date: new Date().toLocaleDateString('vi-VN'),
      fileType: 'word',
      fileName: `${newDocTitle.slice(0, 30)}.docx`,
      fileSize: '180 KB',
      isSecret: newDocIsSecret,
    };

    onSaveMeetingDocument(newDoc);

    if (currentRoom && onSaveMeetingRoom) {
      const updatedDocs = [newDoc, ...currentRoomDocs];
      onSaveMeetingRoom({
        ...currentRoom,
        documents: updatedDocs,
      });
    }

    setActiveDocId(newDoc.id);
    setIsAddDocModalOpen(false);
    setNewDocTitle('');
    setNewDocCode('');
    setNewDocContentHtml('');
  };

  const handleDeleteDoc = (doc: MeetingDocumentItem) => {
    if (confirm(`Đồng chí có chắc chắn muốn xóa văn bản "${doc.title}" khỏi phòng họp này?`)) {
      onDeleteMeetingDocument(doc.id);
      if (currentRoom && onSaveMeetingRoom) {
        const updatedDocs = currentRoomDocs.filter((d) => d.id !== doc.id);
        onSaveMeetingRoom({
          ...currentRoom,
          documents: updatedDocs,
        });
      }
    }
  };

  // Filtered Documents in active room
  const filteredDocs = currentRoomDocs.filter((doc) => {
    const matchSearch =
      doc.title.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
      doc.code?.toLowerCase().includes(docSearchQuery.toLowerCase());
    const matchCat = docCategoryFilter === 'ALL' || doc.category === docCategoryFilter;
    return matchSearch && matchCat;
  });

  // Filtered Rooms in list view
  const filteredRooms = meetingRooms.filter((room) => {
    const matchSearch =
      room.title.toLowerCase().includes(roomSearchQuery.toLowerCase()) ||
      room.roomCode.toLowerCase().includes(roomSearchQuery.toLowerCase()) ||
      room.chairPerson?.toLowerCase().includes(roomSearchQuery.toLowerCase()) ||
      room.unitTarget?.toLowerCase().includes(roomSearchQuery.toLowerCase());
    const matchStatus = roomStatusFilter === 'all' || room.status === roomStatusFilter;
    return matchSearch && matchStatus;
  });

  // Print / Export Meeting Minutes
  const handlePrintMeetingMinutes = (room: MeetingRoomItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Vui lòng cho phép mở cửa sổ popup để in biên bản hội nghị!');
      return;
    }

    const docsList = room.documents || meetingDocuments;
    let docsHtml = '';
    docsList.forEach((doc, idx) => {
      const votes = (Object.values(room.votes || {}) as MeetingVote[]).filter((v) =>
        v.docId !== undefined ? v.docId === doc.id : idx === 0
      );
      const agree = votes.filter((v) => v.choice === 'Tán thành').length;
      const disagree = votes.filter((v) => v.choice === 'Không tán thành').length;
      const other = votes.filter((v) => v.choice === 'Ý kiến khác' || v.choice === 'Có ý kiến khác').length;
      const pct = totalEligible > 0 ? Math.round((agree / totalEligible) * 100) : 0;

      docsHtml += `
        <tr>
          <td style="border: 1px solid #333; padding: 6px; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #333; padding: 6px; font-weight: bold;">${doc.code || `VB-${idx + 1}`}</td>
          <td style="border: 1px solid #333; padding: 6px;">${doc.title} (${doc.category})</td>
          <td style="border: 1px solid #333; padding: 6px; text-align: center; color: green; font-weight: bold;">${agree}/${totalEligible} (${pct}%)</td>
          <td style="border: 1px solid #333; padding: 6px; text-align: center; color: red;">${disagree}</td>
          <td style="border: 1px solid #333; padding: 6px; text-align: center; color: orange;">${other}</td>
          <td style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold;">${pct >= 66 ? 'THÔNG QUA' : 'CHƯA THÔNG QUA'}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Biên bản Hội nghị Đảng ủy - ${room.roomCode}</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.4; padding: 30px; }
          .header-table { width: 100%; margin-bottom: 20px; }
          .title { text-align: center; font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 20px 0; color: #831843; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .sign-table { width: 100%; margin-top: 40px; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="text-align: center; vertical-align: top; width: 45%;">
              <strong>ĐẢNG BỘ SƯ ĐOÀN 10</strong><br>
              <strong>${room.unitTarget?.toUpperCase() || 'ĐẢNG ỦY SƯ ĐOÀN'}</strong><br>
              Số: ${room.roomCode}
            </td>
            <td style="text-align: center; vertical-align: top; width: 55%;">
              <strong>ĐẢNG CỘNG SẢN VIỆT NAM</strong><br>
              <em>Kon Tum, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</em>
            </td>
          </tr>
        </table>

        <div class="title">BIÊN BẢN HỘI NGHỊ ĐẢNG ỦY</div>
        <p style="text-align: center; font-weight: bold; font-style: italic;">(${room.title} - ${room.sessionNumber})</p>

        <p><strong>1. Thời gian bắt đầu:</strong> ${room.startTime || 'Theo kế hoạch'}</p>
        <p><strong>2. Thời gian kết thúc:</strong> ${room.endTime || 'Đang diễn ra / Chưa bế mạc'}</p>
        <p><strong>3. Chủ trì hội nghị:</strong> ${room.chairPerson}</p>
        <p><strong>4. Thư ký hội nghị:</strong> ${room.secretary}</p>
        <p><strong>5. Thành phần tham dự:</strong> Có mặt ${totalEligible}/${totalEligible} đồng chí Đảng ủy viên (đạt 100%).</p>

        <p><strong>6. NỘI DUNG VÀ KẾT QUẢ BIỂU QUYẾT TỪNG VĂN BẢN:</strong></p>
        <table>
          <thead>
            <tr style="background-color: #f0f0f0;">
              <th style="border: 1px solid #333; padding: 6px;">STT</th>
              <th style="border: 1px solid #333; padding: 6px;">Ký hiệu</th>
              <th style="border: 1px solid #333; padding: 6px;">Tên văn bản / Nghị quyết</th>
              <th style="border: 1px solid #333; padding: 6px;">Tán thành</th>
              <th style="border: 1px solid #333; padding: 6px;">Không tán thành</th>
              <th style="border: 1px solid #333; padding: 6px;">Ý kiến khác</th>
              <th style="border: 1px solid #333; padding: 6px;">Kết luận</th>
            </tr>
          </thead>
          <tbody>
            ${docsHtml}
          </tbody>
        </table>

        <p style="margin-top: 25px;"><strong>7. KẾT LUẬN CỦA ĐỒNG CHÍ CHỦ TRÌ:</strong></p>
        <p>- Hội nghị đã hoàn thành toàn bộ chương trình làm việc với tinh thần nghiêm túc, dân chủ và trách nhiệm cao.</p>
        <p>- Yêu cầu các cấp ủy, chi bộ trực thuộc quán triệt và triển khai thực hiện thắng lợi các nội dung Nghị quyết đã được thông qua.</p>

        <table class="sign-table">
          <tr>
            <td style="text-align: center; width: 50%;">
              <strong>THƯ KÝ HỘI NGHỊ</strong><br><br><br><br>
              <strong>${room.secretary}</strong>
            </td>
            <td style="text-align: center; width: 50%;">
              <strong>CHỦ TRÌ HỘI NGHỊ</strong><br>
              <em>(Ký, ghi rõ họ tên)</em><br><br><br><br>
              <strong>${room.chairPerson}</strong>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // =========================================================================
  // VIEW 1: ROOMS OVERVIEW & MANAGEMENT LIST (Up to 30 rooms)
  // =========================================================================
  if (!activeRoomId || !currentRoom) {
    return (
      <div className="space-y-4">
        {/* 1. Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 pb-2 border-b border-gray-200">
          <button
            type="button"
            onClick={onGoHome}
            className="hover:text-pink-900 flex items-center gap-1 cursor-pointer font-medium"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </button>
          <span>/</span>
          <span className="text-pink-950 font-bold">Phòng Họp Đảng ủy Trực tuyến</span>
          <span>/</span>
          <span className="text-gray-700 font-semibold">Danh sách phòng họp (Tối đa 30 phòng)</span>
        </nav>

        {/* 2. Banner Header */}
        <div className="bg-gradient-to-r from-[#831843] via-[#701a75] to-[#500724] text-white p-5 rounded-2xl shadow-md border-b-4 border-amber-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-white/10 border border-amber-400/30 text-amber-300 shrink-0 shadow-inner">
              <Landmark className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase bg-amber-400 text-red-950 px-2 py-0.5 rounded shadow-2xs">
                  HỆ THỐNG PHÒNG HỌP SỐ CẤP ỦY
                </span>
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded font-bold">
                  Đang mở: {meetingRooms.length}/{MAX_ROOMS} phòng họp
                </span>
                {canCreateMeeting && (
                  <span className="text-[10px] bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 px-2 py-0.5 rounded font-bold">
                    Có quyền tạo phòng
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black uppercase text-amber-300 tracking-wide mt-1">
                TRUNG TÂM PHÒNG HỌP ĐẢNG ỦY SƯ ĐOÀN 10
              </h2>
              <p className="text-xs text-pink-100 mt-0.5">
                Không gian số hóa, lưu trữ tài liệu mật, thảo luận và biểu quyết điện tử trực tuyến cho các cấp ủy Đảng.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
            {isAdmin && onOpenTabIntroModal && (
              <button
                type="button"
                onClick={() => onOpenTabIntroModal('meeting')}
                className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer shadow-xs"
                title="Chỉnh sửa tiêu đề và phần giới thiệu tab"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                <span>Sửa giới thiệu</span>
              </button>
            )}

            {canCreateMeeting ? (
              <button
                type="button"
                onClick={handleOpenCreateRoomModal}
                disabled={meetingRooms.length >= MAX_ROOMS}
                className={`text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                  meetingRooms.length >= MAX_ROOMS
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-75'
                    : 'bg-amber-400 hover:bg-amber-300 text-red-950 hover:shadow-lg'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>+ TẠO PHÒNG HỌP MỚI ({meetingRooms.length}/{MAX_ROOMS})</span>
              </button>
            ) : (
              <div className="text-[11px] bg-white/10 px-3 py-1.5 rounded-lg border border-white/15 text-pink-100">
                * Chỉ Admin và cán bộ được phân quyền mới có thể tạo phòng họp
              </div>
            )}
          </div>
        </div>

        {/* 3. Search & Filter Bar */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={roomSearchQuery}
              onChange={(e) => setRoomSearchQuery(e.target.value)}
              placeholder="Tìm kiếm phòng họp theo mã phòng, tên hội nghị, đơn vị hoặc chủ trì..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-pink-700 focus:outline-hidden font-medium"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold shrink-0">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'in_progress', label: 'Đang diễn ra' },
              { id: 'scheduled', label: 'Đã lên lịch' },
              { id: 'ended', label: 'Đã kết thúc' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setRoomStatusFilter(st.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  roomStatusFilter === st.id
                    ? 'bg-[#831843] text-white shadow-xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Rooms Grid (Up to 30 simultaneous rooms) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300 space-y-3">
              <Landmark className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="font-extrabold text-sm text-gray-700">Không tìm thấy phòng họp Đảng ủy nào</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Không có phòng họp phù hợp với bộ lọc tìm kiếm. Hãy thử từ khóa khác hoặc bấm tạo phòng họp mới.
              </p>
              {canCreateMeeting && (
                <button
                  type="button"
                  onClick={handleOpenCreateRoomModal}
                  className="mt-2 bg-[#831843] hover:bg-[#701a75] text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo phòng họp Đảng ủy</span>
                </button>
              )}
            </div>
          ) : (
            filteredRooms.map((room) => {
              const docsCount = (room.documents || meetingDocuments).length;
              const votesCount = Object.keys(room.votes || {}).length;
              const isUnlocked = isRoomUnlocked(room);

              return (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all border border-gray-200 hover:border-pink-300 flex flex-col justify-between overflow-hidden group"
                >
                  {/* Top Bar of Card */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-xs text-pink-900 bg-pink-100 px-2 py-0.5 rounded-md border border-pink-200">
                          {room.roomCode}
                        </span>
                        {room.status === 'in_progress' ? (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                            <span>ĐANG DIỄN RA</span>
                          </span>
                        ) : room.status === 'scheduled' ? (
                          <span className="text-[10px] font-bold uppercase text-blue-800 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md">
                            ĐÃ LÊN LỊCH
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                            ĐÃ KẾT THÚC
                          </span>
                        )}
                      </div>

                      {/* Password Protection Badge */}
                      <span
                        className={`p-1 rounded-md text-[10px] flex items-center gap-1 ${
                          room.passwordRequired
                            ? isUnlocked
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-800'
                            : 'bg-gray-50 text-gray-500'
                        }`}
                        title={room.passwordRequired ? 'Có mật khẩu bảo vệ' : 'Phòng mở'}
                      >
                        {room.passwordRequired ? (
                          isUnlocked ? (
                            <Unlock className="w-3.5 h-3.5" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-amber-700" />
                          )
                        ) : (
                          <Shield className="w-3.5 h-3.5" />
                        )}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-pink-800 font-bold block mb-0.5">
                        {room.sessionNumber || 'KỲ HỌP CẤP ỦY'}
                      </span>
                      <h3 className="font-extrabold text-sm text-gray-900 leading-snug group-hover:text-pink-900 transition-colors line-clamp-2">
                        {room.title}
                      </h3>
                      {room.description && (
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {room.description}
                        </p>
                      )}
                    </div>

                    {/* Meta stats */}
                    <div className="bg-gray-50 rounded-xl p-2.5 text-[11px] text-gray-600 space-y-1.5 border border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Chủ trì:</span>
                        <span className="font-bold text-gray-900 truncate max-w-[170px]">
                          {room.chairPerson}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Thư ký:</span>
                        <span className="font-medium text-gray-800 truncate max-w-[170px]">
                          {room.secretary}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-pink-700" />
                          <span>Thời gian:</span>
                        </span>
                        <span className="font-bold text-gray-900">
                          {room.startTime ? room.startTime.split(' ')[0] : 'Theo kế hoạch'}
                        </span>
                      </div>
                      {room.endTime && (
                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                          <span>Kết thúc:</span>
                          <span className="font-semibold text-gray-700">{room.endTime}</span>
                        </div>
                      )}
                    </div>

                    {/* Badges: Documents & Votes count */}
                    <div className="flex items-center justify-between text-[10px] pt-1">
                      <span className="flex items-center gap-1 font-bold text-pink-900 bg-pink-50 px-2 py-0.5 rounded border border-pink-100">
                        <FileText className="w-3 h-3 text-pink-700" />
                        <span>{docsCount} văn kiện/nghị quyết</span>
                      </span>
                      <span className="flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        <Vote className="w-3 h-3 text-emerald-600" />
                        <span>{votesCount} lượt bỏ phiếu</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="p-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveRoomId(room.id)}
                      className="flex-1 bg-[#831843] hover:bg-[#701a75] text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <span>VÀO PHÒNG HỌP</span>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-300" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePrintMeetingMinutes(room)}
                      className="p-2 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors cursor-pointer"
                      title="In / Xuất biên bản hội nghị"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {(isAdmin || room.createdByUserId === currentUser?.id) && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEditRoomModal(room)}
                          className="p-2 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors cursor-pointer"
                          title="Cấu hình / Sửa thông tin phòng họp"
                        >
                          <Settings className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        {confirmDeleteRoomId === room.id ? (
                          <div className="flex items-center gap-1 bg-red-50 p-1 rounded-xl border border-red-200">
                            <button
                              type="button"
                              onClick={() => handleDeleteRoom(room)}
                              className="px-2 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-[10px] font-bold shadow-xs cursor-pointer"
                            >
                              Xác nhận xóa
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteRoomId(null)}
                              className="px-1.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-[10px] font-bold cursor-pointer"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteRoomId(room.id)}
                            className="p-2 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-200 transition-colors cursor-pointer"
                            title="Xóa phòng họp này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* CREATE / EDIT ROOM MODAL */}
        {isRoomModalOpen && (
          <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-[#831843] text-white p-4 px-5 flex items-center justify-between border-b-2 border-amber-400">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                  <Landmark className="w-4 h-4" />
                  <span>
                    {editingRoomId ? 'CHỈNH SỬA THÔNG TIN PHÒNG HỌP ĐẢNG ỦY' : 'KHỞI TẠO PHÒNG HỌP ĐẢNG ỦY MỚI'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveRoomForm} className="p-5 overflow-y-auto space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Mã ký hiệu phòng họp (*):
                    </label>
                    <input
                      type="text"
                      value={roomFormCode}
                      onChange={(e) => setRoomFormCode(e.target.value)}
                      placeholder="Ví dụ: PH-ĐU-01, PH-E28-02..."
                      className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-pink-700 focus:outline-hidden font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Trạng thái phiên họp (*):
                    </label>
                    <select
                      value={roomFormStatus}
                      onChange={(e) => setRoomFormStatus(e.target.value as any)}
                      className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-pink-700 focus:outline-hidden font-bold"
                    >
                      <option value="in_progress">🟢 Đang diễn ra</option>
                      <option value="scheduled">🔵 Đã lên lịch</option>
                      <option value="ended">⚪ Đã kết thúc</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Tên Hội nghị / Tiêu đề phiên họp (*):
                  </label>
                  <input
                    type="text"
                    value={roomFormTitle}
                    onChange={(e) => setRoomFormTitle(e.target.value)}
                    placeholder="Ví dụ: Hội nghị Ban Thường vụ Đảng ủy Sư đoàn 10..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-pink-700 focus:outline-hidden font-bold text-gray-900"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Kỳ họp / Số phiên:
                    </label>
                    <input
                      type="text"
                      value={roomFormSessionNumber}
                      onChange={(e) => setRoomFormSessionNumber(e.target.value)}
                      placeholder="Ví dụ: Kỳ họp thứ 15 - Khóa XII"
                      className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-pink-700 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Đơn vị / Cấp ủy tổ chức:
                    </label>
                    <input
                      type="text"
                      value={roomFormUnitTarget}
                      onChange={(e) => setRoomFormUnitTarget(e.target.value)}
                      placeholder="Ví dụ: Đảng ủy Sư đoàn 10, Đảng ủy e28..."
                      className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-pink-700 focus:outline-hidden font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Chủ trì hội nghị:
                    </label>
                    <input
                      type="text"
                      value={roomFormChairPerson}
                      onChange={(e) => setRoomFormChairPerson(e.target.value)}
                      className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-pink-700 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Thư ký hội nghị:
                    </label>
                    <input
                      type="text"
                      value={roomFormSecretary}
                      onChange={(e) => setRoomFormSecretary(e.target.value)}
                      className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-pink-700 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                {/* Start & End Times */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-pink-50/50 p-3 rounded-xl border border-pink-100">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Thời gian bắt đầu:
                    </label>
                    <input
                      type="text"
                      value={roomFormStartTime}
                      onChange={(e) => setRoomFormStartTime(e.target.value)}
                      placeholder="Ví dụ: 08:00 20/08/2026"
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:border-pink-700 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Thời gian kết thúc:
                    </label>
                    <input
                      type="text"
                      value={roomFormEndTime}
                      onChange={(e) => setRoomFormEndTime(e.target.value)}
                      placeholder="Ví dụ: 11:30 20/08/2026 (hoặc để trống)"
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:border-pink-700 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Mô tả mục đích / Trọng tâm hội nghị:
                  </label>
                  <textarea
                    value={roomFormDescription}
                    onChange={(e) => setRoomFormDescription(e.target.value)}
                    rows={2}
                    placeholder="Mô tả tóm tắt nội dung làm việc..."
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-pink-700 focus:outline-hidden resize-none"
                  />
                </div>

                {/* Password Setting */}
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                      <span>Bảo vệ phòng họp bằng mật khẩu:</span>
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roomFormPasswordRequired}
                        onChange={(e) => setRoomFormPasswordRequired(e.target.checked)}
                        className="w-4 h-4 text-pink-700 rounded cursor-pointer"
                      />
                      <span className="font-bold text-amber-900 text-[11px]">Bật mật khẩu</span>
                    </label>
                  </div>
                  {roomFormPasswordRequired && (
                    <input
                      type="text"
                      value={roomFormPassword}
                      onChange={(e) => setRoomFormPassword(e.target.value)}
                      placeholder="Mật khẩu vào phòng (mặc định: 1945)..."
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg focus:border-pink-700 focus:outline-hidden font-mono font-bold text-xs"
                      required
                    />
                  )}
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsRoomModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#831843] hover:bg-[#701a75] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-amber-300" />
                    <span>{editingRoomId ? 'LƯU THAY ĐỔI' : 'TẠO PHÒNG HỌP'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: PASSWORD UNLOCK SCREEN FOR SPECIFIC ROOM
  // =========================================================================
  if (!isRoomUnlocked(currentRoom)) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-pink-200 max-w-md w-full p-6 space-y-5 text-center">
          <button
            type="button"
            onClick={() => setActiveRoomId(null)}
            className="text-xs text-gray-500 hover:text-pink-900 font-bold flex items-center gap-1 cursor-pointer mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại danh sách các phòng họp</span>
          </button>

          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto text-pink-800 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="font-mono text-xs font-black text-pink-900 bg-pink-100 px-2.5 py-0.5 rounded-md">
              {currentRoom.roomCode}
            </span>
            <h2 className="text-base sm:text-lg font-black uppercase text-pink-950">
              {currentRoom.title}
            </h2>
            <p className="text-xs text-gray-500">
              Phòng họp này được bảo vệ theo chế độ Mật của Ban Thường vụ Đảng ủy Sư đoàn 10.
            </p>
          </div>

          <form onSubmit={(e) => handleUnlockRoom(e, currentRoom)} className="space-y-3 pt-2">
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-gray-700 block">
                Nhập mật khẩu phiên họp:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Nhập mã bảo mật..."
                  className="w-full p-3 pl-9 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:border-pink-700 focus:outline-hidden font-mono text-center font-black text-sm tracking-widest"
                  autoFocus
                />
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              </div>
              {passwordError && (
                <p className="text-xs text-red-600 font-semibold pt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#831843] hover:bg-[#701a75] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer text-xs"
            >
              <Unlock className="w-4 h-4 text-amber-300" />
              <span>XÁC NHẬN VÀO PHÒNG HỌP</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: ACTIVE MEETING ROOM INTERFACE (3-COLUMN WORKSPACE)
  // =========================================================================
  return (
    <div className="space-y-4">
      {/* 1. Breadcrumb & Room Switcher */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-gray-200 text-xs">
        <nav className="flex items-center gap-1.5 text-gray-500">
          <button
            type="button"
            onClick={onGoHome}
            className="hover:text-pink-900 flex items-center gap-1 cursor-pointer font-medium"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => setActiveRoomId(null)}
            className="hover:text-pink-900 font-bold cursor-pointer text-pink-950"
          >
            Phòng Họp Đảng ủy ({meetingRooms.length}/30)
          </button>
          <span>/</span>
          <span className="text-gray-700 font-bold truncate max-w-xs">
            {currentRoom.roomCode}: {currentRoom.title}
          </span>
        </nav>

        <div className="flex items-center gap-2">
          {/* Quick Room Switcher */}
          <select
            value={currentRoom.id}
            onChange={(e) => setActiveRoomId(e.target.value)}
            className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-900 text-[11px] font-bold rounded-lg px-2 py-1 focus:outline-hidden cursor-pointer"
          >
            {meetingRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.roomCode} - {r.title.slice(0, 35)}...
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setActiveRoomId(null)}
            className="bg-pink-50 hover:bg-pink-100 text-pink-900 text-xs font-bold px-2.5 py-1 rounded-lg border border-pink-200 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Danh sách 30 phòng</span>
          </button>
        </div>
      </div>

      {/* 2. Room Banner Header & Controls */}
      <div className="bg-gradient-to-r from-[#831843] via-[#701a75] to-[#500724] text-white p-4 sm:p-5 rounded-2xl shadow-md border-b-4 border-amber-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-white/10 border border-amber-400/30 text-amber-300 shrink-0">
            <Landmark className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] font-black uppercase bg-amber-400 text-red-950 px-2 py-0.5 rounded shadow-2xs">
                {currentRoom.roomCode}
              </span>
              <span className="text-[10px] font-extrabold uppercase bg-white/20 text-white px-2 py-0.5 rounded">
                {currentRoom.sessionNumber || 'KỲ HỌP ĐỊNH KỲ'}
              </span>
              {currentRoom.status === 'in_progress' ? (
                <span className="text-[10px] bg-emerald-400 text-red-950 px-2 py-0.5 rounded font-black flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-900 inline-block" />
                  <span>ĐANG DIỄN RA</span>
                </span>
              ) : currentRoom.status === 'scheduled' ? (
                <span className="text-[10px] bg-blue-300 text-blue-950 px-2 py-0.5 rounded font-black">
                  ĐÃ LÊN LỊCH
                </span>
              ) : (
                <span className="text-[10px] bg-gray-300 text-gray-900 px-2 py-0.5 rounded font-black">
                  ĐÃ BẾ MẠC / KẾT THÚC
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-black uppercase text-amber-300 tracking-wide mt-1">
              {currentRoom.title}
            </h2>
            <div className="text-[11px] text-pink-100 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              <span>Chủ trì: <strong>{currentRoom.chairPerson}</strong></span>
              <span>Thư ký: <strong>{currentRoom.secretary}</strong></span>
              <span>Bắt đầu: <strong>{currentRoom.startTime || 'Chưa bắt đầu'}</strong></span>
              {currentRoom.endTime && (
                <span>Kết thúc: <strong>{currentRoom.endTime}</strong></span>
              )}
              <span>Quân số: <strong>{eligibleVoters.length} Đảng ủy viên</strong></span>
            </div>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
          {/* Realtime Online Presence Pill */}
          <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{onlineMembers.length} trực tuyến</span>
          </div>

          {/* Start / End Meeting Buttons */}
          {canManageActiveRoom && currentRoom.status === 'scheduled' && (
            <button
              type="button"
              onClick={() => handleStartMeetingNow(currentRoom)}
              className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-black px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>BẮT ĐẦU CUỘC HỌP</span>
            </button>
          )}

          {canManageActiveRoom && currentRoom.status === 'in_progress' && (
            <button
              type="button"
              onClick={() => handleEndMeetingNow(currentRoom)}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-black px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>BẾ MẠC / KẾT THÚC</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handlePrintMeetingMinutes(currentRoom)}
            className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer shadow-xs"
            title="In / Xuất biên bản hội nghị"
          >
            <Printer className="w-3.5 h-3.5 text-amber-300" />
            <span>In biên bản</span>
          </button>

          {canManageActiveRoom && (
            <button
              type="button"
              onClick={() => handleOpenEditRoomModal(currentRoom)}
              className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer shadow-xs"
            >
              <Settings className="w-3.5 h-3.5 text-amber-300" />
              <span>Cài đặt phòng</span>
            </button>
          )}

          {canUpload && (
            <button
              type="button"
              onClick={() => setIsAddDocModalOpen(true)}
              className="bg-amber-400 hover:bg-amber-300 text-red-950 text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <FilePlus className="w-4 h-4" />
              <span>+ THÊM VĂN BẢN</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. THREE-COLUMN MEETING WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* =========================================================================
            COLUMN 1 (LEFT - 3 COLS): KHO VĂN BẢN HỌP CỦA PHÒNG
           ========================================================================= */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="font-black text-gray-900 text-xs flex items-center gap-1.5">
                <FolderLock className="w-4 h-4 text-pink-700" />
                <span>KHO VĂN BẢN ({currentRoomDocs.length})</span>
              </div>
              {canUpload && (
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(true)}
                  className="text-[10px] text-pink-800 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nạp VB</span>
                </button>
              )}
            </div>

            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
                placeholder="Tìm văn bản nghị quyết..."
                className="w-full pl-7 pr-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-pink-700 focus:outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2" />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-[10px] font-bold">
              {['ALL', 'Nghị quyết', 'Báo cáo', 'Kế hoạch', 'Tờ trình'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setDocCategoryFilter(cat)}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer shrink-0 ${
                    docCategoryFilter === cat
                      ? 'bg-[#831843] text-white font-black'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'ALL' ? 'Tất cả' : cat}
                </button>
              ))}
            </div>

            {/* Documents Scrollable List */}
            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
              {filteredDocs.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs">
                  Không tìm thấy tài liệu
                </div>
              ) : (
                filteredDocs.map((doc, idx) => {
                  const isActive = doc.id === activeDocument?.id;
                  const docVotes = getVotesForDoc(doc.id);
                  const docAgree = docVotes.filter((v) => v.choice === 'Tán thành').length;
                  const docPercent =
                    totalEligible > 0 ? Math.round((docAgree / totalEligible) * 100) : 0;
                  const hasVoted = docVotes.length > 0;
                  const myVoteOnThis = currentUser
                    ? docVotes.find((v) => v.userId === currentUser.id)
                    : undefined;
                  const docLock = docLocks[doc.id];

                  return (
                    <div
                      key={doc.id}
                      onClick={() => setActiveDocId(doc.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer relative group ${
                        isActive
                          ? 'border-pink-700 bg-pink-50/70 shadow-xs ring-1 ring-pink-700'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[9px] font-mono font-black text-pink-900 bg-pink-100 px-1 py-0.5 rounded">
                            {doc.code || `VB-${idx + 1}`}
                          </span>
                          <span
                            className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase ${
                              doc.category === 'Nghị quyết'
                                ? 'bg-red-100 text-red-800'
                                : doc.category === 'Báo cáo'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {doc.category}
                          </span>
                        </div>

                        {/* Real-time Editing Lock Badge on Document */}
                        {docLock && (
                          <span className="text-[8px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
                            <Lock className="w-2.5 h-2.5 text-amber-700" />
                            <span>Đang sửa: {docLock.userName}</span>
                          </span>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDoc(doc);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-0.5 rounded hover:bg-red-50 transition-opacity cursor-pointer"
                            title="Xóa văn bản này"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <h4 className="font-bold text-xs text-gray-900 mt-1 leading-snug line-clamp-2">
                        {doc.title}
                      </h4>

                      {/* Vote tally pill on document */}
                      <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between gap-1 text-[9px] flex-wrap">
                        <div className="flex items-center gap-1">
                          {hasVoted ? (
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 ${
                                docPercent >= 100
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : docPercent >= 66
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              <CheckCircle className="w-2.5 h-2.5" />
                              <span>Tán thành: {docAgree}/{totalEligible} ({docPercent}%)</span>
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Chưa có biểu quyết</span>
                          )}
                        </div>

                        {myVoteOnThis && (
                          <span
                            className={`font-black px-1 py-0.5 rounded ${
                              myVoteOnThis.choice === 'Tán thành'
                                ? 'bg-emerald-50 text-emerald-700'
                                : myVoteOnThis.choice === 'Không tán thành'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            ✓ {myVoteOnThis.choice}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            COLUMN 2 (MIDDLE - 6 COLS): SOẠN THẢO / ĐỌC VĂN KIỆN (WITH DOCUMENT LOCK)
           ========================================================================= */}
        <div className="lg:col-span-6 space-y-3">
          {/* Document Editing Lock Warning Banner */}
          {(() => {
            const activeLock = activeDocument ? docLocks[activeDocument.id] : undefined;
            const isLockedByOther = !!(activeLock && activeLock.userId !== currentUser?.id);

            if (isLockedByOther) {
              return (
                <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl flex items-center justify-between text-amber-900 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 animate-bounce" />
                    <div>
                      <div className="font-extrabold text-xs">
                        ⚠️ Đồng chí {activeLock.userName} ({activeLock.userRankUnit || 'Đảng ủy viên'}) đang chỉnh sửa văn bản này...
                      </div>
                      <div className="text-[11px] text-amber-800">
                        Để bảo đảm tính toàn vẹn dữ liệu, chức năng chỉnh sửa tạm thời bị khóa. Vui lòng đợi đồng chí ấy lưu xong.
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-black shrink-0">
                    ĐANG KHÓA
                  </span>
                </div>
              );
            }

            if (isCurrentlyEditing) {
              return (
                <div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 rounded-r-xl flex items-center justify-between text-emerald-950 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <FileEdit className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-extrabold text-xs">
                        ✏️ Đồng chí đang trong chế độ CHỈNH SỬA VĂN BẢN (Đã khóa quyền sửa của các thành viên khác)
                      </div>
                      <div className="text-[11px] text-emerald-800">
                        Sau khi hoàn tất, vui lòng bấm <strong>[LƯU VĂN BẢN]</strong> hoặc <strong>[HỦY CHỈNH SỬA]</strong> để giải phóng khóa.
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })()}

          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
            {/* Toolbar & Header */}
            <div className="bg-gray-50 border-b border-gray-200 p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-pink-900 bg-pink-100 px-2 py-0.5 rounded">
                    {activeDocument?.code}
                  </span>
                  <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 line-clamp-1">
                    {activeDocument?.title}
                  </h3>
                </div>

                {/* Edit & Save Action Buttons */}
                <div className="flex items-center gap-2">
                  {(() => {
                    const activeLock = activeDocument ? docLocks[activeDocument.id] : undefined;
                    const isLockedByOther = !!(activeLock && activeLock.userId !== currentUser?.id);

                    if (isCurrentlyEditing) {
                      return (
                        <>
                          <button
                            type="button"
                            onClick={handleCancelEditDoc}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>HỦY CHỈNH SỬA</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveActiveDoc}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                              isSavedRecently
                                ? 'bg-emerald-600 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {isSavedRecently ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            <span>{isSavedRecently ? 'ĐÃ LƯU & MỞ KHÓA' : 'LƯU VĂN BẢN (XONG)'}</span>
                          </button>
                        </>
                      );
                    }

                    if (isLockedByOther) {
                      return (
                        <button
                          type="button"
                          disabled
                          className="px-3 py-1.5 rounded-lg text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5 cursor-not-allowed opacity-80"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-700" />
                          <span>ĐANG KHÓA (Đ/C {activeLock?.userName} ĐANG SỬA)</span>
                        </button>
                      );
                    }

                    return (
                      <button
                        type="button"
                        onClick={handleStartEditDoc}
                        className="px-3 py-1.5 rounded-lg text-xs font-black bg-[#831843] hover:bg-[#701a75] text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                        <span>✏️ BẮT ĐẦU CHỈNH SỬA VĂN BẢN</span>
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between text-[11px] text-gray-600 bg-white p-2 rounded-lg border border-gray-200 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {isCurrentlyEditing ? (
                    <span className="flex items-center gap-1 text-emerald-700 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                      <span>Đang mở chế độ soạn thảo (Đã khóa chỉnh sửa cho người khác)</span>
                    </span>
                  ) : (
                    <span className="text-gray-500 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Chế độ đọc văn kiện</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-500 font-medium">Đảng ủy viên:</span>
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {eligibleVoters.slice(0, 4).map((voter) => (
                      <img
                        key={voter.id}
                        src={voter.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                        alt={voter.fullName}
                        title={`${voter.fullName} (${voter.rankUnit})`}
                        className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Formatting Toolbar (Only active during editing) */}
              {isCurrentlyEditing && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-gray-200">
                  <input
                    type="file"
                    ref={wordImportInputRef}
                    onChange={handleWordImport}
                    accept=".docx"
                    className="hidden"
                  />

                  <div className="flex items-center bg-white border border-gray-300 rounded-lg p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleFormat('bold')}
                      className="p-1.5 hover:bg-gray-100 rounded text-gray-700 cursor-pointer"
                      title="In đậm (Ctrl+B)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormat('italic')}
                      className="p-1.5 hover:bg-gray-100 rounded text-gray-700 cursor-pointer"
                      title="In nghiêng (Ctrl+I)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormat('underline')}
                      className="p-1.5 hover:bg-gray-100 rounded text-gray-700 cursor-pointer"
                      title="Gạch chân (Ctrl+U)"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <button
                      type="button"
                      onClick={handleHighlight}
                      className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded text-[11px] flex items-center gap-1 cursor-pointer"
                      title="Bôi đen văn bản để đánh dấu ý kiến đóng góp"
                    >
                      <Highlighter className="w-3 h-3 text-amber-700" />
                      <span>Đánh dấu góp ý</span>
                    </button>
                  </div>

                  {canUpload && (
                    <button
                      type="button"
                      onClick={() => wordImportInputRef.current?.click()}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      title="Nhập đè nội dung từ tệp Word (.docx)"
                    >
                      <FileUp className="w-3.5 h-3.5" />
                      <span>Nạp Word (.docx)</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Document Content Area */}
            <div className="p-5 bg-white min-h-[420px] max-h-[580px] overflow-y-auto">
              <div
                ref={editorRef}
                contentEditable={isCurrentlyEditing}
                suppressContentEditableWarning
                className={`party-meeting-content outline-none text-xs text-gray-800 leading-relaxed font-sans space-y-3 ${
                  isCurrentlyEditing ? 'focus:ring-2 focus:ring-pink-300 p-2 rounded-lg border border-dashed border-pink-200 bg-pink-50/20' : ''
                }`}
              />
            </div>

            <div className="bg-gray-50 border-t border-gray-200 p-2.5 px-4 text-[11px] text-gray-500 flex items-center justify-between">
              <span>Hỗ trợ định dạng: Tiêu đề, bảng biểu, trích yếu, điều khoản</span>
              <span className="text-pink-900 font-bold">{activeDocument?.category}</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            COLUMN 3 (RIGHT - 3 COLS): THÀNH VIÊN TRỰC TUYẾN (PRESENCE) & BIỂU QUYẾT
           ========================================================================= */}
        <div className="lg:col-span-3 space-y-3">
          {/* Real-time Online Attendees (Supabase Presence) */}
          <div className="bg-white rounded-2xl shadow-xs border border-emerald-200 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
              <div className="flex items-center gap-1.5 text-emerald-900 font-black text-xs">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>ĐANG TRỰC TUYẾN ({onlineMembers.length})</span>
              </div>
              <span className="text-[9px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                Thời gian thực
              </span>
            </div>

            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-0.5">
              {onlineMembers.length === 0 ? (
                <div className="text-gray-400 text-xs italic text-center py-2">
                  Chưa có thành viên trực tuyến
                </div>
              ) : (
                onlineMembers.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-[11px]"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="relative shrink-0">
                        <img
                          src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                          alt={member.userName}
                          className="w-5 h-5 rounded-full object-cover ring-1 ring-emerald-400"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-gray-900 truncate leading-tight">
                          {member.userName}
                          {currentUser?.id === member.userId && (
                            <span className="text-[9px] text-pink-700 font-bold ml-1">(Tôi)</span>
                          )}
                        </div>
                        <div className="text-[9px] text-gray-500 truncate">{member.rankUnit || 'Đảng ủy viên'}</div>
                      </div>
                    </div>
                    <span className="text-[8px] font-mono text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded shrink-0 font-bold">
                      ONLINE
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Voting Box */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Vote className="w-4 h-4 text-pink-700" />
                <h3 className="font-extrabold text-xs text-gray-900 uppercase">
                  BIỂU QUYẾT ({totalVoted}/{totalEligible})
                </h3>
              </div>
              {isAdmin && onResetVotes && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeDocument && confirm(`Đồng chí có chắc muốn làm mới biểu quyết cho văn bản "${activeDocument.title}"?`)) {
                      onResetVotes(activeDocument.id);
                    }
                  }}
                  className="text-[9px] text-pink-700 hover:text-pink-900 font-bold flex items-center gap-0.5 cursor-pointer bg-pink-50 hover:bg-pink-100 px-1.5 py-0.5 rounded border border-pink-200"
                  title="Làm mới phiếu cho văn bản này"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Làm mới</span>
                </button>
              )}
            </div>

            {/* Current Active Doc Title */}
            <div className="p-2 bg-pink-50/80 rounded-lg border border-pink-100 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-black text-[9px] bg-pink-800 text-white px-1.5 py-0.2 rounded">
                  {activeDocument?.code || 'VB'}
                </span>
                <span className="font-bold text-gray-900 line-clamp-1">
                  {activeDocument?.title}
                </span>
              </div>
            </div>

            {/* Current Voter Card */}
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-3 rounded-xl border border-pink-200 space-y-2">
              <div className="text-[11px] font-bold text-pink-950">
                Phiếu của đồng chí:
                <div className="text-gray-900 text-xs font-extrabold">
                  {currentUser?.fullName || 'Đảng ủy viên'}
                </div>
              </div>

              {currentVote ? (
                <div className="p-2 bg-white rounded-lg border border-pink-200 text-[11px]">
                  <span className="text-gray-500">Đã biểu quyết: </span>
                  <span
                    className={`font-black uppercase ${
                      currentVote.choice === 'Tán thành'
                        ? 'text-emerald-700'
                        : currentVote.choice === 'Không tán thành'
                        ? 'text-red-700'
                        : 'text-amber-700'
                    }`}
                  >
                    [{currentVote.choice}]
                  </span>
                  <div className="text-[10px] text-gray-400 mt-0.5">Lúc {currentVote.time}</div>
                </div>
              ) : (
                <p className="text-[10px] text-gray-500 italic">
                  Chưa bỏ phiếu cho văn bản này.
                </p>
              )}

              {/* Vote Choice Buttons */}
              <div className="grid grid-cols-1 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleVoteChoice('Tán thành')}
                  className={`w-full py-2 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    currentVote?.choice === 'Tán thành'
                      ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400'
                      : 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>TÁN THÀNH</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleVoteChoice('Không tán thành')}
                  className={`w-full py-2 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    currentVote?.choice === 'Không tán thành'
                      ? 'bg-red-600 text-white shadow-xs ring-2 ring-red-400'
                      : 'bg-white hover:bg-red-50 text-red-800 border border-red-300'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>KHÔNG TÁN THÀNH</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleVoteChoice('Ý kiến khác')}
                  className={`w-full py-2 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    currentVote?.choice === 'Ý kiến khác' || currentVote?.choice === 'Có ý kiến khác'
                      ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400'
                      : 'bg-white hover:bg-amber-50 text-amber-800 border border-amber-300'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>CÓ Ý KIẾN KHÁC</span>
                </button>
              </div>
            </div>

            {/* Voting Progress Tally */}
            <div className="space-y-2 pt-1 border-t border-gray-100">
              <div className="space-y-1 text-[11px] font-bold">
                <div className="flex items-center justify-between text-emerald-800">
                  <span>Tán thành:</span>
                  <span>{countAgree} ({percentAgree}%)</span>
                </div>
                <div className="flex items-center justify-between text-red-700">
                  <span>Không tán thành:</span>
                  <span>{countDisagree} ({percentDisagree}%)</span>
                </div>
                <div className="flex items-center justify-between text-amber-700">
                  <span>Ý kiến khác:</span>
                  <span>{countOther} ({percentOther}%)</span>
                </div>
              </div>

              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-600 transition-all duration-500"
                  style={{ width: `${totalEligible > 0 ? (countAgree / totalEligible) * 100 : 0}%` }}
                />
                <div
                  className="bg-red-600 transition-all duration-500"
                  style={{ width: `${totalEligible > 0 ? (countDisagree / totalEligible) * 100 : 0}%` }}
                />
                <div
                  className="bg-amber-500 transition-all duration-500"
                  style={{ width: `${totalEligible > 0 ? (countOther / totalEligible) * 100 : 0}%` }}
                />
              </div>

              <div className="text-[10px] text-gray-500 text-center font-semibold pt-1">
                {percentAgree >= 100
                  ? 'Đạt 100% nhất trí tuyệt đối'
                  : percentAgree >= 66
                  ? 'Đạt trên 2/3 số phiếu tán thành'
                  : 'Đang tiếp tục lấy ý kiến biểu quyết...'}
              </div>
            </div>

            {/* Roster of Cast Votes */}
            <div className="space-y-1.5 pt-2 border-t border-gray-100">
              <div className="text-[10px] font-extrabold uppercase text-gray-500 flex items-center justify-between">
                <span>Đảng ủy viên ({eligibleVoters.length}):</span>
                <span className="text-[9px] text-pink-700 font-bold">Tiến độ bỏ phiếu</span>
              </div>

              <div className="space-y-1 max-h-[150px] overflow-y-auto pr-0.5 text-[10px]">
                {eligibleVoters.map((voter) => {
                  const vote = activeDocVotes.find((v) => v.userId === voter.id);
                  return (
                    <div
                      key={voter.id}
                      className="p-1.5 rounded bg-gray-50 border border-gray-200 flex items-center justify-between"
                    >
                      <div className="truncate max-w-[120px]">
                        <span className="font-bold text-gray-900">{voter.fullName}</span>
                      </div>
                      {vote ? (
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                            vote.choice === 'Tán thành'
                              ? 'bg-emerald-100 text-emerald-800'
                              : vote.choice === 'Không tán thành'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {vote.choice}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-[9px]">Chưa bỏ phiếu</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SUMMARY TABLE FOR ALL DOCUMENTS IN CURRENT ROOM */}
      <div className="bg-white rounded-2xl shadow-xs border border-pink-200 overflow-hidden">
        <div className="bg-gradient-to-r from-[#831843] via-[#701a75] to-[#500724] text-white p-3.5 px-4 flex items-center justify-between flex-wrap gap-2 border-b-2 border-amber-400">
          <div className="flex items-center gap-2">
            <Vote className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm uppercase text-amber-300 tracking-wide">
                BẢNG TỔNG HỢP BIỂU QUYẾT TỪNG VĂN BẢN TRONG PHÒNG HỌP: {currentRoom.roomCode}
              </h3>
              <p className="text-[10px] text-pink-100">
                Thống kê tiến độ biểu quyết, tỷ lệ tán thành và kết luận thông qua cho từng văn kiện
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePrintMeetingMinutes(currentRoom)}
              className="bg-amber-400 hover:bg-amber-300 text-red-950 text-xs font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In biên bản tổng hợp</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 border-b border-gray-200 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3 text-center w-10">STT</th>
                <th className="py-2.5 px-3 w-28">Ký hiệu</th>
                <th className="py-2.5 px-3 min-w-[200px]">Tên văn bản / Nghị quyết</th>
                <th className="py-2.5 px-3 w-24">Phân loại</th>
                <th className="py-2.5 px-3 text-center w-28">Tiến độ bỏ phiếu</th>
                <th className="py-2.5 px-3 text-center w-28 text-emerald-800">Tán thành</th>
                <th className="py-2.5 px-3 text-center w-28 text-red-700">Không tán thành</th>
                <th className="py-2.5 px-3 text-center w-24 text-amber-700">Ý kiến khác</th>
                <th className="py-2.5 px-3 text-center w-36">Kết luận thông qua</th>
                <th className="py-2.5 px-3 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentRoomDocs.map((doc, idx) => {
                const docVotes = getVotesForDoc(doc.id);
                const agreeCount = docVotes.filter((v) => v.choice === 'Tán thành').length;
                const disagreeCount = docVotes.filter((v) => v.choice === 'Không tán thành').length;
                const otherCount = docVotes.filter(
                  (v) => v.choice === 'Ý kiến khác' || v.choice === 'Có ý kiến khác'
                ).length;
                const totalDocVoted = docVotes.length;
                const docAgreePercent =
                  totalEligible > 0 ? Math.round((agreeCount / totalEligible) * 100) : 0;
                const isSelected = doc.id === activeDocument?.id;

                let statusLabel = 'Chưa biểu quyết';
                let statusClass = 'bg-gray-100 text-gray-600 border-gray-200';
                if (totalDocVoted > 0) {
                  if (docAgreePercent >= 100) {
                    statusLabel = 'ĐÃ THÔNG QUA (100%)';
                    statusClass = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black';
                  } else if (docAgreePercent >= 66) {
                    statusLabel = 'ĐÃ THÔNG QUA (>2/3)';
                    statusClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
                  } else if (docAgreePercent >= 50) {
                    statusLabel = 'ĐẠT ĐA SỐ (>50%)';
                    statusClass = 'bg-blue-50 text-blue-800 border-blue-200 font-bold';
                  } else {
                    statusLabel = 'CHƯA ĐẠT ĐA SỐ';
                    statusClass = 'bg-red-50 text-red-700 border-red-200 font-bold';
                  }
                }

                return (
                  <tr
                    key={doc.id}
                    className={`transition-colors hover:bg-pink-50/40 ${
                      isSelected ? 'bg-pink-50/70 font-semibold' : 'bg-white'
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center font-bold text-gray-500">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-[10px] bg-gray-100 text-pink-900 px-1.5 py-0.5 rounded border border-gray-200">
                        {doc.code || `VB-${idx + 1}`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900 line-clamp-1">{doc.title}</div>
                      <div className="text-[10px] text-gray-500">
                        Người nạp: {doc.uploadedBy.split('(')[0]} • {doc.date}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          doc.category === 'Nghị quyết'
                            ? 'bg-red-100 text-red-800'
                            : doc.category === 'Báo cáo'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-bold text-gray-800">
                        {totalDocVoted}/{totalEligible}
                      </span>
                      <div className="text-[9px] text-gray-400">
                        ({totalEligible > 0 ? Math.round((totalDocVoted / totalEligible) * 100) : 0}%)
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-black text-emerald-700">
                        {agreeCount} ({docAgreePercent}%)
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-bold text-red-600">
                        {disagreeCount} ({totalEligible > 0 ? Math.round((disagreeCount / totalEligible) * 100) : 0}%)
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-bold text-amber-600">
                        {otherCount} ({totalEligible > 0 ? Math.round((otherCount / totalEligible) * 100) : 0}%)
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] border shadow-2xs ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDocId(doc.id);
                          window.scrollTo({ top: 140, behavior: 'smooth' });
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-pink-700 text-white shadow-xs'
                            : 'bg-gray-100 hover:bg-pink-100 text-pink-900 border border-gray-200'
                        }`}
                      >
                        {isSelected ? 'Đang chọn' : 'Xem & Bỏ phiếu'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD DOCUMENT */}
      {isAddDocModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#831843] text-white p-3.5 px-5 flex items-center justify-between border-b-2 border-amber-400">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                <FilePlus className="w-4 h-4" />
                <span>NẠP TÀI LIỆU VÀO PHÒNG HỌP {currentRoom.roomCode}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDocModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Ký hiệu số văn bản:
                  </label>
                  <input
                    type="text"
                    value={newDocCode}
                    onChange={(e) => setNewDocCode(e.target.value)}
                    placeholder="Ví dụ: NQ-08/ĐU, BC-12/ĐU..."
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-pink-700 focus:outline-hidden font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Loại văn bản (*):
                  </label>
                  <select
                    value={newDocCategory}
                    onChange={(e) => setNewDocCategory(e.target.value as any)}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-pink-700 focus:outline-hidden font-bold"
                  >
                    <option value="Nghị quyết">Nghị quyết lãnh đạo</option>
                    <option value="Báo cáo">Báo cáo tình hình</option>
                    <option value="Kế hoạch">Kế hoạch công tác</option>
                    <option value="Biên bản">Biên bản hội nghị</option>
                    <option value="Tờ trình">Tờ trình Ban Thường vụ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Tên trích yếu văn bản (*):
                </label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Ví dụ: Dự thảo Nghị quyết lãnh đạo thực hiện nhiệm vụ Tháng 09/2026..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-pink-700 focus:outline-hidden font-bold text-gray-900"
                  required
                />
              </div>

              <div className="bg-pink-50/60 p-3.5 rounded-lg border border-pink-200 space-y-2">
                <label className="block font-bold text-pink-950">
                  Tải lên tệp Word (.docx) để chuyển đổi tự động:
                </label>
                <input
                  type="file"
                  ref={addDocFileInputRef}
                  onChange={handleNewDocWordUpload}
                  accept=".docx"
                  className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#831843] file:text-white hover:file:bg-[#701a75] file:cursor-pointer"
                />
                <p className="text-[10px] text-gray-500">
                  Hệ thống tự động đọc tiêu đề, các mục la mã và đoạn văn bản từ tệp Word.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="secret-check-new"
                  checked={newDocIsSecret}
                  onChange={(e) => setNewDocIsSecret(e.target.checked)}
                  className="w-4 h-4 text-pink-700 rounded focus:ring-pink-500 cursor-pointer"
                />
                <label htmlFor="secret-check-new" className="font-bold text-gray-700 cursor-pointer">
                  Tài liệu đóng dấu MẬT (Chỉ Đảng ủy viên được tiếp cận)
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#831843] hover:bg-[#701a75] text-white font-bold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>NẠP VÀO PHÒNG HỌP</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
