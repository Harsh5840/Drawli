"use client";

import { useState, useEffect } from "react";
import { Github, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const navLinks = [
     { label: 'Features', href: '#features' },
     { label: 'Draw', href: '/draw' },
     { label: 'Collaborate', href: '/room/new' },
];

export default function NavBar() {
     const router = useRouter();
     const [isScrolled, setIsScrolled] = useState(false);
     const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

     useEffect(() => {
          const handleScroll = () => {
               setIsScrolled(window.scrollY > 20);
          };
          window.addEventListener('scroll', handleScroll);
          return () => window.removeEventListener('scroll', handleScroll);
     }, []);

     return (
          <>
               <nav
                    className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'py-3' : 'py-5'
                         }`}
               >
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                         <div
                              className={`flex items-center justify-between px-6 py-3 rounded-2xl transition-all duration-300 ${isScrolled
                                        ? 'glass shadow-lg'
                                        : 'bg-transparent'
                                   }`}
                         >
                              {/* Logo */}
                              <Link href="/" className="flex items-center gap-3 group">
                                   <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                             <path d="M12 19l7-7 3 3-7 7-3-3z" />
                                             <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                                        </svg>
                                   </div>
                                   <span className="text-xl font-bold text-white">Drawli</span>
                              </Link>

                              {/* Desktop Navigation */}
                              <div className="hidden md:flex items-center gap-8">
                                   {navLinks.map((link) => (
                                        <Link
                                             key={link.label}
                                             href={link.href}
                                             className="text-sm text-gray-300 hover:text-white transition-colors"
                                        >
                                             {link.label}
                                        </Link>
                                   ))}
                              </div>

                              {/* Actions */}
                              <div className="hidden md:flex items-center gap-3">
                                   <a
                                        href="https://github.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                                   >
                                        <Github size={18} />
                                        <span>GitHub</span>
                                   </a>
                                   <button
                                        onClick={() => router.push('/signin')}
                                        className="px-4 py-2 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                                   >
                                        Sign in
                                   </button>
                                   <button
                                        onClick={() => router.push('/signup')}
                                        className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                                   >
                                        Get Started
                                   </button>
                              </div>

                              {/* Mobile Menu Button */}
                              <button
                                   className="md:hidden p-2 text-gray-300 hover:text-white"
                                   onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                              >
                                   {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                              </button>
                         </div>
                    </div>
               </nav>

               {/* Mobile Menu */}
               {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-40 md:hidden">
                         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                         <div className="absolute top-20 left-4 right-4 glass rounded-2xl p-6 animate-slide-down">
                              <div className="flex flex-col gap-4">
                                   {navLinks.map((link) => (
                                        <Link
                                             key={link.label}
                                             href={link.href}
                                             className="text-lg text-gray-200 hover:text-cyan-400 transition-colors py-2"
                                             onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                             {link.label}
                                        </Link>
                                   ))}
                                   <hr className="border-white/10 my-2" />
                                   <button
                                        onClick={() => {
                                             router.push('/signin');
                                             setIsMobileMenuOpen(false);
                                        }}
                                        className="text-lg text-gray-200 hover:text-cyan-400 transition-colors py-2 text-left"
                                   >
                                        Sign in
                                   </button>
                                   <button
                                        onClick={() => {
                                             router.push('/signup');
                                             setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full py-3 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                                   >
                                        Get Started
                                   </button>
                              </div>
                         </div>
                    </div>
               )}
          </>
     );
}