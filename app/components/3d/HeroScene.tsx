"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, ContactShadows, OrbitControls } from "@react-three/drei";
import { useRef, Suspense } from "react";
import { Vector3 } from "three";
import type { Mesh } from "three";

function FloatingShape({ position, color, speed, factor }: { position: [number, number, number], color: string, speed: number, factor: number }) {
    const meshRef = useRef<Mesh>(null!);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        // Gentle rotation with safety check
        if (meshRef.current) {
            meshRef.current.rotation.x = Math.cos(t / 4) / 2;
            meshRef.current.rotation.y = Math.sin(t / 4) / 2;
            meshRef.current.rotation.z = Math.sin(t / 1.5) / 2;
        }
    });

    return (
        <Float speed={speed} rotationIntensity={1} floatIntensity={1} floatingRange={[-0.1, 0.1]}>
            <mesh ref={meshRef} position={new Vector3(...position)}>
                <sphereGeometry args={[1, 32, 32]} />
                <MeshDistortMaterial
                    color={color}
                    speed={speed * 2}
                    distort={factor}
                    radius={1}
                />
            </mesh>
        </Float>
    );
}

export default function HeroScene() {
    return (
        <div className="w-full h-full absolute inset-0 z-0 opacity-80 pointer-events-none bg-gradient-to-br from-purple-500/5 to-pink-500/5 transition-colors duration-1000">
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ preserveDrawingBuffer: true, alpha: true }}>
                <Suspense fallback={null}>
                    {/* Standard Lights replacing Environment to prevent crashes */}
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
                    <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#ec4899" />

                    <group position={[0, -0.5, 0]}>
                        {/* Main Purple Orb */}
                        <FloatingShape position={[0, 0, 0]} color="#a855f7" speed={1.5} factor={0.6} />

                        {/* Secondary Pink Orb */}
                        <FloatingShape position={[-1.5, 1, -1]} color="#ec4899" speed={2} factor={0.4} />

                        {/* Small Accent Orb */}
                        <FloatingShape position={[1.5, -1, -0.5]} color="#6366f1" speed={1.2} factor={0.3} />
                    </group>

                    {/* Shadows to ground the scene */}
                    <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4.5} />
                </Suspense>

                <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 1.5} />
            </Canvas>
        </div>
    );
}
