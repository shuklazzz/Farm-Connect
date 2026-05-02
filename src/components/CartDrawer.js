import React from 'react';

const CartDrawer = ({ isOpen, onClose, cartItems, onAdd, onRemove, onCheckout, deliveryFee = 0 }) => {
  const itemTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalAmount = itemTotal + deliveryFee;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity backdrop-blur-sm"
            onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 bg-white border-b flex justify-between items-center sticky top-0">
                <h2 className="text-lg font-bold text-gray-800">My Cart ({totalItems} items)</h2>
                <button 
                    onClick={onClose}
                    className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition"
                >
                    ✕
                </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <span className="text-4xl mb-3">🛒</span>
                        <h3 className="text-gray-800 font-bold mb-1">Your cart is empty</h3>
                        <p className="text-gray-500 text-sm">Add items to get started</p>
                    </div>
                ) : (
                    cartItems.map(({ product, quantity }) => (
                        <div key={product._id} className="bg-white p-3 rounded-xl flex items-center justify-between shadow-sm border border-gray-100">
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{product.name}</h4>
                                <p className="text-xs text-gray-500">{product.quantity} {product.unit}</p>
                                <p className="text-sm font-bold text-gray-800 mt-1">₹{product.price * quantity}</p>
                            </div>
                            
                            <div className="flex items-center bg-green-600 text-white rounded-lg overflow-hidden shadow-sm h-8">
                                <button 
                                    onClick={() => onRemove(product)}
                                    className="px-2.5 h-full hover:bg-green-700 transition"
                                >
                                    -
                                </button>
                                <span className="text-xs font-bold px-1 min-w-[24px] text-center">{quantity}</span>
                                <button 
                                    onClick={() => onAdd(product)}
                                    className="px-2.5 h-full hover:bg-green-700 transition"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer Bill & Checkout */}
            {cartItems.length > 0 && (
                <div className="p-4 bg-white border-t space-y-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <h3 className="font-bold text-gray-800 text-sm mb-2">Bill Details</h3>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Item Total</span>
                            <span>₹{itemTotal}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Delivery Fee</span>
                            <span className={deliveryFee === 0 ? "text-green-600 font-bold" : "text-gray-800"}>
                                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                            </span>
                        </div>
                        <div className="border-t border-blue-200 mt-2 pt-2 flex justify-between font-bold text-gray-800">
                            <span>To Pay</span>
                            <span>₹{totalAmount}</span>
                        </div>
                    </div>

                    <button 
                        onClick={onCheckout}
                        className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-[0.98] flex justify-between px-4 items-center"
                    >
                        <div className="flex flex-col items-start px-2">
                            <span className="text-xs font-medium opacity-90">Total</span>
                            <span className="text-lg">₹{totalAmount}</span>
                        </div>
                        <span className="flex items-center gap-2">
                            Proceed to Pay
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </span>
                    </button>
                </div>
            )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
