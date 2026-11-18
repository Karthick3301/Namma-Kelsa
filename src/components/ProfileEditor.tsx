import React, { useState, useEffect, useRef } from "react";
import { 
  Save, 
  User, 
  Phone, 
  MapPin, 
  Briefcase, 
  Check, 
  Image as ImageIcon, 
  DollarSign, 
  FileText,
  UserCheck,
  Zap,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  Link,
  Calendar,
  CalendarDays,
  CalendarX,
  CalendarCheck,
  Ban,
  Clock,
  QrCode,
  Printer,
  Download,
  Copy,
  X,
  Compass,
  Navigation,
  Crosshair,
  Locate,
  Home,
  Search as SearchIcon,
  Loader2,
  Sliders,
  Globe,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Camera,
  Mic,
  MicOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import { WorkerProfile, TOWN_CENTERS, INDIAN_MAJOR_CITIES, CityHub } from "../types";
import ChipGroup from "./ChipGroup";
import { 
  compressAndConvertImage, 
  PRESET_AVATARS, 
  PRESET_GALLERIES,
  formatDateToISO,
  getUpcomingDays,
  formatDisplayDate,
  formatReverseGeocodedLocation
} from "../utils";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { useLanguage, getBioSuggestions } from "../context/LanguageContext";

interface ProfileEditorProps {
  uid: string;
  onSaveSuccess: () => void;
}

const MAX_WORK_PHOTOS = 6;
const MAX_BIO_LENGTH = 200;
const MAX_RAW_IMAGE_BYTES = 15 * 1024 * 1024;

const SKILL_LEVEL_OPTIONS = [
  { key: "skillLevelBeginner", score: 60 },
  { key: "skillLevelExperienced", score: 80 },
  { key: "skillLevelExpert", score: 95 }
] as const;

function mapScoreToSkillLevel(score: number | undefined): 60 | 80 | 95 {
  if (typeof score !== "number" || !Number.isFinite(score)) return 80;
  if (score < 70) return 60;
  if (score < 87.5) return 80;
  return 95;
}

function formatShortBusyDate(isoString: string): string {
  if (!isoString) return "";
  const parts = isoString.split("-").map(Number);
  if (parts.length !== 3) return isoString;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
  return `${dayName} ${d.getDate()}`;
}

// Sample past work URLs for instant 1-click addition
const SAMPLE_WORK_URLS = [
  { label: "Wall Painting", url: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=600" },
  { label: "Plumbing & Masonry", url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600" },
  { label: "Electrical Work", url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600" },
  { label: "Lawn & Gardening", url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=600" },
  { label: "Tile & Flooring", url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600" }
];

export default function ProfileEditor({ uid, onSaveSuccess }: ProfileEditorProps) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLiveToast, setShowLiveToast] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");
  const [showSampleAvatars, setShowSampleAvatars] = useState(false);
  const [showAdvancedPhotoLink, setShowAdvancedPhotoLink] = useState(false);
  const [showManualDaysCalendar, setShowManualDaysCalendar] = useState(false);
  const [isUploadingWorkPhotos, setIsUploadingWorkPhotos] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [workPhotoError, setWorkPhotoError] = useState("");
  const [isListeningBio, setIsListeningBio] = useState(false);
  const [voiceBioError, setVoiceBioError] = useState("");
  const speechRecognitionRef = useRef<any>(null);
  const SpeechRecognitionCtor =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : undefined;
  const isSpeechSupported = Boolean(SpeechRecognitionCtor);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [brokenPresets, setBrokenPresets] = useState<Record<string, boolean>>({});
  const [brokenPortfolioUrls, setBrokenPortfolioUrls] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<{
    about: boolean;
    portfolio: boolean;
    skillLevel: boolean;
    calendar: boolean;
    qr: boolean;
  }>({
    about: false,
    portfolio: false,
    skillLevel: false,
    calendar: false,
    qr: false
  });

  useEffect(() => {
    return () => {
      try {
        speechRecognitionRef.current?.abort?.();
      } catch {
        // Ignore abort cleanup error
      }
    };
  }, []);

  const toggleAccordionSection = (key: "about" | "portfolio" | "skillLevel" | "calendar" | "qr") => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Primary worker state properties
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillProficiencies, setSkillProficiencies] = useState<Record<string, number>>({});
  const [dailyRate, setDailyRate] = useState<string>("");
  const [dailyRateError, setDailyRateError] = useState<string>("");
  
  // Location states (Supports All-India Hubs, Live Device GPS, and Custom Addresses)
  const [selectedLocationIdx, setSelectedLocationIdx] = useState<number | null>(0);
  const [locationName, setLocationName] = useState<string>(TOWN_CENTERS[0].name);
  const [latitude, setLatitude] = useState<number>(TOWN_CENTERS[0].latitude);
  const [longitude, setLongitude] = useState<number>(TOWN_CENTERS[0].longitude);
  const [locationSource, setLocationSource] = useState<"preset" | "live" | "custom">("preset");

  // Custom address / Live GPS / Manual inputs
  const [customAddressInput, setCustomAddressInput] = useState<string>("");
  const [manualLatInput, setManualLatInput] = useState<string>(TOWN_CENTERS[0].latitude.toString());
  const [manualLngInput, setManualLngInput] = useState<string>(TOWN_CENTERS[0].longitude.toString());
  const [showManualCoords, setShowManualCoords] = useState<boolean>(false);
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [locationFeedback, setLocationFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // All-India City Search & Filter
  const [citySearchQuery, setCitySearchQuery] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [isSearchingOnlineTown, setIsSearchingOnlineTown] = useState<boolean>(false);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const citySearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showLocationModal) {
      const timer = setTimeout(() => {
        citySearchInputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [showLocationModal]);

  const [isAvailable, setIsAvailable] = useState(true);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [customDateInput, setCustomDateInput] = useState<string>("");
  const [photo, setPhoto] = useState(PRESET_AVATARS[0].url);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [inputUrl, setInputUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [experience, setExperience] = useState<string>("");
  const [about, setAbout] = useState("");
  const [existingCreatedAt, setExistingCreatedAt] = useState<any>(null);

  // Printable QR Code Modal for Offline Marketing
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  // Generate unique sharing URL linked directly to this worker
  const getShareUrl = () => {
    try {
      const origin = window.location.origin;
      return `${origin}/?worker=${uid}`;
    } catch {
      return `/?worker=${uid}`;
    }
  };

  const handleOpenQrModal = async () => {
    setIsGeneratingQr(true);
    setShowQrModal(true);
    try {
      const shareUrl = getShareUrl();
      const dataUrl = await QRCode.toDataURL(shareUrl, {
        width: 600,
        margin: 2,
        color: {
          dark: "#064e3b", // Deep emerald green for crisp contrast
          light: "#ffffff"
        },
        errorCorrectionLevel: "H"
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error("Failed to generate QR code:", err);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handleCopyShareLink = async () => {
    const shareUrl = getShareUrl();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy share link:", err);
    }
  };

  const handleDownloadQrPng = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `namma-kelsa-qr-${(name || "worker").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintFlyer = () => {
    window.print();
  };

  // Fetch existing profile on load
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const profilePath = `workers/${uid}`;
      try {
        const docRef = doc(db, profilePath);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profile = docSnap.data() as WorkerProfile;
          const loadedName = profile.name || "";
          const loadedPhone = profile.phone || "";
          const loadedSkills = profile.skills || [];
          const loadedProficiencies = profile.skillProficiencies || {};
          const loadedRateNum = Number(profile.dailyRate);
          const loadedRateStr = Number.isFinite(loadedRateNum) && loadedRateNum > 0 ? String(Math.floor(loadedRateNum)) : "";
          const loadedIsAvailable = profile.isAvailable !== false;
          const loadedUnavailableDates =
            profile.unavailableDates && Array.isArray(profile.unavailableDates)
              ? profile.unavailableDates.filter(Boolean)
              : [];
          const loadedPhoto = profile.photo || PRESET_AVATARS[0].url;
          const loadedUrls = (profile.imageUrls && Array.isArray(profile.imageUrls) && profile.imageUrls.length > 0)
            ? profile.imageUrls
            : (profile.gallery && profile.gallery.length > 0 ? profile.gallery : PRESET_GALLERIES[0].urls);
          const hasValidExperience =
            profile.experience !== undefined &&
            profile.experience !== null &&
            profile.experience !== ("" as unknown as number) &&
            Number.isFinite(Number(profile.experience)) &&
            Number(profile.experience) >= 0;
          const loadedExperienceStr = hasValidExperience ? String(Math.floor(Number(profile.experience))) : "";
          const loadedAbout = profile.about || "";

          setName(loadedName);
          setPhone(loadedPhone);
          setSkills(loadedSkills);
          setSkillProficiencies(loadedProficiencies);
          setDailyRate(loadedRateStr);
          setDailyRateError("");
          setIsAvailable(loadedIsAvailable);
          setUnavailableDates(loadedUnavailableDates);
          setPhoto(loadedPhoto);
          setImageUrls(loadedUrls);
          setExperience(loadedExperienceStr);
          setAbout(loadedAbout);
          setExistingCreatedAt(profile.createdAt || null);
          
          // Populate location states
          const initialLocName = profile.locationName || TOWN_CENTERS[0].name;
          const initialLat = typeof profile.latitude === "number" ? profile.latitude : TOWN_CENTERS[0].latitude;
          const initialLng = typeof profile.longitude === "number" ? profile.longitude : TOWN_CENTERS[0].longitude;

          setLocationName(initialLocName);
          setLatitude(initialLat);
          setLongitude(initialLng);
          setCustomAddressInput(initialLocName);
          setManualLatInput(initialLat.toString());
          setManualLngInput(initialLng.toString());

          // Match selected town matching TOWN_CENTERS
          const townIdx = TOWN_CENTERS.findIndex(t => t.name.toLowerCase() === initialLocName.toLowerCase());
          if (townIdx !== -1) {
            setSelectedLocationIdx(townIdx);
            setLocationSource("preset");
          } else if (profile.latitude && profile.longitude) {
            // Check if coordinates match a known preset hub within tight radius (< 0.008 deg ~800m)
            let bestIdx = -1;
            let minDiff = Infinity;
            TOWN_CENTERS.forEach((t, idx) => {
              const diff = Math.hypot(t.latitude - initialLat, t.longitude - initialLng);
              if (diff < minDiff) {
                minDiff = diff;
                bestIdx = idx;
              }
            });
            if (minDiff < 0.008 && bestIdx !== -1) {
              setSelectedLocationIdx(bestIdx);
              setLocationSource("preset");
            } else {
              setSelectedLocationIdx(null);
              setLocationSource("custom");
            }
          } else {
            setSelectedLocationIdx(null);
            setLocationSource("custom");
          }

          setSavedSnapshot(
            JSON.stringify({
              name: loadedName,
              phone: loadedPhone,
              dailyRate: loadedRateStr,
              experience: loadedExperienceStr,
              locationName: initialLocName,
              latitude: initialLat,
              longitude: initialLng,
              skills: loadedSkills,
              skillProficiencies: loadedProficiencies,
              about: loadedAbout,
              photo: loadedPhoto,
              imageUrls: loadedUrls,
              isAvailable: loadedIsAvailable,
              unavailableDates: loadedUnavailableDates
            })
          );
        } else {
          // Initialize defaults for new profile
          const defaultLoc = TOWN_CENTERS[0];
          const defaultAbout = "";
          const defaultUrls = PRESET_GALLERIES[0].urls;
          const defaultPhoto = PRESET_AVATARS[0].url;

          setName("");
          setPhone("");
          setSkills([]);
          setSkillProficiencies({});
          setDailyRate("");
          setDailyRateError("");
          setExperience("");
          setSelectedLocationIdx(0);
          setLocationName(defaultLoc.name);
          setLatitude(defaultLoc.latitude);
          setLongitude(defaultLoc.longitude);
          setLocationSource("preset");
          setCustomAddressInput(defaultLoc.name);
          setManualLatInput(defaultLoc.latitude.toString());
          setManualLngInput(defaultLoc.longitude.toString());
          setIsAvailable(true);
          setUnavailableDates([]);
          setPhoto(defaultPhoto);
          setImageUrls(defaultUrls);
          setAbout(defaultAbout);
          setExistingCreatedAt(null);

          setSavedSnapshot(
            JSON.stringify({
              name: "",
              phone: "",
              dailyRate: "",
              experience: "",
              locationName: defaultLoc.name,
              latitude: defaultLoc.latitude,
              longitude: defaultLoc.longitude,
              skills: [],
              skillProficiencies: {},
              about: defaultAbout,
              photo: defaultPhoto,
              imageUrls: defaultUrls,
              isAvailable: true,
              unavailableDates: []
            })
          );
        }
      } catch (err) {
        // Log error but allow creation of new
        console.error("No worker profile found yet or permissions issue. Setting up default blank profile.");
        setSavedSnapshot(
          JSON.stringify({
            name: "",
            phone: "",
            dailyRate: "",
            experience: "",
            locationName: TOWN_CENTERS[0].name,
            latitude: TOWN_CENTERS[0].latitude,
            longitude: TOWN_CENTERS[0].longitude,
            skills: [],
            skillProficiencies: {},
            about: "",
            photo: PRESET_AVATARS[0].url,
            imageUrls: [],
            isAvailable: true,
            unavailableDates: []
          })
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [uid]);

  // Past Work image URL management
  const handleAddImageUrl = (urlToAdd?: string) => {
    const targetUrl = (urlToAdd || inputUrl).trim();
    if (!targetUrl) return;

    if (imageUrls.length >= MAX_WORK_PHOTOS) {
      setUrlError(t("photoLimitReachedError"));
      setWorkPhotoError(t("photoLimitReachedError"));
      return;
    }

    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://") && !targetUrl.startsWith("data:image/")) {
      setUrlError("Please enter a valid image web URL starting with https:// or http://");
      return;
    }

    if (imageUrls.includes(targetUrl)) {
      setUrlError("This photo has already been added.");
      return;
    }

    setImageUrls([...imageUrls, targetUrl]);
    setInputUrl("");
    setUrlError("");
    setWorkPhotoError("");
  };

  const handleRemoveImageUrl = (indexToRemove: number) => {
    setImageUrls(imageUrls.filter((_, idx) => idx !== indexToRemove));
    setWorkPhotoError("");
    setUrlError("");
  };

  const syncSavedSnapshotPatch = (patch: Partial<{ isAvailable: boolean; unavailableDates: string[] }>) => {
    setSavedSnapshot((prev) => {
      if (!prev) return prev;
      try {
        const parsed = JSON.parse(prev);
        return JSON.stringify({ ...parsed, ...patch });
      } catch {
        return prev;
      }
    });
  };

  // Handle instant toggle for availability
  const handleAvailabilityToggle = async (checked: boolean) => {
    setIsAvailable(checked);
    const profilePath = `workers/${uid}`;
    try {
      const docRef = doc(db, profilePath);
      // If document exists, we can run a merge update for isAvailable dynamically!
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await setDoc(docRef, { 
          isAvailable: checked,
          updatedAt: serverTimestamp()
        }, { merge: true });
        syncSavedSnapshotPatch({ isAvailable: checked });
        setSuccessMsg(`Availability updated to: ${checked ? "AVAILABLE TODAY" : "NOT AVAILABLE"}`);
        setTimeout(() => setSuccessMsg(""), 3500);
        onSaveSuccess();
      }
    } catch (err) {
      console.warn("Could not instantly save availability state because profile is not fully created yet.");
    }
  };

  // Handle instant toggle for specific future unavailable date
  const handleToggleUnavailableDate = async (dateIso: string) => {
    if (!dateIso) return;
    const isCurrentlyUnavailable = unavailableDates.includes(dateIso);
    const updatedDates = isCurrentlyUnavailable
      ? unavailableDates.filter(d => d !== dateIso)
      : [...unavailableDates, dateIso].sort();

    setUnavailableDates(updatedDates);

    const profilePath = `workers/${uid}`;
    try {
      const docRef = doc(db, profilePath);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await setDoc(docRef, {
          unavailableDates: updatedDates,
          updatedAt: serverTimestamp()
        }, { merge: true });
        syncSavedSnapshotPatch({ unavailableDates: updatedDates });
        setSuccessMsg(
          isCurrentlyUnavailable
            ? `Date ${formatDisplayDate(dateIso)} is now marked as AVAILABLE.`
            : `Date ${formatDisplayDate(dateIso)} marked as UNAVAILABLE.`
        );
        setTimeout(() => setSuccessMsg(""), 3500);
        onSaveSuccess();
      }
    } catch (err) {
      console.warn("Could not instantly save date availability because profile is not fully created yet.");
    }
  };

  // Quick helper: mark tomorrow as busy
  const handleMarkTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = formatDateToISO(tomorrow);
    handleToggleUnavailableDate(tomorrowIso);
  };

  // Quick helper: toggle upcoming weekend (Sat + Sun)
  const handleMarkWeekend = async () => {
    const upcoming = getUpcomingDays(7);
    const weekendIsos = upcoming.filter(d => d.isWeekend).map(d => d.iso);
    if (weekendIsos.length === 0) return;

    const allWeekendMarked = weekendIsos.every(iso => unavailableDates.includes(iso));
    let updatedDates: string[];
    if (allWeekendMarked) {
      updatedDates = unavailableDates.filter(d => !weekendIsos.includes(d));
    } else {
      updatedDates = Array.from(new Set([...unavailableDates, ...weekendIsos])).sort();
    }

    setUnavailableDates(updatedDates);

    const profilePath = `workers/${uid}`;
    try {
      const docRef = doc(db, profilePath);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await setDoc(docRef, {
          unavailableDates: updatedDates,
          updatedAt: serverTimestamp()
        }, { merge: true });
        syncSavedSnapshotPatch({ unavailableDates: updatedDates });
        setSuccessMsg(
          allWeekendMarked 
            ? "Upcoming weekend dates unmarked (now available)!" 
            : "Upcoming weekend marked as unavailable / on leave!"
        );
        setTimeout(() => setSuccessMsg(""), 3500);
        onSaveSuccess();
      }
    } catch (err) {
      console.warn("Could not instantly save weekend availability.");
    }
  };

  // Quick helper: clear all marked dates
  const handleClearAllDates = async () => {
    if (unavailableDates.length === 0) return;
    setUnavailableDates([]);

    const profilePath = `workers/${uid}`;
    try {
      const docRef = doc(db, profilePath);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await setDoc(docRef, {
          unavailableDates: [],
          updatedAt: serverTimestamp()
        }, { merge: true });
        syncSavedSnapshotPatch({ unavailableDates: [] });
        setSuccessMsg("All unavailable dates cleared. You are listed as available on all days!");
        setTimeout(() => setSuccessMsg(""), 3500);
        onSaveSuccess();
      }
    } catch (err) {
      console.warn("Could not clear dates.");
    }
  };

  // Add custom date from date input
  const handleAddCustomDate = () => {
    if (!customDateInput) return;
    if (!unavailableDates.includes(customDateInput)) {
      handleToggleUnavailableDate(customDateInput);
    }
    setCustomDateInput("");
  };

  // Profile image upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const compressedBase64 = await compressAndConvertImage(e.target.files[0], 120, 120, 0.7);
        setPhoto(compressedBase64);
        setAvatarBroken(false);
        setSuccessMsg("Profile photo uploaded!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } catch (err) {
        setErrorMsg("Failed to upload image. Please try a smaller file.");
      }
    }
  };

  // Handle multi-file local upload compressed in browser (max 1024px, JPEG ~0.7) up to 6 photos
  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList: File[] = e.target.files ? Array.from<File>(e.target.files) : [];
    if (fileList.length === 0) return;

    setWorkPhotoError("");
    setUrlError("");

    const remainingSlots = MAX_WORK_PHOTOS - imageUrls.length;
    if (remainingSlots <= 0) {
      setWorkPhotoError(t("photoLimitReachedError"));
      e.target.value = "";
      return;
    }

    const validFiles: File[] = [];
    let firstError = "";

    for (const file of fileList) {
      const looksLikeImage =
        file.type.startsWith("image/") ||
        /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name);
      if (!looksLikeImage) {
        if (!firstError) firstError = t("photoInvalidTypeError");
        continue;
      }
      if (file.size > MAX_RAW_IMAGE_BYTES) {
        if (!firstError) firstError = t("photoTooLargeError");
        continue;
      }
      validFiles.push(file);
    }

    const filesToProcess = validFiles.slice(0, remainingSlots);
    if (validFiles.length > remainingSlots && !firstError) {
      firstError = t("photoLimitReachedError");
    }

    if (filesToProcess.length === 0) {
      setWorkPhotoError(firstError || t("photoInvalidTypeError"));
      e.target.value = "";
      return;
    }

    setIsUploadingWorkPhotos(true);
    const compressedUrls: string[] = [];

    try {
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        setUploadProgressText(
          filesToProcess.length > 1
            ? `${t("addingPhotosBtn")} (${i + 1}/${filesToProcess.length})`
            : t("addingPhotosBtn")
        );
        try {
          let compressedBase64 = await compressAndConvertImage(file, 1024, 1024, 0.7);
          // Safety re-compression if noisy photo is unusually large so Firestore doc stays small
          if (compressedBase64.length > 220000) {
            compressedBase64 = await compressAndConvertImage(file, 800, 800, 0.6);
          }
          compressedUrls.push(compressedBase64);
        } catch {
          if (!firstError) firstError = t("photoUploadFailedError");
        }
      }

      if (compressedUrls.length > 0) {
        setImageUrls((prev) => [...prev, ...compressedUrls].slice(0, MAX_WORK_PHOTOS));
      }
      if (firstError) {
        setWorkPhotoError(firstError);
      }
    } finally {
      setIsUploadingWorkPhotos(false);
      setUploadProgressText("");
      e.target.value = "";
    }
  };

  // Bio suggestion chip tap helper (keeps user editable & enforces 200-char limit)
  const handleTapBioSuggestion = (chipText: string) => {
    setVoiceBioError("");
    setAbout((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return chipText.slice(0, MAX_BIO_LENGTH);
      }
      if (trimmed.includes(chipText)) {
        return prev;
      }
      const combined = `${trimmed} ${chipText}`;
      if (combined.length <= MAX_BIO_LENGTH) {
        return combined;
      }
      return chipText.slice(0, MAX_BIO_LENGTH);
    });
  };

  // Web Speech API voice typing helper for bio
  const handleToggleVoiceBio = () => {
    if (!SpeechRecognitionCtor) return;

    if (isListeningBio && speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore stop error
      }
      setIsListeningBio(false);
      return;
    }

    try {
      const langLocaleMap: Record<string, string> = {
        en: "en-IN",
        kn: "kn-IN",
        ta: "ta-IN",
        te: "te-IN",
        hi: "hi-IN"
      };
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = langLocaleMap[language] || "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results || [])
          .map((res: any) => res?.[0]?.transcript || "")
          .join(" ")
          .trim();
        if (transcript) {
          setAbout((prev) => {
            const trimmed = prev.trim();
            const next = trimmed ? `${trimmed} ${transcript}` : transcript;
            return next.slice(0, MAX_BIO_LENGTH);
          });
        }
      };

      recognition.onerror = () => {
        setVoiceBioError(t("voiceError"));
        setIsListeningBio(false);
      };

      recognition.onend = () => {
        setIsListeningBio(false);
      };

      speechRecognitionRef.current = recognition;
      setVoiceBioError("");
      setIsListeningBio(true);
      recognition.start();
    } catch {
      setVoiceBioError(t("voiceError"));
      setIsListeningBio(false);
    }
  };

  // Select a preset city hub from All-India catalog
  const handleSelectPresetHub = (idx: number) => {
    const town = TOWN_CENTERS[idx];
    setSelectedLocationIdx(idx);
    setLocationName(town.name);
    setLatitude(town.latitude);
    setLongitude(town.longitude);
    setLocationSource("preset");
    setCustomAddressInput(town.name);
    setManualLatInput(town.latitude.toString());
    setManualLngInput(town.longitude.toString());
    setShowLocationModal(false);
    setLocationFeedback({
      type: "info",
      message: `City hub selected: ${town.name}. Coordinates updated to ${town.latitude.toFixed(4)}°N, ${town.longitude.toFixed(4)}°E.`
    });
  };

  // Search any town or district across India online
  const handleSearchOnlineTown = async (cityName: string) => {
    const query = cityName.trim();
    if (!query) return;
    setIsSearchingOnlineTown(true);
    setLocationFeedback(null);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=1&q=${encodeURIComponent(query + ", India")}`,
        {
          headers: { "Accept-Language": "en" },
          signal: controller.signal
        }
      );
      clearTimeout(timer);
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const item = results[0];
          const lat = Number(parseFloat(item.lat).toFixed(6));
          const lon = Number(parseFloat(item.lon).toFixed(6));
          const displayName = formatReverseGeocodedLocation(item.address, item.display_name);
          setLocationName(displayName);
          setLatitude(lat);
          setLongitude(lon);
          setSelectedLocationIdx(null);
          setLocationSource("custom");
          setCustomAddressInput(displayName);
          setManualLatInput(lat.toString());
          setManualLngInput(lon.toString());
          setShowLocationModal(false);
          setLocationFeedback({
            type: "success",
            message: `Town found in India: ${displayName} (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E). Set as your primary location!`
          });
          setIsSearchingOnlineTown(false);
          return;
        }
      }
      setLocationFeedback({
        type: "error",
        message: `Could not pinpoint "${query}" in India. Try refining the spelling or enter coordinates manually.`
      });
    } catch {
      setLocationFeedback({
        type: "error",
        message: "Online town lookup service is temporarily unreachable. You can manually enter latitude & longitude below."
      });
    } finally {
      setIsSearchingOnlineTown(false);
    }
  };

  // Filter Indian Major Cities based on search and region
  const filteredCities = INDIAN_MAJOR_CITIES.filter((city) => {
    const matchesRegion = selectedRegion === "All" || city.region === selectedRegion;
    const q = citySearchQuery.toLowerCase().trim();
    if (!q) return matchesRegion;
    const matchesName = city.name.toLowerCase().includes(q) || (city.state && city.state.toLowerCase().includes(q));
    return matchesRegion && matchesName;
  });

  // Browser Geolocation API for Live Device Location
  const handleUseCurrentLocation = () => {
    setLocationFeedback(null);
    if (!navigator.geolocation) {
      setLocationFeedback({
        type: "error",
        message: "Geolocation is not supported by your browser. Please enter your home/work address or coordinates manually below."
      });
      return;
    }

    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        setSelectedLocationIdx(null);
        setLocationSource("live");
        setManualLatInput(lat.toString());
        setManualLngInput(lng.toString());

        // Default title
        let resolvedTitle = `Live GPS (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;

        // Try reverse geocoding via OpenStreetMap Nominatim with strict timeout
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
            {
              headers: { "Accept-Language": "en" },
              signal: controller.signal
            }
          );
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            resolvedTitle = formatReverseGeocodedLocation(data.address, data.display_name);
          }
        } catch {
          // Keep default title if network fails
        }

        setLocationName(resolvedTitle);
        setCustomAddressInput(resolvedTitle);
        setIsLocatingGps(false);
        setShowLocationModal(false);
        setLocationFeedback({
          type: "success",
          message: `Live GPS detected: ${resolvedTitle} (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E). Updated your service area!`
        });
      },
      (error) => {
        setIsLocatingGps(false);
        let message = "Unable to retrieve your current GPS location. Please type your home or workshop address in the custom address box below.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location permission was denied. Please enter your address or coordinates manually below, or select a preset hub.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "GPS satellite or network position unavailable. Please enter your address manually below.";
        } else if (error.code === error.TIMEOUT) {
          message = "GPS location request timed out. Please try again or type your street address below.";
        }
        setLocationFeedback({ type: "error", message });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Geocode Custom Address typed by worker anywhere in India
  const handleGeocodeAddress = async () => {
    const query = customAddressInput.trim();
    if (!query) {
      setLocationFeedback({
        type: "error",
        message: "Please enter a street, area, neighborhood, or landmark to locate."
      });
      return;
    }

    setIsGeocoding(true);
    setLocationFeedback(null);

    try {
      // Prioritize India context
      const hasCountry = query.toLowerCase().includes("india");
      const targetQuery = hasCountry ? query : `${query}, India`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=1&q=${encodeURIComponent(targetQuery)}`,
        {
          headers: { "Accept-Language": "en" },
          signal: controller.signal
        }
      );
      clearTimeout(timer);

      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const lat = Number(parseFloat(results[0].lat).toFixed(6));
          const lng = Number(parseFloat(results[0].lon).toFixed(6));
          setLatitude(lat);
          setLongitude(lng);
          setLocationName(query);
          setManualLatInput(lat.toString());
          setManualLngInput(lng.toString());
          setSelectedLocationIdx(null);
          setLocationSource("custom");
          setShowLocationModal(false);
          setLocationFeedback({
            type: "success",
            message: `Address found: "${query}" (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E). Service coordinates applied!`
          });
          setIsGeocoding(false);
          return;
        }
      }

      // Secondary fallback attempt without country suffix
      const fallbackRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { "Accept-Language": "en" } }
      );
      if (fallbackRes.ok) {
        const fallbackResults = await fallbackRes.json();
        if (fallbackResults && fallbackResults.length > 0) {
          const lat = Number(parseFloat(fallbackResults[0].lat).toFixed(6));
          const lng = Number(parseFloat(fallbackResults[0].lon).toFixed(6));
          setLatitude(lat);
          setLongitude(lng);
          setLocationName(query);
          setManualLatInput(lat.toString());
          setManualLngInput(lng.toString());
          setSelectedLocationIdx(null);
          setLocationSource("custom");
          setShowLocationModal(false);
          setLocationFeedback({
            type: "success",
            message: `Address found: "${query}" (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E).`
          });
          setIsGeocoding(false);
          return;
        }
      }

      // If lookup didn't return matches, expand manual coordinates entry
      setShowManualCoords(true);
      setLocationFeedback({
        type: "error",
        message: `Could not pinpoint "${query}" on the map. You can refine the address, enter coordinates directly below, or select a city hub.`
      });
    } catch {
      setShowManualCoords(true);
      setLocationFeedback({
        type: "error",
        message: "Address lookup service is temporarily unreachable. You can manually enter latitude & longitude below or pick a city hub."
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  // Apply manual latitude/longitude coordinates
  const handleApplyManualCoords = () => {
    const lat = parseFloat(manualLatInput);
    const lng = parseFloat(manualLngInput);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setLocationFeedback({
        type: "error",
        message: "Please enter a valid latitude between -90.0 and 90.0 (e.g. 19.0760 for Mumbai, 28.6139 for Delhi, or 13.0827 for Chennai)."
      });
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setLocationFeedback({
        type: "error",
        message: "Please enter a valid longitude between -180.0 and 180.0 (e.g. 72.8777 for Mumbai, 77.2090 for Delhi, or 80.2707 for Chennai)."
      });
      return;
    }

    const title = customAddressInput.trim() || `Custom Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
    setLatitude(Number(lat.toFixed(6)));
    setLongitude(Number(lng.toFixed(6)));
    setLocationName(title);
    setSelectedLocationIdx(null);
    setLocationSource("custom");
    setShowLocationModal(false);
    setLocationFeedback({
      type: "success",
      message: `Custom coordinates applied: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (${title}).`
    });
  };

  // Full Profile Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please provide your full legal or working name.");
      return;
    }
    if (!phone.match(/^[0-9+() -]{10,15}$/)) {
      setErrorMsg("Please provide a valid contact phone number (10 digits minimum) so customers can call you.");
      return;
    }
    if (skills.length === 0) {
      setErrorMsg("Please select at least one skill option from the chip group.");
      return;
    }

    const trimmedRate = dailyRate.trim();
    const parsedRate = Number(trimmedRate);
    if (!trimmedRate || !/^\d+$/.test(trimmedRate) || parsedRate <= 0) {
      setDailyRateError(t("dailyRateRequiredError"));
      setErrorMsg(t("dailyRateRequiredError"));
      document.getElementById("editor-input-rate")?.focus();
      return;
    }

    const parsedExperience = experience.trim() === "" ? 0 : Math.floor(Number(experience.trim()));

    setDailyRateError("");
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    const finalLocationName = locationName.trim() || (selectedLocationIdx !== null ? TOWN_CENTERS[selectedLocationIdx].name : (TOWN_CENTERS[0]?.name || "Mumbai, Maharashtra"));
    const finalLat = typeof latitude === "number" && !isNaN(latitude) ? latitude : (selectedLocationIdx !== null ? TOWN_CENTERS[selectedLocationIdx].latitude : (TOWN_CENTERS[0]?.latitude ?? 19.0760));
    const finalLng = typeof longitude === "number" && !isNaN(longitude) ? longitude : (selectedLocationIdx !== null ? TOWN_CENTERS[selectedLocationIdx].longitude : (TOWN_CENTERS[0]?.longitude ?? 72.8777));
    const profilePath = `workers/${uid}`;

    const cleanImageUrls = imageUrls.map(url => url.trim()).filter(Boolean);
    const normalizedProficiencies: Record<string, number> = { ...skillProficiencies };
    skills.forEach((skill) => {
      normalizedProficiencies[skill] = mapScoreToSkillLevel(normalizedProficiencies[skill]);
    });

    const profileData: WorkerProfile = {
      uid,
      name: name.trim(),
      phone: phone.trim(),
      skills,
      dailyRate: parsedRate,
      locationName: finalLocationName,
      latitude: finalLat,
      longitude: finalLng,
      isAvailable,
      unavailableDates: Array.from(new Set<string>(unavailableDates)).sort(),
      photo,
      skillProficiencies: normalizedProficiencies,
      imageUrls: cleanImageUrls,
      gallery: cleanImageUrls, // Maintain backwards compatibility with legacy gallery readers
      experience: parsedExperience,
      about: about.trim(),
      createdAt: existingCreatedAt || serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const latestSnapshot = JSON.stringify({
      name,
      phone,
      dailyRate,
      experience,
      locationName,
      latitude,
      longitude,
      skills,
      skillProficiencies,
      about,
      photo,
      imageUrls,
      isAvailable,
      unavailableDates
    });

    // If in demo mode, persist to local storage for realistic preview testing
    if (uid.startsWith("demo-") || uid.startsWith("mock-")) {
      try {
        localStorage.setItem(`namma_kelsa_worker_profile_${uid}`, JSON.stringify(profileData));
      } catch (e) {
        // ignore
      }
      setSavedSnapshot(latestSnapshot);
      setSuccessMsg(t("yourProfileLiveToast"));
      setSaveSuccess(true);
      setShowLiveToast(true);
      onSaveSuccess();
      setSaving(false);
      setTimeout(() => setSuccessMsg(""), 3000);
      setTimeout(() => setShowLiveToast(false), 3000);
      setTimeout(() => setSaveSuccess(false), 2000);
      return;
    }

    try {
      // Security rules will validate exact keys and format
      await setDoc(doc(db, profilePath), profileData);
      setSavedSnapshot(latestSnapshot);
      setSuccessMsg(t("yourProfileLiveToast"));
      setSaveSuccess(true);
      setShowLiveToast(true);
      onSaveSuccess();
      setTimeout(() => setSuccessMsg(""), 3000);
      setTimeout(() => setShowLiveToast(false), 3000);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      console.error("Profile save error:", err);
      setErrorMsg(t("couldNotSaveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <p className="text-slate-500 text-sm mt-3 font-mono">Loading profile from database...</p>
      </div>
    );
  }

  // Live profile completion calculation (8 equal-share fields)
  const completionChecks = [
    Boolean(photo && photo.trim().length > 0),
    Boolean(name.trim().length > 0),
    phone.replace(/\D/g, "").length >= 10,
    Boolean(dailyRate.trim() && Number(dailyRate) > 0),
    Boolean(locationName.trim().length > 0),
    skills.length > 0,
    Boolean(about.trim().length > 0),
    imageUrls.length > 0
  ];
  const completedCount = completionChecks.filter(Boolean).length;
  const completionPercent = Math.round((completedCount / completionChecks.length) * 100);

  const currentSnapshot = JSON.stringify({
    name,
    phone,
    dailyRate,
    experience,
    locationName,
    latitude,
    longitude,
    skills,
    skillProficiencies,
    about,
    photo,
    imageUrls,
    isAvailable,
    unavailableDates
  });
  const hasUnsavedChanges = savedSnapshot !== "" && currentSnapshot !== savedSnapshot;

  return (
    <div id="profile-editor-container" className="w-full max-w-2xl mx-auto box-border space-y-4 pb-24 sm:pb-28 overflow-x-clip">
      {/* Live Toast Feedback ("Your profile is live") */}
      <AnimatePresence>
        {showLiveToast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            role="status"
            data-testid="profile-live-toast"
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-900 text-white px-4 py-2.5 rounded-full shadow-lg border border-emerald-500/40 text-xs font-bold whitespace-nowrap"
          >
            <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
            <span>{t("yourProfileLiveToast")}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Part 1A: Slim Live Profile Completion Progress Indicator */}
      <div
        id="profile-completion-bar"
        data-testid="profile-completion-bar"
        className="w-full max-w-full box-border bg-white rounded-2xl border border-slate-200 shadow-2xs p-3.5 sm:p-4"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs sm:text-sm font-bold text-slate-900">
            {t("profileWord")} {completionPercent}% {t("completeWord")}
          </span>
          <span className="text-[11px] font-mono font-semibold text-emerald-700">
            {completedCount}/8 {t("fieldsWord")}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {successMsg && !showLiveToast && (
        <div className="w-full max-w-full box-border p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="w-full max-w-full box-border p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile form */}
      <form onSubmit={handleSubmit} className="w-full max-w-full box-border space-y-4">
        {/* Part 1B: Always-Open Essentials Card ("Your basic details") */}
        <div className="w-full max-w-full box-border bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            {t("yourBasicDetails")}
          </h2>

          {/* 1. Big, Easy-to-Tap "I am available for work today" Toggle at Top of Card */}
          <div
            onClick={() => handleAvailabilityToggle(!isAvailable)}
            className={`w-full max-w-full box-border flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border transition-colors cursor-pointer select-none ${
              isAvailable
                ? "bg-emerald-50/90 border-emerald-200 text-emerald-950"
                : "bg-slate-50 border-slate-200 text-slate-800"
            }`}
          >
            <div className="min-w-0 flex-1">
              <span className="text-sm font-bold block leading-snug">
                {t("availabilityToggle")}
              </span>
              <span className={`text-[11px] font-medium block mt-0.5 ${isAvailable ? "text-emerald-700" : "text-slate-500"}`}>
                {isAvailable ? t("readyForHireHint") : t("unavailableTodayHint")}
              </span>
            </div>
            <button
              id="toggle-availability-main"
              type="button"
              role="switch"
              aria-checked={isAvailable}
              aria-label={t("availabilityToggle")}
              onClick={(e) => {
                e.stopPropagation();
                handleAvailabilityToggle(!isAvailable);
              }}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-hidden cursor-pointer ${
                isAvailable ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                  isAvailable ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* 2. Real Photo First + Optional Collapsed Sample Pictures */}
          <div className="w-full max-w-full box-border bg-slate-50/50 p-4 border border-slate-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="flex flex-col items-center shrink-0">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-2">
                  {t("yourPhotoLabel")}
                </span>
                <label className="relative group w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border-2 border-emerald-200 flex items-center justify-center cursor-pointer">
                  {photo && !avatarBroken ? (
                    <img
                      src={photo}
                      alt=""
                      onError={() => setAvatarBroken(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-9 h-9 text-slate-400" />
                  )}
                  <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition">
                    <Camera className="w-5 h-5 mb-1" />
                    <span>{t("addYourPhoto")}</span>
                  </span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2 pt-1 min-w-0">
                <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer">
                  <Camera className="w-4 h-4 shrink-0" />
                  <span>{t("addYourPhoto")}</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                <p className="text-xs text-slate-600 font-medium">
                  {t("realPhotoHint")}
                </p>
                <button
                  type="button"
                  id="btn-toggle-sample-pictures"
                  aria-expanded={showSampleAvatars}
                  onClick={() => setShowSampleAvatars((prev) => !prev)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 cursor-pointer"
                >
                  {showSampleAvatars ? t("hideSamplePictures") : t("useSamplePictureInstead")}
                </button>
              </div>
            </div>

            {showSampleAvatars && (
              <div className="pt-3 border-t border-slate-200/80">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-2">
                  {t("samplePicturesTitle")}
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 sm:gap-2">
                  {PRESET_AVATARS.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setPhoto(preset.url);
                        setAvatarBroken(false);
                        const galMatch = PRESET_GALLERIES.find(g => g.category === preset.category);
                        if (galMatch && imageUrls.length === 0) setImageUrls(galMatch.urls);
                      }}
                      title={preset.label}
                      aria-label={preset.label}
                      className={`relative rounded-lg overflow-hidden border-2 aspect-square bg-slate-100 flex items-center justify-center transition duration-200 cursor-pointer ${
                        photo === preset.url ? "border-emerald-500 scale-[1.05] shadow-sm" : "border-slate-200 hover:border-slate-350"
                      }`}
                    >
                      {!brokenPresets[preset.url] ? (
                        <img
                          src={preset.url}
                          alt=""
                          onError={() =>
                            setBrokenPresets((prev) => ({ ...prev, [preset.url]: true }))
                          }
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-slate-400" />
                      )}
                      {photo === preset.url && (
                        <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input Text Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase font-mono tracking-wider">
                <User className="w-3.5 h-3.5 text-slate-400" /> {t("yourFullName")}
              </label>
              <input
                type="text"
                id="editor-input-name"
                placeholder={t("namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1.5 w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase font-mono tracking-wider">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {t("phoneNumber")}
              </label>
              <input
                type="tel"
                id="editor-input-phone"
                placeholder={t("phonePlaceholder")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="mt-1.5 w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
              />
            </div>

            {/* Daily rate */}
            <div>
              <label htmlFor="editor-input-rate" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase font-mono tracking-wider">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> {t("dailyWageRate")}
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 select-none">
                  ₹
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="editor-input-rate"
                  placeholder="e.g. 800"
                  value={dailyRate}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, "");
                    const sanitized = digitsOnly.replace(/^0+/, "");
                    setDailyRate(sanitized);
                    if (dailyRateError) setDailyRateError("");
                  }}
                  aria-invalid={Boolean(dailyRateError)}
                  aria-describedby={dailyRateError ? "editor-input-rate-error" : undefined}
                  className={`w-full bg-white border rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-2 focus:outline-hidden text-slate-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    dailyRateError
                      ? "border-rose-400 focus:ring-rose-500"
                      : "border-slate-200 focus:ring-emerald-500"
                  }`}
                />
              </div>
              {dailyRateError && (
                <p
                  id="editor-input-rate-error"
                  data-testid="daily-rate-error"
                  className="mt-1.5 text-xs font-medium text-rose-600 flex items-center gap-1"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{dailyRateError}</span>
                </p>
              )}
            </div>

            {/* Experience */}
            <div>
              <label htmlFor="editor-input-experience" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase font-mono tracking-wider">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" /> {t("workExperience")}
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                id="editor-input-experience"
                placeholder="e.g. 3"
                value={experience}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, "");
                  if (digitsOnly === "") {
                    setExperience("");
                    return;
                  }
                  const sanitized = digitsOnly.replace(/^0+(?=\d)/, "");
                  setExperience(sanitized);
                }}
                className="mt-1.5 w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* Interactive Location Section */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider block">
                  {t("locationHubSelect")}
                </label>
                <span className="text-[11px] text-slate-500">
                  {t("serviceAreaHint")}
                </span>
              </div>

              {/* 1. Compact Location Bar */}
              <div 
                id="editor-compact-location-bar"
                data-testid="compact-location-bar"
                onClick={() => setShowLocationModal(true)}
                className="w-full max-w-full box-border bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-200/90 hover:border-emerald-300 rounded-xl p-3 flex items-center justify-between gap-2.5 sm:gap-3 transition cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <MapPin className="w-4 h-4 fill-white text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] font-mono uppercase font-bold text-emerald-800 tracking-wider">
                      {t("locationHubLabel")}
                    </span>
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-sm font-extrabold text-slate-900 truncate">
                        {locationName}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider shrink-0 ${
                        locationSource === "live"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : locationSource === "custom"
                          ? "bg-purple-100 text-purple-800 border border-purple-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}>
                        {locationSource === "live" ? "Live GPS" : locationSource === "custom" ? "Custom" : "City"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-editor-open-location-picker"
                  data-testid="change-location-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLocationModal(true);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-white group-hover:bg-emerald-700 group-hover:text-white border border-emerald-300 group-hover:border-emerald-700 px-3 py-1.5 rounded-lg shadow-2xs transition-all shrink-0 cursor-pointer"
                >
                  <span>{t("changeButton")}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

              {/* Hidden select to preserve data-testid for automated test suites */}
              <select
                id="editor-input-location"
                data-testid="profile-editor-location-select"
                aria-hidden="true"
                tabIndex={-1}
                value={selectedLocationIdx !== null ? selectedLocationIdx : "custom"}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val !== "custom") handleSelectPresetHub(Number(val));
                }}
                className="sr-only"
              >
                {selectedLocationIdx === null && (
                  <option value="custom">
                    {locationName}
                  </option>
                )}
                {INDIAN_MAJOR_CITIES.map((town, idx) => (
                  <option key={idx} value={idx}>
                    {town.state ? `${town.state} — ${town.name.split(',')[0]}` : town.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Full Location Picker Modal / Mobile Sheet */}
            {showLocationModal && (
              <div 
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs transition-opacity"
                onClick={() => setShowLocationModal(false)}
              >
                <div 
                  className="relative w-full max-w-xl max-h-[90vh] sm:max-h-[85vh] bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200"
                  onClick={(e) => e.stopPropagation()}
                  data-testid="location-picker-modal"
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-tight">
                          {language === "kn" ? "ನಿಮ್ಮ ಸೇವಾ ಸ್ಥಳವನ್ನು ಆಯ್ಕೆಮಾಡಿ" : "Select Base Location"}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          {language === "kn" ? "ಹತ್ತಿರದ ಗ್ರಾಹಕರಿಗೆ ಕಾಣಿಸಲು ನಿಮ್ಮ ಪ್ರದೇಶವನ್ನು ಹೊಂದಿಸಿ" : "Set your service area for nearby customer searches & radius discovery"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Debug coordinates in small text inside modal only */}
                      <span 
                        id="profile-editor-coordinates-box"
                        data-testid="profile-editor-coordinates-box"
                        className="hidden sm:inline-block text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded"
                        title="Current Coordinates"
                      >
                        {latitude.toFixed(3)}°N, {longitude.toFixed(3)}°E
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowLocationModal(false)}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
                        title="Close"
                        aria-label="Close"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Scrollable Body */}
                  <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
                    
                    {/* Order Item 1: Auto-focused Search Bar to search any city/town */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                        Search City or Town across India
                      </label>
                      <div className="relative">
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          ref={citySearchInputRef}
                          type="text"
                          id="profile-city-search-filter"
                          data-testid="profile-city-search-filter"
                          placeholder="Search city (e.g. Mumbai, Bengaluru, Vijayawada, Delhi, Jaipur...)"
                          value={citySearchQuery}
                          onChange={(e) => setCitySearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && citySearchQuery.trim()) {
                              e.preventDefault();
                              if (filteredCities.length === 0) {
                                handleSearchOnlineTown(citySearchQuery);
                              } else {
                                const origIdx = INDIAN_MAJOR_CITIES.findIndex(c => c.name === filteredCities[0].name);
                                if (origIdx !== -1) handleSelectPresetHub(origIdx);
                              }
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
                        />
                        {citySearchQuery && (
                          <button
                            type="button"
                            onClick={() => setCitySearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="Clear city search"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order Item 2: Use My Current Location button (directly below search bar) */}
                    <button
                      type="button"
                      id="btn-use-current-location"
                      data-testid="use-current-location-button"
                      onClick={handleUseCurrentLocation}
                      disabled={isLocatingGps}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 active:scale-[0.99] transition cursor-pointer text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                          {isLocatingGps ? (
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                          ) : (
                            <Crosshair className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-emerald-950 block">
                            {isLocatingGps ? "Detecting GPS Position..." : "Use My Current Location"}
                          </span>
                          <span className="text-[11px] text-emerald-800">
                            Auto-detect using device GPS & reverse geocode
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-emerald-700 font-mono flex items-center gap-1">
                        GPS
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </button>

                    {/* Feedback Alert if any */}
                    {locationFeedback && (
                      <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                        locationFeedback.type === "error"
                          ? "bg-rose-50 border-rose-200 text-rose-800"
                          : locationFeedback.type === "success"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-blue-50 border-blue-200 text-blue-800"
                      }`}>
                        {locationFeedback.type === "error" ? (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        ) : locationFeedback.type === "success" ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        )}
                        <p className="flex-1 font-medium leading-relaxed">{locationFeedback.message}</p>
                        <button
                          type="button"
                          onClick={() => setLocationFeedback(null)}
                          className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Order Item 3: Scrollable all-India city grid with region tabs */}
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Navigation className="w-3 h-3 text-emerald-600" />
                          <span>Popular Hubs across States & UTs</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">All 28 States & 8 UTs</span>
                      </div>

                      {/* Regional filter tabs */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                        {["All", "South", "North", "West", "East", "Central"].map((region) => (
                          <button
                            key={region}
                            type="button"
                            onClick={() => setSelectedRegion(region)}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer shrink-0 ${
                              selectedRegion === region
                                ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {region}
                          </button>
                        ))}
                      </div>

                      {/* Cities Grid */}
                      <div className="max-h-52 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                        {filteredCities.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {filteredCities.map((town) => {
                              const origIdx = INDIAN_MAJOR_CITIES.findIndex(c => c.name === town.name);
                              const isSelected = selectedLocationIdx === origIdx && locationSource === "preset";
                              return (
                                <button
                                  key={town.name}
                                  type="button"
                                  id={`editor-city-pill-${origIdx}`}
                                  onClick={() => handleSelectPresetHub(origIdx)}
                                  className={`relative flex flex-col p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-emerald-600 border-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30"
                                      : "bg-slate-50 hover:bg-emerald-50/70 border-slate-200 text-slate-700 hover:border-emerald-300"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className={`text-[9px] font-mono uppercase tracking-wider font-bold ${isSelected ? "text-emerald-100" : "text-slate-400"}`}>
                                      {town.region || "India"}
                                    </span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                  </div>
                                  <span className={`text-xs font-bold leading-tight truncate ${isSelected ? "text-white" : "text-slate-900"}`}>
                                    {town.name.split(",")[0]}
                                  </span>
                                  <span className={`text-[10px] truncate ${isSelected ? "text-emerald-100" : "text-slate-400"}`}>
                                    {town.state || town.name.split(",")[1]?.trim() || "India"}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3 text-center space-y-2">
                            <p className="text-xs text-slate-600">
                              No preset city found matching <strong>"{citySearchQuery}"</strong>.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleSearchOnlineTown(citySearchQuery)}
                              disabled={isSearchingOnlineTown}
                              className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-60"
                            >
                              {isSearchingOnlineTown ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Globe className="w-3.5 h-3.5" />
                              )}
                              <span>{isSearchingOnlineTown ? "Searching across India..." : `Find "${citySearchQuery}" anywhere in India`}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Item 4: Custom address input at the bottom */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Home className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
                            Search Near Custom Address / Landmark
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowManualCoords(!showManualCoords)}
                          className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          {showManualCoords ? "Hide Coordinates" : "Advanced Lat/Lng"}
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            id="editor-custom-address-input"
                            data-testid="custom-address-input"
                            placeholder="e.g. Bandra West, Mumbai or Kanuru, Vijayawada..."
                            value={customAddressInput}
                            onChange={(e) => setCustomAddressInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleGeocodeAddress();
                              }
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          />
                          {customAddressInput && (
                            <button
                              type="button"
                              onClick={() => setCustomAddressInput("")}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                              title="Clear address text"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          id="btn-geocode-address"
                          data-testid="geocode-address-button"
                          onClick={handleGeocodeAddress}
                          disabled={isGeocoding}
                          className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-60 shrink-0"
                        >
                          {isGeocoding ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <SearchIcon className="w-3.5 h-3.5" />
                          )}
                          <span>{isGeocoding ? "Locating..." : "Locate"}</span>
                        </button>
                      </div>

                      {/* Collapsible Coordinates for technical/debugging use inside modal only */}
                      {showManualCoords && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 mt-2">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                                Latitude
                              </label>
                              <input
                                type="number"
                                step="any"
                                id="editor-manual-latitude"
                                data-testid="manual-latitude-input"
                                value={manualLatInput}
                                onChange={(e) => setManualLatInput(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                                Longitude
                              </label>
                              <input
                                type="number"
                                step="any"
                                id="editor-manual-longitude"
                                data-testid="manual-longitude-input"
                                value={manualLngInput}
                                onChange={(e) => setManualLngInput(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              id="btn-apply-manual-coords"
                              data-testid="apply-manual-coords-button"
                              onClick={handleApplyManualCoords}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Apply Coordinates
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 8. Select Skills (inside Your basic details card) */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase font-mono tracking-wider">
              <Zap className="w-3.5 h-3.5 text-slate-400" /> {t("selectSkillsLabel")}
            </label>
            <ChipGroup
              selectedSkills={skills}
              onChange={(nextSkills) => {
                setSkills(nextSkills);
                setSkillProficiencies((prev) => {
                  const next = { ...prev };
                  nextSkills.forEach((skill) => {
                    if (typeof next[skill] !== "number") {
                      next[skill] = 80; // Default newly selected skill to Experienced
                    }
                  });
                  return next;
                });
              }}
            />
          </div>
        </div>

        {/* Part 1C: Optional Sections Under "Add more to get more calls" */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">
              {t("addMoreToGetCalls")}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">{t("optionalTag")}</span>
          </div>

          {/* Accordion 1: About your work (Bio) */}
          <div className="w-full max-w-full box-border bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <button
              type="button"
              id="accordion-toggle-about"
              aria-expanded={expandedSections.about}
              aria-controls="accordion-panel-about"
              onClick={() => toggleAccordionSection("about")}
              className="w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 text-left hover:bg-slate-50/80 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">{t("aboutYourWorkTitle")}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      about.trim().length > 0
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                      {about.trim().length > 0 ? t("doneTag") : t("optionalTag")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {t("aboutYourWorkHint")}
                  </p>
                </div>
              </div>
              {expandedSections.about ? (
                <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {expandedSections.about && (
                <motion.div
                  id="accordion-panel-about"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-slate-100"
                >
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="editor-input-about" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase font-mono tracking-wider">
                        <FileText className="w-3.5 h-3.5 text-slate-400" /> {t("aboutBio")}
                      </label>
                      <span
                        data-testid="bio-char-counter"
                        className={`text-[11px] font-mono font-semibold ${
                          about.length >= MAX_BIO_LENGTH
                            ? "text-amber-600"
                            : "text-slate-400"
                        }`}
                      >
                        {about.length}/{MAX_BIO_LENGTH}
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <textarea
                        id="editor-input-about"
                        rows={3}
                        maxLength={MAX_BIO_LENGTH}
                        value={about}
                        onChange={(e) => setAbout(e.target.value.slice(0, MAX_BIO_LENGTH))}
                        placeholder={t("aboutPlaceholder")}
                        className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
                      />
                      {isSpeechSupported && (
                        <button
                          type="button"
                          id="btn-voice-bio"
                          data-testid="voice-bio-button"
                          onClick={handleToggleVoiceBio}
                          aria-pressed={isListeningBio}
                          aria-label={isListeningBio ? t("voiceTypeStop") : t("voiceTypeStart")}
                          title={isListeningBio ? t("voiceTypeStop") : t("voiceTypeStart")}
                          className={`shrink-0 w-11 h-11 rounded-xl border flex items-center justify-center transition cursor-pointer active:scale-95 ${
                            isListeningBio
                              ? "bg-rose-600 border-rose-600 text-white animate-pulse shadow-sm"
                              : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
                          }`}
                        >
                          {isListeningBio ? (
                            <MicOff className="w-5 h-5" />
                          ) : (
                            <Mic className="w-5 h-5" />
                          )}
                        </button>
                      )}
                    </div>

                    {isListeningBio && (
                      <p className="text-xs font-semibold text-rose-600 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        <span>{t("voiceListening")}</span>
                      </p>
                    )}

                    {voiceBioError && (
                      <p className="text-xs text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{voiceBioError}</span>
                      </p>
                    )}

                    {/* 3 tappable suggestion chips based on selected main skill */}
                    <div className="space-y-1.5 pt-0.5">
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        {t("bioSuggestionsLabel")}
                      </span>
                      <div className="flex flex-wrap gap-1.5" data-testid="bio-suggestion-chips">
                        {getBioSuggestions(skills[0], language).map((suggestion, idx) => {
                          const isAdded = about.includes(suggestion);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleTapBioSuggestion(suggestion)}
                              className={`max-w-full text-left text-xs px-3 py-1.5 rounded-lg border transition cursor-pointer active:scale-95 break-words ${
                                isAdded
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold"
                                  : "bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-emerald-300 text-slate-700"
                              }`}
                            >
                              + {suggestion}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Accordion 2: Photos of your past work */}
          <div className="w-full max-w-full box-border bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <button
              type="button"
              id="accordion-toggle-portfolio"
              aria-expanded={expandedSections.portfolio}
              aria-controls="accordion-panel-portfolio"
              onClick={() => toggleAccordionSection("portfolio")}
              className="w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 text-left hover:bg-slate-50/80 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">{t("pastWorkPhotosTitle")}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      imageUrls.length > 0
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                      {imageUrls.length > 0 ? t("doneTag") : t("optionalTag")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {t("pastWorkPhotosHint")} ({imageUrls.length} {t("ofWord")} {MAX_WORK_PHOTOS})
                  </p>
                </div>
              </div>
              {expandedSections.portfolio ? (
                <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {expandedSections.portfolio && (
                <motion.div
                  id="accordion-panel-portfolio"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-slate-100"
                >
                  <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs text-slate-500">
                        {t("pastWorkCustomersSee")}
                      </span>
                      <span
                        data-testid="work-photos-count"
                        className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full"
                      >
                        {imageUrls.length} {t("ofWord")} {MAX_WORK_PHOTOS} {t("photosLowerWord")}
                      </span>
                    </div>

                    {/* Part A1: Primary Upload-First Large Button */}
                    <div className="space-y-2">
                      <label
                        htmlFor="input-work-photos-upload"
                        className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold shadow-xs transition ${
                          imageUrls.length >= MAX_WORK_PHOTOS || isUploadingWorkPhotos
                            ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white cursor-pointer"
                        }`}
                      >
                        {isUploadingWorkPhotos ? (
                          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                        ) : (
                          <Camera className="w-5 h-5 shrink-0" />
                        )}
                        <span>
                          {isUploadingWorkPhotos
                            ? uploadProgressText || t("addingPhotosBtn")
                            : t("addPhotosBtn")}
                        </span>
                        <input
                          id="input-work-photos-upload"
                          data-testid="work-photos-file-input"
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={imageUrls.length >= MAX_WORK_PHOTOS || isUploadingWorkPhotos}
                          onChange={handlePhotoFileUpload}
                          className="hidden"
                        />
                      </label>

                      {imageUrls.length >= MAX_WORK_PHOTOS && (
                        <p className="text-xs font-medium text-slate-500 text-center">
                          {t("maxPhotosReachedHint")}
                        </p>
                      )}

                      {workPhotoError && (
                        <div
                          role="alert"
                          data-testid="work-photo-error"
                          className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{workPhotoError}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setWorkPhotoError("")}
                            aria-label="Dismiss"
                            className="text-rose-500 hover:text-rose-800 shrink-0 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Part A4: Clean 3-column Thumbnail Grid with always-visible ✕ button */}
                    {imageUrls.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-white p-4">
                        <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-600">{t("noPastWorkPhotos")}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {t("noPastWorkPhotosHint")}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2.5 sm:gap-3" data-testid="work-photos-grid">
                        {imageUrls.map((url, idx) => {
                          const isBroken = Boolean(brokenPortfolioUrls[url]);
                          return (
                            <div
                              key={idx}
                              className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs aspect-square flex items-center justify-center"
                            >
                              {!isBroken ? (
                                <img
                                  src={url}
                                  alt=""
                                  referrerPolicy="no-referrer"
                                  onError={() =>
                                    setBrokenPortfolioUrls((prev) => ({ ...prev, [url]: true }))
                                  }
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-slate-400">
                                  <ImageIcon className="w-6 h-6" />
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => handleRemoveImageUrl(idx)}
                                title={t("removePhotoLabel")}
                                aria-label={t("removePhotoLabel")}
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 hover:bg-rose-600 text-white flex items-center justify-center shadow-sm transition active:scale-95 cursor-pointer z-10"
                              >
                                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Part A5: Collapsed "Advanced: add using a link" section */}
                    <div className="pt-1 border-t border-slate-200/70">
                      <button
                        type="button"
                        id="btn-toggle-advanced-photo-link"
                        aria-expanded={showAdvancedPhotoLink}
                        onClick={() => setShowAdvancedPhotoLink((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 py-1 cursor-pointer"
                      >
                        <Link className="w-3.5 h-3.5 shrink-0" />
                        <span>{t("advancedAddLinkToggle")}</span>
                        {showAdvancedPhotoLink ? (
                          <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                        )}
                      </button>

                      {showAdvancedPhotoLink && (
                        <div className="mt-2.5 bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                          <div className="space-y-2">
                            <label
                              htmlFor="input-past-work-image-url"
                              className="text-xs font-semibold text-slate-600 flex items-center gap-1"
                            >
                              <Link className="w-3.5 h-3.5 text-slate-400" />
                              <span>{t("addPhotoLinkLabel")}</span>
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="url"
                                id="input-past-work-image-url"
                                placeholder={t("addPhotoLinkPlaceholder")}
                                value={inputUrl}
                                disabled={imageUrls.length >= MAX_WORK_PHOTOS}
                                onChange={(e) => {
                                  setInputUrl(e.target.value);
                                  if (urlError) setUrlError("");
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddImageUrl();
                                  }
                                }}
                                className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden disabled:opacity-60"
                              />
                              <button
                                type="button"
                                id="btn-add-image-url"
                                disabled={imageUrls.length >= MAX_WORK_PHOTOS}
                                onClick={() => handleAddImageUrl()}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0 disabled:bg-slate-300 disabled:cursor-not-allowed"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>{t("addPhotoBtn")}</span>
                              </button>
                            </div>

                            {urlError && (
                              <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{urlError}</span>
                              </p>
                            )}
                          </div>

                          <div className="pt-2.5 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                              {t("quickSamplePhotosLabel")}:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {SAMPLE_WORK_URLS.map((sample, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  disabled={imageUrls.length >= MAX_WORK_PHOTOS}
                                  onClick={() => handleAddImageUrl(sample.url)}
                                  className="text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-650 px-2.5 py-1 rounded-lg transition cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  + {sample.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Accordion 3: Skill level */}
          <div className="w-full max-w-full box-border bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <button
              type="button"
              id="accordion-toggle-skillLevel"
              aria-expanded={expandedSections.skillLevel}
              aria-controls="accordion-panel-skillLevel"
              onClick={() => toggleAccordionSection("skillLevel")}
              className="w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 text-left hover:bg-slate-50/80 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">{t("skillLevelTitle")}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      skills.length > 0 && skills.some((s) => typeof skillProficiencies[s] === "number")
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                      {skills.length > 0 && skills.some((s) => typeof skillProficiencies[s] === "number") ? t("doneTag") : t("optionalTag")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {t("skillLevelHint")}
                  </p>
                </div>
              </div>
              {expandedSections.skillLevel ? (
                <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {expandedSections.skillLevel && (
                <motion.div
                  id="accordion-panel-skillLevel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-slate-100"
                >
                  <div className="p-4 sm:p-5 bg-slate-50/50 space-y-3" data-testid="simple-skill-level-section">
                    {skills.length === 0 ? (
                      <div className="py-7 px-4 text-center bg-white rounded-xl border border-dashed border-slate-200">
                        <p className="text-xs font-bold text-slate-700">
                          {t("selectSkillsFirstForRadar")}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                          {t("pickSkillHintForLevel")}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {skills.map((skill) => {
                          const selectedLevel = mapScoreToSkillLevel(skillProficiencies[skill]);
                          const skillSlug = skill.toLowerCase().replace(/[^a-z0-9]/g, "-");

                          return (
                            <div
                              key={skill}
                              id={`skill-level-row-${skillSlug}`}
                              className="w-full max-w-full box-border bg-white rounded-xl border border-slate-200 p-3 sm:p-3.5 shadow-2xs space-y-2.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-bold text-slate-900 break-words">{skill}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full max-w-full box-border">
                                {SKILL_LEVEL_OPTIONS.map((opt) => {
                                  const isSelected = selectedLevel === opt.score;
                                  return (
                                    <button
                                      key={opt.score}
                                      type="button"
                                      id={`btn-skill-${skillSlug}-${opt.score}`}
                                      data-testid={`skill-level-${skillSlug}-${opt.score}`}
                                      aria-pressed={isSelected}
                                      onClick={() =>
                                        setSkillProficiencies((prev) => ({
                                          ...prev,
                                          [skill]: opt.score
                                        }))
                                      }
                                      className={`min-w-0 w-full py-2.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-sm font-bold leading-tight break-words border transition active:scale-[0.98] cursor-pointer text-center ${
                                        isSelected
                                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                          : "bg-slate-50 hover:bg-emerald-50/70 text-slate-700 border-slate-200 hover:border-emerald-300"
                                      }`}
                                    >
                                      {t(opt.key)}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Accordion 4: Busy days / availability calendar */}
          <div className="w-full max-w-full box-border bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <button
              type="button"
              id="accordion-toggle-calendar"
              aria-expanded={expandedSections.calendar}
              aria-controls="accordion-panel-calendar"
              onClick={() => toggleAccordionSection("calendar")}
              className="w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 text-left hover:bg-slate-50/80 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">{t("busyDaysTitle")}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      unavailableDates.length > 0
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                      {unavailableDates.length > 0 ? t("doneTag") : t("optionalTag")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {unavailableDates.length === 0
                      ? t("youAreFreeAllDays")
                      : `${t("busyPrefixLabel")} ${unavailableDates.slice(0, 3).map(formatShortBusyDate).join(", ")}${unavailableDates.length > 3 ? ` +${unavailableDates.length - 3}` : ""}`}
                  </p>
                </div>
              </div>
              {expandedSections.calendar ? (
                <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {expandedSections.calendar && (
                <motion.div
                  id="accordion-panel-calendar"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-slate-100"
                >
                  {(() => {
                    const tomorrowDate = new Date();
                    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                    const tomorrowIso = formatDateToISO(tomorrowDate);
                    const isTomorrowBusy = unavailableDates.includes(tomorrowIso);
                    const weekendIsos = getUpcomingDays(7).filter((d) => d.isWeekend).map((d) => d.iso);
                    const isWeekendBusy =
                      weekendIsos.length > 0 && weekendIsos.every((iso) => unavailableDates.includes(iso));

                    return (
                      <div
                        id="date-picker-availability-section"
                        data-testid="date-picker-availability-section"
                        className="space-y-4 bg-slate-50 p-4 sm:p-5"
                      >
                        <p className="text-xs font-medium text-slate-600">
                          {t("customersWontCallBusyHint")}
                        </p>

                        {/* Part B1: Only 3 large buttons on top with clear ON/OFF states */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <button
                            type="button"
                            id="btn-mark-tomorrow-busy"
                            aria-pressed={isTomorrowBusy}
                            onClick={handleMarkTomorrow}
                            className={`w-full py-3 px-3.5 rounded-xl border text-xs sm:text-sm font-bold transition cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 shadow-2xs ${
                              isTomorrowBusy
                                ? "bg-rose-600 border-rose-600 text-white shadow-xs"
                                : "bg-white hover:bg-rose-50/60 border-slate-200 hover:border-rose-300 text-slate-800"
                            }`}
                          >
                            {isTomorrowBusy ? (
                              <Ban className="w-4 h-4 shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                            )}
                            <span>{t("markTomorrowBusyBtn")}</span>
                          </button>

                          <button
                            type="button"
                            id="btn-mark-weekend-busy"
                            aria-pressed={isWeekendBusy}
                            onClick={handleMarkWeekend}
                            className={`w-full py-3 px-3.5 rounded-xl border text-xs sm:text-sm font-bold transition cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 shadow-2xs ${
                              isWeekendBusy
                                ? "bg-rose-600 border-rose-600 text-white shadow-xs"
                                : "bg-white hover:bg-rose-50/60 border-slate-200 hover:border-rose-300 text-slate-800"
                            }`}
                          >
                            {isWeekendBusy ? (
                              <Ban className="w-4 h-4 shrink-0" />
                            ) : (
                              <Calendar className="w-4 h-4 text-sky-500 shrink-0" />
                            )}
                            <span>{t("markWeekendBusyBtn")}</span>
                          </button>

                          <button
                            type="button"
                            id="btn-clear-all-dates"
                            disabled={unavailableDates.length === 0}
                            onClick={handleClearAllDates}
                            className={`w-full py-3 px-3.5 rounded-xl border text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-2xs ${
                              unavailableDates.length > 0
                                ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800 cursor-pointer active:scale-[0.98]"
                                : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            <Trash2 className="w-4 h-4 shrink-0" />
                            <span>{t("clearAllBusyDaysBtn")}</span>
                          </button>
                        </div>

                        {/* Part B5: Summary line directly under buttons */}
                        <div
                          data-testid="busy-days-summary"
                          className={`rounded-xl px-3.5 py-2.5 border text-xs font-semibold flex items-center gap-2 ${
                            unavailableDates.length === 0
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-rose-50 border-rose-200 text-rose-800"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              unavailableDates.length === 0 ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          <span className="leading-snug">
                            {unavailableDates.length === 0
                              ? t("youAreFreeAllDays")
                              : `${t("busyPrefixLabel")} ${unavailableDates.map(formatShortBusyDate).join(", ")}`}
                          </span>
                        </div>

                        {/* Part B3: Collapsed "Choose days manually" link */}
                        <div className="pt-1 border-t border-slate-200/70">
                          <button
                            type="button"
                            id="btn-toggle-manual-days"
                            aria-expanded={showManualDaysCalendar}
                            onClick={() => setShowManualDaysCalendar((prev) => !prev)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 py-1 cursor-pointer"
                          >
                            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                            <span>{t("chooseDaysManually")}</span>
                            {showManualDaysCalendar ? (
                              <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                            )}
                          </button>

                          {showManualDaysCalendar && (
                            <div className="mt-3 space-y-4">
                              {/* 14-Day Interactive Toggle Grid */}
                              <div>
                                <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                    <CalendarCheck className="w-3 h-3 text-emerald-600" />
                                    <span>{t("upcoming14DaysTitle")}</span>
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-500">
                                    {t("freeGreenBusyRedLegend")}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                                  {getUpcomingDays(14).map((day) => {
                                    const isMarkedUnavailable = unavailableDates.includes(day.iso);
                                    return (
                                      <button
                                        key={day.iso}
                                        type="button"
                                        id={`toggle-date-${day.iso}`}
                                        data-testid={`toggle-date-${day.iso}`}
                                        onClick={() => handleToggleUnavailableDate(day.iso)}
                                        className={`relative flex flex-col items-center justify-between p-2.5 rounded-xl border text-center transition-all cursor-pointer select-none active:scale-95 shadow-2xs ${
                                          isMarkedUnavailable
                                            ? "bg-rose-50 border-rose-300 text-rose-950 shadow-xs"
                                            : "bg-emerald-50/60 border-emerald-300 hover:bg-emerald-50 text-emerald-950"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between w-full mb-1">
                                          <span className={`text-[9px] font-bold font-mono uppercase px-1 rounded ${
                                            day.isToday
                                              ? "bg-emerald-700 text-white"
                                              : day.isTomorrow
                                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                                : day.isWeekend
                                                  ? "bg-slate-200/70 text-slate-600"
                                                  : "text-slate-500"
                                          }`}>
                                            {day.isToday ? t("today") : day.isTomorrow ? t("tomorrow") : day.dayName}
                                          </span>

                                          {isMarkedUnavailable ? (
                                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                                          ) : (
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                          )}
                                        </div>

                                        <div className="my-0.5">
                                          <span className={`text-base font-extrabold block leading-none ${
                                            isMarkedUnavailable ? "text-rose-700 line-through decoration-rose-500/70" : "text-slate-900"
                                          }`}>
                                            {day.dayNumber}
                                          </span>
                                          <span className="text-[10px] font-semibold text-slate-500 uppercase font-mono">
                                            {day.monthName}
                                          </span>
                                        </div>

                                        <div className={`mt-1.5 w-full py-0.5 px-1 rounded-md text-[10px] font-bold flex items-center justify-center gap-1 ${
                                          isMarkedUnavailable
                                            ? "bg-rose-600 text-white"
                                            : "bg-emerald-600 text-white"
                                        }`}>
                                          {isMarkedUnavailable ? (
                                            <>
                                              <Ban className="w-2.5 h-2.5 shrink-0" />
                                              <span>{t("busyWord")}</span>
                                            </>
                                          ) : (
                                            <>
                                              <Check className="w-2.5 h-2.5 shrink-0" />
                                              <span>{t("freeWord")}</span>
                                            </>
                                          )}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Custom Date Input for Any Future Date */}
                              <div className="w-full max-w-full box-border pt-2 border-t border-slate-200/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                                <div className="w-full max-w-full box-border flex items-center gap-2 flex-wrap">
                                  <label htmlFor="custom-date-picker" className="text-[11px] font-bold text-slate-600 flex items-center gap-1 font-mono">
                                    <CalendarX className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                    <span>{t("addSpecificDate")}:</span>
                                  </label>
                                  <input
                                    type="date"
                                    id="custom-date-picker"
                                    min={formatDateToISO(new Date())}
                                    value={customDateInput}
                                    onChange={(e) => setCustomDateInput(e.target.value)}
                                    className="min-w-0 max-w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                                  />
                                  <button
                                    type="button"
                                    id="btn-add-custom-date"
                                    disabled={!customDateInput}
                                    onClick={handleAddCustomDate}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:cursor-not-allowed shadow-2xs shrink-0"
                                  >
                                    {t("addDateButton")}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Accordion 5: Printable QR code */}
          <div className="w-full max-w-full box-border bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <button
              type="button"
              id="accordion-toggle-qr"
              aria-expanded={expandedSections.qr}
              aria-controls="accordion-panel-qr"
              onClick={() => toggleAccordionSection("qr")}
              className="w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 text-left hover:bg-slate-50/80 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">{t("printableQrTitle")}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      qrDataUrl
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                      {qrDataUrl ? t("doneTag") : t("optionalTag")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {t("printableQrHint")}
                  </p>
                </div>
              </div>
              {expandedSections.qr ? (
                <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {expandedSections.qr && (
                <motion.div
                  id="accordion-panel-qr"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-slate-100"
                >
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/50 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-emerald-950">{t("offlineMarketing")}</h4>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 max-w-lg leading-relaxed">
                          {t("offlineMarketingDesc")}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn-open-marketing-qr"
                      data-testid="open-marketing-qr-button"
                      onClick={handleOpenQrModal}
                      className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer shrink-0 w-full sm:w-auto"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>{t("printableQrCode")}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Part 3: Single Sticky Bottom Save Bar (Always visible while scrolling) */}
        <div className="sticky bottom-2 sm:bottom-3 z-30 w-full max-w-full box-border space-y-2">
          {errorMsg && (
            <div
              role="alert"
              className="w-full max-w-full box-border flex items-center justify-between gap-2 bg-rose-950/95 text-rose-100 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-rose-700/70 shadow-lg backdrop-blur-md"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="truncate sm:whitespace-normal">{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg("")}
                aria-label="Dismiss error"
                className="text-rose-300 hover:text-white shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="w-full max-w-full box-border overflow-hidden bg-emerald-950/95 backdrop-blur-md text-white rounded-2xl p-2.5 sm:p-3 px-3 sm:px-4 shadow-xl border border-emerald-800 flex items-center justify-between gap-2 sm:gap-3 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isAvailable ? "bg-emerald-400" : "bg-slate-400"}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-bold text-white truncate">{name || t("workerProfile")}</span>
                  {hasUnsavedChanges && !saving && !saveSuccess && (
                    <span
                      data-testid="unsaved-changes-label"
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200 border border-amber-400/30 shrink-0 whitespace-nowrap"
                    >
                      {t("unsavedChangesLabel")}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-emerald-300 font-mono block truncate">
                  ₹{dailyRate || "—"}/{t("dayShortWord")} • {skills.length} {t("skillsWord")}
                </span>
              </div>
            </div>
            <button
              type="submit"
              id="btn-sticky-save-profile"
              data-testid="sticky-save-profile-button"
              disabled={saving}
              className={`flex items-center gap-1.5 font-bold text-xs px-3 sm:px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0 shadow-xs active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                saveSuccess
                  ? "bg-emerald-400 text-emerald-950"
                  : "bg-emerald-500 hover:bg-emerald-400 text-emerald-950"
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t("savingProfile")}</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{t("profileSaved")}</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{t("saveProfile")}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Printable QR Code Modal Dialog for Offline Marketing */}
      {showQrModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto"
          onClick={() => setShowQrModal(false)}
        >
          {/* Print Stylesheet for clean isolated A4/flyer card print */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-worker-qr-card, #printable-worker-qr-card * {
                visibility: visible !important;
              }
              #printable-worker-qr-card {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                margin: auto !important;
                max-width: 480px !important;
                height: fit-content !important;
                border: 3px solid #059669 !important;
                box-shadow: none !important;
                border-radius: 20px !important;
                padding: 24px !important;
                background: #ffffff !important;
                page-break-inside: avoid !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <div 
            className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 p-4 sm:p-6 space-y-4 my-4 sm:my-8 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            data-testid="qr-marketing-modal"
          >
            {/* Modal Header */}
            <div className="no-print flex items-center justify-between pb-3 border-b border-slate-150">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-850 flex items-center justify-center shadow-xs">
                  <QrCode className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                    {t("printableQrCode")}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {t("offlineMarketing")} • {name || "Worker"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
                title="Close"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Worker Marketing Card Preview */}
            <div 
              id="printable-worker-qr-card" 
              data-testid="printable-worker-qr-card"
              className="bg-white rounded-2xl border-2 border-emerald-600/80 p-5 sm:p-6 text-center space-y-3.5 shadow-xs"
            >
              {/* Header Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold tracking-wider uppercase font-mono">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>ನಮ್ಮ ಕೆಲಸ • NAMMA KELASA ARTISAN</span>
              </div>

              {/* Worker Profile Summary */}
              <div className="flex items-center justify-center gap-3">
                {photo && !avatarBroken ? (
                  <img 
                    src={photo} 
                    alt="" 
                    onError={() => setAvatarBroken(true)}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border-2 border-emerald-200 shadow-2xs shrink-0" 
                  />
                ) : !photo && !brokenPresets[PRESET_AVATARS[0].url] ? (
                  <img 
                    src={PRESET_AVATARS[0].url} 
                    alt="" 
                    onError={() => setBrokenPresets((prev) => ({ ...prev, [PRESET_AVATARS[0].url]: true }))}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border-2 border-emerald-200 shadow-2xs shrink-0" 
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-100 border-2 border-emerald-200 flex items-center justify-center shrink-0">
                    <User className="w-7 h-7 text-slate-400" />
                  </div>
                )}
                <div className="text-left min-w-0">
                  <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight truncate">
                    {name || "Skilled Professional"}
                  </h4>
                  <p className="text-xs font-bold text-emerald-800 flex items-center gap-1 mt-0.5 truncate">
                    <Briefcase className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{skills.join(", ") || "Skilled Artisan"}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{locationName || (selectedLocationIdx !== null ? TOWN_CENTERS[selectedLocationIdx]?.name : "Active City Hub")}</span>
                  </p>
                </div>
              </div>

              {/* High-Resolution Printable QR Code Box */}
              <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-50/80 border border-slate-200 rounded-2xl">
                {isGeneratingQr ? (
                  <div className="w-48 h-48 flex flex-col items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                    <span className="text-xs font-mono text-slate-500">{t("generatingQr")}</span>
                  </div>
                ) : qrDataUrl ? (
                  <div className="relative group">
                    <img 
                      src={qrDataUrl} 
                      alt={`QR Code for ${name}`}
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl border border-slate-200 bg-white p-2 shadow-xs" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-9 h-9 rounded-full bg-white shadow-md border-2 border-emerald-600 flex items-center justify-center text-emerald-700 font-black text-xs">
                        NK
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Multilingual Call-to-action */}
              <div className="space-y-1">
                <p className="text-xs font-extrabold text-emerald-900 flex items-center justify-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t("scanToViewProfile")}</span>
                </p>
                <p className="text-[11px] font-semibold text-slate-600 leading-snug">
                  {language === "kn" 
                    ? "ದೈನಂದಿನ ಲಭ್ಯತೆ, ರೇಟಿಂಗ್‌ಗಳು ಮತ್ತು ದರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ನೇರ ಸಂಪರ್ಕಿಸಿ"
                    : "Check daily availability, portfolio, reviews and daily wage directly"}
                </p>
              </div>

              {/* Contact & Rate Details Pill Grid */}
              <div className="grid grid-cols-2 gap-2 text-left bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">Contact Phone:</span>
                  <span className="font-extrabold text-slate-900">{phone || "+91 98765 43210"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">Daily Wage:</span>
                  <span className="font-extrabold text-emerald-800">₹{dailyRate || "—"}/day</span>
                </div>
              </div>

              {/* Direct Sharing URL */}
              <div className="font-mono text-[9px] text-slate-400 break-all select-all pt-1 border-t border-slate-100">
                {getShareUrl()}
              </div>
            </div>

            {/* Modal Actions Toolbar */}
            <div className="no-print pt-3 border-t border-slate-150 flex flex-wrap items-center justify-between gap-2.5">
              <button
                type="button"
                id="btn-copy-qr-link"
                data-testid="copy-qr-link-button"
                onClick={handleCopyShareLink}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-800 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl transition cursor-pointer shadow-2xs active:scale-95"
              >
                {isLinkCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{isLinkCopied ? t("linkCopied") : t("copyShareLink")}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-download-qr-png"
                  data-testid="download-qr-png-button"
                  onClick={handleDownloadQrPng}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-800 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl transition cursor-pointer shadow-2xs active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t("downloadQrPng")}</span>
                </button>

                <button
                  type="button"
                  id="btn-print-marketing-flyer"
                  data-testid="print-marketing-flyer-button"
                  onClick={handlePrintFlyer}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-4 py-2 rounded-xl shadow-xs transition cursor-pointer active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t("printFlyer")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
