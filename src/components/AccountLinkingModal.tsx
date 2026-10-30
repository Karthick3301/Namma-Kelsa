import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Phone, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  RotateCw,
  KeyRound,
  Link as LinkIcon
} from "lucide-react";
import { 
  User, 
  RecaptchaVerifier, 
  linkWithPhoneNumber, 
  linkWithCredential, 
  linkWithPopup,
  EmailAuthProvider,
  ConfirmationResult 
} from "firebase/auth";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";
import { useLanguage } from "../context/LanguageContext";

interface AccountLinkingModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

export default function AccountLinkingModal({
  user,
  isOpen,
  onClose,
  onProfileUpdated,
}: AccountLinkingModalProps) {
  const { t, language } = useLanguage();

  // Active view: 'status' | 'linkPhone' | 'linkPhoneOtp' | 'linkEmail'
  const [view, setView] = useState<"status" | "linkPhone" | "linkPhoneOtp" | "linkEmail">("status");

  // Phone linking state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Email linking state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Loading and feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check providers
  const isPhoneLinked = !!user.phoneNumber || user.providerData.some(p => p.providerId === "phone");
  const isEmailLinked = !!user.email || user.providerData.some(p => p.providerId === "password");
  const isGoogleLinked = user.providerData.some(p => p.providerId === "google.com");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setView("status");
      setError(null);
      setSuccess(null);
      setPhoneNumber("");
      setOtp(["", "", "", "", "", ""]);
      setEmail("");
      setPassword("");
    }
  }, [isOpen]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Setup reCAPTCHA verifier for linking
  const getOrCreateRecaptchaVerifier = (): RecaptchaVerifier => {
    if ((window as any).linkRecaptchaVerifier) {
      return (window as any).linkRecaptchaVerifier;
    }

    const verifier = new RecaptchaVerifier(auth, "link-recaptcha-container", {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {
        setError("reCAPTCHA expired. Please try again.");
      },
    });

    (window as any).linkRecaptchaVerifier = verifier;
    return verifier;
  };

  // 1. Send OTP to link phone number
  const handleSendLinkPhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);

    const clean = phoneNumber.trim().replace(/\D/g, "");
    if (clean.length !== 10) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setLoading(true);
    try {
      const verifier = getOrCreateRecaptchaVerifier();
      const fullPhone = `+91${clean}`;
      const result = await linkWithPhoneNumber(user, fullPhone, verifier);
      setConfirmationResult(result);
      setView("linkPhoneOtp");
      setResendCooldown(30);
      setSuccess(`OTP sent to +91 ${clean}. Please enter the 6-digit code below.`);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 150);
    } catch (err: any) {
      console.error("Link phone error:", err);
      if (err.code === "auth/credential-already-in-use") {
        setError("This phone number is already linked to another account.");
      } else if (err.code === "auth/invalid-phone-number") {
        setError("Invalid phone number format.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a few minutes.");
      } else {
        setError(err.message || "Failed to send OTP for account linking.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP to complete phone linking
  const handleVerifyLinkPhoneOtp = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || otp.join("");
    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    if (!confirmationResult) {
      setError("Session expired. Please request a new OTP.");
      setView("linkPhone");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const userCred = await confirmationResult.confirm(fullCode);
      const linkedPhone = userCred.user.phoneNumber || `+91${phoneNumber}`;

      // Update Firestore user document
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          phoneNumber: linkedPhone,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn("Could not sync linked phone to Firestore doc:", err);
      }

      setSuccess(`Phone number ${linkedPhone} successfully linked to your account!`);
      setView("status");
      onProfileUpdated?.();
    } catch (err: any) {
      console.error("Verify link OTP error:", err);
      if (err.code === "auth/invalid-verification-code") {
        setError("Incorrect OTP code. Please check and try again.");
      } else if (err.code === "auth/code-expired") {
        setError("OTP has expired. Please tap 'Resend OTP'.");
      } else {
        setError(err.message || "Failed to verify OTP.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Link Email & Password to current account
  const handleLinkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(cleanEmail, password);
      await linkWithCredential(user, credential);

      // Update Firestore user document
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          email: cleanEmail,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn("Could not sync linked email to Firestore doc:", err);
      }

      setSuccess(`Email ${cleanEmail} successfully linked to your account!`);
      setView("status");
      onProfileUpdated?.();
    } catch (err: any) {
      console.error("Link email error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email address is already in use by another account.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email format.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "Failed to link email address.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Link Google Account to current account
  const handleLinkGoogle = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const result = await linkWithPopup(user, googleProvider);
      const googleUser = result.user;

      // Update Firestore user document
      try {
        const userRef = doc(db, "users", user.uid);
        const updates: any = { updatedAt: serverTimestamp() };
        if (googleUser.email) updates.email = googleUser.email;
        if (googleUser.displayName) updates.displayName = googleUser.displayName;
        if (googleUser.photoURL) updates.photoURL = googleUser.photoURL;
        await updateDoc(userRef, updates);
      } catch (err) {
        console.warn("Could not sync linked Google details to Firestore doc:", err);
      }

      setSuccess(`Google account (${googleUser.email || googleUser.displayName}) successfully linked!`);
      onProfileUpdated?.();
    } catch (err: any) {
      console.error("Link Google error:", err);
      if (err.code === "auth/credential-already-in-use") {
        setError("This Google account is already linked to another user profile.");
      } else if (err.code === "auth/popup-closed-by-user") {
        // User closed window
      } else {
        setError(err.message || "Failed to link Google account.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = clean;
    setOtp(newOtp);
    setError(null);

    if (clean && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
    if (newOtp.join("").length === 6) {
      handleVerifyLinkPhoneOtp(newOtp.join(""));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div id="link-recaptcha-container" />

      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white">
              <LinkIcon className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight text-white">Account Security</h3>
              <p className="text-[11px] text-emerald-300">Linked Login Methods</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* VIEW: Status overview */}
          {view === "status" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect multiple sign-in methods to your single account. You can log in using either your verified Phone Number or Email address.
              </p>

              <div className="space-y-3 pt-1">
                
                {/* Method 1: Phone */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-700 shadow-2xs">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">Phone Number</span>
                        {isPhoneLinked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <Check className="w-3 h-3 text-emerald-600" /> Linked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold">
                            Not Linked
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {user.phoneNumber || "No phone linked"}
                      </p>
                    </div>
                  </div>

                  {!isPhoneLinked && (
                    <button
                      type="button"
                      onClick={() => {
                        setView("linkPhone");
                        setError(null);
                        setSuccess(null);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer"
                    >
                      Link Phone
                    </button>
                  )}
                </div>

                {/* Method 2: Email */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-700 shadow-2xs">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">Email Address</span>
                        {isEmailLinked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <Check className="w-3 h-3 text-emerald-600" /> Linked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold">
                            Not Linked
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5 truncate max-w-[170px]">
                        {user.email || "No email linked"}
                      </p>
                    </div>
                  </div>

                  {!isEmailLinked && (
                    <button
                      type="button"
                      onClick={() => {
                        setView("linkEmail");
                        setError(null);
                        setSuccess(null);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer"
                    >
                      Link Email
                    </button>
                  )}
                </div>

                {/* Method 3: Google */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">Google Account</span>
                        {isGoogleLinked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <Check className="w-3 h-3 text-emerald-600" /> Linked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold">
                            Not Linked
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5 truncate max-w-[170px]">
                        {isGoogleLinked ? (user.email || user.displayName || "Google Account") : "No Google account linked"}
                      </p>
                    </div>
                  </div>

                  {!isGoogleLinked && (
                    <button
                      type="button"
                      onClick={handleLinkGoogle}
                      disabled={loading}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer"
                    >
                      Link Google
                    </button>
                  )}
                </div>

              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* VIEW: Link Phone - Enter Number */}
          {view === "linkPhone" && (
            <form onSubmit={handleSendLinkPhoneOtp} className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Link Mobile Number</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your 10-digit Indian phone number to receive an SMS verification code.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-600">
                  Mobile Number (India)
                </label>
                <div className="flex items-center rounded-xl border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 overflow-hidden">
                  <div className="flex items-center gap-1 px-3 py-2.5 bg-slate-100 border-r border-slate-300 font-mono font-bold text-xs text-slate-700 select-none">
                    <span>🇮🇳 +91</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoFocus
                    placeholder="98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="flex-1 px-3 py-2.5 text-sm font-mono text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setView("status")}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={phoneNumber.length !== 10 || loading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send OTP</span>}
                </button>
              </div>
            </form>
          )}

          {/* VIEW: Link Phone - Enter OTP */}
          {view === "linkPhoneOtp" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Enter 6-Digit OTP</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter the code sent to +91 {phoneNumber} to confirm linking.
                </p>
              </div>

              <div className="flex justify-between gap-1.5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-10 h-12 text-center text-lg font-bold font-mono border-2 border-slate-300 focus:border-emerald-600 rounded-xl bg-slate-50 text-slate-900 focus:outline-hidden"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setView("linkPhone")}
                  className="text-slate-500 hover:underline cursor-pointer"
                >
                  Change Number
                </button>
                <button
                  type="button"
                  onClick={() => handleSendLinkPhoneOtp()}
                  disabled={resendCooldown > 0 || loading}
                  className="text-emerald-700 font-bold hover:underline disabled:text-slate-400 cursor-pointer"
                >
                  {resendCooldown > 0 ? `Resend in (${resendCooldown}s)` : "Resend OTP"}
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setView("status")}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyLinkPhoneOtp()}
                  disabled={otp.join("").length !== 6 || loading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm & Link</span>}
                </button>
              </div>
            </div>
          )}

          {/* VIEW: Link Email */}
          {view === "linkEmail" && (
            <form onSubmit={handleLinkEmail} className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Link Email & Password</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set an email address and password to sign in to this account using credentials.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-600">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-600">
                  Create Password (min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setView("status")}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!email || password.length < 6 || loading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Link Email</span>}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Unified Firebase Auth profile • Single UID identity</span>
        </div>

      </div>
    </div>
  );
}
