"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars, Sphere, MeshDistortMaterial, OrbitControls, Sparkles } from "@react-three/drei";
import { useRef, Suspense } from "react";
import { Vector3, Group } from "three";
import type { Mesh } from "three";

function NetworkNode({ position, color, scale }: { position: [number, number, number], color: string, scale: number }) {
    const meshRef = useRef<Mesh>(null!);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += 0.01;
            meshRef.current.rotation.y += 0.01;
        }
    });

    return (
        <Float speed={2} rotationIntensity={2} floatIntensity={1}>
            <mesh ref={meshRef} position={new Vector3(...position)} scale={scale}>
                <dodecahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color={color} wireframe emissive={color} emissiveIntensity={0.5} />
            </mesh>
        </Float>
    );
}

function TechSphere() {
    const groupRef = useRef<Group>(null!);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (groupRef.current) {
            groupRef.current.rotation.y = t * 0.1; // Slow continuous rotation
        }
    });

    return (
        <group ref={groupRef}>
            {/* Core Sphere */}
            <Sphere args={[1.5, 64, 64]}>
                <MeshDistortMaterial
                    color="#4c1d95"
                    attach="material"
                    distort={0.3}
                    speed={1.5}
                    roughness={0}
                    metalness={1}
                    wireframe
                />
            </Sphere>

            {/* Outer Orbiting Nodes */}
            <NetworkNode position={[2.5, 1, 0]} color="#22d3ee" scale={0.2} />
            <NetworkNode position={[-2, -1.5, 1]} color="#e879f9" scale={0.3} />
            <NetworkNode position={[0, 2.5, -1]} color="#818cf8" scale={0.15} />
            <NetworkNode position={[-2.5, 0.5, -2]} color="#34d399" scale={0.25} />
        </group>
    );
}

export default function DashboardScene() {
    return (
        <div className="w-full h-full absolute inset-0 z-0 opacity-40 pointer-events-none bg-gradient-to-b from-black via-transparent to-transparent">
            <Canvas camera={{ position: [0, 0, 6], fov: 60 }} gl={{ preserveDrawingBuffer: true, alpha: true }}>
                <Suspense fallback={null}>
                    {/* Lighting */}
                    <ambientLight intensity={1} />
                    <pointLight position={[10, 10, 10]} intensity={2} color="#818cf8" />
                    <pointLight position={[-10, -10, -10]} intensity={2} color="#c084fc" />

                    {/* Central Tech Object */}
                    <TechSphere />

                    {/* Background Starfield/Data Dust */}
                    <Sparkles count={80} scale={10} size={2} speed={0.4} opacity={0.5} color="#ffffff" />

                </Suspense>

                {/* Mouse Interaction limits */}
                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>
        </div>
    );
}
