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
                        const minDist = 300; // Increased spacing for cards

                        if (dist < minDist) {
                            const force = 1500 / (dist * dist + 10);
                            node.vx += (dx / dist) * force;
                            node.vy += (dy / dist) * force;
                        }
                    });

                    const cx = (canvasRef.current?.width || 800) / 2;
                    const cy = (canvasRef.current?.height || 600) / 2;
                    node.vx += (cx - node.x) * 0.002; // Stronger centering
                    node.vy += (cy - node.y) * 0.002;

                    // "Heavy" Physics - High Friction
                    node.vx *= 0.85;
                    node.vy *= 0.85;

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

            // Grid Background
            ctx.strokeStyle = 'rgba(255,255,255,0.03)';
            ctx.lineWidth = 1;
            const gridSize = 40 * scale;
            const offX = offset.x % gridSize;
            const offY = offset.y % gridSize;
            ctx.beginPath();
            for (let x = offX; x < ctx.canvas.width; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, ctx.canvas.height); }
            for (let y = offY; y < ctx.canvas.height; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(ctx.canvas.width, y); }
            ctx.stroke();


            // Apply Transform
            ctx.save();
            ctx.translate(offset.x, offset.y);
            ctx.scale(scale, scale);

            // Draw Links (Bezier Curves)
            ctx.lineWidth = 2.5 / scale;
            entities.forEach((node, i) => {
                entities.forEach((other, j) => {
                    if (i <= j) return;
                    const dx = node.x - other.x;
                    const dy = node.y - other.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 400) {
                        const alpha = Math.max(0, (1 - (dist / 400)) * 0.5);
                        ctx.strokeStyle = node.type === 'political' || other.type === 'political'
                            ? `rgba(244, 63, 94, ${alpha})` // Pink for high risk
                            : `rgba(99, 102, 241, ${alpha})`; // Indigo for standard

                        ctx.beginPath();
                        ctx.moveTo(node.x, node.y);

                        // Bezier Control Points (S-Curve)
                        const cx1 = node.x + (other.x - node.x) * 0.5;
                        const cy1 = node.y;
                        const cx2 = node.x + (other.x - node.x) * 0.5; // Vertical flow logic preferred, but radial here
                        // For radial graph, simple curve:
                        // Let's effectively make horizontal-ish connections curve more
                        ctx.bezierCurveTo(node.x, node.y + (other.y - node.y) * 0.5, other.x, other.y - (other.y - node.y) * 0.5, other.x, other.y);
                        ctx.stroke();
                    }
                });
            });

            // Draw Nodes (n8n Cards)
            entities.forEach(node => {
                // Shadow
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 15;
                ctx.shadowOffsetY = 4;

                const cardW = node.width;
                const cardH = 40; // Fixed height for header-like look

                // Card Body (Darker)
                ctx.fillStyle = '#0f172a'; // Slate 900
                ctx.beginPath();
                ctx.roundRect(node.x - cardW / 2, node.y - cardH / 2, cardW, cardH, 8);
                ctx.fill();
                ctx.shadowBlur = 0; // Reset shadow

                // Card Header Stripe
                ctx.fillStyle = node.type === 'political' ? '#be123c' : '#4338ca'; // Rose 700 / Indigo 700
                ctx.beginPath();
                // [topLeft, topRight, bottomRight, bottomLeft]
                ctx.roundRect(node.x - cardW / 2, node.y - cardH / 2, 6, cardH, [8, 0, 0, 8]);
                ctx.fill();

                // Border
                ctx.strokeStyle = node === dragging ? '#fff' : '#334155';
                ctx.lineWidth = node === dragging ? 2 / scale : 1 / scale;
                ctx.beginPath();
                ctx.roundRect(node.x - cardW / 2, node.y - cardH / 2, cardW, cardH, 8);
                ctx.stroke();

                // Text
                ctx.fillStyle = '#f8fafc';
                ctx.font = `600 ${10}px Inter, sans-serif`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                const textX = node.x - cardW / 2 + 12;
                ctx.fillText(node.name.length > 20 ? node.name.substring(0, 18) + '..' : node.name, textX, node.y);

                // Little "Port" dots
                ctx.fillStyle = '#64748b';
                ctx.beginPath();
                ctx.arc(node.x + cardW / 2 - 8, node.y, 3, 0, Math.PI * 2);
                ctx.fill();
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
