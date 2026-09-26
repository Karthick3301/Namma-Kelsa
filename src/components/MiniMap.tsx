import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, ExternalLink, Compass } from "lucide-react";

interface MiniMapProps {
  workerName: string;
  workerLat: number;
  workerLon: number;
  workerLocationName: string;
  customerLat: number;
  customerLon: number;
  customerTownName: string;
  distance: number;
}

export default function MiniMap({
  workerName,
  workerLat,
  workerLon,
  workerLocationName,
  customerLat,
  customerLon,
  customerTownName,
  distance
}: MiniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Safe coordinates validation with dynamic fallbacks
    const validCustLat = Number.isFinite(customerLat) ? customerLat : 20.5937;
    const validCustLon = Number.isFinite(customerLon) ? customerLon : 78.9629;
    const validWorkerLat = Number.isFinite(workerLat) ? workerLat : validCustLat;
    const validWorkerLon = Number.isFinite(workerLon) ? workerLon : validCustLon;

    try {
      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map with lightweight interactions
      const map = L.map(mapContainerRef.current, {
        attributionControl: false,
        zoomControl: true,
        scrollWheelZoom: false,
        dragging: true,
        doubleClickZoom: false
      });

      mapInstanceRef.current = map;

      // Add OpenStreetMap standard tiles
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      // Custom HTML Pin for Customer (Blue)
      const customerIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <div style="background-color: #2563eb; color: white; padding: 2px 6px; border-radius: 9999px; font-size: 10px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.25); border: 1.5px solid white;">
              📍 You (${customerTownName || "Town"})
            </div>
            <div style="width: 12px; height: 12px; background-color: #2563eb; border: 2px solid white; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3); margin-top: 2px;"></div>
          </div>
        `,
        iconSize: [0, 0]
      });

      // Custom HTML Pin for Worker (Emerald)
      const workerIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <div style="background-color: #059669; color: white; padding: 2px 6px; border-radius: 9999px; font-size: 10px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.25); border: 1.5px solid white;">
              ⭐ ${workerName}
            </div>
            <div style="width: 14px; height: 14px; background-color: #059669; border: 2px solid white; border-radius: 50%; box-shadow: 0 1px 4px rgba(0,0,0,0.4); margin-top: 2px; animation: pulse 2s infinite;"></div>
          </div>
        `,
        iconSize: [0, 0]
      });

      const customerMarker = L.marker([validCustLat, validCustLon], { icon: customerIcon }).addTo(map);
      customerMarker.bindPopup(`<b>Your Search Center</b><br>${customerTownName}`);

      const workerMarker = L.marker([validWorkerLat, validWorkerLon], { icon: workerIcon }).addTo(map);
      workerMarker.bindPopup(`<b>${workerName}</b><br>${workerLocationName}<br><b>Distance:</b> ${distance >= 9999 ? "Pending" : distance < 1 ? "< 1 km" : `${distance} km`} away`);

      // Connect with dashed line
      const latlngs: [number, number][] = [
        [validCustLat, validCustLon],
        [validWorkerLat, validWorkerLon]
      ];

      L.polyline(latlngs, {
        color: "#059669",
        weight: 3,
        dashArray: "6, 8",
        opacity: 0.85
      }).addTo(map);

      // Fit bounds to show both points with padding
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });

      // Invalidate size after rendering in case of container sizing
      const timer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);

      return () => {
        clearTimeout(timer);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    } catch (err) {
      console.error("Leaflet initialization error:", err);
      setMapError(true);
    }
  }, [workerLat, workerLon, customerLat, customerLon, workerName, customerTownName, distance, workerLocationName]);

  // Google Maps / External Map navigation URL
  const navUrl = `https://www.google.com/maps/dir/?api=1&origin=${customerLat},${customerLon}&destination=${workerLat},${workerLon}&travelmode=driving`;

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-2xs">
      {/* Mini Map Header Strip */}
      <div className="bg-slate-100/90 px-3 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Compass className="w-3.5 h-3.5 text-emerald-600" />
          <span>Location Distance Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
            {distance >= 9999 ? "Pending" : distance < 1 ? "< 1 km" : `${distance} km`}
          </span>
          <a
            href={navUrl}
            target="_blank"
            rel="noreferrer"
            title="Open directions in Google Maps"
            className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-0.5 hover:underline"
          >
            <span>Directions</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* Map View or Fallback static placeholder */}
      {mapError ? (
        <div className="h-44 bg-emerald-50/50 p-4 flex flex-col items-center justify-center text-center">
          <Navigation className="w-8 h-8 text-emerald-600 mb-2 animate-bounce" />
          <p className="text-xs font-bold text-slate-800">
            {customerTownName} → {workerLocationName}
          </p>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Distance: <span className="font-bold text-emerald-700">{distance >= 9999 ? "Pending" : distance < 1 ? "< 1 km" : `${distance} km`}</span> away
          </p>
          <a
            href={navUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg font-bold shadow-xs transition"
          >
            <span>Open in Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      ) : (
        <div className="relative">
          <div 
            ref={mapContainerRef} 
            className="h-44 w-full z-0" 
            style={{ minHeight: "176px" }}
          />
          {/* Bottom helper overlay */}
          <div className="absolute bottom-1 left-2 right-2 z-10 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-xs text-[10px] text-slate-650 px-2 py-1 rounded-md shadow-2xs border border-slate-200/80 flex items-center justify-between font-mono">
              <span className="truncate">📍 {customerTownName}</span>
              <span className="text-emerald-700 font-bold mx-1">─── {distance >= 9999 ? "Pending" : distance < 1 ? "< 1km" : `${distance}km`} ───</span>
              <span className="truncate">⭐ {workerLocationName}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
