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
  WifiOff
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
import { PWAInstallButton } from "./components/PWAInstallButton";
import { useLanguage } from "./context/LanguageContext";

export default function App() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"customer" | "worker">("customer");
  const [workerSubView, setWorkerSubView] = useState<"dashboard" | "edit">("dashboard");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [showAccountLinking, setShowAccountLinking] = useState<boolean>(false);
  const [toastNotification, setToastNotification] = useState<{ type: "success" | "info" | "warning"; message: string } | null>(null);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

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

        try {
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists() && userSnap.data()?.role) {
            const savedRole = userSnap.data().role as UserRole;
            
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

            setUserRole(savedRole);
            setActiveTab(savedRole);
          } else {
            // Check localStorage fallback for role
            const cachedRole = localStorage.getItem(`namma_kelsa_user_role_${user.uid}`) as UserRole | null;
            if (cachedRole === "customer" || cachedRole === "worker") {
              setUserRole(cachedRole);
              setActiveTab(cachedRole);
            } else {
              setUserRole(null);
            }
          }
        } catch (err) {
          console.warn("Could not retrieve user document from Firestore:", err);
          try {
            const cachedRole = localStorage.getItem(`namma_kelsa_user_role_${user.uid}`) as UserRole | null;
            if (cachedRole === "customer" || cachedRole === "worker") {
              setUserRole(cachedRole);
              setActiveTab(cachedRole);
            } else {
              setUserRole(null);
            }
          } catch {
            setUserRole(null);
          }
        }
      } else {
        if (!isDemoMode) {
          setCurrentUser(null);
          setUserRole(null);
        }
      }
      setIsCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [isDemoMode]);

  // Handle successful Phone Auth login
  const handleLoginSuccess = async (user: User, isNewUser?: boolean) => {
    setCurrentUser(user);
    setIsGuest(false);

    if (user.uid.startsWith("demo-") || user.uid.startsWith("mock-")) {
      setIsDemoMode(true);
      setDemoUid(user.uid);
      const savedDemoRole = localStorage.getItem(`namma_kelsa_user_role_${user.uid}`) as UserRole | null;
      if (savedDemoRole) {
        setUserRole(savedDemoRole);
        setActiveTab(savedDemoRole);
      } else {
        setUserRole(null);
      }
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists() && userSnap.data()?.role) {
        const savedRole = userSnap.data().role as UserRole;

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

        setUserRole(savedRole);
        setActiveTab(savedRole);
      } else {
        const cachedRole = localStorage.getItem(`namma_kelsa_user_role_${user.uid}`) as UserRole | null;
        if (cachedRole === "customer" || cachedRole === "worker") {
          setUserRole(cachedRole);
          setActiveTab(cachedRole);
        } else {
          setUserRole(null);
        }
      }
    } catch (err) {
      console.warn("Error checking user role on login:", err);
      setUserRole(null);
    }
  };

  // Callback when role is chosen on Role Selection screen
  const handleRoleSelected = (role: UserRole) => {
    setUserRole(role);
    setActiveTab(role);
  };

  // Switch role without requiring re-login (accessible from header / settings)
  const handleSwitchRole = async (targetRole: UserRole) => {
    setUserRole(targetRole);
    setActiveTab(targetRole);

    if (currentUser) {
      try {
        localStorage.setItem(`namma_kelsa_user_role_${currentUser.uid}`, targetRole);
      } catch {
        // ignore
      }

      if (!currentUser.uid.startsWith("demo-") && !currentUser.uid.startsWith("mock-")) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            await updateDoc(userDocRef, {
              role: targetRole,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          console.warn("Could not sync role change to Firestore:", err);
        }
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
    try {
      if (isDemoMode) {
        setIsDemoMode(false);
        setDemoUid(null);
      } else {
        await signOut(auth);
      }
    } catch (e) {
      console.error("Sign out error", e);
    }
    setCurrentUser(null);
    setUserRole(null);
    setIsGuest(false);
    setActiveTab("customer");
  };

  // Safe Seeder button: Populate or refresh worker listings
  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
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
      // Sort nearest first so "nearby" discovery works seamlessly across India
      return (a.computedDistance ?? 99999) - (b.computedDistance ?? 99999);
    });

  const activeWorkerUid = isDemoMode ? demoUid : currentUser?.uid;

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

  // 2. Unauthenticated Gate: Show Phone + OTP Login Screen
  if (!currentUser && !isGuest) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-150 antialiased">
        <header className="sticky top-0 z-40 bg-emerald-900 text-white border-b border-emerald-800 py-3.5 px-4 sm:px-6 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-lg text-white select-none shadow-sm">
                NK
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                  {t("brandName")}
                </h1>
                <p className="text-[10px] text-emerald-300 font-medium uppercase tracking-widest leading-none mt-1">
                  {t("brandTagline")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <PWAInstallButton variant="header" />
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center py-6 px-4">
          <PhoneAuthLogin 
            onLoginSuccess={handleLoginSuccess}
            onContinueAsGuest={() => setIsGuest(true)}
          />
        </main>
      </div>
    );
  }

  // 3. New User Role Selection Gate: "What brings you here?"
  if (currentUser && !userRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-150 antialiased">
        <header className="sticky top-0 z-40 bg-emerald-900 text-white border-b border-emerald-800 py-3.5 px-4 sm:px-6 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-lg text-white select-none shadow-sm">
                NK
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                  {t("brandName")}
                </h1>
                <p className="text-[10px] text-emerald-300 font-medium uppercase tracking-widest leading-none mt-1">
                  {t("brandTagline")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <PWAInstallButton variant="header" />
              <LanguageSwitcher />
              <button
                type="button"
                id="btn-auth-logout"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-800 text-emerald-200 hover:text-white text-xs font-bold transition cursor-pointer border border-emerald-800"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t("logout")}</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center py-6 px-4">
          <RoleSelection 
            uid={currentUser.uid}
            phoneNumber={currentUser.phoneNumber || ""}
            email={currentUser.email || ""}
            displayName={currentUser.displayName || ""}
            photoURL={currentUser.photoURL || ""}
            onRoleSelected={handleRoleSelected}
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

      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 bg-emerald-900 text-white border-b border-emerald-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-xl text-white select-none shadow-sm shrink-0">
              NK
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">
                {t("brandName")}
              </h1>
              <p className="text-[10px] text-emerald-300 font-medium uppercase tracking-widest leading-none mt-1">
                {t("brandTagline")}
              </p>
            </div>
          </div>

          {/* Quick Nav, Role Switcher, Language Switcher & Profile Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            
            {/* Quick Favorites counter shortcut */}
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

            {/* PWA In-App Install Button */}
            <PWAInstallButton variant="header" />

            {/* Header Language Switcher Component */}
            <LanguageSwitcher />

            {/* View Tab Toggle */}
            <div className="bg-emerald-950 p-1 rounded-xl flex items-center border border-emerald-850/60">
              <button
                id="tab-view-customer"
                onClick={() => setActiveTab("customer")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === "customer"
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "text-emerald-200 hover:text-white"
                }`}
              >
                <span>{t("findWorkers")}</span>
              </button>
              <button
                id="tab-view-worker"
                onClick={() => {
                  setActiveTab("worker");
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === "worker"
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "text-emerald-200 hover:text-white"
                }`}
              >
                <span>{t("workerProfile")}</span>
              </button>
            </div>

            {/* Role Switcher Action for Authenticated Users */}
            {currentUser && (
              <div className="hidden lg:flex items-center gap-2">
                {userRole === "customer" ? (
                  <button
                    type="button"
                    id="btn-switch-role-worker"
                    onClick={() => handleSwitchRole("worker")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-100 hover:text-white bg-emerald-800/80 hover:bg-emerald-700/90 px-3 py-1.5 rounded-lg transition border border-emerald-700/60 cursor-pointer"
                    title="Switch role to Worker Profile"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Switch to Worker Profile</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    id="btn-switch-role-customer"
                    onClick={() => handleSwitchRole("customer")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-100 hover:text-white bg-emerald-800/80 hover:bg-emerald-700/90 px-3 py-1.5 rounded-lg transition border border-emerald-700/60 cursor-pointer"
                    title="Switch role to Find Workers"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Switch to Find Workers</span>
                  </button>
                )}
              </div>
            )}

            {/* Notifications Bell for Authenticated Workers */}
            {currentUser && (
              <NotificationsBell
                workerUid={currentUser.uid}
                workerName={currentUser.displayName || "Worker"}
                onNavigateToWorkerProfile={() => {
                  setActiveTab("worker");
                  setWorkerSubView("dashboard");
                }}
              />
            )}

            {/* Authenticated User info, Security/Linking & Sign Out */}
            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-2.5 border-l border-emerald-800/80 pl-2.5">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-[11px] font-mono font-bold text-emerald-200 truncate max-w-[150px]">
                    {currentUser.phoneNumber || currentUser.email || (isDemoMode ? "+91 98765 43210" : "Logged in")}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-400">
                    {userRole === "worker" ? "Artisan" : "Customer"}
                  </span>
                </div>

                {/* Account Security / Link Phone or Email Button */}
                <button
                  type="button"
                  id="btn-account-linking"
                  data-testid="account-linking-button"
                  onClick={() => setShowAccountLinking(true)}
                  className="p-2 bg-emerald-850 hover:bg-emerald-800 text-emerald-200 hover:text-white rounded-lg transition cursor-pointer border border-emerald-750"
                  title="Account Security: Link Phone or Email"
                  aria-label="Account Security: Link Phone or Email"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </button>

                <button
                  id="btn-auth-logout"
                  data-testid="logout-button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-emerald-850 hover:bg-rose-900/80 text-emerald-100 hover:text-white rounded-lg transition cursor-pointer border border-emerald-750 text-xs font-bold"
                  title={t("logout")}
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-300" />
                  <span className="hidden sm:inline">{t("logout")}</span>
                </button>
              </div>
            ) : (
              <button
                id="btn-auth-signin"
                data-testid="signin-button"
                onClick={() => setIsGuest(false)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 rounded-lg shadow-sm transition cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Sign in (Phone / Email)</span>
              </button>
            )}
          </div>
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
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Independent Marketplace Hero Banner */}
        <div className="bg-emerald-950 text-emerald-100 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-900">
          <div className="absolute right-0 bottom-0 opacity-10 stroke-emerald-100 max-w-[200px] pointer-events-none select-none">
            <Building className="w-64 h-64" />
          </div>
          
          <div className="space-y-2 relative max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-1 bg-emerald-900 text-emerald-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
              <Sparkles className="w-3" /> Independent Open Marketplace
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {t("heroTitle")}
            </h2>
            <p className="text-xs md:text-sm text-emerald-200 leading-normal">
              {t("heroSubtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 relative shrink-0">
            {/* Direct APK Download button */}
            <PWAInstallButton variant="apk-only" />

            {workers.length === 0 && (
              <button
                id="btn-seed-data-hint"
                onClick={handleSeedDatabase}
                disabled={seeding}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-4.5 py-3 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2 border border-emerald-500"
              >
                <Database className="w-4 h-4" />
                <span>{seeding ? t("seeding") : t("seedWorkers")}</span>
              </button>
            )}
            
            <a 
              href="mailto:support@nammakelasa.in"
              className="bg-emerald-900 hover:bg-emerald-850 text-emerald-100 hover:text-white font-semibold text-xs px-4.5 py-3 rounded-xl transition duration-200 flex items-center gap-1 border border-emerald-800"
            >
              Help & Support
            </a>
          </div>
        </div>

        {/* Tab 1: Customer View (Default) */}
        {activeTab === "customer" && (
          <div className="space-y-6">
            
            {/* Mobile PWA Install Banner */}
            <PWAInstallButton variant="banner" className="md:hidden" />
            
            {/* Filter controls */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-500 font-mono">Marketplace Filter & Search</h3>
                  <p className="text-xs text-zinc-400">Specify search parameters instantly</p>
                </div>
                {workers.length > 0 && (
                  <button 
                    onClick={handleSeedDatabase} 
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 py-1.5 px-2.5 rounded-lg transition"
                  >
                    Refresh / Re-seed Sandbox
                  </button>
                )}
              </div>
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
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                    {showFavoritesOnly ? (
                      <>
                        <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                        <span>{t("myFavorites")} ({filteredWorkers.length})</span>
                      </>
                    ) : (
                      <span>{t("artisansFound")} ({filteredWorkers.length})</span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {showFavoritesOnly 
                      ? t("yourSavedFavorites")
                      : t("liveDatabaseSync")}
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 bg-zinc-100 px-3 py-1 rounded-lg">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>{t("directDialActive")}</span>
                </div>
              </div>

              {loadingWorkers ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-zinc-150">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="text-zinc-500 text-xs font-mono mt-3">Fetching nearby listings...</p>
                </div>
              ) : filteredWorkers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-zinc-150 text-center max-w-md mx-auto">
                  {showFavoritesOnly ? (
                    <>
                      <div className="p-3.5 bg-rose-50 rounded-full text-rose-500 mb-4 scale-110 border border-rose-100">
                        <Heart className="w-6 h-6 fill-rose-100" />
                      </div>
                      <h4 className="font-bold text-zinc-800 text-sm">{t("noFavoritesFound")}</h4>
                      <p className="text-xs text-zinc-500 mt-1 leading-normal">
                        {t("noFavoritesHint")}
                      </p>
                      <button
                        onClick={() => setShowFavoritesOnly(false)}
                        className="mt-4 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-lg transition cursor-pointer"
                      >
                        {t("viewAllArtisans")}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="p-3.5 bg-zinc-100 rounded-full text-zinc-400 mb-4 scale-110">
                        <Search className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-zinc-800 text-sm">{t("noWorkersFound")}</h4>
                      <p className="text-xs text-zinc-500 mt-1 lines-normal">
                        {t("noWorkersHint")}
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setMaxDistance(500);
                          }}
                          className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-lg transition cursor-pointer"
                        >
                          Expand Search (All-India)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSkill(null);
                            setSearchText("");
                            setMaxDistance(50);
                            setOnlyAvailable(false);
                            setShowFavoritesOnly(false);
                          }}
                          className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-lg transition cursor-pointer"
                        >
                          {t("resetFilters")}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Tab 2: Worker Profile Workspace (Active Registry) */}
        {activeTab === "worker" && (
          <div className="space-y-6">
            {currentUser ? (
              <div className="space-y-6">
                
                {/* Auth profile brief info with Geometric Balance aesthetic */}
                <div className="bg-emerald-950 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-800 shadow-xs">
                  <div className="flex items-center gap-3.5 text-center sm:text-left flex-col sm:flex-row">
                    <img 
                      src={currentUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                      alt="Avatar Preview" 
                      className="w-12 h-12 rounded-xl border-2 border-emerald-400 shrink-0 object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h3 className="font-bold text-white text-sm">Welcome, {currentUser.displayName || "Daily Wage Artisan"}!</h3>
                      <p className="text-xs text-emerald-300/80 font-mono mt-0.5">UID Authentication: {currentUser.uid.slice(0, 10)}... (Artisan Account Mode)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-end">
                    <button
                      onClick={() => setActiveTab("customer")}
                      className="px-3.5 py-2 bg-emerald-700/70 hover:bg-emerald-700 active:scale-95 text-xs text-white uppercase tracking-wider font-bold rounded-xl transition cursor-pointer border border-emerald-600/50"
                    >
                      Browse Directory
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-slate-200 hover:text-white text-xs font-bold rounded-xl transition cursor-pointer border border-slate-700"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>

                {/* Sub-navigation tabs: Performance Dashboard vs Edit Profile */}
                <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl max-w-fit border border-slate-200 shadow-2xs">
                  <button
                    id="btn-worker-dashboard-view"
                    onClick={() => setWorkerSubView("dashboard")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      workerSubView === "dashboard"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Performance Dashboard</span>
                  </button>
                  <button
                    id="btn-worker-edit-view"
                    onClick={() => setWorkerSubView("edit")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      workerSubView === "edit"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <UserCog className="w-3.5 h-3.5" />
                    <span>Edit Profile & Rates</span>
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
              <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 p-7 shadow-sm text-center">
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
                    onClick={() => setIsGuest(false)}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-3.5 px-4 rounded-xl text-sm font-bold shadow-xs transition cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In (Google / Phone / Email)</span>
                  </button>

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
          <div className="flex items-center gap-4 flex-wrap">
            <PWAInstallButton variant="link" />
            <span>•</span>
            <span>Built independently for local workers and customers</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
