"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Icosahedron, Sphere, Sparkles, OrbitControls } from "@react-three/drei";
import { useRef, Suspense, useEffect, useState } from "react";
import { useSpring, animated } from "@react-spring/three";

// Animated Component that morphs shape/color
function MorphingObject({ mode }: { mode: 'lost' | 'found' }) {
    const isLost = mode === 'lost';

    // Spring animation for smooth color and scale transition
    const { color, distort, speed } = useSpring({
        color: isLost ? "#a855f7" : "#ec4899", // Purple vs Pink
        distort: isLost ? 0.6 : 0.3, // Spikier when lost, smoother when found
        speed: isLost ? 2 : 1.5, // Faster when lost
        config: { mass: 1, tension: 120, friction: 14 }
    });

    return (
        <Float speed={2} rotationIntensity={isLost ? 2 : 1} floatIntensity={1}>
            {/* We use a Sphere for both but distort it differently to look like an Icosahedron or heavy blob */}
            <animated.mesh scale={isLost ? 1.8 : 2}>
                <sphereGeometry args={[1, 64, 64]} />
                <animated.meshPhysicalMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.2}
                    roughness={0.1}
                    metalness={0.8}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                    wireframe={false}
                />
                {/* Material that distorts the mesh */}
                {/* Note: MeshDistortMaterial is tough to animate with spring directly on props sometimes, 
                     so we use standard material above for base, and maybe a wrapper or just simple state swap if needed.
                     Actually, let's use MeshDistortMaterial directly but animated.
                 */}
                <MeshDistortMaterial
                    color={isLost ? "#a855f7" : "#ec4899"}
                    speed={isLost ? 3 : 1.5}
                    distort={isLost ? 0.6 : 0.2} // High distort = Spiky, Low = Sphere-like
                    radius={1}
                />
            </animated.mesh>
        </Float>
    );
}

export default function SubmitScene({ mode = 'lost' }: { mode?: 'lost' | 'found' }) {
    return (
        <div className="w-full h-full absolute inset-0 z-0 pointer-events-none bg-[#0a0a0a] transition-colors duration-1000">
            {/* Simple radial glow behind the object */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-${mode === 'lost' ? 'purple' : 'pink'}-500/10 blur-[100px] rounded-full transition-colors duration-1000`} />

            <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ preserveDrawingBuffer: true, alpha: true }}>
                <Suspense fallback={null}>
                    <ambientLight intensity={1} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="white" />
                    <pointLight position={[-10, -10, -10]} intensity={2} color={mode === 'lost' ? "#a855f7" : "#ec4899"} />

                    {/* Central Morphing Object */}
                    <group position={[0, -0.5, 0]}>
                        <MorphingObject mode={mode} />
                    </group>

                    {/* Floating Particles */}
                    <Sparkles
                        count={50}
                        scale={12}
                        size={4}
                        speed={0.4}
                        opacity={0.5}
                        color={mode === 'lost' ? "#d8b4fe" : "#fbcfe8"}
                    />
                </Suspense>

                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>
        </div>
    );
}
