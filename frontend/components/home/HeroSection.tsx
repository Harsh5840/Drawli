"use client";

import { useEffect, useRef } from 'react';
import { ArrowRight, Zap, Users, Download, Sparkles } from "lucide-react";
import Link from "next/link";

// Animated floating shapes for the background
function FloatingShapes() {
     return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
               {/* Gradient orbs */}
               <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-float" />
               <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-1.5s' }} />
               <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />

               {/* Floating geometric shapes */}
               <svg className="absolute top-20 left-10 w-16 h-16 text-cyan-500/30 animate-float" viewBox="0 0 100 100" style={{ animationDelay: '-0.5s' }}>
                    <rect x="10" y="10" width="80" height="80" rx="8" fill="none" stroke="currentColor" strokeWidth="2" />
               </svg>
               <svg className="absolute top-40 right-20 w-12 h-12 text-blue-500/30 animate-float" viewBox="0 0 100 100" style={{ animationDelay: '-2s' }}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" />
               </svg>
               <svg className="absolute bottom-32 left-1/4 w-10 h-10 text-purple-500/30 animate-float" viewBox="0 0 100 100" style={{ animationDelay: '-1s' }}>
                    <polygon points="50,10 90,90 10,90" fill="none" stroke="currentColor" strokeWidth="2" />
               </svg>
               <svg className="absolute top-1/3 left-2/3 w-8 h-8 text-cyan-400/40 animate-float" viewBox="0 0 100 100" style={{ animationDelay: '-2.5s' }}>
                    <polygon points="50,0 100,50 50,100 0,50" fill="none" stroke="currentColor" strokeWidth="3" />
               </svg>
          </div>
     );
}

// Interactive demo canvas preview
function CanvasPreview() {
     const canvasRef = useRef<HTMLCanvasElement>(null);

     useEffect(() => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Set canvas size
          canvas.width = 500;
          canvas.height = 350;

          // Draw demo shapes
          ctx.strokeStyle = '#00b4ff';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';

          // Rectangle
          ctx.strokeRect(40, 60, 120, 80);

          // Circle
          ctx.beginPath();
          ctx.ellipse(280, 100, 50, 40, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Arrow
          ctx.beginPath();
          ctx.moveTo(160, 100);
          ctx.lineTo(230, 100);
          // Arrowhead
          ctx.moveTo(230, 100);
          ctx.lineTo(220, 92);
          ctx.moveTo(230, 100);
          ctx.lineTo(220, 108);
          ctx.stroke();

          // Diamond
          ctx.beginPath();
          ctx.moveTo(400, 60);
          ctx.lineTo(450, 100);
          ctx.lineTo(400, 140);
          ctx.lineTo(350, 100);
          ctx.closePath();
          ctx.stroke();

          // Freehand path
          ctx.strokeStyle = '#7c3aed';
          ctx.beginPath();
          ctx.moveTo(60, 220);
          ctx.bezierCurveTo(100, 180, 150, 260, 200, 200);
          ctx.bezierCurveTo(250, 140, 300, 280, 350, 220);
          ctx.bezierCurveTo(400, 160, 420, 240, 450, 200);
          ctx.stroke();

          // Text
          ctx.fillStyle = '#ffffff';
          ctx.font = '24px Inter, sans-serif';
          ctx.fillText('Hello World!', 150, 300);

     }, []);

     return (
          <div className="relative group">
               {/* Glow effect */}
               <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl opacity-30 blur-lg group-hover:opacity-50 transition-opacity" />

               {/* Canvas container */}
               <div className="relative glass rounded-2xl overflow-hidden">
                    {/* Window controls */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                         <div className="w-3 h-3 rounded-full bg-red-500" />
                         <div className="w-3 h-3 rounded-full bg-yellow-500" />
                         <div className="w-3 h-3 rounded-full bg-green-500" />
                         <span className="ml-4 text-xs text-gray-400">untitled-canvas.drawli</span>
                    </div>

                    {/* Canvas */}
                    <div className="bg-[#0d1117] p-4">
                         <canvas
                              ref={canvasRef}
                              className="w-full h-auto"
                              style={{ maxWidth: '500px' }}
                         />
                    </div>
               </div>
          </div>
     );
}

// Feature badges
function FeatureBadges() {
     const features = [
          { icon: <Users size={14} />, text: 'Real-time collaboration' },
          { icon: <Download size={14} />, text: 'Export to PNG/SVG' },
          { icon: <Sparkles size={14} />, text: 'Infinite canvas' },
     ];

     return (
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
               {features.map((feature, index) => (
                    <div
                         key={index}
                         className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300"
                    >
                         {feature.icon}
                         {feature.text}
                    </div>
               ))}
          </div>
     );
}

export default function HeroSection() {
     return (
          <section className="relative min-h-screen flex items-center overflow-hidden">
               <FloatingShapes />

               <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                         {/* Left Column - Text */}
                         <div className="text-center lg:text-left space-y-8 animate-fade-in">
                              {/* Badge */}
                              <div className="inline-flex items-center px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 transition-colors">
                                   <Zap className="w-4 h-4 mr-2" />
                                   Free & Open Source
                              </div>

                              {/* Heading */}
                              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                                   Sketch your{' '}
                                   <span className="relative">
                                        <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                                             ideas
                                        </span>
                                        <span className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-purple-500 blur-2xl opacity-30" />
                                   </span>
                                   <br />
                                   <span className="text-gray-400">together</span>
                              </h1>

                              {/* Subtitle */}
                              <p className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                   A virtual collaborative whiteboard where you can sketch diagrams,
                                   wireframes, and ideas with a hand-drawn feel — in real-time.
                              </p>

                              {/* Feature badges */}
                              <FeatureBadges />

                              {/* CTA Buttons */}
                              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                                   <Link
                                        href="/draw"
                                        className="group inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all"
                                   >
                                        Start Drawing
                                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                   </Link>

                                   <a
                                        href="#features"
                                        className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-white/20 text-white font-medium text-lg hover:bg-white/5 transition-colors"
                                   >
                                        Learn More
                                   </a>
                              </div>
                         </div>

                         {/* Right Column - Canvas Preview */}
                         <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
                              <CanvasPreview />
                         </div>
                    </div>
               </div>

               {/* Scroll indicator */}
               <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
                         <div className="w-1 h-2 bg-white/40 rounded-full" />
                    </div>
               </div>
          </section>
     );
}