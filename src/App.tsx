import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  MapPin, 
  UserCheck, 
  Search, 
  Sparkles, 
  LogOut, 
  LogIn, 
  Github, 
  Database,
  Building,
  Heart,
  Menu,
  Phone,
  ArrowRight,
  Info,
  LayoutDashboard,
  UserCog,
  Loader2,
  ArrowLeftRight,
  ShieldCheck,
  WifiOff,
  HelpCircle,
  User as UserIcon
} from "lucide-react";
import { collection, onSnapshot, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider, handleFirestoreError, OperationType } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { WorkerProfile, TOWN_CENTERS, CustomerLocation, UserRole } from "./types";
import { calculateDistance, MOCK_WORKERS, formatReverseGeocodedLocation } from "./utils";
import SearchFilters from "./components/SearchFilters";
import WorkerCard from "./components/WorkerCard";
import ProfileEditor from "./components/ProfileEditor";
import WorkerDashboard from "./components/WorkerDashboard";
import LanguageSwitcher from "./components/LanguageSwitcher";
import NotificationsBell from "./components/NotificationsBell";
import PhoneAuthLogin from "./components/PhoneAuthLogin";
import RoleSelection from "./components/RoleSelection";
import AccountLinkingModal from "./components/AccountLinkingModal";
import HelpSupportModal from "./components/HelpSupportModal";
import { useLanguage } from "./context/LanguageContext";

const ROLE_STORAGE_KEY = "namma_kelsa_role";

function readStoredRole(uid?: string | null): UserRole | null {
  try {
    const saved = localStorage.getItem(ROLE_STORAGE_KEY);
    if (saved === "customer" || saved === "worker") {
      return saved;
    }
    if (uid) {
      const uidRole = localStorage.getItem(`namma_kelsa_user_role_${uid}`);
      if (uidRole === "customer" || uidRole === "worker") {
        return uidRole;
      }
    }
  } catch {
    // Ignore localStorage read errors
  }
  return null;
}

function writeStoredRole(role: UserRole | null, uid?: string | null) {
  try {
    if (role) {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
      if (uid) {
        localStorage.setItem(`namma_kelsa_user_role_${uid}`, role);
      }
    } else {
      localStorage.removeItem(ROLE_STORAGE_KEY);
    }
  } catch {
    // Ignore localStorage write errors
  }
}

export default function App() {
  const { t, language } = useLanguage();
  const initialRole = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("worker")
    ? (readStoredRole() || "customer")
    : readStoredRole();

  const [userRole, setUserRole] = useState<UserRole | null>(initialRole);
  const [activeTab, setActiveTab] = useState<"customer" | "worker">(
    initialRole === "worker" ? "worker" : "customer"
  );
  const [workerSubView, setWorkerSubView] = useState<"dashboard" | "edit">("dashboard");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [showAuthScreen, setShowAuthScreen] = useState<boolean>(false);
  const [showAccountLinking, setShowAccountLinking] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<"nearest" | "lowest_rate" | "best_rated">("nearest");
  const [workerRatings, setWorkerRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const [toastNotification, setToastNotification] = useState<{ type: "success" | "info" | "warning"; message: string } | null>(null);
  const [welcomeAvatarBroken, setWelcomeAvatarBroken] = useState(false);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const isDevMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("dev") === "true";

  // Close header profile menu on outside click or Escape key
  useEffect(() => {
    if (!showProfileMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showProfileMenu]);

  const handleWorkerRatingUpdate = React.useCallback((workerUid: string, avg: number, count: number) => {
    setWorkerRatings((prev) => {
      const existing = prev[workerUid];
      if (existing && existing.avg === avg && existing.count === count) return prev;
      return { ...prev, [workerUid]: { avg, count } };
    });
  }, []);

  // Monitor online / offline connectivity status for PWA
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Custom Demo Mode credentials (guarantees preview succeeds in custom browser frames)
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoUid, setDemoUid] = useState<string | null>(null);

  // Firestore workers cache
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Customer search filters state
  const [searchText, setSearchText] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [maxDistance, setMaxDistance] = useState<number>(30);
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [selectedTownIdx, setSelectedTownIdx] = useState<number | null>(0);
  const [customerLocation, setCustomerLocation] = useState<CustomerLocation>(TOWN_CENTERS[0]);

  // Local state 'favorites' array storing worker UIDs with localStorage persistence
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("namma_kelsa_favorite_worker_uids");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.filter((id): id is string => typeof id === "string");
      }
    } catch (e) {
      console.error("Error reading favorites from localStorage", e);
    }
    return [];
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

  // Persist favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("namma_kelsa_favorite_worker_uids", JSON.stringify(favorites));
    } catch (e) {
      console.error("Error saving favorites to localStorage", e);
    }
  }, [favorites]);

  // Silently auto-detect customer location on first load if browser GPS permission is available
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;

    let isMounted = true;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (!isMounted) return;
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        let resolvedTitle = `Current Location (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`;

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
            { headers: { "Accept-Language": "en" }, signal: controller.signal }
          );
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            resolvedTitle = formatReverseGeocodedLocation(data.address, data.display_name);
          }
        } catch {
          // Keep coordinates fallback
        }

        if (isMounted) {
          setSelectedTownIdx(null);
          setCustomerLocation({ name: resolvedTitle, latitude: lat, longitude: lng });
        }
      },
      () => {
        // Silent fallback - user denied or position unavailable. Remains gracefully on default hub
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleFavorite = (workerUid: string) => {
    setFavorites((prev) => {
      if (prev.includes(workerUid)) {
        return prev.filter((id) => id !== workerUid);
      } else {
        return [...prev, workerUid];
      }
    });
  };

  // Check auth changes and query user role from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsDemoMode(false);
        setDemoUid(null);
        setShowAuthScreen(false);

        const localRole = readStoredRole(user.uid);

        try {
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists() && userSnap.data()?.role) {
            const firestoreRole = userSnap.data().role as UserRole;
            const effectiveRole = localRole || firestoreRole;

            // Sync Google profile fields (email, displayName, photoURL) if missing from Firestore doc
            const existingData = userSnap.data();
            const updates: any = {};
            let shouldUpdate = false;
            if (!existingData.email && user.email) {
              updates.email = user.email;
              shouldUpdate = true;
            }
            if (!existingData.displayName && user.displayName) {
              updates.displayName = user.displayName;
              shouldUpdate = true;
            }
            if (!existingData.photoURL && user.photoURL) {
              updates.photoURL = user.photoURL;
              shouldUpdate = true;
            }
            if (shouldUpdate) {
              updates.updatedAt = serverTimestamp();
              try {
                await updateDoc(userDocRef, updates);
              } catch (e) {
                console.warn("Could not sync user metadata to existing doc:", e);
              }
            }

            writeStoredRole(effectiveRole, user.uid);
            setUserRole(effectiveRole);
            setActiveTab(effectiveRole === "worker" ? "worker" : "customer");
          } else if (localRole) {
            writeStoredRole(localRole, user.uid);
            setUserRole(localRole);
            setActiveTab(localRole === "worker" ? "worker" : "customer");
          } else {
            setUserRole(null);
          }
        } catch (err) {
          console.warn("Could not retrieve user document from Firestore:", err);
          if (localRole) {
            setUserRole(localRole);
            setActiveTab(localRole === "worker" ? "worker" : "customer");
          }
        }
      } else {
        if (!isDemoMode) {
          setCurrentUser(null);
          const storedRole = readStoredRole();
          setUserRole(storedRole);
          if (storedRole === "customer") {
            setActiveTab("customer");
          }
        }
      }
      setIsCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [isDemoMode]);

  // Handle successful Phone Auth login
  const handleLoginSuccess = async (user: User, isNewUser?: boolean) => {
    setCurrentUser(user);
    setShowAuthScreen(false);

    const existingRole = userRole || readStoredRole(user.uid);

    if (user.uid.startsWith("demo-") || user.uid.startsWith("mock-")) {
      setIsDemoMode(true);
      setDemoUid(user.uid);
      const effectiveRole = existingRole || "worker";
      writeStoredRole(effectiveRole, user.uid);
      setUserRole(effectiveRole);
      setActiveTab(effectiveRole === "worker" ? "worker" : "customer");
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists() && userSnap.data()?.role) {
        const savedRole = (existingRole || userSnap.data().role) as UserRole;

        // Sync Google-provided email, display name, and photo to Firestore if missing
        const existingData = userSnap.data();
        const updates: any = {};
        let needsUpdate = false;
        if (!existingData.email && user.email) {
          updates.email = user.email;
          needsUpdate = true;
        }
        if (!existingData.displayName && user.displayName) {
          updates.displayName = user.displayName;
          needsUpdate = true;
        }
        if (!existingData.photoURL && user.photoURL) {
          updates.photoURL = user.photoURL;
          needsUpdate = true;
        }
        if (needsUpdate) {
          updates.updatedAt = serverTimestamp();
          try {
            await updateDoc(userDocRef, updates);
          } catch (e) {
            console.warn("Could not sync user metadata on login:", e);
          }
        }

        writeStoredRole(savedRole, user.uid);
        setUserRole(savedRole);
        setActiveTab(savedRole === "worker" ? "worker" : "customer");
      } else {
        const fallbackRole = existingRole || "worker";
        writeStoredRole(fallbackRole, user.uid);
        setUserRole(fallbackRole);
        setActiveTab(fallbackRole === "worker" ? "worker" : "customer");
      }
    } catch (err) {
      console.warn("Error checking user role on login:", err);
      const fallbackRole = existingRole || "worker";
      writeStoredRole(fallbackRole, user.uid);
      setUserRole(fallbackRole);
      setActiveTab(fallbackRole === "worker" ? "worker" : "customer");
    }
  };

  // Switch or choose role (persisted in localStorage with try/catch + synced to Firestore if logged in)
  const handleSwitchRole = async (targetRole: UserRole) => {
    writeStoredRole(targetRole, currentUser?.uid);
    setUserRole(targetRole);
    setActiveTab(targetRole === "worker" ? "worker" : "customer");
    setShowProfileMenu(false);

    if (currentUser && !currentUser.uid.startsWith("demo-") && !currentUser.uid.startsWith("mock-")) {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          await updateDoc(userDocRef, {
            role: targetRole,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(userDocRef, {
            uid: currentUser.uid,
            role: targetRole,
            email: currentUser.email || "",
            phoneNumber: currentUser.phoneNumber || "",
            displayName: currentUser.displayName || "",
            photoURL: currentUser.photoURL || "",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.warn("Could not sync role change to Firestore:", err);
      }
    }
  };

  // Read workers database in real-time via onSnapshot
  useEffect(() => {
    setLoadingWorkers(true);
    const workersPath = "workers";
    const unsubscribe = onSnapshot(
      collection(db, workersPath),
      (snapshot) => {
        const list: WorkerProfile[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ uid: docSnap.id, ...docSnap.data() } as WorkerProfile);
        });
        setWorkers(list);
        setLoadingWorkers(false);
      },
      (err) => {
        // Handle gracefully, might print missing indexes or permission logs
        console.warn("Snapshot permission log or missing data. Trying direct read fallback.", err);
        setLoadingWorkers(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Handle deep-linking for shared worker profile URLs (?worker=<uid>)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedWorkerUid = params.get("worker");
    if (sharedWorkerUid && !loadingWorkers && workers.length > 0) {
      const targetWorker = workers.find(w => w.uid === sharedWorkerUid);
      if (targetWorker) {
        setActiveTab("customer");
        if (!targetWorker.isAvailable) {
          setOnlyAvailable(false);
        }
        setMaxDistance(50);
        setTimeout(() => {
          const cardEl = document.getElementById(`worker-card-${sharedWorkerUid}`);
          if (cardEl) {
            cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
            cardEl.classList.add("ring-4", "ring-emerald-500/80", "shadow-xl");
            setTimeout(() => {
              cardEl.classList.remove("ring-4", "ring-emerald-500/80", "shadow-xl");
            }, 3500);
          }
        }, 400);
      }
    }
  }, [loadingWorkers, workers]);

  // Standard Google login trigger
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setCurrentUser(result.user);
      setIsDemoMode(false);
      setDemoUid(null);
    } catch (err: any) {
      console.error("Auth popup failed. Standard behavior in block frames.", err);
      if (err?.code !== "auth/popup-closed-by-user") {
        setToastNotification({
          type: "info",
          message: "Note: If Google login popup was blocked by your browser, you can use quick Demo Mode or Phone/Email login."
        });
        setTimeout(() => setToastNotification(null), 5000);
      }
    }
  };

  // Demo Login (Guarantees immediate testing without popups)
  const handleDemoLogin = () => {
    setIsDemoMode(true);
    setDemoUid("mock-artisan-99");
    // Mock user wrapper structure
    setCurrentUser({
      uid: "mock-artisan-99",
      displayName: "Gurumurthy Swamy (Demo)",
      email: "gurumurthy@nammakesla.in",
      photoURL: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=150"
    } as any);
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    try {
      if (isDemoMode) {
        setIsDemoMode(false);
        setDemoUid(null);
      } else if (currentUser) {
        await signOut(auth);
      }
    } catch (e) {
      console.error("Sign out error", e);
    }
    setCurrentUser(null);
    setShowAuthScreen(false);
    setActiveTab("customer");
  };

  // Safe Seeder button: Populate or refresh worker listings
  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      setWorkers(MOCK_WORKERS as WorkerProfile[]);
      setToastNotification({
        type: "success",
        message: "Artisan directory refreshed with verified worker listings across India!"
      });
      setTimeout(() => setToastNotification(null), 4000);
    } finally {
      setSeeding(false);
    }
  };

  // Compute live filtered search list based on customer location (Preset Hub, Live GPS, or Custom Address)
  const activeCustomerLocation: CustomerLocation = customerLocation || (selectedTownIdx !== null ? TOWN_CENTERS[selectedTownIdx] : TOWN_CENTERS[0]);

  // Fallback to rich India directory mock workers if Firestore collection is fresh or offline
  const displayWorkers = workers.length > 0 ? workers : (MOCK_WORKERS as WorkerProfile[]);

  const filteredWorkers = displayWorkers
    .map((w) => {
      const hasValidWorkerLat = typeof w.latitude === "number" && !isNaN(w.latitude) && w.latitude >= -90 && w.latitude <= 90;
      const hasValidWorkerLon = typeof w.longitude === "number" && !isNaN(w.longitude) && w.longitude >= -180 && w.longitude <= 180;
      const hasValidCustomerLat = typeof activeCustomerLocation.latitude === "number" && !isNaN(activeCustomerLocation.latitude);
      const hasValidCustomerLon = typeof activeCustomerLocation.longitude === "number" && !isNaN(activeCustomerLocation.longitude);

      const dist = (hasValidWorkerLat && hasValidWorkerLon && hasValidCustomerLat && hasValidCustomerLon)
        ? calculateDistance(
            activeCustomerLocation.latitude,
            activeCustomerLocation.longitude,
            w.latitude,
            w.longitude
          )
        : 99999;
      return { ...w, computedDistance: dist };
    })
    .filter((w) => {
      // 1. Skill Type match
      if (selectedSkill && !w.skills.includes(selectedSkill)) {
        return false;
      }
      // 2. Search Text on name or location name
      if (searchText) {
        const queryLower = searchText.toLowerCase();
        const matchesName = w.name?.toLowerCase().includes(queryLower);
        const matchesLocation = w.locationName?.toLowerCase().includes(queryLower);
        if (!matchesName && !matchesLocation) return false;
      }
      // 3. Distance within range constraint (if maxDistance < 500)
      if (maxDistance < 500 && w.computedDistance > maxDistance) {
        return false;
      }
      // 4. Availability checkbox
      if (onlyAvailable && !w.isAvailable) {
        return false;
      }
      // 5. Favorites filter
      if (showFavoritesOnly && !favorites.includes(w.uid)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "lowest_rate") {
        const rateA = Number(a.dailyRate) || 999999;
        const rateB = Number(b.dailyRate) || 999999;
        if (rateA !== rateB) return rateA - rateB;
        return (a.computedDistance ?? 99999) - (b.computedDistance ?? 99999);
      }
      if (sortBy === "best_rated") {
        const statsA = workerRatings[a.uid];
        const statsB = workerRatings[b.uid];
        const countA = statsA ? statsA.count : (typeof (a as any).reviewCount === "number" ? (a as any).reviewCount : 0);
        const countB = statsB ? statsB.count : (typeof (b as any).reviewCount === "number" ? (b as any).reviewCount : 0);
        const hasReviewsA = countA > 0;
        const hasReviewsB = countB > 0;

        // Workers with no reviews ("New") go after rated workers
        if (hasReviewsA && !hasReviewsB) return -1;
        if (!hasReviewsA && hasReviewsB) return 1;

        if (hasReviewsA && hasReviewsB) {
          const avgA = statsA ? statsA.avg : (typeof (a as any).rating === "number" ? (a as any).rating : 0);
          const avgB = statsB ? statsB.avg : (typeof (b as any).rating === "number" ? (b as any).rating : 0);
          if (avgB !== avgA) return avgB - avgA;
          if (countB !== countA) return countB - countA;
        }
        return (a.computedDistance ?? 99999) - (b.computedDistance ?? 99999);
      }
      // Default: "nearest"
      return (a.computedDistance ?? 99999) - (b.computedDistance ?? 99999);
    });

  const activeWorkerUid = isDemoMode ? demoUid : currentUser?.uid;

  // Quick radius steps: 5 → 15 → 30 → 50 → 100 → All India (500)
  const QUICK_RADII = [5, 15, 30, 50, 100, 500];
  const nextLargerRadius = QUICK_RADII.find((r) => r > maxDistance) ?? 500;

  // First letter for header round avatar
  const avatarInitial = (
    currentUser?.displayName ||
    currentUser?.email ||
    (userRole === "worker" ? t("workerRoleLabel") : t("customerRoleLabel")) ||
    "U"
  )
    .trim()
    .charAt(0)
    .toUpperCase();

  // 1. Initial Auth Check Spinner
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 bg-emerald-700 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-lg mb-3">
          NK
        </div>
        <div className="flex items-center gap-2 text-emerald-800 text-sm font-bold">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>{t("brandName")}</span>
        </div>
      </div>
    );
  }

  // 2. First Visit Full-Screen Choice: "I want to hire a worker" vs "I am a worker looking for work"
  if (!userRole) {
    return (
      <div
        data-testid="first-visit-role-choice"
        className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-150 antialiased"
      >
        <header className="sticky top-0 z-40 bg-emerald-900 text-white border-b border-emerald-800 py-3 px-3.5 sm:px-6 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-base sm:text-lg text-white select-none shadow-sm shrink-0">
                NK
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-none truncate">
                  {t("brandName")}
                </h1>
                <p className="text-[9px] sm:text-[10px] text-emerald-300 font-medium uppercase tracking-widest leading-none mt-1 truncate">
                  {t("brandTagline")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-lg p-5 sm:p-7 space-y-5">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl mx-auto flex items-center justify-center font-bold text-xl text-white shadow-xs">
                NK
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                {t("welcomeChoiceTitle")}
              </h2>
              <p className="text-xs text-slate-500">
                {t("heroSlimTagline")}
              </p>
            </div>

            <div className="space-y-3">
              {/* Large Button 1: I want to hire a worker */}
              <button
                type="button"
                id="role-select-customer"
                data-testid="role-option-customer"
                onClick={() => handleSwitchRole("customer")}
                className="w-full min-h-[84px] p-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50/70 hover:bg-emerald-100/80 active:scale-[0.99] text-left transition flex items-center gap-3.5 cursor-pointer shadow-2xs group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Search className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                    {t("iWantToHireWorker")}
                  </span>
                  <span className="block text-xs text-slate-600 mt-0.5 leading-snug">
                    {t("iWantToHireWorkerDesc")}
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-emerald-700 shrink-0" />
              </button>

              {/* Large Button 2: I am a worker looking for work */}
              <button
                type="button"
                id="role-select-worker"
                data-testid="role-option-worker"
                onClick={() => handleSwitchRole("worker")}
                className="w-full min-h-[84px] p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-white hover:bg-slate-50 active:scale-[0.99] text-left transition flex items-center gap-3.5 cursor-pointer shadow-2xs group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-emerald-600 text-slate-700 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                    {t("iAmWorkerLookingForWork")}
                  </span>
                  <span className="block text-xs text-slate-600 mt-0.5 leading-snug">
                    {t("iAmWorkerLookingForWorkDesc")}
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-700 shrink-0" />
              </button>
            </div>

            <p className="text-[11px] text-center text-slate-400">
              {t("changeAnytimeFromMenu")}
            </p>
          </div>
        </main>
      </div>
    );
  }

  // 3. Dedicated Phone / Email / Google Login Screen when triggered by Worker or User
  if (showAuthScreen && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-150 antialiased">
        <header className="sticky top-0 z-40 bg-emerald-900 text-white border-b border-emerald-800 py-3 px-3.5 sm:px-6 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-base sm:text-lg text-white select-none shadow-sm shrink-0">
                NK
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-none truncate">
                  {t("brandName")}
                </h1>
                <p className="text-[9px] sm:text-[10px] text-emerald-300 font-medium uppercase tracking-widest leading-none mt-1 truncate">
                  {t("brandTagline")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center py-6 px-4">
          <PhoneAuthLogin
            onLoginSuccess={handleLoginSuccess}
            onContinueAsGuest={() => setShowAuthScreen(false)}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-150 antialiased">
      
      {/* PWA Offline Connectivity Banner */}
      {isOffline && (
        <div className="bg-amber-600 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-sm animate-in fade-in sticky top-0 z-50">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            {language === "kn"
              ? "ನೀವು ಪ್ರಸ್ತುತ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೀರಿ. ಸಂಗ್ರಹಿಸಿದ ಪ್ರೊಫೈಲ್‌ಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ."
              : "You are currently offline. Viewing cached artisans & worker profiles."}
          </span>
        </div>
      )}

      {/* Floating In-App Toast Notification */}
      {toastNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className={`p-3.5 rounded-2xl shadow-xl border flex items-center justify-between gap-3 text-xs font-bold ${
            toastNotification.type === "success"
              ? "bg-emerald-900 text-white border-emerald-700"
              : toastNotification.type === "warning"
              ? "bg-amber-900 text-white border-amber-700"
              : "bg-slate-900 text-white border-slate-700"
          }`}>
            <span>{toastNotification.message}</span>
            <button
              type="button"
              onClick={() => setToastNotification(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Header (320px-safe, round avatar menu, worker tabs only for workers) */}
      <header className="sticky top-0 z-40 bg-emerald-900 text-white border-b border-emerald-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2 box-border">
          {/* Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-base sm:text-lg text-white select-none shadow-sm shrink-0">
              NK
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-none truncate">
                {t("brandName")}
              </h1>
              <p className="text-[9px] sm:text-[10px] text-emerald-300 font-medium uppercase tracking-widest leading-none mt-1 truncate">
                {t("brandTagline")}
              </p>
            </div>
          </div>

          {/* Right Controls: Favorites shortcut (desktop) + Language Switcher + Notifications (Workers) + Round Avatar Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {favorites.length > 0 && (
              <button
                type="button"
                id="header-favorites-badge"
                onClick={() => {
                  setActiveTab("customer");
                  setShowFavoritesOnly(true);
                }}
                title={`${favorites.length} favorite workers saved. Click to view.`}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-850 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                <span>{t("favorites")}</span>
                <span className="bg-rose-900/60 text-rose-200 px-1.5 py-0.2 rounded-full font-mono text-[10px]">
                  {favorites.length}
                </span>
              </button>
            )}

            {/* Header Language Switcher Component */}
            <LanguageSwitcher />

            {/* Notifications Bell for Authenticated Workers */}
            {currentUser && userRole === "worker" && (
              <NotificationsBell
                workerUid={currentUser.uid}
                workerName={currentUser.displayName || "Worker"}
                onNavigateToWorkerProfile={() => {
                  setActiveTab("worker");
                  setWorkerSubView("dashboard");
                }}
              />
            )}

            {/* Small Round Avatar (first letter) with Profile / Role / Support / Logout Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                id="btn-header-avatar-menu"
                data-testid="header-avatar-menu-button"
                aria-expanded={showProfileMenu}
                aria-haspopup="menu"
                onClick={() => setShowProfileMenu((prev) => !prev)}
                title={currentUser?.email || currentUser?.phoneNumber || t("switchRoleMenu")}
                className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center border-2 border-emerald-300/80 shadow-xs transition cursor-pointer shrink-0 select-none"
              >
                {avatarInitial}
              </button>

              {showProfileMenu && (
                <div
                  id="header-profile-dropdown"
                  data-testid="header-profile-menu"
                  role="menu"
                  className="absolute right-0 mt-2 w-60 max-w-[calc(100vw-1.5rem)] bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* Name / Email Info */}
                  <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/70">
                    <p
                      data-testid="menu-user-identity"
                      className="text-xs font-extrabold text-slate-900 truncate"
                    >
                      {currentUser?.displayName ||
                        currentUser?.email ||
                        currentUser?.phoneNumber ||
                        (isDemoMode ? "+91 98765 43210" : t("customerRoleLabel"))}
                    </p>
                    {currentUser?.displayName && (currentUser?.email || currentUser?.phoneNumber) && (
                      <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                        {currentUser.email || currentUser.phoneNumber}
                      </p>
                    )}
                    {!currentUser && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {t("guestAccountLabel")}
                      </p>
                    )}
                  </div>

                  {/* Menu Item 1: Switch role */}
                  <button
                    type="button"
                    id="menu-item-switch-role"
                    data-testid="menu-switch-role"
                    role="menuitem"
                    onClick={() => handleSwitchRole(userRole === "worker" ? "customer" : "worker")}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between gap-2 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <ArrowLeftRight className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{t("switchRoleMenu")}</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                      {userRole === "worker" ? t("customerRoleLabel") : t("workerRoleLabel")}
                    </span>
                  </button>

                  {/* Menu Item 2: Help & Support */}
                  <button
                    type="button"
                    id="menu-item-help-support"
                    data-testid="menu-help-support"
                    role="menuitem"
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowHelpModal(true);
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2 transition cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{t("helpSupport")}</span>
                  </button>

                  {/* Optional Account Linking if Authenticated */}
                  {currentUser && (
                    <button
                      type="button"
                      id="btn-account-linking"
                      data-testid="account-linking-button"
                      role="menuitem"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowAccountLinking(true);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2 transition cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">Account Security</span>
                    </button>
                  )}

                  {/* Login shortcut if Guest */}
                  {!currentUser && (
                    <button
                      type="button"
                      id="btn-auth-signin"
                      data-testid="signin-button"
                      role="menuitem"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowAuthScreen(true);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 transition cursor-pointer border-t border-slate-100"
                    >
                      <LogIn className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{t("login")}</span>
                    </button>
                  )}

                  {/* Menu Item 3: Logout */}
                  <button
                    type="button"
                    id="btn-auth-logout"
                    data-testid="logout-button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer border-t border-slate-100"
                  >
                    <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="truncate">{t("logout")}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs: Shown ONLY for Workers (Customers only see Find Workers) */}
          {userRole === "worker" && (
            <div className="w-full flex items-center justify-between gap-2 pt-2 border-t border-emerald-800/70">
              <div className="w-full sm:w-auto bg-emerald-950 p-1 rounded-xl flex items-center border border-emerald-850/60 min-w-0">
                <button
                  id="tab-view-customer"
                  onClick={() => setActiveTab("customer")}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition cursor-pointer truncate ${
                    activeTab === "customer"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "text-emerald-200 hover:text-white"
                  }`}
                >
                  <span className="truncate">{t("findWorkers")}</span>
                </button>
                <button
                  id="tab-view-worker"
                  onClick={() => setActiveTab("worker")}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition cursor-pointer truncate ${
                    activeTab === "worker"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "text-emerald-200 hover:text-white"
                  }`}
                >
                  <span className="truncate">{t("workerProfile")}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Account Linking Modal for Authenticated Users */}
      {currentUser && (
        <AccountLinkingModal
          user={currentUser}
          isOpen={showAccountLinking}
          onClose={() => setShowAccountLinking(false)}
          onProfileUpdated={async () => {
            // Re-fetch user document to sync changes
            try {
              const snap = await getDoc(doc(db, "users", currentUser.uid));
              if (snap.exists() && snap.data()?.role) {
                setUserRole(snap.data().role as UserRole);
              }
            } catch (e) {
              console.warn("Could not reload user profile:", e);
            }
          }}
        />
      )}

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-2.5 sm:py-5 space-y-3 sm:space-y-5">
        
        {/* Tab 1: Customer View (Always shown for customers, or when worker selects Find Workers tab) */}
        {(userRole === "customer" || activeTab === "customer") && (
          <div className="space-y-2.5 sm:space-y-3.5">
            {/* Slim 1-Line Tagline Bar */}
            <div className="bg-emerald-950 text-emerald-100 rounded-xl px-3 sm:px-4 py-2 shadow-2xs flex items-center justify-between gap-2.5 border border-emerald-900">
              <p className="text-xs sm:text-sm font-bold text-white leading-snug min-w-0 flex-1">
                {t("heroSlimTagline")}
              </p>

              <div className="flex items-center gap-2 shrink-0">
                {isDevMode && (
                  <button
                    type="button"
                    id="btn-seed-data-hint"
                    onClick={handleSeedDatabase}
                    disabled={seeding}
                    className="bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 border border-emerald-500"
                  >
                    <Database className="w-3 h-3" />
                    <span>{seeding ? t("seeding") : "Dev Seed"}</span>
                  </button>
                )}

                <button
                  type="button"
                  id="btn-hero-help-support"
                  data-testid="hero-help-support-button"
                  onClick={() => setShowHelpModal(true)}
                  title={t("helpSupport")}
                  aria-label={t("helpSupport")}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-emerald-100 hover:text-white flex items-center justify-center transition border border-emerald-700/80 cursor-pointer shrink-0"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Filter controls */}
            <section>
              <SearchFilters
                searchText={searchText}
                setSearchText={setSearchText}
                selectedSkill={selectedSkill}
                setSelectedSkill={setSelectedSkill}
                maxDistance={maxDistance}
                setMaxDistance={setMaxDistance}
                onlyAvailable={onlyAvailable}
                setOnlyAvailable={setOnlyAvailable}
                selectedTownIdx={selectedTownIdx}
                setSelectedTownIdx={setSelectedTownIdx}
                customerLocation={activeCustomerLocation}
                setCustomerLocation={setCustomerLocation}
                showFavoritesOnly={showFavoritesOnly}
                setShowFavoritesOnly={setShowFavoritesOnly}
                favoritesCount={favorites.length}
              />
            </section>

            {/* Live Search results list */}
            <section className="space-y-2.5 sm:space-y-3.5">
              {/* Count + Compact 320px-safe Sort Segmented Control */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-0.5 w-full max-w-full box-border">
                <h3
                  data-testid="workers-near-you-count"
                  className="font-bold text-zinc-900 text-xs sm:text-sm flex items-center gap-1.5 shrink-0"
                >
                  {showFavoritesOnly && (
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" />
                  )}
                  <span>
                    {filteredWorkers.length}{" "}
                    {filteredWorkers.length === 1
                      ? t("workerNearYouSingular")
                      : t("workersNearYouPlural")}
                  </span>
                </h3>

                {/* Sort Segmented Control: Nearest (default), Lowest rate, Best rated */}
                <div
                  role="group"
                  aria-label={t("sortByLabel")}
                  data-testid="sort-segmented-control"
                  className="inline-flex items-center bg-slate-200/75 p-0.5 rounded-xl border border-slate-200/90 max-w-full overflow-x-auto"
                >
                  {(
                    [
                      { id: "nearest", label: t("sortNearest") },
                      { id: "lowest_rate", label: t("sortLowestRate") },
                      { id: "best_rated", label: t("sortBestRated") },
                    ] as const
                  ).map((opt) => {
                    const isActive = sortBy === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        id={`sort-btn-${opt.id}`}
                        data-testid={`sort-option-${opt.id}`}
                        onClick={() => setSortBy(opt.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                          isActive
                            ? "bg-white text-emerald-900 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {loadingWorkers ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-zinc-150">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="text-zinc-500 text-xs font-mono mt-3">Fetching nearby listings...</p>
                </div>
              ) : filteredWorkers.length === 0 ? (
                <div
                  data-testid="empty-results-card"
                  className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-2xl border border-slate-200 text-center max-w-md mx-auto shadow-2xs"
                >
                  <div className="p-3.5 bg-emerald-50 rounded-full text-emerald-600 mb-3 border border-emerald-100">
                    <MapPin className="w-6 h-6" />
                  </div>

                  <h4
                    data-testid="empty-results-heading"
                    className="font-bold text-slate-900 text-sm sm:text-base"
                  >
                    {maxDistance >= 500
                      ? t("noWorkersAllIndia")
                      : t("noWorkersWithinKm").replace("{km}", String(maxDistance))}
                  </h4>

                  <div className="flex flex-col items-stretch justify-center gap-2.5 mt-4 w-full max-w-xs">
                    {/* Primary button: Show workers within <next larger radius> km */}
                    {maxDistance < 500 && (
                      <button
                        type="button"
                        id="btn-empty-expand-radius"
                        data-testid="empty-expand-radius-button"
                        onClick={() => setMaxDistance(nextLargerRadius)}
                        className="w-full min-h-[44px] text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                      >
                        {nextLargerRadius >= 500
                          ? t("showWorkersAllIndia")
                          : t("showWorkersWithinKm").replace("{km}", String(nextLargerRadius))}
                      </button>
                    )}

                    {/* If "Available today" toggle is on, offer to show all workers including busy ones */}
                    {onlyAvailable && (
                      <button
                        type="button"
                        id="btn-empty-show-busy"
                        data-testid="empty-show-busy-button"
                        onClick={() => setOnlyAvailable(false)}
                        className="w-full min-h-[44px] text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2.5 rounded-xl transition cursor-pointer"
                      >
                        {t("showAllIncludingBusy")}
                      </button>
                    )}

                    {/* Secondary button: Clear filters */}
                    <button
                      type="button"
                      id="btn-empty-clear-filters"
                      data-testid="empty-clear-filters-button"
                      onClick={() => {
                        setSelectedSkill(null);
                        setSearchText("");
                        setMaxDistance(30);
                        setOnlyAvailable(false);
                        setShowFavoritesOnly(false);
                      }}
                      className="w-full min-h-[44px] text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2.5 rounded-xl transition cursor-pointer"
                    >
                      {t("clearFiltersBtn")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 items-start">
                  {filteredWorkers.map((worker) => (
                    <WorkerCard
                      key={worker.uid}
                      worker={worker}
                      customerTownName={activeCustomerLocation.name}
                      customerLat={activeCustomerLocation.latitude}
                      customerLon={activeCustomerLocation.longitude}
                      distance={worker.computedDistance}
                      isFavorite={favorites.includes(worker.uid)}
                      onToggleFavorite={handleToggleFavorite}
                      onRatingUpdate={handleWorkerRatingUpdate}
                      currentUserUid={activeWorkerUid || currentUser?.uid || null}
                      onEditMyProfile={() => {
                        handleSwitchRole("worker");
                        setActiveTab("worker");
                        setWorkerSubView("edit");
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Tab 2: Worker Profile Workspace (Shown only when userRole === "worker" and activeTab === "worker") */}
        {userRole === "worker" && activeTab === "worker" && (
          <div className="w-full max-w-full box-border space-y-3 sm:space-y-4 overflow-x-clip">
            {currentUser ? (
              <div className="w-full max-w-full box-border space-y-3 sm:space-y-4">
                
                {/* Responsive Worker Welcome Bar */}
                <div className="bg-emerald-950 text-white rounded-2xl px-3 sm:px-4 py-2.5 border border-emerald-800 shadow-xs w-full max-w-full box-border overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 w-full max-w-full box-border">
                    {/* Row 1 on mobile: Avatar + Name + Help (?) button */}
                    <div className="flex items-center justify-between gap-2 min-w-0 flex-1 w-full sm:w-auto">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {!welcomeAvatarBroken ? (
                          <img 
                            src={currentUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                            alt="" 
                            onError={() => setWelcomeAvatarBroken(true)}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-emerald-400 shrink-0 object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-emerald-400/60 bg-emerald-900 flex items-center justify-center shrink-0">
                            <UserIcon className="w-4 h-4 text-emerald-200" />
                          </div>
                        )}
                        <h3 className="font-bold text-white text-xs sm:text-sm truncate min-w-0 flex-1">
                          <span className="hidden sm:inline">{t("welcomeLabel")}, </span>
                          {currentUser.displayName || t("workerProfile")}
                          <span className="hidden sm:inline">!</span>
                        </h3>
                      </div>

                      <button
                        type="button"
                        id="btn-worker-help-mobile"
                        data-testid="worker-help-mobile-button"
                        onClick={() => setShowHelpModal(true)}
                        title={t("helpSupport")}
                        aria-label={t("helpSupport")}
                        className="sm:hidden w-9 h-9 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-emerald-100 hover:text-white flex items-center justify-center transition border border-emerald-700/70 shrink-0 cursor-pointer"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Row 2 on mobile / Right actions on tablet & desktop */}
                    <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0 max-w-full box-border">
                      <button
                        type="button"
                        id="btn-worker-help-desktop"
                        data-testid="worker-help-desktop-button"
                        onClick={() => setShowHelpModal(true)}
                        title={t("helpSupport")}
                        aria-label={t("helpSupport")}
                        className="hidden sm:flex w-8 h-8 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-emerald-100 hover:text-white items-center justify-center transition border border-emerald-700/70 shrink-0 cursor-pointer"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setActiveTab("customer")}
                        className="flex-1 sm:flex-initial min-w-0 min-h-[38px] sm:min-h-0 px-2.5 sm:px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-700 active:scale-95 text-[11px] sm:text-xs text-white font-bold rounded-lg transition cursor-pointer border border-emerald-600/50 text-center truncate"
                      >
                        {t("browseDirectoryBtn")}
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex-1 sm:flex-initial min-w-0 min-h-[38px] sm:min-h-0 flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 sm:px-3 py-1.5 text-slate-200 hover:text-white text-[11px] sm:text-xs font-bold rounded-lg transition cursor-pointer border border-slate-700 truncate"
                        title={t("signOutBtn")}
                        aria-label={t("signOutBtn")}
                      >
                        <LogOut className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{t("signOutBtn")}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-navigation tabs: Performance Dashboard vs Edit Profile */}
                <div className="w-full max-w-full box-border overflow-hidden flex items-stretch gap-1 sm:gap-2 p-1.5 bg-white rounded-2xl sm:w-auto sm:max-w-fit border border-slate-200 shadow-2xs">
                  <button
                    id="btn-worker-dashboard-view"
                    onClick={() => setWorkerSubView("dashboard")}
                    className={`flex-1 min-w-0 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 min-h-[44px] rounded-xl text-[11px] sm:text-xs font-bold leading-tight text-center transition cursor-pointer ${
                      workerSubView === "dashboard"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                    <span className="sm:hidden break-words">{t("dashboardShortTab")}</span>
                    <span className="hidden sm:inline">{t("perfDashboardTab")}</span>
                  </button>
                  <button
                    id="btn-worker-edit-view"
                    onClick={() => setWorkerSubView("edit")}
                    className={`flex-1 min-w-0 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 min-h-[44px] rounded-xl text-[11px] sm:text-xs font-bold leading-tight text-center transition cursor-pointer ${
                      workerSubView === "edit"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <UserCog className="w-3.5 h-3.5 shrink-0" />
                    <span className="sm:hidden break-words">{t("editProfileShortTab")}</span>
                    <span className="hidden sm:inline">{t("editProfileRatesTab")}</span>
                  </button>
                </div>

                {/* Sub-view Content: Worker Dashboard or Profile Editor */}
                {workerSubView === "dashboard" ? (
                  <WorkerDashboard 
                    uid={activeWorkerUid!} 
                    workerName={currentUser.displayName || undefined}
                    onNavigateToEditor={() => setWorkerSubView("edit")}
                  />
                ) : (
                  <ProfileEditor 
                    uid={activeWorkerUid!} 
                    onSaveSuccess={() => {
                      // Handled by snapshot listeners
                    }} 
                  />
                )}
              </div>
            ) : (
              <div className="w-full max-w-md mx-auto box-border bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-sm text-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                  <UserCheck className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg">Artisan Profile Authorization</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  To publish your photo, skills list, daily work rate (₹), and manage your real-time availability toggle, please sign in with Google, your phone number, or email.
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  {/* Unified Sign In Button */}
                  <button
                    id="btn-login-phone-artisan"
                    data-testid="login-phone-artisan-button"
                    onClick={() => setShowAuthScreen(true)}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-3.5 px-4 rounded-xl text-sm font-bold shadow-xs transition cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In (Google / Phone / Email)</span>
                  </button>

                  {isDevMode && (
                    <>
                      <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase">Or Test Instantly</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                      </div>

                      {/* Sandbox Demo mode */}
                      <button
                        id="btn-login-demo"
                        onClick={() => {
                          handleLoginSuccess({
                            uid: "demo-worker-phone-01",
                            phoneNumber: "+919876543210",
                            displayName: "Basavaraj M. (Artisan)",
                            photoURL: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=150"
                          } as any, false);
                        }}
                        className="w-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 py-3 px-4 rounded-xl text-sm font-bold border border-slate-200 transition cursor-pointer"
                      >
                        <span>Instant Artisan Demo Access</span>
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-5 p-3 bg-emerald-50/60 rounded-xl text-[11px] text-emerald-800 flex gap-2 items-start text-left leading-normal border border-emerald-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Secure Access:</strong> Sign in with Google one-tap, Indian mobile OTP (+91), or email & password. Zero commission on daily wages.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modern Startup Footer */}
      <footer className="bg-white border-t border-zinc-150 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
          <div className="text-center sm:text-left">
            <p className="font-bold text-zinc-700">Namma Kelasa • Independent Marketplace © 2026</p>
            <p className="text-[10px] text-zinc-400 mt-1">Namma Kelasa is an independent platform connecting skilled workers with customers across India. Direct hire, fair wages, zero commission.</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span>Built independently for local workers and customers</span>
            <button
              type="button"
              id="btn-footer-help-support"
              data-testid="footer-help-support-button"
              onClick={() => setShowHelpModal(true)}
              className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 underline underline-offset-2 transition cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{t("helpSupport")}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* In-App Help & Support Bottom Sheet / Modal */}
      <HelpSupportModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
}
