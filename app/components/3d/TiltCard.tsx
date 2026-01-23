"use client";

import { useRef, useState, MouseEvent } from "react";

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    glowColor?: string; // e.g., "purple", "pink"
}

export default function TiltCard({ children, className = "", glowColor = "purple" }: TiltCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    const [glow, setGlow] = useState("opacity-0");

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        // Max rotation: 20 degrees
        const xRot = yPct * -20; // Inverse relationship for X tilt
        const yRot = xPct * 20;

        setTransform(`perspective(1000px) rotateX(${xRot}deg) rotateY(${yRot}deg) scale3d(1.05, 1.05, 1.05)`);

        // Dynamic Glow position
        const glowX = (mouseX / width) * 100;
        const glowY = (mouseY / height) * 100;

        // This could be passed to CSS variable for performance, but simple state is okay for single card
        // Actually, let's just simple hover glow.
        setGlow("opacity-100");
    };

    const handleMouseLeave = () => {
        setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
        setGlow("opacity-0");
    };

    return (
        <div
            ref={cardRef}
            className={`transition-all duration-200 ease-out transform-gpu transform-style-3d ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ transform }}
        >
            {/* Glossy Reflection Gradient */}
            <div
                className={`absolute inset-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none z-10 rounded-3xl transition-opacity duration-300 ${glow}`}
            />
            {glowColor === 'purple' && (
                <div className={`absolute -inset-0.5 bg-purple-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500 -z-10 ${glow}`} />
            )}
            {glowColor === 'pink' && (
                <div className={`absolute -inset-0.5 bg-pink-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500 -z-10 ${glow}`} />
            )}

            {/* Content */}
            {children}
        </div>
    );
}
