import React, { useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { Sparkles, Sliders, Award, Info, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export interface SkillRadarChartProps {
  skills: string[];
  skillProficiencies?: Record<string, number>;
  onChangeProficiency?: (skill: string, value: number) => void;
  isEditable?: boolean;
  experienceYears?: number;
}

interface RadarDataPoint {
  subject: string;
  proficiency: number;
  fullMark: number;
  isTradeSkill: boolean;
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({
  skills = [],
  skillProficiencies = {},
  onChangeProficiency,
  isEditable = true,
  experienceYears = 3
}) => {
  const { t, language } = useLanguage();

  // Baseline proficiency helper based on experience if unrated
  const getInitialProficiency = (skill: string): number => {
    if (skillProficiencies && typeof skillProficiencies[skill] === "number") {
      return skillProficiencies[skill];
    }
    // Smart baseline: 75% base + 2% per year of experience (capped at 95%)
    return Math.min(95, Math.max(65, 75 + Math.min(experienceYears, 10) * 2));
  };

  // Fixed foundational craftsmanship benchmarks to ensure radar geometry is valid (>= 3 points)
  const craftBenchmarks = useMemo(() => {
    return [
      {
        subject: language === "kn" ? "ಕೆಲಸದ ಗುಣಮಟ್ಟ" : "Work Quality",
        proficiency: 92,
        fullMark: 100,
        isTradeSkill: false
      },
      {
        subject: language === "kn" ? "ಸಮಯಪಾಲನೆ" : "Punctuality",
        proficiency: 90,
        fullMark: 100,
        isTradeSkill: false
      },
      {
        subject: language === "kn" ? "ಸುರಕ್ಷತೆ ಮತ್ತು ಉಪಕರಣ" : "Safety & Tools",
        proficiency: 88,
        fullMark: 100,
        isTradeSkill: false
      }
    ];
  }, [language]);

  // Construct chart data points
  const radarData: RadarDataPoint[] = useMemo(() => {
    if (skills.length === 0) {
      return [];
    }

    const tradePoints: RadarDataPoint[] = skills.map((skill) => ({
      subject: skill,
      proficiency: skillProficiencies[skill] ?? getInitialProficiency(skill),
      fullMark: 100,
      isTradeSkill: true
    }));

    // If fewer than 3 skills, blend with foundational craft benchmarks so polygon closes cleanly
    if (tradePoints.length === 1) {
      return [
        tradePoints[0],
        craftBenchmarks[0],
        craftBenchmarks[1],
        craftBenchmarks[2]
      ];
    }

    if (tradePoints.length === 2) {
      return [
        tradePoints[0],
        craftBenchmarks[0],
        tradePoints[1],
        craftBenchmarks[1]
      ];
    }

    return tradePoints;
  }, [skills, skillProficiencies, experienceYears, craftBenchmarks]);

  // Calculate overall average mastery
  const averageProficiency = useMemo(() => {
    if (skills.length === 0) return 0;
    const total = skills.reduce((sum, skill) => {
      const val = skillProficiencies[skill] ?? getInitialProficiency(skill);
      return sum + val;
    }, 0);
    return Math.round(total / skills.length);
  }, [skills, skillProficiencies, experienceYears]);

  // Level classification badge
  const getProficiencyTier = (val: number) => {
    if (val >= 90) return { label: "Master", color: "text-amber-700 bg-amber-100 border-amber-300" };
    if (val >= 80) return { label: "Advanced", color: "text-emerald-700 bg-emerald-100 border-emerald-300" };
    if (val >= 70) return { label: "Skilled", color: "text-blue-700 bg-blue-100 border-blue-300" };
    return { label: "Competent", color: "text-slate-700 bg-slate-100 border-slate-300" };
  };

  // Custom Radar Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as RadarDataPoint;
      const tier = getProficiencyTier(data.proficiency);
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl shadow-xl border border-slate-700 text-xs">
          <p className="font-bold text-emerald-400">{data.subject}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-black font-mono">{data.proficiency}%</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${tier.color}`}>
              {tier.label}
            </span>
          </div>
          {!data.isTradeSkill && (
            <p className="text-[10px] text-slate-400 mt-1 italic">
              Craftsmanship Baseline
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="skill-radar-container"
      data-testid="worker-skill-radar-chart"
      className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl border border-emerald-100 p-4 sm:p-5 shadow-xs space-y-4"
    >
      {/* Header with Title and Average Mastery Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>{t("skillRadarTitle")}</span>
              <span className="text-[10px] font-sans font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Recharts
              </span>
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {t("skillRadarSubtitle")}
          </p>
        </div>

        {skills.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">
              {t("overallMastery")}:
            </span>
            <span className="text-sm font-black text-emerald-700 font-mono">
              {averageProficiency}%
            </span>
            <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${getProficiencyTier(averageProficiency).color}`}>
              {getProficiencyTier(averageProficiency).label}
            </span>
          </div>
        )}
      </div>

      {/* Main Content Area: Radar Canvas & Interactive Sliders */}
      {skills.length === 0 ? (
        <div className="py-8 px-4 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-700">
            {t("selectSkillsFirstForRadar")}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
            Choose your skills from the tags above (e.g. Painting, Plumbing, Carpentry) to generate a personalized radar competency map.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Radar Chart Display */}
          <div className="md:col-span-6 flex flex-col items-center justify-center bg-white/90 rounded-xl border border-slate-200/80 p-2 shadow-2xs">
            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#334155", fontSize: 11, fontWeight: 700 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    stroke="#94a3b8"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                  />
                  <Radar
                    name="Proficiency"
                    dataKey="proficiency"
                    stroke="#059669"
                    fill="#10b981"
                    fillOpacity={0.45}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#047857", stroke: "#ffffff", strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: "#065f46" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-1">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>Self-Assessed Score (0-100)</span>
              </span>
              {skills.length < 3 && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Info className="w-3 h-3" />
                  <span>Padded with Core Standards</span>
                </span>
              )}
            </div>
          </div>

          {/* Interactive Proficiency Tuning Sliders */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fine-Tune Skill Proficiencies</span>
              </label>
              <span className="text-[10px] text-slate-400">
                Live updates chart
              </span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {skills.map((skill) => {
                const currentVal = skillProficiencies[skill] ?? getInitialProficiency(skill);
                const tier = getProficiencyTier(currentVal);

                return (
                  <div
                    key={skill}
                    id={`skill-proficiency-slider-row-${skill.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                    className="p-2.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-bold text-slate-800">{skill}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {currentVal}%
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${tier.color}`}>
                          {tier.label}
                        </span>
                      </div>
                    </div>

                    {isEditable && onChangeProficiency ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">50%</span>
                        <input
                          type="range"
                          min={50}
                          max={100}
                          step={5}
                          value={currentVal}
                          onChange={(e) => onChangeProficiency(skill, Number(e.target.value))}
                          id={`slider-proficiency-${skill.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                          data-testid={`slider-proficiency-${skill.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                          className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">100%</span>
                      </div>
                    ) : (
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${currentVal}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Presets / Help */}
            {isEditable && onChangeProficiency && (
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 text-[10px]">
                <span className="text-slate-400 font-mono">Quick Set All:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => skills.forEach(s => onChangeProficiency(s, 75))}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition cursor-pointer"
                  >
                    Competent (75%)
                  </button>
                  <button
                    type="button"
                    onClick={() => skills.forEach(s => onChangeProficiency(s, 85))}
                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-bold border border-emerald-200 transition cursor-pointer"
                  >
                    Advanced (85%)
                  </button>
                  <button
                    type="button"
                    onClick={() => skills.forEach(s => onChangeProficiency(s, 95))}
                    className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded font-bold border border-amber-200 transition cursor-pointer"
                  >
                    Master (95%)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillRadarChart;
