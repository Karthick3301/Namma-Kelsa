import React, { useState, useEffect } from "react";
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
  Upload,
  UserCheck,
  Zap,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
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
  X
} from "lucide-react";
import QRCode from "qrcode";
import { WorkerProfile, TOWN_CENTERS } from "../types";
import ChipGroup from "./ChipGroup";
import SkillRadarChart from "./SkillRadarChart";
import { 
  compressAndConvertImage, 
  PRESET_AVATARS, 
  PRESET_GALLERIES,
  formatDateToISO,
  getUpcomingDays,
  formatDisplayDate
} from "../utils";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { useLanguage } from "../context/LanguageContext";

interface ProfileEditorProps {
  uid: string;
  onSaveSuccess: () => void;
}

// Sample past work URLs for instant 1-click addition
const SAMPLE_WORK_URLS = [
  { label: "Wall Painting & Coating", url: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=600" },
  { label: "Plumbing & Piping", url: "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=600" },
  { label: "Electrical Conduits", url: "https://images.unsplash.com/photo-1502005229762-fc1b2b812ca5?auto=format&fit=crop&q=80&w=600" },
  { label: "Lawn & Gardening", url: "https://images.unsplash.com/photo-1558904541-efa8c1a68fc6?auto=format&fit=crop&q=80&w=600" },
  { label: "Masonry & Flooring", url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600" }
];

export default function ProfileEditor({ uid, onSaveSuccess }: ProfileEditorProps) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Primary worker state properties
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillProficiencies, setSkillProficiencies] = useState<Record<string, number>>({});
  const [dailyRate, setDailyRate] = useState<number>(550);
  const [selectedLocationIdx, setSelectedLocationIdx] = useState(0);
  const [isAvailable, setIsAvailable] = useState(true);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [customDateInput, setCustomDateInput] = useState<string>("");
  const [photo, setPhoto] = useState(PRESET_AVATARS[0].url);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [inputUrl, setInputUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [experience, setExperience] = useState<number>(3);
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
          setName(profile.name || "");
          setPhone(profile.phone || "");
          setSkills(profile.skills || []);
          setSkillProficiencies(profile.skillProficiencies || {});
          setDailyRate(profile.dailyRate || 500);
          setIsAvailable(profile.isAvailable !== false);
          setUnavailableDates(
            profile.unavailableDates && Array.isArray(profile.unavailableDates) 
              ? profile.unavailableDates.filter(Boolean) 
              : []
          );
          setPhoto(profile.photo || PRESET_AVATARS[0].url);
          
          // Load imageUrls with fallback to legacy gallery or presets
          const loadedUrls = (profile.imageUrls && Array.isArray(profile.imageUrls) && profile.imageUrls.length > 0)
            ? profile.imageUrls
            : (profile.gallery && profile.gallery.length > 0 ? profile.gallery : PRESET_GALLERIES[0].urls);
          setImageUrls(loadedUrls);

          setExperience(profile.experience || 1);
          setAbout(profile.about || "");
          setExistingCreatedAt(profile.createdAt || null);
          
          // Match selected town
          const townIdx = TOWN_CENTERS.findIndex(t => t.name === profile.locationName);
          if (townIdx !== -1) {
            setSelectedLocationIdx(townIdx);
          }
        } else {
          // Initialize some defaults
          setName("");
          setPhone("");
          setSkills([]);
          setSkillProficiencies({});
          setDailyRate(500);
          setIsAvailable(true);
          setUnavailableDates([]);
          setImageUrls(PRESET_GALLERIES[0].urls);
          setAbout("I am a skilled hard-working labor professional. Ready to work today!");
          setExistingCreatedAt(null);
        }
      } catch (err) {
        // Log error but allow creation of new
        console.error("No worker profile found yet or permissions issue. Setting up default blank profile.");
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

    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://") && !targetUrl.startsWith("data:image/")) {
      setUrlError("Please enter a valid image web URL starting with https:// or http://");
      return;
    }

    if (imageUrls.includes(targetUrl)) {
      setUrlError("This image URL has already been added to your showcase grid.");
      return;
    }

    setImageUrls([...imageUrls, targetUrl]);
    setInputUrl("");
    setUrlError("");
    setSuccessMsg("Past work image URL added to showcase grid!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleRemoveImageUrl = (indexToRemove: number) => {
    setImageUrls(imageUrls.filter((_, idx) => idx !== indexToRemove));
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
        setSuccessMsg("Profile photo compressed and uploaded locally!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } catch (err) {
        setErrorMsg("Failed to upload image. Please try a smaller file.");
      }
    }
  };

  // Handle local file upload converted to compressed base64 data-url and appended to imageUrls
  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const compressedBase64 = await compressAndConvertImage(e.target.files[0], 600, 400, 0.75);
        setImageUrls(prev => [...prev, compressedBase64]);
        setSuccessMsg("Uploaded image added to past work showcase!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } catch (err) {
        setErrorMsg("Failed to upload image. Please try a smaller file.");
      }
    }
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

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    const town = TOWN_CENTERS[selectedLocationIdx];
    const profilePath = `workers/${uid}`;

    const cleanImageUrls = imageUrls.map(url => url.trim()).filter(Boolean);

    const profileData: WorkerProfile = {
      uid,
      name: name.trim(),
      phone: phone.trim(),
      skills,
      dailyRate: Number(dailyRate),
      locationName: town.name,
      latitude: town.latitude,
      longitude: town.longitude,
      isAvailable,
      unavailableDates: Array.from(new Set<string>(unavailableDates)).sort(),
      photo,
      skillProficiencies,
      imageUrls: cleanImageUrls,
      gallery: cleanImageUrls, // Maintain backwards compatibility with legacy gallery readers
      experience: Number(experience),
      about: about.trim() || "Professional skilled worker ready to fulfill daily wage tasks with dignity.",
      createdAt: existingCreatedAt || serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      // Security rules will validate exact keys and format
      await setDoc(doc(db, profilePath), profileData);
      setSuccessMsg("🎉 Your professional worker identity has been saved successfully!");
      setSaveSuccess(true);
      onSaveSuccess();
      setTimeout(() => setSuccessMsg(""), 4000);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, profilePath);
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

  return (
    <div id="profile-editor-container" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span>{t("workerProfileHeader")}</span>
          </h2>
          <p className="text-sm text-slate-500">{t("workerProfileSub")}</p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
          {/* Printable QR Code Button for Offline Marketing */}
          <button
            type="button"
            id="btn-generate-printable-qr"
            data-testid="generate-printable-qr-button"
            onClick={handleOpenQrModal}
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
            title="Generate printable QR code linked to your unique profile URL for offline marketing"
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>{t("printableQrCode")}</span>
          </button>

          {/* Instant Availability switch (Highlight of success criteria) */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl shrink-0">
            <span className="text-xs font-bold text-slate-600 uppercase font-mono tracking-wider">{t("availabilityToggle")}</span>
            <button
              id="toggle-availability-main"
              type="button"
              onClick={() => handleAvailabilityToggle(!isAvailable)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden cursor-pointer ${
                isAvailable ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAvailable ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Profile Image & Gallery Block */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-50/50 p-4 border border-slate-200 rounded-xl">
          
          {/* Avatar setup */}
          <div className="md:col-span-1 flex flex-col items-center">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-2 text-center w-full">Identity Photo</h4>
            <div className="relative group w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border-2 border-emerald-100">
              <img src={photo} alt="Photo Preview" className="w-full h-full object-cover" />
              <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition cursor-pointer">
                <Upload className="w-5 h-5 mb-1" />
                <span>Upload</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 text-center">Click raw image or pick preset avatar below</p>
          </div>

          {/* Quick Preset selection */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-2">Popular Work Photos Presets</h4>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_AVATARS.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setPhoto(preset.url);
                    // Match a logical past work photos result too if empty or switched!
                    const galMatch = PRESET_GALLERIES.find(g => g.category === preset.category);
                    if (galMatch && imageUrls.length === 0) setImageUrls(galMatch.urls);
                  }}
                  className={`relative rounded-lg overflow-hidden border-2 aspect-square bg-slate-100 transition duration-200 cursor-pointer ${
                    photo === preset.url ? "border-emerald-500 scale-[1.05] shadow-sm" : "border-slate-200 hover:border-slate-350"
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  {photo === preset.url && (
                    <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input Text Block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Name */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase font-mono tracking-wider">
              <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
            </label>
            <input
              type="text"
              id="editor-input-name"
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1.5 w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase font-mono tracking-wider">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number (Works with Customer Calls)
            </label>
            <input
              type="tel"
              id="editor-input-phone"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="mt-1.5 w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
            />
          </div>

          {/* Daily rate */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase font-mono tracking-wider">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Daily Rate (₹ Rupees / Day)
            </label>
            <input
              type="number"
              id="editor-input-rate"
              placeholder="e.g. 600"
              min={100}
              max={5000}
              value={dailyRate}
              onChange={(e) => setDailyRate(Number(e.target.value))}
              required
              className="mt-1.5 w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
            />
          </div>

          {/* Experience */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase font-mono tracking-wider">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Years of Work Experience
            </label>
            <input
              type="number"
              id="editor-input-experience"
              min={0}
              max={50}
              value={experience}
              onChange={(e) => setExperience(Number(e.target.value))}
              className="mt-1.5 w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
            />
          </div>

          {/* Location Area Selection (Handles coordinates) */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase font-mono tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> Service Location Hub
            </label>
            <select
              id="editor-input-location"
              value={selectedLocationIdx}
              onChange={(e) => setSelectedLocationIdx(Number(e.target.value))}
              className="mt-1.5 w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 cursor-pointer"
            >
              {TOWN_CENTERS.map((town, idx) => (
                <option key={idx} value={idx}>
                  {town.name} (Lat: {town.latitude}, Lon: {town.longitude})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-450 mt-1 italic">
              * Selecting a service hub updates your marketplace neighborhood instantly
            </p>
          </div>
        </div>

        {/* Custom skills tagging */}
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-605 text-slate-600 uppercase font-mono tracking-wider">
              <Zap className="w-3.5 h-3.5 text-slate-400" /> Select Skills
            </label>
            <ChipGroup selectedSkills={skills} onChange={setSkills} />
          </div>

          {/* Recharts Skill Proficiency Radar Chart */}
          <SkillRadarChart
            skills={skills}
            skillProficiencies={skillProficiencies}
            onChangeProficiency={(skill, val) => {
              setSkillProficiencies((prev) => ({
                ...prev,
                [skill]: val
              }));
            }}
            isEditable={true}
            experienceYears={experience}
          />
        </div>

        {/* About work description */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase font-mono tracking-wider mb-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" /> About Your Work/Experience Bio
          </label>
          <textarea
            id="editor-input-about"
            rows={3}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Introduce yourself to patrons..."
            className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
          />
        </div>

        {/* Past Work Showcase Image URLs & Photo Grid */}
        <div className="space-y-4 bg-slate-50 p-5 border border-slate-200 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span>Past Work Photo Showcase (imageUrls)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold ml-1">
                {imageUrls.length} {imageUrls.length === 1 ? "Photo" : "Photos"}
              </span>
            </h4>
            <span className="text-[11px] text-slate-400">
              Displayed as a photo grid on your public WorkerCard
            </span>
          </div>

          {/* URL Input Box */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Link className="w-3.5 h-3.5 text-slate-400" />
              <span>Enter Past Work Image URL:</span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                id="input-past-work-image-url"
                placeholder="https://images.unsplash.com/... or paste image URL"
                value={inputUrl}
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
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <button
                type="button"
                id="btn-add-image-url"
                onClick={() => handleAddImageUrl()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Photo URL</span>
              </button>
            </div>

            {urlError && (
              <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{urlError}</span>
              </p>
            )}

            {/* Quick 1-click sample presets */}
            <div className="pt-2.5 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Quick Sample Presets (Click to add to showcase):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_WORK_URLS.map((sample, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => handleAddImageUrl(sample.url)}
                    className="text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-650 px-2.5 py-1 rounded-lg transition cursor-pointer font-medium"
                  >
                    + {sample.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Local File upload option */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Or upload a photo directly from your device:</span>
              <label className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Local File</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoFileUpload} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          {/* Photo Grid Preview of imageUrls */}
          {imageUrls.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-white p-4">
              <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">No past work photos added yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Paste an image URL above or click one of the quick samples to show customers your workmanship.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Current Photo Grid ({imageUrls.length})
                </span>
                <span className="text-[10px] text-slate-400 italic">
                  Hover photo to remove or view full URL
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {imageUrls.map((url, idx) => (
                  <div 
                    key={idx}
                    className="relative group rounded-xl overflow-hidden bg-white border border-slate-200 shadow-2xs aspect-video flex flex-col justify-between"
                  >
                    <img 
                      src={url} 
                      alt={`Past work sample #${idx + 1}`}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=300";
                      }}
                      className="w-full h-full object-cover"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 opacity-90 group-hover:opacity-100 transition-opacity" />

                    {/* Top index badge and remove button */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                      <span className="bg-black/60 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveImageUrl(idx)}
                        title="Remove photo from showcase"
                        aria-label="Remove photo"
                        className="p-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Bottom URL snippet */}
                    <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between text-[10px] text-slate-200 font-mono">
                      <span className="truncate max-w-[85%]">{url}</span>
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noreferrer" 
                        title="Open image in new tab"
                        className="text-white hover:text-emerald-300 ml-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Toggle-based Date-Picker for Upcoming Availability & Leave Schedule */}
        <div 
          id="date-picker-availability-section" 
          data-testid="date-picker-availability-section"
          className="space-y-4 bg-slate-50 p-5 border border-slate-200 rounded-2xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div>
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                <span>{t("scheduleLeave")}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 ${
                  unavailableDates.length > 0 
                    ? "bg-rose-100 text-rose-800 border border-rose-200" 
                    : "bg-emerald-100 text-emerald-850 border border-emerald-200"
                }`}>
                  {unavailableDates.length > 0 
                    ? `${unavailableDates.length} ${t("markedBusy")}` 
                    : t("availableForHire")}
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {t("datePickerHelper")}
              </p>
            </div>

            {/* Quick Helper Actions */}
            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              <button
                type="button"
                id="btn-mark-tomorrow-busy"
                onClick={handleMarkTomorrow}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 shadow-2xs transition cursor-pointer flex items-center gap-1"
                title="Toggle tomorrow as busy or available"
              >
                <Clock className="w-3 h-3 text-amber-500" />
                <span>{t("markTomorrowBusy")}</span>
              </button>

              <button
                type="button"
                id="btn-mark-weekend-busy"
                onClick={handleMarkWeekend}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 shadow-2xs transition cursor-pointer flex items-center gap-1"
                title="Toggle upcoming weekend days"
              >
                <Calendar className="w-3 h-3 text-sky-500" />
                <span>{t("markWeekendBusy")}</span>
              </button>

              {unavailableDates.length > 0 && (
                <button
                  type="button"
                  id="btn-clear-all-dates"
                  onClick={handleClearAllDates}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 shadow-2xs transition cursor-pointer flex items-center gap-1"
                  title="Clear all marked unavailable dates"
                >
                  <Trash2 className="w-3 h-3 text-rose-500" />
                  <span>{t("clearAllDates")}</span>
                </button>
              )}
            </div>
          </div>

          {/* 14-Day Interactive Toggle Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <CalendarCheck className="w-3 h-3 text-emerald-600" />
                <span>Upcoming 14 Days (Click to toggle busy / free)</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Red = Busy • White/Green = Available
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
                        ? "bg-rose-50/90 border-rose-300 ring-2 ring-rose-400/20 text-rose-950 shadow-xs"
                        : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 text-slate-800"
                    }`}
                  >
                    {/* Relative Badge (Today/Tomorrow) */}
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-[9px] font-bold font-mono uppercase px-1 rounded ${
                        day.isToday 
                          ? "bg-emerald-600 text-white" 
                          : day.isTomorrow 
                            ? "bg-amber-100 text-amber-800 border border-amber-200" 
                            : day.isWeekend 
                              ? "bg-slate-100 text-slate-500" 
                              : "text-slate-400"
                      }`}>
                        {day.isToday ? t("today") : day.isTomorrow ? t("tomorrow") : day.dayName}
                      </span>

                      {isMarkedUnavailable ? (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Marked as Busy" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Available for work" />
                      )}
                    </div>

                    {/* Day number & Month */}
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

                    {/* Status Pill */}
                    <div className={`mt-1.5 w-full py-0.5 px-1 rounded-md text-[9px] font-bold flex items-center justify-center gap-1 ${
                      isMarkedUnavailable 
                        ? "bg-rose-600 text-white" 
                        : "bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800"
                    }`}>
                      {isMarkedUnavailable ? (
                        <>
                          <Ban className="w-2.5 h-2.5 shrink-0" />
                          <span>Busy</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                          <span>Free</span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Input for Any Future Date */}
          <div className="pt-2 border-t border-slate-200/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <label htmlFor="custom-date-picker" className="text-[11px] font-bold text-slate-600 whitespace-nowrap flex items-center gap-1 font-mono">
                <CalendarX className="w-3.5 h-3.5 text-rose-500" />
                <span>{t("addSpecificDate")}:</span>
              </label>
              <input
                type="date"
                id="custom-date-picker"
                min={formatDateToISO(new Date())}
                value={customDateInput}
                onChange={(e) => setCustomDateInput(e.target.value)}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <button
                type="button"
                id="btn-add-custom-date"
                disabled={!customDateInput}
                onClick={handleAddCustomDate}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:cursor-not-allowed shadow-2xs"
              >
                {t("addDateButton")}
              </button>
            </div>

            {/* Marked Unavailable Dates Summary Chips */}
            {unavailableDates.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                  {t("markedDatesCount")} ({unavailableDates.length}):
                </span>
                {unavailableDates.slice(0, 5).map((iso) => (
                  <span
                    key={iso}
                    className="inline-flex items-center gap-1 bg-white border border-rose-200 text-rose-800 px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-2xs"
                  >
                    <span>{formatDisplayDate(iso)}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleUnavailableDate(iso)}
                      className="text-rose-400 hover:text-rose-700 ml-0.5 cursor-pointer"
                      title={`Unmark ${iso}`}
                      aria-label={`Unmark ${iso}`}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                {unavailableDates.length > 5 && (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded-md">
                    +{unavailableDates.length - 5} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Offline Marketing & Printable QR Code Banner */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/50 p-4 sm:p-5 border border-emerald-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-emerald-950">{t("offlineMarketing")}</h4>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-850 uppercase border border-emerald-200">
                  Flyer & Cards
                </span>
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
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <QrCode className="w-4 h-4" />
            <span>{t("printableQrCode")}</span>
          </button>
        </div>

        {/* Form Action save */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            id="btn-save-profile"
            disabled={saving}
            className={`flex items-center gap-2.5 font-bold text-xs px-6 py-3.5 rounded-xl shadow-md cursor-pointer transition-all duration-300 tracking-wider uppercase ${
              saveSuccess
                ? "bg-emerald-600 text-white ring-2 ring-emerald-400 ring-offset-2 ring-offset-white shadow-lg shadow-emerald-600/30 scale-[1.02]"
                : "bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:bg-slate-300 disabled:scale-100 text-white"
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{t("savingProfile")}</span>
              </>
            ) : saveSuccess ? (
              <>
                <span className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-emerald-200 opacity-75"></span>
                  <Check 
                    id="save-success-icon"
                    data-testid="save-profile-success-check"
                    className="w-4 h-4 text-white animate-in zoom-in-75 duration-200 stroke-[3]" 
                  />
                </span>
                <span className="font-extrabold text-white animate-in fade-in duration-200">
                  {t("profileSaved")}
                </span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t("saveProfile")}</span>
              </>
            )}
          </button>
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
            className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 p-6 space-y-4 my-8"
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
                <span>ನಮ್ಮ ಕೆಲಸ • NAMMA-KELSA VERIFIED</span>
              </div>

              {/* Worker Profile Summary */}
              <div className="flex items-center justify-center gap-3">
                <img 
                  src={photo || PRESET_AVATARS[0].url} 
                  alt={name || "Worker"} 
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border-2 border-emerald-200 shadow-2xs shrink-0" 
                />
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
                    <span>{TOWN_CENTERS[selectedLocationIdx]?.name || "Bengaluru Hub"}</span>
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
                  <span className="font-extrabold text-emerald-800">₹{dailyRate}/day</span>
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
