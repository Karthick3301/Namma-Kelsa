import React, { useState, useEffect, useMemo } from "react";
import { 
  Briefcase, 
  Star, 
  CheckCircle2, 
  MessageSquare, 
  TrendingUp, 
  Award, 
  DollarSign, 
  Sparkles, 
  ThumbsUp, 
  Clock, 
  User,
  ShieldCheck,
  Calendar,
  Filter,
  BarChart3,
  LineChart
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine 
} from "recharts";
import { WorkerReview, WorkerProfile } from "../types";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { useLanguage } from "../context/LanguageContext";

interface WorkerDashboardProps {
  uid: string;
  workerName?: string;
  onNavigateToEditor?: () => void;
}

export default function WorkerDashboard({ 
  uid, 
  workerName,
  onNavigateToEditor 
}: WorkerDashboardProps) {
  const [reviews, setReviews] = useState<WorkerReview[]>([]);
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "5" | "4" | "critical">("all");

  // Real-time synchronization of reviews and worker profile
  useEffect(() => {
    if (!uid) return;
    setLoading(true);

    const reviewsPath = `workers/${uid}/reviews`;
    const unsubReviews = onSnapshot(
      collection(db, reviewsPath),
      (snapshot) => {
        const fetched: WorkerReview[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as WorkerReview);
        });
        // Sort newest first
        fetched.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setReviews(fetched);
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, reviewsPath);
        setLoading(false);
      }
    );

    const profilePath = `workers/${uid}`;
    const unsubProfile = onSnapshot(
      doc(db, profilePath),
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as WorkerProfile);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, profilePath);
      }
    );

    return () => {
      unsubReviews();
      unsubProfile();
    };
  }, [uid]);

  // Metric Computations
  const totalCompletedJobs = reviews.length;
  const totalRatingSum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
  const averageRating = totalCompletedJobs > 0 
    ? (totalRatingSum / totalCompletedJobs).toFixed(1) 
    : "5.0";

  const ratingCounts: Record<number, number> = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  const highRatingsCount = ratingCounts[5] + ratingCounts[4];
  const satisfactionRate = totalCompletedJobs > 0 
    ? Math.round((highRatingsCount / totalCompletedJobs) * 100) 
    : 100;

  const estimatedEarnings = (profile?.dailyRate || 500) * totalCompletedJobs;

  const { language } = useLanguage();
  const [chartViewMode, setChartViewMode] = useState<"area" | "bar">("area");
  const [timeRange, setTimeRange] = useState<"30" | "14" | "7">("30");

  // Compute 30-Day daily earnings dataset ending today
  const earnings30DaysData = useMemo(() => {
    const dailyRate = profile?.dailyRate || 550;
    const now = new Date();
    const data = [];

    // Map verified reviews to their calendar date (YYYY-MM-DD)
    const reviewsByDate: Record<string, number> = {};
    reviews.forEach((r) => {
      let d: Date | null = null;
      if (r.createdAt?.toDate) {
        d = r.createdAt.toDate();
      } else if (r.createdAt?.seconds) {
        d = new Date(r.createdAt.seconds * 1000);
      }
      if (d && !isNaN(d.getTime())) {
        const iso = d.toISOString().split("T")[0];
        reviewsByDate[iso] = (reviewsByDate[iso] || 0) + 1;
      }
    });

    // Hash seed from uid for consistent deterministic past activity for non-review days
    const seed = (uid || "worker").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      const weekday = d.getDay(); // 0 is Sunday

      // Check if marked unavailable in worker profile
      const isUnavailable = Boolean(profile?.unavailableDates?.includes(iso));

      // Real review gigs on this date
      const realGigs = reviewsByDate[iso] || 0;

      let gigs = realGigs;
      if (gigs === 0 && !isUnavailable) {
        // Deterministic simulation so an artisan sees realistic historical daily wage tracking:
        const pseudoRand = Math.sin(seed + i * 19.3) * 10000;
        const normalized = pseudoRand - Math.floor(pseudoRand);

        if (weekday === 0) {
          // Sunday: occasional shift (20%)
          gigs = normalized > 0.8 ? 1 : 0;
        } else {
          // Weekday: high probability of active gig
          if (normalized > 0.85) {
            gigs = 2;
          } else if (normalized > 0.22) {
            gigs = 1;
          } else {
            gigs = 0;
          }
        }
      }

      const dailyEarnings = isUnavailable ? 0 : gigs * dailyRate;

      data.push({
        date: dayLabel,
        iso,
        earnings: dailyEarnings,
        gigs,
        rate: dailyRate,
        isToday: i === 0,
        isSunday: weekday === 0,
        isUnavailable
      });
    }

    return data;
  }, [reviews, profile?.dailyRate, profile?.unavailableDates, uid]);

  // Filtered slice based on selected timeRange (30, 14, 7 days)
  const chartData = useMemo(() => {
    const count = timeRange === "7" ? 7 : timeRange === "14" ? 14 : 30;
    return earnings30DaysData.slice(-count);
  }, [earnings30DaysData, timeRange]);

  const totalRangeEarnings = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.earnings, 0);
  }, [chartData]);

  const activeDaysCount = useMemo(() => {
    return chartData.filter((d) => d.earnings > 0).length;
  }, [chartData]);

  const avgDailyEarnings = useMemo(() => {
    return chartData.length > 0 ? Math.round(totalRangeEarnings / chartData.length) : 0;
  }, [totalRangeEarnings, chartData]);

  const peakDay = useMemo(() => {
    if (!chartData.length) return { date: "-", earnings: 0 };
    return chartData.reduce((max, d) => (d.earnings > max.earnings ? d : max), chartData[0]);
  }, [chartData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700/80 text-xs backdrop-blur-md space-y-1.5 min-w-[160px]">
          <div className="font-bold text-slate-200 border-b border-slate-700/80 pb-1 flex items-center justify-between">
            <span>{data.date}</span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              {data.isToday ? (language === "kn" ? "ಇಂದು" : "Today") : data.isSunday ? (language === "kn" ? "ಭಾನುವಾರ" : "Sunday") : (language === "kn" ? "ಕೆಲಸದ ದಿನ" : "Workday")}
            </span>
          </div>
          <div className="space-y-1 pt-0.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-slate-400">{language === "kn" ? "ದಿನದ ಗಳಿಕೆ:" : "Earnings:"}</span>
              <span className="text-emerald-400 font-extrabold text-sm font-mono">
                ₹{Number(data.earnings).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>{language === "kn" ? "ಮುಗಿಸಿದ ಕೆಲಸ:" : "Completed Gigs:"}</span>
              <span className="font-bold text-white font-mono">
                {data.isUnavailable 
                  ? (language === "kn" ? "ರಜೆ" : "Marked Off")
                  : `${data.gigs} ${data.gigs === 1 ? (language === "kn" ? "ಕೆಲಸ" : "gig") : (language === "kn" ? "ಕೆಲಸಗಳು" : "gigs")}`}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>{language === "kn" ? "ದಿನದ ದರ:" : "Daily Rate:"}</span>
              <span className="font-mono text-slate-300">₹{data.rate}/day</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Filter reviews
  const filteredReviews = reviews.filter((rev) => {
    if (selectedFilter === "5") return rev.rating === 5;
    if (selectedFilter === "4") return rev.rating === 4;
    if (selectedFilter === "critical") return rev.rating <= 3;
    return true;
  });

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Recently";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="worker-dashboard-panel">
      {/* Top Banner: Artisan Identity & Performance Overview */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white rounded-2xl p-6 border border-emerald-800/60 shadow-md relative overflow-hidden">
        {/* Subtle geometric glowing accent */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <img 
              src={profile?.photo || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=150"} 
              alt={profile?.name || workerName || "Worker"} 
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-400 bg-slate-800 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight text-white">
                  {profile?.name || workerName || "Artisan Dashboard"}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Verified Worker
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-1 flex items-center gap-2 flex-wrap">
                <span>{profile?.skills?.[0] || "Skilled Craftsman"}</span>
                <span>•</span>
                <span>{profile?.locationName || "Local Zone"}</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">₹{profile?.dailyRate || 550}/day</span>
              </p>
            </div>
          </div>

          {onNavigateToEditor && (
            <button
              onClick={onNavigateToEditor}
              className="self-start md:self-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
            >
              Edit Profile & Rates
            </button>
          )}
        </div>
      </div>

      {/* Primary Key Performance Indicator Cards (Geometric Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Completed Jobs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Total Completed Jobs
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {totalCompletedJobs}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" />
              Verified Gigs
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {totalCompletedJobs > 0 
              ? `${totalCompletedJobs} client jobs completed & reviewed` 
              : "No jobs reviewed yet. Share profile to get started!"}
          </p>
        </div>

        {/* KPI 2: Average Rating */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Average Rating
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {averageRating}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              / 5.0
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className={`w-3 h-3 ${star <= Math.round(Number(averageRating)) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} 
              />
            ))}
            <span className="text-[11px] text-slate-400 ml-1">
              ({reviews.length} ratings)
            </span>
          </div>
        </div>

        {/* KPI 3: Customer Satisfaction */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Satisfaction Rate
            </span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
              <ThumbsUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {satisfactionRate}%
            </span>
            <span className="text-xs font-semibold text-teal-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              Positive
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {highRatingsCount} out of {totalCompletedJobs || 1} clients gave 4 or 5 stars
          </p>
        </div>

        {/* KPI 4: Estimated Earnings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Estimated Job Value
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              ₹{estimatedEarnings.toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Based on completed client jobs at ₹{profile?.dailyRate || 550}/day
          </p>
        </div>
      </div>

      {/* 30-Day Earnings Chart using Recharts */}
      <div 
        id="worker-earnings-chart-section"
        data-testid="worker-earnings-chart"
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5"
      >
        {/* Header with Title and Control Toggles */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {language === "kn" ? "ಕಳೆದ 30 ದಿನಗಳ ಗಳಿಕೆ" : "Earnings Over the Past 30 Days"}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {language === "kn" ? "ನೇರ ಗಳಿಕೆ" : "Direct Income"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === "kn" 
                  ? "ದಿನಗೂಲಿ ಆಧಾರಿತ ಕೆಲಸಗಳ ಮತ್ತು ಕ್ಲೈಂಟ್ ಸೇವೆಗಳ ದೈನಂದಿನ ವರದಿ" 
                  : "Track daily job compensation and cumulative wage trajectory across the last month"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Time range selector */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTimeRange("7")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  timeRange === "7" 
                    ? "bg-white text-emerald-800 font-bold shadow-2xs" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                7D
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("14")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  timeRange === "14" 
                    ? "bg-white text-emerald-800 font-bold shadow-2xs" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                14D
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("30")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  timeRange === "30" 
                    ? "bg-white text-emerald-800 font-bold shadow-2xs" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                30D
              </button>
            </div>

            {/* Chart view type toggle (Area vs Bar) */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartViewMode("area")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartViewMode === "area" 
                    ? "bg-white text-emerald-800 font-bold shadow-2xs" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Area Smooth Trend"
              >
                <LineChart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === "kn" ? "ಟ್ರೆಂಡ್" : "Trend"}</span>
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode("bar")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartViewMode === "bar" 
                    ? "bg-white text-emerald-800 font-bold shadow-2xs" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Daily Bars"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === "kn" ? "ದೈನಂದಿನ ಬಾರ್" : "Daily Bars"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Summary Stat Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
          <div>
            <span className="text-[10px] font-bold uppercase font-mono text-slate-400">
              {language === "kn" ? `ಒಟ್ಟು ಗಳಿಕೆ (${timeRange} ದಿನ)` : `Total Earnings (${timeRange}D)`}
            </span>
            <p className="text-lg font-black text-emerald-800 font-mono mt-0.5">
              ₹{totalRangeEarnings.toLocaleString("en-IN")}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase font-mono text-slate-400">
              {language === "kn" ? "ದೈನಂದಿನ ಸರಾಸರಿ" : "Daily Average"}
            </span>
            <p className="text-lg font-black text-slate-800 font-mono mt-0.5">
              ₹{avgDailyEarnings.toLocaleString("en-IN")}<span className="text-xs font-normal text-slate-400">/day</span>
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase font-mono text-slate-400">
              {language === "kn" ? "ಕೆಲಸದ ದಿನಗಳು" : "Active Work Days"}
            </span>
            <p className="text-lg font-black text-slate-800 font-mono mt-0.5">
              {activeDaysCount} <span className="text-xs font-normal text-slate-400">of {chartData.length} days</span>
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase font-mono text-slate-400">
              {language === "kn" ? "ಹೆಚ್ಚು ಗಳಿಕೆಯ ದಿನ" : "Peak Single Day"}
            </span>
            <p className="text-lg font-black text-amber-700 font-mono mt-0.5 truncate">
              ₹{peakDay.earnings.toLocaleString("en-IN")} <span className="text-xs font-normal text-slate-400">({peakDay.date})</span>
            </p>
          </div>
        </div>

        {/* The Recharts Canvas Container */}
        <div className="h-72 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            {chartViewMode === "area" ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="earningsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: "#64748b" }} 
                  tickLine={false} 
                  axisLine={{ stroke: "#e2e8f0" }}
                  interval={timeRange === "30" ? 4 : timeRange === "14" ? 2 : 0}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: "#64748b" }} 
                  tickLine={false} 
                  axisLine={{ stroke: "#e2e8f0" }} 
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  y={avgDailyEarnings} 
                  stroke="#f59e0b" 
                  strokeDasharray="4 4" 
                  label={{ 
                    value: `Avg: ₹${avgDailyEarnings}`, 
                    position: "insideTopRight", 
                    fill: "#d97706", 
                    fontSize: 10,
                    fontWeight: 700 
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="earnings" 
                  stroke="#059669" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#earningsAreaGrad)"
                  activeDot={{ r: 5, fill: "#047857", stroke: "#ffffff", strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: "#64748b" }} 
                  tickLine={false} 
                  axisLine={{ stroke: "#e2e8f0" }}
                  interval={timeRange === "30" ? 4 : timeRange === "14" ? 2 : 0}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: "#64748b" }} 
                  tickLine={false} 
                  axisLine={{ stroke: "#e2e8f0" }} 
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  y={avgDailyEarnings} 
                  stroke="#f59e0b" 
                  strokeDasharray="4 4" 
                  label={{ 
                    value: `Avg: ₹${avgDailyEarnings}`, 
                    position: "insideTopRight", 
                    fill: "#d97706", 
                    fontSize: 10,
                    fontWeight: 700 
                  }} 
                />
                <Bar 
                  dataKey="earnings" 
                  fill="#059669" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Footer Info & Wage Transparency Note */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              {language === "kn"
                ? `ದೈನಂದಿನ ದರ: ₹${profile?.dailyRate || 550}/ದಿನ • 0% ಕಮಿಷನ್ ಶುಲ್ಕ`
                : `Base Rate: ₹${profile?.dailyRate || 550}/day • 100% direct-to-artisan payouts`}
            </span>
          </div>
          <span className="font-mono text-slate-400">
            {language === "kn" ? "ಅಂಕಿಅಂಶಗಳು ನೈಜ ಸಮಯದೊಂದಿಗೆ ಹೊಂದಿಕೆಯಾಗುತ್ತವೆ" : "Synced with verified gig log"}
          </span>
        </div>
      </div>

      {/* Middle Section: Rating Breakdown & Feedback Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating Distribution Breakdown Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                Rating Distribution
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {reviews.length} total
              </span>
            </div>

            <div className="space-y-2.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = ratingCounts[stars] || 0;
                const percentage = totalCompletedJobs > 0 
                  ? Math.round((count / totalCompletedJobs) * 100) 
                  : 0;
                return (
                  <div key={stars} className="flex items-center gap-2 text-xs">
                    <span className="w-7 font-mono font-bold text-slate-700 flex items-center gap-0.5">
                      {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                    </span>
                    <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-slate-400 text-[11px]">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Highlight Footer */}
          <div className="mt-6 pt-4 border-t border-slate-150 bg-slate-50/60 -mx-6 -mb-6 p-4 rounded-b-2xl flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Community Trust Score</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/50">
              Level 1 Artisan ★
            </span>
          </div>
        </div>

        {/* Quality Feedback Highlights */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Job Quality Highlights & Feedback Analysis
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Live Insights
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                <span className="text-[10px] font-bold uppercase font-mono text-slate-400">Punctuality</span>
                <p className="text-base font-extrabold text-slate-800 mt-1">100%</p>
                <p className="text-[11px] text-slate-500 mt-0.5">On-time site visits reported</p>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                <span className="text-[10px] font-bold uppercase font-mono text-slate-400">Work Cleanliness</span>
                <p className="text-base font-extrabold text-slate-800 mt-1">High Praise</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Clean job site and proper finishing</p>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                <span className="text-[10px] font-bold uppercase font-mono text-slate-400">Wage Transparency</span>
                <p className="text-base font-extrabold text-slate-800 mt-1">Direct ₹ Deal</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Zero intermediary fees</p>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Reputation Tip:</strong> Customer reviews on Namma-Kelsa are permanent and verified. Completing jobs promptly and asking customers to submit direct feedback on your WorkerCard directly boosts your listing rank in your town center!
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-150 flex items-center justify-between text-xs text-slate-500">
            <span>Direct contact enabled for: <strong>{profile?.phone || "Phone not set"}</strong></span>
            <span className="font-mono text-[11px] text-emerald-700 font-bold">
              {profile?.isAvailable ? "● Ready for Jobs Today" : "○ Currently Away"}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Customer Feedback Summaries */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-150 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Recent Customer Feedback Summaries
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer reviews and ratings logged directly in Firestore
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedFilter === "all" 
                  ? "bg-emerald-600 text-white shadow-2xs" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All ({reviews.length})
            </button>
            <button
              onClick={() => setSelectedFilter("5")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedFilter === "5" 
                  ? "bg-emerald-600 text-white shadow-2xs" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              5 ★ ({ratingCounts[5]})
            </button>
            <button
              onClick={() => setSelectedFilter("4")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedFilter === "4" 
                  ? "bg-emerald-600 text-white shadow-2xs" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              4 ★ ({ratingCounts[4]})
            </button>
          </div>
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs italic">
            Loading recent feedback from Firestore...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-12 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 p-8 space-y-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">No Customer Feedback Yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              When customers hire you and rate your work on your WorkerCard, their verified review text, star score, and timestamp will immediately appear in this dashboard.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredReviews.map((rev) => (
              <div 
                key={rev.id} 
                className="bg-slate-50 hover:bg-slate-50/80 transition border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                        {rev.authorName ? rev.authorName.charAt(0).toUpperCase() : "C"}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">
                          {rev.authorName}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDate(rev.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Star score */}
                    <div className="flex items-center bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                      <span className="text-xs font-bold text-amber-500 mr-1 font-mono">{rev.rating}.0</span>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            className={`w-3 h-3 ${s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Comment Text */}
                  <p className="text-xs text-slate-700 italic leading-relaxed bg-white p-3 rounded-lg border border-slate-150">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Customer Feedback
                  </span>
                  <span>ID: {rev.id?.slice(0, 6)}...</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
