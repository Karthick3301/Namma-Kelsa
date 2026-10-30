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

export type UserRole = "customer" | "worker";

export interface UserAccount {
  uid: string;
  phoneNumber?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  createdAt: any;
  updatedAt: any;
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

export interface CityHub extends CustomerLocation {
  state?: string;
  region?: "North" | "South" | "West" | "East" | "Central" | "North-East";
}

export const INDIAN_MAJOR_CITIES: CityHub[] = [
  // 1. Andaman and Nicobar Islands (UT)
  { name: "Port Blair, Andaman & Nicobar Islands", latitude: 11.6234, longitude: 92.7265, state: "Andaman and Nicobar Islands", region: "South" },

  // 2. Andhra Pradesh (State)
  { name: "Vijayawada, Andhra Pradesh", latitude: 16.5062, longitude: 80.6480, state: "Andhra Pradesh", region: "South" },
  { name: "Visakhapatnam, Andhra Pradesh", latitude: 17.6868, longitude: 83.2185, state: "Andhra Pradesh", region: "South" },

  // 3. Arunachal Pradesh (State)
  { name: "Itanagar, Arunachal Pradesh", latitude: 27.0844, longitude: 93.6053, state: "Arunachal Pradesh", region: "East" },

  // 4. Assam (State)
  { name: "Guwahati, Assam", latitude: 26.1445, longitude: 91.7362, state: "Assam", region: "East" },
  { name: "Silchar, Assam", latitude: 24.8333, longitude: 92.7789, state: "Assam", region: "East" },

  // 5. Bihar (State)
  { name: "Gaya, Bihar", latitude: 24.7914, longitude: 85.0002, state: "Bihar", region: "East" },
  { name: "Patna, Bihar", latitude: 25.5941, longitude: 85.1376, state: "Bihar", region: "East" },

  // 6. Chandigarh (UT)
  { name: "Chandigarh", latitude: 30.7333, longitude: 76.7794, state: "Chandigarh", region: "North" },

  // 7. Chhattisgarh (State)
  { name: "Bilaspur, Chhattisgarh", latitude: 22.0797, longitude: 82.1409, state: "Chhattisgarh", region: "Central" },
  { name: "Raipur, Chhattisgarh", latitude: 21.2514, longitude: 81.6296, state: "Chhattisgarh", region: "Central" },

  // 8. Dadra and Nagar Haveli and Daman and Diu (UT)
  { name: "Daman, Dadra & Nagar Haveli and Daman & Diu", latitude: 20.3974, longitude: 72.8328, state: "Dadra and Nagar Haveli and Daman and Diu", region: "West" },
  { name: "Silvassa, Dadra & Nagar Haveli and Daman & Diu", latitude: 20.2763, longitude: 73.0083, state: "Dadra and Nagar Haveli and Daman and Diu", region: "West" },

  // 9. Delhi (NCT/UT)
  { name: "Delhi NCR", latitude: 28.6139, longitude: 77.2090, state: "Delhi", region: "North" },

  // 10. Goa (State)
  { name: "Margao, Goa", latitude: 15.2832, longitude: 73.9862, state: "Goa", region: "West" },
  { name: "Panaji, Goa", latitude: 15.4909, longitude: 73.8278, state: "Goa", region: "West" },

  // 11. Gujarat (State)
  { name: "Ahmedabad, Gujarat", latitude: 23.0225, longitude: 72.5714, state: "Gujarat", region: "West" },
  { name: "Rajkot, Gujarat", latitude: 22.3039, longitude: 70.8022, state: "Gujarat", region: "West" },
  { name: "Surat, Gujarat", latitude: 21.1702, longitude: 72.8311, state: "Gujarat", region: "West" },
  { name: "Vadodara, Gujarat", latitude: 22.3072, longitude: 73.1812, state: "Gujarat", region: "West" },

  // 12. Haryana (State)
  { name: "Faridabad, Haryana", latitude: 28.4089, longitude: 77.3178, state: "Haryana", region: "North" },
  { name: "Gurugram, Haryana", latitude: 28.4595, longitude: 77.0266, state: "Haryana", region: "North" },

  // 13. Himachal Pradesh (State)
  { name: "Dharamshala, Himachal Pradesh", latitude: 32.2190, longitude: 76.3234, state: "Himachal Pradesh", region: "North" },
  { name: "Shimla, Himachal Pradesh", latitude: 31.1048, longitude: 77.1734, state: "Himachal Pradesh", region: "North" },

  // 14. Jammu and Kashmir (UT)
  { name: "Jammu, Jammu & Kashmir", latitude: 32.7266, longitude: 74.8570, state: "Jammu and Kashmir", region: "North" },
  { name: "Srinagar, Jammu & Kashmir", latitude: 34.0837, longitude: 74.7973, state: "Jammu and Kashmir", region: "North" },

  // 15. Jharkhand (State)
  { name: "Jamshedpur, Jharkhand", latitude: 22.8046, longitude: 86.2029, state: "Jharkhand", region: "East" },
  { name: "Ranchi, Jharkhand", latitude: 23.3441, longitude: 85.3096, state: "Jharkhand", region: "East" },

  // 16. Karnataka (State)
  { name: "Bengaluru, Karnataka", latitude: 12.9716, longitude: 77.5946, state: "Karnataka", region: "South" },
  { name: "Hubballi-Dharwad, Karnataka", latitude: 15.3647, longitude: 75.1240, state: "Karnataka", region: "South" },
  { name: "Mangaluru, Karnataka", latitude: 12.9141, longitude: 74.8560, state: "Karnataka", region: "South" },
  { name: "Mysuru, Karnataka", latitude: 12.2958, longitude: 76.6394, state: "Karnataka", region: "South" },

  // 17. Kerala (State)
  { name: "Kochi, Kerala", latitude: 9.9312, longitude: 76.2673, state: "Kerala", region: "South" },
  { name: "Kozhikode, Kerala", latitude: 11.2588, longitude: 75.7804, state: "Kerala", region: "South" },
  { name: "Thiruvananthapuram, Kerala", latitude: 8.5241, longitude: 76.9366, state: "Kerala", region: "South" },

  // 18. Ladakh (UT)
  { name: "Leh, Ladakh", latitude: 34.1526, longitude: 77.5771, state: "Ladakh", region: "North" },

  // 19. Lakshadweep (UT)
  { name: "Kavaratti, Lakshadweep", latitude: 10.5667, longitude: 72.6417, state: "Lakshadweep", region: "South" },

  // 20. Madhya Pradesh (State)
  { name: "Bhopal, Madhya Pradesh", latitude: 23.2599, longitude: 77.4126, state: "Madhya Pradesh", region: "Central" },
  { name: "Gwalior, Madhya Pradesh", latitude: 26.2183, longitude: 78.1828, state: "Madhya Pradesh", region: "Central" },
  { name: "Indore, Madhya Pradesh", latitude: 22.7196, longitude: 75.8577, state: "Madhya Pradesh", region: "Central" },
  { name: "Jabalpur, Madhya Pradesh", latitude: 23.1815, longitude: 79.9864, state: "Madhya Pradesh", region: "Central" },

  // 21. Maharashtra (State)
  { name: "Mumbai, Maharashtra", latitude: 19.0760, longitude: 72.8777, state: "Maharashtra", region: "West" },
  { name: "Nagpur, Maharashtra", latitude: 21.1458, longitude: 79.0882, state: "Maharashtra", region: "Central" },
  { name: "Nashik, Maharashtra", latitude: 19.9975, longitude: 73.7898, state: "Maharashtra", region: "West" },
  { name: "Pune, Maharashtra", latitude: 18.5204, longitude: 73.8567, state: "Maharashtra", region: "West" },

  // 22. Manipur (State)
  { name: "Imphal, Manipur", latitude: 24.8170, longitude: 93.9368, state: "Manipur", region: "East" },

  // 23. Meghalaya (State)
  { name: "Shillong, Meghalaya", latitude: 25.5788, longitude: 91.8933, state: "Meghalaya", region: "East" },

  // 24. Mizoram (State)
  { name: "Aizawl, Mizoram", latitude: 23.7271, longitude: 92.7176, state: "Mizoram", region: "East" },

  // 25. Nagaland (State)
  { name: "Dimapur, Nagaland", latitude: 25.9090, longitude: 93.7266, state: "Nagaland", region: "East" },
  { name: "Kohima, Nagaland", latitude: 25.6751, longitude: 94.1086, state: "Nagaland", region: "East" },

  // 26. Odisha (State)
  { name: "Bhubaneswar, Odisha", latitude: 20.2961, longitude: 85.8245, state: "Odisha", region: "East" },
  { name: "Cuttack, Odisha", latitude: 20.4625, longitude: 85.8828, state: "Odisha", region: "East" },

  // 27. Puducherry (UT)
  { name: "Puducherry", latitude: 11.9416, longitude: 79.8083, state: "Puducherry", region: "South" },

  // 28. Punjab (State)
  { name: "Amritsar, Punjab", latitude: 31.6340, longitude: 74.8723, state: "Punjab", region: "North" },
  { name: "Ludhiana, Punjab", latitude: 30.9010, longitude: 75.8573, state: "Punjab", region: "North" },

  // 29. Rajasthan (State)
  { name: "Jaipur, Rajasthan", latitude: 26.9124, longitude: 75.7873, state: "Rajasthan", region: "North" },
  { name: "Jodhpur, Rajasthan", latitude: 26.2389, longitude: 73.0243, state: "Rajasthan", region: "North" },
  { name: "Udaipur, Rajasthan", latitude: 24.5854, longitude: 73.7125, state: "Rajasthan", region: "North" },

  // 30. Sikkim (State)
  { name: "Gangtok, Sikkim", latitude: 27.3389, longitude: 88.6065, state: "Sikkim", region: "East" },

  // 31. Tamil Nadu (State)
  { name: "Chennai, Tamil Nadu", latitude: 13.0827, longitude: 80.2707, state: "Tamil Nadu", region: "South" },
  { name: "Coimbatore, Tamil Nadu", latitude: 11.0168, longitude: 76.9558, state: "Tamil Nadu", region: "South" },
  { name: "Madurai, Tamil Nadu", latitude: 9.9252, longitude: 78.1198, state: "Tamil Nadu", region: "South" },

  // 32. Telangana (State)
  { name: "Hyderabad, Telangana", latitude: 17.3850, longitude: 78.4867, state: "Telangana", region: "South" },
  { name: "Warangal, Telangana", latitude: 17.9689, longitude: 79.5941, state: "Telangana", region: "South" },

  // 33. Tripura (State)
  { name: "Agartala, Tripura", latitude: 23.8315, longitude: 91.2868, state: "Tripura", region: "East" },

  // 34. Uttar Pradesh (State)
  { name: "Agra, Uttar Pradesh", latitude: 27.1767, longitude: 78.0081, state: "Uttar Pradesh", region: "North" },
  { name: "Kanpur, Uttar Pradesh", latitude: 26.4499, longitude: 80.3319, state: "Uttar Pradesh", region: "North" },
  { name: "Lucknow, Uttar Pradesh", latitude: 26.8467, longitude: 80.9462, state: "Uttar Pradesh", region: "North" },
  { name: "Noida, Uttar Pradesh", latitude: 28.5355, longitude: 77.3910, state: "Uttar Pradesh", region: "North" },
  { name: "Varanasi, Uttar Pradesh", latitude: 25.3176, longitude: 82.9739, state: "Uttar Pradesh", region: "North" },

  // 35. Uttarakhand (State)
  { name: "Dehradun, Uttarakhand", latitude: 30.3165, longitude: 78.0322, state: "Uttarakhand", region: "North" },
  { name: "Haridwar, Uttarakhand", latitude: 29.9457, longitude: 78.1642, state: "Uttarakhand", region: "North" },

  // 36. West Bengal (State)
  { name: "Kolkata, West Bengal", latitude: 22.5726, longitude: 88.3639, state: "West Bengal", region: "East" },
  { name: "Siliguri, West Bengal", latitude: 26.7271, longitude: 88.3953, state: "West Bengal", region: "East" }
];

export const TOWN_CENTERS: CityHub[] = INDIAN_MAJOR_CITIES;
