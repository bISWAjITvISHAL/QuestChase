'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function RainParticles({ count = 600 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16; // X
      pos[i * 3 + 1] = Math.random() * 12 + 2; // Y
      pos[i * 3 + 2] = -4.5 + (Math.random() - 0.5) * 2; // Z (behind window)
      vel[i] = 0.15 + Math.random() * 0.12;
    }
    return [pos, vel];
  }, [count]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= velocities[i];
      // Slight diagonal wind
      arr[i * 3] -= 0.02;

      if (arr[i * 3 + 1] < -2) {
        arr[i * 3 + 1] = 12;
        arr[i * 3] = (Math.random() - 0.5) * 16;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#7B828C"
        size={0.06}
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
