export default function Favicon3() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6EE7B7" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="15" fill="url(#grad)" />
        <path d="M6 16s5-6 10-6 10 6 10 6-5 6-10 6-10-6-10-6z" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="16" cy="16" r="4" fill="white" />
        <circle cx="16" cy="16" r="2" fill="#3B82F6" />
      </svg>
    )
  }