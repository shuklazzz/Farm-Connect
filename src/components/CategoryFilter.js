import React from 'react';

const categories = [
  { id: 'all', label: 'All', icon: '🛒' },
  { id: 'Vegetables', label: 'Vegetables', icon: '🥕' },
  { id: 'Fruits', label: 'Fruits', icon: '🍎' },
  { id: 'Spices', label: 'Spices', icon: '🌶️' },
  { id: 'Millets', label: 'Millets', icon: '🌾' },
  { id: 'Cereals and Grains', label: 'Cereals & Grains', icon: '🌽' },
  { id: 'Dry Fruits', label: 'Dry Fruits', icon: '🌰' },
];

const CategoryFilter = ({ activeCategory, onSelect }) => {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border
            ${
              activeCategory === cat.id
                ? 'bg-green-100 border-green-600 text-green-700 shadow-sm'
                : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200'
            }
          `}
        >
          <span className="text-lg">{cat.icon}</span>
          {cat.label}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
