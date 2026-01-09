"use client";

import React, { useState } from 'react';
import { X, Link2, Copy, Check, QrCode, Users } from 'lucide-react';

interface ShareDialogProps {
    roomId?: string;
    onClose: () => void;
}

export default function ShareDialog({ roomId, onClose }: ShareDialogProps) {
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);

    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/room/${roomId || 'new'}`
        : '';

    const handleCopy = async () => {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            {/* Overlay */}
            <div className="dialog-overlay animate-fade-in" onClick={onClose} />

            {/* Dialog */}
            <div className="dialog-content glass animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <Users size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Share Canvas</h2>
                            <p className="text-sm text-gray-400">Invite others to collaborate</p>
                        </div>
                    </div>
                    <button className="tool-button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Share Link */}
                <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-2">Share link</label>
                    <div className="flex gap-2">
                        <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-black/30 rounded-xl border border-white/10">
                            <Link2 size={16} className="text-gray-400 flex-shrink-0" />
                            <input
                                type="text"
                                value={shareUrl}
                                readOnly
                                className="flex-1 bg-transparent text-sm text-gray-300 outline-none"
                            />
                        </div>
                        <button
                            className={`px-4 rounded-xl font-medium transition-all ${copied
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-white/10 hover:bg-white/20 border border-white/10'
                                }`}
                            onClick={handleCopy}
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                    </div>
                </div>

                {/* QR Code Toggle */}
                <div className="mb-6">
                    <button
                        className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                        onClick={() => setShowQR(!showQR)}
                    >
                        <QrCode size={16} />
                        {showQR ? 'Hide QR Code' : 'Show QR Code'}
                    </button>

                    {showQR && (
                        <div className="mt-4 flex justify-center">
                            <div className="w-48 h-48 bg-white rounded-xl p-4 flex items-center justify-center">
                                {/* Placeholder for QR code - in production, use a QR library */}
                                <div className="text-black text-xs text-center">
                                    <QrCode size={100} className="mx-auto mb-2 text-gray-800" />
                                    <span className="text-gray-500">QR Code</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Collaboration Info */}
                <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <p className="text-sm text-cyan-200">
                        <strong>Real-time collaboration:</strong> Anyone with this link can join and draw on the canvas. Changes sync instantly.
                    </p>
                </div>
            </div>
        </>
    );
}
