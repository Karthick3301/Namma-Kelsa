import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  BellRing, 
  MessageSquare, 
  Star, 
  Check, 
  CheckCheck, 
  X, 
  Sparkles, 
  Clock, 
  Phone,
  Trash2,
  ExternalLink
} from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useLanguage } from "../context/LanguageContext";
import { WorkerNotification } from "../types";

interface NotificationsBellProps {
  workerUid: string;
  workerName?: string;
  onNavigateToWorkerProfile?: () => void;
}

export const NotificationsBell: React.FC<NotificationsBellProps> = ({
  workerUid,
  workerName = "Artisan",
  onNavigateToWorkerProfile
}) => {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<WorkerNotification[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "inquiries" | "reviews">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);

  // Storage key for read notification IDs
  const READ_STORAGE_KEY = `namma_kelsa_read_notifs_${workerUid}`;

  const getReadIds = (): string[] => {
    try {
      const saved = localStorage.getItem(READ_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const saveReadIds = (ids: string[]) => {
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Ignore
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Real-time synchronization of reviews and inquiries
  useEffect(() => {
    if (!workerUid) return;

    let isMounted = true;
    const readIds = new Set(getReadIds());

    // Local default notifications for initial onboarding or demo worker
    const initialDemoAlerts: WorkerNotification[] = [
      {
        id: `demo-welcome-${workerUid}`,
        type: "inquiry",
        title: language === "kn" ? "ನಮ್ಮ ಕೆಲಸ ವೇದಿಕೆಗೆ ಸ್ವಾಗತ!" : "Welcome to Namma-Kelsa Directory!",
        message: language === "kn" 
          ? "ನಿಮ್ಮ ಪರಿಶೀಲಿತ ಪ್ರೊಫೈಲ್ ಈಗ ಸಕ್ರಿಯವಾಗಿದೆ. ಗ್ರಾಹಕರು ಕರೆ ಮಾಡಿದಾಗ ಅಥವಾ ಸಂದೇಶ ಕಳುಹಿಸಿದಾಗ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ."
          : "Your verified profile is active. You will receive live alerts here when customers send inquiries or write reviews.",
        authorName: "Namma-Kelsa Admin",
        read: readIds.has(`demo-welcome-${workerUid}`),
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: `demo-sample-inquiry-${workerUid}`,
        type: "inquiry",
        title: language === "kn" ? "ಹೊಸ ಕೆಲಸದ ವಿಚಾರಣೆ" : "Customer Work Inquiry",
        message: language === "kn" 
          ? "ನಮಸ್ಕಾರ, ನಮಗೆ ಮುಂದಿನ ಶನಿವಾರ 2 ದಿನಗಳ ಕೆಲಸಕ್ಕೆ ನಿಮ್ಮ ಸೇವೆ ಲಭ್ಯವಿದೆಯೇ?"
          : "Hello, looking for availability for house maintenance work this weekend in Bengaluru.",
        authorName: "Ramesh Kumar (Customer)",
        customerPhone: "+91 98450 12345",
        read: readIds.has(`demo-sample-inquiry-${workerUid}`),
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ];

    // Real-time listener for Firestore reviews
    const reviewsPath = `workers/${workerUid}/reviews`;
    const unsubReviews = onSnapshot(
      collection(db, reviewsPath),
      (snapshot) => {
        if (!isMounted) return;
        const currentRead = new Set(getReadIds());
        const reviewNotifs: WorkerNotification[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const notifId = `rev-${docSnap.id}`;
          reviewNotifs.push({
            id: notifId,
            type: "review",
            title: language === "kn" 
              ? `${data.authorName || "ಗ್ರಾಹಕರು"} ರವರಿಂದ ಹೊಸ ${data.rating || 5}★ ವಿಮರ್ಶೆ` 
              : `New ${data.rating || 5}★ Review from ${data.authorName || "Customer"}`,
            message: data.comment || "Left a verified rating on your work quality.",
            authorName: data.authorName || "Verified Customer",
            rating: Number(data.rating) || 5,
            read: currentRead.has(notifId),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            targetId: docSnap.id
          });
        });

        // Merge with existing state preserving non-duplicate reviews
        setNotifications((prev) => {
          const nonReviews = prev.filter((n) => n.type !== "review");
          const combined = [...reviewNotifs, ...nonReviews];
          return sortNotifications(combined);
        });
      },
      (err) => {
        console.warn("Reviews notification listener fallback:", err);
      }
    );

    // Real-time listener for Firestore inquiries
    const inquiriesPath = `workers/${workerUid}/inquiries`;
    const unsubInquiries = onSnapshot(
      collection(db, inquiriesPath),
      (snapshot) => {
        if (!isMounted) return;
        const currentRead = new Set(getReadIds());
        const inquiryNotifs: WorkerNotification[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const notifId = `inq-${docSnap.id}`;
          inquiryNotifs.push({
            id: notifId,
            type: "inquiry",
            title: language === "kn" 
              ? `${data.customerName || "ಗ್ರಾಹಕರು"} ರವರಿಂದ ವಿಚಾರಣೆ` 
              : `New Inquiry from ${data.customerName || "Customer"}`,
            message: data.message || "Customer inquired about work availability.",
            authorName: data.customerName || "Customer",
            customerPhone: data.customerPhone || "",
            read: currentRead.has(notifId),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            targetId: docSnap.id
          });
        });

        setNotifications((prev) => {
          const nonInquiries = prev.filter((n) => n.type !== "inquiry");
          const combined = [...inquiryNotifs, ...nonInquiries];
          return sortNotifications(combined);
        });
      },
      (err) => {
        console.warn("Inquiries notification listener fallback:", err);
      }
    );

    // Initial state seed with demo alerts if empty
    setNotifications((prev) => {
      if (prev.length === 0) {
        return initialDemoAlerts;
      }
      return prev;
    });

    // Custom window listeners for instant local feedback (e.g. cross-component actions)
    const handleNewInquiryEvent = (e: any) => {
      const detail = e.detail;
      if (detail && detail.workerId === workerUid) {
        const newNotif: WorkerNotification = {
          id: `local-inq-${Date.now()}`,
          type: "inquiry",
          title: language === "kn"
            ? `${detail.customerName || "ಗ್ರಾಹಕರು"} ರವರಿಂದ ಹೊಸ ವಿಚಾರಣೆ`
            : `New Inquiry from ${detail.customerName || "Customer"}`,
          message: detail.message || "Inquiry sent via direct WhatsApp/directory.",
          authorName: detail.customerName || "Customer",
          read: false,
          createdAt: detail.createdAt || new Date().toISOString()
        };
        setNotifications((prev) => [newNotif, ...prev.filter(n => n.id !== newNotif.id)]);
      }
    };

    const handleNewReviewEvent = (e: any) => {
      const detail = e.detail;
      if (detail && detail.workerId === workerUid) {
        const newNotif: WorkerNotification = {
          id: `local-rev-${Date.now()}`,
          type: "review",
          title: language === "kn"
            ? `${detail.authorName || "ಗ್ರಾಹಕರು"} ರವರಿಂದ ಹೊಸ ${detail.rating || 5}★ ವಿಮರ್ಶೆ`
            : `New ${detail.rating || 5}★ Review from ${detail.authorName || "Customer"}`,
          message: detail.comment || "New review posted on your profile.",
          authorName: detail.authorName || "Customer",
          rating: detail.rating || 5,
          read: false,
          createdAt: detail.createdAt || new Date().toISOString()
        };
        setNotifications((prev) => [newNotif, ...prev.filter(n => n.id !== newNotif.id)]);
      }
    };

    window.addEventListener("namma-kelsa-new-inquiry", handleNewInquiryEvent);
    window.addEventListener("namma-kelsa-new-review", handleNewReviewEvent);

    return () => {
      isMounted = false;
      unsubReviews();
      unsubInquiries();
      window.removeEventListener("namma-kelsa-new-inquiry", handleNewInquiryEvent);
      window.removeEventListener("namma-kelsa-new-review", handleNewReviewEvent);
    };
  }, [workerUid, language]);

  // Helper to sort notifications descending by date
  const sortNotifications = (items: WorkerNotification[]) => {
    return [...items].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime() || 0;
      const dateB = new Date(b.createdAt).getTime() || 0;
      return dateB - dateA;
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    const updated = Array.from(new Set([...getReadIds(), id]));
    saveReadIds(updated);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const allIds = notifications.map((n) => n.id);
    const updated = Array.from(new Set([...getReadIds(), ...allIds]));
    saveReadIds(updated);
  };

  const deleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Simulate an incoming inquiry for rapid live verification
  const handleSimulateInquiry = () => {
    const randomNames = ["Suresh Hegde", "Priya Venkatesh", "Anand Rao", "Kavitha M."];
    const randomSkills = ["Plumbing repair", "Wall Painting", "Electrical wiring", "Tiling work"];
    const chosenName = randomNames[Math.floor(Math.random() * randomNames.length)];
    const chosenSkill = randomSkills[Math.floor(Math.random() * randomSkills.length)];

    const simInquiry: WorkerNotification = {
      id: `sim-inq-${Date.now()}`,
      type: "inquiry",
      title: language === "kn" 
        ? `${chosenName} ರವರಿಂದ ಹೊಸ ಕೆಲಸದ ವಿಚಾರಣೆ` 
        : `New Inquiry from ${chosenName}`,
      message: language === "kn" 
        ? `${chosenSkill} ಗೆ ಸಂಬಂಧಿಸಿದಂತೆ ನಿಮ್ಮ ಲಭ್ಯತೆ ಮತ್ತು ದರ ತಿಳಿಸಿ.` 
        : `Inquiring if you are available this week for ${chosenSkill}. Please let me know.`,
      authorName: chosenName,
      customerPhone: "+91 98451 98765",
      read: false,
      createdAt: new Date().toISOString()
    };

    setNotifications((prev) => [simInquiry, ...prev]);
  };

  // Simulate an incoming 5-star review
  const handleSimulateReview = () => {
    const randomReviewers = ["Deepak Gowda", "Meenakshi Sundaram", "Kiran Patil", "Sunita Nair"];
    const randomComments = [
      "Outstanding workmanship! Arrived right on time and finished cleanly.",
      "Very honest and skilled artisan. Fair rates and great work ethic.",
      "Excellent service, solved our electrical issue very quickly.",
      "Punctual, polite and highly recommended for any home repairs!"
    ];
    const chosenName = randomReviewers[Math.floor(Math.random() * randomReviewers.length)];
    const chosenComment = randomComments[Math.floor(Math.random() * randomComments.length)];

    const simReview: WorkerNotification = {
      id: `sim-rev-${Date.now()}`,
      type: "review",
      title: language === "kn" 
        ? `${chosenName} ರವರಿಂದ ಹೊಸ 5★ ವಿಮರ್ಶೆ` 
        : `New 5★ Review from ${chosenName}`,
      message: chosenComment,
      authorName: chosenName,
      rating: 5,
      read: false,
      createdAt: new Date().toISOString()
    };

    setNotifications((prev) => [simReview, ...prev]);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "inquiries") return n.type === "inquiry";
    if (activeTab === "reviews") return n.type === "review";
    return true;
  });

  // Relative time formatter
  const formatTimeAgo = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Recently";
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
      if (diffSec < 60) return language === "kn" ? "ಈಗಷ್ಟೇ" : "Just now";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="relative inline-block text-left">
      {/* Bell Trigger Button */}
      <button
        ref={bellButtonRef}
        type="button"
        id="header-notifications-bell"
        data-testid="header-notifications-bell"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Worker Notifications"
        aria-expanded={isOpen}
        title={unreadCount > 0 ? `${unreadCount} ${t("unreadAlerts")}` : t("notifications")}
        className={`relative p-2 rounded-xl transition-all duration-200 cursor-pointer ${
          isOpen
            ? "bg-emerald-800 text-white shadow-inner"
            : "bg-emerald-950/80 hover:bg-emerald-850 text-emerald-100 hover:text-white border border-emerald-800/80"
        }`}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-4 h-4 text-emerald-300 animate-in" />
        ) : (
          <Bell className="w-4 h-4 text-emerald-200" />
        )}

        {/* Unread Badge Indicator */}
        {unreadCount > 0 && (
          <span 
            id="notifications-badge"
            data-testid="notifications-unread-badge"
            className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-white font-mono text-[10px] font-extrabold shadow-xs ring-2 ring-emerald-950"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          id="header-notifications-dropdown"
          data-testid="header-notifications-dropdown"
          className="absolute right-0 mt-2.5 w-84 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-900 to-emerald-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-800/80 rounded-lg text-emerald-200">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide">
                  {t("notifications")}
                </h3>
                <p className="text-[10px] text-emerald-300">
                  {unreadCount > 0 
                    ? `${unreadCount} ${t("unreadAlerts")}` 
                    : language === "kn" ? "ಎಲ್ಲಾ ಓದಲಾಗಿದೆ" : "Up to date"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  id="btn-mark-all-read"
                  onClick={markAllAsRead}
                  title={t("markAllRead")}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-200 hover:text-white bg-emerald-850 hover:bg-emerald-800 px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">{t("markAllRead")}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-emerald-300 hover:text-white hover:bg-emerald-850 rounded-lg transition cursor-pointer"
                aria-label="Close notifications panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-2 bg-slate-50 border-b border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-1 px-2 rounded-lg font-bold text-[11px] transition cursor-pointer text-center ${
                activeTab === "all"
                  ? "bg-white text-emerald-800 shadow-2xs border border-slate-200 font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("inquiries")}
              className={`flex-1 py-1 px-2 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === "inquiries"
                  ? "bg-white text-emerald-800 shadow-2xs border border-slate-200 font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MessageSquare className="w-3 h-3 text-emerald-600" />
              <span>Inquiries ({notifications.filter(n => n.type === "inquiry").length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("reviews")}
              className={`flex-1 py-1 px-2 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === "reviews"
                  ? "bg-white text-emerald-800 shadow-2xs border border-slate-200 font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>Reviews ({notifications.filter(n => n.type === "review").length})</span>
            </button>
          </div>

          {/* Notification Items List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                  <Bell className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-700">{t("noNotifications")}</h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  {t("noNotificationsDesc")}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isReview = notif.type === "review";
                return (
                  <div
                    key={notif.id}
                    id={`notif-item-${notif.id}`}
                    onClick={() => markAsRead(notif.id)}
                    className={`p-3.5 transition-colors cursor-pointer group hover:bg-slate-50 relative ${
                      !notif.read ? "bg-emerald-50/40" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 shadow-2xs ${
                        isReview 
                          ? "bg-amber-100 text-amber-700 border border-amber-200" 
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}>
                        {isReview ? (
                          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-emerald-700" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>

                        {/* Review Rating Stars */}
                        {isReview && notif.rating && (
                          <div className="flex items-center gap-1 mt-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < (notif.rating || 5)
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-200 fill-slate-100"
                                }`}
                              />
                            ))}
                            <span className="text-[10px] font-bold text-amber-700 ml-1">
                              {notif.rating}.0
                            </span>
                          </div>
                        )}

                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>

                        {/* Additional Action or Details */}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {notif.customerPhone && (
                              <a
                                href={`tel:${notif.customerPhone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 hover:text-emerald-900 font-bold bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition"
                              >
                                <Phone className="w-2.5 h-2.5" />
                                <span>{notif.customerPhone}</span>
                              </a>
                            )}
                            {onNavigateToWorkerProfile && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notif.id);
                                  setIsOpen(false);
                                  onNavigateToWorkerProfile();
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 hover:text-emerald-700 underline cursor-pointer"
                              >
                                <span>{t("viewInquiriesTab")}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => deleteNotification(e, notif.id)}
                            title="Dismiss notification"
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Unread indicator pip */}
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5 ring-2 ring-emerald-200"></span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Simulation / Test Alert Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 text-[10px]">
            <span className="text-slate-400 flex items-center gap-1 font-mono uppercase font-bold text-[9px]">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Simulate alerts:</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                id="btn-simulate-inquiry"
                onClick={handleSimulateInquiry}
                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-300 transition cursor-pointer flex items-center gap-1"
                title="Simulate a homeowner sending a new work inquiry"
              >
                <MessageSquare className="w-2.5 h-2.5" />
                <span>+ Inquiry</span>
              </button>
              <button
                type="button"
                id="btn-simulate-review"
                onClick={handleSimulateReview}
                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg border border-amber-300 transition cursor-pointer flex items-center gap-1"
                title="Simulate a customer posting a new 5-star review"
              >
                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                <span>+ 5★ Review</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default NotificationsBell;
