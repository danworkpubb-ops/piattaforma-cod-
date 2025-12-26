import React from 'react';

export const EyeIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639l4.418-5.511a1.012 1.012 0 0 1 1.626.162l.745.931a1.012 1.012 0 0 0 1.626-.162l4.418-5.511a1.012 1.012 0 0 1 1.626.162l.745.931a1.012 1.012 0 0 0 1.626-.162l4.418-5.511a1.012 1.012 0 0 1 0 .639l-4.418 5.511a1.012 1.012 0 0 1-1.626-.162l-.745-.931a1.012 1.012 0 0 0-1.626.162l-4.418 5.511a1.012 1.012 0 0 1-1.626-.162l-.745-.931a1.012 1.012 0 0 0-1.626.162l-4.418 5.511Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);
