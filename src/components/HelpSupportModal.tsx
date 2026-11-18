import React, { useEffect, useRef, useState } from "react";
import {
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Phone,
  Copy,
  Check
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

// Replace these placeholder support contact details with your live support number & email
export const SUPPORT_PHONE_NUMBER = "919999999999";
export const SUPPORT_EMAIL = "support@nammakelasa.in";

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAQ_ITEMS = [
  { qKey: "faq1Q", aKey: "faq1A" },
  { qKey: "faq2Q", aKey: "faq2A" },
  { qKey: "faq3Q", aKey: "faq3A" },
  { qKey: "faq4Q", aKey: "faq4A" },
  { qKey: "faq5Q", aKey: "faq5A" }
] as const;

export default function HelpSupportModal({ isOpen, onClose }: HelpSupportModalProps) {
  const { t } = useLanguage();
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [emailCopied, setEmailCopied] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Reset transient copied feedback when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmailCopied(false);
    }
  }, [isOpen]);

  // Keyboard accessibility: focus trap, Esc to close, restore focus
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusable = Array.from<HTMLElement>(
          dialogRef.current.querySelectorAll(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null || el === document.activeElement);

        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocusRef.current && document.body.contains(previousFocusRef.current)) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  const handleCopyEmail = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(SUPPORT_EMAIL);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = SUPPORT_EMAIL;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setEmailCopied(true);
      window.setTimeout(() => setEmailCopied(false), 2500);
    } catch {
      // Fallback: still attempt execCommand if clipboard permission denied
      setEmailCopied(true);
      window.setTimeout(() => setEmailCopied(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("needHelpTitle")}
        data-testid="help-support-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] box-border bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
      >
        {/* Mobile Sheet Handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 shrink-0 box-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
              {t("needHelpTitle")}
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            id="btn-close-help-modal"
            data-testid="close-help-modal-button"
            onClick={onClose}
            aria-label={t("closeBtn")}
            title={t("closeBtn")}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-5 box-border">
          {/* Section A: Common Questions */}
          <section className="space-y-2.5 w-full max-w-full box-border">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-mono">
              {t("commonQuestionsTitle")}
            </h3>

            <div className="space-y-2 w-full max-w-full box-border">
              {FAQ_ITEMS.map((item, idx) => {
                const isExpanded = openFaqIdx === idx;
                return (
                  <div
                    key={item.qKey}
                    className="w-full max-w-full box-border rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden"
                  >
                    <button
                      type="button"
                      id={`help-faq-toggle-${idx}`}
                      aria-expanded={isExpanded}
                      aria-controls={`help-faq-panel-${idx}`}
                      onClick={() => setOpenFaqIdx(isExpanded ? null : idx)}
                      className="w-full min-h-[44px] flex items-center justify-between gap-2.5 px-3.5 py-2.5 text-left hover:bg-slate-100/70 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 box-border"
                    >
                      <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug min-w-0 flex-1 break-words">
                        {t(item.qKey)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div
                        id={`help-faq-panel-${idx}`}
                        className="px-3.5 pb-3 pt-1 text-xs sm:text-[13px] text-slate-600 leading-relaxed bg-white border-t border-slate-100 break-words"
                      >
                        {t(item.aKey)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section B: Contact Us */}
          <section className="space-y-2.5 w-full max-w-full box-border pt-1 border-t border-slate-100">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-mono">
              {t("contactUsTitle")}
            </h3>

            <div className="grid grid-cols-1 gap-2.5 w-full max-w-full box-border">
              {/* Chat on WhatsApp */}
              <a
                href={`https://wa.me/${SUPPORT_PHONE_NUMBER}`}
                id="btn-help-whatsapp"
                data-testid="help-whatsapp-button"
                className="w-full min-h-[44px] box-border flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span className="break-words text-center">{t("chatOnWhatsappBtn")}</span>
              </a>

              {/* Call Support */}
              <a
                href={`tel:${SUPPORT_PHONE_NUMBER}`}
                id="btn-help-call"
                data-testid="help-call-button"
                className="w-full min-h-[44px] box-border flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 active:scale-[0.99] text-emerald-900 border border-emerald-200 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition"
              >
                <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="break-words text-center">{t("callSupportBtn")}</span>
              </a>

              {/* Copy Support Email */}
              <button
                type="button"
                id="btn-help-copy-email"
                data-testid="help-copy-email-button"
                onClick={handleCopyEmail}
                className={`w-full min-h-[44px] box-border flex items-center justify-center gap-2 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl border transition cursor-pointer active:scale-[0.99] ${
                  emailCopied
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                {emailCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span>{t("copiedCheck")}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="break-words text-center">{t("copySupportEmailBtn")}</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center font-mono break-all pt-0.5">
              {SUPPORT_EMAIL}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
