import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getIcon } from '../utils/helpers';

const StarIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
  </svg>
);

const ProductCard = ({ product, cartItem, onAdd, onRemove }) => {
  const quantity = cartItem ? cartItem.quantity : 0;
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    // Prevent navigation if the user clicked the add/remove buttons
    if (e.target.closest('button')) return;
    navigate(`/product/${product._id}`);
  };

  return (
    <div 
        onClick={handleCardClick}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-full transition-all duration-500 relative group cursor-pointer hover:scale-[1.03] hover:shadow-2xl hover:border-green-200 overflow-hidden"
    >
      
      {/* Top Image Section - Highly Interactive */}
      <div className="relative h-48 w-full bg-gray-50 overflow-hidden">
        {product.imageUrl ? (
            <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
        ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl transition-transform duration-700 group-hover:scale-110 opacity-70">
                {getIcon(product.category)}
            </div>
        )}

        {/* Badges */}
        {product.isImperfect && (
            <span className="absolute top-3 left-3 bg-yellow-400/90 backdrop-blur-sm text-yellow-900 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider z-20 shadow-sm">
                Imperfect
            </span>
        )}

        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-green-700 text-[10px] font-black px-2.5 py-1 rounded-md shadow-sm border border-white/50 z-20">
            {product.quantity} {product.unit}
        </span>

        {/* --- PREMIUM GLASSMORPHISM HOVER OVERLAY --- */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 flex flex-col justify-end p-4">
            <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                <div className="flex items-center gap-1.5 mb-1.5">
                    <StarIcon className="w-5 h-5 text-yellow-400 drop-shadow-md" />
                    <span className="text-white font-bold text-lg drop-shadow-md">{product.averageRating ? product.averageRating.toFixed(1) : 'New'}</span>
                    <span className="text-gray-300 text-xs font-medium ml-1">({product.numReviews || 0} reviews)</span>
                </div>
                
                <p className="text-gray-200 text-xs line-clamp-2 leading-relaxed mb-3">
                    Premium quality {product.category.toLowerCase()} sourced directly from {product.farmerId?.name?.split(' ')[0] || 'our'} farms. Click to read verified reviews!
                </p>

                <div className="inline-flex items-center justify-center w-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold py-2 rounded-lg border border-white/20 transition-colors">
                    View Full Details
                </div>
            </div>
        </div>
      </div>

      {/* Bottom Content Section */}
      <div className="p-4 flex-1 flex flex-col z-20 bg-white">
        
        <div className="flex justify-between items-start mb-1">
            <h3 className="text-gray-900 font-bold text-lg leading-tight line-clamp-1 group-hover:text-green-600 transition-colors">
                {product.name}
            </h3>
        </div>

        <div className="text-xs text-gray-500 flex items-center gap-1.5 mb-4">
            <span>👨‍🌾</span> {product.farmerId?.name?.split(' ')[0] || 'Local Farmer'}
            {product.farmerId?.location?.city && (
                <>
                    <span className="text-gray-300">•</span>
                    <span>📍 {product.farmerId.location.city}</span>
                </>
            )}
        </div>
        
        {/* Footer: Price & Add Button */}
        <div className="mt-auto flex items-center justify-between">
            <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-gray-900 tracking-tight">₹{product.price}</span>
            </div>

            {quantity === 0 ? (
                <button 
                    onClick={(e) => { e.stopPropagation(); onAdd(product); }}
                    className="bg-green-50 text-green-700 border border-green-200 text-sm font-bold px-4 py-1.5 rounded-lg hover:bg-green-600 hover:text-white hover:border-green-600 transition-all active:scale-95 shadow-sm"
                >
                    ADD
                </button>
            ) : (
                <div 
                    className="flex items-center bg-green-600 text-white rounded-lg shadow-md border border-green-700 h-9"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        onClick={() => onRemove(product)}
                        className="px-3 h-full hover:bg-green-700 transition-colors active:bg-green-800 font-bold text-lg rounded-l-lg flex items-center justify-center"
                    >
                        −
                    </button>
                    <span className="text-sm font-bold px-2 min-w-[28px] text-center">{quantity}</span>
                    <button 
                        onClick={() => onAdd(product)}
                        className="px-3 h-full hover:bg-green-700 transition-colors active:bg-green-800 font-bold text-lg rounded-r-lg flex items-center justify-center"
                    >
                        +
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProductCard);
