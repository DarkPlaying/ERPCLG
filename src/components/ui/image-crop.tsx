import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Upload, ZoomIn, RotateCw, Image as ImageIcon, X, Lock, Move, Hand } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface ImageCropperProps {
    onCropComplete: (blob: Blob) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isAuthorized?: boolean;
    onAuthorize?: () => void;
}

const CANVAS_SIZE = 300;

export const ImageCropper: React.FC<ImageCropperProps> = ({
    onCropComplete,
    open,
    onOpenChange,
    isAuthorized = true,
    onAuthorize
}) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);

    // Drag tracking refs
    const dragStartRef = useRef<{ clientX: number; clientY: number; startCropX: number; startCropY: number } | null>(null);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result?.toString() || null);
                setZoom(1);
                setRotation(0);
                setCrop({ x: 0, y: 0 });
            });
            reader.readAsDataURL(file);
        }
    };

    // Calculate maximum pan bounds based on image aspect ratio and zoom
    const getBounds = useCallback((currentZoom: number) => {
        if (!imageRef.current) return { maxX: 0, maxY: 0, hasSpace: false };
        const imgAspect = imageRef.current.width / imageRef.current.height;
        let baseW = CANVAS_SIZE;
        let baseH = CANVAS_SIZE;

        if (imgAspect > 1) {
            baseH = CANVAS_SIZE;
            baseW = CANVAS_SIZE * imgAspect;
        } else {
            baseW = CANVAS_SIZE;
            baseH = CANVAS_SIZE / imgAspect;
        }

        const scaledW = baseW * currentZoom;
        const scaledH = baseH * currentZoom;

        const maxX = Math.max(0, (scaledW - CANVAS_SIZE) / (2 * currentZoom));
        const maxY = Math.max(0, (scaledH - CANVAS_SIZE) / (2 * currentZoom));

        return {
            maxX,
            maxY,
            hasSpace: maxX > 0.5 || maxY > 0.5,
        };
    }, []);

    const clampCrop = useCallback((x: number, y: number, currentZoom: number) => {
        const { maxX, maxY } = getBounds(currentZoom);
        return {
            x: Math.max(-maxX, Math.min(maxX, x)),
            y: Math.max(-maxY, Math.min(maxY, y)),
        };
    }, [getBounds]);

    // Draw image on canvas
    const drawImage = useCallback(() => {
        if (!canvasRef.current || !imageRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = CANVAS_SIZE;
        canvas.height = CANVAS_SIZE;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background style (slate-900)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();

        // Circular Mask specific for profile pictures
        ctx.beginPath();
        ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, 2 * Math.PI);
        ctx.clip();

        // Transformations
        ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);
        // Pan offset
        ctx.translate(crop.x, crop.y);
        ctx.translate(-CANVAS_SIZE / 2, -CANVAS_SIZE / 2);

        // Draw centered image
        const imgAspect = imageRef.current.width / imageRef.current.height;
        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgAspect > 1) {
            drawHeight = CANVAS_SIZE;
            drawWidth = CANVAS_SIZE * imgAspect;
            offsetX = -(drawWidth - CANVAS_SIZE) / 2;
            offsetY = 0;
        } else {
            drawWidth = CANVAS_SIZE;
            drawHeight = CANVAS_SIZE / imgAspect;
            offsetX = 0;
            offsetY = -(drawHeight - CANVAS_SIZE) / 2;
        }

        ctx.drawImage(imageRef.current, offsetX, offsetY, drawWidth, drawHeight);

        ctx.restore();
    }, [zoom, rotation, crop]);

    // Initial load
    useEffect(() => {
        if (!imageSrc || !canvasRef.current) return;
        const image = new Image();
        image.src = imageSrc;
        image.onload = () => {
            imageRef.current = image;
            setCrop({ x: 0, y: 0 });
            drawImage();
        };
    }, [imageSrc]);

    // Redraw on transform changes
    useEffect(() => {
        if (imageRef.current) {
            // Re-clamp crop if zoom changed
            setCrop(prev => clampCrop(prev.x, prev.y, zoom));
            drawImage();
        }
    }, [zoom, rotation, crop, drawImage, clampCrop]);

    // ----------------------------------------------------
    // Pointer Dragging (Mouse & Touch Hand Gestures)
    // ----------------------------------------------------
    const handlePointerDown = (clientX: number, clientY: number) => {
        const { hasSpace } = getBounds(zoom);
        if (!hasSpace) return;

        dragStartRef.current = {
            clientX,
            clientY,
            startCropX: crop.x,
            startCropY: crop.y,
        };
        setIsDragging(true);
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
        if (!dragStartRef.current || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const scaleFactor = CANVAS_SIZE / rect.width;

        const deltaX = (clientX - dragStartRef.current.clientX) * scaleFactor / zoom;
        const deltaY = (clientY - dragStartRef.current.clientY) * scaleFactor / zoom;

        const newX = dragStartRef.current.startCropX + deltaX;
        const newY = dragStartRef.current.startCropY + deltaY;

        setCrop(clampCrop(newX, newY, zoom));
    };

    const handlePointerUp = () => {
        dragStartRef.current = null;
        setIsDragging(false);
    };

    // Global mouse event listeners for smooth drag outside canvas
    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (dragStartRef.current) {
                handlePointerMove(e.clientX, e.clientY);
            }
        };

        const onMouseUp = () => {
            if (dragStartRef.current) {
                handlePointerUp();
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [zoom, clampCrop]);

    const bounds = getBounds(zoom);

    const handleSave = () => {
        if (!canvasRef.current) return;
        canvasRef.current.toBlob((blob) => {
            if (blob) {
                onCropComplete(blob);
                onOpenChange(false);
                setImageSrc(null);
            }
        }, 'image/png');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md select-none">
                <DialogHeader>
                    <DialogTitle>Upload Profile Picture</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Select and crop your profile image.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-5 py-4">
                    {!imageSrc ? (
                        <div
                            className="w-64 h-64 border-2 border-dashed border-slate-700 rounded-full flex flex-col items-center justify-center cursor-pointer hover:border-slate-500 hover:bg-slate-800/50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-10 w-10 text-slate-400 mb-2" />
                            <span className="text-sm text-slate-400">Click to upload image</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="relative group">
                                <canvas
                                    ref={canvasRef}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handlePointerDown(e.clientX, e.clientY);
                                    }}
                                    onTouchStart={(e) => {
                                        if (e.touches.length > 0) {
                                            handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
                                        }
                                    }}
                                    onTouchMove={(e) => {
                                        if (e.touches.length > 0) {
                                            handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
                                        }
                                    }}
                                    onTouchEnd={handlePointerUp}
                                    className={`w-64 h-64 rounded-full border-2 border-emerald-500 shadow-2xl touch-none ${
                                        bounds.hasSpace
                                            ? isDragging
                                                ? 'cursor-grabbing ring-4 ring-emerald-500/30'
                                                : 'cursor-grab hover:ring-2 hover:ring-emerald-500/40'
                                            : 'cursor-default'
                                    }`}
                                />
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full shadow-lg"
                                    onClick={() => setImageSrc(null)}
                                    title="Remove image"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Move / Hand Drag Indicator */}
                            {bounds.hasSpace ? (
                                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium animate-fadeIn">
                                    <Hand className="h-3.5 w-3.5" />
                                    <span>Drag with hand or cursor to adjust position</span>
                                </div>
                            ) : (
                                <div className="mt-2 text-xs text-slate-500">
                                    Zoom in to enable panning & repositioning
                                </div>
                            )}
                        </div>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={onFileChange}
                        accept="image/*"
                        className="hidden"
                    />

                    {imageSrc && (
                        <div className="w-full space-y-4 px-4 pt-1">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span className="flex items-center gap-1"><ZoomIn className="h-3 w-3" /> Zoom</span>
                                    <span>{Math.round(zoom * 100)}%</span>
                                </div>
                                <Slider
                                    value={[zoom]}
                                    min={1}
                                    max={3}
                                    step={0.05}
                                    onValueChange={(v) => setZoom(v[0])}
                                    className="[&_.range-thumb]:bg-emerald-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span className="flex items-center gap-1"><RotateCw className="h-3 w-3" /> Rotate</span>
                                    <span>{rotation}°</span>
                                </div>
                                <Slider
                                    value={[rotation]}
                                    min={0}
                                    max={360}
                                    step={90}
                                    onValueChange={(v) => setRotation(v[0])}
                                    className="[&_.range-thumb]:bg-emerald-500"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-600">Cancel</Button>
                    {!isAuthorized ? (
                        <Button
                            onClick={onAuthorize}
                            className="bg-blue-600 hover:bg-blue-700 text-white animate-pulse"
                        >
                            <Lock className="h-4 w-4 mr-2" /> Authorize Google Drive
                        </Button>
                    ) : (
                        <Button onClick={handleSave} disabled={!imageSrc} className="bg-emerald-600 hover:bg-emerald-700">
                            Confirm & Upload
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
