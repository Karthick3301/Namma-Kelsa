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
    gallery: [
      "https://images.unsplash.com/photo-1558904541-efa8c1a68fc6?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=300"
    ],
    experience: 12,
    about: "Passionate community gardener offering complete organic lawn care, trimming, and flower design. Crafting beautiful garden layouts."
  }
];
