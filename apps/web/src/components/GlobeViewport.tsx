import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Stars } from "@react-three/drei";
import { memo, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Business, LocationCandidate } from "@geosector/shared";
import { cityLocations, countryLocations } from "../lib/mockData";
import { latLngToVector3 } from "../lib/geo";
import { useGeoStore } from "../store/useGeoStore";

function GlobeMesh({ interacting }: { interacting: boolean }) {
  const globe = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (globe.current && !interacting) {
      globe.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={globe}>
      <mesh>
        <sphereGeometry args={[2, 96, 96]} />
        <meshStandardMaterial color="#071426" metalness={0.15} roughness={0.72} emissive="#06111f" emissiveIntensity={0.48} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.012, 48, 48]} />
        <meshBasicMaterial color="#35d5ff" wireframe transparent opacity={0.075} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.16, 64, 64]} />
        <meshBasicMaterial color="#58e6ff" transparent opacity={0.045} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

function Marker({
  location,
  active,
  onSelect,
}: {
  location: LocationCandidate;
  active: boolean;
  onSelect: (location: LocationCandidate) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const position = useMemo(() => latLngToVector3(location.lat, location.lng, active ? 2.18 : 2.09), [active, location.lat, location.lng]);

  useFrame((state) => {
    if (ref.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3.4) * 0.12;
      ref.current.scale.setScalar(active ? pulse * 1.28 : pulse);
    }
  });

  return (
    <mesh ref={ref} position={position} onClick={(event) => {
      event.stopPropagation();
      onSelect(location);
    }}>
      <sphereGeometry args={[active ? 0.055 : 0.038, 18, 18]} />
      <meshBasicMaterial color={active ? "#6dffca" : "#5fd8ff"} toneMapped={false} />
    </mesh>
  );
}

function categoryColor(category: string) {
  if (category === "cafe") return "#e8d66b";
  if (category === "bar" || category === "pub") return "#78f0a0";
  if (category === "fast_food") return "#ffb066";
  return "#ff7d66";
}

function BusinessPoint({
  business,
  active,
  onSelect,
}: {
  business: Business;
  active: boolean;
  onSelect: (business: Business) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const position = useMemo(() => latLngToVector3(business.lat, business.lng, active ? 2.27 : 2.22), [active, business.lat, business.lng]);
  const color = categoryColor(business.primaryCategory);

  useFrame((state) => {
    if (ref.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.08;
      ref.current.scale.setScalar(active ? pulse * 1.8 : hovered ? 1.4 : 1);
    }
  });

  return (
    <mesh
      ref={ref}
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(business);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[active ? 0.045 : 0.026, 12, 12]} />
      <meshBasicMaterial color={color} toneMapped={false} />
      {(hovered || active) && (
        <Html distanceFactor={9} position={[0.08, 0.08, 0]}>
          <div className="pointer-events-none min-w-36 rounded border border-cyan-200/20 bg-slate-950/90 px-2 py-1 text-xs text-slate-100 shadow-panel-glow">
            <div className="font-semibold">{business.canonicalName}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">{business.primaryCategory}</div>
          </div>
        </Html>
      )}
    </mesh>
  );
}

const Scene = memo(function Scene({ interacting }: { interacting: boolean }) {
  const mode = useGeoStore((state) => state.mode);
  const selectedLocation = useGeoStore((state) => state.selectedLocation);
  const selectLocation = useGeoStore((state) => state.selectLocation);
  const businesses = useGeoStore((state) => state.businesses);
  const selectedBusiness = useGeoStore((state) => state.selectedBusiness);
  const selectBusiness = useGeoStore((state) => state.selectBusiness);
  const locations = mode === "cities" ? cityLocations : countryLocations;

  return (
    <>
      <color attach="background" args={["#03060c"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 2, 6]} intensity={1.7} color="#d8fbff" />
      <pointLight position={[-4, -3, -2]} intensity={1.1} color="#1bffb6" />
      <Stars radius={70} depth={35} count={1500} factor={2.5} saturation={0} fade speed={0.5} />
      <GlobeMesh interacting={interacting} />
      {locations.map((location) => (
        <Marker key={location.id} location={location} active={selectedLocation?.id === location.id} onSelect={selectLocation} />
      ))}
      {businesses.map((business) => (
        <BusinessPoint
          key={business.id}
          business={business}
          active={selectedBusiness?.id === business.id}
          onSelect={selectBusiness}
        />
      ))}
    </>
  );
});

export function GlobeViewport() {
  const [interacting, setInteracting] = useState(false);
  const selectedLocation = useGeoStore((state) => state.selectedLocation);

  return (
    <section className="relative min-h-[520px] overflow-hidden rounded-lg border border-cyan-200/10 bg-black shadow-panel-glow">
      <Canvas camera={{ position: [0, 0, 6.4], fov: 42 }} dpr={[1, 1.7]}>
        <Scene interacting={interacting} />
        <OrbitControls
          enablePan={false}
          minDistance={3.2}
          maxDistance={8}
          rotateSpeed={0.42}
          zoomSpeed={0.55}
          onStart={() => setInteracting(true)}
          onEnd={() => window.setTimeout(() => setInteracting(false), 1800)}
        />
      </Canvas>
      <div className="pointer-events-none absolute left-5 top-5 rounded-md border border-white/10 bg-black/35 px-3 py-2 font-mono text-xs uppercase tracking-[0.2em] text-cyan-100/80 backdrop-blur">
        {interacting ? "manual navigation" : "orbital scan"}
      </div>
      <div className="pointer-events-none absolute right-5 top-5 grid gap-2 rounded-md border border-white/10 bg-black/35 px-3 py-3 text-xs text-slate-300 backdrop-blur">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Layer</div>
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#ff7d66]" />restaurant</div>
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#e8d66b]" />cafe</div>
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#78f0a0]" />bar/pub</div>
      </div>
      {selectedLocation && (
        <div className="absolute bottom-5 left-5 max-w-sm rounded-md border border-emerald-200/20 bg-slate-950/78 p-4 shadow-panel-glow backdrop-blur-xl">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-200/70">Ubicacion seleccionada</div>
          <div className="mt-2 text-lg font-semibold text-slate-50">{selectedLocation.label}</div>
          <div className="mt-1 text-sm text-slate-400">
            {selectedLocation.type} · {selectedLocation.countryCode} · {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
          </div>
        </div>
      )}
    </section>
  );
}
