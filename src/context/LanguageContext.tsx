import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "kn" | "ta" | "te" | "hi";

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  symbol: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English", symbol: "EN" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", symbol: "ಕ" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", symbol: "த" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", symbol: "తె" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", symbol: "अ" },
];

export interface Translations {
  [key: string]: {
    en: string;
    kn: string;
    ta?: string;
    te?: string;
    hi?: string;
  };
}

export const TRANSLATIONS: Translations = {
  // Brand & Navigation
  brandName: { 
    en: "Namma Kelasa", 
    kn: "ನಮ್ಮ ಕೆಲಸ", 
    ta: "நம்ம வேலை", 
    te: "నమ్మ కెలసా", 
    hi: "नम्मा केलसा" 
  },
  brandTagline: { 
    en: "Direct Local Marketplace", 
    kn: "ನೇರ ಸ್ಥಳೀಯ ಮಾರುಕಟ್ಟೆ", 
    ta: "நேரடி உள்ளூர் சந்தை", 
    te: "ప్రత్యక్ష స్థానిక మార్కెట్", 
    hi: "डायरेक्ट लोकल मार्केटप्लेस" 
  },
  findWorkers: { 
    en: "Find Workers", 
    kn: "ಕೆಲಸಗಾರರನ್ನು ಹುಡುಕಿ", 
    ta: "தொழிலாளர்களைத் தேடுங்கள்", 
    te: "కార్మికులను వెతకండి", 
    hi: "कारीगर खोजें" 
  },
  workerProfile: { 
    en: "Worker Profile", 
    kn: "ಕೆಲಸಗಾರರ ಪ್ರೊಫೈಲ್", 
    ta: "தொழிலாளர் சுயவிவரம்", 
    te: "కార్మికుడి ప్రొఫైల్", 
    hi: "कारीगर प्रोफ़ाइल" 
  },
  login: { 
    en: "Login", 
    kn: "ಲಾಗಿನ್", 
    ta: "உள்நுழைக", 
    te: "లాగిన్", 
    hi: "लॉग इन" 
  },
  logout: { 
    en: "Logout", 
    kn: "ನಿರ್ಗಮಿಸಿ", 
    ta: "வெளியேறு", 
    te: "లాగౌట్", 
    hi: "लॉग आउट" 
  },
  demoLogin: { 
    en: "Demo Mode Login", 
    kn: "ಡೆಮೊ ಲಾಗಿನ್", 
    ta: "டெமோ உள்நுழைவு", 
    te: "డెమో లాగిన్", 
    hi: "डेमो लॉगिन" 
  },
  demoModeActive: { 
    en: "Demo Mode Active", 
    kn: "ಡೆಮೊ ಮೋಡ್ ಸಕ್ರಿಯವಾಗಿದೆ", 
    ta: "டெமோ முறை செயலில் உள்ளது", 
    te: "డెమో మోడ్ యాక్టివ్‌గా ఉంది", 
    hi: "डेमो मोड सक्रिय है" 
  },
  seedWorkers: { 
    en: "Load Sample Artisans", 
    kn: "ಮಾದರಿ ಕೆಲಸಗಾರರನ್ನು ಸೇರಿಸಿ", 
    ta: "மாதிரி தொழிலாளர்களை ஏற்றுங்கள்", 
    te: "నమూనా కార్మికులను లోడ్ చేయండి", 
    hi: "नमूना कारीगर जोड़ें" 
  },
  seeding: { 
    en: "Seeding...", 
    kn: "ಸೇರಿಸಲಾಗುತ್ತಿದೆ...", 
    ta: "ஏற்றப்படுகிறது...", 
    te: "లోడ్ అవుతోంది...", 
    hi: "लोड हो रहा है..." 
  },

  // Hero Section
  heroTitle: {
    en: "Direct Daily-Wage Labor, Zero Middlemen",
    kn: "ನೇರ ದಿನಗೂಲಿ ಕಾರ್ಮಿಕರು, ಶೂನ್ಯ ಮಧ್ಯವರ್ತಿ ಕಮಿಷನ್",
    ta: "நேரடி தினசரி கூலி தொழிலாளர்கள், இடைத்தரகர் இல்லை",
    te: "ప్రత్యక్ష దినసరి వేతన కార్మికులు, దళారులు లేరు",
    hi: "सीधे दिहाड़ी मजदूर, शून्य बिचौलिया कमीशन"
  },
  heroSubtitle: {
    en: "Connect directly with skilled local daily wage workers across India. Fair wages, direct calls, zero commission.",
    kn: "ಭಾರತದಾದ್ಯಂತ ನುರಿತ ದಿನಗೂಲಿ ಕೆಲಸಗಾರರನ್ನು ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸಿ. ನ್ಯಾಯಯುತ ಕೂಲಿ, ನೇರ ಕರೆ, ಯಾವುದೇ ಕಮಿಷನ್ ಇಲ್ಲ.",
    ta: "இந்தியா முழுவதும் திறமையான தினசரி கூலி தொழிலாளர்களை நேரடியாக தொடர்பு கொள்ளுங்கள். நியாயமான கூலி, நேரடி அழைப்பு, பூஜ்ஜிய கமிஷன்.",
    te: "భారతదేశం అంతటా నైపుణ్యం కలిగిన దినసరి వేతన కార్మికులను నేరుగా సంప్రదించండి. న్యాయమైన వేతనాలు, ప్రత్యక్ష కాల్స్, జీరో కమీషన్.",
    hi: "पूरे भारत में कुशल स्थानीय दिहाड़ी कामगारों से सीधे संपर्क करें। उचित मजदूरी, सीधी कॉल, शून्य कमीशन।"
  },
  searchPlaceholder: {
    en: "Search by skill or artisan name...",
    kn: "ಕೌಶಲ್ಯ ಅಥವಾ ಕೆಲಸಗಾರರ ಹೆಸರಿನಿಂದ ಹುಡುಕಿ...",
    ta: "திறமை அல்லது தொழிலாளர் பெயர் மூலம் தேடுங்கள்...",
    te: "నైపుణ్యం లేదా కార్మికుడి పేరు ద్వారా శోధించండి...",
    hi: "कौशल या कारीगर के नाम से खोजें..."
  },
  locationHubLabel: {
    en: "Your area",
    kn: "ನಿಮ್ಮ ಪ್ರದೇಶ",
    ta: "உங்கள் பகுதி",
    te: "మీ ప్రాంతం",
    hi: "आपका क्षेत्र"
  },
  distanceRadiusLabel: {
    en: "Distance Radius:",
    kn: "ದೂರ ಮಿತಿ:",
    ta: "தொலைவு வரம்பு:",
    te: "దూరం పరిధి:",
    hi: "दूरी दायरा:"
  },
  withinRadius: {
    en: "Within",
    kn: "ಒಳಗೆ",
    ta: "வரம்பிற்குள்",
    te: "పరిధిలో",
    hi: "के भीतर"
  },
  km: {
    en: "km",
    kn: "ಕಿ.ಮೀ",
    ta: "கி.மீ",
    te: "కి.మీ",
    hi: "कि.मी"
  },
  onlyAvailableToday: {
    en: "Only show available today",
    kn: "ಇಂದು ಲಭ್ಯವಿರುವವರನ್ನು ಮಾತ್ರ ತೋರಿಸಿ",
    ta: "இன்று இருப்பவர்களை மட்டும் காட்டு",
    te: "ఈరోజు అందుబాటులో ఉన్నవారిని మాత్రమే చూపించు",
    hi: "केवल आज उपलब्ध कारीगर दिखाएं"
  },
  artisansFound: {
    en: "Available Artisans in Range",
    kn: "ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಲಭ್ಯವಿರುವ ಕೆಲಸಗಾರರು",
    ta: "வரம்பிற்குள் உள்ள தொழிலாளர்கள்",
    te: "పరిధిలో ఉన్న కార్మికులు",
    hi: "दायरे में उपलब्ध कारीगर"
  },
  resetFilters: {
    en: "Reset Filters",
    kn: "ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ",
    ta: "வடிகட்டிகளை மீட்டமை",
    te: "ఫిల్టర్‌లను రీసెట్ చేయండి",
    hi: "फ़िल्टर रीसेट करें"
  },
  noWorkersFound: {
    en: "No artisans found in this distance or skill category",
    kn: "ಆಯ್ಕೆಮಾಡಿದ ದೂರದಲ್ಲಿ ಅಥವಾ ಕೌಶಲ್ಯದಲ್ಲಿ ಯಾವುದೇ ಕೆಲಸಗಾರರು ಕಂಡುಬಂದಿಲ್ಲ",
    ta: "இந்த தூரம் அல்லது திறமை பிரிவில் தொழிலாளர்கள் எவரும் இல்லை",
    te: "ఈ దూరం లేదా నైపుణ్యం విభాగంలో కార్మికులు ఎవరూ కనుగొనబడలేదు",
    hi: "इस दूरी या कौशल श्रेणी में कोई कारीगर नहीं मिला"
  },
  noWorkersHint: {
    en: "Try increasing the distance slider or selecting another trade skill.",
    kn: "ದೂರದ ಸ್ಲೈಡರ್ ಹೆಚ್ಚಿಸಿ ಅಥವಾ ಬೇರೆ ಕೆಲಸದ ಕೌಶಲ್ಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    ta: "தொலைவு ஸ்லைடரை அதிகரிக்கவும் அல்லது மற்றொரு திறனைத் தேர்ந்தெடுக்கவும்.",
    te: "దూరం స్లైడర్‌ను పెంచండి లేదా మరొక పని నైపుణ్యాన్ని ఎంచుకోండి.",
    hi: "दूरी स्लाइडर बढ़ाएं या कोई अन्य कौशल चुनें।"
  },

  // Worker Card & Details
  availableToday: { 
    en: "AVAILABLE TODAY", 
    kn: "ಇಂದು ಲಭ್ಯವಿದ್ದಾರೆ", 
    ta: "இன்று கிடைக்கிறார்", 
    te: "ఈరోజు అందుబాటులో ఉన్నారు", 
    hi: "आज उपलब्ध हैं" 
  },
  notAvailableToday: { 
    en: "NOT AVAILABLE TODAY", 
    kn: "ಇಂದು ಲಭ್ಯವಿಲ್ಲ", 
    ta: "இன்று கிடைக்கவில்லை", 
    te: "ఈరోజు అందుబాటులో లేరు", 
    hi: "आज उपलब्ध नहीं हैं" 
  },
  updatedRecently: { 
    en: "Updated recently", 
    kn: "ಇತ್ತೀಚೆಗೆ ನವೀಕರಿಸಲಾಗಿದೆ", 
    ta: "சமீபத்தில் புதுப்பிக்கப்பட்டது", 
    te: "ఇటీవలే నవీకరించబడింది", 
    hi: "हाल ही में अपडेट किया गया" 
  },
  perDay: { 
    en: "/ day", 
    kn: "/ ದಿನಕ್ಕೆ", 
    ta: "/ நாள்", 
    te: "/ రోజుకు", 
    hi: "/ दिन" 
  },
  experienceYears: { 
    en: "yrs exp", 
    kn: "ವರ್ಷ ಅನುಭವ", 
    ta: "ஆண்டு அனுபவம்", 
    te: "సం. అనుభవం", 
    hi: "वर्ष अनुभव" 
  },
  skillsExpertise: { 
    en: "Skills & Trade Expertise", 
    kn: "ಕೌಶಲ್ಯಗಳು ಮತ್ತು ಪರಿಣತಿ", 
    ta: "திறன்கள் மற்றும் அனுபவம்", 
    te: "నైపుణ్యాలు మరియు అనుభవం", 
    hi: "कौशल और विशेषज्ञता" 
  },
  nearbyArtisan: { 
    en: "Nearby Artisan", 
    kn: "ಹತ್ತಿರದ ಕೆಲಸಗಾರ", 
    ta: "அருகிலுள்ள தொழிலாளி", 
    te: "దగ్గరి కార్మికుడు", 
    hi: "नजदीकी कारीगर" 
  },
  moderateDistance: { 
    en: "Moderate Distance", 
    kn: "ಮಧ್ಯಮ ದೂರ", 
    ta: "மிதமான தூரம்", 
    te: "మధ్యస్థ దూరం", 
    hi: "मध्यम दूरी" 
  },
  extendedHub: { 
    en: "Extended Hub", 
    kn: "ದೂರದ ಕೇಂದ್ರ", 
    ta: "தொலைதூர மையம்", 
    te: "దూర కేంద్రం", 
    hi: "विस्तारित केंद्र" 
  },
  away: { 
    en: "away", 
    kn: "ದೂರ", 
    ta: "தொலைவில்", 
    te: "దూరంలో", 
    hi: "दूर" 
  },

  // Mini Map
  miniMap: { 
    en: "Mini Map", 
    kn: "ನಕ್ಷೆ (Map)", 
    ta: "வரைபடம் (Map)", 
    te: "మ్యాప్ (Map)", 
    hi: "मानचित्र (Map)" 
  },
  closeMap: { 
    en: "Close Map", 
    kn: "ನಕ್ಷೆ ಮುಚ್ಚಿ", 
    ta: "வரைபடத்தை மூடு", 
    te: "మ్యాప్ మూసివేయి", 
    hi: "नक्शा बंद करें" 
  },
  locationDistancePreview: { 
    en: "Location Distance Preview", 
    kn: "ಸ್ಥಳ ಮತ್ತು ದೂರದ ಮುನ್ನೋಟ", 
    ta: "இடம் மற்றும் தூர முன்னோட்டம்", 
    te: "స్థలం మరియు దూర ప్రివ్యూ", 
    hi: "स्थान और दूरी पूर्वावलोकन" 
  },
  directions: { 
    en: "Directions", 
    kn: "ದಾರಿಯ ನಕ್ಷೆ", 
    ta: "வழிமுறைகள்", 
    te: "దిశలు", 
    hi: "दिशा-निर्देश" 
  },
  gridCoordinates: { 
    en: "Grid Coordinates", 
    kn: "ಗ್ರಿಡ್ ನಿರ್ದೇಶಾಂಕ", 
    ta: "கிரிட் ஒருங்கிணைப்புகள்", 
    te: "గ్రిడ్ కోఆర్డినేట్స్", 
    hi: "ग्रिड निर्देशांक" 
  },
  townArea: { 
    en: "Town Area", 
    kn: "ಪಟ್ಟಣ ಪ್ರದೇಶ", 
    ta: "நகர பகுதி", 
    te: "పట్టణ ప్రాంతం", 
    hi: "कस्बा क्षेत्र" 
  },

  // Action Buttons
  share: { 
    en: "Share", 
    kn: "ಹಂಚಿಕೊಳ್ಳಿ", 
    ta: "பகிர்", 
    te: "భాగస్వామ్యం", 
    hi: "साझा करें" 
  },
  copied: { 
    en: "Copied!", 
    kn: "ಕಾಪಿ ಆಗಿದೆ!", 
    ta: "நகலெடுக்கப்பட்டது!", 
    te: "కాపీ అయింది!", 
    hi: "कॉपी हो गया!" 
  },
  myFavorites: { 
    en: "My Favorites", 
    kn: "ನನ್ನ ಮೆಚ್ಚಿನವರು", 
    ta: "எனக்கு பிடித்தவை", 
    te: "నా ఇష్టమైనవి", 
    hi: "मेरी पसंद" 
  },
  favorites: { 
    en: "Favorites", 
    kn: "ಮೆಚ್ಚಿನವರು", 
    ta: "பிடித்தவை", 
    te: "ఇష్టమైనవి", 
    hi: "पसंदीदा" 
  },
  saveToFavorites: { 
    en: "Save to Favorites", 
    kn: "ಮೆಚ್ಚಿನವುಗಳಿಗೆ ಸೇರಿಸಿ", 
    ta: "விருப்பங்களில் சேமி", 
    te: "ఇష్టమైన వాటిలో చేర్చండి", 
    hi: "पसंदीदा में जोड़ें" 
  },
  removeFromFavorites: { 
    en: "Remove from Favorites", 
    kn: "ಮೆಚ್ಚಿನವುಗಳಿಂದ ತೆಗೆದುಹಾಕಿ", 
    ta: "விருப்பங்களிலிருந்து நீக்கு", 
    te: "ఇష్టమైన వాటి నుండి తొలగించండి", 
    hi: "पसंदीदा से हटाएं" 
  },
  tooltipFavoriteSave: { 
    en: "Save to Favorites", 
    kn: "ಮೆಚ್ಚಿನವುಗಳಿಗೆ ಸೇರಿಸಿ", 
    ta: "விருப்பங்களில் சேமி", 
    te: "ఇష్టమైన వాటిలో చేర్చండి", 
    hi: "पसंदीदा में जोड़ें" 
  },
  tooltipFavoriteRemove: { 
    en: "Remove from Favorites", 
    kn: "ಮೆಚ್ಚಿನವುಗಳಿಂದ ತೆಗೆದುಹಾಕಿ", 
    ta: "விருப்பங்களிலிருந்து நீக்கு", 
    te: "ఇష్టమైన వాటి నుండి తొಲగించండి", 
    hi: "पसंदीदा से हटाएं" 
  },
  tooltipWhatsapp: { 
    en: "Message via WhatsApp", 
    kn: "ವಾಟ್ಸಾಪ್ ಸಂದೇಶ ಕಳುಹಿಸಿ", 
    ta: "வாட்ஸ்அப் மூலம் செய்தி அனுப்புக", 
    te: "వాట్సాప్ ద్వారా సందేశం పంపండి", 
    hi: "व्हाट्सएप पर संदेश भेजें" 
  },
  tooltipWhatsappCustomize: { 
    en: "Customize WhatsApp Message", 
    kn: "ವಾಟ್ಸಾಪ್ ಸಂದೇಶ ಸರಿಹೊಂದಿಸಿ", 
    ta: "வாட்ஸ்அப் செய்தியைத் தனிப்பயனாக்கு", 
    te: "వాట్సాప్ సందేశాన్ని అనుకూలీకరించండి", 
    hi: "व्हाट्सएप संदेश कस्टमाइज़ करें" 
  },
  tooltipDistance: { 
    en: "View Distance & Location Map", 
    kn: "ದೂರ ಮತ್ತು ಸ್ಥಳದ ನಕ್ಷೆ ವೀಕ್ಷಿಸಿ", 
    ta: "தூரம் மற்றும் வரைபடத்தைப் பார்க்கவும்", 
    te: "దూరం మరియు మ్యాప్‌ని చూడండి", 
    hi: "दूरी और नक्शा देखें" 
  },
  tooltipDirectCall: { 
    en: "Direct Call to Worker", 
    kn: "ಕೆಲಸಗಾರರಿಗೆ ನೇರ ಕರೆ ಮಾಡಿ", 
    ta: "தொழிலாளியை நேரடியாக அழைக்கவும்", 
    te: "కార్మికుడికి నేరుగా కాల్ చేయండి", 
    hi: "कारीगर को सीधी कॉल करें" 
  },
  tooltipShare: { 
    en: "Share Worker Profile", 
    kn: "ಕೆಲಸಗಾರರ ಪ್ರೊಫೈಲ್ ಹಂಚಿಕೊಳ್ಳಿ", 
    ta: "சுயவிவரத்தைப் பகிரவும்", 
    te: "ప్రొఫైల్‌ను షేర్ చేయండి", 
    hi: "कारीगर प्रोफ़ाइल साझा करें" 
  },
  tooltipDownloadPdf: { 
    en: "Download PDF Profile", 
    kn: "ಪಿಡಿಎಫ್ ಪ್ರೊಫೈಲ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ", 
    ta: "PDF சுயவிவரத்தைப் பதிவிறக்குக", 
    te: "PDF ప్రొఫైల్‌ని డౌన్‌లోడ్ చేయండి", 
    hi: "पीडीएफ प्रोफ़ाइल डाउनलोड करें" 
  },
  tooltipViewReviews: { 
    en: "View Customer Ratings & Reviews", 
    kn: "ಗ್ರಾಹಕರ ರೇಟಿಂಗ್ ಮತ್ತು ವಿಮರ್ಶೆಗಳನ್ನು ನೋಡಿ", 
    ta: "மதிப்பீடுகள் மற்றும் மதிப்புரைகளைப் பார்க்கவும்", 
    te: "రేటింగ్‌లు మరియు సమీక్షలను చూడండి", 
    hi: "ग्राहक रेटिंग और समीक्षाएं देखें" 
  },
  tooltipToggleMap: { 
    en: "Toggle Interactive Map", 
    kn: "ಸಂವಾದಾತ್ಮಕ ನಕ್ಷೆಯನ್ನು ಬದಲಿಸಿ", 
    ta: "வரைபடத்தை மாற்றவும்", 
    te: "మ్యాప్‌ని మార్చండి", 
    hi: "इंटरैक्टिव नक्शा टॉगल करें" 
  },
  noFavoritesFound: { 
    en: "No favorite workers saved yet", 
    kn: "ಇನ್ನೂ ಯಾವುದೇ ಮೆಚ್ಚಿನ ಕೆಲಸಗಾರರನ್ನು ಸೇರಿಸಲಾಗಿಲ್ಲ", 
    ta: "இதுவரை பிடித்த தொழிலாளர்கள் சேமிக்கப்படவில்லை", 
    te: "ఇంకా ఇష్టమైన కార్మికులు ఎవరూ సేవ్ చేయబడలేదు", 
    hi: "अभी तक कोई पसंदीदा कारीगर नहीं जोड़ा गया" 
  },
  noFavoritesHint: { 
    en: "Click the heart icon on any worker card to save them here for quick access.", 
    kn: "ಯಾವುದೇ ಕೆಲಸಗಾರರ ಕಾರ್ಡ್ ಮೇಲಿನ ಹೃದಯದ ಐಕಾನ್ ಒತ್ತಿ ಇಲ್ಲಿ ಶೇಖರಿಸಿ.", 
    ta: "விரைவான அணுகலுக்கு அவர்களைச் சேமிக்க எந்த தொழிலாளர் அட்டையிலும் உள்ள இதய ஐகானைக் கிளிக் செய்யவும்.", 
    te: "త్వరిత ప్రాప్యత కోసం ఏ కార్మికుడి కార్డ్‌లోని హృదయ చిహ్నాన్ని క్లిక్ చేయండి.", 
    hi: "त्वरित पहुंच के लिए किसी भी कारीगर कार्ड पर दिल के आइकन पर क्लिक करें।" 
  },
  yourSavedFavorites: {
    en: "Your saved favorite artisans for quick access",
    kn: "ನಿಮ್ಮ ಮೆಚ್ಚಿನ ಉಳಿಸಿದ ಕೆಲಸಗಾರರು",
    ta: "விரைவான அணுகலுக்கு சேமிக்கப்பட்ட தொழிலாளர்கள்",
    te: "త్వరిత ప్రాప్యత కోసం మీ సేవ్ చేయబడిన కార్మికులు",
    hi: "त्वरित पहुंच के लिए सहेजे गए पसंदीदा कारीगर"
  },
  liveDatabaseSync: {
    en: "Live directory connection synchronized with central Firestore database",
    kn: "ಕೇಂದ್ರ ಡೇಟಾಬೇಸ್‌ನೊಂದಿಗೆ ಸಿಂಕ್ ಆಗಿದೆ",
    ta: "மத்திய தரவுத்தளத்துடன் நேரலையாக ஒத்திசைக்கப்பட்டது",
    te: "కేంద్ర డేటాబేస్‌తో సమకాలీకరించబడింది",
    hi: "केंद्रीय डेटाबेस के साथ लाइव सिंक"
  },
  directDialActive: {
    en: "Direct Dial Active",
    kn: "ನೇರ ಕರೆ ಲಭ್ಯ",
    ta: "நேரடி அழைப்பு தயார்",
    te: "ప్రత్యక్ష కాల్ సిద్ధం",
    hi: "सीधी कॉल सक्रिय"
  },
  viewAllArtisans: {
    en: "View All Artisans",
    kn: "ಎಲ್ಲಾ ಕೆಲಸಗಾರರನ್ನು ವೀಕ್ಷಿಸಿ",
    ta: "அனைத்து தொழிலாளர்களையும் காண்க",
    te: "అన్ని కార్మికులను వీక్షించండి",
    hi: "सभी कारीगर देखें"
  },
  downloadProfile: { 
    en: "Download Profile", 
    kn: "ಪ್ರೊಫೈಲ್ ಡೌನ್‌ಲೋಡ್", 
    ta: "சுயவிவர பதிவிறக்கம்", 
    te: "ప్రొఫైల్ డౌన్‌లోడ్", 
    hi: "प्रोफ़ाइल डाउनलोड" 
  },
  compilingPdf: { 
    en: "Compiling PDF...", 
    kn: "ಪಿಡಿಎಫ್ ತಯಾರಾಗುತ್ತಿದೆ...", 
    ta: "PDF தொகுக்கப்படுகிறது...", 
    te: "PDF రూపొందించబడుతోంది...", 
    hi: "पीडीएफ तैयार हो रहा है..." 
  },
  directCall: { 
    en: "Direct Call", 
    kn: "ನೇರ ಕರೆ (Call)", 
    ta: "நேரடி அழைப்பு", 
    te: "ప్రత్యక్ష కాల్", 
    hi: "सीधी कॉल" 
  },
  directMessageViaWhatsapp: { 
    en: "Direct Message via WhatsApp", 
    kn: "ವಾಟ್ಸಾಪ್ ನೇರ ಸಂದೇಶ", 
    ta: "வாட்ஸ்அப் நேரடி செய்தி", 
    te: "వాట్సాప్ ప్రత్యక్ష సందేశం", 
    hi: "व्हाट्सएप सीधा संदेश" 
  },
  whatsappInquiry: { 
    en: "WhatsApp Inquiry", 
    kn: "ವಾಟ್ಸಾಪ್ ವಿಚಾರಣೆ", 
    ta: "வாட்ஸ்அப் விசாரணை", 
    te: "వాట్సాప్ విచారణ", 
    hi: "व्हाट्सएप पूछताछ" 
  },
  customizeInquiry: { 
    en: "Customize Message", 
    kn: "ಸಂದೇಶ ಬರೆಯಿರಿ", 
    ta: "செய்தியை மாற்றவும்", 
    te: "సందేశాన్ని సవరించండి", 
    hi: "संदेश अनुकूलित करें" 
  },
  whatsappTemplatePreview: { 
    en: "Pre-filled Message Template", 
    kn: "ಸಿದ್ಧಪಡಿಸಿದ ಸಂದೇಶ ಮುನ್ನೋಟ", 
    ta: "முன்பே நிரப்பப்பட்ட செய்தி வார்ப்புரு", 
    te: "ముందుగా నింపిన సందేశ టెంప్లేట్", 
    hi: "तैयार संदेश प्रारूप" 
  },
  sendOnWhatsapp: { 
    en: "Open WhatsApp & Send", 
    kn: "ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಕಳುಹಿಸಿ", 
    ta: "வாட்ஸ்அப்பில் திறந்து அனுப்புக", 
    te: "వాట్సాప్‌లో తెరిచి పంపండి", 
    hi: "व्हाट्सएप खोलें और भेजें" 
  },
  yourInquiry: { 
    en: "Your Inquiry / Work Requirement", 
    kn: "ನಿಮ್ಮ ವಿಚಾರಣೆ / ಕೆಲಸದ ವಿವರ", 
    ta: "உங்கள் விசாரணை / வேலை தேவை", 
    te: "మీ విచారణ / పని అవసరం", 
    hi: "आपकी पूछताछ / काम की आवश्यकता" 
  },
  reviews: { 
    en: "reviews", 
    kn: "ವಿಮರ್ಶೆಗಳು", 
    ta: "மதிப்புரைகள்", 
    te: "సమీక్షలు", 
    hi: "समीक्षाएं" 
  },
  ratingsAndFeedback: { 
    en: "Ratings & Customer Feedback", 
    kn: "ಗ್ರಾಹಕರ ರೇಟಿಂಗ್ ಮತ್ತು ವಿಮರ್ಶೆಗಳು", 
    ta: "மதிப்பீடுகள் மற்றும் வாடிக்கையாளர் கருத்து", 
    te: "రేటింగ్‌లు మరియు కస్టమర్ అభిప్రాయం", 
    hi: "रेटिंग और ग्राहक प्रतिक्रिया" 
  },
  writeReview: { 
    en: "Rate & Review", 
    kn: "ರೇಟಿಂಗ್ ನೀಡಿ", 
    ta: "மதிப்பீடு செய்க", 
    te: "రేట్ చేయండి", 
    hi: "रेटिंग और समीक्षा दें" 
  },
  closeFeedback: { 
    en: "Close", 
    kn: "ಮುಚ್ಚಿ", 
    ta: "மூடு", 
    te: "మూసివేయి", 
    hi: "बंद करें" 
  },

  // Share Dialog
  shareProfileTitle: { 
    en: "Share Laborer Profile", 
    kn: "ಕೆಲಸಗಾರರ ಪ್ರೊಫೈಲ್ ಹಂಚಿಕೊಳ್ಳಿ", 
    ta: "தொழிலாளர் சுயவிவரத்தைப் பகிரவும்", 
    te: "కార్మికుడి ప్రొఫైల్‌ను షేర్ చేయండి", 
    hi: "कारीगर प्रोफ़ाइल साझा करें" 
  },
  shareProfileSubtitle: { 
    en: "Spread the word for", 
    kn: "ಇವರ ಬಗ್ಗೆ ಹಂಚಿಕೊಳ್ಳಿ:", 
    ta: "இவரைப் பற்றி பகிரவும்:", 
    te: "వీరి గురించి షేర్ చేయండి:", 
    hi: "इनके बारे में साझा करें:" 
  },
  sharableLink: { 
    en: "Sharable Profile Link:", 
    kn: "ಹಂಚಿಕೊಳ್ಳಬಹುದಾದ ಲಿಂಕ್:", 
    ta: "பகிரக்கூடிய இணைப்பு:", 
    te: "షేర్ చేయగల లింక్:", 
    hi: "साझा करने योग्य लिंक:" 
  },
  copy: { 
    en: "Copy", 
    kn: "ಕಾಪಿ", 
    ta: "நகலெடு", 
    te: "కాపీ", 
    hi: "कॉपी करें" 
  },
  shareViaWhatsapp: { 
    en: "WhatsApp", 
    kn: "ವಾಟ್ಸಾಪ್", 
    ta: "வாட்ஸ்அப்", 
    te: "వాట్సాప్", 
    hi: "व्हाट्सएप" 
  },
  shareViaTwitter: { 
    en: "Twitter / X", 
    kn: "ಟ್ವಿಟರ್ / X", 
    ta: "ட்விட்டர் / X", 
    te: "ట్విట్టర్ / X", 
    hi: "ट्विटर / X" 
  },
  printableQrCode: { 
    en: "Printable QR Code", 
    kn: "ಮುದ್ರಿಸಬಹುದಾದ ಕ್ಯೂಆರ್ ಕೋಡ್", 
    ta: "அச்சிடக்கூடிய QR குறியீடு", 
    te: "ప్రింట్ చేయదగిన QR కోడ్", 
    hi: "प्रिंट करने योग्य क्यूआर कोड" 
  },
  offlineMarketing: { 
    en: "Offline Marketing", 
    kn: "ಆಫ್‌ಲೈನ್ ಪ್ರಚಾರ", 
    ta: "ஆஃப்லைன் விளம்பரம்", 
    te: "ఆఫ్‌లైన్ మార్కెటింగ్", 
    hi: "ऑफ़लाइन प्रचार" 
  },
  offlineMarketingDesc: { 
    en: "Print this QR code on visiting cards, shop flyers, or vehicle stickers so local clients can view your live availability.", 
    kn: "ಸ್ಥಳೀಯ ಗ್ರಾಹಕರು ನಿಮ್ಮ ಲೈವ್ ಲಭ್ಯತೆ ನೋಡಲು ಇದನ್ನು ವಿಸಿಟಿಂಗ್ ಕಾರ್ಡ್ ಅಥವಾ ಕರಪತ್ರದಲ್ಲಿ ಮುದ್ರಿಸಿ.", 
    ta: "உள்ளூர் வாடிக்கையாளர்கள் உங்கள் நேரலை கிடைப்பை பார்க்க இந்த QR குறியீட்டை அச்சிடுங்கள்.", 
    te: "స్థానిక కస్టమర్‌లు మీ లైవ్ లభ్యతను చూడటానికి దీన్ని విజిటింగ్ కార్డులలో ముద్రించండి.", 
    hi: "स्थानीय ग्राहकों को आपकी लाइव उपलब्धता देखने के लिए इसे विज़िटिंग कार्ड या पर्चे पर प्रिंट करें।" 
  },
  scanToViewProfile: { 
    en: "Scan with any phone camera to view profile & check availability", 
    kn: "ಪ್ರೊಫೈಲ್ ಮತ್ತು ಇಂದಿನ ಲಭ್ಯತೆ ನೋಡಲು ಯಾವುದೇ ಫೋನ್ ಕ್ಯಾಮೆರಾದಿಂದ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ", 
    ta: "சுயவிவரம் மற்றும் இன்றைய கிடைப்பை பார்க்க எந்த போன் கேமராவிலும் ஸ்கேன் செய்யுங்கள்", 
    te: "ప్రొఫైల్ మరియు లభ్యతను చూడటానికి ఏ ఫోన్ కెమెరాతోనైనా స్కాన్ చేయండి", 
    hi: "प्रोफ़ाइल और आज की उपलब्धता देखने के लिए किसी भी फोन कैमरे से स्कैन करें" 
  },
  printFlyer: { 
    en: "Print Flyer / Card", 
    kn: "ಫ್ಲೈಯರ್ ಮುದ್ರಿಸಿ", 
    ta: "துண்டுப்பிரசுரத்தை அச்சிடுங்கள்", 
    te: "కరపత్రం ప్రింట్ చేయండి", 
    hi: "फ़्लायर प्रिंट करें" 
  },
  downloadQrPng: { 
    en: "Download QR Image", 
    kn: "ಕ್ಯೂಆರ್ ಚಿತ್ರ ಡೌನ್‌ಲೋಡ್", 
    ta: "QR படத்தைப் பதிவிறக்குக", 
    te: "QR చిత్రాన్ని డౌన్‌లోడ్ చేయండి", 
    hi: "क्यूआर इमेज डाउनलोड करें" 
  },
  copyShareLink: { 
    en: "Copy Profile Link", 
    kn: "ಪ್ರೊಫೈಲ್ ಲಿಂಕ್ ಕಾಪಿ", 
    ta: "சுயவிவர இணைப்பை நகலெடு", 
    te: "ప్రొఫైల్ లింక్‌ను కాపీ చేయండి", 
    hi: "प्रोफ़ाइल लिंक कॉपी करें" 
  },
  linkCopied: { 
    en: "Link Copied!", 
    kn: "ಲಿಂಕ್ ಕಾಪಿ ಆಗಿದೆ!", 
    ta: "இணைப்பு நகலெடுக்கப்பட்டது!", 
    te: "లింక్ కాపీ చేయబడింది!", 
    hi: "लिंक कॉपी हो गया!" 
  },
  generatingQr: { 
    en: "Generating QR Code...", 
    kn: "ಕ್ಯೂಆರ್ ಕೋಡ್ ರಚಿಸಲಾಗುತ್ತಿದೆ...", 
    ta: "QR குறியீடு உருவாக்கப்படுகிறது...", 
    te: "QR కోడ్ రూపొందించబడుతోంది...", 
    hi: "क्यूआर कोड बनाया जा रहा है..." 
  },

  // Skills
  skillAll: { 
    en: "All Skills", 
    kn: "ಎಲ್ಲಾ ಕೌಶಲ್ಯಗಳು", 
    ta: "அனைத்து திறன்கள்", 
    te: "అన్ని నైపుణ్యాలు", 
    hi: "सभी कौशल" 
  },
  skillPainting: { 
    en: "Painting", 
    kn: "ಪೇಂಟಿಂಗ್ (Painting)", 
    ta: "வர்ணம் பூசுதல் (Painting)", 
    te: "పెయింటింగ్ (Painting)", 
    hi: "पेंटिंग (Painting)" 
  },
  skillPlumbing: { 
    en: "Plumbing", 
    kn: "ಪ್ಲಂಬಿಂಗ್ (Plumbing)", 
    ta: "குழாய் வேலை (Plumbing)", 
    te: "ప్లంబింగ్ (Plumbing)", 
    hi: "नलसाजी (Plumbing)" 
  },
  skillElectrical: { 
    en: "Electrical", 
    kn: "ವಿದ್ಯುತ್ (Electrical)", 
    ta: "மின் வேலை (Electrical)", 
    te: "ఎలక్ట్రికల్ (Electrical)", 
    hi: "बिजली काम (Electrical)" 
  },
  skillGardening: { 
    en: "Gardening", 
    kn: "ತೋಟಗಾರಿಕೆ (Gardening)", 
    ta: "தோட்டக்கலை (Gardening)", 
    te: "తోటపని (Gardening)", 
    hi: "बागवानी (Gardening)" 
  },
  skillTiling: { 
    en: "Tiling", 
    kn: "ಟೈಲ್ಸ್ (Tiling)", 
    ta: "டைல்ஸ் வேலை (Tiling)", 
    te: "టైలింగ్ (Tiling)", 
    hi: "टाइल्स (Tiling)" 
  },
  skillCarpentry: { 
    en: "Carpentry", 
    kn: "ಬಡಗಿ (Carpentry)", 
    ta: "தச்சு வேலை (Carpentry)", 
    te: "వడ్రంగి (Carpentry)", 
    hi: "बढ़ईगीरी (Carpentry)" 
  },
  skillMasonry: { 
    en: "Masonry", 
    kn: "ಗಾರೆ ಕೆಲಸ (Masonry)", 
    ta: "கொத்தனார் வேலை (Masonry)", 
    te: "మేస్త్రీ పని (Masonry)", 
    hi: "राजमिस्त्री (Masonry)" 
  },
  skillCleaning: { 
    en: "Cleaning", 
    kn: "ಸ್ವಚ್ಛತೆ (Cleaning)", 
    ta: "சுத்தம் செய்தல் (Cleaning)", 
    te: "శుభ్రపరచడం (Cleaning)", 
    hi: "सफाई (Cleaning)" 
  },

  // Worker Form Section
  workerProfileHeader: { 
    en: "Artisan Profile Management", 
    kn: "ಕೆಲಸಗಾರರ ಪ್ರೊಫೈಲ್ ನಿರ್ವಹಣೆ", 
    ta: "தொழிலாளர் சுயவிவர மேலாண்மை", 
    te: "కార్మికుడి ప్రొఫైల్ నిర్వహణ", 
    hi: "कारीगर प्रोफ़ाइल प्रबंधन" 
  },
  workerProfileSub: {
    en: "Manage your direct wage listing, location hub, trade skills, and portfolio photos.",
    kn: "ನಿಮ್ಮ ದಿನಗೂಲಿ ದರ, ಸ್ಥಳ, ಕೌಶಲ್ಯಗಳು ಮತ್ತು ಹಿಂದಿನ ಕೆಲಸದ ಫೋಟೋಗಳನ್ನು ನಿರ್ವಹಿಸಿ.",
    ta: "உங்கள் தினசரி கூலி, இருப்பிடம், திறன்கள் மற்றும் புகைப்படங்களை நிர்வகிக்கவும்.",
    te: "మీ రోజువారీ వేతనం, స్థానం, నైపుణ్యాలు మరియు ఫోటోలను నిర్వహించండి.",
    hi: "अपनी दिहाड़ी मजदूरी, स्थान, कौशल और कार्य फ़ोटो प्रबंधित करें।"
  },
  yourFullName: { 
    en: "Full Name", 
    kn: "ಪೂರ್ಣ ಹೆಸರು", 
    ta: "முழு பெயர்", 
    te: "పూర్తి పేరు", 
    hi: "पूरा नाम" 
  },
  phoneNumber: { 
    en: "Phone number", 
    kn: "ಫೋನ್ ಸಂಖ್ಯೆ", 
    ta: "தொலைபேசி எண்", 
    te: "ఫోన్ నంబర్", 
    hi: "फ़ोन नंबर" 
  },
  dailyWageRate: { 
    en: "Daily rate (₹)", 
    kn: "ದಿನಗೂಲಿ ದರ (₹)", 
    ta: "தினசரி கூலி (₹)", 
    te: "రోజువారీ రేటు (₹)", 
    hi: "दैनिक दर (₹)" 
  },
  workExperience: { 
    en: "Years of experience", 
    kn: "ಕೆಲಸದ ಅನುಭವ (ವರ್ಷಗಳು)", 
    ta: "அனுபவம் (ஆண்டுகள்)", 
    te: "అనుభవం (సంవత్సరాలు)", 
    hi: "अनुभव (साल)" 
  },
  locationHubSelect: { 
    en: "Where you work", 
    kn: "ನೀವು ಕೆಲಸ ಮಾಡುವ ಪ್ರದೇಶ", 
    ta: "நீங்கள் வேலை செய்யும் இடம்", 
    te: "మీరు పని చేసే ప్రాంతం", 
    hi: "आप कहाँ काम करते हैं" 
  },
  availabilityToggle: { 
    en: "I am available for work today", 
    kn: "ನಾನು ಇಂದು ಕೆಲಸಕ್ಕೆ ಲಭ್ಯವಿದ್ದೇನೆ", 
    ta: "நான் இன்று வேலைக்கு கிடைக்கிறேன்", 
    te: "నేను ఈరోజు పనికి అందుబాటులో ఉన్నాను", 
    hi: "मैं आज काम के लिए उपलब्ध हूं" 
  },
  aboutBio: { 
    en: "About you", 
    kn: "ನಿಮ್ಮ ಬಗ್ಗೆ", 
    ta: "உங்களைப் பற்றி", 
    te: "మీ గురించి", 
    hi: "आपके बारे में" 
  },
  saveProfile: { 
    en: "Save & Publish Profile", 
    kn: "ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ ಮತ್ತು ಪ್ರಕಟಿಸಿ", 
    ta: "சுயவிவரத்தை சேமித்து வெளியிடுக", 
    te: "ప్రొఫైల్‌ను సేవ్ చేసి ప్రచురించండి", 
    hi: "प्रोफ़ाइल सहेजें और प्रकाशित करें" 
  },
  savingProfile: { 
    en: "Saving...", 
    kn: "ಉಳಿಸಲಾಗುತ್ತಿದೆ...", 
    ta: "சேமிக்கப்படுகிறது...", 
    te: "సేవ్ అవుతోంది...", 
    hi: "सहेजा जा रहा है..." 
  },
  profileSaved: { 
    en: "Saved ✓", 
    kn: "ಉಳಿಸಲಾಗಿದೆ ✓", 
    ta: "சேமிக்கப்பட்டது ✓", 
    te: "సేవ్ అయింది ✓", 
    hi: "सहेजा गया ✓" 
  },

  // Language Switcher
  language: { 
    en: "Language", 
    kn: "ಭಾಷೆ", 
    ta: "மொழி", 
    te: "భాష", 
    hi: "भाषा" 
  },
  english: { 
    en: "English", 
    kn: "English", 
    ta: "English", 
    te: "English", 
    hi: "English" 
  },
  kannada: { 
    en: "Kannada", 
    kn: "ಕನ್ನಡ", 
    ta: "கன்னடம்", 
    te: "కన్నడ", 
    hi: "कन्नड़" 
  },
  tamil: { 
    en: "Tamil", 
    kn: "ತಮಿಳು", 
    ta: "தமிழ்", 
    te: "తమిళం", 
    hi: "तमिल" 
  },
  telugu: { 
    en: "Telugu", 
    kn: "ತೆಲುಗು", 
    ta: "தெலுங்கு", 
    te: "తెలుగు", 
    hi: "तेलुगु" 
  },
  hindi: { 
    en: "Hindi", 
    kn: "ಹಿಂದಿ", 
    ta: "இந்தி", 
    te: "హిందీ", 
    hi: "हिन्दी" 
  },

  // Search History
  recentSkillSearches: { 
    en: "Recent Skill Searches", 
    kn: "ಇತ್ತೀಚಿನ ಕೌಶಲ್ಯ ಹುಡುಕಾಟಗಳು", 
    ta: "சமீபத்திய திறன் தேடல்கள்", 
    te: "ఇటీవలి నైపుణ్య శోధనలు", 
    hi: "हाल की कौशल खोजें" 
  },
  clearHistory: { 
    en: "Clear", 
    kn: "ತೆರವುಗೊಳಿಸಿ", 
    ta: "அழி", 
    te: "క్లియర్", 
    hi: "हटाएं" 
  },
  recentSearchesEmpty: { 
    en: "No recent skill searches", 
    kn: "ಯಾವುದೇ ಇತ್ತೀಚಿನ ಹುಡುಕಾಟಗಳಿಲ್ಲ", 
    ta: "சமீபத்திய தேடல்கள் இல்லை", 
    te: "ఇటీవలి శోధనలు లేవు", 
    hi: "कोई हाल की खोज नहीं" 
  },
  quickAccess: { 
    en: "Quick Access", 
    kn: "ತ್ವರಿತ ಪ್ರವೇಶ", 
    ta: "விரைவு அணுகல்", 
    te: "త్వరిత యాక్సెస్", 
    hi: "त्वरित पहुंच" 
  },

  // Availability & Schedule
  timeline7Days: { 
    en: "7-Day Availability Timeline", 
    kn: "7-ದಿನಗಳ ಲಭ್ಯತೆಯ ಟೈಮ್‌ಲೈನ್‌", 
    ta: "7-நாள் கிடைக்கும் காலவரிசை", 
    te: "7-రోజుల లభ్యత టైమ్‌లైన్", 
    hi: "7-दिवसीय उपलब्धता समयरेखा" 
  },
  freeSlotsCount: { 
    en: "Free Slots", 
    kn: "ಲಭ್ಯವಿರುವ ದಿನಗಳು", 
    ta: "கிடைக்கும் இடங்கள்", 
    te: "ఖాళీ స్లాట్‌లు", 
    hi: "उपलब्ध स्लॉट" 
  },
  availableAllWeek: { 
    en: "Full Week Free", 
    kn: "ಈ ವಾರ ಪೂರ್ಣ ಲಭ್ಯ", 
    ta: "முழு வாரம் கிடைக்கும்", 
    te: "వారమంతా అందుబాటులో ఉంది", 
    hi: "पूरा सप्ताह उपलब्ध" 
  },
  clickToInquireSlot: { 
    en: "Click to select date for inquiry", 
    kn: "ವಿಚಾರಣೆಗೆ ದಿನಾಂಕ ಆಯ್ಕೆಮಾಡಿ", 
    ta: "விசாரிக்க தேதியைத் தேர்ந்தெடுக்கவும்", 
    te: "విచారణ కోసం తేదీని ఎంచుకోండి", 
    hi: "पूछताछ के लिए तिथि चुनें" 
  },
  upcomingAvailability: { 
    en: "Upcoming Availability", 
    kn: "ಮುಂದಿನ ಲಭ್ಯತೆ", 
    ta: "வரவிருக்கும் கிடைக்கும் நாட்கள்", 
    te: "రాబోయే లభ్యత", 
    hi: "आगामी उपलब्धता" 
  },
  scheduleLeave: { 
    en: "Upcoming Availability & Busy Dates", 
    kn: "ಮುಂದಿನ ದಿನಗಳ ಲಭ್ಯತೆ ಮತ್ತು ರಜೆಯ ದಿನಗಳು", 
    ta: "வரவிருக்கும் கிடைக்கும் மற்றும் விடுப்பு நாட்கள்", 
    te: "రాబోయే లభ్యత మరియు సెలవు తేదీలు", 
    hi: "आगामी उपलब्धता और व्यस्त तिथियां" 
  },
  datePickerHelper: {
    en: "Click dates below to mark days you are busy or on leave. Customers will see your availability and won't call you for these days.",
    kn: "ನೀವು ಲಭ್ಯವಿಲ್ಲದ ಅಥವಾ ರಜೆಯಲ್ಲಿರುವ ದಿನಗಳನ್ನು ಗುರುತಿಸಲು ಕೆಳಗಿನ ದಿನಾಂಕಗಳನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ. ಗ್ರಾಹಕರು ಇದನ್ನು ನೋಡಬಹುದು.",
    ta: "நீங்கள் பிஸியாக அல்லது விடுப்பில் உள்ள நாட்களைக் குறிக்க கீழே உள்ள தேதிகளைக் கிளிக் செய்க. வாடிக்கையாளர்கள் இதை பார்க்க முடியும்.",
    te: "మీరు బిజీగా లేదా సెలవులో ఉన్న రోజులను గుర్తించడానికి క్రింది తేదీలను క్లిక్ చేయండి. కస్టమర్‌లు మీ లభ్యతను చూస్తారు.",
    hi: "जिन दिनों आप व्यस्त हैं या छुट्टी पर हैं, उन्हें चिह्नित करने के लिए नीचे दी गई तिथियों पर क्लिक करें। ग्राहक आपकी उपलब्धता देखेंगे।"
  },
  markUnavailable: { 
    en: "Mark Unavailable", 
    kn: "ಲಭ್ಯವಿಲ್ಲ ಎಂದು ಗುರುತಿಸಿ", 
    ta: "கிடைக்கவில்லை எனக் குறி", 
    te: "అందుబాటులో లేరు అని గుర్తించు", 
    hi: "अनुपलब्ध चिह्नित करें" 
  },
  markAvailable: { 
    en: "Mark Available", 
    kn: "ಲಭ್ಯವಿದ್ದಾರೆ ಎಂದು ಗುರುತಿಸಿ", 
    ta: "கிடைக்கிறார் எனக் குறி", 
    te: "అందుబాటులో ఉన్నారు అని గుర్తించు", 
    hi: "उपलब्ध चिह्नित करें" 
  },
  markedBusy: { 
    en: "Busy / Unavailable", 
    kn: "ಕಾರ್ಯನಿರತ / ಲಭ್ಯವಿಲ್ಲ", 
    ta: "பிஸி / கிடைக்கவில்லை", 
    te: "బిజీ / అందుబాటులో లేరు", 
    hi: "व्यस्त / अनुपलब्ध" 
  },
  availableForHire: { 
    en: "Available for Hire", 
    kn: "ಕೆಲಸಕ್ಕೆ ಲಭ್ಯ", 
    ta: "வேலைக்கு தயார்", 
    te: "పనికి సిద్ధం", 
    hi: "काम के लिए तैयार" 
  },
  markTomorrowBusy: { 
    en: "Mark Tomorrow Busy", 
    kn: "ನಾಳೆ ಕಾರ್ಯನಿರತ", 
    ta: "நாளை பிஸி", 
    te: "రేపు బిజీ", 
    hi: "कल व्यस्त" 
  },
  markWeekendBusy: { 
    en: "Mark Weekend Busy", 
    kn: "ವಾರಾಂತ್ಯ ರಜೆ", 
    ta: "வார இறுதி விடுப்பு", 
    te: "వారాంతపు సెలవు", 
    hi: "सप्ताहांत अवकाश" 
  },
  clearAllDates: { 
    en: "Clear All Dates", 
    kn: "ಎಲ್ಲಾ ದಿನಾಂಕಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ", 
    ta: "அனைத்து தேதிகளையும் அழி", 
    te: "అన్ని తేదీలను క్లియర్ చేయండి", 
    hi: "सभी तिथियां साफ़ करें" 
  },
  today: { 
    en: "Today", 
    kn: "ಇಂದು", 
    ta: "இன்று", 
    te: "ఈరోజు", 
    hi: "आज" 
  },
  tomorrow: { 
    en: "Tomorrow", 
    kn: "ನಾಳೆ", 
    ta: "நாளை", 
    te: "రేపు", 
    hi: "कल" 
  },
  busyOnDate: { 
    en: "Busy on this date", 
    kn: "ಈ ದಿನಾಂಕದಂದು ಕಾರ್ಯನಿರತ", 
    ta: "இந்த தேதியில் பிஸி", 
    te: "ఈ తేదీన బిజీ", 
    hi: "इस तारीख को व्यस्त" 
  },
  availableOnDate: { 
    en: "Available on this date", 
    kn: "ಈ ದಿನಾಂಕದಂದು ಲಭ್ಯವಿದ್ದಾರೆ", 
    ta: "இந்த தேதியில் கிடைக்கிறார்", 
    te: "ఈ తేదీన అందుబాటులో ఉన్నారు", 
    hi: "इस तारीख को उपलब्ध हैं" 
  },
  noUnavailableDatesNotice: { 
    en: "Worker is currently available on all upcoming days!", 
    kn: "ಕೆಲಸಗಾರರು ಎಲ್ಲಾ ಮುಂದಿನ ದಿನಗಳಲ್ಲಿ ಲಭ್ಯವಿದ್ದಾರೆ!",
    ta: "தொழிலாளி வரும் அனைத்து நாட்களிலும் கிடைக்கிறார்!",
    te: "కార్మికుడు రాబోయే అన్ని రోజులలో అందుబాటులో ఉన్నారు!",
    hi: "कारीगर आगामी सभी दिनों में उपलब्ध हैं!"
  },
  markedDatesCount: { 
    en: "Marked Unavailable Dates", 
    kn: "ಗುರುತಿಸಲಾದ ರಜೆಯ ದಿನಗಳು", 
    ta: "குறிக்கப்பட்ட விடுப்பு நாட்கள்", 
    te: "గుర్తించబడిన సెలవు తేదీలు", 
    hi: "चिह्नित अवकाश तिथियां" 
  },
  addSpecificDate: { 
    en: "Pick custom future date", 
    kn: "ಇನ್ನೊಂದು ನಿರ್ದಿಷ್ಟ ದಿನಾಂಕ ಆಯ್ಕೆಮಾಡಿ", 
    ta: "வேறு தேதியைத் தேர்ந்தெடுக்கவும்", 
    te: "కస్టమ్ తేదీని ఎంచుకోండి", 
    hi: "कस्टम तिथि चुनें" 
  },
  addDateButton: { 
    en: "Mark Date", 
    kn: "ದಿನಾಂಕ ಸೇರಿಸಿ", 
    ta: "தேதியைச் சேர்", 
    te: "తేదీని జోడించు", 
    hi: "तिथि जोड़ें" 
  },
  earnings30Days: { 
    en: "Earnings Over the Past 30 Days", 
    kn: "ಕಳೆದ 30 ದಿನಗಳ ಗಳಿಕೆ", 
    ta: "கடந்த 30 நாட்களின் வருவாய்", 
    te: "గత 30 రోజుల సంపాదన", 
    hi: "पिछले 30 दिनों की कमाई" 
  },
  directIncome: { 
    en: "Direct Income", 
    kn: "ನೇರ ಗಳಿಕೆ", 
    ta: "நேரடி வருமானம்", 
    te: "ప్రత్యక్ష ఆదాయం", 
    hi: "प्रत्यक्ष आय" 
  },
  trend: { 
    en: "Trend", 
    kn: "ಟ್ರೆಂಡ್", 
    ta: "போக்கு", 
    te: "ట్రెండ్", 
    hi: "ट्रेंड" 
  },
  dailyBars: { 
    en: "Daily Bars", 
    kn: "ದೈನಂದಿನ ಬಾರ್", 
    ta: "தினசரி பார்கள்", 
    te: "రోజువారీ బార్లు", 
    hi: "दैनिक बार्स" 
  },
  dailyAverage: { 
    en: "Daily Average", 
    kn: "ದೈನಂದಿನ ಸರಾಸರಿ", 
    ta: "தினசரி சராசரி", 
    te: "రోజువారీ సగటు", 
    hi: "दैनिक औसत" 
  },
  activeWorkDays: { 
    en: "Active Work Days", 
    kn: "ಕೆಲಸದ ದಿನಗಳು", 
    ta: "வேலை நாட்கள்", 
    te: "పని దినాలు", 
    hi: "काम के दिन" 
  },
  peakSingleDay: { 
    en: "Peak Single Day", 
    kn: "ಹೆಚ್ಚು ಗಳಿಕೆಯ ದಿನ", 
    ta: "அதிகபட்ச வருவாய் நாள்", 
    te: "గరిష్ట ఆదాయం రోజు", 
    hi: "उच्चतम एकल दिन" 
  },

  // Notification Bell
  notifications: {
    en: "Notifications",
    kn: "ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ಸಂದೇಶಗಳು",
    ta: "அறிவிப்புகள்",
    te: "నోటిఫికేషన్‌లు",
    hi: "सूचनाएं"
  },
  newInquiryAlert: {
    en: "New Customer Inquiry",
    kn: "ಹೊಸ ಗ್ರಾಹಕರ ವಿಚಾರಣೆ",
    ta: "புதிய வாடிக்கையாளர் விசாரணை",
    te: "కొత్త కస్టమర్ విచారణ",
    hi: "नई ग्राहक पूछताछ"
  },
  newReviewAlert: {
    en: "New Review Received",
    kn: "ಹೊಸ ವಿಮರ್ಶೆ ಬಂದಿದೆ",
    ta: "புதிய மதிப்புரை பெறப்பட்டது",
    te: "కొత్త సమీక్ష స్వీకరించబడింది",
    hi: "नई समीक्षा प्राप्त हुई"
  },
  markAllRead: {
    en: "Mark all read",
    kn: "ಎಲ್ಲವನ್ನೂ ಓದಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ",
    ta: "அனைத்தையும் படித்ததாகக் குறி",
    te: "అన్నీ చదివినట్లు గుర్తించు",
    hi: "सभी को पढ़ा हुआ चिह्नित करें"
  },
  noNotifications: {
    en: "No new notifications",
    kn: "ಯಾವುದೇ ಹೊಸ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ",
    ta: "புதிய அறிவிப்புகள் இல்லை",
    te: "కొత్త నోటిఫికేషన్‌లు లేవు",
    hi: "कोई नई सूचनाएं नहीं"
  },
  noNotificationsDesc: {
    en: "You'll be notified when homeowners inquire about work or leave reviews on your profile.",
    kn: "ಗ್ರಾಹಕರು ಕೆಲಸದ ವಿಚಾರಣೆ ಕಳುಹಿಸಿದಾಗ ಅಥವಾ ವಿಮರ್ಶೆ ಬರೆದಾಗ ಇಲ್ಲಿ ಎಚ್ಚರಿಕೆ ಕಾಣಿಸುತ್ತದೆ.",
    ta: "வீட்டு உரிமையாளர்கள் வேலை பற்றி விசாரிக்கும் போது அல்லது மதிப்புரைகளை விடும் போது உங்களுக்கு அறிவிக்கப்படும்.",
    te: "గృహ యజమానులు పని గురించి విచారించినప్పుడు లేదా సమీక్షలను అందించినప్పుడు మీకు తెలియజేయబడుతుంది.",
    hi: "जब मकान मालिक काम के बारे में पूछताछ करेंगे या आपकी प्रोफ़ाइल पर समीक्षा छोड़ेंगे, तो आपको यहां सूचित किया जाएगा।"
  },
  unreadAlerts: {
    en: "unread",
    kn: "ಓದದಿರುವ",
    ta: "படிக்காதவை",
    te: "చదవనివి",
    hi: "अपठित"
  },
  viewInquiriesTab: {
    en: "View Details",
    kn: "ವಿವರ ನೋಡಿ",
    ta: "விவரங்களைக் காண்க",
    te: "వివరాలను చూడండి",
    hi: "विवरण देखें"
  },

  // Skill Level Chart & Sliders
  skillRadarTitle: {
    en: "Your skill level",
    kn: "ನಿಮ್ಮ ಕೌಶಲ್ಯ ಮಟ್ಟ",
    ta: "உங்கள் திறன் நிலை",
    te: "మీ నైపుణ్య స్థాయి",
    hi: "आपका कौशल स्तर"
  },
  skillRadarSubtitle: {
    en: "Tell customers how good you are at each skill",
    kn: "ಪ್ರತಿ ಕೌಶಲ್ಯದಲ್ಲಿ ನೀವು ಎಷ್ಟು ನುರಿತರು ಎಂದು ಗ್ರಾಹಕರಿಗೆ ತಿಳಿಸಿ",
    ta: "ஒவ்வொரு திறனிலும் நீங்கள் எவ்வளவு சிறப்பானவர் என்பதை வாடிக்கையாளர்களுக்குத் தெரிவியுங்கள்",
    te: "ప్రతి నైపుణ్యంలో మీరు ఎంత మెరుగ్గా ఉన్నారో కస్టమర్లకు తెలియజేయండి",
    hi: "ग्राहकों को बताएं कि आप प्रत्येक काम में कितने कुशल हैं"
  },
  selectSkillsFirstForRadar: {
    en: "Pick at least 1 skill above to set your level.",
    kn: "ನಿಮ್ಮ ಕೌಶಲ್ಯ ಮಟ್ಟವನ್ನು ಹೊಂದಿಸಲು ಮೇಲಿನ ಕನಿಷ್ಠ 1 ಕೌಶಲ್ಯವನ್ನು ಆರಿಸಿ.",
    ta: "உங்கள் நிலையை அமைக்க மேலே குறைந்தபட்சம் 1 திறனைத் தேர்ந்தெடுக்கவும்.",
    te: "మీ స్థాయిని సెట్ చేయడానికి పైన కనీసం 1 నైపుణ్యాన్ని ఎంచుకోండి.",
    hi: "अपना स्तर सेट करने के लिए ऊपर कम से कम 1 कौशल चुनें।"
  },
  pickSkillHintForLevel: {
    en: "Choose your skills above to set how confident you feel in each one.",
    kn: "ಪ್ರತಿ ಕೆಲಸದಲ್ಲಿ ನಿಮ್ಮ ಅನುಭವವನ್ನು ತಿಳಿಸಲು ಮೇಲಿನ ಕೌಶಲ್ಯಗಳನ್ನು ಆರಿಸಿ.",
    ta: "ஒவ்வொரு வேலையிலும் உங்கள் திறனை அமைக்க மேலே உள்ள திறன்களைத் தேர்ந்தெடுக்கவும்.",
    te: "ప్రతి పనిలో మీ స్థాయిని సెట్ చేయడానికి పైన నైపుణ్యాలను ఎంచుకోండి.",
    hi: "प्रत्येक काम में अपना स्तर तय करने के लिए ऊपर से अपने कौशल चुनें।"
  },
  overallMastery: {
    en: "Overall level",
    kn: "ಒಟ್ಟು ಮಟ್ಟ",
    ta: "மொத்த நிலை",
    te: "మొత్తం స్థాయి",
    hi: "कुल स्तर"
  },
  craftsmanshipStandards: {
    en: "Work Quality",
    kn: "ಕೆಲಸದ ಗುಣಮಟ್ಟ",
    ta: "வேலை தரம்",
    te: "పని నాణ్యత",
    hi: "काम की गुणवत्ता"
  },
  setYourLevel: {
    en: "Set your level",
    kn: "ನಿಮ್ಮ ಮಟ್ಟವನ್ನು ಹೊಂದಿಸಿ",
    ta: "உங்கள் நிலையை அமைக்கவும்",
    te: "మీ స్థాయిని సెట్ చేయండి",
    hi: "अपना स्तर सेट करें"
  },
  quickSetAll: {
    en: "Quick set:",
    kn: "ತ್ವರಿತ ಆಯ್ಕೆ:",
    ta: "விரைவு தேர்வு:",
    te: "త్వరిత ఎంపిక:",
    hi: "त्वरित सेट:"
  },
  workQualityBenchmark: {
    en: "Work Quality",
    kn: "ಕೆಲಸದ ಗುಣಮಟ್ಟ",
    ta: "வேலை தரம்",
    te: "పని నాణ్యత",
    hi: "काम की गुणवत्ता"
  },
  punctualityBenchmark: {
    en: "On Time",
    kn: "ಸಮಯಪಾಲನೆ",
    ta: "நேரந்தவறாமை",
    te: "సమయపాలన",
    hi: "समय की पाबंदी"
  },
  safetyToolsBenchmark: {
    en: "Tools & Safety",
    kn: "ಸಲಕರಣೆ ಮತ್ತು ಸುರಕ್ಷತೆ",
    ta: "கருவிகள் & பாதுகாப்பு",
    te: "పరికరాలు & భద్రತೆ",
    hi: "औजार और सुरक्षा"
  },
  tierMaster: {
    en: "Expert",
    kn: "ಪರಿಣತ",
    ta: "நிபுணர்",
    te: "నిపుణుడు",
    hi: "माहिर"
  },
  tierAdvanced: {
    en: "Very Good",
    kn: "ಉತ್ತಮ",
    ta: "மிக நன்று",
    te: "చాలా బాగుంది",
    hi: "बहुत अच्छा"
  },
  tierSkilled: {
    en: "Good",
    kn: "ಚೆನ್ನಾಗಿದೆ",
    ta: "நன்று",
    te: "బాగుంది",
    hi: "अच्छा"
  },
  tierCompetent: {
    en: "Standard",
    kn: "ಸಾಮಾನ್ಯ",
    ta: "சாதாரண",
    te: "సాధారణ",
    hi: "सामान्य"
  },

  // Simplified Worker Profile UI Labels
  welcomeLabel: {
    en: "Welcome",
    kn: "ಸ್ವಾಗತ",
    ta: "நல்வரவு",
    te: "స్వాగతం",
    hi: "स्वागत है"
  },
  browseDirectoryBtn: {
    en: "Browse Directory",
    kn: "ಕೆಲಸಗಾರರನ್ನು ನೋಡಿ",
    ta: "பட்டியலைப் பார்",
    te: "జాబితా చూడండి",
    hi: "सूची देखें"
  },
  signOutBtn: {
    en: "Sign Out",
    kn: "ಹೊರಬನ್ನಿ",
    ta: "வெளியேறு",
    te: "సైన్ అవుట్",
    hi: "साइन आउट"
  },
  perfDashboardTab: {
    en: "Performance Dashboard",
    kn: "ನಿಮ್ಮ ಕೆಲಸದ ವಿವರ",
    ta: "செயல்பாடு",
    te: "మీ పని వివరాలు",
    hi: "प्रदर्शन डैशबोर्ड"
  },
  editProfileRatesTab: {
    en: "Edit Profile & Rates",
    kn: "ಪ್ರೊಫೈಲ್ ಮತ್ತು ದರ ಬದಲಿಸಿ",
    ta: "சுயவிவரம் & கூலி மாற்றம்",
    te: "ప్రొఫైల్ & రేట్లు మార్చండి",
    hi: "प्रोफ़ाइल और दर बदलें"
  },
  dashboardShortTab: {
    en: "Dashboard",
    kn: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    ta: "டாஷ்போர்டு",
    te: "డాష్‌బోర్డ్",
    hi: "डैशबोर्ड"
  },
  editProfileShortTab: {
    en: "Edit Profile",
    kn: "ಪ್ರೊಫೈಲ್ ಬದಲಿಸಿ",
    ta: "சுயவிவரம்",
    te: "ప్రొఫైల్ మార్చు",
    hi: "प्रोफ़ाइल बदलें"
  },
  profileWord: {
    en: "Profile",
    kn: "ಪ್ರೊಫೈಲ್",
    ta: "சுயவிவரம்",
    te: "ప్రొఫైల్",
    hi: "प्रोफ़ाइल"
  },
  completeWord: {
    en: "complete",
    kn: "ಪೂರ್ಣಗೊಂಡಿದೆ",
    ta: "முடிந்தது",
    te: "పూర్తయింది",
    hi: "पूरा हुआ"
  },
  fieldsWord: {
    en: "items",
    kn: "ವಿವರಗಳು",
    ta: "விவரங்கள்",
    te: "వివరాలు",
    hi: "जानकारी"
  },
  yourBasicDetails: {
    en: "Your basic details",
    kn: "ನಿಮ್ಮ ಮೂಲ ವಿವರಗಳು",
    ta: "உங்கள் அடிப்படை விவரங்கள்",
    te: "మీ ప్రాథమిక వివరాలు",
    hi: "आपकी बुनियादी जानकारी"
  },
  readyForHireHint: {
    en: "Customers can see you are ready for work today",
    kn: "ಇಂದು ನೀವು ಕೆಲಸಕ್ಕೆ ಸಿದ್ಧರಿದ್ದೀರಿ ಎಂದು ಗ್ರಾಹಕರಿಗೆ ಕಾಣಿಸುತ್ತದೆ",
    ta: "நீங்கள் இன்று வேலைக்குத் தயாராக உள்ளீர்கள் என்பதை வாடிக்கையாளர்கள் பார்க்கலாம்",
    te: "మీరు ఈరోజు పనికి సిద్ధంగా ఉన్నారని కస్టమర్లకు కనిపిస్తుంది",
    hi: "ग्राहक देख सकते हैं कि आप आज काम के लिए तैयार हैं"
  },
  unavailableTodayHint: {
    en: "Currently marked unavailable today",
    kn: "ಇಂದು ಲಭ್ಯವಿಲ್ಲ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ",
    ta: "இன்று கிடைக்கவில்லை எனக் குறிக்கப்பட்டுள்ளது",
    te: "ఈరోజు అందుబాటులో లేరు అని గుర్తించబడింది",
    hi: "आज के लिए अनुपलब्ध के रूप में चिह्नित"
  },
  yourPhotoLabel: {
    en: "Your photo",
    kn: "ನಿಮ್ಮ ಫೋಟೋ",
    ta: "உங்கள் புகைப்படம்",
    te: "మీ ఫోటో",
    hi: "आपकी फ़ोटो"
  },
  addYourPhoto: {
    en: "Add your photo",
    kn: "ನಿಮ್ಮ ಫೋಟೋ ಸೇರಿಸಿ",
    ta: "உங்கள் புகைப்படத்தைச் சேர்",
    te: "మీ ఫోటోను జోడించండి",
    hi: "अपनी फ़ोटो जोड़ें"
  },
  realPhotoHint: {
    en: "A real photo of you gets more calls.",
    kn: "ನಿಮ್ಮ ನಿಜವಾದ ಫೋಟೋ ಇದ್ದರೆ ಹೆಚ್ಚು ಕರೆಗಳು ಬರುತ್ತವೆ.",
    ta: "உங்கள் உண்மையான புகைப்படம் அதிக அழைப்புகளைப் பெற்றுத்தரும்.",
    te: "మీ నిజమైన ఫోటో ఉంటే ఎక్కువ కాల్స్ వస్తాయి.",
    hi: "आपकी असली फ़ोटो होने से ज़्यादा कॉल आते हैं।"
  },
  useSamplePictureInstead: {
    en: "Use a sample picture instead",
    kn: "ಬದಲಿಗೆ ಮಾದರಿ ಚಿತ್ರ ಬಳಸಿ",
    ta: "பதிலாக மாதிரி படத்தைப் பயன்படுத்துக",
    te: "బదులుగా నమూనా చిత్రాన్ని ఉపయోగించండి",
    hi: "इसके बजाय नमूना तस्वीर उपयोग करें"
  },
  hideSamplePictures: {
    en: "Hide sample pictures",
    kn: "ಮಾದರಿ ಚಿತ್ರಗಳನ್ನು ಮರೆಮಾಡಿ",
    ta: "மாதிரி படங்களை மறை",
    te: "నమూనా చిత్రాలను దాచు",
    hi: "नमूना तस्वीरें छिपाएँ"
  },
  samplePicturesTitle: {
    en: "Sample pictures",
    kn: "ಮಾದರಿ ಚಿತ್ರಗಳು",
    ta: "மாதிரி படங்கள்",
    te: "నమూనా చిత్రాలు",
    hi: "नमूना तस्वीरें"
  },
  serviceAreaHint: {
    en: "Where customers can find you",
    kn: "ಗ್ರಾಹಕರು ನಿಮ್ಮನ್ನು ಹುಡುಕಬಹುದಾದ ಪ್ರದೇಶ",
    ta: "வாடிக்கையாளர்கள் உங்களைக் கண்டறியும் பகுதி",
    te: "కస్టమర్లు మిమ్మల్ని కనుగొనగల ప్రాంతం",
    hi: "जहाँ ग्राहक आपको ढूंढ सकते हैं"
  },
  changeButton: {
    en: "Change",
    kn: "ಬದಲಿಸಿ",
    ta: "மாற்று",
    te: "మార్చండి",
    hi: "बदलें"
  },
  selectSkillsLabel: {
    en: "Select skills",
    kn: "ಕೆಲಸದ ಕೌಶಲ್ಯಗಳನ್ನು ಆರಿಸಿ",
    ta: "திறன்களைத் தேர்ந்தெடுக்கவும்",
    te: "నైపుణ్యాలను ఎంచుకోండి",
    hi: "अपने काम चुनें"
  },
  addMoreToGetCalls: {
    en: "Add more to get more calls",
    kn: "ಹೆಚ್ಚು ಕರೆಗಳನ್ನು ಪಡೆಯಲು ಇನ್ನಷ್ಟು ಸೇರಿಸಿ",
    ta: "அதிக அழைப்புகளைப் பெற மேலும் சேர்க்கவும்",
    te: "ఎక్కువ కాల్స్ పొందడానికి మరిన్ని జోడించండి",
    hi: "ज़्यादा कॉल पाने के लिए और जानकारी जोड़ें"
  },
  optionalTag: {
    en: "Optional",
    kn: "ಐಚ್ಛಿಕ",
    ta: "விருப்பம்",
    te: "ఐచ్ఛికం",
    hi: "वैकल्पिक"
  },
  doneTag: {
    en: "✓ Done",
    kn: "✓ ಪೂರ್ಣ",
    ta: "✓ முடிந்தது",
    te: "✓ పూర్తయింది",
    hi: "✓ हो गया"
  },
  aboutYourWorkTitle: {
    en: "About your work",
    kn: "ನಿಮ್ಮ ಕೆಲಸದ ಬಗ್ಗೆ",
    ta: "உங்கள் வேலை பற்றி",
    te: "మీ పని గురించి",
    hi: "आपके काम के बारे में"
  },
  aboutYourWorkHint: {
    en: "Share a short note about your experience",
    kn: "ನಿಮ್ಮ ಕೆಲಸದ ಅನುಭವದ ಬಗ್ಗೆ ಸಣ್ಣ ಮಾಹಿತಿ ಬರೆಯಿರಿ",
    ta: "உங்கள் அனுபவத்தைப் பற்றி சுருக்கமாக எழுதுங்கள்",
    te: "మీ అనుభవం గురించి చిన్న సమాచారం రాయండి",
    hi: "अपने काम के अनुभव के बारे में थोड़ा लिखें"
  },
  aboutPlaceholder: {
    en: "Tell customers about your work",
    kn: "ನಿಮ್ಮ ಕೆಲಸದ ಬಗ್ಗೆ ಗ್ರಾಹಕರಿಗೆ ತಿಳಿಸಿ",
    ta: "உங்கள் வேலையைப் பற்றி வாடிக்கையாளர்களிடம் சொல்லுங்கள்",
    te: "మీ పని గురించి కస్టమర్లకు చెప్పండి",
    hi: "ग्राहकों को अपने काम के बारे में बताएं"
  },
  pastWorkPhotosTitle: {
    en: "Photos of your past work",
    kn: "ನಿಮ್ಮ ಹಿಂದಿನ ಕೆಲಸದ ಫೋಟೋಗಳು",
    ta: "உங்கள் முந்தைய வேலை புகைப்படங்கள்",
    te: "మీ గత పని ఫోటోలు",
    hi: "आपके पिछले काम की फ़ोटो"
  },
  pastWorkPhotosHint: {
    en: "Show customers photos of jobs you finished",
    kn: "ನೀವು ಮಾಡಿದ ಕೆಲಸದ ಫೋಟೋಗಳನ್ನು ಗ್ರಾಹಕರಿಗೆ ತೋರಿಸಿ",
    ta: "நீங்கள் முடித்த வேலைகளின் புகைப்படங்களைக் காட்டுங்கள்",
    te: "మీరు పూర్తి చేసిన పనుల ఫోటోలను చూపించండి",
    hi: "ग्राहकों को अपने किए हुए काम की फ़ोटो दिखाएं"
  },
  pastWorkCustomersSee: {
    en: "Customers will see these photos on your profile",
    kn: "ಗ್ರಾಹಕರು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ಈ ಫೋಟೋಗಳನ್ನು ನೋಡುತ್ತಾರೆ",
    ta: "வாடிக்கையாளர்கள் இந்தப் புகைப்படங்களை உங்கள் சுயவிவரத்தில் பார்ப்பார்கள்",
    te: "కస్టమర్లు మీ ప్రొఫైల్‌లో ఈ ఫోటోలను చూస్తారు",
    hi: "ग्राहक आपकी प्रोफ़ाइल पर ये फ़ोटो देखेंगे"
  },
  addPhotoLinkLabel: {
    en: "Add a photo link",
    kn: "ಫೋಟೋ ಲಿಂಕ್ ಸೇರಿಸಿ",
    ta: "புகைப்பட இணைப்பைச் சேர்",
    te: "ఫోటో లింక్ జోడించండి",
    hi: "फ़ोटो लिंक जोड़ें"
  },
  addPhotoLinkPlaceholder: {
    en: "Paste a photo link here",
    kn: "ಇಲ್ಲಿ ಫೋಟೋ ಲಿಂಕ್ ಹಾಕಿ",
    ta: "இங்கே புகைப்பட இணைப்பை ஒட்டவும்",
    te: "ఇక్కడ ఫోటో లింక్ పేస్ట్ చేయండి",
    hi: "यहाँ फ़ोटो लिंक पेस्ट करें"
  },
  addPhotoBtn: {
    en: "Add Photo",
    kn: "ಫೋಟೋ ಸೇರಿಸಿ",
    ta: "புகைப்படம் சேர்",
    te: "ఫోటో జోడించు",
    hi: "फ़ोटो जोड़ें"
  },
  quickSamplePhotosLabel: {
    en: "Sample work photos",
    kn: "ಮಾದರಿ ಕೆಲಸದ ಫೋಟೋಗಳು",
    ta: "மாதிரி வேலைப் படங்கள்",
    te: "నమూనా పని ఫోటోలు",
    hi: "काम के नमूने की फ़ोटो"
  },
  uploadFromPhoneLabel: {
    en: "Or choose a photo from your phone:",
    kn: "ಅಥವಾ ನಿಮ್ಮ ಫೋನ್‌ನಿಂದ ಫೋಟೋ ಆರಿಸಿ:",
    ta: "அல்லது உங்கள் போனிலிருந்து புகைப்படத்தைத் தேர்ந்தெடுக்கவும்:",
    te: "లేదా మీ ఫోన్ నుండి ఫోటోను ఎంచుకోండి:",
    hi: "या अपने फ़ोन से कोई फ़ोटो चुनें:"
  },
  uploadPhotoBtn: {
    en: "Choose Photo",
    kn: "ಫೋಟೋ ಆರಿಸಿ",
    ta: "புகைப்படம் தேர்ந்தெடு",
    te: "ఫోటో ఎంచుకోండి",
    hi: "फ़ोटो चुनें"
  },
  noPastWorkPhotos: {
    en: "No work photos added yet",
    kn: "ಇನ್ನೂ ಯಾವುದೇ ಕೆಲಸದ ಫೋಟೋ ಸೇರಿಸಿಲ್ಲ",
    ta: "வேலைப் புகைப்படங்கள் எதுவும் சேர்க்கப்படவில்லை",
    te: "ఇంకా పని ఫోటోలు ఏవీ జోడించబడలేదు",
    hi: "अभी तक कोई काम की फ़ोटो नहीं जोड़ी गई है"
  },
  noPastWorkPhotosHint: {
    en: "Tap Add photos above to upload from your camera or gallery.",
    kn: "ಕ್ಯಾಮೆರಾ ಅಥವಾ ಗ್ಯಾಲರಿಯಿಂದ ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಮೇಲಿನ ಫೋಟೋಗಳನ್ನು ಸೇರಿಸಿ ಒತ್ತಿ.",
    ta: "கேமரா அல்லது கேலரியில் இருந்து பதிவேற்ற மேலே உள்ள புகைப்படங்களைச் சேர் என்பதைத் தட்டவும்.",
    te: "కెమెరా లేదా గ్యాలరీ నుండి అప్‌లోడ్ చేయడానికి పైన ఉన్న ఫోటోలు జోడించు నొక్కండి.",
    hi: "कैमरा या गैलरी से अपलोड करने के लिए ऊपर फ़ोटो जोड़ें पर टैप करें।"
  },
  yourPhotosLabel: {
    en: "Your photos",
    kn: "ನಿಮ್ಮ ಫೋಟೋಗಳು",
    ta: "உங்கள் புகைப்படங்கள்",
    te: "మీ ఫోటోలు",
    hi: "आपकी फ़ोटो"
  },
  tapPhotoToRemove: {
    en: "Tap a photo to remove it",
    kn: "ತೆಗೆದುಹಾಕಲು ಫೋಟೋ ಮೇಲೆ ಒತ್ತಿ",
    ta: "நீக்க புகைப்படத்தைத் தட்டவும்",
    te: "తీసివేయడానికి ఫోటోపై నొక్కండి",
    hi: "हटाने के लिए फ़ोटो पर टैप करें"
  },
  skillLevelTitle: {
    en: "Skill level",
    kn: "ಕೌಶಲ್ಯ ಮಟ್ಟ",
    ta: "திறன் நிலை",
    te: "నైపుణ్య స్థాయి",
    hi: "कौशल स्तर"
  },
  skillLevelHint: {
    en: "Tell customers how good you are at each skill",
    kn: "ಪ್ರತಿ ಕೌಶಲ್ಯದಲ್ಲಿ ನೀವು ಎಷ್ಟು ನುರಿತರು ಎಂದು ಗ್ರಾಹಕರಿಗೆ ತಿಳಿಸಿ",
    ta: "ஒவ்வொரு திறனிலும் நீங்கள் எவ்வளவு சிறப்பானவர் என்பதைத் தெரிவியுங்கள்",
    te: "ప్రతి నైపుణ్యంలో మీరు ఎంత మెరుగ్గా ఉన్నారో తెలియజేయండి",
    hi: "ग्राहकों को बताएं कि आप हर काम में कितने कुशल हैं"
  },
  busyDaysTitle: {
    en: "Busy days / availability calendar",
    kn: "ರಜೆಯ ದಿನಗಳು / ಲಭ್ಯತೆಯ ಕ್ಯಾಲೆಂಡರ್",
    ta: "விடுமுறை நாட்கள் / கிடைக்கும் நாட்காட்டி",
    te: "బిజీ రోజులు / లభ్యత క్యాలెండర్",
    hi: "व्यस्त दिन / उपलब्धता कैलेंडर"
  },
  busyDaysHint: {
    en: "Mark days you are busy or on leave",
    kn: "ನೀವು ಕೆಲಸಕ್ಕೆ ಬರಲಾಗದ ದಿನಗಳನ್ನು ಗುರುತಿಸಿ",
    ta: "நீங்கள் வேலைக்கு வர முடியாத நாட்களைக் குறிக்கவும்",
    te: "మీరు పనికి అందుబాటులో లేని రోజులను గుర్తించండి",
    hi: "जिन दिनों आप काम पर नहीं जा सकते उन्हें चिह्नित करें"
  },
  printableQrTitle: {
    en: "Printable QR code",
    kn: "ಪ್ರಿಂಟ್ ಮಾಡಬಹುದಾದ QR ಕೋಡ್",
    ta: "அச்சிடக்கூடிய QR குறியீடு",
    te: "ప్రింట్ చేయదగిన QR కోడ్",
    hi: "प्रिंट करने योग्य QR कोड"
  },
  printableQrHint: {
    en: "Print a card or flyer for your profile",
    kn: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್‌ಗಾಗಿ ಕಾರ್ಡ್ ಅಥವಾ ಕರಪತ್ರ ಪ್ರಿಂಟ್ ಮಾಡಿ",
    ta: "உங்கள் சுயவிவரத்திற்கான கார்டு அல்லது துண்டுப்பிரசுரத்தை அச்சிடுங்கள்",
    te: "మీ ప్రొఫైల్ కోసం కార్డ్ లేదా ఫ్లైయర్‌ను ప్రింట్ చేయండి",
    hi: "अपनी प्रोफ़ाइल के लिए कार्ड या पर्चा प्रिंट करें"
  },
  yourProfileLiveToast: {
    en: "Your profile is live",
    kn: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಲೈವ್ ಆಗಿದೆ",
    ta: "உங்கள் சுயவிவரம் நேரலையில் உள்ளது",
    te: "మీ ప్రొఫైల్ లైవ్‌లో ఉంది",
    hi: "आपकी प्रोफ़ाइल लाइव हो गई है"
  },
  unsavedChangesLabel: {
    en: "Unsaved changes",
    kn: "ಉಳಿಸದ ಬದಲಾವಣೆಗಳು",
    ta: "சேமிக்காத மாற்றங்கள்",
    te: "సేవ్ చేయని మార్పులు",
    hi: "सहेजे न गए बदलाव"
  },
  couldNotSaveError: {
    en: "Could not save. Please try again.",
    kn: "ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    ta: "சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    te: "సేవ్ చేయలేకపోయాము. దయచేసి మళ్ళీ ప్రయత్నించండి.",
    hi: "सहेजा नहीं जा सका। कृपया फिर से प्रयास करें।"
  },
  dailyRateRequiredError: {
    en: "Please enter your daily rate",
    kn: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ದಿನಗೂಲಿ ದರವನ್ನು ನಮೂದಿಸಿ",
    ta: "தயவுசெய்து உங்கள் தினசரி கூலியை உள்ளிடவும்",
    te: "దయచేసి మీ రోజువారీ రేటును నమోదు చేయండి",
    hi: "कृपया अपनी दैनिक दर दर्ज करें"
  },
  photoWord: {
    en: "Photo",
    kn: "ಫೋಟೋ",
    ta: "புகைப்படம்",
    te: "ఫోటో",
    hi: "फ़ोटो"
  },
  photosWord: {
    en: "Photos",
    kn: "ಫೋಟೋಗಳು",
    ta: "புகைப்படங்கள்",
    te: "ఫోటోలు",
    hi: "फ़ोटो"
  },
  addedWord: {
    en: "added",
    kn: "ಸೇರಿಸಲಾಗಿದೆ",
    ta: "சேர்க்கப்பட்டது",
    te: "జోడించబడింది",
    hi: "जोड़े गए"
  },
  markedBusyShort: {
    en: "marked busy",
    kn: "ರಜೆ ಗುರುತಿಸಲಾಗಿದೆ",
    ta: "பிஸி என குறிக்கப்பட்டது",
    te: "బిజీగా గుర్తించబడింది",
    hi: "व्यस्त चिह्नित"
  },
  skillsWord: {
    en: "skills",
    kn: "ಕೌಶಲ್ಯಗಳು",
    ta: "திறன்கள்",
    te: "నైపుణ్యాలు",
    hi: "कौशल"
  },
  dayShortWord: {
    en: "day",
    kn: "ದಿನ",
    ta: "நாள்",
    te: "రోజు",
    hi: "दिन"
  },
  upcoming14DaysTitle: {
    en: "Next 14 days (Tap to mark busy or free)",
    kn: "ಮುಂದಿನ 14 ದಿನಗಳು (ರಜೆ ಅಥವಾ ಲಭ್ಯ ಗುರುತಿಸಲು ಒತ್ತಿ)",
    ta: "அடுத்த 14 நாட்கள் (பிஸி / இலவசம் மாற்ற தட்டவும்)",
    te: "తదుపరి 14 రోజులు (బిజీ / ఖాళీ మార్చడానికి నొక్కండి)",
    hi: "अगले 14 दिन (व्यस्त या खाली बदलने के लिए टैप करें)"
  },
  busyFreeLegend: {
    en: "Red = Busy • White = Free",
    kn: "ಕೆಂಪು = ರಜೆ • ಬಿಳಿ = ಲಭ್ಯ",
    ta: "சிவப்பு = பிஸி • வெள்ளை = கிடைக்கும்",
    te: "ఎరుపు = బిజీ • తెలుపు = ఖాళీ",
    hi: "लाल = व्यस्त • सफेद = खाली"
  },
  busyWord: {
    en: "Busy",
    kn: "ರಜೆ",
    ta: "பிஸி",
    te: "బిజీ",
    hi: "व्यस्त"
  },
  freeWord: {
    en: "Free",
    kn: "ಲಭ್ಯ",
    ta: "கிடைக்கும்",
    te: "ఖాళీ",
    hi: "खाली"
  },
  namePlaceholder: {
    en: "e.g. Ramesh Kumar",
    kn: "ಉದಾ. ರಮೇಶ್ ಕುಮಾರ್",
    ta: "எ.கா. ரமேஷ் குமார்",
    te: "ఉదా. రమేష్ కుమార్",
    hi: "जैसे रमेश कुमार"
  },
  phonePlaceholder: {
    en: "e.g. 9876543210",
    kn: "ಉದಾ. 9876543210",
    ta: "எ.கா. 9876543210",
    te: "ఉదా. 9876543210",
    hi: "जैसे 9876543210"
  },
  addPhotosBtn: {
    en: "Add photos",
    kn: "ಫೋಟೋಗಳನ್ನು ಸೇರಿಸಿ",
    ta: "புகைப்படங்களைச் சேர்",
    te: "ఫోటోలు జోడించు",
    hi: "फ़ोटो जोड़ें"
  },
  addingPhotosBtn: {
    en: "Adding...",
    kn: "ಸೇರಿಸಲಾಗುತ್ತಿದೆ...",
    ta: "சேர்க்கப்படுகிறது...",
    te: "జోడిస్తోంది...",
    hi: "जोड़ा जा रहा है..."
  },
  ofWord: {
    en: "of",
    kn: "ರಲ್ಲಿ",
    ta: "/",
    te: "/",
    hi: "में से"
  },
  photosLowerWord: {
    en: "photos",
    kn: "ಫೋಟೋಗಳು",
    ta: "புகைப்படங்கள்",
    te: "ఫోటోలు",
    hi: "फ़ोटो"
  },
  maxPhotosReachedHint: {
    en: "Maximum 6 photos added",
    kn: "ಗರಿಷ್ಠ 6 ಫೋಟೋಗಳನ್ನು ಸೇರಿಸಲಾಗಿದೆ",
    ta: "அதிகபட்சம் 6 புகைப்படங்கள் சேர்க்கப்பட்டுள்ளன",
    te: "గరిష్టంగా 6 ఫోటోలు జోడించబడ్డాయి",
    hi: "अधिकतम 6 फ़ोटो जोड़ दिए गए हैं"
  },
  advancedAddLinkToggle: {
    en: "Advanced: add using a link",
    kn: "ಹೆಚ್ಚುವರಿ: ಲಿಂಕ್ ಮೂಲಕ ಸೇರಿಸಿ",
    ta: "மேம்பட்டது: இணைப்பு மூலம் சேர்",
    te: "అడ్వాన్స్‌డ్: లింక్ ద్వారా జోడించండి",
    hi: "अतिरिक्त: लिंक से जोड़ें"
  },
  removePhotoLabel: {
    en: "Remove photo",
    kn: "ಫೋಟೋ ತೆಗೆದುಹಾಕಿ",
    ta: "புகைப்படத்தை நீக்கு",
    te: "ఫోటో తీసివేయి",
    hi: "फ़ोटो हटाएं"
  },
  photoInvalidTypeError: {
    en: "Please choose image files only (JPG, PNG, etc.).",
    kn: "ದಯವಿಟ್ಟು ಚಿತ್ರ ಫೈಲ್‌ಗಳನ್ನು ಮಾತ್ರ ಆರಿಸಿ (JPG, PNG, ಇತ್ಯಾದಿ).",
    ta: "படக் கோப்புகளை மட்டுமே தேர்ந்தெடுக்கவும் (JPG, PNG, முதலியன).",
    te: "దయచేసి చిత్ర ఫైల్‌లను మాత్రమే ఎంచుకోండి (JPG, PNG మొదలైనవి).",
    hi: "कृपया केवल फ़ोटो फ़ाइलें चुनें (JPG, PNG आदि)।"
  },
  photoTooLargeError: {
    en: "File is too large. Please pick a photo under 15 MB.",
    kn: "ಫೈಲ್ ತುಂಬಾ ದೊಡ್ಡದಾಗಿದೆ. ದಯವಿಟ್ಟು 15 MB ಒಳಗಿನ ಫೋಟೋ ಆರಿಸಿ.",
    ta: "கோப்பு மிகவும் பெரியது. 15 MB-க்குள் உள்ள புகைப்படத்தைத் தேர்ந்தெடுக்கவும்.",
    te: "ఫైల్ చాలా పెద్దది. దయచేసి 15 MB లోపు ఫోటోను ఎంచుకోండి.",
    hi: "फ़ाइल बहुत बड़ी है। कृपया 15 MB से कम की फ़ोटो चुनें।"
  },
  photoLimitReachedError: {
    en: "You can add up to 6 photos.",
    kn: "ನೀವು ಗರಿಷ್ಠ 6 ಫೋಟೋಗಳನ್ನು ಮಾತ್ರ ಸೇರಿಸಬಹುದು.",
    ta: "நீங்கள் அதிகபட்சம் 6 புகைப்படங்களை மட்டுமே சேர்க்க முடியும்.",
    te: "మీరు గరిష్టంగా 6 ఫోటోలను మాత్రమే జోడించగలరు.",
    hi: "आप अधिकतम 6 फ़ोटो ही जोड़ सकते हैं।"
  },
  photoUploadFailedError: {
    en: "Could not read one of the selected photos. Please try another.",
    kn: "ಆರಿಸಿದ ಒಂದು ಫೋಟೋವನ್ನು ಓದಲಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಬೇರೆಯದನ್ನು ಪ್ರಯತ್ನಿಸಿ.",
    ta: "தேர்ந்தெடுத்த புகைப்படங்களில் ஒன்றைப் படிக்க முடியவில்லை. வேறொன்றை முயற்சிக்கவும்.",
    te: "ఎంచుకున్న ఫోటోలలో ఒకటి చదవలేకపోయాము. దయచేసి మరొకటి ప్రయత్నించండి.",
    hi: "चुनी गई फ़ोटो में से एक पढ़ी नहीं जा सकी। कृपया दूसरी चुनें।"
  },
  bioSuggestionsLabel: {
    en: "Tap to add:",
    kn: "ಸೇರಿಸಲು ಒತ್ತಿ:",
    ta: "சேர்க்க தட்டவும்:",
    te: "జోడించడానికి నొక్కండి:",
    hi: "जोड़ने के लिए टैप करें:"
  },
  voiceTypeStart: {
    en: "Speak to type",
    kn: "ಮಾತನಾಡಿ ಬರೆಯಿರಿ",
    ta: "பேசி தட்டச்சு செய்",
    te: "మాట్లాడి టైప్ చేయండి",
    hi: "बोलकर लिखें"
  },
  voiceTypeStop: {
    en: "Stop voice typing",
    kn: "ಧ್ವನಿ ಟೈಪಿಂಗ್ ನಿಲ್ಲಿಸಿ",
    ta: "குரல் தட்டச்சை நிறுத்து",
    te: "వాయిస్ టైపింగ్ ఆపండి",
    hi: "बोलना बंद करें"
  },
  voiceListening: {
    en: "Listening... speak now",
    kn: "ಕೇಳುತ್ತಿದೆ... ಈಗ ಮಾತನಾಡಿ",
    ta: "கேட்கிறது... இப்போது பேசுங்கள்",
    te: "వింటోంది... ఇప్పుడు మాట్లాడండి",
    hi: "सुन रहा है... अब बोलें"
  },
  voiceError: {
    en: "Could not use microphone. Please type instead.",
    kn: "ಮೈಕ್ರೋಫೋನ್ ಬಳಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಟೈಪ್ ಮಾಡಿ.",
    ta: "மைக்ரோஃபோனைப் பயன்படுத்த முடியவில்லை. தயவுசெய்து தட்டச்சு செய்யவும்.",
    te: "మైక్రోఫోన్ ఉపయోగించలేకపోయాము. దయచేసి టైప్ చేయండి.",
    hi: "माइक काम नहीं कर रहा। कृपया टाइप करें।"
  },
  skillLevelBeginner: {
    en: "Beginner",
    kn: "ಆರಂಭಿಕ",
    ta: "தொடக்கம்",
    te: "ప్రారంభకుడు",
    hi: "शुरुआती"
  },
  skillLevelExperienced: {
    en: "Experienced",
    kn: "ಅನುಭವಿ",
    ta: "அனுபவம்",
    te: "అనుభవజ్ఞుడు",
    hi: "अनुभवी"
  },
  skillLevelExpert: {
    en: "Expert",
    kn: "ಪರಿಣತ",
    ta: "நிபுணர்",
    te: "నిపుణుడు",
    hi: "माहिर"
  },
  markTomorrowBusyBtn: {
    en: "Mark tomorrow busy",
    kn: "ನಾಳೆ ರಜೆ ಗುರುತಿಸಿ",
    ta: "நாளை பிஸி எனக் குறி",
    te: "రేపు బిజీగా గుర్తించు",
    hi: "कल व्यस्त चिह्नित करें"
  },
  markWeekendBusyBtn: {
    en: "Mark weekend busy",
    kn: "ವಾರಾಂತ್ಯ ರಜೆ ಗುರುತಿಸಿ",
    ta: "வார இறுதி பிஸி எனக் குறி",
    te: "వారాంతం బిజీగా గుర్తించు",
    hi: "सप्ताहांत व्यस्त चिह्नित करें"
  },
  clearAllBusyDaysBtn: {
    en: "Clear all busy days",
    kn: "ಎಲ್ಲಾ ರಜೆಯ ದಿನಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ",
    ta: "எல்லா பிஸி நாட்களையும் அழி",
    te: "అన్ని బిజీ రోజులను క్లియర్ చేయి",
    hi: "सभी व्यस्त दिन हटाएं"
  },
  customersWontCallBusyHint: {
    en: "Customers will not call you on busy days.",
    kn: "ರಜೆಯ ದಿನಗಳಲ್ಲಿ ಗ್ರಾಹಕರು ನಿಮಗೆ ಕರೆ ಮಾಡುವುದಿಲ್ಲ.",
    ta: "பிஸி நாட்களில் வாடிக்கையாளர்கள் உங்களை அழைக்க மாட்டார்கள்.",
    te: "బిజీ రోజుల్లో కస్టమర్లు మీకు కాల్ చేయరు.",
    hi: "व्यस्त दिनों में ग्राहक आपको कॉल नहीं करेंगे।"
  },
  chooseDaysManually: {
    en: "Choose days manually",
    kn: "ದಿನಗಳನ್ನು ನೀವೇ ಆರಿಸಿ",
    ta: "நாட்களைத் தனியாகத் தேர்ந்தெடுக்கவும்",
    te: "రోజులను మీరే ఎంచుకోండి",
    hi: "दिन खुद चुनें"
  },
  youAreFreeAllDays: {
    en: "You are free all days",
    kn: "ನೀವು ಎಲ್ಲಾ ದಿನಗಳಲ್ಲೂ ಲಭ್ಯವಿದ್ದೀರಿ",
    ta: "நீங்கள் எல்லா நாட்களிலும் கிடைப்பீர்கள்",
    te: "మీరు అన్ని రోజుల్లో ఖాళీగా ఉన్నారు",
    hi: "आप सभी दिनों में खाली हैं"
  },
  busyPrefixLabel: {
    en: "Busy:",
    kn: "ರಜೆ:",
    ta: "பிஸி:",
    te: "బిజీ:",
    hi: "व्यस्त:"
  },
  freeGreenBusyRedLegend: {
    en: "Green = Free • Red = Busy",
    kn: "ಹಸಿರು = ಲಭ್ಯ • ಕೆಂಪು = ರಜೆ",
    ta: "பச்சை = கிடைக்கும் • சிவப்பு = பிஸி",
    te: "ఆకుపచ్చ = ఖాళీ • ఎరుపు = బిజీ",
    hi: "हरा = खाली • लाल = व्यस्त"
  },

  // Help & Support Bottom Sheet / Modal
  helpSupport: {
    en: "Help & Support",
    kn: "ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ",
    ta: "உதவி & ஆதரவு",
    te: "సహాయం & మద్దతు",
    hi: "सहायता और समर्थन"
  },
  needHelpTitle: {
    en: "Need help?",
    kn: "ಸಹಾಯ ಬೇಕೇ?",
    ta: "உதவி தேவையா?",
    te: "సహాయం కావాలా?",
    hi: "मदद चाहिए?"
  },
  closeBtn: {
    en: "Close",
    kn: "ಮುಚ್ಚಿ",
    ta: "மூடு",
    te: "మూసివేయండి",
    hi: "बंद करें"
  },
  commonQuestionsTitle: {
    en: "Common questions",
    kn: "ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೆಗಳು",
    ta: "பொதுவான கேள்விகள்",
    te: "సాధారణ ప్రశ్నలు",
    hi: "आम सवाल"
  },
  faq1Q: {
    en: "How do I get more calls?",
    kn: "ನನಗೆ ಹೆಚ್ಚು ಕರೆಗಳು ಬರುವುದು ಹೇಗೆ?",
    ta: "எனக்கு அதிக அழைப்புகள் எப்படி வரும்?",
    te: "నాకు ఎక్కువ కాల్స్ ఎలా వస్తాయి?",
    hi: "मुझे ज़्यादा कॉल कैसे मिलेंगी?"
  },
  faq1A: {
    en: "Add a clear photo, set your daily rate and keep \"Available today\" on.",
    kn: "ಸ್ಪಷ್ಟವಾದ ಫೋಟೋ ಸೇರಿಸಿ, ನಿಮ್ಮ ದಿನದ ದರವನ್ನು ಹಾಕಿ ಮತ್ತು \"ಇಂದು ಕೆಲಸಕ್ಕೆ ಲಭ್ಯವಿದ್ದೇನೆ\" ಆನ್ ಮಾಡಿ.",
    ta: "தெளிவான புகைப்படத்தைச் சேர்த்து, உங்கள் தினசரி கூலியைக் குறிப்பிட்டு, \"இன்று வேலைக்குத் தயார்\" என்பதை ஆன் செய்து வைக்கவும்.",
    te: "స్పష్టమైన ఫోటోను చేర్చండి, మీ రోజువారీ రేటును సెట్ చేయండి మరియు \"ఈరోజు పనికి సిద్ధం\" ఆన్‌లో ఉంచండి.",
    hi: "अपनी साफ़ फ़ोटो जोड़ें, दैनिक दर डालें और \"आज काम के लिए उपलब्ध\" चालू रखें।"
  },
  faq2Q: {
    en: "How do customers contact me?",
    kn: "ಗ್ರಾಹಕರು ನನ್ನನ್ನು ಹೇಗೆ ಸಂಪರ್ಕಿಸುತ್ತಾರೆ?",
    ta: "வாடிக்கையாளர்கள் என்னை எப்படி தொடர்பு கொள்வார்கள்?",
    te: "కస్టమర్లు నన్ను ఎలా సంప్రదిస్తారు?",
    hi: "ग्राहक मुझसे संपर्क कैसे करेंगे?"
  },
  faq2A: {
    en: "They call or WhatsApp you directly. There is no commission.",
    kn: "ಅವರು ನಿಮಗೆ ನೇರವಾಗಿ ಕರೆ ಅಥವಾ ವಾಟ್ಸಾಪ್ ಮಾಡುತ್ತಾರೆ. ಯಾವುದೇ ಕಮಿಷನ್ ಇಲ್ಲ.",
    ta: "அவர்கள் உங்களுக்கு நேரடியாக அழைப்பார்கள் அல்லது வாட்ஸ்அப் செய்வார்கள். கமிஷன் எதுவும் இல்லை.",
    te: "వారు మీకు నేరుగా కాల్ లేదా వాట్సాప్ చేస్తారు. ఎలాంటి కమీషన్ లేదు.",
    hi: "वे आपको सीधे कॉल या व्हाट्सएप करेंगे। इसमें कोई कमीशन नहीं है।"
  },
  faq3Q: {
    en: "How do I change my daily rate?",
    kn: "ನನ್ನ ದಿನದ ದರವನ್ನು ಬದಲಾಯಿಸುವುದು ಹೇಗೆ?",
    ta: "என் தினசரி கூலியை எப்படி மாற்றுவது?",
    te: "నా రోజువారీ రేటును ఎలా మార్చాలి?",
    hi: "मैं अपनी दैनिक दर कैसे बदलूँ?"
  },
  faq3A: {
    en: "Go to Worker Profile > Edit Profile and update your rate, then tap Save Profile.",
    kn: "ಕೆಲಸಗಾರರ ಪ್ರೊಫೈಲ್ > ಪ್ರೊಫೈಲ್ ಬದಲಿಸಿ ಗೆ ಹೋಗಿ ನಿಮ್ಮ ದರವನ್ನು ಬದಲಿಸಿ, ನಂತರ ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ ಒತ್ತಿ.",
    ta: "தொழிலாளர் சுயவிவரம் > சுயவிவரம் பகுதிக்குச் சென்று உங்கள் கூலியை மாற்றி, பின்னர் சேமிக்கவும்.",
    te: "వర్కర్ ప్రొఫైల్ > ప్రొఫైల్ మార్చు లో మీ రేటును అప్‌డేట్ చేసి, ప్రొఫైల్ సేవ్ నొక్కండి.",
    hi: "वर्कर प्रोफ़ाइल > प्रोफ़ाइल बदलें पर जाकर अपनी दर अपडेट करें और प्रोफ़ाइल सेव करें दबाएँ।"
  },
  faq4Q: {
    en: "How do I mark busy days?",
    kn: "ರಜೆ ದಿನಗಳನ್ನು ಗುರುತು ಮಾಡುವುದು ಹೇಗೆ?",
    ta: "பிஸி நாட்களை எப்படி குறிப்பது?",
    te: "బిజీ రోజులను ఎలా గుర్తించాలి?",
    hi: "मैं व्यस्त दिन कैसे चिह्नित करूँ?"
  },
  faq4A: {
    en: "In Worker Profile, use \"Mark tomorrow busy\" or \"Mark weekend busy\".",
    kn: "ಕೆಲಸಗಾರರ ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ \"ನಾಳೆ ರಜೆ\" ಅಥವಾ \"ವೀಕೆಂಡ್ ರಜೆ\" ಬಟನ್ ಒತ್ತಿ.",
    ta: "தொழிலாளர் சுயவிவரத்தில் \"நாளை பிஸி\" அல்லது \"வார இறுதி பிஸி\" என்பதைப் பயன்படுத்தவும்.",
    te: "వర్కర్ ప్రొఫైల్‌లో \"రేపు బిజీ\" లేదా \"వీకెండ్ బిజీ\" బటన్ ఉపయోగించండి.",
    hi: "वर्कर प्रोफ़ाइल में \"कल व्यस्त\" या \"वीकेंड व्यस्त\" बटन दबाएँ।"
  },
  faq5Q: {
    en: "Is it free?",
    kn: "ಇದು ಉಚಿತವೇ?",
    ta: "இது இலவசமா?",
    te: "ఇది ఉచితమేనా?",
    hi: "क्या यह मुफ़्त है?"
  },
  faq5A: {
    en: "Yes. Zero commission, direct hire.",
    kn: "ಹೌದು. ಶೂನ್ಯ ಕಮಿಷನ್, ನೇರ ಕೆಲಸ.",
    ta: "ஆம். கமிஷன் இல்லை, நேரடி வேலை.",
    te: "అవును. కమీషన్ లేదు, నేరుగా పని.",
    hi: "हाँ। शून्य कमीशन, सीधी भर्ती।"
  },
  contactUsTitle: {
    en: "Contact us",
    kn: "ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ",
    ta: "எங்களை தொடர்பு கொள்ள",
    te: "మమ్మల్ని సంప్రదించండి",
    hi: "हमसे संपर्क करें"
  },
  chatOnWhatsappBtn: {
    en: "Chat on WhatsApp",
    kn: "ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಚಾಟ್ ಮಾಡಿ",
    ta: "வாட்ஸ்அப்பில் சாட் செய்யவும்",
    te: "వాట్సాప్‌లో చాట్ చేయండి",
    hi: "व्हाट्सएप पर चैट करें"
  },
  callSupportBtn: {
    en: "Call support",
    kn: "ಸಹಾಯಕ್ಕೆ ಕರೆ ಮಾಡಿ",
    ta: "உதவிக்கு அழைக்கவும்",
    te: "సపోర్ట్‌కు కాల్ చేయండి",
    hi: "सपोर्ट को कॉल करें"
  },
  copySupportEmailBtn: {
    en: "Copy support email",
    kn: "ಬೆಂಬಲ ಇಮೇಲ್ ಕಾಪಿ ಮಾಡಿ",
    ta: "ஆதரவு மின்னஞ்சலை நகலெடு",
    te: "సపోర్ట్ ఇమెయిల్ కాపీ చేయండి",
    hi: "सपोर्ट ईमेल कॉपी करें"
  },
  copiedCheck: {
    en: "Copied ✓",
    kn: "ಕಾಪಿ ಆಯಿತು ✓",
    ta: "நகலெடுக்கப்பட்டது ✓",
    te: "కాపీ అయింది ✓",
    hi: "कॉपी हो गया ✓"
  },

  // Simplified Find Workers & Card Contact UI
  heroSlimTagline: {
    en: "Hire local workers directly. Zero commission.",
    kn: "ಸ್ಥಳೀಯ ಕೆಲಸಗಾರರನ್ನು ನೇರವಾಗಿ ನೇಮಿಸಿ. ಶೂನ್ಯ ಕಮಿಷನ್.",
    ta: "உள்ளூர் தொழிலாளர்களை நேரடியாக பணியமர்த்துங்கள். கமிஷன் இல்லை.",
    te: "స్థానిక కార్మికులను నేరుగా నియమించుకోండి. జీరో కమీషన్.",
    hi: "स्थानीय कामगारों को सीधे काम पर रखें। शून्य कमीशन।"
  },
  availableTodayFilter: {
    en: "Available today",
    kn: "ಇಂದು ಲಭ್ಯ",
    ta: "இன்று கிடைக்கும்",
    te: "ఈరోజు అందుబాటులో",
    hi: "आज उपलब्ध"
  },
  filtersBtn: {
    en: "Filters",
    kn: "ಫಿಲ್ಟರ್‌ಗಳು",
    ta: "வடிகட்டிகள்",
    te: "ఫిల్టర్‌లు",
    hi: "फ़िल्टर"
  },
  applyFiltersBtn: {
    en: "Apply",
    kn: "ಅನ್ವಯಿಸಿ",
    ta: "பயன்படுத்து",
    te: "వర్తించు",
    hi: "लागू करें"
  },
  resetFiltersShort: {
    en: "Reset",
    kn: "ಮರುಹೊಂದಿಸಿ",
    ta: "மீட்டமை",
    te: "రీసెట్",
    hi: "रीसेट"
  },
  allIndiaDistance: {
    en: "All India",
    kn: "ಅಖಿಲ ಭಾರತ",
    ta: "அகில இந்தியா",
    te: "ఆల్ ఇండియా",
    hi: "पूरा भारत"
  },
  workerNearYouSingular: {
    en: "worker near you",
    kn: "ಕೆಲಸಗಾರರು ನಿಮ್ಮ ಹತ್ತಿರ",
    ta: "தொழிலாளி உங்கள் அருகில்",
    te: "కార్మికుడు మీ దగ్గర",
    hi: "कारीगर आपके पास"
  },
  workersNearYouPlural: {
    en: "workers near you",
    kn: "ಕೆಲಸಗಾರರು ನಿಮ್ಮ ಹತ್ತಿರ",
    ta: "தொழிலாளர்கள் உங்கள் அருகில்",
    te: "కార్మికులు మీ దగ్గర",
    hi: "कारीगर आपके पास"
  },
  whatsappBtn: {
    en: "WhatsApp",
    kn: "WhatsApp",
    ta: "WhatsApp",
    te: "WhatsApp",
    hi: "WhatsApp"
  },
  callBtn: {
    en: "Call",
    kn: "ಕರೆ",
    ta: "அழை",
    te: "కాల్",
    hi: "कॉल"
  },
  newWorkerBadge: {
    en: "New",
    kn: "ಹೊಸ",
    ta: "புதியவர்",
    te: "కొత్త",
    hi: "नया"
  },
  moreDetailsBtn: {
    en: "More details",
    kn: "ಹೆಚ್ಚಿನ ವಿವರಗಳು",
    ta: "மேலும் விவரங்கள்",
    te: "మరిన్ని వివరాలు",
    hi: "अधिक जानकारी"
  },
  lessDetailsBtn: {
    en: "Less details",
    kn: "ಕಡಿಮೆ ವಿವರಗಳು",
    ta: "குறைவான விவரங்கள்",
    te: "తక్కువ వివరాలు",
    hi: "कम जानकारी"
  },
  askAboutWorkToday: {
    en: "Ask about work today",
    kn: "ಇಂದಿನ ಕೆಲಸದ ಬಗ್ಗೆ ಕೇಳಿ",
    ta: "இன்றைய வேலை பற்றி கேட்கவும்",
    te: "ఈరోజు పని గురించి అడగండి",
    hi: "आज के काम के बारे में पूछें"
  },
  askAboutRate: {
    en: "Ask about rate",
    kn: "ದರದ ಬಗ್ಗೆ ಕೇಳಿ",
    ta: "கூலி பற்றி கேட்கவும்",
    te: "రేటు గురించి అడగండి",
    hi: "दर के बारे में पूछें"
  },
  askAboutAvailability: {
    en: "Ask about availability",
    kn: "ಲಭ್ಯತೆಯ ಬಗ್ಗೆ ಕೇಳಿ",
    ta: "கிடைக்கும் நேரம் பற்றி கேட்கவும்",
    te: "లభ్యత గురించి అడగండి",
    hi: "उपलब्धता के बारे में पूछें"
  },
  chooseMessageOrWrite: {
    en: "Choose a message to send on WhatsApp",
    kn: "ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಕಳುಹಿಸಲು ಸಂದೇಶವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    ta: "வாட்ஸ்அப்பில் அனுப்ப ஒரு செய்தியைத் தேர்ந்தெடுக்கவும்",
    te: "వాట్సాప్‌లో పంపడానికి సందేశాన్ని ఎంచుకోండి",
    hi: "व्हाट्सएप पर भेजने के लिए संदेश चुनें"
  },

  // Mobile Discovery: Current Location, Sort, Kind Empty Results, Customer/Worker Role & Menu
  useMyCurrentLocation: {
    en: "📍 Use my current location",
    kn: "📍 ನನ್ನ ಪ್ರಸ್ತುತ ಸ್ಥಳವನ್ನು ಬಳಸಿ",
    ta: "📍 எனது தற்போதைய இடத்தைப் பயன்படுத்து",
    te: "📍 నా ప్రస్తుత లొకేషన్ ఉపయోగించండి",
    hi: "📍 मेरी वर्तमान लोकेशन का उपयोग करें"
  },
  detectingLocation: {
    en: "Getting your location...",
    kn: "ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಪಡೆಯಲಾಗುತ್ತಿದೆ...",
    ta: "உங்கள் இடத்தைக் கண்டறிகிறது...",
    te: "మీ లొకేషన్‌ను గుర్తిస్తోంది...",
    hi: "आपकी लोकेशन पता की जा रही है..."
  },
  couldNotGetLocation: {
    en: "Could not get your location. Please choose your area manually.",
    kn: "ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ರದೇಶವನ್ನು ನೀವೇ ಆಯ್ಕೆಮಾಡಿ.",
    ta: "உங்கள் இடத்தைப் பெற முடியவில்லை. தயவுசெய்து உங்கள் பகுதியை நீங்களே தேர்ந்தெடுக்கவும்.",
    te: "మీ లొకేషన్ పొందడం సాధ్యం కాలేదు. దయచేసి మీ ప్రాంతాన్ని మాన్యువల్‌గా ఎంచుకోండి.",
    hi: "आपकी लोकेशन नहीं मिल सकी। कृपया अपना क्षेत्र खुद चुनें।"
  },
  chooseAreaManually: {
    en: "Choose area manually",
    kn: "ಪ್ರದೇಶವನ್ನು ನೀವೇ ಆಯ್ಕೆಮಾಡಿ",
    ta: "பகுதியை நீங்களே தேர்ந்தெடுக்கவும்",
    te: "ప్రాంతాన్ని మాన్యువల్‌గా ఎంచుకోండి",
    hi: "अपना क्षेत्र खुद चुनें"
  },
  sortByLabel: {
    en: "Sort:",
    kn: "ವಿಂಗಡಿಸಿ:",
    ta: "வரிசை:",
    te: "క్రమం:",
    hi: "क्रम:"
  },
  sortNearest: {
    en: "Nearest",
    kn: "ಹತ್ತಿರದ",
    ta: "அருகிலுள்ள",
    te: "దగ్గరి",
    hi: "सबसे पास"
  },
  sortLowestRate: {
    en: "Lowest rate",
    kn: "ಕಡಿಮೆ ದರ",
    ta: "குறைந்த கூலி",
    te: "తక్కువ ధర",
    hi: "कम दिहाड़ी"
  },
  sortBestRated: {
    en: "Best rated",
    kn: "ಉತ್ತಮ ರೇಟಿಂಗ್",
    ta: "சிறந்த மதிப்பீடு",
    te: "ఉత్తమ రేటింగ్",
    hi: "सबसे अच्छी रेटिंग"
  },
  noWorkersWithinKm: {
    en: "No workers found within {km} km.",
    kn: "{km} ಕಿ.ಮೀ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಯಾವುದೇ ಕೆಲಸಗಾರರು ಕಂಡುಬಂದಿಲ್ಲ.",
    ta: "{km} கி.மீ சுற்றளவில் தொழிலாளர்கள் எவரும் இல்லை.",
    te: "{km} కి.మీ పరిధిలో కార్మికులు ఎవరూ కనుగొనబడలేదు.",
    hi: "{km} कि.मी के भीतर कोई कारीगर नहीं मिला।"
  },
  noWorkersAllIndia: {
    en: "No workers found across All India.",
    kn: "ಅಖಿಲ ಭಾರತದಲ್ಲಿ ಯಾವುದೇ ಕೆಲಸಗಾರರು ಕಂಡುಬಂದಿಲ್ಲ.",
    ta: "அகில இந்தியாவில் தொழிலாளர்கள் எவரும் இல்லை.",
    te: "ఆల్ ఇండియాలో కార్మికులు ఎవరూ కనుగొనబడలేదు.",
    hi: "पूरे भारत में कोई कारीगर नहीं मिला।"
  },
  showWorkersWithinKm: {
    en: "Show workers within {km} km",
    kn: "{km} ಕಿ.ಮೀ ಒಳಗಿನ ಕೆಲಸಗಾರರನ್ನು ತೋರಿಸಿ",
    ta: "{km} கி.மீ வரம்பிற்குள் உள்ள தொழிலாளர்களைக் காட்டு",
    te: "{km} కి.మీ పరిధిలోని కార్మికులను చూపించు",
    hi: "{km} कि.मी के भीतर कारीगर दिखाएं"
  },
  showWorkersAllIndia: {
    en: "Show workers within All India",
    kn: "ಅಖಿಲ ಭಾರತದ ಕೆಲಸಗಾರರನ್ನು ತೋರಿಸಿ",
    ta: "அகில இந்திய தொழிலாளர்களைக் காட்டு",
    te: "ఆల్ ఇండియా కార్మికులను చూపించు",
    hi: "पूरे भारत के कारीगर दिखाएं"
  },
  clearFiltersBtn: {
    en: "Clear filters",
    kn: "ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ",
    ta: "வடிகட்டிகளை அழி",
    te: "ఫిల్టర్‌లను క్లియర్ చేయండి",
    hi: "फ़िल्टर साफ़ करें"
  },
  showAllIncludingBusy: {
    en: "Show all workers, including busy ones",
    kn: "ಬ್ಯುಸಿ ಇರುವವರೂ ಸೇರಿದಂತೆ ಎಲ್ಲಾ ಕೆಲಸಗಾರರನ್ನು ತೋರಿಸಿ",
    ta: "வேலையில் இருப்பவர்கள் உட்பட அனைத்து தொழிலாளர்களையும் காட்டு",
    te: "బిజీగా ఉన్నవారితో సహా అందరు కార్మికులను చూపించు",
    hi: "व्यस्त कारीगरों सहित सभी कारीगरों को दिखाएं"
  },
  welcomeChoiceTitle: {
    en: "How would you like to use Namma Kelasa?",
    kn: "ನಮ್ಮ ಕೆಲಸ ಆಪ್ ಅನ್ನು ನೀವು ಹೇಗೆ ಬಳಸಲು ಬಯಸುತ್ತೀರಿ?",
    ta: "நம்ம வேலை செயலியை எப்படிப் பயன்படுத்த விரும்புகிறீர்கள்?",
    te: "నమ్మ కెలసా యాప్‌ను మీరు ఎలా ఉపయోగించాలనుకుంటున్నారు?",
    hi: "आप नम्मा केलसा का उपयोग कैसे करना चाहते हैं?"
  },
  iWantToHireWorker: {
    en: "I want to hire a worker",
    kn: "ನಾನು ಕೆಲಸಗಾರರನ್ನು ನೇಮಿಸಿಕೊಳ್ಳಲು ಬಯಸುತ್ತೇನೆ",
    ta: "நான் ஒரு தொழிலாளியை வேலைக்கு அமர்த்த விரும்புகிறேன்",
    te: "నేను కార్మికుడిని పనిలో పెట్టుకోవాలనుకుంటున్నాను",
    hi: "मुझे काम के लिए कारीगर चाहिए"
  },
  iWantToHireWorkerDesc: {
    en: "Browse nearby workers, compare daily rates, and call or WhatsApp directly.",
    kn: "ಹತ್ತಿರದ ಕೆಲಸಗಾರರನ್ನು ನೋಡಿ, ದಿನಗೂಲಿ ದರ ಹೋಲಿಸಿ ಮತ್ತು ನೇರವಾಗಿ ಕರೆ ಅಥವಾ ವಾಟ್ಸಾಪ್ ಮಾಡಿ.",
    ta: "அருகிலுள்ள தொழிலாளர்களைப் பார்த்து, தினக்கூலியை ஒப்பிட்டு நேரடியாக அழைக்கவும்.",
    te: "దగ్గరలోని కార్మికులను చూడండి, రోజువారీ కూలీని పోల్చండి మరియు నేరుగా కాల్ చేయండి.",
    hi: "आस-पास के कारीगरों को देखें, दिहाड़ी की तुलना करें और सीधे कॉल या व्हाट्सएप करें।"
  },
  iAmWorkerLookingForWork: {
    en: "I am a worker looking for work",
    kn: "ನಾನು ಕೆಲಸ ಹುಡುಕುತ್ತಿರುವ ಕೆಲಸಗಾರ",
    ta: "நான் வேலை தேடும் ஒரு தொழிலாளி",
    te: "నేను పని వెతుక్కుంటున్న కార్మికుడిని",
    hi: "मैं काम की तलाश में एक कारीगर हूँ"
  },
  iAmWorkerLookingForWorkDesc: {
    en: "Create your profile, set your daily rate, and get direct calls from customers.",
    kn: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ರಚಿಸಿ, ದಿನಗೂಲಿ ದರ ತಿಳಿಸಿ ಮತ್ತು ಗ್ರಾಹಕರಿಂದ ನೇರ ಕರೆಗಳನ್ನು ಪಡೆಯಿರಿ.",
    ta: "உங்கள் சுயவிவரத்தை உருவாக்கி, தினக்கூலியை அமைத்து வாடிக்கையாளர்களிடமிருந்து நேரடி அழைப்புகளைப் பெறுங்கள்.",
    te: "మీ ప్రొఫైల్ సృష్టించండి, రోజువారీ కూలీని సెట్ చేయండి మరియు కస్టమర్ల నుండి నేరుగా కాల్స్ పొందండి.",
    hi: "अपनी प्रोफ़ाइल बनाएं, अपनी दिहाड़ी तय करें और ग्राहकों से सीधे कॉल पाएं।"
  },
  changeAnytimeFromMenu: {
    en: "You can change this anytime from the top menu.",
    kn: "ಇದನ್ನು ನೀವು ಯಾವಾಗ ಬೇಕಾದರೂ ಮೇಲಿನ ಮೆನುವಿನಿಂದ ಬದಲಾಯಿಸಬಹುದು.",
    ta: "இதை எப்போது வேண்டுமானாலும் மேல் மெனுவிலிருந்து மாற்றலாம்.",
    te: "దీనిని మీరు ఎప్పుడైనా టాప్ మెనూ నుండి మార్చుకోవచ్చు.",
    hi: "आप इसे कभी भी ऊपर दिए गए मेनू से बदल सकते हैं।"
  },
  switchRoleMenu: {
    en: "Switch role",
    kn: "ಪಾತ್ರ ಬದಲಿಸಿ",
    ta: "பாத்திரத்தை மாற்று",
    te: "పాత్రను మార్చండి",
    hi: "भूमिका बदलें"
  },
  switchToWorkerSub: {
    en: "Switch to Worker",
    kn: "ಕೆಲಸಗಾರರ ಮೋಡ್‌ಗೆ ಬದಲಿಸಿ",
    ta: "தொழிலாளியாக மாறு",
    te: "కార్మికుడిగా మారండి",
    hi: "कारीगर मोड में बदलें"
  },
  switchToCustomerSub: {
    en: "Switch to Customer",
    kn: "ಗ್ರಾಹಕರ ಮೋಡ್‌ಗೆ ಬದಲಿಸಿ",
    ta: "வாடிக்கையாளராக மாறு",
    te: "కస్టమర్‌గా మారండి",
    hi: "ग्राहक मोड में बदलें"
  },
  customerRoleLabel: {
    en: "Customer",
    kn: "ಗ್ರಾಹಕ",
    ta: "வாடிக்கையாளர்",
    te: "కస్టమర్",
    hi: "ग्राहक"
  },
  workerRoleLabel: {
    en: "Worker",
    kn: "ಕೆಲಸಗಾರ",
    ta: "தொழிலாளி",
    te: "కార్మికుడు",
    hi: "कारीगर"
  },
  guestAccountLabel: {
    en: "Browsing without login",
    kn: "ಲಾಗಿನ್ ಇಲ್ಲದೆ ವೀಕ್ಷಿಸಲಾಗುತ್ತಿದೆ",
    ta: "உள்நுழையாமல் உலாவல்",
    te: "లాగిన్ లేకుండా బ్రౌజింగ్",
    hi: "बिना लॉगिन के देख रहे हैं"
  },
  selectLocationTitle: {
    en: "Select Your Location",
    kn: "ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    ta: "உங்கள் இடத்தைத் தேர்ந்தெடுக்கவும்",
    te: "మీ లొకేషన్‌ను ఎంచుకోండి",
    hi: "अपनी लोकेशन चुनें"
  },
  selectLocationSubtitle: {
    en: "Find daily wage workers near your area",
    kn: "ಹತ್ತಿರದ ದಿನಗೂಲಿ ಕೆಲಸಗಾರರನ್ನು ಹುಡುಕಲು ಕೇಂದ್ರ ಸ್ಥಳವನ್ನು ಬದಲಿಸಿ",
    ta: "உங்கள் பகுதிக்கு அருகிலுள்ள தினக்கூலி தொழிலாளர்களைக் கண்டறியவும்",
    te: "మీ ప్రాంతానికి దగ్గరలో ఉన్న దినసరి వేతన కార్మికులను కనుగొనండి",
    hi: "अपने क्षेत्र के पास दिहाड़ी कारीगर खोजें"
  },
  thisIsYouBadge: {
    en: "This is you",
    kn: "ಇದು ನೀವೇ",
    ta: "இது நீங்கள்",
    te: "ఇది మీరే",
    hi: "यह आप हैं"
  },
  editMyProfileBtn: {
    en: "Edit my profile",
    kn: "ನನ್ನ ಪ್ರೊಫೈಲ್ ತಿದ್ದುಪಡಿ ಮಾಡಿ",
    ta: "எனது சுயவிவரத்தைத் திருத்து",
    te: "నా ప్రొఫైల్ సవరించండి",
    hi: "मेरी प्रोफ़ाइल संपादित करें"
  },
  phoneNumberVerified: {
    en: "Phone number verified",
    kn: "ಫೋನ್ ಸಂಖ್ಯೆ ದೃಢೀಕರಿಸಲಾಗಿದೆ",
    ta: "தொலைபேசி எண் சரிபார்க்கப்பட்டது",
    te: "ఫోన్ నంబర్ ధృవీకరించబడింది",
    hi: "फ़ोन नंबर सत्यापित है"
  },
  phoneAuthErrInvalidNumber: {
    en: "Please enter a valid 10-digit mobile number.",
    kn: "ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.",
    ta: "சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்.",
    te: "దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్‌ను నమోదు చేయండి.",
    hi: "कृपया एक सही 10 अंकों का मोबाइल नंबर दर्ज करें।"
  },
  phoneAuthErrTooManyRequests: {
    en: "Too many attempts. Please wait a few minutes and try again.",
    kn: "ಹಲವು ಬಾರಿ ಪ್ರಯತ್ನಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಕೆಲವು ನಿಮಿಷಗಳ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    ta: "பலமுறை முயற்சித்துவிட்டீர்கள். சில நிமிடங்கள் காத்திருந்து மீண்டும் முயற்சிக்கவும்.",
    te: "చాలా సార్లు ప్రయత్నించారు. దయచేసి కొన్ని నిమిషాలు ఆగి మళ్లీ ప్రయత్నించండి.",
    hi: "बहुत अधिक प्रयास किए गए। कृपया कुछ मिनट प्रतीक्षा करें और फिर से प्रयास करें।"
  },
  phoneAuthErrNetworkFailed: {
    en: "No internet connection. Please check and try again.",
    kn: "ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವಿಲ್ಲ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    ta: "இணைய இணைப்பு இல்லை. சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
    te: "ఇంటర్నెట్ కనెక్షన్ లేదు. దయచేసి తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.",
    hi: "इंटरनेट कनेक्शन नहीं है। कृपया जांचें और फिर से प्रयास करें।"
  },
  phoneAuthErrUnavailable: {
    en: "Phone login is not available right now. Please use Google or Email login.",
    kn: "ಫೋನ್ ಲಾಗಿನ್ ಈಗ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು Google ಅಥವಾ ಇಮೇಲ್ ಲಾಗಿನ್ ಬಳಸಿ.",
    ta: "தொலைபேசி உள்நுழைவு இப்போது கிடைக்கவில்லை. தயவுசெய்து Google அல்லது மின்னஞ்சல் உள்நுழைவைப் பயன்படுத்தவும்.",
    te: "ఫోన్ లాగిన్ ప్రస్తుతం అందుబాటులో లేదు. దయచేసి Google లేదా ఇమెయిల్ లాగిన్ ఉపయోగించండి.",
    hi: "फ़ोन लॉगिन अभी उपलब्ध नहीं है। कृपया Google या ईमेल लॉगिन का उपयोग करें।"
  }
};

const SKILL_BIO_SUGGESTIONS: Record<string, Record<Language, [string, string, string]>> = {
  carpentry: {
    en: [
      "I make doors, windows and furniture with care.",
      "10+ years of work, finishing on time.",
      "I bring my own tools."
    ],
    kn: [
      "ನಾನು ಬಾಗಿಲು, ಕಿಟಕಿ ಮತ್ತು ಪೀಠೋಪಕರಣಗಳನ್ನು ಅಚ್ಚುಕಟ್ಟಾಗಿ ಮಾಡುತ್ತೇನೆ.",
      "10+ ವರ್ಷಗಳ ಅನುಭವ, ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಕೆಲಸ ಮುಗಿಸುತ್ತೇನೆ.",
      "ನನ್ನ ಸ್ವಂತ ಉಪಕರಣಗಳನ್ನು ತರುತ್ತೇನೆ."
    ],
    ta: [
      "கதவு, ஜன்னல் மற்றும் மரச்சாமான்களை நேர்த்தியாகச் செய்வேன்.",
      "10+ ஆண்டுகள் அனுபவம், நேரத்திற்கு முடித்துக் கொடுப்பேன்.",
      "என் சொந்த கருவிகளைக் கொண்டு வருவேன்."
    ],
    te: [
      "నేను తలుపులు, కిటికీలు మరియు ఫర్నిచర్ జాగ్రత్తగా చేస్తాను.",
      "10+ సంవత్సరాల అనుభవం, సమయానికి పని పూర్తి చేస్తాను.",
      "నా స్వంత పనిముట్లు తెచ్చుకుంటాను."
    ],
    hi: [
      "मैं दरवाज़े, खिड़कियाँ और फर्नीचर सफ़ाई से बनाता हूँ।",
      "10+ साल का अनुभव, काम समय पर पूरा करता हूँ।",
      "मैं अपने खुद के औज़ार साथ लाता हूँ।"
    ]
  },
  plumbing: {
    en: [
      "I fix leaks, taps and pipe fittings quickly.",
      "Available for urgent calls.",
      "I bring my own tools."
    ],
    kn: [
      "ಲೀಕ್, ನಲ್ಲಿ ಮತ್ತು ಪೈಪ್ ಫಿಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಬೇಗ ಸರಿಪಡಿಸುತ್ತೇನೆ.",
      "ತುರ್ತು ಕೆಲಸಗಳಿಗೆ ಲಭ್ಯವಿದ್ದೇನೆ.",
      "ನನ್ನ ಸ್ವಂತ ಉಪಕರಣಗಳನ್ನು ತರುತ್ತೇನೆ."
    ],
    ta: [
      "கசிவு, குழாய் மற்றும் பைப் வேலைகளை விரைவாகச் சரிசெய்வேன்.",
      "அவசர வேலைகளுக்கு அழைக்கலாம்.",
      "என் சொந்த கருவிகளைக் கொண்டு வருவேன்."
    ],
    te: [
      "లీకేజీలు, ట్యాప్‌లు మరియు పైప్ ఫిట్టింగ్‌లు త్వరగా సరిచేస్తాను.",
      "అత్యవసర పనులకు అందుబాటులో ఉంటాను.",
      "నా స్వంత పనిముట్లు తెచ్చుకుంటాను."
    ],
    hi: [
      "मैं लीकेज, नल और पाइप फिटिंग का काम जल्दी ठीक करता हूँ।",
      "तुरंत काम के लिए उपलब्ध हूँ।",
      "मैं अपने खुद के औज़ार साथ लाता हूँ।"
    ]
  },
  painting: {
    en: [
      "Clean interior and exterior wall painting.",
      "Putty, primer and smooth finish.",
      "Neat work, no mess left behind."
    ],
    kn: [
      "ಮನೆ ಒಳಗೆ ಮತ್ತು ಹೊರಗೆ ಅಚ್ಚುಕಟ್ಟಾಗಿ ಪೇಂಟಿಂಗ್ ಮಾಡುತ್ತೇನೆ.",
      "ಪುಟ್ಟಿ, ಪ್ರೈಮರ್ ಮತ್ತು ನಯವಾದ ಫಿನಿಶ್.",
      "ಶುಚಿಯಾದ ಕೆಲಸ, ಕೊಳೆ ಮಾಡುವುದಿಲ್ಲ."
    ],
    ta: [
      "வீட்டின் உள் மற்றும் வெளிப்புற சுவர்களுக்கு நேர்த்தியான பெயிண்டிங்.",
      "புட்டி, பிரைமர் மற்றும் மென்மையான ஃபினிஷ்.",
      "சுத்தமான வேலை, அழுக்கு இல்லாமல் முடிப்பேன்."
    ],
    te: [
      "ఇంటి లోపల మరియు బయట గోడలకు శుభ్రమైన పెయింటింగ్.",
      "పుట్టీ, ప్రైమర్ మరియు నునుపైన ఫినిషింగ్.",
      "శుభ్రంగా పని చేస్తాను."
    ],
    hi: [
      "घर के अंदर और बाहर की दीवारों की साफ़ पेंटिंग।",
      "पुट्टी, प्राइमर और बढ़िया फ़िनिश।",
      "साफ़-सुथरा काम, गंदगी नहीं छोड़ता।"
    ]
  },
  electrical: {
    en: [
      "Safe wiring, switches, fans and light fitting.",
      "I find and fix faults quickly.",
      "I bring my own testing tools."
    ],
    kn: [
      "ಸುರಕ್ಷಿತ ವೈರಿಂಗ್, ಸ್ವಿಚ್, ಫ್ಯಾನ್ ಮತ್ತು ಲೈಟ್ ಫಿಟ್ಟಿಂಗ್.",
      "ವಿದ್ಯುತ್ ದೋಷಗಳನ್ನು ಬೇಗ ಪತ್ತೆಹಚ್ಚಿ ಸರಿಪಡಿಸುತ್ತೇನೆ.",
      "ನನ್ನ ಸ್ವಂತ ಟೆಸ್ಟಿಂಗ್ ಉಪಕರಣಗಳನ್ನು ತರುತ್ತೇನೆ."
    ],
    ta: [
      "பாதுகாப்பான வயரிங், சுவிட்ச், ஃபேன் மற்றும் லைட் பொருத்துதல்.",
      "பழுதுகளை விரைவில் கண்டறிந்து சரிசெய்வேன்.",
      "என் சொந்த சோதனை கருவிகளைக் கொண்டு வருவேன்."
    ],
    te: [
      "సురక్షితమైన వైరింగ్, స్విచ్‌లు, ఫ్యాన్లు మరియు లైట్ ఫిట్టింగ్.",
      "సమస్యలను త్వరగా గుర్తించి సరిచేస్తాను.",
      "నా స్వంత టెస్టింగ్ టూల్స్ తెచ్చుకుంటాను."
    ],
    hi: [
      "सुरक्षित वायरिंग, स्विच, पंखे और लाइट फिटिंग।",
      "फॉल्ट जल्दी ढूंढकर ठीक करता हूँ।",
      "मैं अपने खुद के टेस्टिंग औज़ार लाता हूँ।"
    ]
  },
  gardening: {
    en: [
      "Lawn cutting, pruning and garden care.",
      "Planting flowers, trees and soil work.",
      "I keep the yard clean after work."
    ],
    kn: [
      "ಹುಲ್ಲು ಕತ್ತರಿಸುವುದು, ಗಿಡ ಕಟಾವು ಮತ್ತು ತೋಟದ ಆರೈಕೆ.",
      "ಹೂವು, ಮರ ನೆಡುವುದು ಮತ್ತು ಮಣ್ಣಿನ ಕೆಲಸ.",
      "ಕೆಲಸದ ನಂತರ ಅಂಗಳವನ್ನು ಶುಚಿಯಾಗಿಡುತ್ತೇನೆ."
    ],
    ta: [
      "புல் வெட்டுதல், செடி கவாத்து மற்றும் தோட்டப் பராமரிப்பு.",
      "பூச்செடி, மரம் நடுதல் மற்றும் மண் வேலை.",
      "வேலை முடிந்ததும் முற்றத்தை சுத்தமாக வைப்பேன்."
    ],
    te: [
      "లాన్ కటింగ్, మొక్కల కత్తిరింపు మరియు గార్డెన్ సంరక్షణ.",
      "పూలు, చెట్లు నాటడం మరియు మట్టి పని.",
      "పని తర్వాత ఆవరణను శుభ్రంగా ఉంచుతాను."
    ],
    hi: [
      "घास काटना, छंटाई और बगीचे की देखभाल।",
      "फूल, पौधे लगाना और मिट्टी का काम।",
      "काम के बाद जगह साफ़ रखता हूँ।"
    ]
  },
  tiling: {
    en: [
      "Level floor and bathroom wall tile fitting.",
      "Granite, marble and grouting work.",
      "I bring my own tile cutter."
    ],
    kn: [
      "ಸಮನಾದ ನೆಲ ಮತ್ತು ಬಾತ್‌ರೂಮ್ ಗೋಡೆ ಟೈಲ್ಸ್ ಫಿಟ್ಟಿಂಗ್.",
      "ಗ್ರಾನೈಟ್, ಮಾರ್ಬಲ್ ಮತ್ತು ಗ್ರೌಟಿಂಗ್ ಕೆಲಸ.",
      "ನನ್ನ ಸ್ವಂತ ಟೈಲ್ ಕಟ್ಟರ್ ತರುತ್ತೇನೆ."
    ],
    ta: [
      "தரை மற்றும் குளியலறை சுவர் டைல்ஸ் நேர்த்தியாகப் பதிப்பேன்.",
      "கிரானைட், மார்பிள் மற்றும் கிரவுட்டிங் வேலை.",
      "என் சொந்த டைல் கட்டர் கொண்டு வருவேன்."
    ],
    te: [
      "సమానంగా ఫ్లోర్ మరియు బాత్‌రూమ్ గోడ టైల్స్ ఫిట్టింగ్.",
      "గ్రానైట్, మార్బుల్ మరియు గ్రౌటింగ్ పని.",
      "నా స్వంత టైల్ కట్టర్ తెచ్చుకుంటాను."
    ],
    hi: [
      "फ़र्श और बाथरूम की दीवार पर बराबर टाइल फ़िटिंग।",
      "ग्रेनाइट, मार्बल और ग्राउटिंग का काम।",
      "मैं अपना टाइल कटर साथ लाता हूँ।"
    ]
  },
  masonry: {
    en: [
      "Strong brick work, plastering and repair.",
      "Flooring, compound walls and cement work.",
      "Reliable daily work, finishes on time."
    ],
    kn: [
      "ಗಟ್ಟಿ ಇಟ್ಟಿಗೆ ಕೆಲಸ, ಪ್ಲಾಸ್ಟರಿಂಗ್ ಮತ್ತು ದುರಸ್ತಿ.",
      "ನೆಲಹಾಸು, ಕಾಂಪೌಂಡ್ ಗೋಡೆ ಮತ್ತು ಸಿಮೆಂಟ್ ಕೆಲಸ.",
      "ನಂಬಿಕಸ್ತ ಕೆಲಸ, ಸಮಯಕ್ಕೆ ಮುಗಿಸುತ್ತೇನೆ."
    ],
    ta: [
      "உறுதியான செங்கல், பூச்சு மற்றும் பழுதுபார்க்கும் வேலை.",
      "தளம், சுற்றுச்சுவர் மற்றும் சிமெண்ட் வேலை.",
      "நம்பகமான வேலை, நேரத்திற்கு முடிப்பேன்."
    ],
    te: [
      "బలమైన ఇటుక పని, ప్లాస్టరింగ్ మరియు మరమ్మతులు.",
      "ఫ్లోరింగ్, ప్రహరీ గోడ మరియు సిమెంట్ పని.",
      "నమ్మకమైన పని, సమయానికి పూర్తి చేస్తాను."
    ],
    hi: [
      "मज़बूत ईंट चिनाई, प्लास्टर और मरम्मत का काम।",
      "फर्श, बाउंड्री वॉल और सीमेंट का काम।",
      "भरोसेमंद काम, समय पर पूरा करता हूँ।"
    ]
  },
  cleaning: {
    en: [
      "Deep cleaning for homes, kitchens and bathrooms.",
      "Water tank, terrace and move-in cleaning.",
      "Hard-working, careful and on time."
    ],
    kn: [
      "ಮನೆ, ಅಡುಗೆಮನೆ ಮತ್ತು ಬಾತ್‌ರೂಮ್ ಡೀಪ್ ಕ್ಲೀನಿಂಗ್.",
      "ನೀರಿನ ಟ್ಯಾಂಕ್, ಟೆರೇಸ್ ಮತ್ತು ಹೊಸ ಮನೆ ಶುಚಿಗೊಳಿಸುವಿಕೆ.",
      "ಶ್ರಮಜೀವಿ, ಜಾಗರೂಕ ಮತ್ತು ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಬರುತ್ತೇನೆ."
    ],
    ta: [
      "வீடு, சமையலறை மற்றும் குளியலறை ஆழமான சுத்தம் செய்தல்.",
      "தண்ணீர் தொட்டி, மொட்டை மாடி சுத்தம்.",
      "கடின உழைப்பு, கவனமான மற்றும் நேரத்தவறாத வேலை."
    ],
    te: [
      "ఇల్లు, వంటగది మరియు బాత్‌రూమ్ డీప్ క్లీనింగ్.",
      "నీటి ట్యాంక్, టెర్రస్ శుభ్రపరచడం.",
      "కష్టపడి, జాగ్రత్తగా సమయానికి పని చేస్తాను."
    ],
    hi: [
      "घर, रसोई और बाथरूम की गहरी सफ़ाई।",
      "पानी की टंकी, छत और शिफ्टिंग से पहले की सफ़ाई।",
      "मेहनती, सावधान और समय का पाबंद।"
    ]
  },
  default: {
    en: [
      "Careful, honest work and finishes on time.",
      "Available for daily or full-job work.",
      "I bring my own tools."
    ],
    kn: [
      "ಪ್ರಾಮಾಣಿಕ, ಅಚ್ಚುಕಟ್ಟಾದ ಕೆಲಸ ಮತ್ತು ಸಮಯಕ್ಕೆ ಮುಗಿಸುತ್ತೇನೆ.",
      "ದಿನಗೂಲಿ ಅಥವಾ ಪೂರ್ಣ ಕೆಲಸಕ್ಕೆ ಲಭ್ಯವಿದ್ದೇನೆ.",
      "ನನ್ನ ಸ್ವಂತ ಉಪಕರಣಗಳನ್ನು ತರುತ್ತೇನೆ."
    ],
    ta: [
      "நேர்மையான, நேர்த்தியான வேலை, நேரத்திற்கு முடிப்பேன்.",
      "தினக்கூலி அல்லது முழு வேலைக்கு அழைக்கலாம்.",
      "என் சொந்த கருவிகளைக் கொண்டு வருவேன்."
    ],
    te: [
      "నిజాయితీగా, జాగ్రత్తగా సమయానికి పని పూర్తి చేస్తాను.",
      "రోజువారీ లేదా పూర్తి పనికి అందుబాటులో ఉంటాను.",
      "నా స్వంత పనిముట్లు తెచ్చుకుంటాను."
    ],
    hi: [
      "ईमानदार, साफ़-सुथरा काम और समय पर पूरा।",
      "दैनिक या पूरे काम के लिए उपलब्ध हूँ।",
      "मैं अपने खुद के औज़ार साथ लाता हूँ।"
    ]
  }
};

export function getBioSuggestions(skill: string | undefined, lang: Language): [string, string, string] {
  const key = (skill || "").trim().toLowerCase();
  const entry = SKILL_BIO_SUGGESTIONS[key] || SKILL_BIO_SUGGESTIONS.default;
  return entry[lang] || entry.en;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof TRANSLATIONS | string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "namma_kelsa_lang";
const LANG_ORDER: Language[] = ["en", "kn", "ta", "te", "hi"];

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language;
      if (LANG_ORDER.includes(saved)) {
        return saved;
      }
    } catch {
      // LocalStorage unavailable
    }
    return "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore
    }
  };

  const toggleLanguage = () => {
    const currentIndex = LANG_ORDER.indexOf(language);
    const nextLang = LANG_ORDER[(currentIndex + 1) % LANG_ORDER.length];
    setLanguage(nextLang);
  };

  const t = (key: keyof typeof TRANSLATIONS | string, fallback?: string): string => {
    const entry = TRANSLATIONS[key as keyof typeof TRANSLATIONS];
    if (entry) {
      const val = (entry as Record<string, string | undefined>)[language];
      if (val) return val;
      return entry.kn || entry.en || String(key);
    }
    return fallback || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
