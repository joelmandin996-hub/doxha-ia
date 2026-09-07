import React from 'react';
import { getCategoryEmoji, getCategoryLabel } from '@/lib/calendarUtils.js';

const CategoryIcon = ({ categorie, showLabel = false, className = '' }) => {
  const emoji = getCategoryEmoji(categorie);
  const label = getCategoryLabel(categorie);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span aria-hidden="true" className="text-base leading-none">{emoji}</span>
      {showLabel && <span className="capitalize">{label}</span>}
    </span>
  );
};

export default CategoryIcon;