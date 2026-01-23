"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, Torus, Stars, Sparkles, OrbitControls } from "@react-three/drei";
import { useRef, Suspense } from "react";
import { Group } from "three";
import type { Mesh } from "three";

function CrystalTorus() {
    const meshRef = useRef<Mesh>(null!);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (meshRef.current) {
            meshRef.current.rotation.x = t * 0.2;
            meshRef.current.rotation.y = t * 0.3;
        }
    });

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <Torus ref={meshRef} args={[3, 1, 32, 100]} scale={0.8}>
                {/* Premium Glass Material */}
                <MeshTransmissionMaterial
                    backside
                    samples={4} // Lower for performance
                    thickness={0.5}
                    chromaticAberration={0.5}
                    anisotropy={0.3}
                    distortion={0.5}
                    distortionScale={0.5}
                    temporalDistortion={0.2}
                    color="#e0e7ff"
                    bg="#000000"
                />
            </Torus>
        </Float>
    );
}

export default function AboutScene() {
    return (
        <div className="w-full h-full absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-[#0a0a0a] to-[#1a1a2e]">
            <Canvas camera={{ position: [0, 0, 10], fov: 45 }} gl={{ preserveDrawingBuffer: true, alpha: true }}>
                <Suspense fallback={null}>
                    {/* Atmospheric Lighting */}
                    <ambientLight intensity={1.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#818cf8" />
                    <pointLight position={[-10, -10, -10]} intensity={2} color="#c084fc" />

                    <group position={[0, 0, 0]}>
                        <CrystalTorus />
                    </group>

                    {/* Galaxy Effect */}
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    <Sparkles count={50} scale={10} size={4} speed={0.4} opacity={0.5} color="#c084fc" />
                </Suspense>

                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>
        </div>
    );
}
