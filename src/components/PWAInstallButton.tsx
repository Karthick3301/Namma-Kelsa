import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  X, 
  Check, 
  Share2, 
  PlusSquare, 
  QrCode, 
  Copy, 
  Share, 
  MessageCircle,
  ExternalLink,
  Package,
  FileDown,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import QRCode from 'qrcode';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../context/LanguageContext';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'card' | 'apk-only' | 'link';
  className?: string;
  initialTab?: 'qr' | 'apk' | 'guide';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  variant = 'header',
  className = '',
  initialTab
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { language } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'apk' | 'guide'>(initialTab || 'apk');
  const [isInstalling, setIsInstalling] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    if (typeof window !== 'undefined' && window.location.origin) {
      return window.location.origin;
    }
    return 'https://ais-pre-oozuu5myca3jq2f53q7r6y-691572655629.asia-southeast1.run.app';
  };

  const shareUrl = getShareUrl();

  useEffect(() => {
    if (showModal && !qrCodeDataUrl) {
      QRCode.toDataURL(shareUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#064e3b',
          light: '#ffffff'
        }
      })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('Failed to generate QR code:', err));
    }
  }, [showModal, qrCodeDataUrl, shareUrl]);

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Open the Share & Install Modal (with QR Code and Instructions)
      setShowModal(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback copy
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Namma Kelasa - Direct Local Artisan Marketplace',
          text: language === 'kn'
            ? 'ನಮ್ಮ ಕೆಲಸ ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ - ಸ್ಥಳೀಯ ಕುಶಲಕರ್ಮಿಗಳನ್ನು ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸಿ:'
            : 'Install Namma Kelasa App - Direct Local Artisan & Worker Marketplace:',
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const text = language === 'kn'
      ? `ನಮ್ಮ ಕೆಲಸ (Namma Kelasa) ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ ಮತ್ತು ನಿಮ್ಮ ಮೊಬೈಲ್‌ನಲ್ಲಿ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ:\n${shareUrl}`
      : `Install Namma Kelasa App on your phone to find daily wage artisans & workers:\n${shareUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // If already installed and running standalone, suppress prompt
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* HEADER VARIANT                                                */}
      {/* ------------------------------------------------------------- */}
      {variant === 'header' && (
        <div className="flex items-center gap-1.5">
          {/* Direct APK Download Button in Header */}
          <button
            type="button"
            id="btn-apk-download-header"
            data-testid="apk-download-header-button"
            onClick={() => {
              setActiveTab('apk');
              setShowModal(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-xs cursor-pointer border border-emerald-500/60"
            title={language === 'kn' ? 'Android APK ಡೌನ್‌ಲೋಡ್' : 'Download Android APK'}
          >
            <Package className="w-3.5 h-3.5 text-emerald-200" />
            <span className="hidden sm:inline">APK</span>
          </button>

          <button
            type="button"
            id="btn-pwa-install-header"
            data-testid="pwa-install-button"
            onClick={handleInstallClick}
            disabled={isInstalling}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer border border-emerald-600/50 ${className}`}
            title={language === 'kn' ? 'ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ' : 'Install App on Device'}
          >
            <Download className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
            <span className="hidden sm:inline">
              {language === 'kn' ? 'ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ' : 'Install App'}
            </span>
            <span className="sm:hidden">
              {language === 'kn' ? 'ಆ್ಯಪ್' : 'Install'}
            </span>
          </button>

          {/* Share to Mobile Icon Button */}
          <button
            type="button"
            id="btn-share-mobile-header"
            onClick={() => {
              setActiveTab('qr');
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center p-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 hover:text-white border border-emerald-700/60 transition cursor-pointer text-xs"
            title={language === 'kn' ? 'ಮೊಬೈಲ್‌ಗೆ ಲಿಂಕ್ ಕಳುಹಿಸಿ' : 'Share / Open on Phone'}
          >
            <QrCode className="w-4 h-4 text-emerald-300" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* APK ONLY VARIANT (Standalone button for Hero/Cards)            */}
      {/* ------------------------------------------------------------- */}
      {variant === 'apk-only' && (
        <button
          type="button"
          onClick={() => {
            setActiveTab('apk');
            setShowModal(true);
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-emerald-950 font-black text-xs transition cursor-pointer shadow-md ${className}`}
        >
          <Package className="w-4 h-4 text-emerald-950" />
          <span>{language === 'kn' ? 'Android APK ಡೌನ್‌ಲೋಡ್ (.apk)' : 'Download Android APK (.apk)'}</span>
        </button>
      )}

      {/* ------------------------------------------------------------- */}
      {/* LINK VARIANT (Footer or inline link)                          */}
      {/* ------------------------------------------------------------- */}
      {variant === 'link' && (
        <button
          type="button"
          onClick={() => {
            setActiveTab('apk');
            setShowModal(true);
          }}
          className={`inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-bold text-xs underline cursor-pointer ${className}`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>{language === 'kn' ? 'Android APK ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ' : 'Download Android App (APK)'}</span>
        </button>
      )}

      {/* ------------------------------------------------------------- */}
      {/* BANNER VARIANT (Mobile / Tablet)                              */}
      {/* ------------------------------------------------------------- */}
      {variant === 'banner' && (
        <div className={`bg-emerald-900 text-white p-3.5 rounded-2xl border border-emerald-700/80 shadow-md flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-sm text-white shrink-0 shadow-xs">
              NK
            </div>
            <div>
              <h4 className="text-xs font-bold leading-tight">
                {language === 'kn' ? 'ನಮ್ಮ ಕೆಲಸ ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ' : 'Install Namma Kelasa App'}
              </h4>
              <p className="text-[11px] text-emerald-200 leading-tight mt-0.5">
                {language === 'kn' ? 'APK ಡೌನ್‌ಲೋಡ್ ಅಥವಾ ನೇರ ಇನ್‌ಸ್ಟಾಲ್' : 'Download APK or install directly'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('apk');
                setShowModal(true);
              }}
              className="p-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white transition cursor-pointer border border-emerald-500/50 flex items-center gap-1 px-2 text-xs font-bold"
              title="Download APK"
            >
              <Package className="w-3.5 h-3.5" />
              <span>APK</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('qr');
                setShowModal(true);
              }}
              className="p-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-200 transition cursor-pointer border border-emerald-600/50"
              title="Share / QR"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-extrabold text-xs transition cursor-pointer shadow-xs active:scale-95"
            >
              {language === 'kn' ? 'ಇನ್‌ಸ್ಟಾಲ್' : 'Install'}
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SHARE & INSTALL MODAL (QR Code + Link + Instructions)         */}
      {/* ------------------------------------------------------------- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 relative text-slate-800 max-h-[92vh] overflow-y-auto">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Icon & Title */}
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
              <Smartphone className="w-6 h-6 text-emerald-700" />
            </div>

            <h3 className="text-lg font-black text-center text-slate-900">
              {language === 'kn' ? 'ಮೊಬೈಲ್‌ನಲ್ಲಿ ಆ್ಯಪ್ ಬಳಸಿ' : 'Open & Install on Mobile'}
            </h3>
            <p className="text-xs text-slate-600 text-center mt-1">
              {language === 'kn' 
                ? 'ಕ್ಯೂಆರ್ ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅಥವಾ ಲಿಂಕ್ ಕಳುಹಿಸಿ ನೇರವಾಗಿ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ.'
                : 'Scan the QR code with your phone camera or share via WhatsApp/Link to install instantly.'}
            </p>

            {/* Tab switch: Direct APK vs QR / Share vs Install Guide */}
            <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-2xl mt-4 border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('apk')}
                className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'apk'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>{language === 'kn' ? 'APK ಡೌನ್‌ಲೋಡ್' : 'APK File'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'qr'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{language === 'kn' ? 'ಸ್ಕ್ಯಾನ್' : 'Scan / Link'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('guide')}
                className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'guide'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{language === 'kn' ? 'ವೆಬ್ ಇನ್‌ಸ್ಟಾಲ್' : 'Web App'}</span>
              </button>
            </div>

            {/* Tab 0: Direct Android APK Download */}
            {activeTab === 'apk' && (
              <div className="mt-4 space-y-4">
                {/* APK Card */}
                <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-600 rounded-2xl text-white flex items-center justify-center mx-auto shadow-sm">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-300">
                      Android Package (.apk)
                    </div>
                    <h4 className="text-base font-black text-slate-900 mt-1.5">
                      Namma Kelasa for Android
                    </h4>
                    <p className="text-xs text-slate-600">
                      {language === 'kn' 
                        ? 'ಯಾವುದೇ ಪ್ಲೇ ಸ್ಟೋರ್ ಅಗತ್ಯವಿಲ್ಲದೆ ನೇರವಾಗಿ ನಿಮ್ಮ ಆಂಡ್ರಾಯ್ಡ್ ಫೋನ್‌ನಲ್ಲಿ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ.' 
                        : 'Direct installation file for Android phones. No Google Play Store required.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono text-slate-600">
                    <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-bold">v1.0.0</span>
                    <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">~1.6 MB</span>
                    <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">Android 5.0+</span>
                  </div>

                  {/* Big Direct APK Download Button */}
                  <a
                    href="/namma-kelasa.apk"
                    download="NammaKelasa.apk"
                    id="btn-download-apk-direct"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-sm transition shadow-md hover:shadow-lg cursor-pointer"
                  >
                    <FileDown className="w-4 h-4 text-emerald-200" />
                    <span>{language === 'kn' ? 'NammaKelasa.apk ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ' : 'Download NammaKelasa.apk'}</span>
                  </a>
                </div>

                {/* Android 3-step installation instructions */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2.5 text-left">
                  <h5 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'kn' ? 'ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡುವ ವಿಧಾನ:' : 'How to install the APK on Android:'}</span>
                  </h5>
                  <ol className="space-y-2 list-decimal list-inside text-[11px] text-slate-600 leading-relaxed">
                    <li>
                      <strong>{language === 'kn' ? 'ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ:' : 'Download:'}</strong>{' '}
                      {language === 'kn' 
                        ? 'ಮೇಲಿನ ಹಸಿರು ಬಟನ್ ಒತ್ತಿ NammaKelasa.apk ಫೈಲ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.' 
                        : 'Tap the green button above to download the APK file.'}
                    </li>
                    <li>
                      <strong>{language === 'kn' ? 'ಫೈಲ್ ತೆರೆಯಿರಿ:' : 'Open:'}</strong>{' '}
                      {language === 'kn' 
                        ? 'ಡೌನ್‌ಲೋಡ್ ಮುಗಿದ ನಂತರ ನೋಟಿಫಿಕೇಶನ್ ಅಥವಾ Downloads ಫೋಲ್ಡರ್‌ನಲ್ಲಿ ಫೈಲ್ ತೆರೆಯಿರಿ.' 
                        : 'Once downloaded, tap the notification or open the file in your Downloads folder.'}
                    </li>
                    <li>
                      <strong>{language === 'kn' ? 'ಇನ್‌ಸ್ಟಾಲ್ ಒತ್ತಿ:' : 'Install:'}</strong>{' '}
                      {language === 'kn' 
                        ? '"Install" ಒತ್ತಿ. "Unknown sources" ಸಂದೇಶ ಬಂದರೆ Settings > Allow from this source ಆನ್ ಮಾಡಿ.' 
                        : 'Tap "Install". If Android prompts "Unknown sources", tap Settings and toggle "Allow from this source".'}
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* Tab 1: QR Code & Sharing Options */}
            {activeTab === 'qr' && (
              <div className="mt-4 space-y-4">
                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80">
                  {qrCodeDataUrl ? (
                    <img 
                      src={qrCodeDataUrl} 
                      alt="Namma Kelasa Mobile App QR Code" 
                      className="w-44 h-44 rounded-xl shadow-xs border border-emerald-300/50 bg-white p-2"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center bg-white rounded-xl border border-emerald-200">
                      <span className="text-xs text-slate-400">Generating QR...</span>
                    </div>
                  )}
                  <p className="text-[11px] font-semibold text-emerald-900 mt-2.5 text-center">
                    {language === 'kn' 
                      ? 'ನಿಮ್ಮ ಫೋನ್ ಕ್ಯಾಮೆರಾದಿಂದ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ತೆರೆಯಿರಿ' 
                      : 'Scan with your smartphone camera to open on mobile'}
                  </p>
                </div>

                {/* Direct Action Buttons: WhatsApp & Copy Link */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? (language === 'kn' ? 'ಕಾಪಿ ಮಾಡಲಾಗಿದೆ!' : 'Copied!') : (language === 'kn' ? 'ಲಿಂಕ್ ಕಾಪಿ' : 'Copy Link')}</span>
                  </button>
                </div>

                {/* Native Share button (if supported) */}
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
                  >
                    <Share className="w-3.5 h-3.5" />
                    <span>{language === 'kn' ? 'ಇತರ ಆ್ಯಪ್‌ಗಳಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ' : 'Share via Other Apps (SMS, Email, Telegram)'}</span>
                  </button>
                )}

                {/* Display Current URL */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    {language === 'kn' ? 'ಆ್ಯಪ್ ಲಿಂಕ್' : 'App Download URL'}
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-slate-700 truncate select-all">
                      {shareUrl}
                    </span>
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:text-emerald-800 p-1"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Installation Step-by-Step Guide */}
            {activeTab === 'guide' && (
              <div className="mt-4 space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-700">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    {isIOS ? (
                      <span>
                        {language === 'kn' ? (
                          <>Safari ಕೆಳಗಿನ ಟೂಲ್‌ಬಾರ್‌ನಲ್ಲಿರುವ <strong>Share</strong> (<Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" />) ಬಟನ್ ಒತ್ತಿ.</>
                        ) : (
                          <>Tap the <strong>Share</strong> button (<Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" />) in Safari's bottom toolbar.</>
                        )}
                      </span>
                    ) : (
                      <span>
                        {language === 'kn' ? (
                          <>ಬ್ರೌಸರ್ ಮೆನುವನ್ನು (ಮೂರು ಚುಕ್ಕೆಗಳು <strong>⋮</strong>) ತೆರೆಯಿರಿ ಅಥವಾ ಕೆಳಗಿನ <strong>"Install App"</strong> ಬಟನ್ ಒತ್ತಿ.</>
                        ) : (
                          <>Open the Chrome browser menu (tap the three dots <strong>⋮</strong> in top right) or click the in-app <strong>"Install"</strong> button.</>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    {isIOS ? (
                      <span>
                        {language === 'kn' ? (
                          <>ಕೆಳಗೆ ಸ್ಕ್ರಾಲ್ ಮಾಡಿ <strong>Add to Home Screen</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-slate-700" />) ಆಯ್ಕೆಮಾಡಿ.</>
                        ) : (
                          <>Scroll down and tap <strong>Add to Home Screen</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-slate-700" />).</>
                        )}
                      </span>
                    ) : (
                      <span>
                        {language === 'kn' ? (
                          <><strong>"Add to Home screen"</strong> ಅಥವಾ <strong>"Install app"</strong> ಅನ್ನು ಆಯ್ಕೆಮಾಡಿ.</>
                        ) : (
                          <>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    3
                  </div>
                  <span>
                    {language === 'kn' 
                      ? 'ಆ್ಯಪ್ ನಿಮ್ಮ ಫೋನ್ ಮುಖಪುಟದಲ್ಲಿ ಸೇರ್ಪಡೆಯಾಗುತ್ತದೆ (ಯಾವುದೇ ಬ್ರೌಸರ್ ವಿಳಾಸ ಪಟ್ಟಿ ಇಲ್ಲದೆ ನೇರವಾಗಿ ಕೆಲಸ ಮಾಡುತ್ತದೆ).'
                      : 'The app icon is added to your mobile home screen. Tapping it opens Namma Kelasa full-screen just like a native store app.'}
                  </span>
                </div>
              </div>
            )}

            {/* Bottom Dismiss Button */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="mt-5 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 active:scale-[0.99] transition shadow-xs cursor-pointer"
            >
              {language === 'kn' ? 'ಮುಚ್ಚಿ' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
