import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  MapPin, 
  SlidersHorizontal, 
  Sparkles, 
  X,
  Compass,
  Zap,
  Check,
  History,
  Clock,
  Trash2,
  Heart,
  Crosshair,
  Navigation,
  Home,
  Sliders,
  Loader2,
  AlertCircle,
  Globe,
  ChevronRight
} from "lucide-react";
import { SKILL_OPTIONS, TOWN_CENTERS, INDIAN_MAJOR_CITIES, CityHub, CustomerLocation } from "../types";
import { getSkillIcon } from "./ChipGroup";
import { useLanguage } from "../context/LanguageContext";
import { formatReverseGeocodedLocation } from "../utils";

const SEARCH_HISTORY_STORAGE_KEY = "namma_kelsa_recent_skill_searches";
const MAX_RECENT_SEARCHES = 6;
const DEFAULT_INITIAL_SKILLS = ["Painting", "Plumbing", "Electrical"];

interface SearchFiltersProps {
  searchText: string;
  setSearchText: (text: string) => void;
  selectedSkill: string | null;
  setSelectedSkill: (skill: string | null) => void;
  maxDistance: number;
  setMaxDistance: (dist: number) => void;
  onlyAvailable: boolean;
  setOnlyAvailable: (available: boolean) => void;
  selectedTownIdx: number | null;
  setSelectedTownIdx: (idx: number | null) => void;
  customerLocation?: CustomerLocation;
  setCustomerLocation?: (loc: CustomerLocation) => void;
  showFavoritesOnly?: boolean;
  setShowFavoritesOnly?: (show: boolean) => void;
  favoritesCount?: number;
}

export default function SearchFilters({
  searchText,
  setSearchText,
  selectedSkill,
  setSelectedSkill,
  maxDistance,
  setMaxDistance,
  onlyAvailable,
  setOnlyAvailable,
  selectedTownIdx,
  setSelectedTownIdx,
  customerLocation,
  setCustomerLocation,
  showFavoritesOnly = false,
  setShowFavoritesOnly,
  favoritesCount = 0
}: SearchFiltersProps) {
  const { t, language } = useLanguage();

  // Location states (Preset hubs, Live GPS, or Custom Address)
  const [locationSource, setLocationSource] = useState<"preset" | "live" | "custom">(() => {
    return selectedTownIdx !== null ? "preset" : "custom";
  });
  const [customAddressInput, setCustomAddressInput] = useState<string>(() => {
    return customerLocation?.name || (selectedTownIdx !== null ? TOWN_CENTERS[selectedTownIdx]?.name : "") || "";
  });
  const [manualLatInput, setManualLatInput] = useState<string>(() => {
    const lat = customerLocation?.latitude ?? (selectedTownIdx !== null ? TOWN_CENTERS[selectedTownIdx]?.latitude : TOWN_CENTERS[0].latitude);
    return lat.toString();
  });
  const [manualLngInput, setManualLngInput] = useState<string>(() => {
    const lng = customerLocation?.longitude ?? (selectedTownIdx !== null ? TOWN_CENTERS[selectedTownIdx]?.longitude : TOWN_CENTERS[0].longitude);
    return lng.toString();
  });
  const [showManualCoords, setShowManualCoords] = useState<boolean>(false);
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [locationFeedback, setLocationFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // All-India City Search & Filter
  const [citySearchQuery, setCitySearchQuery] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [isSearchingOnlineTown, setIsSearchingOnlineTown] = useState<boolean>(false);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const citySearchInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showLocationModal) {
      const timer = setTimeout(() => {
        citySearchInputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [showLocationModal]);

  const currentLat = customerLocation?.latitude ?? (selectedTownIdx !== null ? TOWN_CENTERS[selectedTownIdx]?.latitude : TOWN_CENTERS[0].latitude);
  const currentLng = customerLocation?.longitude ?? (selectedTownIdx !== null ? TOWN_CENTERS[selectedTownIdx]?.longitude : TOWN_CENTERS[0].longitude);
  const currentLocationName = customerLocation?.name ?? (selectedTownIdx !== null ? TOWN_CENTERS[selectedTownIdx]?.name : TOWN_CENTERS[0].name);

  // Sync inputs if customerLocation changes externally
  useEffect(() => {
    if (customerLocation) {
      setCustomAddressInput(customerLocation.name);
      setManualLatInput(customerLocation.latitude.toString());
      setManualLngInput(customerLocation.longitude.toString());
      if (selectedTownIdx !== null) {
        setLocationSource("preset");
      }
    }
  }, [customerLocation, selectedTownIdx]);

  // Local storage search history state
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
        }
      }
      // First visit initialization with default popular skills
      localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_SKILLS));
      return DEFAULT_INITIAL_SKILLS;
    } catch (e) {
      console.error("Error reading search history from localStorage:", e);
      return DEFAULT_INITIAL_SKILLS;
    }
  });

  // Persist items to local storage helper
  const persistRecentSearches = useCallback((items: string[]) => {
    try {
      localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Error writing search history to localStorage:", e);
    }
  }, []);

  // Add a skill to recent searches
  const addRecentSearch = useCallback((skillName: string) => {
    if (!skillName || !skillName.trim()) return;
    const cleanName = skillName.trim();
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== cleanName.toLowerCase());
      const updated = [cleanName, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      persistRecentSearches(updated);
      return updated;
    });
  }, [persistRecentSearches]);

  // Remove a single skill search from history
  const handleRemoveRecent = (skillNameToRemove: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.toLowerCase() !== skillNameToRemove.toLowerCase());
      persistRecentSearches(updated);
      return updated;
    });
  };

  // Clear all recent skill searches
  const handleClearAllRecent = () => {
    setRecentSearches([]);
    persistRecentSearches([]);
  };

  // Quick select recent skill search
  const handleSelectRecent = (skillName: string) => {
    // If currently selected, toggle off or keep active
    if (selectedSkill === skillName) {
      setSelectedSkill(null);
    } else {
      setSelectedSkill(skillName);
      addRecentSearch(skillName);
    }
  };

  // Automatically track selectedSkill whenever it changes to a valid skill
  useEffect(() => {
    if (selectedSkill) {
      addRecentSearch(selectedSkill);
    }
  }, [selectedSkill, addRecentSearch]);

  const getTranslatedSkillLabel = (skillId: string, fallback: string) => {
    switch (skillId) {
      case "painting": return t("skillPainting");
      case "plumbing": return t("skillPlumbing");
      case "electrical": return t("skillElectrical");
      case "gardening": return t("skillGardening");
      case "tiling": return t("skillTiling");
      case "carpentry": return t("skillCarpentry");
      case "masonry": return t("skillMasonry");
      case "cleaning": return t("skillCleaning");
      default: return fallback;
    }
  };

  // Handle enter key in search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchText.trim()) {
      const query = searchText.trim().toLowerCase();
      // Match against known skills
      const matchedSkill = SKILL_OPTIONS.find(
        (s) => s.label.toLowerCase().includes(query) || s.id.toLowerCase().includes(query)
      );
      if (matchedSkill) {
        setSelectedSkill(matchedSkill.label);
        addRecentSearch(matchedSkill.label);
      } else {
        addRecentSearch(searchText.trim());
      }
    }
  };

  // Select a preset city hub from All-India catalog
  const handleSelectPresetHub = (idx: number) => {
    const town = TOWN_CENTERS[idx];
    setSelectedTownIdx(idx);
    setCustomerLocation?.(town);
    setLocationSource("preset");
    setCustomAddressInput(town.name);
    setManualLatInput(town.latitude.toString());
    setManualLngInput(town.longitude.toString());
    setShowLocationModal(false);
    setLocationFeedback({
      type: "info",
      message: `Location hub selected: ${town.name}. Searching for nearby workers within ${maxDistance >= 500 ? "All India" : maxDistance + "km"} radius.`
    });
  };

  // Search any town or district across India online
  const handleSearchOnlineTown = async (cityName: string) => {
    const query = cityName.trim();
    if (!query) return;
    setIsSearchingOnlineTown(true);
    setLocationFeedback(null);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=1&q=${encodeURIComponent(query + ", India")}`,
        {
          headers: { "Accept-Language": "en" },
          signal: controller.signal
        }
      );
      clearTimeout(timer);
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const item = results[0];
          const lat = Number(parseFloat(item.lat).toFixed(6));
          const lon = Number(parseFloat(item.lon).toFixed(6));
          const displayName = formatReverseGeocodedLocation(item.address, item.display_name);
          setSelectedTownIdx(null);
          setCustomerLocation?.({ name: displayName, latitude: lat, longitude: lon });
          setLocationSource("custom");
          setCustomAddressInput(displayName);
          setManualLatInput(lat.toString());
          setManualLngInput(lon.toString());
          setShowLocationModal(false);
          setLocationFeedback({
            type: "success",
            message: `Town found in India: ${displayName} (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E). Search radius centered here!`
          });
          setIsSearchingOnlineTown(false);
          return;
        }
      }
      setLocationFeedback({
        type: "error",
        message: `Could not pinpoint "${query}" in India. Try refining the spelling or enter coordinates manually.`
      });
    } catch {
      setLocationFeedback({
        type: "error",
        message: "Online town lookup service is temporarily unreachable. You can manually enter latitude & longitude below."
      });
    } finally {
      setIsSearchingOnlineTown(false);
    }
  };

  // Filter Indian Major Cities based on search and region
  const filteredCities = INDIAN_MAJOR_CITIES.filter((city) => {
    const matchesRegion = selectedRegion === "All" || city.region === selectedRegion;
    const q = citySearchQuery.toLowerCase().trim();
    if (!q) return matchesRegion;
    const matchesName = city.name.toLowerCase().includes(q) || (city.state && city.state.toLowerCase().includes(q));
    return matchesRegion && matchesName;
  });

  // Browser Geolocation API for Customer Live Device Location
  const handleUseCurrentLocation = () => {
    setLocationFeedback(null);
    if (!navigator.geolocation) {
      setLocationFeedback({
        type: "error",
        message: "Geolocation is not supported by your browser. Please enter your address or coordinates manually below, or select a city hub."
      });
      return;
    }

    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setSelectedTownIdx(null);
        setLocationSource("live");
        setManualLatInput(lat.toString());
        setManualLngInput(lng.toString());

        let resolvedTitle = `Live GPS (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;

        // Try reverse geocoding via OpenStreetMap Nominatim with strict timeout
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
            {
              headers: { "Accept-Language": "en" },
              signal: controller.signal
            }
          );
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            resolvedTitle = formatReverseGeocodedLocation(data.address, data.display_name);
          }
        } catch {
          // Keep default title if network fails
        }

        setCustomerLocation?.({ name: resolvedTitle, latitude: lat, longitude: lng });
        setCustomAddressInput(resolvedTitle);
        setIsLocatingGps(false);
        setShowLocationModal(false);
        setLocationFeedback({
          type: "success",
          message: `Live GPS detected: ${resolvedTitle} (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E). Searching for workers near your position!`
        });
      },
      (error) => {
        setIsLocatingGps(false);
        let message = "Unable to retrieve your current GPS location. Please select a city hub or type your address in the custom address box below.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location permission was denied. Please enter your address or coordinates manually below, or select a city hub.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "GPS satellite or network position unavailable. Please enter your address manually below or select a city hub.";
        } else if (error.code === error.TIMEOUT) {
          message = "GPS location request timed out. Please try again or type your street address below.";
        }
        setLocationFeedback({ type: "error", message });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Geocode Custom Address typed by customer anywhere in India
  const handleGeocodeAddress = async () => {
    const query = customAddressInput.trim();
    if (!query) {
      setLocationFeedback({
        type: "error",
        message: "Please enter a street, area, neighborhood, or landmark to search near."
      });
      return;
    }

    setIsGeocoding(true);
    setLocationFeedback(null);

    try {
      // Prioritize India context
      const hasCountry = query.toLowerCase().includes("india");
      const targetQuery = hasCountry ? query : `${query}, India`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=1&q=${encodeURIComponent(targetQuery)}`,
        {
          headers: { "Accept-Language": "en" },
          signal: controller.signal
        }
      );
      clearTimeout(timer);

      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const lat = Number(parseFloat(results[0].lat).toFixed(6));
          const lng = Number(parseFloat(results[0].lon).toFixed(6));
          setSelectedTownIdx(null);
          setCustomerLocation?.({ name: query, latitude: lat, longitude: lng });
          setLocationSource("custom");
          setManualLatInput(lat.toString());
          setManualLngInput(lng.toString());
          setShowLocationModal(false);
          setLocationFeedback({
            type: "success",
            message: `Address found: "${query}" (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E). Workers radius search centered here!`
          });
          setIsGeocoding(false);
          return;
        }
      }

      // Fallback without country suffix
      const fallbackRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { "Accept-Language": "en" } }
      );
      if (fallbackRes.ok) {
        const fallbackResults = await fallbackRes.json();
        if (fallbackResults && fallbackResults.length > 0) {
          const lat = Number(parseFloat(fallbackResults[0].lat).toFixed(6));
          const lng = Number(parseFloat(fallbackResults[0].lon).toFixed(6));
          setSelectedTownIdx(null);
          setCustomerLocation?.({ name: query, latitude: lat, longitude: lng });
          setLocationSource("custom");
          setManualLatInput(lat.toString());
          setManualLngInput(lng.toString());
          setShowLocationModal(false);
          setLocationFeedback({
            type: "success",
            message: `Address found: "${query}" (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E). Search updated!`
          });
          setIsGeocoding(false);
          return;
        }
      }

      setShowManualCoords(true);
      setLocationFeedback({
        type: "error",
        message: `Could not pinpoint "${query}" on the map. You can refine the address, enter coordinates directly below, or select a city hub.`
      });
    } catch {
      setShowManualCoords(true);
      setLocationFeedback({
        type: "error",
        message: "Address lookup service is temporarily unreachable. You can manually enter latitude & longitude below or pick a city hub."
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  // Apply manual coordinates
  const handleApplyManualCoords = () => {
    const lat = parseFloat(manualLatInput);
    const lng = parseFloat(manualLngInput);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setLocationFeedback({
        type: "error",
        message: "Please enter a valid latitude between -90.0 and 90.0 (e.g. 19.0760 for Mumbai, 28.6139 for Delhi, or 13.0827 for Chennai)."
      });
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setLocationFeedback({
        type: "error",
        message: "Please enter a valid longitude between -180.0 and 180.0 (e.g. 72.8777 for Mumbai, 77.2090 for Delhi, or 80.2707 for Chennai)."
      });
      return;
    }

    const title = customAddressInput.trim() || `Custom Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
    const newLoc = { name: title, latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
    setSelectedTownIdx(null);
    setCustomerLocation?.(newLoc);
    setLocationSource("custom");
    setShowLocationModal(false);
    setLocationFeedback({
      type: "success",
      message: `Custom coordinates applied: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (${title}). Search radius updated!`
    });
  };

  return (
    <div id="search-filters-container" className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
      {/* Top Search Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
        <input
          id="filter-search-input"
          type="text"
          placeholder={t("searchPlaceholder")}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-10 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-950"
        />
        {searchText && (
          <button 
            onClick={() => setSearchText("")} 
            className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            title="Clear search"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 1. Compact Location Bar (Zomato / Swiggy / Urban Company style) */}
      <div 
        id="compact-location-bar"
        data-testid="compact-location-bar"
        onClick={() => setShowLocationModal(true)}
        className="bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-200/90 hover:border-emerald-300 rounded-xl p-3 flex items-center justify-between gap-3 transition cursor-pointer group shadow-2xs"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <MapPin className="w-4 h-4 fill-white text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-mono uppercase font-bold text-emerald-800 tracking-wider">
              {t("locationHubLabel") || "Your Location"}
            </span>
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-sm font-extrabold text-slate-900 truncate">
                {currentLocationName}
              </span>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider shrink-0 ${
                locationSource === "live"
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : locationSource === "custom"
                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}>
                {locationSource === "live" ? "Live GPS" : locationSource === "custom" ? "Custom" : "City Hub"}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          id="btn-open-location-picker"
          data-testid="change-location-button"
          onClick={(e) => {
            e.stopPropagation();
            setShowLocationModal(true);
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-white group-hover:bg-emerald-700 group-hover:text-white border border-emerald-300 group-hover:border-emerald-700 px-3 py-1.5 rounded-lg shadow-2xs transition-all shrink-0 cursor-pointer"
        >
          <span>Change</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Hidden select to preserve data-testid="customer-location-select" for automated test suites */}
        <select
          id="filter-simulated-location"
          data-testid="customer-location-select"
          aria-hidden="true"
          tabIndex={-1}
          value={selectedTownIdx !== null ? selectedTownIdx : "custom"}
          onChange={(e) => {
            const val = e.target.value;
            if (val !== "custom") handleSelectPresetHub(Number(val));
          }}
          className="sr-only"
        >
          {selectedTownIdx === null && (
            <option value="custom">
              {currentLocationName}
            </option>
          )}
          {TOWN_CENTERS.map((town, idx) => (
            <option key={idx} value={idx}>
              {town.state ? `${town.state} — ${town.name.split(',')[0]}` : town.name}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Full Location Picker Modal / Mobile Sheet */}
      {showLocationModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs transition-opacity"
          onClick={() => setShowLocationModal(false)}
        >
          <div 
            className="relative w-full max-w-xl max-h-[90vh] sm:max-h-[85vh] bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
            data-testid="location-picker-modal"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {language === "kn" ? "ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಆಯ್ಕೆಮಾಡಿ" : "Select Your Location"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === "kn" ? "ಹತ್ತಿರದ ದಿನಗೂಲಿ ಕೆಲಸಗಾರರನ್ನು ಹುಡುಕಲು ಕೇಂದ್ರ ಸ್ಥಳವನ್ನು ಬದಲಿಸಿ" : "Find daily wage workers and artisans near your area"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Debug coordinates in small text inside modal only */}
                <span 
                  id="customer-search-coordinates-box"
                  data-testid="customer-search-coordinates-box"
                  className="hidden sm:inline-block text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded"
                  title="Current Coordinates"
                >
                  {currentLat.toFixed(3)}°N, {currentLng.toFixed(3)}°E
                </span>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
                  title="Close"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
              
              {/* Order Item 1: Auto-focused Search Bar to search any city/town */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                  Search City or Town across India
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    ref={citySearchInputRef}
                    type="text"
                    id="customer-city-search-filter"
                    data-testid="customer-city-search-filter"
                    placeholder="Search city (e.g. Mumbai, Bengaluru, Vijayawada, Delhi, Jaipur...)"
                    value={citySearchQuery}
                    onChange={(e) => setCitySearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && citySearchQuery.trim()) {
                        e.preventDefault();
                        if (filteredCities.length === 0) {
                          handleSearchOnlineTown(citySearchQuery);
                        } else {
                          const origIdx = INDIAN_MAJOR_CITIES.findIndex(c => c.name === filteredCities[0].name);
                          if (origIdx !== -1) handleSelectPresetHub(origIdx);
                        }
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
                  />
                  {citySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCitySearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Clear city search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Order Item 2: Use My Current Location button (directly below search bar) */}
              <button
                type="button"
                id="btn-customer-use-current-location"
                data-testid="customer-use-current-location-button"
                onClick={handleUseCurrentLocation}
                disabled={isLocatingGps}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 active:scale-[0.99] transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    {isLocatingGps ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Crosshair className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">
                      {isLocatingGps ? "Detecting GPS Position..." : "Use My Current Location"}
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      Auto-detect using device GPS & reverse geocode
                    </span>
                  </div>
                </div>

                <span className="text-xs font-bold text-emerald-700 font-mono flex items-center gap-1">
                  GPS
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* Feedback Alert if any */}
              {locationFeedback && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                  locationFeedback.type === "error"
                    ? "bg-rose-50 border-rose-200 text-rose-800"
                    : locationFeedback.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-blue-50 border-blue-200 text-blue-800"
                }`}>
                  {locationFeedback.type === "error" ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : locationFeedback.type === "success" ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  )}
                  <p className="flex-1 font-medium leading-relaxed">{locationFeedback.message}</p>
                  <button
                    type="button"
                    onClick={() => setLocationFeedback(null)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Order Item 3: Scrollable all-India city grid with region tabs */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Navigation className="w-3 h-3 text-emerald-600" />
                    <span>Popular Hubs across States & UTs</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">All 28 States & 8 UTs</span>
                </div>

                {/* Regional filter tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {["All", "South", "North", "West", "East", "Central"].map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => setSelectedRegion(region)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer shrink-0 ${
                        selectedRegion === region
                          ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>

                {/* Cities Grid */}
                <div className="max-h-52 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                  {filteredCities.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {filteredCities.map((town) => {
                        const origIdx = INDIAN_MAJOR_CITIES.findIndex(c => c.name === town.name);
                        const isSelected = (selectedTownIdx === origIdx || customerLocation?.name === town.name) && locationSource === "preset";
                        return (
                          <button
                            key={town.name}
                            type="button"
                            id={`customer-city-pill-${origIdx}`}
                            onClick={() => handleSelectPresetHub(origIdx)}
                            className={`relative flex flex-col p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30"
                                : "bg-slate-50 hover:bg-emerald-50/70 border-slate-200 text-slate-700 hover:border-emerald-300"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className={`text-[9px] font-mono uppercase tracking-wider font-bold ${isSelected ? "text-emerald-100" : "text-slate-400"}`}>
                                {town.region || "India"}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className={`text-xs font-bold leading-tight truncate ${isSelected ? "text-white" : "text-slate-900"}`}>
                              {town.name.split(",")[0]}
                            </span>
                            <span className={`text-[10px] truncate ${isSelected ? "text-emerald-100" : "text-slate-400"}`}>
                              {town.state || town.name.split(",")[1]?.trim() || "India"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3 text-center space-y-2">
                      <p className="text-xs text-slate-600">
                        No preset city found matching <strong>"{citySearchQuery}"</strong>.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSearchOnlineTown(citySearchQuery)}
                        disabled={isSearchingOnlineTown}
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-60"
                      >
                        {isSearchingOnlineTown ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Globe className="w-3.5 h-3.5" />
                        )}
                        <span>{isSearchingOnlineTown ? "Searching across India..." : `Find "${citySearchQuery}" anywhere in India`}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Item 4: Custom address input at the bottom */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
                      Search Near Custom Address / Landmark
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualCoords(!showManualCoords)}
                    className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    {showManualCoords ? "Hide Coordinates" : "Advanced Lat/Lng"}
                  </button>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      id="customer-custom-address-input"
                      data-testid="customer-custom-address-input"
                      placeholder="e.g. Bandra West, Mumbai or Kanuru, Vijayawada..."
                      value={customAddressInput}
                      onChange={(e) => setCustomAddressInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleGeocodeAddress();
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                    {customAddressInput && (
                      <button
                        type="button"
                        onClick={() => setCustomAddressInput("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title="Clear address text"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    id="btn-customer-geocode-address"
                    data-testid="customer-geocode-address-button"
                    onClick={handleGeocodeAddress}
                    disabled={isGeocoding}
                    className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-60 shrink-0"
                  >
                    {isGeocoding ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>{isGeocoding ? "Locating..." : "Locate"}</span>
                  </button>
                </div>

                {/* Collapsible Coordinates for technical/debugging use inside modal only */}
                {showManualCoords && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 mt-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                          Latitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          id="customer-manual-latitude"
                          value={manualLatInput}
                          onChange={(e) => setManualLatInput(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                          Longitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          id="customer-manual-longitude"
                          value={manualLngInput}
                          onChange={(e) => setManualLngInput(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        id="btn-customer-apply-manual-coords"
                        onClick={handleApplyManualCoords}
                        className="px-3 py-1 bg-slate-800 text-white rounded-lg text-xs font-bold"
                      >
                        Apply Coordinates
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Local Storage-based Recent Skill Searches */}
      {recentSearches.length > 0 && (
        <div 
          id="recent-skill-searches-panel"
          data-testid="recent-skill-searches"
          className="bg-emerald-50/50 border border-emerald-200/70 rounded-xl p-3 space-y-2 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-600 font-mono">
              <History className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                {t("recentSkillSearches")}
              </span>
              <span className="text-[10px] font-bold font-mono text-emerald-800 bg-white/90 border border-emerald-200/80 px-1.5 py-0.2 rounded-full shadow-2xs">
                {recentSearches.length}
              </span>
            </div>

            <button
              type="button"
              id="btn-clear-recent-searches"
              onClick={handleClearAllRecent}
              className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer px-2 py-0.5 rounded-md hover:bg-rose-50/80 border border-transparent hover:border-rose-200"
              title={t("clearHistory")}
              aria-label={t("clearHistory")}
            >
              <Trash2 className="w-3 h-3" />
              <span>{t("clearHistory")}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {recentSearches.map((skillName) => {
              const matchingSkill = SKILL_OPTIONS.find(
                (s) => s.label.toLowerCase() === skillName.toLowerCase() || s.id.toLowerCase() === skillName.toLowerCase()
              );
              const canonicalName = matchingSkill ? matchingSkill.label : skillName;
              const isSelected = selectedSkill === canonicalName;
              const displayName = matchingSkill 
                ? getTranslatedSkillLabel(matchingSkill.id, matchingSkill.label) 
                : skillName;

              return (
                <div
                  key={skillName}
                  className={`inline-flex items-center rounded-lg border text-xs transition-all shadow-2xs ${
                    isSelected 
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-xs" 
                      : "border-slate-200 bg-white hover:border-emerald-300 text-slate-700"
                  }`}
                >
                  <button
                    type="button"
                    id={`recent-skill-chip-${canonicalName.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => handleSelectRecent(canonicalName)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-l-lg font-bold transition cursor-pointer ${
                      isSelected 
                        ? "text-white" 
                        : "text-slate-700 hover:text-emerald-700"
                    }`}
                    title={`Filter by ${displayName}`}
                  >
                    {matchingSkill ? (
                      getSkillIcon(matchingSkill.icon, `w-3 h-3 ${isSelected ? "text-white" : "text-emerald-600"}`)
                    ) : (
                      <Clock className="w-3 h-3 text-slate-400" />
                    )}
                    <span>{displayName}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveRecent(skillName);
                    }}
                    className={`px-1.5 py-1 rounded-r-lg border-l transition cursor-pointer ${
                      isSelected
                        ? "border-emerald-500 text-emerald-100 hover:bg-emerald-700 hover:text-white"
                        : "border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    }`}
                    title={`Remove ${displayName} from search history`}
                    aria-label={`Remove ${displayName} from search history`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skills Chip selection group */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
            {t("skillsExpertise")}
          </label>
          {selectedSkill && (
            <button 
              onClick={() => setSelectedSkill(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              {t("resetFilters")}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            id="skill-chip-all"
            onClick={() => setSelectedSkill(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 cursor-pointer transition ${
              selectedSkill === null 
                ? "bg-emerald-100 text-emerald-700 border-emerald-300 shadow-xs" 
                : "bg-white text-slate-650 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("skillAll")}</span>
          </button>

          {SKILL_OPTIONS.map((skill) => {
            const isSelected = selectedSkill === skill.label;
            const labelText = getTranslatedSkillLabel(skill.id, skill.label);
            return (
              <button
                key={skill.id}
                id={`filter-skill-badge-${skill.id}`}
                onClick={() => setSelectedSkill(isSelected ? null : skill.label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 cursor-pointer transition ${
                  isSelected 
                    ? "bg-emerald-100 text-emerald-700 border-emerald-300 shadow-xs" 
                    : "bg-white text-slate-650 border-slate-200 hover:bg-slate-100/60"
                }`}
              >
                {getSkillIcon(skill.icon, "w-3.5 h-3.5")}
                <span>{labelText}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Distance slider & quick radius presets & Only Available toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-t border-slate-100 pt-3.5">
        
        {/* Distance Filter Panel */}
        <div className="flex-1 max-w-xl space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-650" />
              <span>{t("distanceRadiusLabel")}</span>
            </span>
            <span className="text-emerald-700 font-black font-mono lowercase">
              {maxDistance >= 500
                ? "All-India (Any Distance)"
                : language === "kn" 
                  ? `${maxDistance} ${t("km")} ${t("withinRadius")}` 
                  : `${t("withinRadius")} ${maxDistance}${t("km")}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="filter-distance-range"
              type="range"
              min={1}
              max={100}
              step={1}
              value={maxDistance >= 500 ? 100 : maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full accent-emerald-600 bg-slate-100 rounded-lg appearance-none h-2 cursor-pointer"
            />
          </div>

          {/* Quick Radius Selector Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Quick:</span>
            {[
              { label: "5 km (Nearby)", value: 5 },
              { label: "15 km", value: 15 },
              { label: "30 km", value: 30 },
              { label: "50 km", value: 50 },
              { label: "100 km", value: 100 },
              { label: "All India", value: 500 }
            ].map((preset) => {
              const isSelected = (preset.value === 500 && maxDistance >= 500) || (maxDistance === preset.value);
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setMaxDistance(preset.value)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs font-mono"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Real-time Availability & My Favorites filter toggles */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="filter-switch-availability"
            type="button"
            onClick={() => setOnlyAvailable(!onlyAvailable)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              onlyAvailable 
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" 
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
            }`}
          >
            {onlyAvailable ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
            <span>{t("onlyAvailableToday")}</span>
          </button>

          {/* My Favorites Filter Toggle Button */}
          <button
            id="filter-switch-favorites"
            data-testid="filter-my-favorites-button"
            type="button"
            onClick={() => setShowFavoritesOnly && setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              showFavoritesOnly
                ? "bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-200"
                : "bg-white text-slate-700 border-slate-200 hover:border-rose-200 hover:text-rose-700"
            }`}
            title="Filter to show only your saved favorite workers"
          >
            <Heart className={`w-4 h-4 shrink-0 ${showFavoritesOnly ? "fill-white text-white" : "text-rose-500 fill-rose-50"}`} />
            <span>{t("myFavorites")}</span>
            {typeof favoritesCount === "number" && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black ${
                showFavoritesOnly 
                  ? "bg-rose-800 text-white" 
                  : "bg-rose-100 text-rose-800"
              }`}>
                {favoritesCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
