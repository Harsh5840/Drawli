"use client";

import React from 'react';

export interface RemoteCursor {
    userId: string;
    userName: string;
    x: number;
    y: number;
    color: string;
    lastUpdate: number;
}

interface RemoteCursorsProps {
    cursors: Map<string, RemoteCursor>;
    zoom: number;
    pan: { x: number; y: number };
}

// Cursor SVG path
const CursorIcon = ({ color }: { color: string }) => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
    >
        <path
            d="M5.5 3.21V20.79c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.75a.5.5 0 0 0-.85.46Z"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
        />
    </svg>
);

export default function RemoteCursors({ cursors, zoom, pan }: RemoteCursorsProps) {
    const cursorArray = Array.from(cursors.values());

    // Filter out stale cursors (older than 5 seconds)
    const activeCursors = cursorArray.filter(
        cursor => Date.now() - cursor.lastUpdate < 5000
    );

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
            {activeCursors.map((cursor) => {
                // Transform cursor position based on zoom and pan
                const screenX = cursor.x * zoom + pan.x;
                const screenY = cursor.y * zoom + pan.y;

                return (
                    <div
                        key={cursor.userId}
                        className="remote-cursor"
                        style={{
                            transform: `translate(${screenX}px, ${screenY}px)`,
                        }}
                    >
                        <CursorIcon color={cursor.color} />
                        <div
                            className="cursor-label"
                            style={{ backgroundColor: cursor.color }}
                        >
                            {cursor.userName}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
