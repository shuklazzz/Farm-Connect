import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

const CheckoutForm = ({ clientSecret, onPaymentSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const payload = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      }
    });

    if (payload.error) {
      setError(`Payment failed: ${payload.error.message}`);
      setProcessing(false);
    } else {
      setError(null);
      setProcessing(false);
      onPaymentSuccess(payload.paymentIntent);
    }
  };

  const CARD_OPTIONS = {
    iconStyle: 'solid',
    style: {
      base: {
        iconColor: '#16a34a',
        color: '#1f2937',
        fontWeight: 500,
        fontFamily: 'Inter, Roboto, Open Sans, sans-serif',
        fontSize: '16px',
        fontSmoothing: 'antialiased',
        ':-webkit-autofill': { color: '#fce883' },
        '::placeholder': { color: '#9ca3af' },
      },
      invalid: {
        iconColor: '#ef4444',
        color: '#ef4444',
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm w-full max-w-md mx-auto">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Secure Checkout</h3>
      <p className="text-sm text-gray-500 mb-6">Complete your payment securely via Stripe.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
            <CardElement options={CARD_OPTIONS} />
        </div>
        
        {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-start gap-2">
                <span>⚠️</span>
                <span>{error}</span>
            </div>
        )}

        <div className="flex gap-3 pt-2">
            <button
                type="button"
                onClick={onCancel}
                disabled={processing}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
                Cancel
            </button>
            <button
                type="submit"
                disabled={!stripe || processing}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-200"
            >
                {processing ? (
                   <>
                     <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                     Processing
                   </>
                ) : (
                    <>Pay Now 🔒</>
                )}
            </button>
        </div>
      </form>
    </div>
  );
};

export default CheckoutForm;
