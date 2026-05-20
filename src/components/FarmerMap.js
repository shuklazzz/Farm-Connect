import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { productAPI } from '../services/api'; 

// Fix for default Leaflet marker icons not loading natively in React Webpack setups
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const buyerIcon = L.divIcon({
    className: 'custom-div-icon',
    html: "<div style='background-color:#3b82f6; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);'></div>",
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

const FarmerMap = ({ buyerLocation }) => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const fetchFarmers = async () => {
         try {
             // Fetching all available products to dynamically extract unique, active farmers
             const response = await productAPI.getAll(); 
             const uniqueFarmers = {};
             
             // Extract products from the response payload safely
             const productsList = Array.isArray(response) ? response : (response.products || []);
             
             productsList.forEach(p => {
                 // Only map farmers who have successfully geocoded coordinates
                 if (p.farmerId && p.farmerId.location && p.farmerId.location.coordinates?.lat) {
                      if (!uniqueFarmers[p.farmerId._id]) {
                          uniqueFarmers[p.farmerId._id] = { ...p.farmerId, products: [] };
                      }
                      uniqueFarmers[p.farmerId._id].products.push(p);
                 }
             });
             setFarmers(Object.values(uniqueFarmers));
         } catch(e) {
             console.error("Failed to extract map data:", e);
         } finally {
             setLoading(false);
         }
      };
      
      fetchFarmers();
  }, []);

  if (loading) return (
       <div className="w-full h-96 rounded-2xl flex items-center justify-center bg-gray-50 border border-gray-100 animate-pulse">
           <span className="text-gray-400 font-medium">Satellites locating local farms... 🛰️</span>
       </div>
  );

  const hasBuyerLocation = buyerLocation && buyerLocation.coordinates && buyerLocation.coordinates.lat;

  if (farmers.length === 0 && !hasBuyerLocation) return (
       <div className="w-full py-12 rounded-2xl flex items-center justify-center bg-gray-50 border border-gray-100 mb-8">
           <span className="text-gray-500 font-medium">No active farms pinpointed yet. New farmers will appear here automatically! 🌾</span>
       </div>
  );

  // Auto-center map on buyer if available, else first detected farmer
  let center = [20.5937, 78.9629]; // Default to India center
  if (hasBuyerLocation) {
      center = [buyerLocation.coordinates.lat, buyerLocation.coordinates.lng];
  } else if (farmers.length > 0) {
      center = [farmers[0].location.coordinates.lat, farmers[0].location.coordinates.lng];
  }

  return (
    <div className="w-full h-[28rem] rounded-[2.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/50 relative z-0 mb-12 group">
        <MapContainer center={center} zoom={11} scrollWheelZoom={false} className="w-full h-full">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            {hasBuyerLocation && (
                <Marker position={[buyerLocation.coordinates.lat, buyerLocation.coordinates.lng]} icon={buyerIcon}>
                    <Popup className="rounded-2xl">
                        <div className="text-center font-sans p-1">
                            <strong className="text-blue-600 block text-base leading-tight mb-1">You are here</strong>
                            <span className="text-xs text-gray-500">{buyerLocation.city || 'Your Location'}</span>
                        </div>
                    </Popup>
                </Marker>
            )}
            {farmers.map((farmer) => (
                <Marker key={farmer._id} position={[farmer.location.coordinates.lat, farmer.location.coordinates.lng]}>
                    <Popup className="rounded-2xl">
                        <div className="text-center font-sans min-w-[180px] p-1">
                            <strong className="text-green-700 block text-base leading-tight mb-1">{farmer.farmDetails?.farmName || farmer.name}</strong>
                            <span className="text-xs text-gray-500 inline-block bg-gray-100 px-2 py-1 rounded-full mb-3">{farmer.location.city}, {farmer.location.state}</span>
                            
                            <div className="text-left border-t border-gray-100 pt-3 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Available Harvest</p>
                                <ul className="space-y-1.5">
                                    {farmer.products?.slice(0, 10).map(prod => (
                                        <li key={prod._id} className="text-sm flex justify-between items-center text-gray-700 bg-gray-50/50 px-2 py-1 rounded cursor-default hover:bg-green-50 transition-colors">
                                            <span className="truncate pr-3 font-medium capitalize flex-1">{prod.name}</span>
                                            <span className="font-bold text-green-700 whitespace-nowrap">₹{prod.price}<span className="text-[10px] font-normal text-gray-400">/{prod.unit}</span></span>
                                        </li>
                                    ))}
                                    {farmer.products?.length > 10 && (
                                        <li className="text-xs text-center text-green-600 font-medium italic pt-1">
                                            + {farmer.products.length - 10} more items...
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
        
        {/* Floating Glass Label Overlay */}
        <div className="absolute top-4 left-4 z-[400] bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-white font-bold text-gray-800 text-sm">
            🚜 Active Farmers Radar
        </div>
    </div>
  );
};

export default FarmerMap;
