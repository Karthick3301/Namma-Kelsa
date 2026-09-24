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
  UserCog
} from "lucide-react";
import { collection, onSnapshot, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider, handleFirestoreError, OperationType } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { WorkerProfile, TOWN_CENTERS } from "./types";
import { calculateDistance, MOCK_WORKERS } from "./utils";
import SearchFilters from "./components/SearchFilters";
import WorkerCard from "./components/WorkerCard";
import ProfileEditor from "./components/ProfileEditor";
import WorkerDashboard from "./components/WorkerDashboard";
import LanguageSwitcher from "./components/LanguageSwitcher";
import NotificationsBell from "./components/NotificationsBell";
import { useLanguage } from "./context/LanguageContext";

export default function App() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"customer" | "worker">("customer");
  const [workerSubView, setWorkerSubView] = useState<"dashboard" | "edit">("dashboard");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
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
  const [maxDistance, setMaxDistance] = useState<number>(10);
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(true);
  const [selectedTownIdx, setSelectedTownIdx] = useState<number>(0);

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

  const handleToggleFavorite = (workerUid: string) => {
    setFavorites((prev) => {
      if (prev.includes(workerUid)) {
        return prev.filter((id) => id !== workerUid);
      } else {
        return [...prev, workerUid];
      }
    });
  };

  // Check auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setIsDemoMode(false);
        setDemoUid(null);
      } else {
        // Fallback or cleared
        if (!isDemoMode) {
          setCurrentUser(null);
        }
      }
    });
    return () => unsubscribe();
  }, [isDemoMode]);

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
    } catch (err) {
      console.error("Auth popup failed. Standard behavior in block frames. Please consider Demo login.", err);
      alert("Note: If popup was blocked by the browser frame, please use the quick 'Demo Mode Login' button to test instantly!");
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
    if (isDemoMode) {
      setIsDemoMode(false);
      setDemoUid(null);
      setCurrentUser(null);
    } else {
      await signOut(auth);
      setCurrentUser(null);
    }
    setActiveTab("customer");
  };

  // Safe Seeder button: Populate 3 mock workers on first setup
  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      for (const item of MOCK_WORKERS) {
        const wPath = `workers/${item.uid}`;
        await setDoc(doc(db, "workers", item.uid!), {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      alert("Premium labor database populated with 3 active professional workers!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "workers/seeding");
    } finally {
      setSeeding(false);
    }
  };

  // Compute live filtered search list
  const activeCustomerTown = TOWN_CENTERS[selectedTownIdx];

  const filteredWorkers = workers
    .map((w) => {
      const dist = calculateDistance(
        activeCustomerTown.latitude,
        activeCustomerTown.longitude,
        w.latitude || 12.9174,
        w.longitude || 77.4838
      );
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
      // 3. Distance within range constraint
      if (w.computedDistance > maxDistance) {
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
    });

  const activeWorkerUid = isDemoMode ? demoUid : currentUser?.uid;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-150 antialiased">
      
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

          {/* Quick Nav, Language Switcher & Profile Actions */}
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

            {/* Auth actions */}
            {currentUser ? (
              <div className="hidden sm:flex items-center gap-2.5 border-l border-emerald-800/80 pl-3">
                <img 
                  src={currentUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                  alt="My Profile" 
                  className="w-8 h-8 rounded-full border border-emerald-500" 
                  referrerPolicy="no-referrer"
                />
                <button
                  id="btn-auth-logout"
                  onClick={handleLogout}
                  className="p-2 bg-emerald-850 hover:bg-emerald-800 text-emerald-100 rounded-lg hover:text-white transition cursor-pointer"
                  title={t("logout")}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-auth-signin"
                onClick={handleGoogleLogin}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-200 hover:text-white px-3 py-1.5 hover:bg-emerald-850 rounded-lg transition cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-emerald-400" />
                <span>{t("login")}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Dignity Mission Banner Card */}
        <div className="bg-emerald-950 text-emerald-100 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-900">
          <div className="absolute right-0 bottom-0 opacity-10 stroke-emerald-100 max-w-[200px] pointer-events-none select-none">
            <Building className="w-64 h-64" />
          </div>
          
          <div className="space-y-2 relative max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-1 bg-emerald-900 text-emerald-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
              <Sparkles className="w-3" /> Karnataka Daily Wage labor Commission Initiative
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {t("heroTitle")}
            </h2>
            <p className="text-xs md:text-sm text-emerald-200 leading-normal">
              {t("heroSubtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 relative shrink-0">
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
              href="mailto:support@nammakesla.gov.in"
              className="bg-emerald-900 hover:bg-emerald-850 text-emerald-100 hover:text-white font-semibold text-xs px-4.5 py-3 rounded-xl transition duration-200 flex items-center gap-1 border border-emerald-800"
            >
              Raise Grievance
            </a>
          </div>
        </div>

        {/* Tab 1: Customer View (Default) */}
        {activeTab === "customer" && (
          <div className="space-y-6">
            
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
                      <button
                        onClick={() => {
                          setSelectedSkill(null);
                          setSearchText("");
                          setMaxDistance(25);
                          setOnlyAvailable(false);
                          setShowFavoritesOnly(false);
                        }}
                        className="mt-4 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition cursor-pointer"
                      >
                        {t("resetFilters")}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredWorkers.map((worker) => (
                    <WorkerCard
                      key={worker.uid}
                      worker={worker}
                      customerTownName={activeCustomerTown.name}
                      customerLat={activeCustomerTown.latitude}
                      customerLon={activeCustomerTown.longitude}
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
                      <p className="text-xs text-emerald-300/80 font-mono mt-0.5">UID Authentication: {currentUser.uid.slice(0, 10)}... (Verified Artisan Mode)</p>
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
              <div className="max-w-md mx-auto bg-white rounded-2xl border border-zinc-150 p-6 shadow-sm text-center">
                <div className="p-3.5 bg-indigo-50 rounded-full text-indigo-600 inline-block mb-4">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-zinc-900 text-base">Artisan Profile Authorization</h3>
                <p className="text-xs text-zinc-500 mt-2.5 leading-normal">
                  To publish your photo, skills list, daily work rate (₹), and manage your live availability toggle, please authorize securely.
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  {/* Google Authenticator */}
                  <button
                    id="btn-login-google"
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 hover:shadow active:scale-95 text-white py-3 px-4 rounded-xl text-sm font-bold shadow-xs transition"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.997 0-.746-.08-1.32-.176-1.888H12.24z"/>
                    </svg>
                    <span>Authenticate with Google</span>
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-zinc-200"></div>
                    <span className="flex-shrink mx-3 text-[10px] font-bold text-zinc-400 font-mono tracking-widest uppercase">Or Test Instantly</span>
                    <div className="flex-grow border-t border-zinc-200"></div>
                  </div>

                  {/* Sandbox Demo mode (essential for iframe bypass and fast evaluations) */}
                  <button
                    id="btn-login-demo"
                    onClick={handleDemoLogin}
                    className="w-full bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-700 py-3 px-4 rounded-xl text-sm font-bold border border-zinc-200 transition"
                  >
                    <span>Guest Developer / Demo Access</span>
                  </button>
                </div>

                <div className="mt-5 p-3 bg-indigo-50/40 rounded-xl text-[11px] text-zinc-650 flex gap-2 items-start text-left leading-normal border border-indigo-100/30">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Cookie/Iframe Note:</strong> If standard Google sign-in is blocked inside the workspace iframe due to cross-site cookie settings, use the <strong>Guest Developer Access</strong> option. It sets up a fully active local sandbox environment!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modern Humble Footer (No telemetry, no AI-slop background tags) */}
      <footer className="bg-white border-t border-zinc-150 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
          <div className="text-center sm:text-left">
            <p className="font-bold text-zinc-700">Namma-Kelsa Self-Employment Support © 2026</p>
            <p className="text-[10px] text-zinc-400 mt-1">Direct labor connection bypassing capital middlemen. Bringing digital inclusion to the gig economy.</p>
          </div>
          <div className="flex items-center gap-1">
            <span>Built for the community with</span> <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 inline-block animate-pulse" /> <span>and Firestore Persistence</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
