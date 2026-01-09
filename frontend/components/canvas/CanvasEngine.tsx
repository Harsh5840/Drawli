"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Toolbar, { ToolType } from './Toolbar';
import GridBackground from './GridBackground';
import ExportDialog from './ExportDialog';
import ShareDialog from './ShareDialog';
import RemoteCursors, { RemoteCursor } from './RemoteCursors';
import VideoCall from './VideoCall';

export interface Point {
    x: number;
    y: number;
}

export interface ShapeBase {
    id: string;
    strokeColor: string;
    strokeWidth: number;
    fillColor: string;
}

export interface RectShape extends ShapeBase {
    type: 'rect';
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface EllipseShape extends ShapeBase {
    type: 'ellipse';
    cx: number;
    cy: number;
    rx: number;
    ry: number;
}

export interface DiamondShape extends ShapeBase {
    type: 'diamond';
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface LineShape extends ShapeBase {
    type: 'line';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface ArrowShape extends ShapeBase {
    type: 'arrow';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface TextShape extends ShapeBase {
    type: 'text';
    x: number;
    y: number;
    text: string;
    fontSize: number;
}

export interface FreehandShape extends ShapeBase {
    type: 'freehand';
    points: Point[];
}

export type Shape =
    | RectShape
    | EllipseShape
    | DiamondShape
    | LineShape
    | ArrowShape
    | TextShape
    | FreehandShape;

interface CanvasEngineProps {
    roomId?: string;
    socket?: WebSocket;
    userId?: string;
    userName?: string;
}

// Generate user color from ID
const getUserColor = (userId: string) => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#a29bfe', '#fd79a8', '#00b894'];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
};

export default function CanvasEngine({ roomId, socket, userId = 'guest', userName = 'Guest' }: CanvasEngineProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Tool state
    const [activeTool, setActiveTool] = useState<ToolType>('select');
    const [strokeColor, setStrokeColor] = useState('#ffffff');
    const [fillColor, setFillColor] = useState('transparent');
    const [strokeWidth, setStrokeWidth] = useState(2);

    // Canvas state
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
    const [history, setHistory] = useState<Shape[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Viewport state
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState<Point>({ x: 0, y: 0 });

    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<Point | null>(null);
    const [currentShape, setCurrentShape] = useState<Shape | null>(null);
    const [freehandPoints, setFreehandPoints] = useState<Point[]>([]);

    // Dialog state
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [showVideoCall, setShowVideoCall] = useState(true);

    // Text input state
    const [textInput, setTextInput] = useState('');
    const [textPosition, setTextPosition] = useState<Point | null>(null);

    // Collaboration state
    const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map());
    const lastCursorUpdate = useRef<number>(0);

    // Handle incoming WebSocket messages
    useEffect(() => {
        if (!socket) return;

        const handleMessage = async (event: MessageEvent) => {
            try {
                const data = JSON.parse(
                    typeof event.data === 'string' ? event.data : await event.data.text()
                );

                // Handle cursor updates from other users
                if (data.type === 'cursor' && data.cursor && data.cursor.userId !== userId) {
                    setRemoteCursors(prev => {
                        const updated = new Map(prev);
                        updated.set(data.cursor.userId, {
                            userId: data.cursor.userId,
                            userName: data.cursor.userName,
                            x: data.cursor.x,
                            y: data.cursor.y,
                            color: data.cursor.color,
                            lastUpdate: Date.now(),
                        });
                        return updated;
                    });
                }

                // Handle draw operations from other users
                if (data.type === 'draw' && data.drawOp && data.drawOp.id) {
                    const remoteShape = data.drawOp as Shape;
                    setShapes(prev => {
                        // Avoid duplicates
                        if (prev.some(s => s.id === remoteShape.id)) return prev;
                        return [...prev, remoteShape];
                    });
                }
            } catch (error) {
                // Not a JSON message, ignore
            }
        };

        socket.addEventListener('message', handleMessage);
        return () => socket.removeEventListener('message', handleMessage);
    }, [socket, userId]);

    // Clean up stale cursors periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setRemoteCursors(prev => {
                const now = Date.now();
                const updated = new Map(prev);
                updated.forEach((cursor, id) => {
                    if (now - cursor.lastUpdate > 5000) {
                        updated.delete(id);
                    }
                });
                return updated;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Generate unique ID
    const generateId = () => `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Convert screen coordinates to canvas coordinates
    const screenToCanvas = useCallback((screenX: number, screenY: number): Point => {
        return {
            x: (screenX - pan.x) / zoom,
            y: (screenY - pan.y) / zoom,
        };
    }, [pan, zoom]);

    // Save to history
    const saveToHistory = useCallback((newShapes: Shape[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push([...newShapes]);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    // Undo
    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setShapes(history[historyIndex - 1]);
        }
    }, [history, historyIndex]);

    // Redo
    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setShapes(history[historyIndex + 1]);
        }
    }, [history, historyIndex]);

    // Zoom controls
    const handleZoomIn = () => setZoom(Math.min(zoom * 1.2, 5));
    const handleZoomOut = () => setZoom(Math.max(zoom / 1.2, 0.1));
    const handleZoomReset = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    // Handle mouse down
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const canvasPoint = screenToCanvas(screenX, screenY);

        if (activeTool === 'hand') {
            setIsDrawing(true);
            setStartPoint({ x: e.clientX, y: e.clientY });
            return;
        }

        if (activeTool === 'text') {
            setTextPosition(canvasPoint);
            return;
        }

        if (activeTool === 'select') {
            // TODO: Implement selection
            return;
        }

        if (activeTool === 'eraser') {
            // Find and remove shape at point
            const shapeToRemove = shapes.findLast(shape =>
                isPointInShape(canvasPoint, shape)
            );
            if (shapeToRemove) {
                const newShapes = shapes.filter(s => s.id !== shapeToRemove.id);
                setShapes(newShapes);
                saveToHistory(newShapes);
            }
            return;
        }

        setIsDrawing(true);
        setStartPoint(canvasPoint);

        if (activeTool === 'pen') {
            setFreehandPoints([canvasPoint]);
        }
    };

    // Handle mouse move
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !startPoint) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        if (activeTool === 'hand') {
            const dx = e.clientX - startPoint.x;
            const dy = e.clientY - startPoint.y;
            setPan({ x: pan.x + dx, y: pan.y + dy });
            setStartPoint({ x: e.clientX, y: e.clientY });
            return;
        }

        const canvasPoint = screenToCanvas(screenX, screenY);

        if (activeTool === 'pen') {
            setFreehandPoints([...freehandPoints, canvasPoint]);
            setCurrentShape({
                id: 'temp',
                type: 'freehand',
                points: [...freehandPoints, canvasPoint],
                strokeColor,
                strokeWidth,
                fillColor: 'transparent',
            });
            return;
        }

        // Create preview shape
        const baseShape = {
            id: 'temp',
            strokeColor,
            strokeWidth,
            fillColor,
        };

        let previewShape: Shape | null = null;

        switch (activeTool) {
            case 'rect':
                previewShape = {
                    ...baseShape,
                    type: 'rect',
                    x: Math.min(startPoint.x, canvasPoint.x),
                    y: Math.min(startPoint.y, canvasPoint.y),
                    width: Math.abs(canvasPoint.x - startPoint.x),
                    height: Math.abs(canvasPoint.y - startPoint.y),
                };
                break;
            case 'circle':
                previewShape = {
                    ...baseShape,
                    type: 'ellipse',
                    cx: (startPoint.x + canvasPoint.x) / 2,
                    cy: (startPoint.y + canvasPoint.y) / 2,
                    rx: Math.abs(canvasPoint.x - startPoint.x) / 2,
                    ry: Math.abs(canvasPoint.y - startPoint.y) / 2,
                };
                break;
            case 'diamond':
                previewShape = {
                    ...baseShape,
                    type: 'diamond',
                    x: Math.min(startPoint.x, canvasPoint.x),
                    y: Math.min(startPoint.y, canvasPoint.y),
                    width: Math.abs(canvasPoint.x - startPoint.x),
                    height: Math.abs(canvasPoint.y - startPoint.y),
                };
                break;
            case 'line':
                previewShape = {
                    ...baseShape,
                    type: 'line',
                    x1: startPoint.x,
                    y1: startPoint.y,
                    x2: canvasPoint.x,
                    y2: canvasPoint.y,
                };
                break;
            case 'arrow':
                previewShape = {
                    ...baseShape,
                    type: 'arrow',
                    x1: startPoint.x,
                    y1: startPoint.y,
                    x2: canvasPoint.x,
                    y2: canvasPoint.y,
                };
                break;
        }

        setCurrentShape(previewShape);
    };

    // Handle mouse up
    const handleMouseUp = () => {
        if (!isDrawing) return;

        if (currentShape && currentShape.id === 'temp') {
            const newShape = { ...currentShape, id: generateId() };
            const newShapes = [...shapes, newShape];
            setShapes(newShapes);
            saveToHistory(newShapes);

            // Send to WebSocket if connected
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'draw',
                    drawOp: newShape,
                }));
            }
        }

        setIsDrawing(false);
        setStartPoint(null);
        setCurrentShape(null);
        setFreehandPoints([]);
    };

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Tool shortcuts
            if (!e.ctrlKey && !e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'v': setActiveTool('select'); break;
                    case 'h': setActiveTool('hand'); break;
                    case 'r': setActiveTool('rect'); break;
                    case 'o': setActiveTool('circle'); break;
                    case 'd': setActiveTool('diamond'); break;
                    case 'l': setActiveTool('line'); break;
                    case 'a': setActiveTool('arrow'); break;
                    case 't': setActiveTool('text'); break;
                    case 'p': setActiveTool('pen'); break;
                    case 'e': setActiveTool('eraser'); break;
                }
            }

            // Undo/Redo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
            }

            // Delete selected
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedShapeId) {
                    const newShapes = shapes.filter(s => s.id !== selectedShapeId);
                    setShapes(newShapes);
                    saveToHistory(newShapes);
                    setSelectedShapeId(null);
                }
            }

            // Export
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                setShowExportDialog(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo, selectedShapeId, shapes, saveToHistory]);

    // Handle wheel for zoom
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                setZoom(Math.max(0.1, Math.min(5, zoom * delta)));
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            if (container) {
                container.removeEventListener('wheel', handleWheel);
            }
        };
    }, [zoom]);

    // Draw on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply transformations
        ctx.save();
        ctx.translate(pan.x, pan.y);
        ctx.scale(zoom, zoom);

        // Draw all shapes
        [...shapes, currentShape].filter(Boolean).forEach((shape) => {
            if (!shape) return;
            drawShape(ctx, shape);
        });

        ctx.restore();
    }, [shapes, currentShape, pan, zoom]);

    // Draw a single shape
    const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
        ctx.strokeStyle = shape.strokeColor;
        ctx.lineWidth = shape.strokeWidth;
        ctx.fillStyle = shape.fillColor === 'transparent' ? 'transparent' : shape.fillColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        switch (shape.type) {
            case 'rect':
                ctx.beginPath();
                ctx.rect(shape.x, shape.y, shape.width, shape.height);
                if (shape.fillColor !== 'transparent') ctx.fill();
                ctx.stroke();
                break;

            case 'ellipse':
                ctx.beginPath();
                ctx.ellipse(shape.cx, shape.cy, shape.rx, shape.ry, 0, 0, Math.PI * 2);
                if (shape.fillColor !== 'transparent') ctx.fill();
                ctx.stroke();
                break;

            case 'diamond':
                const cx = shape.x + shape.width / 2;
                const cy = shape.y + shape.height / 2;
                ctx.beginPath();
                ctx.moveTo(cx, shape.y);
                ctx.lineTo(shape.x + shape.width, cy);
                ctx.lineTo(cx, shape.y + shape.height);
                ctx.lineTo(shape.x, cy);
                ctx.closePath();
                if (shape.fillColor !== 'transparent') ctx.fill();
                ctx.stroke();
                break;

            case 'line':
                ctx.beginPath();
                ctx.moveTo(shape.x1, shape.y1);
                ctx.lineTo(shape.x2, shape.y2);
                ctx.stroke();
                break;

            case 'arrow':
                // Draw line
                ctx.beginPath();
                ctx.moveTo(shape.x1, shape.y1);
                ctx.lineTo(shape.x2, shape.y2);
                ctx.stroke();

                // Draw arrowhead
                const angle = Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1);
                const headLen = 15;
                ctx.beginPath();
                ctx.moveTo(shape.x2, shape.y2);
                ctx.lineTo(
                    shape.x2 - headLen * Math.cos(angle - Math.PI / 6),
                    shape.y2 - headLen * Math.sin(angle - Math.PI / 6)
                );
                ctx.moveTo(shape.x2, shape.y2);
                ctx.lineTo(
                    shape.x2 - headLen * Math.cos(angle + Math.PI / 6),
                    shape.y2 - headLen * Math.sin(angle + Math.PI / 6)
                );
                ctx.stroke();
                break;

            case 'text':
                ctx.font = `${shape.fontSize}px Inter, sans-serif`;
                ctx.fillStyle = shape.strokeColor;
                ctx.fillText(shape.text, shape.x, shape.y);
                break;

            case 'freehand':
                if (shape.points.length < 2) return;
                ctx.beginPath();
                ctx.moveTo(shape.points[0].x, shape.points[0].y);
                for (let i = 1; i < shape.points.length; i++) {
                    ctx.lineTo(shape.points[i].x, shape.points[i].y);
                }
                ctx.stroke();
                break;
        }
    };

    // Check if point is inside shape (simplified)
    const isPointInShape = (point: Point, shape: Shape): boolean => {
        switch (shape.type) {
            case 'rect':
                return (
                    point.x >= shape.x &&
                    point.x <= shape.x + shape.width &&
                    point.y >= shape.y &&
                    point.y <= shape.y + shape.height
                );
            case 'ellipse':
                const dx = (point.x - shape.cx) / shape.rx;
                const dy = (point.y - shape.cy) / shape.ry;
                return dx * dx + dy * dy <= 1;
            default:
                return false;
        }
    };

    // Export canvas to image
    const handleExport = (format: 'png' | 'svg', transparent: boolean) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Create a temporary canvas for export
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = canvas.width;
        exportCanvas.height = canvas.height;
        const exportCtx = exportCanvas.getContext('2d');
        if (!exportCtx) return;

        // Fill background if not transparent
        if (!transparent) {
            exportCtx.fillStyle = '#0d1117';
            exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        }

        // Draw shapes
        exportCtx.save();
        exportCtx.translate(pan.x, pan.y);
        exportCtx.scale(zoom, zoom);
        shapes.forEach(shape => drawShape(exportCtx, shape));
        exportCtx.restore();

        // Download
        const link = document.createElement('a');
        link.download = `drawli-canvas.${format}`;
        link.href = exportCanvas.toDataURL(`image/${format}`);
        link.click();
    };

    // Get cursor style based on active tool
    const getCursor = () => {
        switch (activeTool) {
            case 'select': return 'default';
            case 'hand': return isDrawing ? 'grabbing' : 'grab';
            case 'text': return 'text';
            case 'eraser': return 'crosshair';
            default: return 'crosshair';
        }
    };

    return (
        <div ref={containerRef} className="canvas-container" style={{ cursor: getCursor() }}>
            <GridBackground zoom={zoom} pan={pan} />

            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={(e) => {
                    handleMouseMove(e);
                    // Send cursor position (throttled to 30fps)
                    if (socket && socket.readyState === WebSocket.OPEN) {
                        const now = Date.now();
                        if (now - lastCursorUpdate.current > 33) {
                            lastCursorUpdate.current = now;
                            const rect = canvasRef.current?.getBoundingClientRect();
                            if (rect) {
                                const canvasPoint = screenToCanvas(
                                    e.clientX - rect.left,
                                    e.clientY - rect.top
                                );
                                socket.send(JSON.stringify({
                                    type: 'cursor',
                                    cursor: {
                                        userId,
                                        userName,
                                        x: canvasPoint.x,
                                        y: canvasPoint.y,
                                        color: getUserColor(userId),
                                    },
                                }));
                            }
                        }
                    }
                }}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="absolute inset-0"
            />

            <Toolbar
                activeTool={activeTool}
                onToolChange={setActiveTool}
                strokeColor={strokeColor}
                onStrokeColorChange={setStrokeColor}
                fillColor={fillColor}
                onFillColorChange={setFillColor}
                strokeWidth={strokeWidth}
                onStrokeWidthChange={setStrokeWidth}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onExport={() => setShowExportDialog(true)}
                onShare={() => setShowShareDialog(true)}
                zoom={zoom}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onZoomReset={handleZoomReset}
            />

            {/* Text Input */}
            {textPosition && activeTool === 'text' && (
                <input
                    type="text"
                    autoFocus
                    className="absolute input"
                    style={{
                        left: textPosition.x * zoom + pan.x,
                        top: textPosition.y * zoom + pan.y - 15,
                        minWidth: 200,
                    }}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && textInput) {
                            const newShape: TextShape = {
                                id: generateId(),
                                type: 'text',
                                x: textPosition.x,
                                y: textPosition.y,
                                text: textInput,
                                fontSize: 24,
                                strokeColor,
                                strokeWidth: 1,
                                fillColor: 'transparent',
                            };
                            const newShapes = [...shapes, newShape];
                            setShapes(newShapes);
                            saveToHistory(newShapes);
                            setTextInput('');
                            setTextPosition(null);
                        }
                        if (e.key === 'Escape') {
                            setTextInput('');
                            setTextPosition(null);
                        }
                    }}
                    onBlur={() => {
                        setTextInput('');
                        setTextPosition(null);
                    }}
                />
            )}

            {/* Dialogs */}
            {showExportDialog && (
                <ExportDialog
                    onClose={() => setShowExportDialog(false)}
                    onExport={handleExport}
                />
            )}

            {showShareDialog && (
                <ShareDialog
                    roomId={roomId}
                    onClose={() => setShowShareDialog(false)}
                />
            )}

            {/* Remote Cursors */}
            <RemoteCursors cursors={remoteCursors} zoom={zoom} pan={pan} />

            {/* Video Call */}
            {roomId && socket && showVideoCall && (
                <VideoCall
                    socket={socket}
                    roomId={roomId}
                    userId={userId}
                    userName={userName}
                    onClose={() => setShowVideoCall(false)}
                />
            )}
        </div>
    );
}
