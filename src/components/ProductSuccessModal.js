import React from 'react';

const ProductSuccessModal = ({ 
  show, 
  onClose, 
  onViewProducts, 
  onAddAnother 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-card">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Listed!</h2>
          <p className="text-gray-600">Your product has been successfully added to the marketplace.</p>
        </div>

        <div className="space-y-3 mt-8">
          <button
            onClick={onViewProducts}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/30"
          >
            ✏️ Edit Product
          </button>
          <button
            onClick={onAddAnother}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Another Product
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-300 text-gray-800 font-bold py-2 rounded-lg hover:bg-gray-400 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductSuccessModal;
