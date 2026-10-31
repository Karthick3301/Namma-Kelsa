import React, { useState } from "react";
import { 
  Search, 
  Wrench, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Phone,
  Mail,
  Briefcase,
  Users,
  Loader2
} from "lucide-react";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType, auth } from "../firebase";
import { UserRole } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface RoleSelectionProps {
  uid: string;
  phoneNumber?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  onRoleSelected: (role: UserRole) => void;
}

export default function RoleSelection({ 
  uid, 
  phoneNumber, 
  email, 
  displayName,
  photoURL,
  onRoleSelected 
}: RoleSelectionProps) {
  const { t, language } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmRole = async () => {
    if (!selectedRole) {
      setError(
        language === "kn"
          ? "ದಯವಿಟ್ಟು ಮುಂದುವರಿಯಲು ಒಂದು ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ."
          : "Please select an option to continue."
      );
      return;
    }

    setSaving(true);
    setError(null);

    // If demo mode user, bypass Firestore write to avoid permission errors
    if (uid.startsWith("demo-") || uid.startsWith("mock-")) {
      try {
        localStorage.setItem(`namma_kelsa_user_role_${uid}`, selectedRole);
      } catch (e) {
        // ignore
      }
      setSaving(false);
      onRoleSelected(selectedRole);
      return;
    }

    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      const effectivePhone = phoneNumber || auth.currentUser?.phoneNumber || "";
      const effectiveEmail = email || auth.currentUser?.email || "";
      const effectiveName = displayName || auth.currentUser?.displayName || "";
      const effectivePhoto = photoURL || auth.currentUser?.photoURL || "";

      const payload: any = {
        uid,
        role: selectedRole,
        updatedAt: serverTimestamp(),
      };
      if (effectivePhone) payload.phoneNumber = effectivePhone;
      if (effectiveEmail) payload.email = effectiveEmail;
      if (effectiveName) payload.displayName = effectiveName;
      if (effectivePhoto) payload.photoURL = effectivePhoto;

      if (userSnap.exists()) {
        await updateDoc(userRef, payload);
      } else {
        await setDoc(userRef, {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      onRoleSelected(selectedRole);
    } catch (err) {
      console.warn("Could not save user role to Firestore, persisting to local cache:", err);
      try {
        localStorage.setItem(`namma_kelsa_user_role_${uid}`, selectedRole);
      } catch (e) {
        // ignore
      }
      // Proceed gracefully so user is never trapped
      onRoleSelected(selectedRole);
    } finally {
      setSaving(false);
    }
  };

  const displayPhone = phoneNumber || auth.currentUser?.phoneNumber;
  const displayEmail = email || auth.currentUser?.email;
  const displayDisplayName = displayName || auth.currentUser?.displayName;
  const displayPhoto = photoURL || auth.currentUser?.photoURL;

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Banner */}
        <div className="bg-emerald-900 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          {displayPhoto ? (
            <img
              src={displayPhoto}
              alt={displayDisplayName || "User Avatar"}
              className="w-16 h-16 rounded-2xl mx-auto border-2 border-emerald-400 shadow-md mb-3 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center font-bold text-2xl text-white shadow-md mb-3">
              NK
            </div>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800 text-emerald-200 text-xs font-bold tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            {language === "kn" ? "ಸ್ವಾಗತ!" : "Welcome to Namma Kelasa"}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {language === "kn" ? "ನಿಮ್ಮ ಮುಖ್ಯ ಉದ್ದೇಶವೇನು?" : "What brings you here today?"}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200 mt-1 max-w-md mx-auto">
            {language === "kn"
              ? "ನಿಮ್ಮ ಅಗತ್ಯಕ್ಕೆ ತಕ್ಕಂತೆ ಅಪ್ಲಿಕೇಶನ್ ಅನ್ನು ಸಿದ್ಧಪಡಿಸಲು ಒಂದು ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ. ನಂತರ ನೀವು ಯಾವಾಗ ಬೇಕಾದರೂ ಬದಲಾಯಿಸಬಹುದು."
              : "Choose how you want to use Namma Kelasa. You can easily switch between roles at any time."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            {displayDisplayName && (
              <div className="w-full text-center text-xs font-bold text-white mb-0.5">
                <span>Signed in as </span>
                <span className="text-emerald-300 font-extrabold">{displayDisplayName}</span>
              </div>
            )}
            {displayPhone && (
              <div className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>{displayPhone}</span>
              </div>
            )}
            {displayEmail && (
              <div className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
                <Mail className="w-3 h-3 text-emerald-400" />
                <span>{displayEmail}</span>
              </div>
            )}
          </div>
        </div>

        {/* Role Options */}
        <div className="p-6 sm:p-8 space-y-4">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Option 1: Customer (Find Workers) */}
            <button
              type="button"
              id="role-select-customer"
              data-testid="role-option-customer"
              onClick={() => {
                setSelectedRole("customer");
                setError(null);
              }}
              className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between group ${
                selectedRole === "customer"
                  ? "bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 shadow-md"
                  : "bg-slate-50/60 hover:bg-slate-100/70 border-slate-200 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    selectedRole === "customer"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-white text-slate-700 border border-slate-200 group-hover:scale-105"
                  }`}>
                    <Search className="w-6 h-6" />
                  </div>
                  {selectedRole === "customer" && (
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                  {language === "kn" ? "ಕೆಲಸಗಾರರನ್ನು ಹುಡುಕಿ" : "I'm looking to hire"}
                </h3>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mt-0.5">
                  {language === "kn" ? "ಗ್ರಾಹಕರ ಮೋಡ್" : "Customer / Client"}
                </span>

                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  {language === "kn"
                    ? "ನಿಮ್ಮ ಹತ್ತಿರದ ದೈನಂದಿನ ಕೆಲಸಗಾರರನ್ನು ಹುಡುಕಿ. ಬಡಗಿಗಳು, ಎಲೆಕ್ಟ್ರಿಷಿಯನ್‌ಗಳು, ಪ್ಲಂಬರ್‌ಗಳು ಮತ್ತು ಪೇಂಟರ್‌ಗಳಿಗೆ ನೇರವಾಗಿ ಕರೆ ಮಾಡಿ."
                    : "Find local skilled artisans nearby. View daily rates, check reviews, and directly dial independent workers for home or commercial jobs."}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-md text-slate-600 border border-slate-200 font-mono">
                  {language === "kn" ? "ನೇರ ಕರೆ" : "Direct Dial"}
                </span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-md text-slate-600 border border-slate-200 font-mono">
                  {language === "kn" ? "0% ಕಮಿಷನ್" : "Zero Commission"}
                </span>
              </div>
            </button>

            {/* Option 2: Worker (Artisan Profile) */}
            <button
              type="button"
              id="role-select-worker"
              data-testid="role-option-worker"
              onClick={() => {
                setSelectedRole("worker");
                setError(null);
              }}
              className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between group ${
                selectedRole === "worker"
                  ? "bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 shadow-md"
                  : "bg-slate-50/60 hover:bg-slate-100/70 border-slate-200 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    selectedRole === "worker"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-white text-slate-700 border border-slate-200 group-hover:scale-105"
                  }`}>
                    <Wrench className="w-6 h-6" />
                  </div>
                  {selectedRole === "worker" && (
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                  {language === "kn" ? "ನಾನು ಕೆಲಸ ಹುಡುಕುತ್ತಿದ್ದೇನೆ" : "I'm looking for work"}
                </h3>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mt-0.5">
                  {language === "kn" ? "ಕೆಲಸಗಾರ / ಕುಶಲಕರ್ಮಿ" : "Skilled Worker / Artisan"}
                </span>

                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  {language === "kn"
                    ? "ನಿಮ್ಮ ಡಿಜಿಟಲ್ ಪ್ರೊಫೈಲ್ ರಚಿಸಿ, ದಿನಗೂಲಿ ದರ ನಿಗದಿಪಡಿಸಿ, ನೈಪುಣ್ಯಗಳನ್ನು ಪ್ರದರ್ಶಿಸಿ ಮತ್ತು ಗ್ರಾಹಕರಿಂದ ನೇರ ಕೆಲಸದ ಕರೆಗಳನ್ನು ಪಡೆಯಿರಿ."
                    : "Create your verified trade profile, set your daily wage rate (₹), display work photos, and receive direct phone calls from local customers."}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-md text-slate-600 border border-slate-200 font-mono">
                  {language === "kn" ? "ದೈನಂದಿನ ಕೂಲಿ" : "Daily Wage Rate"}
                </span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-md text-slate-600 border border-slate-200 font-mono">
                  {language === "kn" ? "ನೇರ ಗ್ರಾಹಕರು" : "Direct Clients"}
                </span>
              </div>
            </button>

          </div>

          {/* Action Button */}
          <div className="pt-3">
            <button
              type="button"
              id="btn-confirm-role"
              data-testid="confirm-role-button"
              onClick={handleConfirmRole}
              disabled={!selectedRole || saving}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{language === "kn" ? "ಉಳಿಸಲಾಗುತ್ತಿದೆ..." : "Setting up your account..."}</span>
                </>
              ) : (
                <>
                  <span>
                    {selectedRole === "customer"
                      ? (language === "kn" ? "ಕೆಲಸಗಾರರನ್ನು ಹುಡುಕಿ →" : "Continue to Find Workers")
                      : selectedRole === "worker"
                      ? (language === "kn" ? "ಪ್ರೊಫೈಲ್ ರಚಿಸಿ →" : "Continue to Worker Profile")
                      : (language === "kn" ? "ಮುಂದುವರಿಯಿರಿ" : "Select an option to continue")}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
              {language === "kn"
                ? "ಖಾತೆಯ ಸೌಲಭ್ಯಗಳನ್ನು ನಂತರ ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ಬದಲಾಯಿಸಬಹುದು."
                : "You can toggle between Find Workers and Worker Profile anytime from the header."}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
