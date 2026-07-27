import { 
  Search, 
  MapPin, 
  SlidersHorizontal, 
  Sparkles, 
  X,
  Compass,
  Zap,
  Check
} from "lucide-react";
import { SKILL_OPTIONS, TOWN_CENTERS, CustomerLocation } from "../types";
import { getSkillIcon } from "./ChipGroup";

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
  setSelectedTownIdx
}: SearchFiltersProps) {

  const activeTown = TOWN_CENTERS[selectedTownIdx];

  return (
    <div id="search-filters-container" className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
      {/* Top row: Simulated My Location & Search bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Simulated Location Picker */}
        <div className="md:col-span-4 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Compass className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <label className="block text-[10px] font-bold text-emerald-800 tracking-wider uppercase font-mono">My Home Coordinates</label>
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

        {/* Global search input */}
        <div className="md:col-span-8 relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
          <input
            id="filter-search-input"
            type="text"
            placeholder="Search workers by name or location name..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-950"
          />
          {searchText && (
            <button 
              onClick={() => setSearchText("")} 
              className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Skills Chip selection group */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
            Filter by Skill Type
          </label>
          {selectedSkill && (
            <button 
              onClick={() => setSelectedSkill(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              Clear filter
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
            <span>Show All Options</span>
          </button>

          {SKILL_OPTIONS.map((skill) => {
            const isSelected = selectedSkill === skill.label;
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
                <span>{skill.label}</span>
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
            <span>Range Limit</span>
            <span className="text-emerald-700 font-black font-mono lowercase">Within {maxDistance}km from Me</span>
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

        {/* Real-time Availability checkbox/pill */}
        <div className="flex items-center gap-3 bg-slate-50/50 p-2 border border-slate-200 rounded-xl">
          <button
            id="filter-switch-availability"
            type="button"
            onClick={() => setOnlyAvailable(!onlyAvailable)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              onlyAvailable 
                ? "bg-emerald-600 text-white shadow-xs" 
                : "bg-white text-slate-705 border border-slate-200 hover:border-slate-300"
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
            <span>Show Available Workers Only</span>
          </button>
        </div>
      </div>
    </div>
  );
}
