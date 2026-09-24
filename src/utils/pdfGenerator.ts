import { jsPDF } from "jspdf";
import { WorkerProfile } from "../types";
import { formatDateToISO, formatDisplayDate } from "../utils";

/**
 * Helper to safely convert an image URL or Base64 string into a data URL for jsPDF.
 * Handles CORS gracefully without throwing errors.
 */
async function getBase64Image(imageUrl: string): Promise<string | null> {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("data:image/")) {
    return imageUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const maxW = 400;
        const maxH = 300;
        let w = img.naturalWidth || 300;
        let h = img.naturalHeight || 200;

        if (w > maxW) {
          h = Math.round((h * maxW) / w);
          w = maxW;
        }
        if (h > maxH) {
          w = Math.round((w * maxH) / h);
          h = maxH;
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

/**
 * Generates and downloads a clean, printable PDF portfolio for a worker.
 */
export async function downloadWorkerProfilePdf(
  worker: WorkerProfile,
  averageRating: string,
  reviewsCount: number
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // 1. Header Banner (Deep Emerald)
  doc.setFillColor(6, 78, 59); // Emerald 900
  doc.rect(0, 0, pageWidth, 28, "F");

  // Accent Line (Teal/Emerald 400)
  doc.setFillColor(52, 211, 153);
  doc.rect(0, 28, pageWidth, 1.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("NAMMA-KELSA | VERIFIED WORKER PORTFOLIO", margin, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);
  doc.text("Direct Daily-Wage Artisan Directory • Fair Wage & Direct Contact", margin, 21);

  // 2. Worker Identity Block
  let currentY = 38;

  // Try loading avatar
  const avatarData = await getBase64Image(worker.photo);
  if (avatarData) {
    try {
      doc.addImage(avatarData, "JPEG", margin, currentY, 26, 26);
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.5);
      doc.rect(margin, currentY, 26, 26);
    } catch {
      // Ignore image rendering error
    }
  }

  const textStartX = avatarData ? margin + 31 : margin;

  // Worker Name
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(worker.name, textStartX, currentY + 6);

  // Availability & Tag
  doc.setFontSize(9);
  const todayIso = formatDateToISO(new Date());
  const isMarkedBusyToday = Boolean(worker.unavailableDates && worker.unavailableDates.includes(todayIso));
  const isAvailableToday = worker.isAvailable && !isMarkedBusyToday;

  if (isAvailableToday) {
    doc.setTextColor(5, 150, 105); // Emerald 600
    doc.setFont("helvetica", "bold");
    doc.text("● AVAILABLE FOR WORK TODAY", textStartX, currentY + 12);
  } else if (isMarkedBusyToday) {
    doc.setTextColor(225, 29, 72); // Rose 600
    doc.setFont("helvetica", "bold");
    doc.text("● MARKED BUSY / ON LEAVE TODAY", textStartX, currentY + 12);
  } else {
    doc.setTextColor(217, 119, 6); // Amber 600
    doc.setFont("helvetica", "bold");
    doc.text("○ CURRENTLY BUSY / ON ASSIGNMENT", textStartX, currentY + 12);
  }

  // Location & Experience Summary
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105); // Slate 600
  doc.setFontSize(9.5);
  doc.text(
    `Hub: ${worker.locationName}   |   Experience: ${worker.experience} Years   |   Rating: ${averageRating} / 5.0 (${reviewsCount} reviews)`,
    textStartX,
    currentY + 18
  );

  // If worker has upcoming unavailable dates, print them
  if (worker.unavailableDates && worker.unavailableDates.length > 0) {
    const upcomingList = worker.unavailableDates
      .filter(d => d >= todayIso)
      .slice(0, 3)
      .map(formatDisplayDate)
      .join(", ");
    if (upcomingList) {
      doc.setFontSize(8);
      doc.setTextColor(225, 29, 72);
      doc.setFont("helvetica", "bold");
      doc.text(`Upcoming Busy / Leave Dates: ${upcomingList}`, textStartX, currentY + 23.5);
    }
  }

  currentY += 34;

  // 3. Contact & Rate Card Box
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("DIRECT CONTACT PHONE", margin + 5, currentY + 7);
  doc.text("DAILY WAGE RATE", margin + (contentWidth / 3) + 5, currentY + 7);
  doc.text("LOCATION NEIGHBORHOOD", margin + (2 * contentWidth / 3) + 5, currentY + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`+91 ${worker.phone}`, margin + 5, currentY + 16);

  doc.setTextColor(5, 150, 105);
  doc.text(`Rs ${worker.dailyRate} / day`, margin + (contentWidth / 3) + 5, currentY + 16);

  doc.setTextColor(15, 23, 42);
  doc.text(worker.locationName, margin + (2 * contentWidth / 3) + 5, currentY + 16);

  currentY += 30;

  // 4. Skills & Trade Expertise
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("TRADE SKILLS & SPECIALIZATIONS", margin, currentY);

  currentY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);

  const skillsText = worker.skills.length > 0 
    ? worker.skills.join("   •   ") 
    : "General Labor & Artisan Construction";
  doc.text(skillsText, margin, currentY + 2);

  currentY += 10;

  // 5. About / Artisan Statement
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("WORKER PROFILE & EXPERIENCE BIO", margin, currentY);

  currentY += 5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);

  const bio = worker.about || "Dedicated daily-wage artisan available for quality local service with pride and punctuality.";
  const splitBio = doc.splitTextToSize(`"${bio}"`, contentWidth);
  doc.text(splitBio, margin, currentY + 2);

  currentY += (splitBio.length * 5) + 8;

  // 6. Past Work Photos (imageUrls)
  const workPhotos = (worker.imageUrls && worker.imageUrls.length > 0)
    ? worker.imageUrls
    : (worker.gallery && worker.gallery.length > 0 ? worker.gallery : []);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`VERIFIED PAST WORK PORTFOLIO (${workPhotos.length} Photos)`, margin, currentY);

  currentY += 6;

  if (workPhotos.length > 0) {
    // Process photos to load as base64
    const photoPromises = workPhotos.slice(0, 6).map(url => getBase64Image(url));
    const loadedPhotos = await Promise.all(photoPromises);

    const cols = 3;
    const photoWidth = (contentWidth - ((cols - 1) * 4)) / cols;
    const photoHeight = 36;

    for (let i = 0; i < loadedPhotos.length; i++) {
      const colIndex = i % cols;
      const rowIndex = Math.floor(i / cols);
      const photoX = margin + colIndex * (photoWidth + 4);
      const photoY = currentY + rowIndex * (photoHeight + 6);

      // Check if we need a new page
      if (photoY + photoHeight > 275) {
        doc.addPage();
        currentY = 20;
      }

      const photoData = loadedPhotos[i];
      if (photoData) {
        try {
          doc.addImage(photoData, "JPEG", photoX, photoY, photoWidth, photoHeight);
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.3);
          doc.rect(photoX, photoY, photoWidth, photoHeight);
        } catch {
          // Fallback box if addImage fails
          doc.setFillColor(241, 245, 249);
          doc.rect(photoX, photoY, photoWidth, photoHeight, "F");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text(`Work Sample #${i + 1}`, photoX + 4, photoY + (photoHeight / 2));
        }
      } else {
        // Fallback box for CORS-restricted or unloaded image
        doc.setFillColor(241, 245, 249);
        doc.rect(photoX, photoY, photoWidth, photoHeight, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(`Work Sample #${i + 1}`, photoX + 4, photoY + (photoHeight / 2));
      }
    }

    const totalRows = Math.ceil(loadedPhotos.length / cols);
    currentY += totalRows * (photoHeight + 6) + 4;
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("No past work photos uploaded yet.", margin, currentY + 3);
    currentY += 12;
  }

  // 7. Footer / Verification Stamp
  const footerY = 282;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated via Namma-Kelsa on ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })} • Direct Hire • Zero Commission Platform`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  // Trigger browser download
  const safeFilename = `${worker.name.replace(/[^a-zA-Z0-9]/g, "_")}_Portfolio.pdf`;
  doc.save(safeFilename);
}
