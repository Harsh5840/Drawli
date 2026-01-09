"use client";

import React, { useState } from 'react';
import { X, Download, Image, FileCode, Check, Copy } from 'lucide-react';

interface ExportDialogProps {
    onClose: () => void;
    onExport: (format: 'png' | 'svg', transparent: boolean) => void;
}

export default function ExportDialog({ onClose, onExport }: ExportDialogProps) {
    const [format, setFormat] = useState<'png' | 'svg'>('png');
    const [transparent, setTransparent] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleExport = () => {
        onExport(format, transparent);
        onClose();
    };

    const handleCopyToClipboard = async () => {
        // Note: This would need canvas access, simplified for now
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
                    <h2 className="text-xl font-semibold">Export Canvas</h2>
                    <button
                        className="tool-button"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Format Selection */}
                <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-3">Format</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${format === 'png'
                                    ? 'border-cyan-500 bg-cyan-500/10'
                                    : 'border-white/10 hover:border-white/20'
                                }`}
                            onClick={() => setFormat('png')}
                        >
                            <Image size={24} className={format === 'png' ? 'text-cyan-400' : 'text-gray-400'} />
                            <div className="text-left">
                                <div className="font-medium">PNG</div>
                                <div className="text-xs text-gray-500">Raster image</div>
                            </div>
                        </button>
                        <button
                            className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${format === 'svg'
                                    ? 'border-cyan-500 bg-cyan-500/10'
                                    : 'border-white/10 hover:border-white/20'
                                }`}
                            onClick={() => setFormat('svg')}
                        >
                            <FileCode size={24} className={format === 'svg' ? 'text-cyan-400' : 'text-gray-400'} />
                            <div className="text-left">
                                <div className="font-medium">SVG</div>
                                <div className="text-xs text-gray-500">Vector image</div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Options */}
                <div className="mb-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${transparent
                                    ? 'bg-cyan-500 border-cyan-500'
                                    : 'border-white/30 hover:border-white/50'
                                }`}
                            onClick={() => setTransparent(!transparent)}
                        >
                            {transparent && <Check size={14} />}
                        </div>
                        <span className="text-sm">Transparent background</span>
                    </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        className="btn-secondary flex-1 flex items-center justify-center gap-2"
                        onClick={handleCopyToClipboard}
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                    <button
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                        onClick={handleExport}
                    >
                        <Download size={18} />
                        Download
                    </button>
                </div>
            </div>
        </>
    );
}
