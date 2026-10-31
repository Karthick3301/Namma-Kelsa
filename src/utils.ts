/**
 * Navigation, Distance, and Compression utils for Namma-Kelsa.
 */

import { WorkerProfile } from "./types";

/**
 * Calculates the real-world distance between two geographic coordinates in kilometers (Haversine formula).
 * Handles null, undefined, NaN, and out-of-range coordinates gracefully.
 */
export function calculateDistance(
  lat1: number | string | undefined | null,
  lon1: number | string | undefined | null,
  lat2: number | string | undefined | null,
  lon2: number | string | undefined | null
): number {
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null
  ) {
    return 99999;
  }

  const nLat1 = typeof lat1 === "number" ? lat1 : parseFloat(String(lat1));
  const nLon1 = typeof lon1 === "number" ? lon1 : parseFloat(String(lon1));
  const nLat2 = typeof lat2 === "number" ? lat2 : parseFloat(String(lat2));
  const nLon2 = typeof lon2 === "number" ? lon2 : parseFloat(String(lon2));

  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) {
    return 99999;
  }

  // Coordinate boundary checks (-90 to 90 lat, -180 to 180 lon)
  if (nLat1 < -90 || nLat1 > 90 || nLat2 < -90 || nLat2 > 90 ||
      nLon1 < -180 || nLon1 > 180 || nLon2 < -180 || nLon2 > 180) {
    return 99999;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
  const dLon = ((nLon2 - nLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((nLat1 * Math.PI) / 180) *
      Math.cos((nLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Number(d.toFixed(1)); // return distance formatted to 1 decimal place
}

/**
 * Returns a human-friendly formatted distance string.
 */
export function formatDistance(km: number | undefined | null): string {
  if (km === undefined || km === null || isNaN(km) || km >= 9999) {
    return "Location pending";
  }
  if (km < 0.1) {
    return "< 100 m";
  }
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

/**
 * Detects whether the current device is a mobile device using
 * navigator.userAgentData, userAgent regex, and screen width/touch heuristics.
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  // 1. Modern Chromium Client Hints API
  if ((navigator as any).userAgentData?.mobile !== undefined) {
    return Boolean((navigator as any).userAgentData.mobile);
  }
  // 2. Comprehensive User-Agent mobile regex check
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua);
  if (isMobileUA) {
    return true;
  }
  // 3. Screen width and touch capability fallback (e.g. tablet or mobile viewport)
  const hasTouch = "ontouchstart" in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  const isSmallScreen = window.innerWidth <= 768;
  return Boolean(hasTouch && isSmallScreen);
}

/**
 * Compresses an image file from file inputs and outputs a compressed JPEG Base64 string.
 * This ensures file size is strictly controlled before saving to Firestore.
 */
export function compressAndConvertImage(
  file: File,
  maxWidth: number = 320,
  maxHeight: number = 240,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Keep aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string); // Fallback to raw data-url
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Beautiful stock images for workers based on category
export const PRESET_AVATARS = [
  {
    category: "painting",
    url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=150",
    label: "Painter (Suresh)"
  },
  {
    category: "plumbing",
    url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=150",
    label: "Plumber (Ramesh)"
  },
  {
    category: "electrical",
    url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=150",
    label: "Electrician (Anand)"
  },
  {
    category: "gardening",
    url: "https://images.unsplash.com/photo-1592417817098-8f3d6fe19665?auto=format&fit=crop&q=80&w=150",
    label: "Gardener (Deva)"
  },
  {
    category: "tiling",
    url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=150",
    label: "Tiler (Ravi)"
  }
];

export const PRESET_GALLERIES = [
  {
    category: "painting",
    urls: [
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1502005229762-fc1b2b812ca5?auto=format&fit=crop&q=80&w=300"
    ]
  },
  {
    category: "plumbing",
    urls: [
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1502005229762-fc1b2b812ca5?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=300"
    ]
  },
  {
    category: "electrical",
    urls: [
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1502005229762-fc1b2b812ca5?auto=format&fit=crop&q=80&w=300"
    ]
  },
  {
    category: "gardening",
    urls: [
      "https://images.unsplash.com/photo-1558904541-efa8c1a68fc6?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=300"
    ]
  }
];

export const MOCK_WORKERS: Partial<WorkerProfile>[] = [
  {
    uid: "mock-worker-1",
    name: "Raju Prasad",
    phone: "9876543210",
    skills: ["Painting", "Tiling"],
    dailyRate: 650,
    locationName: "Kolkata, West Bengal",
    latitude: 22.5726,
    longitude: 88.3639,
    isAvailable: true,
    photo: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=150",
    imageUrls: [
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1502005229762-fc1b2b812ca5?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=600"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1502005229762-fc1b2b812ca5?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=300"
    ],
    experience: 8,
    about: "Expert painter and tiler with excellent speed and 8+ years executing high quality clean finishes. Dedicated to durable residential and commercial work."
  },
  {
    uid: "mock-worker-2",
    name: "Manju Swamy",
    phone: "9123456780",
    skills: ["Plumbing", "Electrical"],
    dailyRate: 700,
    locationName: "Mumbai, Maharashtra",
    latitude: 19.0760,
    longitude: 72.8777,
    isAvailable: true,
    photo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=150",
    imageUrls: [
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1502005229762-fc1b2b812ca5?auto=format&fit=crop&q=80&w=600"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1502005229762-fc1b2b812ca5?auto=format&fit=crop&q=80&w=300"
    ],
    experience: 5,
    about: "Certified home electrician & skilled water line plumber. Focused on solving leaks and wire shorts efficiently with honest upfront estimates."
  },
  {
    uid: "mock-worker-3",
    name: "Devappa Sharma",
    phone: "9988776655",
    skills: ["Gardening", "Masonry"],
    dailyRate: 500,
    locationName: "Delhi NCR",
    latitude: 28.6139,
    longitude: 77.2090,
    isAvailable: true,
    photo: "https://images.unsplash.com/photo-1592417817098-8f3d6fe19665?auto=format&fit=crop&q=80&w=150",
    imageUrls: [
      "https://images.unsplash.com/photo-1558904541-efa8c1a68fc6?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1558904541-efa8c1a68fc6?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=300"
    ],
    experience: 12,
    about: "Passionate community gardener and stone mason offering complete lawn care, flower beds, and sturdy boundary wall plastering."
  },
  {
    uid: "mock-worker-4",
    name: "Suresh Kumar",
    phone: "9841234567",
    skills: ["Carpentry", "Tiling"],
    dailyRate: 680,
    locationName: "Chennai, Tamil Nadu",
    latitude: 13.0827,
    longitude: 80.2707,
    isAvailable: true,
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    imageUrls: [
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=600"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=300"
    ],
    experience: 9,
    about: "Master carpenter specializing in modular kitchen woodwork, wooden door fittings, and precise tile alignment."
  },
  {
    uid: "mock-worker-5",
    name: "Rajesh Varma",
    phone: "9701234567",
    skills: ["Electrical", "Plumbing"],
    dailyRate: 720,
    locationName: "Hyderabad, Telangana",
    latitude: 17.3850,
    longitude: 78.4867,
    isAvailable: true,
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    imageUrls: [
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=600"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=300"
    ],
    experience: 7,
    about: "Experienced technician handling residential electric wiring, MCB switches, and overhead tank water pump installations."
  },
  {
    uid: "mock-worker-6",
    name: "Pooja Deshmukh",
    phone: "9823456789",
    skills: ["Cleaning", "Gardening"],
    dailyRate: 550,
    locationName: "Pune, Maharashtra",
    latitude: 18.5204,
    longitude: 73.8567,
    isAvailable: true,
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150",
    imageUrls: [
      "https://images.unsplash.com/photo-1558904541-efa8c1a68fc6?auto=format&fit=crop&q=80&w=600"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1558904541-efa8c1a68fc6?auto=format&fit=crop&q=80&w=300"
    ],
    experience: 6,
    about: "Deep cleaning professional and home gardening specialist. Experienced in post-renovation cleanup, terrace gardens, and organic pest care."
  },
  {
    uid: "mock-worker-7",
    name: "Vikram Rathore",
    phone: "9829012345",
    skills: ["Masonry", "Painting"],
    dailyRate: 640,
    locationName: "Jaipur, Rajasthan",
    latitude: 26.9124,
    longitude: 75.7873,
    isAvailable: true,
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150",
    imageUrls: [
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=600"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=300"
    ],
    experience: 11,
    about: "Traditional and modern masonry artisan with expertise in brick masonry, plastering, stone elevation, and waterproof painting."
  },
  {
    uid: "mock-worker-8",
    name: "Mohammad Arif",
    phone: "9919012345",
    skills: ["Carpentry", "Electrical"],
    dailyRate: 690,
    locationName: "Lucknow, Uttar Pradesh",
    latitude: 26.8467,
    longitude: 80.9462,
    isAvailable: true,
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150",
    imageUrls: [
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=600"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=300"
    ],
    experience: 8,
    about: "Specialist in fine furniture craft, false ceiling lighting, and concealed electrical conduit repairs."
  },
  {
    uid: "mock-worker-9",
    name: "K. Venkatesh Rao",
    phone: "9848012345",
    skills: ["Plumbing", "Electrical"],
    dailyRate: 650,
    locationName: "Vijayawada, Andhra Pradesh",
    latitude: 16.5062,
    longitude: 80.6480,
    isAvailable: true,
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    imageUrls: [
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=600"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=300"
    ],
    experience: 9,
    about: "Master plumber and pump technician in Vijayawada. Expert in high-pressure piping, bathroom fittings, and residential electric motor wiring."
  }
];

/**
 * Format a Date object to 'YYYY-MM-DD' ISO format based on local date.
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns formatted relative or human-readable date.
 * e.g., "Tomorrow (Fri, 25 Sep)" or "Sat, 26 Sep"
 */
export function formatDisplayDate(isoString: string): string {
  if (!isoString) return "";
  const parts = isoString.split("-").map(Number);
  if (parts.length !== 3) return isoString;
  const targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetMidnight = new Date(targetDate);
  targetMidnight.setHours(0, 0, 0, 0);
  
  const diffDays = Math.round((targetMidnight.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  const options: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };
  const formatted = targetDate.toLocaleDateString("en-US", options);
  
  if (diffDays === 0) return `Today (${formatted})`;
  if (diffDays === 1) return `Tomorrow (${formatted})`;
  return formatted;
}

export interface UpcomingDayInfo {
  date: Date;
  iso: string;
  dayName: string;
  dayNumber: number;
  monthName: string;
  isToday: boolean;
  isTomorrow: boolean;
  isWeekend: boolean;
}

/**
 * Generates an array of consecutive days starting from today.
 */
export function getUpcomingDays(count: number = 14): UpcomingDayInfo[] {
  const days: UpcomingDayInfo[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const iso = formatDateToISO(d);
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const monthName = d.toLocaleDateString("en-US", { month: "short" });
    const dayNumber = d.getDate();
    const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday

    days.push({
      date: d,
      iso,
      dayName,
      dayNumber,
      monthName,
      isToday: i === 0,
      isTomorrow: i === 1,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6
    });
  }
  return days;
}

// Add sample upcoming dates to MOCK_WORKERS
const getOffsetDateISO = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return formatDateToISO(d);
};

MOCK_WORKERS[0].unavailableDates = [getOffsetDateISO(1), getOffsetDateISO(4)];
MOCK_WORKERS[1].unavailableDates = [getOffsetDateISO(2)];
MOCK_WORKERS[2].unavailableDates = [getOffsetDateISO(0), getOffsetDateISO(1)];
if (MOCK_WORKERS[3]) MOCK_WORKERS[3].unavailableDates = [getOffsetDateISO(3)];
if (MOCK_WORKERS[4]) MOCK_WORKERS[4].unavailableDates = [getOffsetDateISO(1), getOffsetDateISO(5)];

export interface SkillTheme {
  bg: string;
  text: string;
  border: string;
  badge: string;
  iconColor: string;
  dotColor: string;
  iconName: string;
}

/**
 * Returns distinct visual styling and icon metadata for skill pills.
 * Enables colorful individual pills that establish high visual hierarchy and instant recognition.
 */
export function getSkillTheme(skillName: string): SkillTheme {
  const normalized = (skillName || "").trim().toLowerCase();

  if (normalized.includes("paint")) {
    return {
      bg: "bg-violet-50/90",
      text: "text-violet-900",
      border: "border-violet-200",
      badge: "bg-violet-100 text-violet-800",
      iconColor: "text-violet-600",
      dotColor: "bg-violet-500",
      iconName: "Paintbrush"
    };
  }

  if (normalized.includes("plumb") || normalized.includes("water") || normalized.includes("pipe")) {
    return {
      bg: "bg-sky-50/90",
      text: "text-sky-900",
      border: "border-sky-200",
      badge: "bg-sky-100 text-sky-800",
      iconColor: "text-sky-600",
      dotColor: "bg-sky-500",
      iconName: "Droplet"
    };
  }

  if (normalized.includes("electr") || normalized.includes("wire") || normalized.includes("power") || normalized.includes("solar")) {
    return {
      bg: "bg-amber-50/90",
      text: "text-amber-950",
      border: "border-amber-200",
      badge: "bg-amber-100 text-amber-900",
      iconColor: "text-amber-600",
      dotColor: "bg-amber-500",
      iconName: "Zap"
    };
  }

  if (normalized.includes("garden") || normalized.includes("lawn") || normalized.includes("plant") || normalized.includes("farm")) {
    return {
      bg: "bg-emerald-50/90",
      text: "text-emerald-950",
      border: "border-emerald-200",
      badge: "bg-emerald-100 text-emerald-800",
      iconColor: "text-emerald-600",
      dotColor: "bg-emerald-500",
      iconName: "Leaf"
    };
  }

  if (normalized.includes("tile") || normalized.includes("tiling") || normalized.includes("floor") || normalized.includes("marble") || normalized.includes("granite")) {
    return {
      bg: "bg-teal-50/90",
      text: "text-teal-950",
      border: "border-teal-200",
      badge: "bg-teal-100 text-teal-800",
      iconColor: "text-teal-600",
      dotColor: "bg-teal-500",
      iconName: "Grid"
    };
  }

  if (normalized.includes("carpent") || normalized.includes("wood") || normalized.includes("furniture")) {
    return {
      bg: "bg-orange-50/90",
      text: "text-orange-950",
      border: "border-orange-200",
      badge: "bg-orange-100 text-orange-900",
      iconColor: "text-orange-600",
      dotColor: "bg-orange-500",
      iconName: "Hammer"
    };
  }

  if (normalized.includes("mason") || normalized.includes("brick") || normalized.includes("cement") || normalized.includes("construct") || normalized.includes("civil")) {
    return {
      bg: "bg-rose-50/90",
      text: "text-rose-950",
      border: "border-rose-200",
      badge: "bg-rose-100 text-rose-800",
      iconColor: "text-rose-600",
      dotColor: "bg-rose-500",
      iconName: "Construction"
    };
  }

  if (normalized.includes("clean") || normalized.includes("wash") || normalized.includes("housekeep") || normalized.includes("sanit")) {
    return {
      bg: "bg-cyan-50/90",
      text: "text-cyan-950",
      border: "border-cyan-200",
      badge: "bg-cyan-100 text-cyan-800",
      iconColor: "text-cyan-600",
      dotColor: "bg-cyan-500",
      iconName: "Sparkles"
    };
  }

  // Dynamic fallback palette for custom artisan specialties
  const fallbacks: SkillTheme[] = [
    {
      bg: "bg-indigo-50/90",
      text: "text-indigo-950",
      border: "border-indigo-200",
      badge: "bg-indigo-100 text-indigo-800",
      iconColor: "text-indigo-600",
      dotColor: "bg-indigo-500",
      iconName: "Sparkles"
    },
    {
      bg: "bg-fuchsia-50/90",
      text: "text-fuchsia-950",
      border: "border-fuchsia-200",
      badge: "bg-fuchsia-100 text-fuchsia-800",
      iconColor: "text-fuchsia-600",
      dotColor: "bg-fuchsia-500",
      iconName: "Sparkles"
    },
    {
      bg: "bg-blue-50/90",
      text: "text-blue-950",
      border: "border-blue-200",
      badge: "bg-blue-100 text-blue-800",
      iconColor: "text-blue-600",
      dotColor: "bg-blue-500",
      iconName: "Wrench"
    },
    {
      bg: "bg-lime-50/90",
      text: "text-lime-950",
      border: "border-lime-200",
      badge: "bg-lime-100 text-lime-900",
      iconColor: "text-lime-600",
      dotColor: "bg-lime-500",
      iconName: "Wrench"
    }
  ];

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % fallbacks.length;
  return fallbacks[index];
}

/**
 * Cleans a place component by removing administrative suffixes and whitespace.
 * e.g. "Tirupattur District" -> "Tirupattur", "Kanuru Mandal" -> "Kanuru"
 */
export function cleanPlaceComponent(component: string | undefined | null): string {
  if (!component) return "";
  let clean = String(component).trim();
  // Strip postal codes (5-6 digits) & country name
  clean = clean.replace(/\b(India|\d{5,6})\b/gi, "").trim();
  // Strip administrative suffixes
  clean = clean.replace(/\s+(District|Dist\.?|Dt\.?|Taluk|Taluka|Tq\.?|Mandal|Tehsil|Tahsil|Block|Subdistrict|Division|Circle|Corporation|Municipality|Urban|Rural)\b/gi, "").trim();
  clean = clean.replace(/^(District|Taluk|Mandal|Tehsil)\s+/gi, "").trim();
  // Clean dangling commas, hyphens
  return clean.replace(/^[,\s-]+|[,\s-]+$/g, "");
}

/**
 * Computes Levenshtein distance between two strings.
 */
function getLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], prev, row[j]) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

/**
 * Normalizes a place name for phonetic & transliteration equivalence in India.
 * Handles common Indian English variations (e.g. th vs t, double consonants, etc.)
 */
export function normalizePlaceForComparison(name: string): string {
  if (!name) return "";
  let s = cleanPlaceComponent(name).toLowerCase();
  // Strip non-alphanumeric
  s = s.replace(/[^a-z0-9]/g, "");
  // Common transliteration variations in Indian English
  s = s.replace(/th/g, "t");
  s = s.replace(/ph/g, "p");
  s = s.replace(/dh/g, "d");
  s = s.replace(/bh/g, "b");
  s = s.replace(/gh/g, "g");
  s = s.replace(/kh/g, "k");
  s = s.replace(/zh/g, "l");
  s = s.replace(/sh/g, "s");
  // Collapse double letters (pp -> p, tt -> t, ll -> l, rr -> r, etc.)
  s = s.replace(/([a-z])\1+/g, "$1");
  return s.trim();
}

/**
 * Checks if two location names are identical or near-identical phonetic/spelling variants.
 * e.g., "Tirupathur" and "Tirupattur" -> true
 * e.g., "Bengaluru" and "Bangalore" -> true
 * e.g., "Patchur" and "Tirupattur" -> false
 * e.g., "Tiruppur" and "Tirupattur" -> false (distinct towns!)
 */
export function areNearDuplicateStrings(strA: string | undefined | null, strB: string | undefined | null): boolean {
  if (!strA || !strB) return false;
  const aRaw = cleanPlaceComponent(strA).toLowerCase();
  const bRaw = cleanPlaceComponent(strB).toLowerCase();
  if (!aRaw || !bRaw) return false;
  if (aRaw === bRaw) return true;

  const a = normalizePlaceForComparison(strA);
  const b = normalizePlaceForComparison(strB);
  if (!a || !b) return false;
  if (a === b) return true;

  // Substring containment if base length is substantial (e.g. "bengaluru" and "bengaluruurban")
  if (a.length >= 5 && b.length >= 5) {
    if (a.includes(b) || b.includes(a)) {
      return true;
    }
  }

  // Exact 1-character difference for longer words (e.g. 7+ chars)
  const maxLen = Math.max(a.length, b.length);
  const dist = getLevenshteinDistance(a, b);
  if (maxLen >= 7 && dist <= 1) {
    return true;
  }

  // Known historical & multilingual Indian city aliases
  const knownAliases: [string, string][] = [
    ["bangalore", "bengaluru"],
    ["mysore", "mysuru"],
    ["belgaum", "belagavi"],
    ["mangalore", "mangaluru"],
    ["hubli", "hubballi"],
    ["gulbarga", "kalaburagi"],
    ["bellary", "ballari"],
    ["shimoga", "shivamogga"],
    ["bijapur", "vijayapura"],
    ["chikmagalur", "chikkamagaluru"],
    ["madras", "chennai"],
    ["trivandrum", "thiruvananthapuram"],
    ["calicut", "kozhikode"],
    ["cochin", "kochi"],
    ["poona", "pune"],
    ["bombay", "mumbai"],
    ["calcutta", "kolkata"],
    ["orissa", "odisha"],
    ["gurgaon", "gurugram"],
    ["waltair", "visakhapatnam"],
    ["vizag", "visakhapatnam"],
    ["tirupathur", "tirupattur"],
    ["thiruppathur", "tirupattur"],
    ["tiruppathur", "tirupathur"]
  ];

  for (const [x, y] of knownAliases) {
    if ((a === x && b === y) || (a === y && b === x)) return true;
  }

  return false;
}

/**
 * Formats reverse-geocoded location data from Nominatim into a concise, readable 2-level string:
 * - De-duplicates redundant administrative components (e.g., "Tirupathur, Tirupattur" -> "Tirupattur")
 * - Prioritizes the most locally recognizable name first (Village or Town)
 * - Only includes the District if it is meaningfully different from the town name; otherwise falls back to State
 * - Never returns redundant 3+ level chains like "Patchur, Tirupathur, Tirupattur"
 * Output is ideally: "Town/Village, District" or "Town/Village, State"
 */
export function formatReverseGeocodedLocation(address: any, displayName?: string): string {
  const addr = address || {};

  // Extract raw components
  const villageRaw = addr.village || addr.hamlet || "";
  const suburbRaw = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.city_district || addr.road || "";
  const townRaw = addr.town || addr.city || addr.municipality || "";
  const districtRaw = addr.state_district || addr.district || addr.county || "";
  const stateRaw = addr.state || "";

  const village = cleanPlaceComponent(villageRaw);
  const suburb = cleanPlaceComponent(suburbRaw);
  const town = cleanPlaceComponent(townRaw);
  const district = cleanPlaceComponent(districtRaw);
  const state = cleanPlaceComponent(stateRaw);

  // 1. Determine most locally recognizable entity (Level 1)
  // Priority: Village -> Suburb -> Town -> District
  let level1 = village || suburb || town || district;
  if (!village && !suburb && town && district && areNearDuplicateStrings(town, district)) {
    level1 = district; // prefer formal district name when town and district are identical/phonetic variants
  }

  // 2. Identify town and district, de-duplicating if they are near-identical variants
  // e.g. town="Tirupathur", district="Tirupattur" -> consolidated to "Tirupattur"
  let consolidatedHub = town || district;
  if (town && district) {
    if (areNearDuplicateStrings(town, district)) {
      consolidatedHub = district; // prefer formal district name
    } else {
      consolidatedHub = town;
    }
  }

  // 3. Determine Level 2:
  // - If level1 is a village/suburb:
  //   - If consolidatedHub exists and is NOT a duplicate of level1, use consolidatedHub (e.g. "Patchur, Tirupattur")
  //   - Otherwise, use state (e.g. "Patchur, Tamil Nadu")
  // - If level1 is a Town/City:
  //   - Only include district if district is meaningfully different from town
  //     e.g. town="Thiruppathur", district="Sivaganga" -> "Thiruppathur, Sivaganga"
  //     e.g. town="Aluva", district="Ernakulam" -> "Aluva, Ernakulam"
  //     e.g. town="Tirupathur", district="Tirupattur" -> duplicate! so use state -> "Tirupattur, Tamil Nadu"
  //     e.g. town="Jaipur", district="Jaipur" -> duplicate! so use state -> "Jaipur, Rajasthan"
  let level2 = "";

  const isLevel1LocalVillageOrSuburb = Boolean((village || suburb) && level1 !== town && level1 !== district);

  if (isLevel1LocalVillageOrSuburb) {
    if (consolidatedHub && !areNearDuplicateStrings(level1, consolidatedHub)) {
      level2 = consolidatedHub;
    } else if (state && !areNearDuplicateStrings(level1, state)) {
      level2 = state;
    }
  } else {
    // Level 1 is the town itself
    if (district && town && !areNearDuplicateStrings(town, district) && !areNearDuplicateStrings(level1, district)) {
      level2 = district;
    } else if (state && !areNearDuplicateStrings(level1, state)) {
      level2 = state;
    }
  }

  if (level1 && level2) {
    return `${level1}, ${level2}`;
  }
  if (level1 && state && !areNearDuplicateStrings(level1, state)) {
    return `${level1}, ${state}`;
  }
  if (level1) {
    return level1;
  }

  // Fallback: parse displayName if address object is empty or sparse
  if (displayName) {
    const rawTokens = displayName
      .split(",")
      .map(part => cleanPlaceComponent(part))
      .filter(part => {
        if (!part) return false;
        if (/^(india|\d{5,6})$/i.test(part)) return false;
        return true;
      });

    // De-duplicate near-identical tokens across the list
    const uniqueTokens: string[] = [];
    for (const token of rawTokens) {
      const isDupe = uniqueTokens.some(existing => areNearDuplicateStrings(existing, token));
      if (!isDupe) {
        uniqueTokens.push(token);
      }
    }

    if (uniqueTokens.length >= 2) {
      return `${uniqueTokens[0]}, ${uniqueTokens[1]}`;
    } else if (uniqueTokens.length === 1) {
      return uniqueTokens[0];
    }
  }

  return "Current Location";
}

