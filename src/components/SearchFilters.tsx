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
  Heart
} from "lucide-react";
import { SKILL_OPTIONS, TOWN_CENTERS, CustomerLocation } from "../types";
import { getSkillIcon } from "./ChipGroup";
import { useLanguage } from "../context/LanguageContext";

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
  selectedTownIdx: number;
  setSelectedTownIdx: (idx: number) => void;
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
  showFavoritesOnly = false,
  setShowFavoritesOnly,
  favoritesCount = 0
}: SearchFiltersProps) {
  const { t, language } = useLanguage();
  const activeTown = TOWN_CENTERS[selectedTownIdx];

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

  return (
    <div id="search-filters-container" className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
      {/* Top row: Simulated My Location & Search bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Simulated Location Picker */}
        <div className="md:col-span-4 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Compass className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <label className="block text-[10px] font-bold text-emerald-800 tracking-wider uppercase font-mono">
                {t("locationHubLabel")}
              </label>
              <select
                id="filter-simulated-location"
                value={selectedTownIdx}
                onChange={(e) => setSelectedTownIdx(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                {TOWN_CENTERS.map((town, idx) => (
                  <option key={idx} value={idx}>
                    {town.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md font-mono shrink-0">
            Active GPS
          </span>
        </div>

        {/* Global search input with enter-key trigger */}
        <div className="md:col-span-8 relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
          <input
            id="filter-search-input"
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-950"
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
      </div>

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

      {/* Distance slider & Only Available toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-t border-slate-100 pt-3.5">
        
        {/* Distance Filter Panel */}
        <div className="flex-1 max-w-sm">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-1.5">
            <span>{t("distanceRadiusLabel")}</span>
            <span className="text-emerald-700 font-black font-mono lowercase">
              {language === "kn" 
                ? `${maxDistance} ${t("km")} ${t("withinRadius")}` 
                : `${t("withinRadius")} ${maxDistance}${t("km")}`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="filter-distance-range"
              type="range"
              min={1}
              max={30}
              step={1}
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full accent-emerald-600 bg-slate-100 rounded-lg appearance-none h-2 cursor-pointer"
            />
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
