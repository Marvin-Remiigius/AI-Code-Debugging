import React from 'react';

const Logo = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 128 128"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <path
        stroke="#000"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="8"
        d="M40 80V56a24 24 0 0 1 24-24h0a24 24 0 0 1 24 24v24"
      ></path>
      <path
        stroke="#000"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="8"
        d="M40 80h48v16a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8V80Z"
      ></path>
      <path
        fill="#000"
        d="M57 76a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm18-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
      ></path>
      <path
        stroke="#000"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="8"
        d="M56 92h16"
      ></path>
      <path
        stroke="#000"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="8"
        d="M64 32v-8m0-4a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
      ></path>
    </svg>
  );
};

export default Logo;
