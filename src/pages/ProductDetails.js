import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI, reviewAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const StarIconSolid = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
  </svg>
);
const StarIconOutline = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385c.148.621-.531 1.114-1.095.771L12 18.922a.562.562 0 00-.542 0l-4.925 2.771c-.564.343-1.243-.15-1.095-.771l1.285-5.385a.563.563 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Review Form State
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [reviewError, setReviewError] = useState(null);
    const [reviewSuccess, setReviewSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [hasPurchased, setHasPurchased] = useState(false);

    useEffect(() => {
        const fetchProductAndReviews = async () => {
            try {
                setLoading(true);
                const [productData, reviewData] = await Promise.all([
                    productAPI.getById(id),
                    reviewAPI.getByProduct(id)
                ]);
                setProduct(productData);
                setReviews(reviewData.data || []);
                setHasPurchased(reviewData.hasPurchased || false);
                setError(null);
            } catch (err) {
                setError(err.message || "Failed to load product details");
            } finally {
                setLoading(false);
            }
        };

        fetchProductAndReviews();
    }, [id]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setReviewError("Please log in to leave a review.");
            return;
        }

        try {
            setSubmitting(true);
            setReviewError(null);
            await reviewAPI.create(id, { rating, comment });
            
            // Re-fetch reviews to update the list
            const reviewData = await reviewAPI.getByProduct(id);
            setReviews(reviewData.data || []);
            
            setReviewSuccess(true);
            setComment('');
            setRating(5);
            
            // Hide success message after 3 seconds
            setTimeout(() => setReviewSuccess(false), 3000);
        } catch (err) {
            setReviewError(err.message || "Failed to submit review");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-xl font-bold text-green-600 animate-pulse">Loading details... 🌱</div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <h2 className="text-2xl font-bold text-red-600 mb-4">{error || "Product not found"}</h2>
                <button onClick={() => navigate(-1)} className="text-green-600 hover:underline">Go Back</button>
            </div>
        );
    }

    // Helper to render stars
    const renderStars = (ratingValue, interactive = false, onClick = null) => {
        return (
            <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => {
                    if (interactive) {
                        return (
                            <button key={star} type="button" onClick={() => onClick && onClick(star)} className="focus:outline-none">
                                {star <= ratingValue ? 
                                    <StarIconSolid className="w-6 h-6 text-yellow-400 hover:scale-110 transition-transform" /> : 
                                    <StarIconOutline className="w-6 h-6 text-gray-300 hover:text-yellow-400 hover:scale-110 transition-transform" />
                                }
                            </button>
                        );
                    }
                    return star <= ratingValue ? 
                        <StarIconSolid key={star} className="w-5 h-5 text-yellow-400" /> : 
                        <StarIconOutline key={star} className="w-5 h-5 text-gray-300" />;
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Back Button */}
                <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-gray-600 hover:text-green-600 transition-colors">
                    <span className="mr-2">←</span> Back to Marketplace
                </button>

                {/* Hero Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8 flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="md:w-1/2 h-80 md:h-auto bg-gray-200 relative">
                        {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">No Image Available</div>
                        )}
                        {product.isImperfect && (
                            <div className="absolute top-4 right-4 bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full shadow">
                                Imperfect Produce
                            </div>
                        )}
                    </div>
                    
                    {/* Details */}
                    <div className="p-8 md:w-1/2 flex flex-col justify-center">
                        <div className="uppercase tracking-wide text-sm text-green-600 font-semibold mb-1">{product.category}</div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                        
                        <div className="flex items-center mb-6">
                            {renderStars(Math.round(product.averageRating || 0))}
                            <span className="ml-2 text-sm text-gray-500">
                                {product.averageRating ? product.averageRating.toFixed(1) : 'No'} ratings • {product.numReviews || 0} reviews
                            </span>
                        </div>

                        <div className="text-4xl font-extrabold text-gray-900 mb-6">
                            ₹{product.price} <span className="text-lg text-gray-500 font-normal">/ {product.unit}</span>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4 mb-8">
                            <h3 className="font-semibold text-green-900 mb-1">Farmer Info</h3>
                            <p className="text-green-800 text-sm">Grown by {product.farmerId?.name || "Unknown Farmer"}</p>
                            <p className="text-green-700 text-xs mt-1">Available Quantity: {product.quantity} {product.unit}</p>
                        </div>

                        <button 
                            className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
                            onClick={() => {
                                // For now, just a placeholder. Integration with cart can be added here.
                                alert("Add to Cart functionality goes here!");
                            }}
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">Customer Reviews</h2>
                    
                    {!hasPurchased ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                                <span className="text-3xl">🔒</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Reviews are Locked</h3>
                            <p className="text-gray-500 max-w-md">
                                To ensure authenticity, only verified buyers who have received this product can read and write reviews.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row gap-12">
                            {/* Write a Review Form */}
                            <div className="md:w-1/3">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
                                
                                {reviewError && (
                                    <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                                        {reviewError}
                                    </div>
                                )}
                                
                                {reviewSuccess && (
                                    <div className="mb-4 bg-green-50 text-green-600 text-sm p-3 rounded-lg border border-green-100">
                                        Review submitted successfully!
                                    </div>
                                )}

                                <form onSubmit={handleReviewSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                                        {renderStars(rating, true, setRating)}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                                        <textarea 
                                            required
                                            rows="4"
                                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder="What did you like or dislike about this product?"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                        ></textarea>
                                    </div>
                                    
                                    <button 
                                        type="submit" 
                                        disabled={submitting}
                                        className={`w-full font-bold py-3 rounded-lg transition-colors ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </form>
                            </div>

                            {/* Reviews List */}
                            <div className="md:w-2/3">
                                {reviews.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        No reviews yet. Be the first to review this product!
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {reviews.map((review) => (
                                            <div key={review._id} className="border-b border-gray-100 pb-6 last:border-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                                                            {review.user?.name ? review.user.name.charAt(0).toUpperCase() : 'U'}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">{review.user?.name || 'Anonymous User'}</h4>
                                                            <div className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                    {renderStars(review.rating)}
                                                </div>
                                                <p className="text-gray-700 mt-3">{review.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
            </div>
        </div>
    );
};

export default ProductDetails;
