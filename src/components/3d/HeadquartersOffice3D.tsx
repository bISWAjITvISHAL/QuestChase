'use client';

import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import { RainParticles } from './RainParticles';
import { useRouter } from 'next/navigation';
import { soundEngine } from '@/lib/soundEngine';

export type OfficeStation = 'overview' | 'desk' | 'board' | 'cabinet' | 'locker' | 'detective';

interface CameraControllerProps {
  station: OfficeStation;
}

const STATION_CAMERA_TARGETS: Record<
  OfficeStation,
  { pos: [number, number, number]; lookAt: [number, number, number] }
> = {
  overview: { pos: [0, 2.2, 5.2], lookAt: [0, 1.2, 0] },
  desk: { pos: [0, 1.3, 1.8], lookAt: [0, 0.9, -0.4] },
  board: { pos: [0.8, 2.3, 2.0], lookAt: [0.8, 2.1, -2.4] },
  cabinet: { pos: [-2.2, 1.6, 1.8], lookAt: [-2.5, 1.4, -0.5] },
  locker: { pos: [2.5, 1.8, 1.8], lookAt: [2.7, 1.5, -0.5] },
  detective: { pos: [-0.6, 1.8, 2.2], lookAt: [-0.6, 1.6, 0.4] },
};

function CameraController({ station }: CameraControllerProps) {
  const { camera } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 1.2, 0));

  useFrame((state, delta) => {
    const target = STATION_CAMERA_TARGETS[station] || STATION_CAMERA_TARGETS.overview;
    const targetVec = new THREE.Vector3(...target.pos);
    const targetLook = new THREE.Vector3(...target.lookAt);

    // Subtle idle camera breathing
    if (station === 'overview') {
      targetVec.x += Math.sin(state.clock.elapsedTime * 0.4) * 0.08;
      targetVec.y += Math.cos(state.clock.elapsedTime * 0.3) * 0.05;
    }

    camera.position.lerp(targetVec, delta * 2.8);
    currentLookAt.current.lerp(targetLook, delta * 3.2);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

interface HotspotProps {
  position: [number, number, number];
  title: string;
  subtitle: string;
  station: OfficeStation;
  route: string;
  onHover: (station: OfficeStation) => void;
  onLeave: () => void;
}

function Hotspot({
  position,
  title,
  subtitle,
  station,
  route,
  onHover,
  onLeave,
}: HotspotProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  const handleClick = (e?: { stopPropagation?: () => void }) => {
    if (e?.stopPropagation) {
      e.stopPropagation();
    }
    soundEngine.playPaperRustle();
    router.push(route);
  };

  return (
    <group position={position}>
      <mesh
        onPointerOver={() => {
          setHovered(true);
          onHover(station);
        }}
        onPointerOut={() => {
          setHovered(false);
          onLeave();
        }}
        onClick={(e) => handleClick(e)}
        visible={false}
      >
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <Html position={[0, 0.2, 0]} center distanceFactor={7}>
        <button
          onClick={handleClick}
          onMouseEnter={() => {
            setHovered(true);
            onHover(station);
          }}
          onMouseLeave={() => {
            setHovered(false);
            onLeave();
          }}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-sm transition-all duration-300 ${
            hovered
              ? 'bg-charcoal/95 border-2 border-gold shadow-gold scale-110'
              : 'bg-noir/80 border border-gold/40 shadow-noir hover:border-gold'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              hovered ? 'bg-gold animate-ping' : 'bg-crimson hotspot-pulse'
            }`}
          />
          <div className="text-left whitespace-nowrap">
            <div className="text-[11px] font-cinematic font-bold tracking-wider text-parchment group-hover:text-gold">
              {title}
            </div>
            <div className="text-[9px] text-parchment-dim typewriter-text">
              {subtitle}
            </div>
          </div>
        </button>
      </Html>
    </group>
  );
}

// 3D Office Geometry Models
function OfficeRoom() {
  return (
    <group>
      {/* Floor - Dark Herringbone Parquet style */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#120F0D" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Back Wall with Large Window Pane */}
      <mesh position={[0, 2.5, -3.2]} receiveShadow>
        <planeGeometry args={[12, 5]} />
        <meshStandardMaterial color="#0E1012" roughness={0.9} />
      </mesh>

      {/* Window Frame in Center */}
      <group position={[0, 2.6, -3.15]}>
        {/* Window Glass with muted exterior reflection */}
        <mesh>
          <planeGeometry args={[4.2, 2.8]} />
          <meshPhysicalMaterial
            color="#18232C"
            roughness={0.1}
            transmission={0.8}
            thickness={0.5}
            transparent
            opacity={0.85}
          />
        </mesh>
        {/* Window Mullions / Crossbars */}
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[0.08, 2.8, 0.04]} />
          <meshStandardMaterial color="#0A0C0E" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[4.2, 0.08, 0.04]} />
          <meshStandardMaterial color="#0A0C0E" roughness={0.8} />
        </mesh>
      </group>

      {/* Left Wall */}
      <mesh position={[-4, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial color="#111317" roughness={0.9} />
      </mesh>

      {/* Right Wall */}
      <mesh position={[4, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial color="#111317" roughness={0.9} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#08090A" roughness={0.9} />
      </mesh>
    </group>
  );
}

function InvestigationDesk() {
  return (
    <group position={[0, 0, -0.4]}>
      {/* Heavy Mahogany Desk Top */}
      <mesh position={[0, 0.82, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.08, 1.2]} />
        <meshStandardMaterial color="#2B1A12" roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Desk Pedestals / Drawers */}
      <mesh position={[-0.9, 0.4, 0]} castShadow>
        <boxGeometry args={[0.5, 0.8, 1.1]} />
        <meshStandardMaterial color="#1E120C" roughness={0.6} />
      </mesh>
      <mesh position={[0.9, 0.4, 0]} castShadow>
        <boxGeometry args={[0.5, 0.8, 1.1]} />
        <meshStandardMaterial color="#1E120C" roughness={0.6} />
      </mesh>

      {/* Desk Leather Blotter */}
      <mesh position={[0, 0.87, 0.05]} receiveShadow>
        <boxGeometry args={[1.2, 0.01, 0.7]} />
        <meshStandardMaterial color="#15171A" roughness={0.8} />
      </mesh>

      {/* Scattered Case Dossier Papers */}
      <mesh position={[-0.2, 0.88, 0.1]} rotation={[0, 0.1, 0]}>
        <boxGeometry args={[0.35, 0.005, 0.45]} />
        <meshStandardMaterial color="#E7E1D5" roughness={0.9} />
      </mesh>
      <mesh position={[0.25, 0.88, 0.05]} rotation={[0, -0.15, 0]}>
        <boxGeometry args={[0.35, 0.006, 0.45]} />
        <meshStandardMaterial color="#D6CEBF" roughness={0.9} />
      </mesh>

      {/* Vintage Banker's Desk Lamp with Emerald/Brass Hood */}
      <group position={[0.85, 0.87, -0.3]}>
        {/* Brass Base */}
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.09, 0.1, 0.06, 16]} />
          <meshStandardMaterial color="#A88952" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Stem */}
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.35, 16]} />
          <meshStandardMaterial color="#A88952" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Shade */}
        <mesh position={[0, 0.38, 0]} rotation={[0, 0, Math.PI / 10]}>
          <cylinderGeometry args={[0.08, 0.11, 0.22, 16, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#1B4D3E" roughness={0.2} metalness={0.4} />
        </mesh>
        {/* Warm Lamp Light Source */}
        <pointLight position={[0, 0.32, 0]} color="#FFE0A0" intensity={2.2} distance={4.5} decay={2} castShadow />
      </group>

      {/* Brass Magnifying Glass on Desk */}
      <group position={[-0.6, 0.88, 0.2]} rotation={[0, 0.4, 0]}>
        <mesh position={[0, 0, 0]}>
          <ringGeometry args={[0.05, 0.065, 24]} />
          <meshStandardMaterial color="#A88952" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.14, 12]} />
          <meshStandardMaterial color="#1A120B" roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

function EvidenceBoard3D() {
  return (
    <group position={[1.4, 2.2, -3.1]}>
      {/* Wooden Frame */}
      <mesh castShadow>
        <boxGeometry args={[3.2, 1.9, 0.06]} />
        <meshStandardMaterial color="#2B1A12" roughness={0.7} />
      </mesh>
      {/* Cork Board Interior */}
      <mesh position={[0, 0, 0.035]} receiveShadow>
        <planeGeometry args={[3.0, 1.7]} />
        <meshStandardMaterial color="#8A6642" roughness={0.9} />
      </mesh>

      {/* Pinned Photographs / Polaroids */}
      <mesh position={[-0.8, 0.3, 0.05]} rotation={[0, 0, 0.05]}>
        <planeGeometry args={[0.45, 0.55]} />
        <meshStandardMaterial color="#E0D7C6" roughness={0.8} />
      </mesh>
      <mesh position={[0.6, 0.25, 0.05]} rotation={[0, 0, -0.08]}>
        <planeGeometry args={[0.5, 0.6]} />
        <meshStandardMaterial color="#D8CFC0" roughness={0.8} />
      </mesh>
      <mesh position={[-0.1, -0.3, 0.05]} rotation={[0, 0, 0.03]}>
        <planeGeometry args={[0.6, 0.4]} />
        <meshStandardMaterial color="#F2EBD9" roughness={0.8} />
      </mesh>

      {/* Red Yarn Strings Connecting Pins */}
      <group position={[0, 0, 0.06]}>
        <mesh position={[-0.1, 0.28, 0]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[1.4, 0.008, 0.008]} />
          <meshBasicMaterial color="#A82B2B" />
        </mesh>
        <mesh position={[0.25, -0.05, 0]} rotation={[0, 0, 0.75]}>
          <boxGeometry args={[1.0, 0.008, 0.008]} />
          <meshBasicMaterial color="#A82B2B" />
        </mesh>
      </group>
    </group>
  );
}

function FilingCabinet3D() {
  return (
    <group position={[-2.8, 1.2, -1.0]} rotation={[0, Math.PI / 4, 0]}>
      {/* Steel Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.8, 1.8, 0.9]} />
        <meshStandardMaterial color="#1C2024" roughness={0.6} metalness={0.5} />
      </mesh>
      {/* 4 Drawers with Brass Handles */}
      {[0.5, 0.15, -0.2, -0.55].map((y, idx) => (
        <group key={idx} position={[0, y, 0.46]}>
          <mesh>
            <boxGeometry args={[0.72, 0.3, 0.02]} />
            <meshStandardMaterial color="#252A30" roughness={0.5} metalness={0.6} />
          </mesh>
          {/* Brass Handle */}
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[0.18, 0.03, 0.03]} />
            <meshStandardMaterial color="#A88952" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function EquipmentLocker3D() {
  return (
    <group position={[3.2, 1.4, -0.8]} rotation={[0, -Math.PI / 4, 0]}>
      {/* Industrial Locker Mesh */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.9, 2.2, 0.8]} />
        <meshStandardMaterial color="#181B1E" roughness={0.7} metalness={0.4} />
      </mesh>
      {/* Slotted Door Louvers */}
      <mesh position={[0, 0.4, 0.41]}>
        <boxGeometry args={[0.78, 0.6, 0.02]} />
        <meshStandardMaterial color="#2B3036" roughness={0.5} metalness={0.6} />
      </mesh>
      {/* Dial Lock */}
      <mesh position={[-0.28, 0, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
        <meshStandardMaterial color="#A88952" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

function DetectiveFigure() {
  return (
    <group position={[-0.9, 0.85, 0.5]} rotation={[0, 0.35, 0]}>
      {/* Leather Swivel Chair */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.65, 0.8, 0.12]} />
        <meshStandardMaterial color="#16120F" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.1, 0.2]} castShadow>
        <boxGeometry args={[0.65, 0.12, 0.6]} />
        <meshStandardMaterial color="#1A1512" roughness={0.7} />
      </mesh>
      {/* Chair Pedestal */}
      <mesh position={[0, -0.2, 0.2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 12]} />
        <meshStandardMaterial color="#0A0A0A" metalness={0.8} />
      </mesh>

      {/* Detective Silhouette / Trenchcoat draped */}
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.1}>
        <group position={[0, 0.7, 0.1]}>
          {/* Fedora Hat on chair top */}
          <mesh position={[0, 0.25, -0.05]} rotation={[-0.1, 0, 0.05]}>
            <cylinderGeometry args={[0.16, 0.22, 0.1, 16]} />
            <meshStandardMaterial color="#1E1915" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.2, -0.05]}>
            <cylinderGeometry args={[0.3, 0.3, 0.02, 16]} />
            <meshStandardMaterial color="#1E1915" roughness={0.9} />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

export function HeadquartersOffice3D({
  currentStation = 'overview',
  onStationChange,
}: {
  currentStation?: OfficeStation;
  onStationChange?: (station: OfficeStation) => void;
}) {
  const [activeStation, setActiveStation] = useState<OfficeStation>(currentStation);

  const handleHover = (station: OfficeStation) => {
    setActiveStation(station);
    onStationChange?.(station);
  };

  const handleLeave = () => {
    setActiveStation(currentStation);
    onStationChange?.(currentStation);
  };

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0, 2.2, 5.2], fov: 48 }}
        shadows
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <CameraController station={activeStation} />

        {/* Ambient & Noir Key Lighting */}
        <ambientLight intensity={0.25} color="#4A5568" />
        <directionalLight
          position={[5, 8, 4]}
          intensity={0.4}
          color="#A0AEC0"
          castShadow
          shadow-mapSize={1024}
        />

        {/* Rain Streak Particles through Window */}
        <RainParticles count={500} />

        {/* Passing Distant Car Headlights effect */}
        <pointLight position={[-2, 2.6, -4]} color="#7F9CF5" intensity={0.6} distance={6} />

        {/* 3D Scene Geometry */}
        <OfficeRoom />
        <InvestigationDesk />
        <EvidenceBoard3D />
        <FilingCabinet3D />
        <EquipmentLocker3D />
        <DetectiveFigure />

        {/* 3D Interactive Hotspots */}
        <Hotspot
          position={[0, 1.2, 0]}
          title="INVESTIGATION DESK"
          subtitle="DAILY TASK DOCKET"
          station="desk"
          route="/tasks"
          onHover={handleHover}
          onLeave={handleLeave}
        />

        <Hotspot
          position={[1.4, 2.2, -2.8]}
          title="EVIDENCE BOARD"
          subtitle="ACTIVE CASES & RED YARN"
          station="board"
          route="/board/case_001"
          onHover={handleHover}
          onLeave={handleLeave}
        />

        <Hotspot
          position={[-2.4, 1.5, -0.6]}
          title="CASE ARCHIVE"
          subtitle="CLOSED & IN-PROGRESS FILES"
          station="cabinet"
          route="/cases"
          onHover={handleHover}
          onLeave={handleLeave}
        />

        <Hotspot
          position={[2.7, 1.6, -0.5]}
          title="EQUIPMENT LOCKER"
          subtitle="INVESTIGATOR PERKS & GEAR"
          station="locker"
          route="/locker"
          onHover={handleHover}
          onLeave={handleLeave}
        />

        <Hotspot
          position={[-0.9, 1.6, 0.6]}
          title="DETECTIVE DOSSIER"
          subtitle="RANK, LEVEL & ATTRIBUTES"
          station="detective"
          route="/character"
          onHover={handleHover}
          onLeave={handleLeave}
        />
      </Canvas>
    </div>
  );
}
