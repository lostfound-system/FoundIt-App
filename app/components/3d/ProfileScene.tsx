"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Stars, Sparkles, OrbitControls } from "@react-three/drei";
import { useRef, Suspense } from "react";
import { Group, Vector3 } from "three";
import type { Mesh } from "three";

function FluidBlob({ position, color, speed, distort, scale }: { position: [number, number, number], color: string, speed: number, distort: number, scale: number }) {
    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <Sphere args={[1, 64, 64]} position={position} scale={scale}>
                <MeshDistortMaterial
                    color={color}
                    speed={speed}
                    distort={distort}
                    radius={1}
                    roughness={0.2}
                    metalness={0.8}
                />
            </Sphere>
        </Float>
    );
}

export default function ProfileScene() {
    return (
        <div className="w-full h-full absolute inset-0 z-0 pointer-events-none bg-[#050505]">
            <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ preserveDrawingBuffer: true, alpha: true }}>
                <Suspense fallback={null}>
                    {/* Soft Cinematic Lighting */}
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[10, 10, 5]} intensity={1.5} color="#c084fc" /> {/* Purple */}
                    <directionalLight position={[-10, -10, -5]} intensity={1.5} color="#22d3ee" /> {/* Cyan */}

                    <group position={[0, 0, 0]}>
                        {/* Main Fluid Shape */}
                        <FluidBlob position={[2, 0, -2]} color="#a855f7" speed={2} distort={0.5} scale={1.5} />

                        {/* Secondary Shapes */}
                        <FluidBlob position={[-2.5, 1, -1]} color="#ec4899" speed={1.5} distort={0.4} scale={1} />
                        <FluidBlob position={[0, -2, -3]} color="#3b82f6" speed={1.8} distort={0.6} scale={1.2} />
                    </group>

                    {/* Subtle Background Elements */}
                    <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={0.5} />
                    <Sparkles count={30} scale={10} size={3} speed={0.2} opacity={0.3} color="#ffffff" />
                </Suspense>

                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
            </Canvas>
        </div>
    );
}
