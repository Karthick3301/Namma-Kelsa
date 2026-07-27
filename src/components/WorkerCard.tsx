import React, { useState, useEffect } from "react";
import { 
  Phone, 
  MapPin, 
  Briefcase, 
  Star, 
  ChevronRight, 
  User, 
  Clock, 
  MessageSquare, 
  CheckCircle,
  Eye,
  X
} from "lucide-react";
import { WorkerProfile, WorkerReview } from "../types";
import { getSkillIcon } from "./ChipGroup";
import { collection, query, where, getDocs, addDoc, serverTimestamp, getFirestore } from "firebase/firestore";
import { db, handleFirestoreError, OperationType, auth } from "../firebase";

interface WorkerCardProps {
  key?: string;
  worker: WorkerProfile;
  customerLat: number;
  customerLon: number;
  distance: number;
}

export default function WorkerCard({ 
  worker, 
  customerLat, 
  customerLon, 
  distance 
}: WorkerCardProps) {
  const [reviews, setReviews] = useState<WorkerReview[]>([]);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // Review form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedGalleryImg, setSelectedGalleryImg] = useState<string | null>(null);

  // Fetch reviews when modal is opened
  const fetchReviews = async () => {
    setLoadingReviews(true);
    const reviewsPath = `workers/${worker.uid}/reviews`;
    try {
      const q = query(collection(db, reviewsPath));
      const querySnapshot = await getDocs(q);
      const fetched: WorkerReview[] = [];
      querySnapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as WorkerReview);
      });
      // Sort reviews by date descending or just local state
      setReviews(fetched.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, reviewsPath);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (showReviewsModal) {
      fetchReviews();
    }
  }, [showReviewsModal]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !comment.trim()) return;

    setSubmittingReview(true);
    const reviewsPath = `workers/${worker.uid}/reviews`;
    const newReview = {
      workerId: worker.uid,
      authorName: reviewerName,
      authorId: auth.currentUser?.uid || "guest-customer",
      rating: rating,
      comment: comment,
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, reviewsPath), newReview);
      // Reset form
      setComment("");
      setReviewerName("");
      setRating(5);
      // Refresh list
      fetchReviews();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, reviewsPath);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0"; // default initial rating

  return (
    <div 
      id={`worker-card-${worker.uid}`}
      className="relative flex flex-col justify-between bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm transition-all duration-300 hover:shadow-md overflow-hidden"
    >
      {/* Availability Pulsing Banner at the top */}
      <div className={`flex items-center justify-between px-4 py-2.5 text-xs font-bold tracking-wide border-b ${
        worker.isAvailable 
          ? "bg-emerald-50 text-emerald-800 border-emerald-100/40" 
          : "bg-slate-100 text-slate-500 border-slate-200/40"
      }`}>
        <div className="flex items-center gap-1.5">
          <span className={`relative flex h-2 w-2`}>
            {worker.isAvailable && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${worker.isAvailable ? "bg-emerald-500" : "bg-slate-400"}`}></span>
          </span>
          <span>{worker.isAvailable ? "AVAILABLE TODAY" : "NOT AVAILABLE TODAY"}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 text-[10px] font-mono">
          <Clock className="w-3" /> Updated recently
        </div>
      </div>

      {/* Profile Header Content */}
      <div className="p-5 flex-1">
        <div className="flex gap-4">
          <img 
            src={worker.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
            alt={worker.name} 
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-xl object-cover ring-2 ring-emerald-100 bg-slate-50 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900 text-base truncate flex items-center gap-1.5">
              {worker.name}
              {worker.isAvailable && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
            </h3>
            
            <p className="text-slate-500 text-xs font-medium flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-650" />
              <span>{worker.locationName}</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-bold">{distance} km away</span>
            </p>

            {/* Daily rate badge and experience badge */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold leading-normal border border-emerald-150/40 shadow-2xs">
                ₹{worker.dailyRate} / day
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-50 text-slate-700 text-xs font-semibold leading-normal border border-slate-200">
                <Briefcase className="w-3 h-3 mr-1" /> {worker.experience} yrs exp
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic skills tag array with Geometric rectangular/semi-rounded form factor */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {worker.skills.map((skill) => (
            <span 
              key={skill}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-755 border border-slate-200"
            >
              {getSkillIcon(skill, "w-3 h-3 text-slate-500")}
              <span>{skill}</span>
            </span>
          ))}
        </div>

        {/* Profile Bio */}
        <p className="text-slate-600 text-xs mt-3.5 line-clamp-2 italic leading-relaxed">
          "{worker.about || "Local daily wage professional ready to deliver top work."}"
        </p>

        {/* Gallery Preview Box (Strict limit of 3) */}
        {worker.gallery && worker.gallery.length > 0 && (
          <div className="mt-4">
            <h4 className="text-slate-400 font-mono text-[9px] uppercase tracking-wider mb-1.5 font-bold">Verified Works Gallery</h4>
            <div className="grid grid-cols-3 gap-2">
              {worker.gallery.slice(0, 3).map((img, idx) => (
                <div 
                  key={idx}
                  onClick={() => setSelectedGalleryImg(img)}
                  className="relative group aspect-square rounded-lg overflow-hidden bg-slate-50 border border-slate-200 cursor-zoom-in"
                >
                  <img 
                    src={img} 
                    alt={`Work ${idx+1}`} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <Eye className="w-4 h-4 text-white drop-shadow-sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Worker Card Action Footer */}
      <div className="border-t border-slate-150 p-4 bg-slate-50/80 flex items-center justify-between gap-3">
        {/* Review rating summary trigger */}
        <button 
          id={`reviews-button-${worker.uid}`}
          onClick={() => setShowReviewsModal(true)}
          className="flex items-center gap-1 text-slate-700 hover:text-emerald-750 transition text-xs font-bold cursor-pointer py-1.5 px-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
        >
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span>{averageRating}</span>
          <span className="text-slate-400 font-normal">({reviews.length || 0} reviews)</span>
        </button>

        {/* Standard phone dialer trigger "Call" Button with micro-animations & shadow */}
        <a 
          id={`call-button-${worker.uid}`}
          href={`tel:${worker.phone}`}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-2 px-4 rounded-xl text-xs font-black shadow-md shadow-emerald-100 tracking-wider hover:shadow-lg transition-all duration-200 uppercase"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Call Now</span>
        </a>
      </div>

      {/* Image Zoom Modal */}
      {selectedGalleryImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="relative max-w-lg w-full bg-white rounded-xl overflow-hidden shadow-2xl">
            <img src={selectedGalleryImg} alt="Enlarged Work Description" referrerPolicy="no-referrer" className="w-full h-auto object-contain" />
            <button 
              onClick={() => setSelectedGalleryImg(null)}
              className="absolute top-3 right-3 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Customer Reviews & Feedback Modal */}
      {showReviewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/20">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Reviews ({worker.name})</h3>
                <p className="text-xs text-slate-500">Provide direct feedback on quality & speed</p>
              </div>
              <button 
                onClick={() => setShowReviewsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List & Add reviews */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Form to submit review */}
              <form onSubmit={handleSubmitReview} className="p-4 bg-slate-50 rounded-xl space-y-3.5 border border-slate-200">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Leave a Review (Rate Work Quality)</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase font-mono">Your Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Nagaraj K."
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      required
                      className="mt-1 w-full bg-white border border-slate-200 rounded-lg text-sm p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase font-mono">Rating (Stars)</label>
                    <div className="flex items-center gap-1.5 mt-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRating(s)}
                          className="p-0.5 cursor-pointer text-amber-400 transition hover:scale-125"
                        >
                          <Star className={`w-5 h-5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase font-mono">Work Feedback</label>
                  <textarea 
                    rows={2}
                    placeholder="Describe their daily wage job..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    className="mt-1 w-full bg-white border border-slate-200 rounded-lg text-sm p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition cursor-pointer tracking-wider uppercase"
                >
                  {submittingReview ? "Submitting..." : "Submit Verified Review"}
                </button>
              </form>

              {/* Reviews List */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">Customer Postings</h4>
                {loadingReviews ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">Loading testimonials from Firestore...</p>
                ) : reviews.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">No reviews posted yet. Be the first to leave one!</p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                      <div className="flex justify-between items-center bg-slate-55 p-1 rounded-md mb-2">
                        <span className="text-xs font-bold text-slate-800">{rev.authorName}</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((starIdx) => (
                            <Star 
                              key={starIdx} 
                              className={`w-3 h-3 ${starIdx <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 text-xs italic">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Close Panel */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowReviewsModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer transition"
              >
                Close Reviews
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
