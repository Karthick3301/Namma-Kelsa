import { 
  Paintbrush, 
  Droplet, 
  Zap, 
  Leaf, 
  Grid, 
  Hammer, 
  Construction, 
  Sparkles,
  Search
} from "lucide-react";
import { SKILL_OPTIONS } from "../types";

// Dynamic icon resolver
export function getSkillIcon(iconName: string, className = "w-4 h-4") {
  switch (iconName) {
    case "Paintbrush": return <Paintbrush className={className} />;
    case "Droplets": return <Droplet className={className} />;
    case "Zap": return <Zap className={className} />;
    case "Leaf": return <Leaf className={className} />;
    case "Grid": return <Grid className={className} />;
    case "Hammer": return <Hammer className={className} />;
    case "Construction": return <Construction className={className} />;
    case "Sparkles": return <Sparkles className={className} />;
    default: return <Search className={className} />;
  }
}

interface ChipGroupProps {
  selectedSkills: string[];
  onChange: (skills: string[]) => void;
  maxSelections?: number;
}

export default function ChipGroup({ 
  selectedSkills, 
  onChange, 
  maxSelections 
}: ChipGroupProps) {
  
  const handleToggle = (skillLabel: string) => {
    if (selectedSkills.includes(skillLabel)) {
      onChange(selectedSkills.filter(s => s !== skillLabel));
    } else {
      if (maxSelections && selectedSkills.length >= maxSelections) {
        return; // limit selections
      }
      onChange([...selectedSkills, skillLabel]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2.5 my-2">
      {SKILL_OPTIONS.map((skill) => {
        const isSelected = selectedSkills.includes(skill.label);
        return (
          <button
            key={skill.id}
            type="button"
            id={`chip-skill-${skill.id}`}
            onClick={() => handleToggle(skill.label)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer border ${
              isSelected
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100 scale-[1.02]"
                : "bg-white text-slate-750 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/10"
            }`}
          >
            {getSkillIcon(skill.icon, "w-4 h-4 shrink-0")}
            <span>{skill.label}</span>
          </button>
        );
      })}
    </div>
  );
}
