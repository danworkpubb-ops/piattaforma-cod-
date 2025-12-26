import React from 'react';

export const WrenchIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.83-5.83M11.42 15.17l2.472-2.472a3.375 3.375 0 0 0-4.773-4.773L6.23 11.42m5.19 3.75L3 21m0 0h4.5m-4.5 0v-4.5m0 4.5 3.75-3.75M7.5 3.75h4.5M7.5 3.75a2.25 2.25 0 0 1 2.25-2.25h1.5A2.25 2.25 0 0 1 13.5 3.75v4.5" />
  </svg>
);
