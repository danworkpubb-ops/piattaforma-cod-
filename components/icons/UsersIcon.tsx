import React from 'react';

export const UsersIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0-12 0m12 0a9.094 9.094 0 0 1-12 0m12 0v-1.04a4.52 4.52 0 0 0-1.822-3.621 4.52 4.52 0 0 0-6.356 0A4.52 4.52 0 0 0 6 17.68v1.04m12 0a9.094 9.094 0 0 0-12 0" />
  </svg>
);