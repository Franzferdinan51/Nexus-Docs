import { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize, Play, Pause, RefreshCw } from 'lucide-react';

interface Entity {
    id: string;
    name: string;
    type: string;
    connections: string[];
    x: number;
    y: number;
    vx: number;
    vy: number;
    width: number;
    height: number;
}

export function EntityGraph({ data }: { data: any[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [entities, setEntities] = useState<Entity[]>([]);
    const [dragging, setDragging] = useState<Entity | null>(null);

    // Viewport State
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [paused, setPaused] = useState(false);

    // Initialize Simulation
    useEffect(() => {
        if (!data || data.length === 0) return;

        const cols = Math.ceil(Math.sqrt(data.length));
        const spacingX = 800 / (cols + 1);
        const spacingY = 600 / (cols + 1);

        const nodes: Entity[] = data.map((d: any, i: number) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            return {
                id: d.id,
                name: d.name,
                type: d.isPolitical ? 'political' : 'standard',
                connections: [],
                x: (col + 1) * spacingX + (Math.random() - 0.5) * 50,
                y: (row + 1) * spacingY + (Math.random() - 0.5) * 50,
                vx: 0,
                vy: 0,
                width: Math.max(d.name.length * 8 + 30, 80),
                height: 36
            };
        });
        setEntities(nodes);
    }, [data]);

    // Physics Loop
    useEffect(() => {
        if (entities.length === 0) return;

        let animationFrameId: number;
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        const update = () => {
            // Physics (Skip if paused)
            if (!paused) {
                entities.forEach(node => {
                    entities.forEach(other => {
                        if (node === other) return;
                        const dx = node.x - other.x;
                        const dy = node.y - other.y;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        const minDist = 250;

                        if (dist < minDist) {
                            const force = 1000 / (dist * dist + 10);
                            node.vx += (dx / dist) * force;
                            node.vy += (dy / dist) * force;
                        }
                    });

                    const cx = (canvasRef.current?.width || 800) / 2;
                    const cy = (canvasRef.current?.height || 600) / 2;
                    node.vx += (cx - node.x) * 0.0005;
                    node.vy += (cy - node.y) * 0.0005;

                    node.vx *= 0.65;
                    node.vy *= 0.65;

                    if (node !== dragging) {
                        node.x += node.vx;
                        node.y += node.vy;
                    }

                    const padding = node.width / 2;
                    const w = canvasRef.current?.width || 800;
                    const h = canvasRef.current?.height || 600;
                    if (node.x < padding) { node.x = padding; node.vx *= -0.5; }
                    if (node.x > w - padding) { node.x = w - padding; node.vx *= -0.5; }
                    if (node.y < padding) { node.y = padding; node.vy *= -0.5; }
                    if (node.y > h - padding) { node.y = h - padding; node.vy *= -0.5; }
                });
            }

            // Draw
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            // Apply Transform
            ctx.save();
            ctx.translate(offset.x, offset.y);
            ctx.scale(scale, scale);

            // Draw Links
            ctx.lineWidth = 2.5 / scale; // Thicker lines
            entities.forEach((node, i) => {
                entities.forEach((other, j) => {
                    if (i <= j) return;
                    const dx = node.x - other.x;
                    const dy = node.y - other.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 300) {
                        const alpha = Math.max(0, (1 - (dist / 300)) * 0.3);
                        ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
                        ctx.beginPath();
                        ctx.moveTo(node.x, node.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.stroke();
                    }
                });
            });

            // Draw Nodes
            entities.forEach(node => {
                ctx.shadowColor = 'rgba(0,0,0,0.3)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;

                ctx.fillStyle = node.type === 'political' ? '#1c1917' : '#1e1b4b';
                ctx.strokeStyle = node.type === 'political' ? '#fb7185' : '#818cf8';

                ctx.beginPath();
                ctx.roundRect(node.x - node.width / 2, node.y - node.height / 2, node.width, node.height, 18);
                ctx.fill();

                ctx.lineWidth = 1.5 / scale;
                ctx.shadowBlur = 0;
                ctx.stroke();

                ctx.fillStyle = '#f8fafc';
                ctx.font = `500 ${11}px Inter, system-ui, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(node.name, node.x, node.y);
            });

            ctx.restore();
            animationFrameId = requestAnimationFrame(update);
        };

        update();
        return () => cancelAnimationFrame(animationFrameId);
    }, [entities, dragging, paused, scale, offset]);

    // Mouse Handling that respects Transform
    const getTransformedPoint = (e: any) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        // Screen Space
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        // World Space
        const wx = (sx - offset.x) / scale;
        const wy = (sy - offset.y) / scale;
        return { x: wx, y: wy, sx, sy };
    };

    const handleMouseDown = (e: any) => {
        const { x, y, sx, sy } = getTransformedPoint(e);

        // Check Node Hit
        const hit = entities.find(n =>
            x > n.x - n.width / 2 && x < n.x + n.width / 2 &&
            y > n.y - n.height / 2 && y < n.y + n.height / 2
        );

        if (hit) {
            setDragging(hit);
        } else {
            // Check Background Hit -> Pan
            setIsPanning(true);
            setPanStart({ x: sx - offset.x, y: sy - offset.y });
        }
    };

    const handleMouseMove = (e: any) => {
        const { x, y, sx, sy } = getTransformedPoint(e);

        if (dragging) {
            dragging.x = x;
            dragging.y = y;
            // Wake up physics if paused while dragging
            if (paused) setPaused(false);
        } else if (isPanning) {
            setOffset({
                x: sx - panStart.x,
                y: sy - panStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setDragging(null);
        setIsPanning(false);
    };

    const handleWheel = (e: any) => {
        // Simple Zoom
        e.preventDefault();
        const delta = -e.deltaY * 0.001;
        const newScale = Math.min(Math.max(0.2, scale + delta), 3);
        setScale(newScale);
    };

    return (
        <div className="relative w-full h-[500px] bg-slate-950/80 rounded-xl border border-slate-800 shadow-2xl backdrop-blur-sm overflow-hidden group">
            <canvas
                ref={canvasRef}
                width={1200}
                height={600}
                className={`w-full h-full ${isPanning ? 'cursor-grabbing' : 'cursor-grab'} active:cursor-grabbing`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            />

            {/* Controls Toolbar */}
            <div className="absolute bottom-4 right-4 flex gap-2">
                <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-1 flex items-center gap-1 shadow-xl backdrop-blur-md opacity-50 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setPaused(!paused)} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors" title={paused ? "Resume Physics" : "Pause Physics"}>
                        {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </button>
                    <div className="w-px h-4 bg-slate-700 mx-1"></div>
                    <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors">
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <button onClick={() => setScale(s => Math.max(0.2, s - 0.2))} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors">
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors" title="Reset View">
                        <Maximize className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Entity Counter / Info */}
            <div className="absolute top-4 left-4 pointer-events-none">
                <div className="bg-slate-900/50 border border-slate-800 rounded px-2 py-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest backdrop-blur-sm">
                    {data.length} Nodes Active
                </div>
            </div>
        </div>
    );
}
