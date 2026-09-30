import React, { useState, useEffect } from "react";
import { 
  Phone, 
  MapPin, 
  Briefcase, 
  Star, 
  ChevronDown,
  ChevronUp, 
  User, 
  Clock, 
  MessageSquare, 
  CheckCircle,
  CheckCircle2,
  Eye,
  X,
  Send,
  Sparkles,
  ThumbsUp,
  LogIn,
  Image as ImageIcon,
  Download,
  Map,
  Compass,
  Navigation,
  Heart,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Calendar,
  CalendarDays,
  CalendarX,
  CalendarCheck,
  Ban,
  AlertTriangle,
  Paintbrush,
  Droplet,
  Zap,
  Leaf,
  Grid,
  Hammer,
  Construction,
  Wrench,
  Activity,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { WorkerProfile, WorkerReview } from "../types";
import { downloadWorkerProfilePdf } from "../utils/pdfGenerator";
import { formatDateToISO, getUpcomingDays, formatDisplayDate, getSkillTheme, isMobileDevice } from "../utils";
import MiniMap from "./MiniMap";
import SkillRadarChart from "./SkillRadarChart";
import { useLanguage } from "../context/LanguageContext";

// Helper to render matching icon for individual skill pills
function renderSkillIcon(iconName: string, className = "w-3 h-3") {
  switch (iconName) {
    case "Paintbrush":
      return <Paintbrush className={className} />;
    case "Droplet":
      return <Droplet className={className} />;
    case "Zap":
      return <Zap className={className} />;
    case "Leaf":
      return <Leaf className={className} />;
    case "Grid":
      return <Grid className={className} />;
    case "Hammer":
      return <Hammer className={className} />;
    case "Construction":
      return <Construction className={className} />;
    case "Wrench":
      return <Wrench className={className} />;
    case "Sparkles":
    default:
      return <Sparkles className={className} />;
  }
}
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  onSnapshot 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType, auth, googleProvider } from "../firebase";
import { signInWithPopup, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

interface WorkerCardProps {
  key?: string;
  worker: WorkerProfile;
  customerLat: number;
  customerLon: number;
  customerTownName?: string;
  distance: number;
  isFavorite?: boolean;
  onToggleFavorite?: (workerUid: string) => void;
}

interface ReviewToastData {
  id: string;
  rating: number;
  comment: string;
  authorName: string;
  workerName: string;
  workerPhoto?: string;
  workerSkill?: string;
}

interface ActionTooltipProps {
  label: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

function ActionTooltip({ label, children, position = "top", className = "" }: ActionTooltipProps) {
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-slate-900 border-x-transparent border-b-transparent border-t-4 border-x-4 border-b-0",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 border-x-transparent border-t-transparent border-b-4 border-x-4 border-t-0",
    left: "left-full top-1/2 -translate-y-1/2 border-l-slate-900 border-y-transparent border-r-transparent border-l-4 border-y-4 border-r-0",
    right: "right-full top-1/2 -translate-y-1/2 border-r-slate-900 border-y-transparent border-l-transparent border-r-4 border-y-4 border-r-0",
  };

  return (
    <div className={`relative inline-flex group/tooltip ${className}`}>
      {children}
      <div 
        role="tooltip"
        aria-hidden="true"
        className={`absolute ${positionClasses[position]} z-40 hidden sm:group-hover/tooltip:flex pointer-events-none items-center opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150 delay-75`}
      >
        <div className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg whitespace-nowrap border border-slate-700/60 leading-tight">
          {label}
        </div>
        <div className={`absolute w-0 h-0 ${arrowClasses[position]}`} />
      </div>
    </div>
  );
}

export default function WorkerCard({ 
  worker, 
  customerLat, 
  customerLon, 
  customerTownName,
  distance,
  isFavorite = false,
  onToggleFavorite
}: WorkerCardProps) {
  const { t, language } = useLanguage();
  const [reviews, setReviews] = useState<WorkerReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showReviewsList, setShowReviewsList] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [showMiniMap, setShowMiniMap] = useState(false);

  // Review form states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState(auth.currentUser?.displayName || "");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [selectedGalleryImg, setSelectedGalleryImg] = useState<string | null>(null);
  const [showRadarModal, setShowRadarModal] = useState(false);

  // Visual success animation & feedback toast states
  const [isCelebrationActive, setIsCelebrationActive] = useState(false);
  const [toastData, setToastData] = useState<ReviewToastData | null>(null);
  const [newlyAddedReviewId, setNewlyAddedReviewId] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Social media share state
  const [isCopied, setIsCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  // WhatsApp Direct Message and customer inquiry states
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [isCopiedWhatsApp, setIsCopiedWhatsApp] = useState(false);

  // Desktop Call Modal & Copy State
  const [showDesktopCallModal, setShowDesktopCallModal] = useState(false);
  const [isPhoneCopied, setIsPhoneCopied] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => isMobileDevice());

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const formatDisplayPhone = (rawPhone: string): string => {
    const cleaned = (rawPhone || "").trim();
    const digits = cleaned.replace(/\D/g, "");
    if (digits.length === 10) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return cleaned;
  };

  const handleCopyPhoneNumber = async () => {
    const phoneToCopy = worker.phone.trim();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(phoneToCopy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = phoneToCopy;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setIsPhoneCopied(true);
      setTimeout(() => setIsPhoneCopied(false), 2500);
    } catch {
      setIsPhoneCopied(true);
      setTimeout(() => setIsPhoneCopied(false), 2500);
    }
  };
  const defaultInquiryText = language === "kn"
    ? `ನನಗೆ ${worker.skills[0] || "ಕೆಲಸ"}ಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ ನಿಮ್ಮ ಸೇವೆ ಬೇಕಾಗಿದೆ. ನೀವು ಲಭ್ಯವಿದ್ದೀರಾ?`
    : `I would like to inquire about your availability for ${worker.skills[0] || "trade"} work in ${customerTownName || worker.locationName || "your area"}.`;
  const [customerInquiry, setCustomerInquiry] = useState<string>(defaultInquiryText);
  const [selectedInquiryPreset, setSelectedInquiryPreset] = useState<string>("availability");

  // Format phone number for international WhatsApp link (India +91)
  const getWhatsAppPhone = (phone: string): string => {
    const digits = (phone || "").replace(/\D/g, "");
    if (!digits) return "919876543210";
    if (digits.length === 10) return `91${digits}`;
    if (digits.startsWith("0") && digits.length === 11) return `91${digits.slice(1)}`;
    return digits;
  };

  // Construct structured pre-filled message template including worker name and customer inquiry
  const constructWhatsAppMessage = (inquiryText: string): string => {
    const primarySkill = worker.skills[0] || "artisan";
    const location = customerTownName || worker.locationName || "your area";
    const cleanInquiry = (inquiryText || "").trim() || `I would like to inquire about your availability for ${primarySkill} work.`;

    if (language === "kn") {
      return (
        `ನಮಸ್ಕಾರ ${worker.name},\n\n` +
        `ನಾನು ನಮ್ಮ ಕೆಲಸ (Namma Kelasa) ವೇದಿಕೆಯಲ್ಲಿ ನಿಮ್ಮ ಕೆಲಸಗಾರ ಪ್ರೊಫೈಲ್ ನೋಡಿದ್ದೇನೆ.\n\n` +
        `📋 ಗ್ರಾಹಕರ ವಿಚಾರಣೆ (Customer Inquiry):\n"${cleanInquiry}"\n\n` +
        `📍 ಸ್ಥಳ: ${location}\n` +
        `🛠 ಕೌಶಲ್ಯ: ${worker.skills.join(", ")}\n` +
        `💵 ದರ: ₹${worker.dailyRate}/ದಿನಕ್ಕೆ\n\n` +
        `ದಯವಿಟ್ಟು ನಿಮ್ಮ ಲಭ್ಯತೆ ಮತ್ತು ಅನುಕೂಲಕರ ಸಮಯವನ್ನು ತಿಳಿಸಿ. ಧನ್ಯವಾದಗಳು!`
      );
    }

    return (
      `Hello ${worker.name},\n\n` +
      `I found your profile on Namma Kelasa.\n\n` +
      `📋 Customer Inquiry:\n"${cleanInquiry}"\n\n` +
      `📍 Location: ${location}\n` +
      `🛠 Trade Skills: ${worker.skills.join(", ")}\n` +
      `💵 Daily Wage: ₹${worker.dailyRate}/day\n\n` +
      `Please let me know if you are available to take up this work. Thank you!`
    );
  };

  const whatsappMessage = constructWhatsAppMessage(customerInquiry);
  const whatsappUrl = `https://wa.me/${getWhatsAppPhone(worker.phone)}?text=${encodeURIComponent(whatsappMessage)}`;

  // Copy WhatsApp message template to clipboard
  const handleCopyWhatsAppMessage = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(whatsappMessage);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = whatsappMessage;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setIsCopiedWhatsApp(true);
      setTimeout(() => setIsCopiedWhatsApp(false), 2500);
    } catch (err) {
      console.error("Failed to copy WhatsApp message:", err);
    }
  };

  // Submit and log customer inquiry to notify worker
  const handleSendInquiry = async () => {
    setShowWhatsAppModal(false);
    try {
      const activeUser = auth.currentUser;
      const customerName = activeUser?.displayName || "Direct Customer";
      const cleanMsg = (customerInquiry || "").trim() || `Inquiry for ${worker.skills[0] || "work"} in ${customerTownName || worker.locationName || "your area"}`;

      const inquiryData = {
        workerId: worker.uid,
        customerName: customerName,
        customerPhone: activeUser?.phoneNumber || "",
        message: cleanMsg,
        read: false,
        createdAt: serverTimestamp()
      };

      const inquiriesPath = `workers/${worker.uid}/inquiries`;
      await addDoc(collection(db, inquiriesPath), inquiryData);

      window.dispatchEvent(new CustomEvent("namma-kelsa-new-inquiry", {
        detail: {
          workerId: worker.uid,
          customerName,
          message: cleanMsg,
          createdAt: new Date().toISOString()
        }
      }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent("namma-kelsa-new-inquiry", {
        detail: {
          workerId: worker.uid,
          customerName: "Direct Customer",
          message: customerInquiry.trim(),
          createdAt: new Date().toISOString()
        }
      }));
    }
  };

  // Inquiry preset options
  const inquiryPresets = [
    {
      id: "availability",
      label: language === "kn" ? "ಲಭ್ಯತೆ ವಿಚಾರಣೆ" : "Availability Inquiry",
      text: language === "kn"
        ? `ನನಗೆ ${worker.skills[0] || "ಕೆಲಸ"}ಕ್ಕೆ ನಿಮ್ಮ ನೆರವು ಬೇಕಾಗಿದೆ. ಮುಂಬರುವ ದಿನಗಳಲ್ಲಿ ನೀವು ಲಭ್ಯವಿದ್ದೀರಾ?`
        : `I would like to inquire about your availability for ${worker.skills[0] || "trade"} work in ${customerTownName || worker.locationName || "your area"}.`
    },
    {
      id: "quote",
      label: language === "kn" ? "ದರ & ಅಂದಾಜು" : "Cost & Quote Estimation",
      text: language === "kn"
        ? `ನನ್ನಲ್ಲಿ ಒಂದು ಕೆಲಸವಿದೆ. ಅಂದಾಜು ಖರ್ಚು ಮತ್ತು ದಿನಗಳ ವಿವರ ನೀಡಲು ಸಾಧ್ಯವೇ?`
        : `I have a specific job requirement and would like to get an estimated quote and timeline.`
    },
    {
      id: "urgent",
      label: language === "kn" ? "ತುರ್ತು ಕೆಲಸ ಇಂದು" : "Immediate Work Today",
      text: language === "kn"
        ? `ನನಗೆ ಇಂದು ತುರ್ತಾಗಿ ${worker.skills[0] || "ಕೆಲಸಗಾರರು"} ಬೇಕಾಗಿದ್ದಾರೆ. ನೀವು ಇಂದು ಬರಲು ಸಾಧ್ಯವೇ?`
        : `I have an urgent requirement today. Are you available for immediate dispatch?`
    }
  ];

  // Availability status computations
  const todayIso = formatDateToISO(new Date());
  const isMarkedBusyToday = Boolean(worker.unavailableDates && worker.unavailableDates.includes(todayIso));
  const isAvailableToday = worker.isAvailable && !isMarkedBusyToday;

  // Selected schedule day state for customer interaction
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<string | null>(null);

  // List upcoming unavailable dates starting from today
  const upcomingUnavailableDates = (worker.unavailableDates || [])
    .filter(d => d >= todayIso)
    .sort();

  const upcomingWeekDays = getUpcomingDays(7);

  // Calculate free slots over the next 7 days
  const freeSlotsCount = upcomingWeekDays.filter(day => {
    const isBusy = Boolean(worker.unavailableDates && worker.unavailableDates.includes(day.iso));
    if (day.isToday) {
      return isAvailableToday;
    }
    return !isBusy;
  }).length;

  // Generate shareable direct link
  const generateShareUrl = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("worker", worker.uid);
      return url.toString();
    } catch {
      return `${window.location.origin}/?worker=${worker.uid}`;
    }
  };

  // Copy shareable profile link to clipboard and trigger feedback
  const handleShareProfile = async (openDialog: boolean = false) => {
    const shareUrl = generateShareUrl();
    let copied = false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      } catch (err) {
        console.warn("Clipboard API failed, attempting fallback:", err);
      }
    }

    if (!copied) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copied = document.execCommand("copy");
        document.body.removeChild(textArea);
      } catch (err) {
        console.error("Fallback clipboard copy failed:", err);
      }
    }

    setIsCopied(true);
    setShareToast(true);
    setTimeout(() => setIsCopied(false), 3000);
    setTimeout(() => setShareToast(false), 4500);

    if (openDialog) {
      setShowShareModal(true);
    }
  };

  // Device native share sheet if supported
  const handleNativeShare = async () => {
    const shareUrl = generateShareUrl();
    if (typeof navigator !== "undefined" && typeof (navigator as any).share === "function") {
      try {
        await (navigator as any).share({
          title: `${worker.name} - Skilled Artisan on Namma Kelasa`,
          text: `Check out ${worker.name}'s artisan profile on Namma Kelasa: ${worker.skills.join(", ")} - ₹${worker.dailyRate}/day`,
          url: shareUrl
        });
      } catch {
        // User cancelled or sheet closed
      }
    }
  };

  // Download Profile as Printable PDF
  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      await downloadWorkerProfilePdf(worker, averageRating, reviews.length);
    } catch (err) {
      console.error("Failed to generate PDF profile:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Sync auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && !reviewerName) {
        setReviewerName(user.displayName || "Customer");
      }
    });
    return () => unsubAuth();
  }, [reviewerName]);

  // Auto-dismiss timers for celebration banner and toast notification
  useEffect(() => {
    if (toastData) {
      const timer = setTimeout(() => {
        setToastData(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastData]);

  useEffect(() => {
    if (isCelebrationActive) {
      const timer = setTimeout(() => {
        setIsCelebrationActive(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isCelebrationActive]);

  // Real-time synchronization of worker reviews from Firestore
  useEffect(() => {
    const reviewsPath = `workers/${worker.uid}/reviews`;
    const unsubscribe = onSnapshot(
      collection(db, reviewsPath),
      (snapshot) => {
        const fetched: WorkerReview[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as WorkerReview);
        });
        setReviews(fetched.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
        setLoadingReviews(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, reviewsPath);
        setLoadingReviews(false);
      }
    );
    return () => unsubscribe();
  }, [worker.uid]);

  // Format review timestamp into human-readable relative or calendar format
  const formatReviewDate = (createdAt: any): string => {
    if (!createdAt) return language === "kn" ? "ಈಗಷ್ಟೇ" : "Just now";
    try {
      let date: Date;
      if (typeof createdAt.toDate === "function") {
        date = createdAt.toDate();
      } else if (createdAt.seconds) {
        date = new Date(createdAt.seconds * 1000);
      } else if (typeof createdAt === "string" || typeof createdAt === "number") {
        date = new Date(createdAt);
      } else {
        return language === "kn" ? "ಇತ್ತೀಚೆಗೆ" : "Recent";
      }

      if (isNaN(date.getTime())) return language === "kn" ? "ಇತ್ತೀಚೆಗೆ" : "Recent";

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 2) return language === "kn" ? "ಈಗಷ್ಟೇ" : "Just now";
      if (diffMins < 60) return language === "kn" ? `${diffMins} ನಿಮಿಷಗಳ ಹಿಂದೆ` : `${diffMins}m ago`;
      if (diffHours < 24) return language === "kn" ? `${diffHours} ಗಂಟೆಗಳ ಹಿಂದೆ` : `${diffHours}h ago`;
      if (diffDays < 7) return language === "kn" ? `${diffDays} ದಿನಗಳ ಹಿಂದೆ` : `${diffDays}d ago`;

      return date.toLocaleDateString(language === "kn" ? "kn-IN" : "en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return language === "kn" ? "ಇತ್ತೀಚೆಗೆ" : "Recent";
    }
  };

  // Submit new review and star rating to Firestore 'reviews' subcollection
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setReviewError(
        language === "kn" 
          ? "ದಯವಿಟ್ಟು ನಿಮ್ಮ ವಿಮರ್ಶೆಯ ವಿವರಗಳನ್ನು ಬರೆಯಿರಿ." 
          : "Please write a short comment about the artisan's work."
      );
      return;
    }

    let activeUser = auth.currentUser;
    if (!activeUser) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        activeUser = result.user;
        setCurrentUser(result.user);
      } catch (err: any) {
        setReviewError(
          language === "kn"
            ? "ವಿಮರ್ಶೆ ಸಲ್ಲಿಸಲು ದಯವಿಟ್ಟು ಗೂಗಲ್ ಖಾತೆಯ ಮೂಲಕ ಸೈನ್ ಇನ್ ಮಾಡಿ."
            : "Please sign in with Google to post your customer review."
        );
        return;
      }
    }

    if (!activeUser) return;

    const author = reviewerName.trim() || activeUser.displayName || "Customer";
    const submittedRating = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)));
    setSubmittingReview(true);

    const reviewsPath = `workers/${worker.uid}/reviews`;
    const newReview = {
      workerId: worker.uid,
      authorName: author,
      authorId: activeUser.uid,
      rating: submittedRating,
      comment: trimmedComment,
      createdAt: serverTimestamp()
    };

    try {
      const docRef = await addDoc(collection(db, reviewsPath), newReview);
      
      // Dispatch custom event for real-time notifications
      window.dispatchEvent(new CustomEvent("namma-kelsa-new-review", {
        detail: {
          workerId: worker.uid,
          authorName: author,
          rating: submittedRating,
          comment: trimmedComment,
          createdAt: new Date().toISOString()
        }
      }));

      // Trigger visual success animation & celebratory banner
      setNewlyAddedReviewId(docRef.id);
      setIsCelebrationActive(true);
      setToastData({
        id: docRef.id,
        rating: submittedRating,
        comment: trimmedComment,
        authorName: author,
        workerName: worker.name,
        workerPhoto: worker.photo,
        workerSkill: worker.skills[0] || "Professional"
      });

      // Clear input and open review list to show the published review
      setComment("");
      setRating(5);
      setReviewError(null);
      setShowFeedbackForm(false);
      setShowReviewsList(true);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, reviewsPath);
      setReviewError(err?.message || "Failed to publish review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Calculate dynamic average rating from all reviews in the Firestore subcollection
  const hasReviews = reviews.length > 0;
  const averageRating = hasReviews 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  const ratingDescriptions: Record<number, { en: string; kn: string }> = {
    1: { en: "1 Star: Poor (Needs improvement)", kn: "1 ಸ್ಟಾರ್: ಕಳಪೆ (ಸುಧಾರಣೆ ಅಗತ್ಯ)" },
    2: { en: "2 Stars: Fair (Acceptable work)", kn: "2 ಸ್ಟಾರ್: ಸಾಧಾರಣ (ಸರಿಹೊಂದುತ್ತದೆ)" },
    3: { en: "3 Stars: Good (Satisfactory craft)", kn: "3 ಸ್ಟಾರ್: ಒಳ್ಳೆಯ ಕೆಲಸ (ತೃಪ್ತಿದಾಯಕ)" },
    4: { en: "4 Stars: Very Good (Prompt & skilled)", kn: "4 ಸ್ಟಾರ್: ಅತ್ಯುತ್ತಮ (ಕುಶಲ ಕೆಲಸ)" },
    5: { en: "5 Stars: Excellent (Highly recommended!)", kn: "5 ಸ್ಟಾರ್: ಪರಿಪೂರ್ಣ (ಅತ್ಯಂತ ಶಿಫಾರಸು!)" }
  };

  const activeDisplayRating = hoverRating || rating;

  return (
    <div 
      id={`worker-card-${worker.uid}`}
      className="relative flex flex-col justify-between bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs transition-all duration-300 hover:shadow-md overflow-hidden"
    >
      {/* Availability Pulsing Banner at the top */}
      <div className={`flex items-center justify-between px-4 py-2.5 text-xs font-bold tracking-wide border-b ${
        isAvailableToday 
          ? "bg-emerald-50 text-emerald-800 border-emerald-100/40" 
          : isMarkedBusyToday
            ? "bg-rose-50 text-rose-800 border-rose-200/60"
            : "bg-slate-100 text-slate-500 border-slate-200/40"
      }`}>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {isAvailableToday && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              isAvailableToday 
                ? "bg-emerald-500" 
                : isMarkedBusyToday 
                  ? "bg-rose-500" 
                  : "bg-slate-400"
            }`}></span>
          </span>
          <span>
            {isAvailableToday 
              ? t("availableToday") 
              : isMarkedBusyToday 
                ? (language === "kn" ? "ಇಂದು ಕಾರ್ಯನಿರತ / ರಜೆಯಲ್ಲಿದ್ದಾರೆ" : "Marked Busy / On Leave Today")
                : t("notAvailableToday")}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono">
          <span className="hidden sm:inline flex items-center gap-1">
            <Clock className="w-3" /> {t("updatedRecently")}
          </span>
          <ActionTooltip label={t("tooltipShare")} position="bottom">
            <button
              type="button"
              id={`share-quick-btn-${worker.uid}`}
              onClick={() => handleShareProfile(true)}
              title={t("tooltipShare")}
              aria-label={t("tooltipShare")}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-emerald-700 bg-white/80 hover:bg-white px-2 py-0.5 rounded-md border border-slate-200/80 transition cursor-pointer font-sans shadow-2xs"
            >
              {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Share2 className="w-3 h-3 text-emerald-600" />}
              <span>{isCopied ? t("copied") : t("share")}</span>
            </button>
          </ActionTooltip>

          {/* Heart Toggle Button to Favorite / Unfavorite */}
          <ActionTooltip label={isFavorite ? t("tooltipFavoriteRemove") : t("tooltipFavoriteSave")} position="bottom">
            <button
              type="button"
              id={`favorite-toggle-btn-${worker.uid}`}
              data-testid={`favorite-button-${worker.uid}`}
              onClick={() => onToggleFavorite && onToggleFavorite(worker.uid)}
              title={isFavorite ? t("tooltipFavoriteRemove") : t("tooltipFavoriteSave")}
              aria-label={isFavorite ? t("tooltipFavoriteRemove") : t("tooltipFavoriteSave")}
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer font-sans shadow-2xs active:scale-95 ${
                isFavorite 
                  ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" 
                  : "bg-white/80 hover:bg-white text-slate-600 hover:text-rose-600 border-slate-200/80 hover:border-rose-200"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 transition-transform ${isFavorite ? "fill-rose-500 text-rose-500 scale-110" : "text-slate-400"}`} />
              <span>{isFavorite ? (language === "kn" ? "ಮೆಚ್ಚಿನವರು" : "Favorited") : (language === "kn" ? "ಮೆಚ್ಚು" : "Save")}</span>
            </button>
          </ActionTooltip>
        </div>
      </div>

      {/* 7-Day Availability Timeline Preview */}
      <div 
        id={`timeline-preview-${worker.uid}`}
        data-testid={`availability-timeline-${worker.uid}`}
        className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200/70 text-slate-800"
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-650" />
            <span className="text-[11px] font-bold text-slate-700 tracking-tight">
              {t("timeline7Days")}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <span className={`px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 border ${
              freeSlotsCount === 7 
                ? "bg-emerald-100/90 text-emerald-800 border-emerald-300/80" 
                : freeSlotsCount >= 4
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : freeSlotsCount > 0
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${freeSlotsCount > 0 ? "bg-emerald-500" : "bg-rose-500"}`}></span>
              <span>
                {freeSlotsCount}/7 {t("freeSlotsCount")}
              </span>
            </span>
          </div>
        </div>

        {/* Continuous Horizontal Timeline Strip */}
        <div className="relative pt-1 pb-0.5">
          {/* Subtle connected track line behind nodes */}
          <div className="absolute top-[22px] left-3 right-3 h-0.5 bg-slate-200 -z-0 rounded-full" />

          <div className="grid grid-cols-7 gap-1 relative z-10">
            {upcomingWeekDays.map((day) => {
              const isBusy = Boolean(worker.unavailableDates && worker.unavailableDates.includes(day.iso)) || (day.isToday && !isAvailableToday);
              const isSelected = selectedScheduleDay === day.iso;

              return (
                <button
                  key={`timeline-${worker.uid}-${day.iso}`}
                  type="button"
                  id={`timeline-slot-${worker.uid}-${day.iso}`}
                  data-testid={`timeline-slot-${day.iso}`}
                  onClick={() => {
                    const nextVal = selectedScheduleDay === day.iso ? null : day.iso;
                    setSelectedScheduleDay(nextVal);
                    if (nextVal && !isBusy) {
                      setCustomerInquiry(`Inquiring about availability for ${day.dayName}, ${day.dayNumber} ${day.monthName}.`);
                    }
                  }}
                  title={`${day.isToday ? "Today" : day.dayName}, ${day.dayNumber} ${day.monthName}: ${isBusy ? "Marked Busy / On Leave" : "Free Slot - Available for Hire"}. Click to select.`}
                  className={`group relative flex flex-col items-center justify-between p-1 rounded-xl transition-all duration-150 cursor-pointer select-none active:scale-95 ${
                    isSelected
                      ? isBusy
                        ? "bg-rose-100 ring-2 ring-rose-500 text-rose-950 shadow-xs"
                        : "bg-emerald-100 ring-2 ring-emerald-500 text-emerald-950 shadow-xs"
                      : isBusy
                        ? "bg-rose-50/70 hover:bg-rose-100/90 text-rose-900 border border-rose-200/80"
                        : "bg-white hover:bg-emerald-50/80 text-slate-800 border border-slate-200/90 hover:border-emerald-300 shadow-2xs"
                  }`}
                >
                  {/* Day label: Today or Mon/Tue/etc */}
                  <span className={`text-[9px] font-bold uppercase tracking-wider leading-none mb-1 ${
                    day.isToday
                      ? "text-emerald-700 font-extrabold"
                      : isBusy
                        ? "text-rose-700"
                        : "text-slate-500"
                  }`}>
                    {day.isToday ? (language === "kn" ? "ಇಂದು" : "Today") : day.dayName.slice(0, 3)}
                  </span>

                  {/* Node Circle Pip */}
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-transform group-hover:scale-110 ${
                    isBusy
                      ? "bg-rose-500 text-white shadow-2xs"
                      : "bg-emerald-600 text-white shadow-2xs"
                  }`}>
                    {isBusy ? (
                      <Ban className="w-3 h-3 text-white stroke-[2.5]" />
                    ) : (
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    )}
                  </div>

                  {/* Day number below node */}
                  <span className={`text-[10px] font-extrabold mt-1 font-mono leading-none ${
                    isBusy ? "text-rose-800 line-through decoration-rose-400" : "text-slate-700"
                  }`}>
                    {day.dayNumber}
                  </span>

                  {/* Status chip */}
                  <span className={`text-[8px] font-bold uppercase px-1 py-0.2 mt-0.5 rounded leading-tight ${
                    isBusy 
                      ? "bg-rose-200/70 text-rose-900" 
                      : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {isBusy ? "Busy" : "Free"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected date feedback prompt if customer clicked on a timeline day */}
        {selectedScheduleDay && (
          <div className="mt-1.5 pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] animate-in fade-in duration-150">
            <span className="text-slate-600 flex items-center gap-1">
              <span className="font-semibold text-slate-800">
                {upcomingWeekDays.find(d => d.iso === selectedScheduleDay)?.dayName},{" "}
                {upcomingWeekDays.find(d => d.iso === selectedScheduleDay)?.dayNumber}{" "}
                {upcomingWeekDays.find(d => d.iso === selectedScheduleDay)?.monthName}:
              </span>
              <span className={
                (worker.unavailableDates && worker.unavailableDates.includes(selectedScheduleDay)) ||
                (selectedScheduleDay === todayIso && !isAvailableToday)
                  ? "text-rose-600 font-bold"
                  : "text-emerald-700 font-bold"
              }>
                {(worker.unavailableDates && worker.unavailableDates.includes(selectedScheduleDay)) ||
                (selectedScheduleDay === todayIso && !isAvailableToday)
                  ? (language === "kn" ? "ಕಾರ್ಯನಿರತ / ರಜೆ" : "Marked Busy")
                  : (language === "kn" ? "ಕೆಲಸಕ್ಕೆ ಲಭ್ಯ (Free Slot)" : "Free for Hire")}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedScheduleDay(null)}
              className="text-[10px] text-slate-400 hover:text-slate-600 font-medium underline cursor-pointer"
            >
              {language === "kn" ? "ಮುಚ್ಚಿ" : "Clear"}
            </button>
          </div>
        )}
      </div>

      {/* Profile Header Content */}
      <div className="p-5 flex-1 space-y-4">
        <div className="flex gap-4">
          <div className="relative shrink-0">
            <img 
              src={worker.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
              alt={worker.name} 
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-xl object-cover ring-2 ring-emerald-100 bg-slate-50"
            />
            <ActionTooltip label={isFavorite ? t("tooltipFavoriteRemove") : t("tooltipFavoriteSave")} position="right" className="absolute -bottom-1 -right-1">
              <button
                type="button"
                id={`avatar-favorite-btn-${worker.uid}`}
                onClick={() => onToggleFavorite && onToggleFavorite(worker.uid)}
                title={isFavorite ? t("tooltipFavoriteRemove") : t("tooltipFavoriteSave")}
                aria-label={isFavorite ? t("tooltipFavoriteRemove") : t("tooltipFavoriteSave")}
                className={`p-1 rounded-full border shadow-xs transition-all cursor-pointer ${
                  isFavorite 
                    ? "bg-rose-50 border-rose-200 text-rose-600 ring-2 ring-white" 
                    : "bg-white border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200"
                }`}
              >
                <Heart className={`w-3 h-3 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
              </button>
            </ActionTooltip>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900 text-base truncate flex items-center gap-1.5">
              {worker.name}
              {isAvailableToday ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" title="Available Today" />
              ) : isMarkedBusyToday ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                  {language === "kn" ? "ಇಂದು ರಜೆ" : "Busy Today"}
                </span>
              ) : null}
            </h3>
            
            <p className="text-slate-500 text-xs font-medium flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-650" />
              <span>{worker.locationName}</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-bold">
                {distance >= 9999 ? "Distance unavailable" : distance < 1 ? `< 1 ${t("km")} ${t("away")}` : `${distance} ${t("km")} ${t("away")}`}
              </span>
            </p>

            {/* Daily rate badge, experience badge, and rating badge */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold leading-normal border border-emerald-150/40 shadow-2xs">
                ₹{worker.dailyRate} {t("perDay")}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-50 text-slate-700 text-xs font-semibold leading-normal border border-slate-200">
                <Briefcase className="w-3 h-3 mr-1" /> {worker.experience} {t("experienceYears")}
              </span>
              <ActionTooltip label={t("tooltipViewReviews")} position="bottom">
                <button
                  type="button"
                  id={`header-rating-badge-${worker.uid}`}
                  data-testid={`worker-rating-${worker.uid}`}
                  onClick={() => {
                    setShowReviewsList(true);
                    setShowFeedbackForm(true);
                    const elem = document.getElementById(`worker-reviews-section-${worker.uid}`);
                    if (elem) elem.scrollIntoView({ behavior: "smooth", block: "nearest" });
                  }}
                  title={t("tooltipViewReviews")}
                  aria-label={t("tooltipViewReviews")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200/70 shadow-2xs transition-all cursor-pointer active:scale-95"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-extrabold">{averageRating}</span>
                  <span className="text-amber-700/80 font-normal text-[11px]">
                    ({reviews.length} {reviews.length === 1 ? (language === "kn" ? "ವಿಮರ್ಶೆ" : "review") : (language === "kn" ? "ವಿಮರ್ಶೆಗಳು" : "reviews")})
                  </span>
                </button>
              </ActionTooltip>
            </div>
          </div>
        </div>

        {/* Dynamic skills tag array - colorful individual pills */}
        <div 
          className="flex flex-wrap items-center gap-1.5 pt-0.5"
          data-testid={`worker-skills-${worker.uid}`}
          aria-label={`${worker.name}'s specialized skills`}
        >
          {worker.skills.map((skill) => {
            const theme = getSkillTheme(skill);
            return (
              <span 
                key={skill}
                data-testid={`skill-pill-${skill.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold leading-none border shadow-2xs transition-all duration-150 hover:shadow-xs hover:scale-[1.02] cursor-default select-none ${theme.bg} ${theme.text} ${theme.border}`}
                title={`${worker.name} specializes in ${skill}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${theme.dotColor} shrink-0`} />
                <span className={`${theme.iconColor} shrink-0`}>
                  {renderSkillIcon(theme.iconName, "w-3.5 h-3.5")}
                </span>
                <span className="font-bold tracking-tight">{skill}</span>
              </span>
            );
          })}

          {/* Quick Skill Radar Chart Trigger */}
          {worker.skills.length > 0 && (
            <button
              type="button"
              id={`btn-view-radar-${worker.uid}`}
              data-testid={`btn-view-radar-${worker.uid}`}
              onClick={() => setShowRadarModal(true)}
              title="View self-assessed skills proficiency radar chart"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs transition-all cursor-pointer hover:scale-105"
            >
              <Activity className="w-3 h-3 text-emerald-600" />
              <span>Skills Radar</span>
            </button>
          )}
        </div>

        {/* Small Static Map-Like Preview Card displaying worker distance, general town area, map icon, and simplified grid coordinates */}
        <div 
          id={`static-map-preview-${worker.uid}`}
          data-testid="static-map-preview-card"
          className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-emerald-50/20 p-3 shadow-2xs group transition-all"
        >
          {/* Subtle cartographic grid background pattern */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(#047857_1px,transparent_1px)] [background-size:10px_10px]" />

          <div className="relative flex items-center gap-3">
            {/* Left: Stylized Static Map-Like Radar / Grid Box */}
            <ActionTooltip label={t("tooltipDistance")} position="top">
              <div 
                className="relative w-24 h-20 sm:w-28 sm:h-22 rounded-lg bg-emerald-950/5 border border-emerald-900/15 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer shadow-2xs"
                onClick={() => setShowMiniMap(!showMiniMap)}
                title={t("tooltipDistance")}
                aria-label={t("tooltipDistance")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setShowMiniMap(!showMiniMap);
                  }
                }}
              >
                {/* SVG Grid Lines & Roads Canvas */}
                <svg className="absolute inset-0 w-full h-full stroke-emerald-900/15" fill="none">
                  <defs>
                    <pattern id={`map-grid-${worker.uid}`} width="12" height="12" patternUnits="userSpaceOnUse">
                      <path d="M 12 0 L 0 0 0 12" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 3" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#map-grid-${worker.uid})`} />
                  
                  {/* Stylized Transit Route Curve */}
                  <path 
                    d="M 16 62 C 34 58, 48 30, 82 22" 
                    stroke="#059669" 
                    strokeWidth="2" 
                    strokeDasharray="3 3"
                    className="animate-pulse"
                  />

                  {/* Secondary radial contour rings */}
                  <circle cx="82" cy="22" r="16" stroke="#10b981" strokeWidth="0.75" strokeOpacity="0.3" strokeDasharray="2 2" />
                  <circle cx="82" cy="22" r="7" stroke="#10b981" strokeWidth="0.75" strokeOpacity="0.5" />
                </svg>

                {/* Origin Marker (Customer's reference town) */}
                <div 
                  className="absolute left-3 bottom-3 flex items-center justify-center"
                  title={`Customer Location: ${customerTownName || "Selected Town"}`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-500 ring-2 ring-white shadow-xs" />
                </div>

                {/* Destination Marker (Worker's Hub Location with MapPin) */}
                <div 
                  className="absolute right-3.5 top-2.5 flex flex-col items-center justify-center"
                  title={`${worker.name}'s Hub: ${worker.locationName}`}
                >
                  <span className="relative flex h-5 w-5 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <MapPin className="relative w-4 h-4 fill-emerald-600 text-white drop-shadow-xs" />
                  </span>
                </div>

                {/* Compass Indicator in top-left */}
                <div className="absolute top-1.5 left-1.5 text-[9px] font-mono font-bold text-slate-400 flex items-center gap-0.5">
                  <Compass className="w-3 h-3 text-slate-400" />
                  <span>N</span>
                </div>

                {/* Distance Overlay Pill inside map graphic */}
                <div className="absolute bottom-1 right-1.5 bg-white/95 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-mono font-black text-emerald-800 border border-emerald-200/80 shadow-2xs">
                  {distance >= 9999 ? "Pending" : distance < 1 ? "< 1 km" : `${distance} km`}
                </div>
              </div>
            </ActionTooltip>

            {/* Right: Map Information & Simplified Grid Coordinates */}
            <div className="flex-1 min-w-0 space-y-1">
              {/* Header row: General Town Area & Proximity Badge */}
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 truncate">
                  <MapPin className="w-3.5 h-3.5 text-emerald-650 shrink-0" />
                  <span className="truncate">{worker.locationName}</span>
                </div>

                <ActionTooltip label={t("tooltipDistance")} position="top">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 cursor-help ${
                    distance >= 9999
                      ? "bg-slate-100 text-slate-700"
                      : distance <= 5 
                        ? "bg-emerald-100/90 text-emerald-800" 
                        : distance <= 25 
                          ? "bg-sky-100/90 text-sky-800" 
                          : "bg-amber-100/90 text-amber-850"
                  }`}>
                    {distance >= 9999 ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    ) : distance <= 5 ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ) : distance <= 25 ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    )}
                    <span>
                      {distance >= 9999 
                        ? "Location pending" 
                        : distance < 1 
                          ? `< 1 ${t("km")} ${t("away")}` 
                          : `${distance} ${t("km")} ${t("away")}`}
                    </span>
                  </span>
                </ActionTooltip>
              </div>

              {/* General Town Area Description / Corridor & Mini Map Toggle */}
              <div className="flex items-center justify-between gap-1.5 pt-0.5">
                <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 min-w-0 flex-1">
                  <Navigation className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {customerTownName ? `${customerTownName} → ${worker.locationName} Hub` : `${worker.locationName || "Local"} Service Zone`}
                  </span>
                </p>

                {/* Mini Map Leaflet expand button */}
                <ActionTooltip label={t("tooltipToggleMap")} position="top">
                  <button
                    type="button"
                    id={`toggle-minimap-${worker.uid}`}
                    onClick={() => setShowMiniMap(!showMiniMap)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-850 hover:underline cursor-pointer shrink-0"
                    title={t("tooltipToggleMap")}
                    aria-label={t("tooltipToggleMap")}
                  >
                    <Map className="w-3 h-3 text-emerald-600" />
                    <span>{showMiniMap ? t("closeMap") : t("miniMap")}</span>
                  </button>
                </ActionTooltip>
              </div>
            </div>
          </div>

          {/* Collapsible Leaflet Full Map inside preview card */}
          <AnimatePresence>
            {showMiniMap && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pt-2.5 border-t border-slate-200/70 mt-2.5"
              >
                <MiniMap
                  workerName={worker.name}
                  workerLat={worker.latitude || 12.9174}
                  workerLon={worker.longitude || 77.4838}
                  workerLocationName={worker.locationName}
                  customerLat={customerLat}
                  customerLon={customerLon}
                  customerTownName={customerTownName || "Selected Town"}
                  distance={distance}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Upcoming Availability & Leave Schedule Strip */}
        <div 
          id={`worker-schedule-${worker.uid}`}
          data-testid="worker-schedule-section"
          className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-2.5"
        >
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-650" />
              <span className="text-[11px] font-bold uppercase font-mono tracking-wider text-slate-700">
                {t("upcomingAvailability")}
              </span>
            </div>
            
            {upcomingUnavailableDates.length > 0 ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                <Ban className="w-2.5 h-2.5 text-rose-600" />
                <span>
                  {upcomingUnavailableDates.length} {language === "kn" ? "ದಿನಗಳಲ್ಲಿ ಕಾರ್ಯನಿರತ" : "busy upcoming days"}
                </span>
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                <Check className="w-2.5 h-2.5 text-emerald-650" />
                <span>
                  {language === "kn" ? "ಎಲ್ಲಾ ದಿನಗಳಲ್ಲಿ ಲಭ್ಯ" : "Available all days"}
                </span>
              </span>
            )}
          </div>

          {/* 7-Day Quick Day Cards */}
          <div className="grid grid-cols-7 gap-1">
            {upcomingWeekDays.map((day) => {
              const isBusy = Boolean(worker.unavailableDates && worker.unavailableDates.includes(day.iso));
              const isSelected = selectedScheduleDay === day.iso;

              return (
                <button
                  key={day.iso}
                  type="button"
                  id={`schedule-day-${worker.uid}-${day.iso}`}
                  data-testid={`schedule-day-${day.iso}`}
                  onClick={() => setSelectedScheduleDay(isSelected ? null : day.iso)}
                  title={`${day.dayName}, ${day.dayNumber} ${day.monthName}: ${isBusy ? "Marked Busy / Unavailable" : "Available for Hire"}`}
                  className={`flex flex-col items-center justify-between py-1.5 px-0.5 rounded-lg border text-center transition-all cursor-pointer select-none active:scale-95 ${
                    isSelected 
                      ? isBusy
                        ? "bg-rose-100 border-rose-400 ring-2 ring-rose-400/40 text-rose-950 shadow-xs"
                        : "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-400/40 text-emerald-950 shadow-xs"
                      : isBusy
                        ? "bg-rose-50/80 border-rose-200/90 text-rose-900 hover:bg-rose-100/90"
                        : "bg-white border-slate-200/90 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40"
                  }`}
                >
                  <span className={`text-[9px] font-bold font-mono uppercase leading-tight ${
                    day.isToday ? "text-emerald-700" : isBusy ? "text-rose-700" : "text-slate-400"
                  }`}>
                    {day.isToday ? (language === "kn" ? "ಇಂದು" : "Today") : day.dayName}
                  </span>
                  
                  <span className={`text-xs font-black my-0.5 leading-none ${
                    isBusy ? "text-rose-700 line-through decoration-rose-500/80" : "text-slate-900"
                  }`}>
                    {day.dayNumber}
                  </span>

                  <span className={`text-[8px] font-bold px-1 py-0.2 rounded leading-tight uppercase font-mono ${
                    isBusy 
                      ? "bg-rose-600 text-white" 
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                  }`}>
                    {isBusy ? "Busy" : "Free"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Interactive Date Feedback / Explanation Banner */}
          {selectedScheduleDay ? (() => {
            const isSelectedBusy = Boolean(
              worker.unavailableDates && worker.unavailableDates.includes(selectedScheduleDay)
            );
            return (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-2 rounded-lg text-[11px] leading-tight flex items-start justify-between gap-1.5 border ${
                  isSelectedBusy
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : "bg-emerald-50 border-emerald-200 text-emerald-900"
                }`}
              >
                <div className="flex items-start gap-1.5">
                  {isSelectedBusy ? (
                    <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold">
                      {formatDisplayDate(selectedScheduleDay)}:
                    </span>{" "}
                    {isSelectedBusy ? (
                      <span>
                        {language === "kn"
                          ? `${worker.name} ಈ ದಿನ ಲಭ್ಯವಿಲ್ಲ ಎಂದು ಗುರುತಿಸಿದ್ದಾರೆ. ದಯವಿಟ್ಟು ಬೇರೆ ದಿನವನ್ನು ಆಯ್ಕೆಮಾಡಿ.`
                          : `${worker.name} is marked UNAVAILABLE on this date. Please consider hiring for other available days.`}
                      </span>
                    ) : (
                      <span>
                        {language === "kn"
                          ? `${worker.name} ಈ ದಿನ ಕೆಲಸಕ್ಕೆ ಲಭ್ಯವಿದ್ದಾರೆ! ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸಬಹುದು.`
                          : `${worker.name} is AVAILABLE on this date! You can call directly to book.`}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedScheduleDay(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  title="Close inspection"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })() : upcomingUnavailableDates.length > 0 && (
            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 flex-wrap">
              <span className="font-mono uppercase font-bold text-rose-600 flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                <span>{language === "kn" ? "ರಜೆಯ ದಿನಗಳು:" : "Busy dates:"}</span>
              </span>
              <span className="text-slate-600 font-medium">
                {upcomingUnavailableDates.slice(0, 3).map(formatDisplayDate).join(" • ")}
                {upcomingUnavailableDates.length > 3 && ` +${upcomingUnavailableDates.length - 3} more`}
              </span>
            </div>
          )}
        </div>

        {/* Profile Bio */}
        <p className="text-slate-600 text-xs line-clamp-2 italic leading-relaxed">
          "{worker.about || "Local daily wage professional ready to deliver top work."}"
        </p>

        {/* Past Work Photo Grid (imageUrls) */}
        {(() => {
          const pastWorkPhotos = (worker.imageUrls && Array.isArray(worker.imageUrls) && worker.imageUrls.length > 0)
            ? worker.imageUrls
            : (worker.gallery && Array.isArray(worker.gallery) && worker.gallery.length > 0 ? worker.gallery : []);

          if (pastWorkPhotos.length === 0) return null;

          return (
            <div className="space-y-1.5" data-testid="worker-past-work-grid">
              <div className="flex items-center justify-between">
                <h4 className="text-slate-400 font-mono text-[9px] uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <ImageIcon className="w-3 h-3 text-emerald-600" />
                  <span>Past Work Portfolio ({pastWorkPhotos.length})</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  Click to inspect
                </span>
              </div>

              <div className={`grid gap-2 ${
                pastWorkPhotos.length === 1 
                  ? "grid-cols-1" 
                  : pastWorkPhotos.length === 2 
                    ? "grid-cols-2" 
                    : "grid-cols-3"
              }`}>
                {pastWorkPhotos.map((imgUrl, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setSelectedGalleryImg(imgUrl)}
                    className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-zoom-in shadow-2xs hover:border-emerald-400 hover:shadow-md transition-all duration-200"
                    title={`Click to view ${worker.name}'s work photo #${idx + 1}`}
                  >
                    <img 
                      src={imgUrl} 
                      alt={`${worker.name} work sample #${idx + 1}`} 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=300";
                      }}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 backdrop-blur-[1px]">
                      <span className="bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-xs shadow-sm">
                        <Eye className="w-3 h-3 text-emerald-400" />
                        <span>View</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Dedicated In-Card Customer Star Rating & Review Section */}
        <div 
          id={`worker-reviews-section-${worker.uid}`}
          data-testid="customer-reviews-section"
          className="pt-3 border-t border-slate-200/90 space-y-3"
        >
          {/* Section Header with Average Rating & Controls */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  {language === "kn" ? "ಗ್ರಾಹಕರ ವಿಮರ್ಶೆಗಳು" : "Customer Reviews"}
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <span className="font-extrabold text-amber-900">{averageRating}</span>
                  <span className="text-slate-300">•</span>
                  <span>{reviews.length} {reviews.length === 1 ? (language === "kn" ? "ವಿಮರ್ಶೆ" : "review") : (language === "kn" ? "ವಿಮರ್ಶೆಗಳು" : "reviews")}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                id={`toggle-feedback-${worker.uid}`}
                data-testid="toggle-feedback-form-button"
                onClick={() => {
                  setShowFeedbackForm(!showFeedbackForm);
                  if (!showFeedbackForm) setShowReviewsList(true);
                }}
                className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer shadow-2xs ${
                  showFeedbackForm 
                    ? "bg-slate-100 text-slate-700 border-slate-300"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-250"
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current text-emerald-600" />
                <span>{showFeedbackForm ? (language === "kn" ? "ಫಾರ್ಮ್ ಮುಚ್ಚಿ" : "Close Form") : (language === "kn" ? "+ ರೇಟಿಂಗ್ ನೀಡಿ" : "+ Leave Review")}</span>
                {showFeedbackForm ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <button
                type="button"
                id={`toggle-reviews-list-${worker.uid}`}
                onClick={() => setShowReviewsList(!showReviewsList)}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Toggle review list"
              >
                <MessageSquare className="w-3 h-3 text-slate-500" />
                <span>{showReviewsList ? (language === "kn" ? "ಮರೆಮಾಡಿ" : "Hide") : (language === "kn" ? "ನೋಡಿ" : "View")}</span>
              </button>
            </div>
          </div>

          {/* In-Card Celebratory Success Animation Banner */}
          <AnimatePresence>
            {isCelebrationActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="relative bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-4 rounded-xl shadow-lg border border-emerald-600/50 overflow-hidden"
              >
                {/* Decorative background glow */}
                <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />
                
                <div className="flex items-start gap-3 relative z-10">
                  <motion.div
                    initial={{ rotate: -20, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", delay: 0.05, stiffness: 500 }}
                    className="w-10 h-10 rounded-xl bg-emerald-500/25 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-300 shadow-inner"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 font-mono flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                        {language === "kn" ? "ವಿಮರ್ಶೆ ಪ್ರಕಟವಾಗಿದೆ" : "Feedback Published"}
                      </span>
                      <span className="text-[9px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.2 rounded-full font-bold">
                        Firestore Sub-Collection
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white leading-tight">
                      {language === "kn" ? `${worker.name} ರವರಿಗೆ ವಿಮರ್ಶೆ ನೀಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು!` : `Thank you for reviewing ${worker.name}!`}
                    </h4>
                    <p className="text-[11px] text-emerald-200/90 mt-0.5 leading-snug">
                      {language === "kn" 
                        ? "ನಿಮ್ಮ ರೇಟಿಂಗ್ ಮತ್ತು ವಿಮರ್ಶೆ ಈಗ ಈ ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ನೇರವಾಗಿ ಗೋಚರಿಸುತ್ತಿದೆ."
                        : "Your rating and review are now live on the worker's card for other customers."}
                    </p>
                    
                    {/* Animated gold stars sequence */}
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <motion.div
                          key={s}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1 + s * 0.05, type: "spring" }}
                        >
                          <Star 
                            className={`w-3.5 h-3.5 ${
                              toastData && s <= toastData.rating 
                                ? "fill-amber-400 text-amber-400" 
                                : "text-emerald-800"
                            }`} 
                          />
                        </motion.div>
                      ))}
                      {toastData && (
                        <span className="text-[10px] text-emerald-300 font-mono font-bold ml-1.5">
                          {toastData.rating}.0 / 5.0
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setIsCelebrationActive(false)}
                    className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-800/60 transition cursor-pointer"
                    aria-label="Close celebration message"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive Customer Review Form */}
          {showFeedbackForm && (
            <form 
              onSubmit={handleSubmitReview}
              data-testid={`review-form-${worker.uid}`}
              className="bg-gradient-to-b from-slate-50 to-white p-4 rounded-xl border border-emerald-200/80 shadow-xs space-y-3.5"
            >
              <div className="flex items-center justify-between pb-1 border-b border-slate-150">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{language === "kn" ? "ಕೆಲಸದ ಗುಣಮಟ್ಟಕ್ಕೆ ರೇಟಿಂಗ್ ನೀಡಿ" : `Rate ${worker.name}'s Work Quality`}</span>
                </span>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                  {ratingDescriptions[activeDisplayRating]?.[language] || ratingDescriptions[activeDisplayRating]?.en}
                </span>
              </div>

              {/* 1-5 Star Rating Interactive Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase font-mono tracking-wider text-slate-500 mb-1.5">
                  {language === "kn" ? "1 ರಿಂದ 5 ಸ್ಟಾರ್ ಆಯ್ಕೆಮಾಡಿ:" : "Select Star Rating (1 to 5 Stars):"}
                </label>
                <div 
                  className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200"
                  role="radiogroup"
                  aria-label="Star rating out of 5"
                >
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = starVal <= activeDisplayRating;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        id={`star-btn-${worker.uid}-${starVal}`}
                        data-testid={`star-rating-button-${starVal}`}
                        role="radio"
                        aria-checked={starVal === rating}
                        aria-label={`${starVal} Star${starVal > 1 ? "s" : ""}`}
                        onClick={() => setRating(starVal)}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-hidden group"
                        title={`${starVal} star${starVal > 1 ? "s" : ""}`}
                      >
                        <Star 
                          className={`w-6 h-6 transition-all duration-150 ${
                            isFilled 
                              ? "fill-amber-400 text-amber-500 drop-shadow-xs" 
                              : "text-slate-300 group-hover:text-amber-300"
                          }`} 
                        />
                      </button>
                    );
                  })}
                  <span className="ml-auto font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {rating}.0 / 5.0
                  </span>
                </div>
              </div>

              {/* Customer Name Field */}
              <div>
                <label className="block text-[10px] font-bold uppercase font-mono text-slate-600 mb-1">
                  {language === "kn" ? "ನಿಮ್ಮ ಹೆಸರು (ಗ್ರಾಹಕರು)" : "Your Name (Customer)"}
                </label>
                <input
                  type="text"
                  placeholder={language === "kn" ? "ಉದಾ: ನಾಗರಾಜ್ ಕೆ." : "e.g. Nagaraj K. / Homeowner"}
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Review Comment Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold uppercase font-mono text-slate-600">
                    {language === "kn" ? "ವಿಮರ್ಶೆ ಮತ್ತು ಕೆಲಸದ ವಿವರಣೆ" : "Customer Review & Work Feedback"}
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {comment.length}/500 {language === "kn" ? "ಅಕ್ಷರಗಳು" : "chars"}
                  </span>
                </div>
                <textarea
                  id={`review-comment-${worker.uid}`}
                  data-testid="customer-review-comment-input"
                  rows={2}
                  maxLength={500}
                  placeholder={
                    language === "kn"
                      ? "ಕೆಲಸದ ಅನುಭವವನ್ನು ಹಂಚಿಕೊಳ್ಳಿ (ಉದಾ: ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಬಂದರು, ಅಚ್ಚುಕಟ್ಟಾಗಿ ಕೆಲಸ ಮುಗಿಸಿದರು)..."
                      : "Describe the work completed (e.g. Masonry wall finished neatly on time, very polite and reliable)..."
                  }
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden leading-relaxed"
                />
              </div>

              {/* In-UI Error Alert if Submission Fails */}
              {reviewError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="flex-1">{reviewError}</span>
                  <button 
                    type="button" 
                    onClick={() => setReviewError(null)} 
                    className="text-rose-500 hover:text-rose-800 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Form Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowFeedbackForm(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  {language === "kn" ? "ರದ್ದುಮಾಡಿ" : "Cancel"}
                </button>

                <div className="flex items-center gap-2">
                  {!currentUser && (
                    <span className="text-[10px] text-slate-500 italic hidden sm:inline">
                      {language === "kn" ? "* ಗೂಗಲ್ ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ" : "* Google verification"}
                    </span>
                  )}
                  <button
                    type="submit"
                    id={`submit-review-btn-${worker.uid}`}
                    data-testid="submit-customer-review-button"
                    disabled={submittingReview || !comment.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer uppercase tracking-wider disabled:cursor-not-allowed"
                  >
                    {submittingReview ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{language === "kn" ? "ಪ್ರಕಟಿಸಲಾಗುತ್ತಿದೆ..." : "Publishing..."}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        <span>
                          {currentUser 
                            ? (language === "kn" ? "ವಿಮರ್ಶೆ ಸಲ್ಲಿಸಿ" : "Submit Review") 
                            : (language === "kn" ? "ಸೈನ್ ಇನ್ ಮತ್ತು ಸಲ್ಲಿಸಿ" : "Sign In & Submit")}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Customer Reviews List */}
          {showReviewsList && (
            <div className="space-y-2 pt-1">
              {reviews.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-500">
                    <Star className="w-4 h-4 fill-amber-300 text-amber-500" />
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    {language === "kn"
                      ? `${worker.name} ರವರಿಗೆ ಇನ್ನೂ ಯಾವುದೇ ವಿಮರ್ಶೆಗಳಿಲ್ಲ. ಕೆಲಸ ಪಡೆದಿದ್ದೀರಾ? ಮೊದಲ ವಿಮರ್ಶೆಯನ್ನು ನೀಡಿ!`
                      : `No customer reviews yet for ${worker.name}. Hired this artisan recently? Be the first to leave a review!`}
                  </p>
                  {!showFeedbackForm && (
                    <button
                      type="button"
                      onClick={() => setShowFeedbackForm(true)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-2xs hover:bg-emerald-50 transition cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                      <span>{language === "kn" ? "ಮೊದಲ ವಿಮರ್ಶೆ ಬರೆಯಿರಿ" : "Write First Review"}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span className="font-mono font-bold uppercase tracking-wider">
                      {language === "kn" ? `ಇತ್ತೀಚಿನ ವಿಮರ್ಶೆಗಳು (${reviews.length})` : `Customer Reviews (${reviews.length})`}
                    </span>
                    <span className="font-semibold text-amber-800">
                      ★ {averageRating} {language === "kn" ? "ಸರಾಸರಿ" : "Average"}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {reviews.map((rev) => {
                      const isNewlyAdded = rev.id === newlyAddedReviewId;
                      const initial = (rev.authorName || "C").trim().charAt(0).toUpperCase();
                      return (
                        <div 
                          key={rev.id} 
                          data-testid={`review-item-${rev.id}`}
                          className={`p-3 rounded-xl border text-xs transition-all duration-300 ${
                            isNewlyAdded 
                              ? "bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-400/30 shadow-xs" 
                              : "bg-white border-slate-200 shadow-2xs"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                                {initial}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 truncate">{rev.authorName}</span>
                                  {isNewlyAdded && (
                                    <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider animate-pulse shrink-0">
                                      {language === "kn" ? "ಈಗಷ್ಟೇ" : "Just Posted"}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {formatReviewDate(rev.createdAt)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-0.5 shrink-0 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200/50">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star 
                                  key={s} 
                                  className={`w-3 h-3 ${s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} 
                                />
                              ))}
                              <span className="text-[10px] font-bold text-amber-900 ml-1 font-mono">
                                {rev.rating}.0
                              </span>
                            </div>
                          </div>

                          <p className="text-slate-700 text-xs leading-relaxed pl-8">
                            "{rev.comment}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Date-specific Availability Notice for Direct Call */}
      {(isMarkedBusyToday || (selectedScheduleDay && worker.unavailableDates?.includes(selectedScheduleDay))) && (
        <div 
          data-testid="schedule-call-warning"
          className="px-4 py-2 bg-amber-50/90 border-t border-amber-200/70 text-amber-900 text-xs flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">
              {selectedScheduleDay && worker.unavailableDates?.includes(selectedScheduleDay)
                ? (language === "kn" 
                    ? `${worker.name} ${formatDisplayDate(selectedScheduleDay)} ರಂದು ಕಾರ್ಯನಿರತರಾಗಿದ್ದಾರೆ.`
                    : `${worker.name} is marked unavailable on ${formatDisplayDate(selectedScheduleDay)}.`)
                : (language === "kn"
                    ? `${worker.name} ಇಂದು ಕಾರ್ಯನಿರತರಾಗಿದ್ದಾರೆ. ಮುಂಬರುವ ದಿನಗಳ ಬಗ್ಗೆ ವಿಚಾರಿಸಲು ಕರೆ ಮಾಡಿ.`
                    : `${worker.name} is marked busy today. Call to inquire for future dates.`)}
            </span>
          </div>
          <span className="text-[10px] font-bold font-mono text-amber-700 uppercase shrink-0">
            {language === "kn" ? "ಸೂಚನೆ" : "Notice"}
          </span>
        </div>
      )}

      {/* Worker Card Action Footer */}
      <div className="border-t border-slate-150 p-4 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2.5">
        {/* Review rating summary trigger */}
        <ActionTooltip label={t("tooltipViewReviews")} position="top">
          <button 
            id={`reviews-button-${worker.uid}`}
            data-testid={`reviews-button-${worker.uid}`}
            onClick={() => {
              setShowReviewsList(true);
              setShowFeedbackForm(true);
              const elem = document.getElementById(`worker-reviews-section-${worker.uid}`);
              if (elem) elem.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }}
            className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-750 transition text-xs font-bold cursor-pointer py-1.5 px-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs active:scale-95"
            title={t("tooltipViewReviews")}
            aria-label={t("tooltipViewReviews")}
          >
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-extrabold">{averageRating}</span>
            <span className="text-slate-500 font-normal">
              ({reviews.length} {reviews.length === 1 ? (language === "kn" ? "ವಿಮರ್ಶೆ" : "review") : t("reviews")})
            </span>
          </button>
        </ActionTooltip>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Social Media Share Profile Button */}
          <ActionTooltip label={t("tooltipShare")} position="top">
            <button
              id={`share-profile-button-${worker.uid}`}
              data-testid="share-profile-button"
              onClick={() => handleShareProfile(true)}
              title={t("tooltipShare")}
              aria-label={t("tooltipShare")}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer active:scale-95 shadow-2xs ${
                isCopied 
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/20" 
                  : "bg-white hover:bg-slate-100 hover:text-slate-900 border-slate-200 text-slate-700"
              }`}
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                  <span className="text-emerald-700 font-extrabold">{t("copied")}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t("share")}</span>
                </>
              )}
            </button>
          </ActionTooltip>

          {/* Download Profile Button */}
          <ActionTooltip label={t("tooltipDownloadPdf")} position="top">
            <button
              id={`download-profile-button-${worker.uid}`}
              data-testid="download-profile-button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              title={t("tooltipDownloadPdf")}
              aria-label={t("tooltipDownloadPdf")}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-100 hover:text-slate-900 border border-slate-200 text-slate-700 active:scale-95 py-2 px-3 rounded-xl text-xs font-bold shadow-2xs transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              {isDownloadingPdf ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-emerald-600 border-t-transparent" />
                  <span className="text-[11px]">{t("compilingPdf")}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t("downloadProfile")}</span>
                </>
              )}
            </button>
          </ActionTooltip>

          {/* Direct Message via WhatsApp Button with Pre-filled Template */}
          <div className="flex items-center shrink-0">
            <ActionTooltip label={t("tooltipWhatsapp")} position="top">
              <a 
                id={`whatsapp-direct-button-${worker.uid}`}
                data-testid="whatsapp-direct-message-button"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={t("tooltipWhatsapp")}
                aria-label={t("tooltipWhatsapp")}
                className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white py-2 px-3 rounded-l-xl text-xs font-black shadow-md shadow-emerald-950/15 tracking-wider hover:shadow-lg transition-all duration-200 uppercase group shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white text-white transition-transform group-hover:scale-110" />
                <span>{t("directMessageViaWhatsapp")}</span>
              </a>
            </ActionTooltip>
            <ActionTooltip label={t("tooltipWhatsappCustomize")} position="top">
              <button
                type="button"
                id={`whatsapp-customize-btn-${worker.uid}`}
                data-testid="whatsapp-customize-button"
                onClick={() => setShowWhatsAppModal(true)}
                title={t("tooltipWhatsappCustomize")}
                aria-label={t("tooltipWhatsappCustomize")}
                className="bg-[#20ba59] hover:bg-[#1caa4f] active:scale-95 text-white py-2 px-1.5 rounded-r-xl border-l border-emerald-600/40 shadow-md shadow-emerald-950/15 transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </ActionTooltip>
          </div>

          {/* Direct Call Button: on mobile triggers native tel: link; on desktop opens contact modal with copy number */}
          <ActionTooltip 
            label={isMobile ? t("tooltipDirectCall") : (language === "kn" ? "ಕರೆ ಮಾಡಲು ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ" : "View Phone & Call Worker")} 
            position="top"
          >
            {isMobile ? (
              <a 
                id={`direct-call-button-${worker.uid}`}
                data-testid="direct-call-button"
                href={`tel:${worker.phone.trim()}`}
                title={t("tooltipDirectCall")}
                aria-label={t("tooltipDirectCall")}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-2 px-3.5 rounded-xl text-xs font-black shadow-md shadow-emerald-700/20 tracking-wider hover:shadow-lg transition-all duration-200 uppercase group shrink-0"
              >
                <Phone className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                <span>{t("directCall")}</span>
              </a>
            ) : (
              <button
                type="button"
                id={`direct-call-button-${worker.uid}`}
                data-testid="direct-call-button"
                onClick={() => {
                  setShowDesktopCallModal(true);
                  setIsPhoneCopied(false);
                }}
                title={language === "kn" ? "ಕರೆ ಮಾಡಲು ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ" : "View Phone Number & Call"}
                aria-label={language === "kn" ? "ಕರೆ ಮಾಡಲು ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ" : "View Phone Number & Call"}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-2 px-3.5 rounded-xl text-xs font-black shadow-md shadow-emerald-700/20 tracking-wider hover:shadow-lg transition-all duration-200 uppercase group shrink-0 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                <span>{t("directCall")}</span>
              </button>
            )}
          </ActionTooltip>
        </div>
      </div>

      {/* Direct Message via WhatsApp Inquiry Modal */}
      {showWhatsAppModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          onClick={() => setShowWhatsAppModal(false)}
        >
          <div 
            className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 p-5 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            data-testid={`whatsapp-modal-${worker.uid}`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-xs">
                  <MessageCircle className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {t("directMessageViaWhatsapp")}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === "kn" 
                      ? `${worker.name} ರವರಿಗೆ ಮುಂಚಿತ ಸಿದ್ಧಪಡಿಸಿದ ಸಂದೇಶ ಕಳುಹಿಸಿ`
                      : `Send a pre-filled inquiry directly to ${worker.name}`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowWhatsAppModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                aria-label="Close WhatsApp dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Worker Summary Card */}
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <img 
                src={worker.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                alt={worker.name} 
                className="w-12 h-12 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
              />
              <div className="min-w-0 flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 truncate">{worker.name}</h4>
                  <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                    ₹{worker.dailyRate} {t("perDay")}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-650" />
                  <span>{worker.locationName} Hub</span>
                  <span className="text-slate-300">•</span>
                  <span>{worker.skills[0] || "Artisan"}</span>
                </p>
              </div>
            </div>

            {/* Quick Inquiry Presets */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                {language === "kn" ? "ತ್ವರಿತ ವಿಚಾರಣೆ ಆಯ್ಕೆಗಳು:" : "Quick Inquiry Presets:"}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {inquiryPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedInquiryPreset(preset.id);
                      setCustomerInquiry(preset.text);
                    }}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      selectedInquiryPreset === preset.id
                        ? "bg-emerald-50 border-emerald-400 text-emerald-800 shadow-2xs font-bold"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Inquiry Textarea */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                {t("yourInquiry")}
              </label>
              <textarea
                rows={2}
                value={customerInquiry}
                onChange={(e) => {
                  setCustomerInquiry(e.target.value);
                  setSelectedInquiryPreset("custom");
                }}
                placeholder={language === "kn" ? "ನಿಮ್ಮ ವಿಚಾರಣೆಯನ್ನು ಬರೆಯಿರಿ..." : "Describe what work you need done, preferred timing, or questions..."}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Live Pre-filled WhatsApp Message Template Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-1 text-emerald-800">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  {t("whatsappTemplatePreview")}
                </span>
                <span className="text-slate-400 lowercase">wa.me template</span>
              </div>
              <div className="bg-[#EFEAE2] p-3 rounded-xl border border-slate-200/90 relative">
                <div className="bg-[#DCF8C6] p-3 rounded-lg text-xs text-slate-800 shadow-2xs border border-emerald-200/50 whitespace-pre-line leading-relaxed font-sans">
                  {whatsappMessage}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCopyWhatsAppMessage}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {isCopiedWhatsApp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopiedWhatsApp ? (language === "kn" ? "ಕಾಪಿ ಆಗಿದೆ!" : "Copied!") : (language === "kn" ? "ಕಾಪಿ ಮಾಡಿ" : "Copy Template")}</span>
              </button>

              <a
                id={`modal-whatsapp-send-${worker.uid}`}
                data-testid="whatsapp-modal-send-link"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleSendInquiry}
                className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white py-2.5 px-4 rounded-xl text-xs font-black shadow-md tracking-wider uppercase transition-all duration-200"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>{t("sendOnWhatsapp")}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Direct Call Modal */}
      {showDesktopCallModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          onClick={() => setShowDesktopCallModal(false)}
        >
          <div 
            className="relative max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
            data-testid={`desktop-call-modal-${worker.uid}`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {language === "kn" ? `${worker.name} ರವರಿಗೆ ಕರೆ ಮಾಡಿ` : `Call ${worker.name}`}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === "kn" ? "ನೇರ ಕೆಲಸಗಾರ ಸಂಪರ್ಕ ವಿವರ" : "Direct Artisan Contact Details"}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowDesktopCallModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
                title="Close"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Worker Identity Capsule */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <img 
                src={worker.photo} 
                alt={worker.name} 
                className="w-12 h-12 rounded-xl object-cover border border-emerald-300 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-sm text-slate-900 truncate">{worker.name}</h4>
                <p className="text-xs text-emerald-800 font-semibold truncate">{worker.skills.join(", ")}</p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{worker.locationName}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-bold text-emerald-700">₹{worker.dailyRate}/day</span>
                </p>
              </div>
            </div>

            {/* Primary Action: Phone Number & Copy Box */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                {language === "kn" ? "ದೂರವಾಣಿ ಸಂಖ್ಯೆ (Phone Number):" : "Worker Phone Number:"}
              </label>
              
              <div className="flex items-center justify-between p-3.5 bg-emerald-50/70 border-2 border-emerald-500/30 rounded-xl gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Phone className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 tracking-wider select-all truncate">
                    {formatDisplayPhone(worker.phone)}
                  </span>
                </div>

                <button
                  type="button"
                  id={`btn-copy-phone-${worker.uid}`}
                  data-testid="copy-phone-number-button"
                  onClick={handleCopyPhoneNumber}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer ${
                    isPhoneCopied
                      ? "bg-emerald-700 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white"
                  }`}
                  title="Copy Phone Number"
                >
                  {isPhoneCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{language === "kn" ? "ಕಾಪಿ ಮಾಡಲಾಗಿದೆ!" : "Copied!"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{language === "kn" ? "ಸಂಖ್ಯೆ ನಕಲಿಸಿ" : "Copy Number"}</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed pt-0.5">
                {language === "kn"
                  ? "ಡೆಸ್ಕ್‌ಟಾಪ್ ಬಳಕೆದಾರರು: ನಿಮ್ಮ ಮೊಬೈಲ್ ಫೋನ್‌ನಿಂದ ಈ ಸಂಖ್ಯೆಗೆ ನೇರವಾಗಿ ಡಯಲ್ ಮಾಡಿ ಅಥವಾ ಕೆಳಗೆ WhatsApp ಮೂಲಕ ಸಂದೇಶ ಕಳುಹಿಸಿ."
                  : "Desktop user: Copy or dial this number on your phone to reach the worker directly with zero commission."}
              </p>
            </div>

            {/* Prominent WhatsApp Alternative Option */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>{language === "kn" ? "ಅಥವಾ WhatsApp ಮೂಲಕ ಸಂಪರ್ಕಿಸಿ:" : "Or Message via WhatsApp Web:"}</span>
              </label>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleSendInquiry()}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white py-3 px-4 rounded-xl text-xs font-bold shadow-md shadow-emerald-950/15 transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white text-white" />
                <span>{language === "kn" ? "WhatsApp ವೆಬ್ ಮೂಲಕ ಚಾಟ್ ಮಾಡಿ" : "Open Chat in WhatsApp Web"}</span>
              </a>
              <p className="text-[10px] text-slate-400 text-center">
                Works instantly on desktop browsers with pre-filled inquiry text.
              </p>
            </div>

            {/* Fallback tel: link for desktop users with VoIP/Skype/FaceTime */}
            <div className="pt-1 text-center border-t border-slate-100">
              <a 
                href={`tel:${worker.phone.trim()}`}
                className="text-[11px] text-slate-400 hover:text-emerald-700 underline font-mono transition"
                title="Open system dialer if configured"
              >
                {language === "kn" ? "ಕಂಪ್ಯೂಟರ್ ಡಯಲರ್ ಆಪ್‌ನಲ್ಲಿ ತೆರೆಯಿರಿ (tel:)" : "Have a calling app on your PC? Open system dialer"}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Social Media Share Modal */}
      {showShareModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="relative max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t("shareProfileTitle")}</h3>
                  <p className="text-[11px] text-slate-500">{t("shareProfileSubtitle")} {worker.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowShareModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                aria-label="Close share dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Worker Preview Card Snippet */}
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <img 
                src={worker.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                alt={worker.name} 
                className="w-12 h-12 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
              />
              <div className="min-w-0 flex-1 text-xs">
                <h4 className="font-bold text-slate-900 truncate">{worker.name}</h4>
                <div className="flex flex-wrap gap-1 my-1">
                  {worker.skills.slice(0, 3).map((skill) => {
                    const theme = getSkillTheme(skill);
                    return (
                      <span 
                        key={skill}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${theme.bg} ${theme.text} ${theme.border}`}
                      >
                        <span className={`w-1 h-1 rounded-full ${theme.dotColor}`} />
                        <span>{skill}</span>
                      </span>
                    );
                  })}
                </div>
                <p className="text-emerald-700 text-[10px] font-mono font-semibold">
                  {worker.locationName} Hub • ₹{worker.dailyRate} {t("perDay")}
                </p>
              </div>
            </div>

            {/* Generated Sharable Link Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>{t("sharableLink")}</span>
                {isCopied && (
                  <span className="text-emerald-600 text-[11px] font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> {t("copied")}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={generateShareUrl()} 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 select-all focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => handleShareProfile(false)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? t("copied") : t("copy")}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                This direct link highlights {worker.name}'s profile when opened by customers or contractors.
              </p>
            </div>

            {/* Social Media Sharing Channels */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Share directly via:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${worker.name}'s artisan profile on Namma Kelasa (Daily Rate: ₹${worker.dailyRate}/day):\n${generateShareUrl()}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition shadow-2xs cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  <span>WhatsApp</span>
                </a>

                {/* Twitter / X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Hire ${worker.name} directly on Namma Kelasa with zero commission! Rate: ₹${worker.dailyRate}/day`)}&url=${encodeURIComponent(generateShareUrl())}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition shadow-2xs cursor-pointer"
                >
                  <span className="font-mono font-black text-sm">𝕏</span>
                  <span>Twitter / X</span>
                </a>
              </div>

              {/* Native Mobile Share fallback if available */}
              {typeof navigator !== "undefined" && typeof (navigator as any).share === "function" && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition mt-2 cursor-pointer shadow-xs"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Open Device Share Menu</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Share Link Copied Toast Notification */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 backdrop-blur-md flex items-center gap-3 max-w-sm w-[calc(100vw-3rem)] pointer-events-auto"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-100">Profile Link Copied!</p>
              <p className="text-[11px] text-slate-400 truncate">
                Sharable link for {worker.name} copied to clipboard.
              </p>
            </div>
            <button
              onClick={() => setShareToast(false)}
              className="text-slate-400 hover:text-white p-1 text-xs cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Zoom Modal */}
      {selectedGalleryImg && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setSelectedGalleryImg(null)}
        >
          <div 
            className="relative max-w-xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">{worker.name}'s Past Work Sample</span>
              </div>
              <button 
                onClick={() => setSelectedGalleryImg(null)}
                aria-label="Close enlarged preview"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[75vh] flex items-center justify-center bg-black/40 overflow-hidden">
              <img 
                src={selectedGalleryImg} 
                alt={`${worker.name} work sample preview`} 
                referrerPolicy="no-referrer" 
                className="w-full max-h-[70vh] object-contain" 
              />
            </div>
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="truncate max-w-[70%]">{selectedGalleryImg}</span>
              <a 
                href={selectedGalleryImg} 
                target="_blank" 
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-sans font-semibold"
              >
                View Full Size ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Floating Viewport Feedback Toast Notification */}
      <AnimatePresence>
        {toastData && (
          <motion.aside
            key={toastData.id}
            initial={{ opacity: 0, y: 40, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100vw-3rem)] bg-slate-900/95 text-white border border-emerald-500/50 rounded-2xl shadow-2xl backdrop-blur-md p-4 overflow-hidden pointer-events-auto"
            role="status"
            aria-live="polite"
          >
            {/* Emerald animated accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
            
            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <img 
                  src={toastData.workerPhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                  alt={toastData.workerName}
                  className="w-11 h-11 rounded-xl object-cover ring-2 ring-emerald-400/50 bg-slate-800"
                />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
                    Review Published Live
                  </span>
                  <button
                    onClick={() => setToastData(null)}
                    className="text-slate-400 hover:text-white p-0.5 rounded transition cursor-pointer"
                    aria-label="Close notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h4 className="text-xs font-bold text-white truncate">
                  {toastData.workerName} • <span className="text-slate-300 font-normal">{toastData.workerSkill}</span>
                </h4>

                {/* Star rating icons */}
                <div className="flex items-center gap-1 my-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      className={`w-3.5 h-3.5 ${s <= toastData.rating ? "fill-amber-400 text-amber-400" : "text-slate-700"}`} 
                    />
                  ))}
                  <span className="text-[11px] font-bold text-amber-400 ml-1">
                    {toastData.rating}.0
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1 truncate">
                    by {toastData.authorName}
                  </span>
                </div>

                {/* Comment quote */}
                <p className="text-[11px] text-slate-300 italic line-clamp-2 leading-tight bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 mt-1">
                  "{toastData.comment}"
                </p>
              </div>
            </div>

            {/* Animated countdown progress indicator */}
            <div className="mt-3 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4.9, ease: "linear" }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Skills Radar Modal for Potential Customers */}
      {showRadarModal && (
        <div 
          id={`modal-radar-${worker.uid}`}
          data-testid={`modal-radar-${worker.uid}`}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowRadarModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span>{worker.name}</span>
                    <span className="text-slate-400 font-normal">•</span>
                    <span className="text-emerald-700 font-mono text-xs">{t("skillRadarTitle")}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Self-Assessed Craftsmanship & Trade Competencies
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRadarModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                aria-label="Close skills radar modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <SkillRadarChart
              skills={worker.skills}
              skillProficiencies={worker.skillProficiencies}
              isEditable={false}
              experienceYears={worker.experience}
            />

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowRadarModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {language === "kn" ? "ಮುಚ್ಚಿ" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
