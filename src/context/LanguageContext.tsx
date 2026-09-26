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
    en: "Your Location / Town Hub",
    kn: "ನಿಮ್ಮ ಸ್ಥಳ / ತಾಲೂಕು ಕೇಂದ್ರ",
    ta: "உங்கள் இருப்பிடம் / தாலுகா மையம்",
    te: "మీ ప్రాంతం / పట్టణ కేంద్రం",
    hi: "आपका स्थान / कस्बा केंद्र"
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
    en: "Direct Contact Phone (10 digits)", 
    kn: "ನೇರ ಸಂಪರ್ಕ ಫೋನ್ ಸಂಖ್ಯೆ", 
    ta: "நேரடி தொடர்பு தொலைபேசி எண்", 
    te: "ప్రత్యక్ష సంప్రదింపు ఫోన్ నంబర్", 
    hi: "सीधा संपर्क फोन नंबर" 
  },
  dailyWageRate: { 
    en: "Daily Wage Rate (₹ / Day)", 
    kn: "ದಿನಗೂಲಿ ದರ (₹ / ದಿನಕ್ಕೆ)", 
    ta: "தினசரி கூலி விகிதம் (₹ / நாள்)", 
    te: "రోజువారీ వేతన రేటు (₹ / రోజుకు)", 
    hi: "दैनिक मजदूरी दर (₹ / दिन)" 
  },
  workExperience: { 
    en: "Field Work Experience (Years)", 
    kn: "ಕೆಲಸದ ಅನುಭವ (ವರ್ಷಗಳು)", 
    ta: "வேலை அனுபவம் (ஆண்டுகள்)", 
    te: "పని అనుభవం (సంవత్సరాలు)", 
    hi: "कार्य अनुभव (वर्ष)" 
  },
  locationHubSelect: { 
    en: "Primary Base Hub / Town", 
    kn: "ಮುಖ್ಯ ಸ್ಥಳ / ತಾಲೂಕು ಕೇಂದ್ರ", 
    ta: "முதன்மை தாலுகா மையம்", 
    te: "ప్రధాన పట్టణ కేంద్రం", 
    hi: "मुख्य स्थान / कस्बा" 
  },
  availabilityToggle: { 
    en: "I am available for work today", 
    kn: "ನಾನು ಇಂದು ಕೆಲಸಕ್ಕೆ ಲಭ್ಯವಿದ್ದೇನೆ", 
    ta: "நான் இன்று வேலைக்கு கிடைக்கிறேன்", 
    te: "నేను ఈరోజు పనికి అందుబాటులో ఉన్నాను", 
    hi: "मैं आज काम के लिए उपलब्ध हूं" 
  },
  aboutBio: { 
    en: "Artisan Statement / About You", 
    kn: "ನಿಮ್ಮ ಬಗ್ಗೆ ಮತ್ತು ಕೆಲಸದ ವಿವರಣೆ", 
    ta: "உங்களைப் பற்றிய விவரம்", 
    te: "మీ గురించి మరియు పని వివరణ", 
    hi: "आपके और काम के बारे में" 
  },
  saveProfile: { 
    en: "Save & Publish Profile", 
    kn: "ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ ಮತ್ತು ಪ್ರಕಟಿಸಿ", 
    ta: "சுயவிவரத்தை சேமித்து வெளியிடுக", 
    te: "ప్రొఫైల్‌ను సేవ్ చేసి ప్రచురించండి", 
    hi: "प्रोफ़ाइल सहेजें और प्रकाशित करें" 
  },
  savingProfile: { 
    en: "Saving Profile...", 
    kn: "ಉಳಿಸಲಾಗುತ್ತಿದೆ...", 
    ta: "சேமிக்கப்படுகிறது...", 
    te: "సేవ్ అవుతోంది...", 
    hi: "सहेजा जा रहा है..." 
  },
  profileSaved: { 
    en: "Profile Saved!", 
    kn: "ಪ್ರೊಫೈಲ್ ಉಳಿಸಲಾಗಿದೆ!", 
    ta: "சுயவிவரம் சேமிக்கப்பட்டது!", 
    te: "ప్రొఫైల్ సేవ్ చేయబడింది!", 
    hi: "प्रोफ़ाइल सहेजी गई!" 
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

  // Skill Proficiency Radar Chart
  skillRadarTitle: {
    en: "Skills Proficiency Radar",
    kn: "ಕೌಶಲ್ಯ ಸಾಮರ್ಥ್ಯ ರೇಡಾರ್ (Radar Chart)",
    ta: "திறன் தேர்ச்சி ரேடார் விளக்கப்படம்",
    te: "నైపుణ్యాల సామర్థ్య రాడార్ చార్ట్",
    hi: "कौशल प्रवीणता रडार चार्ट"
  },
  skillRadarSubtitle: {
    en: "Self-assessed competency across your listed craft skills and workmanship standards.",
    kn: "ನಿಮ್ಮ ಪಟ್ಟಿಮಾಡಲಾದ ಕುಶಲ ಕಲೆ ಮತ್ತು ಕೆಲಸದ ಗುಣಮಟ್ಟದ ಸ್ವಯಂ-ಮೌಲ್ಯಮಾಪನ.",
    ta: "உங்கள் பட்டியலிடப்பட்ட தொழில் திறன்களின் சுய மதிப்பீடு.",
    te: "మీ జాబితా చేయబడిన నైపుణ్యాల స్వీయ-అంచనా.",
    hi: "आपके सूचीबद्ध शिल्प कौशल और कारीगरी मानकों की स्व-मूल्यांकन प्रवीणता।"
  },
  selectSkillsFirstForRadar: {
    en: "Select at least 1 skill above to generate your proficiency radar chart.",
    kn: "ನಿಮ್ಮ ಕೌಶಲ್ಯ ರೇಡಾರ್ ಚಾರ್ಟ್ ರಚಿಸಲು ಮೇಲಿನ ಕನಿಷ್ಠ 1 ಕೌಶಲ್ಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    ta: "ரேடார் விளக்கப்படத்தை உருவாக்க மேலே உள்ள குறைந்தபட்சம் 1 திறனைத் தேர்ந்தெடுக்கவும்.",
    te: "రాడార్ చార్ట్‌ను రూపొందించడానికి పైన కనీసం 1 నైపుణ్యాన్ని ఎంచుకోండి.",
    hi: "अपना रडार चार्ट बनाने के लिए ऊपर कम से कम 1 कौशल चुनें।"
  },
  overallMastery: {
    en: "Overall Mastery",
    kn: "ಒಟ್ಟು ಪರಿಣತಿ",
    ta: "ஒட்டுமொத்த தேர்ச்சி",
    te: "మొత్తం నైపుణ్యం",
    hi: "समग्र दक्षता"
  },
  craftsmanshipStandards: {
    en: "Work Quality Standards",
    kn: "ಕೆಲಸದ ಗುಣಮಟ್ಟ ಮಾನದಂಡಗಳು",
    ta: "வேலை தரநிலைகள்",
    te: "పని నాణ్యత ప్రమాణాలు",
    hi: "कार्य गुणवत्ता मानक"
  }
};

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
