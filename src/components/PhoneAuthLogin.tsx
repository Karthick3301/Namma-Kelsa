import React, { useState, useEffect, useRef } from "react";
import { 
  Phone, 
  Mail,
  KeyRound, 
  ArrowRight, 
  RotateCw, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  Check, 
  Loader2, 
  ChevronLeft,
  Lock,
  Building,
  UserCheck,
  Eye,
  EyeOff,
  UserPlus,
  LogIn
} from "lucide-react";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  linkWithCredential,
  ConfirmationResult, 
  User,
  AuthCredential
} from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";
import { useLanguage } from "../context/LanguageContext";

interface PhoneAuthLoginProps {
  onLoginSuccess: (user: User, isNewUser?: boolean) => void;
  onContinueAsGuest?: () => void;
}

export default function PhoneAuthLogin({ onLoginSuccess, onContinueAsGuest }: PhoneAuthLoginProps) {
  const { t, language } = useLanguage();

  // Top Method: 'phone' or 'email'
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");

  // PHONE AUTH STATES
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // EMAIL AUTH STATES
  // emailMode: 'login' | 'signup' | 'forgot'
  const [emailMode, setEmailMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState<boolean>(false);

  // GOOGLE AUTH STATE & ACCOUNT LINKING STATE
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState<boolean>(false);
  const [pendingLinkCred, setPendingLinkCred] = useState<AuthCredential | null>(null);
  const [pendingLinkEmail, setPendingLinkEmail] = useState<string>("");
  const [linkPassword, setLinkPassword] = useState<string>("");
  const [showLinkPassword, setShowLinkPassword] = useState<boolean>(false);
  const [isLinkingAccount, setIsLinkingAccount] = useState<boolean>(false);

  // GENERAL FEEDBACK
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Clean reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch {
          // Ignore
        }
        (window as any).recaptchaVerifier = undefined;
      }
    };
  }, []);

  // Cooldown countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Setup reCAPTCHA verifier for phone auth
  const getOrCreateRecaptchaVerifier = (): RecaptchaVerifier => {
    if ((window as any).recaptchaVerifier) {
      return (window as any).recaptchaVerifier;
    }

    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved
      },
      "expired-callback": () => {
        setErrorMessage(
          language === "kn"
            ? "reCAPTCHA ಪರಿಶೀಲನೆಯ ಸಮಯ ಮುಗಿದಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ."
            : "reCAPTCHA verification expired. Please try again."
        );
        try {
          verifier.clear();
        } catch {
          // Ignore
        }
        (window as any).recaptchaVerifier = undefined;
      },
    });

    (window as any).recaptchaVerifier = verifier;
    return verifier;
  };

  // -------------------------------------------------------------
  // PHONE AUTH HANDLERS
  // -------------------------------------------------------------
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 10) {
      setPhoneNumber(raw);
      setErrorMessage(null);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    const cleanDigits = phoneNumber.trim();
    if (cleanDigits.length !== 10) {
      setErrorMessage(
        language === "kn"
          ? "ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ 10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ."
          : "Please enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    setIsSendingOtp(true);
    const fullPhoneNumber = `+91${cleanDigits}`;

    try {
      const verifier = getOrCreateRecaptchaVerifier();
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, verifier);
      setConfirmationResult(result);
      setStep("otp");
      setResendCooldown(30);
      setSuccessNotice(
        language === "kn"
          ? `6-ಅಂಕಿಯ OTP ಕೋಡ್ ಅನ್ನು +91 ${cleanDigits} ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.`
          : `6-digit OTP code sent to +91 ${cleanDigits}.`
      );
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      console.error("Firebase Phone Auth error:", err);
      let message = "Failed to send OTP. Please try again.";

      if (err.code === "auth/invalid-phone-number") {
        message = "Invalid phone number format. Please check the 10-digit number.";
      } else if (err.code === "auth/too-many-requests") {
        message = "Too many OTP requests. Please wait a few minutes before trying again.";
      } else if (err.code === "auth/quota-exceeded") {
        message = "SMS quota exceeded for today. You can test instantly using the Demo Access below.";
      } else if (err.code === "auth/captcha-check-failed") {
        message = "reCAPTCHA verification failed. Please try again.";
      } else if (err.code === "auth/network-request-failed") {
        message = "Network error. Please verify your internet connection.";
      } else if (err.code === "auth/operation-not-allowed") {
        message = "Phone Authentication is being enabled. You can test with the Demo Login below!";
      }

      setErrorMessage(message);

      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch {
          // Ignore
        }
        (window as any).recaptchaVerifier = undefined;
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleanChar = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleanChar;
    setOtp(newOtp);
    setErrorMessage(null);

    if (cleanChar && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    const fullOtp = newOtp.join("");
    if (fullOtp.length === 6) {
      handleVerifyOtp(fullOtp);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);

    if (pasted.length === 6) {
      handleVerifyOtp(pasted);
    } else {
      otpInputsRef.current[pasted.length]?.focus();
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || otp.join("");
    if (fullCode.length !== 6) {
      setErrorMessage(
        language === "kn"
          ? "ದಯವಿಟ್ಟು 6-ಅಂಕಿಯ OTP ಕೋಡ್ ಅನ್ನು ನಮೂದಿಸಿ."
          : "Please enter the complete 6-digit OTP."
      );
      return;
    }

    if (!confirmationResult) {
      setErrorMessage("Verification session expired. Please request a new OTP.");
      setStep("phone");
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMessage(null);

    try {
      const userCredential = await confirmationResult.confirm(fullCode);
      const user = userCredential.user;
      onLoginSuccess(user);
    } catch (err: any) {
      console.error("OTP Verification Error:", err);
      let message = "Invalid OTP code. Please check and try again.";

      if (err.code === "auth/invalid-verification-code") {
        message = "Incorrect 6-digit OTP code entered. Please check your SMS.";
      } else if (err.code === "auth/code-expired") {
        message = "This OTP has expired. Please tap 'Resend OTP' to get a new code.";
      } else if (err.code === "auth/too-many-requests") {
        message = "Too many attempts. Please wait a few minutes before trying again.";
      }

      setErrorMessage(message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // -------------------------------------------------------------
  // EMAIL AUTH HANDLERS
  // -------------------------------------------------------------
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage(
        language === "kn"
          ? "ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ."
          : "Please enter a valid email address."
      );
      return;
    }

    // 1. Password Reset Flow
    if (emailMode === "forgot") {
      setIsSubmittingEmail(true);
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
        setSuccessNotice(
          language === "kn"
            ? `ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸುವ ಲಿಂಕ್ ಅನ್ನು ${cleanEmail} ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಇನ್‌ಬಾಕ್ಸ್ ಪರಿಶೀಲಿಸಿ.`
            : `Password reset link sent to ${cleanEmail}. Please check your inbox.`
        );
      } catch (err: any) {
        console.error("Password reset error:", err);
        if (err.code === "auth/user-not-found") {
          setErrorMessage("No user found with this email address.");
        } else if (err.code === "auth/invalid-email") {
          setErrorMessage("Invalid email format.");
        } else {
          setErrorMessage(err.message || "Failed to send reset email. Please try again.");
        }
      } finally {
        setIsSubmittingEmail(false);
      }
      return;
    }

    // 2. Validate Password for Login or Signup
    if (!password || password.length < 6) {
      setErrorMessage(
        language === "kn"
          ? "ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳನ್ನು ಹೊಂದಿರಬೇಕು."
          : "Password must be at least 6 characters long."
      );
      return;
    }

    setIsSubmittingEmail(true);

    try {
      if (emailMode === "signup") {
        // Sign Up with Email & Password
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        onLoginSuccess(userCredential.user, true);
      } else {
        // Log In with Email & Password
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        onLoginSuccess(userCredential.user, false);
      }
    } catch (err: any) {
      console.error("Firebase Email Auth error:", err);
      let message = "Authentication failed. Please check your credentials.";

      if (err.code === "auth/email-already-in-use") {
        message = "This email address is already in use. Please switch to Log In or reset your password.";
      } else if (err.code === "auth/invalid-email") {
        message = "Invalid email format. Please check the address.";
      } else if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        message = "Incorrect email or password. Please verify and try again.";
      } else if (err.code === "auth/weak-password") {
        message = "Password is too weak. Please use at least 6 characters.";
      } else if (err.code === "auth/too-many-requests") {
        message = "Too many failed attempts. Please wait a few minutes or reset your password.";
      } else if (err.code === "auth/network-request-failed") {
        message = "Network error. Please check your internet connection.";
      }

      setErrorMessage(message);
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  // -------------------------------------------------------------
  // GOOGLE SIGN-IN HANDLER
  // -------------------------------------------------------------
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessNotice(null);
    setPendingLinkEmail("");
    setPendingLinkCred(null);
    setIsGoogleSigningIn(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Sync Google profile fields (email, displayName, photoURL) to Firestore if user doc already exists
      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const uData = snap.data();
          const updates: any = {};
          let shouldUpdate = false;
          if (!uData.email && user.email) {
            updates.email = user.email;
            shouldUpdate = true;
          }
          if (!uData.displayName && user.displayName) {
            updates.displayName = user.displayName;
            shouldUpdate = true;
          }
          if (!uData.photoURL && user.photoURL) {
            updates.photoURL = user.photoURL;
            shouldUpdate = true;
          }
          if (shouldUpdate) {
            updates.updatedAt = serverTimestamp();
            await updateDoc(userRef, updates);
          }
        }
      } catch (syncErr) {
        console.warn("Could not sync Google metadata to user doc:", syncErr);
      }

      onLoginSuccess(user, false);
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      if (err.code === "auth/account-exists-with-different-credential") {
        const existingEmail = err.customData?.email || "";
        const pendingCred = GoogleAuthProvider.credentialFromError(err);
        setPendingLinkEmail(existingEmail);
        setPendingLinkCred(pendingCred);
        setErrorMessage(
          `An account already exists with ${existingEmail || "this email"}. Enter your password below to securely link your Google login to this existing account.`
        );
      } else if (err.code === "auth/popup-closed-by-user") {
        // Closed by user, no error needed
      } else if (err.code === "auth/popup-blocked") {
        setErrorMessage("Popup was blocked by your browser. Please allow popups or test with Demo Access below.");
      } else {
        setErrorMessage(err.message || "Failed to sign in with Google. Please try again.");
      }
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  // Link existing Email/Password account with pending Google OAuth Credential
  const handleLinkExistingAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkPassword || linkPassword.length < 6) {
      setErrorMessage("Please enter your account password (at least 6 characters).");
      return;
    }

    setIsLinkingAccount(true);
    setErrorMessage(null);

    try {
      // 1. Sign in with the existing password
      const userCredential = await signInWithEmailAndPassword(auth, pendingLinkEmail, linkPassword);

      // 2. Link the pending Google OAuth credential so both belong to the exact same account UID
      if (pendingLinkCred) {
        try {
          await linkWithCredential(userCredential.user, pendingLinkCred);
        } catch (linkErr: any) {
          console.warn("Credential linking warning:", linkErr);
        }
      }

      // 3. Update Firestore user document with Google display name/photo if missing
      try {
        const userRef = doc(db, "users", userCredential.user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const uData = snap.data();
          const updates: any = { updatedAt: serverTimestamp() };
          let hasUpdates = false;
          if (!uData.displayName && userCredential.user.displayName) {
            updates.displayName = userCredential.user.displayName;
            hasUpdates = true;
          }
          if (!uData.photoURL && userCredential.user.photoURL) {
            updates.photoURL = userCredential.user.photoURL;
            hasUpdates = true;
          }
          if (!uData.email && pendingLinkEmail) {
            updates.email = pendingLinkEmail;
            hasUpdates = true;
          }
          if (hasUpdates) {
            await updateDoc(userRef, updates);
          }
        }
      } catch (syncErr) {
        console.warn("Could not sync metadata after linking:", syncErr);
      }

      setPendingLinkEmail("");
      setPendingLinkCred(null);
      setLinkPassword("");
      onLoginSuccess(userCredential.user, false);
    } catch (err: any) {
      console.error("Account linking error:", err);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setErrorMessage("Incorrect password. Please verify and try again.");
      } else {
        setErrorMessage(err.message || "Failed to link Google account. Please verify your password.");
      }
    } finally {
      setIsLinkingAccount(false);
    }
  };

  // Demo / Test User bypass (crucial for instant reviews, offline frames, and tests)
  const handleDemoAccess = (role: "customer" | "worker") => {
    const mockUid = role === "worker" ? "demo-worker-phone-01" : "demo-customer-phone-01";
    try {
      localStorage.setItem(`namma_kelsa_user_role_${mockUid}`, role);
    } catch {
      // ignore
    }
    const mockUser = {
      uid: mockUid,
      phoneNumber: "+919876543210",
      email: role === "worker" ? "artisan.demo@nammakelasa.in" : "customer.demo@nammakelasa.in",
      displayName: role === "worker" ? "Basavaraj M. (Artisan)" : "Karthik R. (Customer)",
      photoURL: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=150",
    } as unknown as User;

    onLoginSuccess(mockUser, false);
  };

  return (
    <div className="w-full max-w-md mx-auto py-4 px-2">
      
      {/* Invisible reCAPTCHA container required by Firebase Phone Auth */}
      <div id="recaptcha-container" />

      <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Branding */}
        <div className="bg-emerald-900 text-white p-6 sm:p-7 text-center relative overflow-hidden">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center font-bold text-xl text-white shadow-md mb-2.5">
            NK
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            {t("brandName")}
          </h2>
          <p className="text-[11px] text-emerald-300 font-medium uppercase tracking-widest mt-0.5">
            {t("brandTagline")}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-4">
          
          {/* ============================================================== */}
          {/* ACCOUNT LINKING FORM (Google -> Existing Account Collision)   */}
          {/* ============================================================== */}
          {pendingLinkEmail ? (
            <div className="space-y-4 bg-emerald-50/60 p-4 sm:p-5 rounded-2xl border border-emerald-200 animate-in fade-in">
              <div className="text-center space-y-1.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-1 border border-emerald-300">
                  <ShieldCheck className="w-6 h-6 text-emerald-700" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Link Google to Existing Account
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  An account already exists for <strong className="text-emerald-900 font-mono">{pendingLinkEmail}</strong>. Enter your existing password below to link Google so you keep one unified profile.
                </p>
              </div>

              {/* Feedback Banners */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleLinkExistingAccount} className="space-y-3">
                <div className="space-y-1">
                  <label 
                    htmlFor="input-link-password"
                    className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600"
                  >
                    Enter Existing Password
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 overflow-hidden shadow-2xs transition px-3">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type={showLinkPassword ? "text" : "password"}
                      id="input-link-password"
                      data-testid="link-password-input"
                      required
                      autoFocus
                      placeholder="••••••••"
                      value={linkPassword}
                      onChange={(e) => {
                        setLinkPassword(e.target.value);
                        setErrorMessage(null);
                      }}
                      className="w-full px-2.5 py-2.5 text-sm text-slate-900 focus:outline-hidden bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLinkPassword(!showLinkPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showLinkPassword ? "Hide password" : "Show password"}
                    >
                      {showLinkPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-confirm-link-google"
                  data-testid="confirm-link-google-button"
                  disabled={isLinkingAccount || linkPassword.length < 6}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLinkingAccount ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying & Linking...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Verify Password & Link Google</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPendingLinkEmail("");
                    setPendingLinkCred(null);
                    setLinkPassword("");
                    setErrorMessage(null);
                  }}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-bold py-1.5 transition cursor-pointer"
                >
                  Cancel and choose another login method
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Method Selection Tabs: Phone vs Email */}
              <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
                <button
                  type="button"
                  id="tab-auth-phone"
                  data-testid="tab-auth-phone"
                  onClick={() => {
                    setAuthMethod("phone");
                    setErrorMessage(null);
                    setSuccessNotice(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    authMethod === "phone"
                      ? "bg-white text-emerald-900 shadow-xs border border-slate-200/60"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === "kn" ? "ಮೊಬೈಲ್ OTP" : "Login with Phone"}</span>
                </button>
                <button
                  type="button"
                  id="tab-auth-email"
                  data-testid="tab-auth-email"
                  onClick={() => {
                    setAuthMethod("email");
                    setErrorMessage(null);
                    setSuccessNotice(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    authMethod === "email"
                      ? "bg-white text-emerald-900 shadow-xs border border-slate-200/60"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === "kn" ? "ಇಮೇಲ್ ಲಾಗಿನ್" : "Login with Email"}</span>
                </button>
              </div>

              {/* Standard Google Sign-In Button (Official White / Google G branding) */}
              <button
                type="button"
                id="btn-login-google"
                data-testid="google-signin-button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleSigningIn}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-700 font-bold text-sm border border-slate-300 shadow-2xs transition cursor-pointer disabled:opacity-50"
              >
                {isGoogleSigningIn ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                )}
                <span>{isGoogleSigningIn ? "Connecting to Google..." : "Continue with Google"}</span>
              </button>

              {/* Divider between Google and Tab Inputs */}
              <div className="relative py-0.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">
                  <span className="bg-white px-2.5">
                    {authMethod === "phone" ? "Or sign in with SMS OTP" : "Or sign in with password"}
                  </span>
                </div>
              </div>

              {/* Feedback Banners */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successNotice && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successNotice}</span>
                </div>
              )}
            </>
          )}

          {/* ============================================================== */}
          {/* TAB 1: PHONE NUMBER + OTP AUTH                                 */}
          {/* ============================================================== */}
          {authMethod === "phone" && (
            <>
              {step === "phone" && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-base font-bold text-slate-900">
                      {language === "kn" ? "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ" : "Sign in with Phone Number"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {language === "kn"
                        ? "ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಗೆ 6-ಅಂಕಿಯ OTP ಕೋಡ್ ಅನ್ನು ಕಳುಹಿಸಲಾಗುತ್ತದೆ."
                        : "We'll send a 6-digit OTP via SMS to verify your phone number."}
                    </p>
                  </div>

                  {/* Phone Input with +91 locked */}
                  <div className="space-y-1.5">
                    <label 
                      htmlFor="input-phone-number"
                      className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600"
                    >
                      {language === "kn" ? "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (ಭಾರತ)" : "Mobile Number (India)"}
                    </label>
                    
                    <div className="flex items-center rounded-xl border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 overflow-hidden shadow-2xs transition">
                      <div className="flex items-center gap-1.5 px-3.5 py-3 bg-slate-100 border-r border-slate-300 text-slate-700 font-mono font-bold text-sm select-none">
                        <span className="text-base">🇮🇳</span>
                        <span>+91</span>
                      </div>

                      <input
                        type="tel"
                        id="input-phone-number"
                        data-testid="phone-auth-input"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        autoFocus
                        placeholder="98765 43210"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        className="flex-1 px-3.5 py-3 text-base text-slate-900 font-mono tracking-wider focus:outline-hidden bg-transparent placeholder:text-slate-400 placeholder:font-sans placeholder:text-sm"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Secured with Firebase Phone Auth • No password needed</span>
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    id="btn-send-otp"
                    data-testid="send-otp-button"
                    disabled={phoneNumber.length !== 10 || isSendingOtp}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Sending OTP SMS...</span>
                      </>
                    ) : (
                      <>
                        <span>Get OTP Verification Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {step === "otp" && (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-2 border border-emerald-200">
                      <KeyRound className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {language === "kn" ? "OTP ಕೋಡ್ ನಮೂದಿಸಿ" : "Enter Verification Code"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {`Enter the 6-digit code sent to +91 ${phoneNumber}`}
                    </p>
                    <button
                      type="button"
                      id="btn-change-phone"
                      onClick={() => {
                        setStep("phone");
                        setOtp(["", "", "", "", "", ""]);
                        setErrorMessage(null);
                      }}
                      className="text-xs text-emerald-700 hover:text-emerald-800 hover:underline font-bold pt-0.5 cursor-pointer inline-flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      <span>Change phone number</span>
                    </button>
                  </div>

                  {/* 6 Individual Digit Inputs */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 text-center">
                      6-Digit SMS Code
                    </label>
                    
                    <div className="flex justify-between gap-1.5 sm:gap-2">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputsRef.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={idx === 0 ? handleOtpPaste : undefined}
                          className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono border-2 border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-hidden transition shadow-2xs"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Verify OTP Button */}
                  <button
                    type="button"
                    id="btn-verify-otp"
                    data-testid="verify-otp-button"
                    onClick={() => handleVerifyOtp()}
                    disabled={otp.join("").length !== 6 || isVerifyingOtp}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Resend OTP Action */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-slate-500">
                      Didn't receive the SMS?
                    </span>

                    <button
                      type="button"
                      id="btn-resend-otp"
                      data-testid="resend-otp-button"
                      onClick={() => handleSendOtp()}
                      disabled={resendCooldown > 0 || isSendingOtp}
                      className="font-bold text-emerald-700 hover:text-emerald-800 disabled:text-slate-400 disabled:cursor-not-allowed hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <RotateCw className={`w-3 h-3 ${isSendingOtp ? "animate-spin" : ""}`} />
                      <span>
                        {resendCooldown > 0
                          ? `Resend OTP in (${resendCooldown}s)`
                          : "Resend OTP"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ============================================================== */}
          {/* TAB 2: EMAIL + PASSWORD AUTH                                    */}
          {/* ============================================================== */}
          {authMethod === "email" && (
            <div className="space-y-4">
              
              {/* Sub-mode Header: Log In vs Sign Up vs Forgot */}
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  {emailMode === "signup" 
                    ? "Create an Account with Email" 
                    : emailMode === "forgot" 
                    ? "Reset Your Password"
                    : "Log In with Email"}
                </h3>
                <p className="text-xs text-slate-500">
                  {emailMode === "signup" 
                    ? "Register with your email and password to get started." 
                    : emailMode === "forgot" 
                    ? "We'll send a password recovery link to your email."
                    : "Enter your registered email and password to log in."}
                </p>
              </div>

              {/* Email + Password Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                
                {/* Email input field */}
                <div className="space-y-1">
                  <label 
                    htmlFor="input-email-address"
                    className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600"
                  >
                    Email Address
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 overflow-hidden shadow-2xs transition px-3">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="email"
                      id="input-email-address"
                      data-testid="email-input"
                      required
                      autoFocus
                      autoComplete="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMessage(null);
                      }}
                      className="w-full px-2.5 py-2.5 text-sm text-slate-900 focus:outline-hidden bg-transparent"
                    />
                  </div>
                </div>

                {/* Password field (hidden in forgot password mode) */}
                {emailMode !== "forgot" && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label 
                        htmlFor="input-password"
                        className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600"
                      >
                        {emailMode === "signup" ? "Create Password" : "Password"}
                      </label>

                      {emailMode === "login" && (
                        <button
                          type="button"
                          id="btn-forgot-password"
                          onClick={() => {
                            setEmailMode("forgot");
                            setErrorMessage(null);
                            setSuccessNotice(null);
                          }}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>

                    <div className="flex items-center rounded-xl border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 overflow-hidden shadow-2xs transition px-3">
                      <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type={showPassword ? "text" : "password"}
                        id="input-password"
                        data-testid="password-input"
                        required
                        autoComplete={emailMode === "signup" ? "new-password" : "current-password"}
                        placeholder={emailMode === "signup" ? "At least 6 characters" : "••••••••"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setErrorMessage(null);
                        }}
                        className="w-full px-2.5 py-2.5 text-sm text-slate-900 focus:outline-hidden bg-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  id="btn-submit-email"
                  data-testid="submit-email-button"
                  disabled={isSubmittingEmail || !email || (emailMode !== "forgot" && password.length < 6)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Processing...</span>
                    </>
                  ) : emailMode === "signup" ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Sign Up with Email</span>
                    </>
                  ) : emailMode === "forgot" ? (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send Password Reset Email</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Log In with Email</span>
                    </>
                  )}
                </button>
              </form>

              {/* Toggles between Log In, Sign Up, and Forgot */}
              <div className="pt-1 text-center text-xs text-slate-600">
                {emailMode === "login" && (
                  <p>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      id="btn-toggle-signup"
                      onClick={() => {
                        setEmailMode("signup");
                        setErrorMessage(null);
                        setSuccessNotice(null);
                      }}
                      className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                    >
                      Sign Up here
                    </button>
                  </p>
                )}

                {emailMode === "signup" && (
                  <p>
                    Already have an account?{" "}
                    <button
                      type="button"
                      id="btn-toggle-login"
                      onClick={() => {
                        setEmailMode("login");
                        setErrorMessage(null);
                        setSuccessNotice(null);
                      }}
                      className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                    >
                      Log In here
                    </button>
                  </p>
                )}

                {emailMode === "forgot" && (
                  <button
                    type="button"
                    id="btn-back-to-login"
                    onClick={() => {
                      setEmailMode("login");
                      setErrorMessage(null);
                      setSuccessNotice(null);
                    }}
                    className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Back to Log In</span>
                  </button>
                )}
              </div>

            </div>
          )}

          {/* Divider */}
          <div className="relative pt-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">
              <span className="bg-white px-2.5">Instant Testing & Guest Access</span>
            </div>
          </div>

          {/* Guest and Demo shortcuts */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-demo-customer"
                onClick={() => handleDemoAccess("customer")}
                className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                title="Instant login as Customer looking to hire"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Test as Customer</span>
              </button>

              <button
                type="button"
                id="btn-demo-worker"
                onClick={() => handleDemoAccess("worker")}
                className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                title="Instant login as Skilled Artisan"
              >
                <Building className="w-3.5 h-3.5 text-emerald-600" />
                <span>Test as Artisan</span>
              </button>
            </div>

            {onContinueAsGuest && (
              <button
                type="button"
                id="btn-guest-browse"
                onClick={onContinueAsGuest}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-medium py-1.5 transition cursor-pointer"
              >
                {language === "kn"
                  ? "ಲಾಗಿನ್ ಇಲ್ಲದೆ ಸದ್ಯಕ್ಕೆ ಪರಿಶೀಲಿಸಿ →"
                  : "Skip for now & browse directory as guest →"}
              </button>
            )}
          </div>

        </div>

        {/* Footer info note */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>India-only verified marketplace • 0% commission on daily wages</span>
        </div>

      </div>
    </div>
  );
}
