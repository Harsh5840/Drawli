"use client";

import React from 'react';

interface GridBackgroundProps {
    zoom: number;
    pan: { x: number; y: number };
    type?: 'dots' | 'lines';
}

export default function GridBackground({ zoom, pan, type = 'dots' }: GridBackgroundProps) {
    const baseSize = 20;
    const size = baseSize * zoom;

    // Calculate offset for infinite scrolling effect
    const offsetX = pan.x % size;
    const offsetY = pan.y % size;

    if (type === 'dots') {
        return (
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                    backgroundSize: `${size}px ${size}px`,
                    backgroundPosition: `${offsetX}px ${offsetY}px`,
                    opacity: Math.min(1, zoom * 0.8),
                }}
            />
        );
    }

    return (
        <div
            className="absolute inset-0 pointer-events-none"
            style={{
                backgroundImage: `
          linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
        `,
                backgroundSize: `${size}px ${size}px`,
                backgroundPosition: `${offsetX}px ${offsetY}px`,
                opacity: Math.min(1, zoom * 0.6),
            }}
        />
    );
}
