import React, { useState, useEffect } from 'react';

const NavBar = () => {
  // State for navbar visibility and scroll position
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Handle scroll to show/hide navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY) {
        setIsVisible(false); // Hide on scroll down
      } else {
        setIsVisible(true); // Show on scroll up
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup event listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  return (
    <div
      className={`fixed top-0 right-0 z-50 flex items-center space-x-2 sm:space-x-4 font-bold px-2 sm:px-8 py-2 sm:py-4 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Log in button */}
      <a
        href="/login"
        className="border-2 border-blue-800 text-blue-800 px-2 py-1 sm:px-4 sm:py-2 rounded-full text-lg sm:text-base font-medium hover:bg-white hover:text-blue-900 transition duration-300 ease-in-out"
        aria-label="Log in to your account"
      >
        Log in
      </a>
      {/* Sign up button */}
      <a
        href="/register"
        className="bg-blue-800 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-full text-lg sm:text-base font-medium hover:bg-blue-900 transition duration-300 ease-in-out"
        aria-label="Sign up for a new account"
      >
        Sign up
      </a>
    </div>
  );
};

export default NavBar;