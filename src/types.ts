/**
 * TypeScript type definitions for the Namma-Kelsa Labor Directory Application.
 */

export interface WorkerProfile {
  uid: string;
  name: string;
  phone: string;
  skills: string[];
  dailyRate: number;
  locationName: string;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
  unavailableDates?: string[]; // ISO date strings (YYYY-MM-DD) when the worker is marked unavailable
  skillProficiencies?: Record<string, number>; // Self-assessed proficiency scores (0-100) across trade skills
  photo: string; // Base64 or Unsplash Preset URL
  imageUrls: string[]; // URLs of past work samples displayed in worker profile grid
  gallery?: string[]; // Backwards-compatibility with legacy gallery photos
  experience: number; // Years
  about: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface WorkerReview {
  id?: string;
  workerId: string;
  authorName: string;
  authorId: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: any; // Firestore Timestamp
}

export interface WorkerInquiry {
  id?: string;
  workerId: string;
  customerName: string;
  customerPhone?: string;
  message: string;
  read?: boolean;
  createdAt: any; // Firestore Timestamp
}

export interface WorkerNotification {
  id: string;
  type: "inquiry" | "review";
  title: string;
  message: string;
  authorName?: string;
  customerPhone?: string;
  rating?: number;
  read: boolean;
  createdAt: any;
  targetId?: string;
}

export interface CustomerLocation {
  name: string;
  latitude: number;
  longitude: number;
}

export const SKILL_OPTIONS = [
  { id: "painting", label: "Painting", icon: "Paintbrush" },
  { id: "plumbing", label: "Plumbing", icon: "Droplets" },
  { id: "electrical", label: "Electrical", icon: "Zap" },
  { id: "gardening", label: "Gardening", icon: "Leaf" },
  { id: "tiling", label: "Tiling", icon: "Grid" },
  { id: "carpentry", label: "Carpentry", icon: "Hammer" },
  { id: "masonry", label: "Masonry", icon: "Construction" },
  { id: "cleaning", label: "Cleaning", icon: "Sparkles" }
];

export const TOWN_CENTERS: CustomerLocation[] = [
  { name: "Town Center (Kengeri)", latitude: 12.9174, longitude: 77.4838 },
  { name: "Whitefield Suburb", latitude: 12.9698, longitude: 77.7500 },
  { name: "Nelamangala Hub", latitude: 13.0957, longitude: 77.3912 },
  { name: "Jayanagar Sector", latitude: 12.9250, longitude: 77.5938 },
  { name: "Devenahalli Junction", latitude: 13.2458, longitude: 77.7122 }
];
