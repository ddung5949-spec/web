import React, { useEffect, useRef, useState, useMemo } from 'react';
import mammoth from 'mammoth';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Bold,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Columns,
  Copy,
  CornerDownLeft,
  Download,
  Edit2,
  Edit3,
  Eye,
  EyeOff,
  FileCheck,
  FileDown,
  FileEdit,
  FileText,
  FileUp,
  Flame,
  Hand,
  Heading1,
  Heading2,
  Heading3,
  HelpCircle,
  Highlighter,
  History,
  Info,
  Italic,
  Layers,
  List,
  ListOrdered,
  Lock,
  Maximize2,
  MessageSquare,
  Minimize2,
  MoreVertical,
  MousePointer,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  Share2,
  Shield,
  Sparkles,
  Strikethrough,
  Trash2,
  Underline,
  Unlock,
  UserCheck,
  Users,
  Wifi,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import {
  CollabDocData,
  CollabHistoryItem,
  CollabSectionBlock,
  MeetingDocumentItem,
  MeetingRoomItem,
  RoomBroadcastAction,
  RoomPresenceItem,
  User,
} from '../types';
import { cloudStorage } from '../utils/storage';

interface RealtimeCollabDocumentWorkspaceProps {
  currentRoom: MeetingRoomItem;
  activeDocument: MeetingDocumentItem;
  currentUser: User | null;
  allUsers: User[];
  onSaveDocument: (doc: MeetingDocumentItem) => void;
  onUpdateRoom?: (room: MeetingRoomItem) => void;
  onBackToDocsList?: () => void;
}

// Preset collaborator colors
const COLLABORATOR_COLORS = [
  '#dc2626', // Red
  '#2563eb', // Blue
  '#16a34a', // Emerald
  '#9333ea', // Purple
  '#ea580c', // Orange
  '#0891b2', // Cyan
  '#db2777', // Pink
  '#4f46e5', // Indigo
  '#059669', // Teal
  '#ca8a04', // Amber
];

export const RealtimeCollabDocumentWorkspace: React.FC<
  RealtimeCollabDocumentWorkspaceProps
> = ({
  currentRoom,
  activeDocument,
  currentUser,
  allUsers,
  onSaveDocument,
  onUpdateRoom,
  onBackToDocsList,
}) => {
  // 1. Assign deterministic user color based on user ID
  const myColor = useMemo(() => {
    if (!currentUser) return '#64748b';
    const index = Math.abs(currentUser.id || 0) % COLLABORATOR_COLORS.length;
    return COLLABORATOR_COLORS[index];
  }, [currentUser?.id]);

  // 2. Real-time Presence State
  const [onlineUsers, setOnlineUsers] = useState<RoomPresenceItem[]>([]);
  const [activeActions, setActiveActions] = useState<RoomBroadcastAction[]>([]);
  const [toasts, setToasts] = useState<
    { id: string; message: string; type: string; color?: string; time: string }[]
  >([]);

  // 3. Document Collaboration State
  const [collabDoc, setCollabDoc] = useState<CollabDocData>(() => {
    return {
      roomId: currentRoom.id,
      docId: activeDocument.id,
      title: activeDocument.title,
      code: activeDocument.code,
      category: activeDocument.category,
      contentHtml: activeDocument.contentHtml || '',
      sections: activeDocument.sections || parseHtmlToSections(activeDocument.contentHtml || ''),
      version: activeDocument.version || 1,
      lastSavedAt: activeDocument.lastSavedAt || new Date().toISOString(),
      lastSavedBy: activeDocument.lastSavedBy || activeDocument.uploadedBy || 'Ban Tổ chức',
      history: activeDocument.history || [
        {
          id: `v1-${Date.now()}`,
          version: 1,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
          authorName: activeDocument.uploadedBy || 'Ban Quản trị',
          summary: 'Khởi tạo văn kiện dự thảo',
          contentHtml: activeDocument.contentHtml || '',
        },
      ],
    };
  });

  // Save Status
  const [saveStatus, setSaveStatus] = useState<
    'saved' | 'saving' | 'typing' | 'error'
  >('saved');
  const [lastSavedDisplayTime, setLastSavedDisplayTime] = useState<string>('Vừa xong');

  // UI Modes: 'structured' (Section-by-section multi-editor) vs 'wysiwyg' (Google Docs Full View)
  const [editorMode, setEditorMode] = useState<'structured' | 'wysiwyg'>('structured');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [previewHistoryItem, setPreviewHistoryItem] = useState<CollabHistoryItem | null>(null);

  // Active editing section in structured mode
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // WYSIWYG ref
  const fullEditorRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<any>(null);
  const heartbeatTimerRef = useRef<any>(null);
  const wordImportInputRef = useRef<HTMLInputElement>(null);

  // Helper to parse document HTML into structured editable sections
  function parseHtmlToSections(html: string): CollabSectionBlock[] {
    if (!html || !html.trim()) {
      return [
        {
          id: 'sec-header',
          title: 'I. TIÊU ĐỀ & KÝ HIỆU VĂN BẢN',
          content: `<div style="text-align: center;"><strong>ĐẢNG BỘ SƯ ĐOÀN 10</strong><br>Số: ${activeDocument.code || '.../ĐU'}</div>`,
          lastModifiedBy: 'Hệ thống',
          lastModifiedAt: new Date().toLocaleTimeString('vi-VN'),
        },
        {
          id: 'sec-1',
          title: 'II. ĐÁNH GIÁ TÌNH HÌNH & KẾT QUẢ ĐẠT ĐƯỢC',
          content: '<p>- Toàn đơn vị duy trì nghiêm chế độ trực chỉ huy, trực ban, trực SSCĐ cao độ...</p>',
          lastModifiedBy: 'Hệ thống',
          lastModifiedAt: new Date().toLocaleTimeString('vi-VN'),
        },
        {
          id: 'sec-2',
          title: 'III. PHƯƠNG HƯỚNG, MỤC TIÊU & NHIỆM VỤ TRỌNG TÂM',
          content: '<p>- Tập trung nâng cao chất lượng huấn luyện, sẵn sàng chiến đấu, diễn tập bắn đạn thật bảo đảm an toàn tuyệt đối...</p>',
          lastModifiedBy: 'Hệ thống',
          lastModifiedAt: new Date().toLocaleTimeString('vi-VN'),
        },
        {
          id: 'sec-3',
          title: 'IV. TỔ CHỨC THỰC HIỆN & PHÂN CÔNG TRÁCH NHIỆM',
          content: '<p>- Các cấp ủy, chi bộ trực thuộc quán triệt sâu sắc nghị quyết đến 100% cán bộ, đảng viên và chiến sĩ...</p>',
          lastModifiedBy: 'Hệ thống',
          lastModifiedAt: new Date().toLocaleTimeString('vi-VN'),
        },
      ];
    }

    // Try splitting by <h3> or <strong>I., II., III.
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // If it has h3 headings or recognizable sections
    const headings = tempDiv.querySelectorAll('h3, h4, h2');
    if (headings.length > 0) {
      const parsed: CollabSectionBlock[] = [];
      headings.forEach((heading, idx) => {
        const titleText = heading.textContent?.trim() || `Mục ${idx + 1}`;
        let contentHtml = '';
        let next = heading.nextElementSibling;
        while (next && !['H2', 'H3', 'H4'].includes(next.tagName)) {
          contentHtml += next.outerHTML;
          next = next.nextElementSibling;
        }
        parsed.push({
          id: `sec-parsed-${idx + 1}`,
          title: titleText,
          content: contentHtml || '<p>- Đang cập nhật nội dung...</p>',
          lastModifiedBy: 'Ban Quản trị',
          lastModifiedAt: new Date().toLocaleTimeString('vi-VN'),
        });
      });
      if (parsed.length > 0) return parsed;
    }

    // Fallback: single main body section + header
    return [
      {
        id: 'sec-main',
        title: 'TOÀN VĂN VĂN KIỆN NGHỊ QUYẾT',
        content: html,
        lastModifiedBy: activeDocument.uploadedBy || 'Ban Quản trị',
        lastModifiedAt: new Date().toLocaleTimeString('vi-VN'),
      },
    ];
  }

  // 4. SUBSCRIBE TO FIREBASE REAL-TIME PRESENCE & COLLAB DOC
  useEffect(() => {
    // A. Subscribe to presence in this room
    const unsubPresence = cloudStorage.subscribeRoomPresence(
      currentRoom.id,
      (presenceList) => {
        setOnlineUsers(presenceList);
      }
    );

    // B. Subscribe to real-time document sync
    const unsubCollabDoc = cloudStorage.subscribeCollabDoc(
      currentRoom.id,
      activeDocument.id,
      (remoteDoc) => {
        if (remoteDoc) {
          setCollabDoc((prev) => {
            // Merge with local state cleanly
            const updated = {
              ...prev,
              ...remoteDoc,
              sections: remoteDoc.sections || prev.sections,
              contentHtml: remoteDoc.contentHtml || prev.contentHtml,
              version: remoteDoc.version || prev.version,
              lastSavedAt: remoteDoc.lastSavedAt || prev.lastSavedAt,
            };

            // Update WYSIWYG editor if not currently focused or if different
            if (
              fullEditorRef.current &&
              document.activeElement !== fullEditorRef.current &&
              remoteDoc.contentHtml
            ) {
              fullEditorRef.current.innerHTML = remoteDoc.contentHtml;
            }

            return updated;
          });
          setSaveStatus('saved');
        }
      }
    );

    // C. Subscribe to live action toasts
    const unsubActions = cloudStorage.subscribeRoomActions(
      currentRoom.id,
      (actions) => {
        setActiveActions(actions);
        // Show newest action as toast
        if (actions.length > 0) {
          const latest = actions[0];
          // Check if this action is from another user and within last 5 seconds
          if (
            latest.userId !== currentUser?.id &&
            Date.now() - latest.timestamp < 6000
          ) {
            addToast(latest.message, latest.type, latest.userColor);
          }
        }
      }
    );

    return () => {
      if (unsubPresence) unsubPresence();
      if (unsubCollabDoc) unsubCollabDoc();
      if (unsubActions) unsubActions();
    };
  }, [currentRoom.id, activeDocument.id, currentUser?.id]);

  // 5. HEARTBEAT & PRESENCE BROADCAST
  useEffect(() => {
    if (!currentUser) return;

    const sendHeartbeat = () => {
      const presenceItem: RoomPresenceItem = {
        id: `${currentRoom.id}_${currentUser.id}`,
        roomId: currentRoom.id,
        userId: currentUser.id,
        userName: currentUser.fullName,
        userAvatar: currentUser.avatar,
        rankUnit: currentUser.rankUnit || 'Đảng ủy viên',
        color: myColor,
        activeDocId: activeDocument.id,
        activeSectionId: activeSectionId || undefined,
        cursorSnippet: activeSectionId
          ? `Mục ${activeSectionId}`
          : editorMode === 'wysiwyg'
          ? 'Đang xem toàn văn'
          : 'Đang cộng tác',
        isTyping: saveStatus === 'typing',
        lastActive: Date.now(),
      };
      cloudStorage.updateRoomPresence(presenceItem);
    };

    // Send immediately on mount
    sendHeartbeat();

    // Broadcast join room action
    cloudStorage.broadcastRoomAction({
      id: `act-join-${Date.now()}`,
      roomId: currentRoom.id,
      userId: currentUser.id,
      userName: currentUser.fullName,
      userColor: myColor,
      type: 'join',
      message: `Đ/c ${currentUser.fullName} (${currentUser.rankUnit || 'Đảng ủy viên'}) vừa tham gia phòng họp`,
      timestamp: Date.now(),
    });

    // Heartbeat every 8s
    heartbeatTimerRef.current = setInterval(sendHeartbeat, 8000);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      // Remove presence on leave
      cloudStorage.removeRoomPresence(currentRoom.id, currentUser.id);
    };
  }, [currentRoom.id, activeDocument.id, currentUser?.id, activeSectionId, saveStatus, editorMode, myColor]);

  // Toast Helper
  const addToast = (message: string, type: string, color?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setToasts((prev) => [{ id, message, type, color, time }, ...prev.slice(0, 3)]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // 6. AUTO-SAVE DEBOUNCER
  const triggerAutoSave = (updatedData: Partial<CollabDocData>, isMajorEdit = false) => {
    setSaveStatus('typing');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      const nowTimeStr = new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const fullHtml =
        updatedData.contentHtml ||
        (updatedData.sections
          ? compileSectionsToHtml(updatedData.sections)
          : collabDoc.contentHtml);

      const newVersion = isMajorEdit
        ? (collabDoc.version || 1) + 1
        : collabDoc.version || 1;

      let updatedHistory = collabDoc.history || [];
      if (isMajorEdit || !collabDoc.history || collabDoc.history.length === 0) {
        const historyEntry: CollabHistoryItem = {
          id: `hist-${Date.now()}`,
          version: newVersion,
          timestamp: `${nowTimeStr} ${new Date().toLocaleDateString('vi-VN')}`,
          authorName: currentUser?.fullName || 'Đảng ủy viên',
          authorRankUnit: currentUser?.rankUnit || 'Cán bộ',
          summary: isMajorEdit
            ? `Cập nhật nội dung văn bản (Phiên bản ${newVersion})`
            : 'Tự động lưu định kỳ',
          contentHtml: fullHtml,
          sections: updatedData.sections || collabDoc.sections,
        };
        updatedHistory = [historyEntry, ...updatedHistory.slice(0, 20)];
      }

      const mergedDoc: CollabDocData = {
        ...collabDoc,
        ...updatedData,
        contentHtml: fullHtml,
        sections: updatedData.sections || collabDoc.sections,
        version: newVersion,
        lastSavedAt: new Date().toISOString(),
        lastSavedBy: currentUser?.fullName || 'Đảng ủy viên',
        history: updatedHistory,
      };

      setCollabDoc(mergedDoc);

      // 1. Save to Firestore real-time doc
      await cloudStorage.saveCollabDoc(currentRoom.id, activeDocument.id, mergedDoc);

      // 2. Also sync to parent document & room storage
      const updatedParentDoc: MeetingDocumentItem = {
        ...activeDocument,
        contentHtml: fullHtml,
        sections: mergedDoc.sections,
        version: newVersion,
        lastSavedAt: mergedDoc.lastSavedAt,
        lastSavedBy: mergedDoc.lastSavedBy,
        history: mergedDoc.history,
      };
      onSaveDocument(updatedParentDoc);

      if (onUpdateRoom && currentRoom.documents) {
        const updatedDocs = currentRoom.documents.map((d) =>
          d.id === activeDocument.id ? updatedParentDoc : d
        );
        onUpdateRoom({
          ...currentRoom,
          documents: updatedDocs,
        });
      }

      setSaveStatus('saved');
      setLastSavedDisplayTime(nowTimeStr);
    }, 1200); // 1.2 second debounce
  };

  // Compile section blocks into 1 cohesive HTML document
  function compileSectionsToHtml(sections: CollabSectionBlock[]): string {
    return sections
      .map((sec) => {
        return `
          <div class="resolution-section-block" style="margin-bottom: 24px;">
            <h3 style="font-size: 15px; font-weight: bold; color: #831843; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #fbcfe8; padding-bottom: 4px;">
              ${sec.title}
            </h3>
            <div class="section-body">
              ${sec.content}
            </div>
          </div>
        `;
      })
      .join('\n');
  }

  // 7. SECTION EDITING IN STRUCTURED MODE
  const handleLockAndEditSection = (sectionId: string) => {
    if (!currentUser) {
      alert('Vui lòng đăng nhập để tham gia chỉnh sửa văn kiện!');
      return;
    }

    const currentSections = collabDoc.sections || [];
    const sec = currentSections.find((s) => s.id === sectionId);

    // Check if locked by someone else
    if (
      sec?.lockedBy &&
      sec.lockedBy.userId !== currentUser.id &&
      Date.now() - (sec.lockedBy.timestamp || 0) < 60000
    ) {
      alert(
        `Mục này đang được đồng chí ${sec.lockedBy.userName} chỉnh sửa trực tiếp. Để tránh xung đột dữ liệu, vui lòng chọn mục khác hoặc đợi đồng chí ấy hoàn tất!`
      );
      return;
    }

    // Set lock
    const updatedSections = currentSections.map((s) => {
      if (s.id === sectionId) {
        return {
          ...s,
          lockedBy: {
            userId: currentUser.id,
            userName: currentUser.fullName,
            userColor: myColor,
            timestamp: Date.now(),
          },
        };
      }
      return s;
    });

    setActiveSectionId(sectionId);
    triggerAutoSave({ sections: updatedSections });

    // Broadcast toast action
    cloudStorage.broadcastRoomAction({
      id: `act-edit-${Date.now()}`,
      roomId: currentRoom.id,
      userId: currentUser.id,
      userName: currentUser.fullName,
      userColor: myColor,
      type: 'edit_section',
      message: `Đ/c ${currentUser.fullName} vừa bắt đầu chỉnh sửa: ${sec?.title || 'Mục'}`,
      timestamp: Date.now(),
    });
  };

  const handleUpdateSectionContent = (sectionId: string, newContent: string) => {
    const currentSections = collabDoc.sections || [];
    const updatedSections = currentSections.map((s) => {
      if (s.id === sectionId) {
        return {
          ...s,
          content: newContent,
          lastModifiedBy: currentUser?.fullName || 'Đảng ủy viên',
          lastModifiedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
      }
      return s;
    });

    triggerAutoSave({ sections: updatedSections });
  };

  const handleFinishSectionEdit = (sectionId: string) => {
    const currentSections = collabDoc.sections || [];
    const updatedSections = currentSections.map((s) => {
      if (s.id === sectionId) {
        return {
          ...s,
          lockedBy: null,
          lastModifiedBy: currentUser?.fullName || 'Đảng ủy viên',
          lastModifiedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
      }
      return s;
    });

    setActiveSectionId(null);
    triggerAutoSave({ sections: updatedSections }, true);

    addToast('Đã lưu và cập nhật hoàn tất mục văn kiện!', 'success');
  };

  // Add New Section
  const handleAddNewSection = () => {
    const currentSections = collabDoc.sections || [];
    const newIdx = currentSections.length + 1;
    const newSec: CollabSectionBlock = {
      id: `sec-custom-${Date.now()}`,
      title: `MỤC ${newIdx}. BỔ SUNG Ý KIẾN THẢO LUẬN`,
      content: '<p>- Nhập ý kiến thảo luận hoặc nội dung bổ sung vào đây...</p>',
      lastModifiedBy: currentUser?.fullName || 'Đảng ủy viên',
      lastModifiedAt: new Date().toLocaleTimeString('vi-VN'),
    };
    const updated = [...currentSections, newSec];
    triggerAutoSave({ sections: updated }, true);
    setActiveSectionId(newSec.id);
  };

  // 8. WYSIWYG FULL VIEW ACTIONS
  const handleFormat = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (fullEditorRef.current) {
      triggerAutoSave({ contentHtml: fullEditorRef.current.innerHTML });
    }
  };

  const handleInsertCommentTag = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      alert('Đồng chí vui lòng bôi đen đoạn văn bản cần đính kèm ý kiến đóng góp!');
      return;
    }

    const officerName = currentUser?.fullName || 'Đảng ủy viên';
    const span = document.createElement('span');
    span.style.backgroundColor = '#fef08a';
    span.style.color = '#854d0e';
    span.style.fontWeight = 'bold';
    span.style.padding = '2px 6px';
    span.style.borderRadius = '4px';
    span.style.borderBottom = '2px dashed #ca8a04';
    span.title = `Góp ý từ Đ/c ${officerName}`;
    span.textContent = `${selection.toString()} 💬 [Ý kiến của ${officerName}]`;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(span);

    if (fullEditorRef.current) {
      triggerAutoSave({ contentHtml: fullEditorRef.current.innerHTML }, true);
    }
  };

  const handleRequestSpeech = () => {
    if (!currentUser) return;
    cloudStorage.broadcastRoomAction({
      id: `act-speech-${Date.now()}`,
      roomId: currentRoom.id,
      userId: currentUser.id,
      userName: currentUser.fullName,
      userColor: myColor,
      type: 'speech_request',
      message: `✋ Đ/c ${currentUser.fullName} (${currentUser.rankUnit || 'Đảng ủy viên'}) xin đăng ký phát biểu ý kiến!`,
      timestamp: Date.now(),
    });
    addToast('Đã gửi tín hiệu xin phát biểu ý kiến đến Chủ trì hội nghị!', 'speech');
  };

  // Handle Word Import
  const handleWordImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaveStatus('saving');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const importedHtml = result.value;

      const parsedSections = parseHtmlToSections(importedHtml);
      triggerAutoSave({ contentHtml: importedHtml, sections: parsedSections }, true);

      if (fullEditorRef.current) {
        fullEditorRef.current.innerHTML = importedHtml;
      }
      addToast('Đã nhập và đồng bộ thành công văn bản Word (.docx)!', 'success');
    } catch (err) {
      console.error('Word import error:', err);
      alert('Không thể đọc tệp Word. Vui lòng kiểm tra lại tệp .docx!');
    }
  };

  // Print Document
  const handlePrintDocument = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Vui lòng cho phép popup để in văn bản!');
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${collabDoc.title} - ${currentRoom.roomCode}</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.5; padding: 40px; }
          .header-tbl { width: 100%; margin-bottom: 20px; }
          .title { text-align: center; font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 20px 0; color: #831843; }
        </style>
      </head>
      <body>
        <table class="header-tbl">
          <tr>
            <td style="text-align: center; vertical-align: top; width: 45%;">
              <strong>ĐẢNG BỘ SƯ ĐOÀN 10</strong><br>
              <strong>BAN CHẤP HÀNH ĐẢNG BỘ</strong><br>
              Số: ${collabDoc.code || '.../ĐU'}
            </td>
            <td style="text-align: center; vertical-align: top; width: 55%;">
              <strong>ĐẢNG CỘNG SẢN VIỆT NAM</strong><br>
              <em>Kon Tum, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</em>
            </td>
          </tr>
        </table>
        <div class="title">${collabDoc.title}</div>
        <div>${collabDoc.contentHtml || compileSectionsToHtml(collabDoc.sections || [])}</div>
      </body>
      </html>
    `;
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 400);
  };

  // Restore history version
  const handleRestoreVersion = (versionItem: CollabHistoryItem) => {
    if (
      confirm(
        `Khôi phục văn bản về Phiên bản ${versionItem.version} (Lưu lúc ${versionItem.timestamp} bởi ${versionItem.authorName})?`
      )
    ) {
      triggerAutoSave(
        {
          contentHtml: versionItem.contentHtml,
          sections: versionItem.sections || parseHtmlToSections(versionItem.contentHtml),
        },
        true
      );
      setIsHistoryModalOpen(false);
      addToast(`Đã khôi phục thành công về Phiên bản ${versionItem.version}!`, 'success');
    }
  };

  return (
    <div
      className={`space-y-3 transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md p-4 overflow-y-auto'
          : ''
      }`}
    >
      {/* 1. TOP LIVE PRESENCE & AUTO-SAVE STATUS BAR */}
      <div className="bg-white rounded-2xl shadow-sm border border-pink-200 p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Document Info & Back Button */}
        <div className="flex items-center gap-3">
          {onBackToDocsList && (
            <button
              type="button"
              onClick={onBackToDocsList}
              className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-900 border border-pink-200 transition-colors cursor-pointer"
              title="Quay lại danh sách văn kiện"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#831843] to-[#500724] text-amber-300 shadow-inner">
            <FileEdit className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] font-black text-pink-900 bg-pink-100 px-2 py-0.5 rounded border border-pink-200">
                {collabDoc.code || 'VB-ĐU'}
              </span>
              <span className="text-[10px] font-extrabold uppercase bg-red-100 text-red-900 px-2 py-0.5 rounded">
                {collabDoc.category || 'Nghị quyết'}
              </span>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Phiên bản {collabDoc.version || 1}</span>
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-gray-900 leading-snug line-clamp-1 mt-0.5">
              {collabDoc.title}
            </h2>
          </div>
        </div>

        {/* Middle / Right: Real-time Live Avatars & Save Status */}
        <div className="flex items-center gap-3 flex-wrap justify-between md:justify-end">
          {/* Online Presence Avatars */}
          <div className="flex items-center gap-2 bg-pink-50/70 p-1.5 px-3 rounded-xl border border-pink-100">
            <div className="flex items-center gap-1.5 text-xs font-black text-pink-950">
              <Users className="w-3.5 h-3.5 text-pink-700" />
              <span>Đang trực tuyến ({onlineUsers.length}):</span>
            </div>

            <div className="flex -space-x-2 overflow-hidden">
              {onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="relative group cursor-pointer"
                  title={`${user.userName} (${user.rankUnit || 'Đảng ủy viên'}) - ${
                    user.isTyping ? '✍️ Đang gõ chữ...' : user.cursorSnippet || 'Đang theo dõi'
                  }`}
                >
                  <img
                    src={
                      user.userAvatar ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
                    }
                    alt={user.userName}
                    style={{ borderColor: user.color || '#dc2626' }}
                    className="w-7 h-7 rounded-full border-2 object-cover shadow-xs transition-transform group-hover:scale-110"
                  />
                  {user.isTyping && (
                    <span
                      style={{ backgroundColor: user.color }}
                      className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white animate-ping"
                    />
                  )}
                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                    <div className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap">
                      {user.userName}
                      <span className="text-amber-300 block text-[9px] font-normal">
                        {user.isTyping ? '✍️ Đang soạn thảo...' : user.cursorSnippet || 'Đang xem'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Save Status Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                saveStatus === 'saved'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : saveStatus === 'saving'
                  ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              {saveStatus === 'saved' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px]">Đã lưu (lúc {lastSavedDisplayTime})</span>
                </>
              ) : saveStatus === 'saving' ? (
                <>
                  <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />
                  <span className="text-[11px]">Đang đồng bộ CSDL...</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 text-blue-600 animate-bounce" />
                  <span className="text-[11px]">Đang gõ...</span>
                </>
              )}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setEditorMode('structured')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                  editorMode === 'structured'
                    ? 'bg-[#831843] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Chế độ chia khối Nghị quyết (Chống xung đột nhiều người sửa cùng lúc)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Khối Nghị Quyết</span>
              </button>

              <button
                type="button"
                onClick={() => setEditorMode('wysiwyg')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                  editorMode === 'wysiwyg'
                    ? 'bg-[#831843] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Chế độ soạn thảo toàn văn A4 trực quan Google Docs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Toàn Văn A4</span>
              </button>
            </div>

            {/* Revision History Button */}
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors cursor-pointer"
              title="Xem lịch sử chỉnh sửa & Khôi phục phiên bản cũ"
            >
              <History className="w-4 h-4 text-pink-800" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors cursor-pointer"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình không gian làm việc'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. FLOATING REAL-TIME NOTIFICATION TOASTS */}
      <div className="fixed bottom-6 right-6 z-[110] space-y-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-slate-900/95 text-white p-3 rounded-2xl shadow-2xl border border-white/20 flex items-start gap-2.5 text-xs animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
          >
            <div
              style={{ backgroundColor: toast.color || '#ca8a04' }}
              className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
            />
            <div className="flex-1">
              <p className="font-semibold leading-snug">{toast.message}</p>
              <span className="text-[10px] text-gray-400 block mt-0.5">{toast.time}</span>
            </div>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-gray-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* 3. MAIN WORKSPACE CANVAS */}
      {editorMode === 'structured' ? (
        /* =========================================================================
           MODE A: SECTION-BY-SECTION STRUCTURED COLLABORATIVE EDITING (CONFLICT-FREE)
           ========================================================================= */
        <div className="space-y-3">
          {/* Action Ribbon */}
          <div className="bg-gradient-to-r from-pink-900 via-[#831843] to-purple-900 text-white p-3 rounded-2xl flex items-center justify-between gap-2 shadow-xs border border-pink-700 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-red-950 font-black text-[10px] uppercase px-2 py-0.5 rounded">
                CHẾ ĐỘ CỘNG TÁC ĐA PHÂN ĐOẠN
              </span>
              <p className="text-xs text-pink-100 hidden sm:inline">
                Nhiều đồng chí có thể cùng chỉnh sửa độc lập từng mục mà không lo bị ghi đè dữ liệu.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRequestSpeech}
                className="bg-amber-400 hover:bg-amber-300 text-red-950 text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Hand className="w-3.5 h-3.5" />
                <span>Xin phát biểu</span>
              </button>

              <button
                type="button"
                onClick={handleAddNewSection}
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                <span>+ Thêm mục mới</span>
              </button>

              <button
                type="button"
                onClick={handlePrintDocument}
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                title="In hoặc xuất biên bản"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>In văn bản</span>
              </button>
            </div>
          </div>

          {/* Structured Sections List */}
          <div className="space-y-3">
            {(collabDoc.sections || []).map((sec, idx) => {
              const isLocked = !!sec.lockedBy;
              const isLockedByMe = sec.lockedBy?.userId === currentUser?.id;
              const isEditingThis = activeSectionId === sec.id;

              return (
                <div
                  key={sec.id}
                  style={{
                    borderColor: isLocked
                      ? isLockedByMe
                        ? myColor
                        : sec.lockedBy?.userColor || '#dc2626'
                      : '#e5e7eb',
                  }}
                  className={`bg-white rounded-2xl p-4 transition-all shadow-xs border-2 ${
                    isEditingThis ? 'ring-4 ring-pink-100' : ''
                  }`}
                >
                  {/* Section Top Header */}
                  <div className="flex items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-100 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-6 h-6 rounded-lg bg-pink-100 text-pink-900 font-mono font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h3 className="font-black text-xs sm:text-sm uppercase text-gray-900">
                        {sec.title}
                      </h3>

                      {/* Lock Status Flag */}
                      {isLocked && (
                        <span
                          style={{
                            backgroundColor: `${sec.lockedBy?.userColor}15`,
                            color: sec.lockedBy?.userColor,
                            borderColor: `${sec.lockedBy?.userColor}40`,
                          }}
                          className="text-[10px] font-black px-2 py-0.5 rounded-md border flex items-center gap-1 animate-pulse"
                        >
                          <Lock className="w-3 h-3" />
                          <span>
                            {isLockedByMe
                              ? 'Đồng chí đang chỉnh sửa mục này'
                              : `Đ/c ${sec.lockedBy?.userName} đang soạn thảo...`}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Section Actions */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">
                        Sửa đổi lúc {sec.lastModifiedAt || 'Vừa xong'} bởi {sec.lastModifiedBy || 'Ban Quản trị'}
                      </span>

                      {isEditingThis ? (
                        <button
                          type="button"
                          onClick={() => handleFinishSectionEdit(sec.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Xong mục này</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleLockAndEditSection(sec.id)}
                          disabled={isLocked && !isLockedByMe}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                            isLocked && !isLockedByMe
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-pink-50 hover:bg-pink-100 text-pink-900 border border-pink-200'
                          }`}
                        >
                          <Edit2 className="w-3.5 h-3.5 text-pink-700" />
                          <span>{isLockedByMe ? 'Tiếp tục sửa' : 'Chỉnh sửa mục này'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Section Content Area */}
                  <div className="pt-3">
                    {isEditingThis ? (
                      <div className="space-y-2">
                        {/* Inline Rich Mini-Toolbar */}
                        <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-xl border border-gray-200 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleFormat('bold')}
                            className="p-1 hover:bg-white rounded text-gray-700 cursor-pointer"
                            title="In đậm"
                          >
                            <Bold className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFormat('italic')}
                            className="p-1 hover:bg-white rounded text-gray-700 cursor-pointer"
                            title="In nghiêng"
                          >
                            <Italic className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFormat('underline')}
                            className="p-1 hover:bg-white rounded text-gray-700 cursor-pointer"
                            title="Gạch chân"
                          >
                            <Underline className="w-3.5 h-3.5" />
                          </button>
                          <div className="w-px h-4 bg-gray-300 mx-1" />
                          <button
                            type="button"
                            onClick={handleInsertCommentTag}
                            className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Highlighter className="w-3 h-3 text-amber-700" />
                            <span>Đính kèm góp ý</span>
                          </button>
                        </div>

                        {/* Editable Area */}
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onInput={(e) =>
                            handleUpdateSectionContent(sec.id, e.currentTarget.innerHTML)
                          }
                          dangerouslySetInnerHTML={{ __html: sec.content }}
                          className="min-h-[120px] p-3 bg-pink-50/20 border border-pink-300 rounded-xl outline-none text-xs text-gray-800 leading-relaxed font-sans focus:ring-2 focus:ring-pink-500/20"
                        />
                      </div>
                    ) : (
                      <div
                        dangerouslySetInnerHTML={{ __html: sec.content }}
                        className="text-xs text-gray-800 leading-relaxed font-sans prose max-w-none"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* =========================================================================
           MODE B: GOOGLE DOCS A4 WYSIWYG REAL-TIME EDITING MODE
           ========================================================================= */
        <div className="bg-slate-100 rounded-2xl p-4 sm:p-6 border border-gray-300 space-y-4">
          {/* Main Formatting Toolbar */}
          <div className="bg-white p-2.5 rounded-2xl shadow-xs border border-gray-200 flex items-center justify-between gap-2 flex-wrap sticky top-2 z-40">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Basic Styles */}
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => handleFormat('bold')}
                  className="p-1.5 hover:bg-white rounded-lg text-gray-700 cursor-pointer"
                  title="In đậm (Ctrl+B)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat('italic')}
                  className="p-1.5 hover:bg-white rounded-lg text-gray-700 cursor-pointer"
                  title="In nghiêng (Ctrl+I)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat('underline')}
                  className="p-1.5 hover:bg-white rounded-lg text-gray-700 cursor-pointer"
                  title="Gạch chân (Ctrl+U)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat('strikeThrough')}
                  className="p-1.5 hover:bg-white rounded-lg text-gray-700 cursor-pointer"
                  title="Gạch ngang"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Headings */}
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => handleFormat('formatBlock', '<h3>')}
                  className="px-2 py-1 hover:bg-white rounded-lg text-gray-700 text-xs font-bold cursor-pointer"
                  title="Tiêu đề mục (H3)"
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat('formatBlock', '<p>')}
                  className="px-2 py-1 hover:bg-white rounded-lg text-gray-700 text-xs font-bold cursor-pointer"
                  title="Đoạn văn thường"
                >
                  Văn bản
                </button>
              </div>

              {/* Lists */}
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => handleFormat('insertUnorderedList')}
                  className="p-1.5 hover:bg-white rounded-lg text-gray-700 cursor-pointer"
                  title="Danh sách gạch đầu dòng"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat('insertOrderedList')}
                  className="p-1.5 hover:bg-white rounded-lg text-gray-700 cursor-pointer"
                  title="Danh sách đánh số"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Highlight Comment */}
              <button
                type="button"
                onClick={handleInsertCommentTag}
                className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                title="Bôi đen văn bản để ghim ý kiến đóng góp"
              >
                <Highlighter className="w-3.5 h-3.5 text-amber-700" />
                <span>Góp ý</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={wordImportInputRef}
                onChange={handleWordImport}
                accept=".docx"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => wordImportInputRef.current?.click()}
                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                title="Nhập tệp Word (.docx) vào văn kiện"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Nhập Word (.docx)</span>
              </button>

              <button
                type="button"
                onClick={handlePrintDocument}
                className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In / Xuất</span>
              </button>
            </div>
          </div>

          {/* Google Docs Simulated A4 Page Container */}
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl border border-gray-300 p-8 sm:p-14 min-h-[700px] relative">
            {/* Live Cursor Indicator Flags Container */}
            <div className="absolute top-3 right-4 flex items-center gap-1.5 text-[10px] bg-slate-800 text-white px-2.5 py-1 rounded-full shadow-md font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Cộng tác Trực tiếp Real-time</span>
            </div>

            {/* Official Military Header Template */}
            <div className="text-center pb-6 mb-6 border-b-2 border-amber-400">
              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-gray-800 mb-4">
                <div className="text-center">
                  <p className="uppercase">ĐẢNG BỘ SƯ ĐOÀN 10</p>
                  <p className="font-extrabold uppercase text-red-900">
                    BAN CHẤP HÀNH ĐẢNG BỘ
                  </p>
                  <p className="font-mono text-[11px] text-gray-600">
                    Số: {collabDoc.code || '.../ĐU'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="uppercase">ĐẢNG CỘNG SẢN VIỆT NAM</p>
                  <p className="italic font-normal text-gray-600">
                    Kon Tum, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                  </p>
                </div>
              </div>

              <h2 className="text-base sm:text-lg font-black uppercase text-[#831843] tracking-wide">
                {collabDoc.title}
              </h2>
            </div>

            {/* Live Editable Body */}
            <div
              ref={fullEditorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) =>
                triggerAutoSave({ contentHtml: e.currentTarget.innerHTML })
              }
              dangerouslySetInnerHTML={{ __html: collabDoc.contentHtml }}
              className="party-meeting-content outline-none text-xs sm:text-sm text-gray-800 leading-relaxed font-sans space-y-4 min-h-[450px]"
            />
          </div>
        </div>
      )}

      {/* 4. REVISION HISTORY MODAL */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#831843] text-white p-4 px-5 flex items-center justify-between border-b-2 border-amber-400">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                <History className="w-4 h-4" />
                <span>LỊCH SỬ CHỈNH SỬA & KHÔI PHỤC PHIÊN BẢN ({collabDoc.history?.length || 0})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 text-xs flex-1">
              <p className="text-gray-500">
                Toàn bộ các mốc lưu tự động và chỉnh sửa của các Đảng ủy viên được ghi lại chi tiết dưới đây. Đồng chí có thể xem lại hoặc bấm Khôi phục để đảo ngược dữ liệu.
              </p>

              <div className="space-y-2">
                {(collabDoc.history || []).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-gray-50 hover:bg-pink-50/40 rounded-xl border border-gray-200 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-pink-900 bg-pink-100 px-2 py-0.5 rounded text-[10px]">
                          Phiên bản {item.version}
                        </span>
                        <span className="font-extrabold text-gray-900">
                          {item.authorName} ({item.authorRankUnit || 'Cán bộ'})
                        </span>
                      </div>
                      <p className="text-gray-600 text-[11px]">{item.summary}</p>
                      <span className="text-[10px] text-gray-400 block">{item.timestamp}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRestoreVersion(item)}
                      className="px-3 py-1.5 bg-[#831843] hover:bg-[#701a75] text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-300" />
                      <span>Khôi phục</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
