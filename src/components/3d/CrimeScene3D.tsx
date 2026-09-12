'use client';

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { InvestigationAction } from '@/lib/types';
import { soundEngine } from '@/lib/soundEngine';

interface CrimeScene3DProps {
  actions: InvestigationAction[];
  onSelectAction: (action: InvestigationAction) => void;
}

interface SceneObjectHotspotProps {
  position: [number, number, number];
  action: InvestigationAction;
  onSelect: (action: InvestigationAction) => void;
}

function SceneObjectHotspot({ position, action, onSelect }: SceneObjectHotspotProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => {
          soundEngine.playPaperRustle();
          onSelect(action);
        }}
        visible={false}
      >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <Html position={[0, 0.25, 0]} center distanceFactor={6}>
        <button
          onClick={() => {
            soundEngine.playPaperRustle();
            onSelect(action);
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`group flex items-center gap-2 px-2.5 py-1 rounded transition-all duration-200 ${
            action.isExecuted
              ? 'bg-charcoal/80 border border-steel/40 text-parchment-dim opacity-75'
              : hovered
              ? 'bg-charcoal/95 border-2 border-crimson-bright shadow-crimson scale-105'
              : 'bg-noir/90 border border-crimson/50 hover:border-gold shadow-noir'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              action.isExecuted
                ? 'bg-steel'
                : hovered
                ? 'bg-gold animate-ping'
                : 'bg-crimson hotspot-pulse'
            }`}
          />
          <div className="text-left whitespace-nowrap">
            <div className="text-[10px] font-cinematic font-bold tracking-wider text-parchment">
              {action.sceneObjectName}
            </div>
            <div className="text-[8px] text-parchment-dim typewriter-text">
              {action.isExecuted ? '✓ EXAMINED' : `${action.costGold} GOLD`}
            </div>
          </div>
        </button>
      </Html>
    </group>
  );
}

export function CrimeScene3D({ actions, onSelectAction }: CrimeScene3DProps) {
  // Coordinate mappings for case 001 crime scene items
  const actionPositions: Record<string, [number, number, number]> = {
    act_01: [-0.3, 1.0, 0.1], // Tumbler
    act_02: [0.8, 0.3, 0.2], // Wastebasket
    act_03: [-1.4, 2.1, -1.8], // Wall Safe behind painting
    act_04: [0.2, 0.75, 0.3], // False bottom drawer
    act_05: [-2.6, 1.2, 1.0], // Gate logbook
    act_06: [1.8, 0.9, -0.6], // Doctor bag
    act_07: [2.2, 1.4, 1.2], // Julian Vance
    act_08: [0.1, 0.92, -0.1], // Cyanide fountain pen
  };

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing bg-noir">
      <Canvas
        camera={{ position: [0, 2.5, 4.2], fov: 45 }}
        shadows
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={2}
          maxDistance={7}
          target={[0, 1.2, 0]}
        />

        {/* Ambient & Forensic Key Lighting */}
        <ambientLight intensity={0.2} color="#4A5568" />
        <pointLight position={[0, 3.5, 0]} intensity={1.8} color="#FFE8C0" distance={6} castShadow />
        <pointLight position={[-2, 1.5, 2]} intensity={0.4} color="#7F9CF5" distance={5} />

        {/* Crime Room Environment */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#14100D" roughness={0.8} />
        </mesh>
        <mesh position={[0, 2.5, -2.5]} receiveShadow>
          <planeGeometry args={[10, 5]} />
          <meshStandardMaterial color="#0C0E10" roughness={0.9} />
        </mesh>
        <mesh position={[-3.5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <planeGeometry args={[10, 5]} />
          <meshStandardMaterial color="#0E1114" roughness={0.9} />
        </mesh>

        {/* Victim Study Desk */}
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.2, 0.08, 1.1]} />
            <meshStandardMaterial color="#22140D" roughness={0.6} />
          </mesh>
          <mesh position={[-0.8, 0.4, 0]} castShadow>
            <boxGeometry args={[0.4, 0.8, 1.0]} />
            <meshStandardMaterial color="#180E08" />
          </mesh>
          <mesh position={[0.8, 0.4, 0]} castShadow>
            <boxGeometry args={[0.4, 0.8, 1.0]} />
            <meshStandardMaterial color="#180E08" />
          </mesh>

          {/* Yellow Evidence Marker Tape / Numbers */}
          <mesh position={[-0.5, 0.9, 0.3]} rotation={[0, 0.2, 0]}>
            <boxGeometry args={[0.12, 0.005, 0.12]} />
            <meshStandardMaterial color="#ECC94B" />
          </mesh>
          <mesh position={[0.3, 0.9, -0.2]} rotation={[0, -0.3, 0]}>
            <boxGeometry args={[0.12, 0.005, 0.12]} />
            <meshStandardMaterial color="#ECC94B" />
          </mesh>
        </group>

        {/* Safe on North Wall */}
        <group position={[-1.4, 2.1, -2.45]}>
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.8, 0.1]} />
            <meshStandardMaterial color="#1C2024" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.04, 16]} />
            <meshStandardMaterial color="#A88952" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>

        {/* Hotspots mapped to investigation actions */}
        {actions.map((act) => {
          const pos = actionPositions[act.id] || [0, 1.2, 0];
          return (
            <SceneObjectHotspot
              key={act.id}
              position={pos}
              action={act}
              onSelect={onSelectAction}
            />
          );
        })}
      </Canvas>
    </div>
  );
}
