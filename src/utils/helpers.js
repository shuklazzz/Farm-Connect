export const getIcon = (category) => {
  const icons = {
    Vegetables: '🥕',
    Fruits: '🍎',
    Millets: '🌾',
    'Dry Fruits': '🌰',
    'Cereals and Grains': '🌽',
    'Spices' : '🌶️'
  };
  return icons[category] || '📦';
};
