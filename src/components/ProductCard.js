import React from 'react';
import { getIcon } from '../utils/helpers';

const ProductCard = ({ product, cartItem, onAdd, onRemove }) => {
  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <div className="bg-white p-3 rounded-2xl shadow-sm border border-green-50 flex flex-col justify-between h-full hover:shadow-lg hover:border-green-200 transition-all duration-300 relative group overflow-hidden">
      
      {/* Subtle Green Glow Background Effect */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-green-50 to-transparent opacity-50 z-0"></div>

      {/* Image / Icon Area */}
      <div className="bg-white rounded-xl h-36 flex items-center justify-center mb-3 relative z-10 border border-green-50/50 shadow-inner group-hover:scale-[1.02] transition-transform duration-300 overflow-hidden">
        {product.imageUrl ? (
            <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover transform transition-transform group-hover:scale-110 duration-500"
            />
        ) : (
            <div className="text-7xl transform transition-transform group-hover:scale-110 duration-300 drop-shadow-sm">
                {getIcon(product.category)}
            </div>
        )}
        
        {product.isImperfect && (
            <span className="absolute top-2 left-2 bg-yellow-100 text-yellow-800 border border-yellow-200 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wide flex items-center gap-1 z-20 shadow-sm">
                <span>🌱</span> Imperfect
            </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col z-10">
        <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                {product.quantity} {product.unit}
            </div>
            <div className="text-[10px] font-medium text-gray-400">
                Fresh Farm
            </div>
        </div>
        
        <h3 className="text-gray-900 font-extrabold text-base leading-tight mb-1 line-clamp-2 tracking-tight">
            {product.name}
        </h3>
        <div className="flex flex-col gap-1 mb-4">
            <div className="text-xs text-gray-500 flex items-center gap-1">
                <span>👨‍🌾</span> {product.farmerId?.name?.split(' ')[0] || 'Local Farmer'}
            </div>
            {product.farmerId?.location?.city && (
                <div className="text-[10px] text-gray-400 flex items-center gap-1 font-medium bg-gray-50 max-w-fit px-1.5 py-0.5 rounded border border-gray-100">
                    <span>📍</span> From {product.farmerId.location.city}
                </div>
            )}
        </div>
        
        {/* Price & Action Footer */}
        <div className="mt-auto flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-lg font-black text-gray-900">₹{product.price}</span>
            </div>

            {quantity === 0 ? (
                <button 
                    onClick={() => onAdd(product)}
                    className="bg-white text-green-700 border-2 border-green-600 text-xs font-bold px-5 py-2 rounded-xl uppercase hover:bg-green-600 hover:text-white transition-all shadow-sm hover:shadow-green-200 active:scale-95"
                >
                    ADD
                </button>
            ) : (
                <div className="flex items-center bg-green-600 text-white rounded-xl overflow-hidden shadow-md border border-green-700">
                    <button 
                        onClick={() => onRemove(product)}
                        className="px-3 py-1.5 hover:bg-green-700 transition-colors active:bg-green-800 font-bold"
                    >
                        -
                    </button>
                    <span className="text-sm font-bold px-2 min-w-[24px] text-center bg-green-600">{quantity}</span>
                    <button 
                        onClick={() => onAdd(product)}
                        className="px-3 py-1.5 hover:bg-green-700 transition-colors active:bg-green-800 font-bold"
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
