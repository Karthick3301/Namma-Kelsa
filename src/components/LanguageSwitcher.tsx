import React, { useState, useRef, useEffect } from "react";
import { Languages, ChevronDown, Check, X } from "lucide-react";
import { useLanguage, SUPPORTED_LANGUAGES, Language } from "../context/LanguageContext";

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

export default function LanguageSwitcher({ className = "", compact = false }: LanguageSwitcherProps) {
  const { language, setLanguage, toggleLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const currentLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const handleSelectLanguage = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative inline-flex items-center select-none ${className}`}
    >
      {/* Main Header Language Toggle & Selector Button */}
      <div className="flex items-center bg-emerald-950 border border-emerald-700/80 rounded-xl p-0.5 shadow-xs">
        {/* Toggle Button: Opens language menu */}
        <button
          type="button"
          id="header-language-toggle"
          data-testid="header-language-toggle"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          title={`Language: ${currentLangInfo.name} (${currentLangInfo.nativeName}). Click to switch between English, Kannada, Tamil, Telugu, Hindi`}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:bg-emerald-850/80 transition-all duration-150 cursor-pointer active:scale-95"
        >
          <Languages className="w-4 h-4 text-emerald-300 shrink-0" />
          <span className={`font-semibold text-emerald-100 ${compact ? "hidden" : "hidden sm:inline"}`}>
            {currentLangInfo.nativeName}
          </span>
          <span className="bg-emerald-800 text-emerald-200 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
            {currentLangInfo.code}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-emerald-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Mobile Backdrop (prevents mis-taps and anchors bottom picker) */}
      {isOpen && (
        <div
          className="sm:hidden fixed inset-0 bg-black/50 backdrop-blur-[1px] z-40 animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 5-Language Menu: Thumb-friendly bottom sheet on mobile, dropdown on desktop */}
      {isOpen && (
        <div 
          className="fixed inset-x-3 bottom-3 sm:inset-auto sm:absolute sm:top-full sm:right-0 sm:mt-1.5 sm:w-56 bg-emerald-950/98 backdrop-blur-md border border-emerald-700/90 rounded-2xl shadow-2xl p-2 sm:p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 sm:slide-in-from-top-1 duration-150 max-h-[80vh] overflow-y-auto"
          role="listbox"
          aria-label="Select platform language"
        >
          <div className="px-2.5 py-2 sm:py-1.5 mb-1.5 sm:mb-1 border-b border-emerald-800/60 flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              Select Language / ಭಾಷೆ
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-300/80 font-mono">
                5 Languages
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="sm:hidden p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors cursor-pointer"
                aria-label="Close language menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-1 sm:space-y-0.5">
            {SUPPORTED_LANGUAGES.map((langItem) => {
              const isSelected = language === langItem.code;
              return (
                <button
                  key={langItem.code}
                  type="button"
                  id={`lang-btn-${langItem.code}`}
                  data-testid={`lang-btn-${langItem.code}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectLanguage(langItem.code)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-emerald-100 hover:bg-emerald-900/80 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-2.5 text-left">
                    <span className={`w-7 h-7 sm:w-5 sm:h-5 rounded-lg sm:rounded-md flex items-center justify-center font-bold text-xs sm:text-[11px] ${
                      isSelected ? "bg-emerald-700 text-white" : "bg-emerald-900 text-emerald-300"
                    }`}>
                      {langItem.symbol}
                    </span>
                    <div>
                      <div className="font-extrabold leading-tight text-sm sm:text-xs text-white">
                        {langItem.nativeName}
                      </div>
                      <div className={`text-[11px] sm:text-[10px] leading-none mt-0.5 font-medium ${
                        isSelected ? "text-emerald-100" : "text-emerald-400"
                      }`}>
                        {langItem.name}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-white shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
