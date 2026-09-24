/**
 * Navigation, Distance, and Compression utils for Namma-Kelsa.
 */

import { WorkerProfile } from "./types";

/**
 * Calculates the distance between two points on the Earth's surface (Haversine formula).
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Number(d.toFixed(1)); // return distance formatted to 1 decimal place
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
    locationName: "Nelamangala Hub",
    latitude: 13.0980,
    longitude: 77.3940,
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
    about: "Expert painter with excellent speed and 8+ years executing high quality clean wall coats. Dedicated to clean, durable construction work."
  },
  {
    uid: "mock-worker-2",
    name: "Manju Swamy",
    phone: "9123456780",
    skills: ["Plumbing", "Electrical"],
    dailyRate: 700,
    locationName: "Town Center (Kengeri)",
    latitude: 12.9200,
    longitude: 77.4850,
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
    about: "Certified home electrician & skilled water line plumber. Focused on solving leaks and wire shorts efficiently with local guarantees."
  },
  {
    uid: "mock-worker-3",
    name: "Devappa K.",
    phone: "9988776655",
    skills: ["Gardening"],
    dailyRate: 500,
    locationName: "Jayanagar Sector",
    latitude: 12.9240,
    longitude: 77.5910,
    isAvailable: false,
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
    about: "Passionate community gardener offering complete organic lawn care, trimming, and flower design. Crafting beautiful garden layouts."
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

