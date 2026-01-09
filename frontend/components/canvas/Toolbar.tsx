"use client";

import React from 'react';
import {
    MousePointer2,
    Square,
    Circle,
    Minus,
    Type,
    Pencil,
    Eraser,
    Diamond,
    ArrowRight,
    Hand,
    Undo2,
    Redo2,
    Download,
    Share2,
    Trash2,
    Copy,
    Layers,
    Settings,
    ZoomIn,
    ZoomOut,
    Maximize2,
} from 'lucide-react';

export type ToolType =
    | 'select'
    | 'hand'
    | 'rect'
    | 'circle'
    | 'diamond'
    | 'line'
    | 'arrow'
    | 'text'
    | 'pen'
    | 'eraser';

interface ToolbarProps {
    activeTool: ToolType;
    onToolChange: (tool: ToolType) => void;
    strokeColor: string;
    onStrokeColorChange: (color: string) => void;
    fillColor: string;
    onFillColorChange: (color: string) => void;
    strokeWidth: number;
    onStrokeWidthChange: (width: number) => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onExport: () => void;
    onShare: () => void;
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
}

const TOOLS: { id: ToolType; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { id: 'select', icon: <MousePointer2 size={18} />, label: 'Select', shortcut: 'V' },
    { id: 'hand', icon: <Hand size={18} />, label: 'Pan', shortcut: 'H' },
    { id: 'rect', icon: <Square size={18} />, label: 'Rectangle', shortcut: 'R' },
    { id: 'circle', icon: <Circle size={18} />, label: 'Ellipse', shortcut: 'O' },
    { id: 'diamond', icon: <Diamond size={18} />, label: 'Diamond', shortcut: 'D' },
    { id: 'line', icon: <Minus size={18} />, label: 'Line', shortcut: 'L' },
    { id: 'arrow', icon: <ArrowRight size={18} />, label: 'Arrow', shortcut: 'A' },
    { id: 'text', icon: <Type size={18} />, label: 'Text', shortcut: 'T' },
    { id: 'pen', icon: <Pencil size={18} />, label: 'Freehand', shortcut: 'P' },
    { id: 'eraser', icon: <Eraser size={18} />, label: 'Eraser', shortcut: 'E' },
];

const COLOR_PALETTE = [
    '#ffffff', '#868e96', '#fa5252', '#e64980', '#be4bdb',
    '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886',
    '#40c057', '#82c91e', '#fab005', '#fd7e14', '#000000',
];

const STROKE_WIDTHS = [1, 2, 4, 6, 8];

export default function Toolbar({
    activeTool,
    onToolChange,
    strokeColor,
    onStrokeColorChange,
    fillColor,
    onFillColorChange,
    strokeWidth,
    onStrokeWidthChange,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onExport,
    onShare,
    zoom,
    onZoomIn,
    onZoomOut,
    onZoomReset,
}: ToolbarProps) {
    const [showColorPicker, setShowColorPicker] = React.useState(false);
    const [colorTarget, setColorTarget] = React.useState<'stroke' | 'fill'>('stroke');
    const [showStrokeWidth, setShowStrokeWidth] = React.useState(false);

    return (
        <>
            {/* Main Tools - Top Center */}
            <div className="toolbar toolbar-center glass animate-slide-down">
                {TOOLS.map((tool, index) => (
                    <React.Fragment key={tool.id}>
                        {index === 2 && <div className="tool-divider" />}
                        {index === 7 && <div className="tool-divider" />}
                        <button
                            className={`tool-button ${activeTool === tool.id ? 'active' : ''}`}
                            onClick={() => onToolChange(tool.id)}
                            title={`${tool.label} (${tool.shortcut})`}
                        >
                            {tool.icon}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            {/* Style Controls - Left Side */}
            <div className="toolbar toolbar-left glass animate-slide-up" style={{ top: '120px', transform: 'none' }}>
                {/* Stroke Color */}
                <div className="relative">
                    <button
                        className="tool-button"
                        onClick={() => {
                            setColorTarget('stroke');
                            setShowColorPicker(!showColorPicker);
                            setShowStrokeWidth(false);
                        }}
                        title="Stroke Color"
                    >
                        <div
                            className="w-5 h-5 rounded border-2 border-white/30"
                            style={{ backgroundColor: strokeColor }}
                        />
                    </button>
                </div>

                {/* Fill Color */}
                <div className="relative">
                    <button
                        className="tool-button"
                        onClick={() => {
                            setColorTarget('fill');
                            setShowColorPicker(!showColorPicker);
                            setShowStrokeWidth(false);
                        }}
                        title="Fill Color"
                    >
                        <div
                            className="w-5 h-5 rounded"
                            style={{
                                backgroundColor: fillColor === 'transparent' ? 'transparent' : fillColor,
                                border: fillColor === 'transparent' ? '2px dashed rgba(255,255,255,0.3)' : 'none'
                            }}
                        />
                    </button>
                </div>

                <div className="tool-divider-horizontal" />

                {/* Stroke Width */}
                <button
                    className="tool-button"
                    onClick={() => {
                        setShowStrokeWidth(!showStrokeWidth);
                        setShowColorPicker(false);
                    }}
                    title="Stroke Width"
                >
                    <div className="flex items-center justify-center">
                        <div
                            className="bg-white rounded-full"
                            style={{ width: strokeWidth * 2 + 4, height: strokeWidth * 2 + 4, maxWidth: 20, maxHeight: 20 }}
                        />
                    </div>
                </button>
            </div>

            {/* Color Picker Popover */}
            {showColorPicker && (
                <div
                    className="popover glass animate-scale-in"
                    style={{ left: '70px', top: colorTarget === 'stroke' ? '120px' : '160px' }}
                >
                    <div className="color-palette">
                        {COLOR_PALETTE.map((color) => (
                            <button
                                key={color}
                                className={`color-swatch ${(colorTarget === 'stroke' ? strokeColor : fillColor) === color ? 'active' : ''
                                    }`}
                                style={{ backgroundColor: color }}
                                onClick={() => {
                                    if (colorTarget === 'stroke') {
                                        onStrokeColorChange(color);
                                    } else {
                                        onFillColorChange(color);
                                    }
                                    setShowColorPicker(false);
                                }}
                            />
                        ))}
                        {colorTarget === 'fill' && (
                            <button
                                className={`color-swatch ${fillColor === 'transparent' ? 'active' : ''}`}
                                style={{
                                    background: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                                    backgroundSize: '8px 8px',
                                    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                                }}
                                onClick={() => {
                                    onFillColorChange('transparent');
                                    setShowColorPicker(false);
                                }}
                                title="No Fill"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Stroke Width Popover */}
            {showStrokeWidth && (
                <div
                    className="popover glass animate-scale-in"
                    style={{ left: '70px', top: '220px' }}
                >
                    <div className="flex flex-col gap-2 p-1">
                        {STROKE_WIDTHS.map((width) => (
                            <button
                                key={width}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors ${strokeWidth === width ? 'bg-white/10' : ''
                                    }`}
                                onClick={() => {
                                    onStrokeWidthChange(width);
                                    setShowStrokeWidth(false);
                                }}
                            >
                                <div
                                    className="bg-white rounded-full"
                                    style={{ width: width * 2 + 4, height: width * 2 + 4 }}
                                />
                                <span className="text-sm text-gray-300">{width}px</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions - Top Right */}
            <div className="fixed top-4 right-4 flex items-center gap-2 z-100">
                <div className="toolbar glass animate-slide-down" style={{ position: 'static', transform: 'none' }}>
                    <button
                        className={`tool-button ${!canUndo ? 'opacity-40 cursor-not-allowed' : ''}`}
                        onClick={onUndo}
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 size={18} />
                    </button>
                    <button
                        className={`tool-button ${!canRedo ? 'opacity-40 cursor-not-allowed' : ''}`}
                        onClick={onRedo}
                        disabled={!canRedo}
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        <Redo2 size={18} />
                    </button>
                    <div className="tool-divider" />
                    <button className="tool-button" onClick={onExport} title="Export">
                        <Download size={18} />
                    </button>
                    <button className="tool-button" onClick={onShare} title="Share">
                        <Share2 size={18} />
                    </button>
                </div>
            </div>

            {/* Zoom Controls - Bottom Right */}
            <div className="zoom-controls glass animate-slide-up">
                <button className="tool-button" onClick={onZoomOut} title="Zoom Out">
                    <ZoomOut size={16} />
                </button>
                <button
                    className="zoom-level hover:bg-white/10 px-2 py-1 rounded cursor-pointer"
                    onClick={onZoomReset}
                    title="Reset Zoom"
                >
                    {Math.round(zoom * 100)}%
                </button>
                <button className="tool-button" onClick={onZoomIn} title="Zoom In">
                    <ZoomIn size={16} />
                </button>
                <button className="tool-button" onClick={onZoomReset} title="Fit to Screen">
                    <Maximize2 size={16} />
                </button>
            </div>
        </>
    );
}
