import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';

function Sculpture({ moving }: { moving: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock, pointer }) => {
    if (!group.current || !moving) return;
    group.current.rotation.y = -0.28 + pointer.x * 0.1;
    group.current.position.y = Math.sin(clock.elapsedTime * 0.65) * 0.035;
  });
  return (
    <group ref={group} rotation={[0.06, -0.28, 0.03]}>
      <mesh position={[0, -0.94, 0]} receiveShadow>
        <cylinderGeometry args={[1.32, 1.44, 0.21, 64]} />
        <meshStandardMaterial color="#51795c" roughness={0.72} />
      </mesh>
      <mesh position={[0.23, -0.1, -0.23]} rotation={[0, 0, -0.32]} castShadow>
        <torusGeometry args={[0.85, 0.22, 24, 64, Math.PI * 1.65]} />
        <meshStandardMaterial color="#b7d8a7" roughness={0.27} metalness={0.15} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          position={[-0.57, -0.69 + i * 0.135, 0.45]}
          rotation={[0, 0, 0.03]}
          castShadow
        >
          <cylinderGeometry args={[0.41, 0.41, 0.12, 64]} />
          <meshStandardMaterial
            color={i % 2 ? '#d0b77d' : '#e2cc98'}
            roughness={0.25}
            metalness={0.64}
          />
        </mesh>
      ))}
      <group position={[0.57, 0.68, 0.28]} rotation={[Math.PI / 2, 0.2, -0.18]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.43, 0.43, 0.13, 64]} />
          <meshStandardMaterial color="#e0cc9b" metalness={0.68} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.32, 0.018, 12, 48]} />
          <meshStandardMaterial color="#f5e7ba" metalness={0.65} roughness={0.22} />
        </mesh>
      </group>
      <mesh position={[0.7, -0.51, 0.47]} rotation={[0.1, -0.3, -0.18]} castShadow>
        <boxGeometry args={[0.58, 0.5, 0.45]} />
        <meshStandardMaterial color="#c7e3b8" roughness={0.36} />
      </mesh>
      <mesh position={[-0.88, 0.67, -0.15]}>
        <sphereGeometry args={[0.105, 20, 20]} />
        <meshStandardMaterial color="#c2dcb4" metalness={0.15} roughness={0.3} />
      </mesh>
    </group>
  );
}
export default function BudgetScene() {
  const reduced = useReducedMotion();
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [supported] = useState(() => {
    try {
      const c = document.createElement('canvas');
      return Boolean(c.getContext('webgl2'));
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={container} className="budget-scene" aria-hidden="true">
      {supported ? (
        <Canvas
          camera={{ position: [0, 1.1, 5.5], fov: 36 }}
          dpr={[1, 1.5]}
          frameloop={visible && !reduced ? 'always' : 'demand'}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={1.2} />
          <directionalLight position={[-3, 5, 4]} intensity={3.2} />
          <directionalLight position={[4, 2, -2]} intensity={1.7} color="#ecfbdc" />
          <Sculpture moving={visible && !reduced} />
        </Canvas>
      ) : (
        <div className="sculpture-fallback">
          <i />
          <i />
          <i />
        </div>
      )}
    </div>
  );
}
