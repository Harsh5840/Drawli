"use client";

import { Github, Twitter, Heart, Globe, Linkedin } from "lucide-react";
import Link from "next/link";

const footerLinks = {
     product: [
          { label: 'Features', href: '#features' },
          { label: 'Draw', href: '/draw' },
          { label: 'Collaborate', href: '/room/new' },
     ],
     resources: [
          { label: 'Documentation', href: '#' },
          { label: 'Blog', href: '#' },
          { label: 'Changelog', href: '#' },
     ],
     company: [
          { label: 'About', href: '#' },
          { label: 'Privacy', href: '#' },
          { label: 'Terms', href: '#' },
     ],
};

const socialLinks = [
     { icon: Github, href: 'https://github.com', label: 'GitHub' },
     { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
     { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
     { icon: Globe, href: '#', label: 'Website' },
];

export function Footer() {
     return (
          <footer className="relative border-t border-white/5 bg-[hsl(220,20%,4%)]">
               <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
                         {/* Brand Column */}
                         <div className="col-span-2">
                              <div className="flex items-center gap-3 mb-4">
                                   <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                             <path d="M12 19l7-7 3 3-7 7-3-3z" />
                                             <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                                        </svg>
                                   </div>
                                   <span className="text-xl font-bold text-white">Drawli</span>
                              </div>
                              <p className="text-gray-400 text-sm max-w-xs leading-relaxed mb-6">
                                   The collaborative whiteboard for teams. Sketch ideas, diagrams,
                                   and wireframes with a hand-drawn feel.
                              </p>

                              {/* Social Links */}
                              <div className="flex items-center gap-3">
                                   {socialLinks.map((social) => (
                                        <a
                                             key={social.label}
                                             href={social.href}
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:bg-white/10 transition-colors"
                                             aria-label={social.label}
                                        >
                                             <social.icon size={18} />
                                        </a>
                                   ))}
                              </div>
                         </div>

                         {/* Links Columns */}
                         <div>
                              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
                              <ul className="space-y-3">
                                   {footerLinks.product.map((link) => (
                                        <li key={link.label}>
                                             <Link
                                                  href={link.href}
                                                  className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                                             >
                                                  {link.label}
                                             </Link>
                                        </li>
                                   ))}
                              </ul>
                         </div>

                         <div>
                              <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
                              <ul className="space-y-3">
                                   {footerLinks.resources.map((link) => (
                                        <li key={link.label}>
                                             <Link
                                                  href={link.href}
                                                  className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                                             >
                                                  {link.label}
                                             </Link>
                                        </li>
                                   ))}
                              </ul>
                         </div>

                         <div>
                              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
                              <ul className="space-y-3">
                                   {footerLinks.company.map((link) => (
                                        <li key={link.label}>
                                             <Link
                                                  href={link.href}
                                                  className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                                             >
                                                  {link.label}
                                             </Link>
                                        </li>
                                   ))}
                              </ul>
                         </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                         <p className="text-sm text-gray-500">
                              © {new Date().getFullYear()} Drawli. All rights reserved.
                         </p>
                         <p className="text-sm text-gray-500 flex items-center">
                              Made with <Heart className="w-4 h-4 mx-1.5 text-red-400" /> by the community
                         </p>
                    </div>
               </div>
          </footer>
     );
}

export default Footer;