import React, { Component, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import type { MotionValue } from 'framer-motion';
import { clamp01, lerp, smooth } from '../../lib/motion';

/* ------------------------------------------------------------------ *
 * The Ledger Sculpture
 * 30 plates = 30 statement rows. Scroll morphs the same object through
 * four layouts: tower -> fanned statements -> sorted columns -> an answer
 * plate that lifts off and links back to the rows it cites.
 * ------------------------------------------------------------------ */

const N = 30;
const EMBER = 19;
const PLATE = { w: 2.3, h: 0.045, d: 1.5 };
const COUNTS = [9, 7, 6, 5, 3];
const TINTS = ['#e6dcc6', '#7d7466', '#c9a66b', '#86ab93', '#b9785a'];
const BASE = new THREE.Color('#2a251f');
const VELLUM = new THREE.Color('#f4ede0');
const EMBER_C = new THREE.Color('#ff6908');

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Which scroll progress (0..1) maps to which layout blend (0..3). */
export function stageFromProgress(p: number) {
  const seg = (a: number, b: number) => smooth(clamp01((p - a) / (b - a)));
  return seg(0.14, 0.3) + seg(0.4, 0.56) + seg(0.66, 0.82);
}

type Layout = { pos: THREE.Vector3; rotY: number; rotZ: number; scale: THREE.Vector3 };

function buildLayouts() {
  const rand = rng(11);
  const order = Array.from({ length: N }, (_, i) => i);
  for (let i = N - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const cols: number[][] = [];
  let cursor = 0;
  COUNTS.forEach((c) => {
    cols.push(order.slice(cursor, cursor + c));
    cursor += c;
  });
  // The answer plate always sits on top of column 1
  for (let c = 0; c < cols.length; c++) {
    const at = cols[c].indexOf(EMBER);
    if (at >= 0) {
      const last = cols[1][cols[1].length - 1];
      cols[c][at] = last;
      cols[1][cols[1].length - 1] = EMBER;
      break;
    }
  }
  const colOf: number[] = [];
  const levelOf: number[] = [];
  cols.forEach((list, c) =>
    list.forEach((plate, level) => {
      colOf[plate] = c;
      levelOf[plate] = level;
    }),
  );
  const cited = [cols[0][4], cols[2][3], cols[3][2]];

  const L: Layout[][] = [[], [], [], []];
  for (let i = 0; i < N; i++) {
    const mid = i - (N - 1) / 2;
    L[0].push({ pos: new THREE.Vector3(0, mid * 0.1, 0), rotY: i * 0.19, rotZ: 0, scale: new THREE.Vector3(1, 1, 1) });
    L[1].push({
      pos: new THREE.Vector3(Math.sin(i * 0.5) * 0.14, mid * 0.145, Math.cos(i * 0.5) * 0.08),
      rotY: i * 0.36,
      rotZ: 0.05 * Math.sin(i * 0.9),
      scale: new THREE.Vector3(1, 1, 1),
    });
    const c = colOf[i];
    const col = new THREE.Vector3((c - 2) * 0.92, -1.0 + levelOf[i] * 0.092, -Math.abs(c - 2) * 0.12);
    const colScale = new THREE.Vector3(0.33, 1.6, 0.5);
    L[2].push({ pos: col, rotY: (c - 2) * -0.06, rotZ: 0, scale: colScale });
    if (i === EMBER) {
      L[3].push({
        pos: new THREE.Vector3(col.x, 1.15, col.z + 0.1),
        rotY: (c - 2) * -0.06 + 0.5,
        rotZ: 0,
        scale: new THREE.Vector3(0.42, 1.8, 0.6),
      });
    } else {
      L[3].push({ pos: col.clone(), rotY: (c - 2) * -0.06, rotZ: 0, scale: colScale.clone() });
    }
  }
  return { L, colOf, cited };
}

function makeLedgerTexture(seed: number) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 336;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, 512, 336);
  const r = rng(seed);
  g.fillStyle = 'rgba(255,255,255,0.9)';
  g.fillRect(34, 26, 96, 5);
  g.fillStyle = 'rgba(255,255,255,0.28)';
  g.fillRect(34, 44, 444, 1);
  for (let row = 0; row < 12; row++) {
    const y = 68 + row * 21;
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.fillRect(34, y, 60 + r() * 150, 3);
    g.fillStyle = 'rgba(255,255,255,0.22)';
    g.fillRect(250, y, 40 + r() * 40, 3);
    const amt = (r() * 480 + 4).toFixed(2).padStart(7, ' ');
    g.font = '500 13px ui-monospace, Menlo, monospace';
    g.textAlign = 'right';
    g.fillStyle = r() > 0.82 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)';
    g.fillText((r() > 0.85 ? '+' : '-') + amt, 478, y + 6);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

const wrapAngle = (a: number) => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};

const CAM = {
  z: [8.4, 9.9, 9.4, 9.2],
  y: [0.35, 0.5, 1.9, 2.3],
  lookY: [0, 0, 0, 0.1],
};
const DESK_X = [1.75, 1.55, 1.75, 1.8];

function piece(arr: number[], s: number) {
  const k = Math.min(arr.length - 2, Math.floor(s));
  return lerp(arr[k], arr[k + 1], s - k);
}

const Scene: React.FC<{ progress: MotionValue<number>; reduced: boolean; onFirstFrame: () => void }> = ({
  progress,
  reduced,
  onFirstFrame,
}) => {
  const { size, camera } = useThree();
  const group = useRef<THREE.Group>(null);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const ring = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const evidence = useRef<THREE.LineSegments>(null);
  const nodes = useRef<(THREE.Mesh | null)[]>([]);
  const pointer = useRef({ x: 0, y: 0 });
  const smoothPtr = useRef({ x: 0, y: 0 });
  const clock = useRef(0);
  const announced = useRef(false);

  const { L, colOf, cited } = useMemo(buildLayouts, []);
  const delay = useMemo(() => {
    const r = rng(5);
    return Array.from({ length: N }, () => r());
  }, []);

  const geo = useMemo(() => new THREE.BoxGeometry(PLATE.w, PLATE.h, PLATE.d), []);
  const edges = useMemo(() => new THREE.EdgesGeometry(geo), [geo]);
  const textures = useMemo(() => [makeLedgerTexture(3), makeLedgerTexture(8), makeLedgerTexture(21)], []);
  const mats = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => {
        const base = new THREE.MeshPhysicalMaterial({
          color: i === EMBER ? EMBER_C : BASE,
          metalness: i === EMBER ? 0.35 : 0.78,
          roughness: i === EMBER ? 0.3 : 0.2,
          clearcoat: 1,
          clearcoatRoughness: 0.1,
          envMapIntensity: 0.85,
        });
        const top = base.clone();
        top.emissiveMap = textures[i % 3];
        top.emissive = new THREE.Color(i === EMBER ? '#ffe3cf' : '#f4ede0');
        top.emissiveIntensity = i === EMBER ? 0.8 : 0.5;
        return { side: base, top };
      }),
    [textures],
  );
  const evGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(18), 3));
    return g;
  }, []);

  useEffect(() => {
    if (reduced || !window.matchMedia('(pointer: fine)').matches) return;
    const move = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [reduced]);

  useEffect(
    () => () => {
      geo.dispose();
      edges.dispose();
      evGeo.dispose();
      textures.forEach((t) => t.dispose());
      mats.forEach((m) => {
        m.side.dispose();
        m.top.dispose();
      });
    },
    [geo, edges, evGeo, textures, mats],
  );

  const tmp = useMemo(() => new THREE.Vector3(), []);
  const tint = useMemo(() => TINTS.map((t) => new THREE.Color(t)), []);
  const work = useMemo(() => new THREE.Color(), []);

  useFrame((state, dt) => {
    clock.current += dt;
    const t = clock.current;
    const p = reduced ? 0 : progress.get();
    const s = Math.min(3, stageFromProgress(p));
    const k = Math.min(2, Math.floor(s));
    const f = s >= 3 ? 1 : s - k;
    const narrow = size.width < 820;

    // Camera dolly + look
    camera.position.set(0, piece(CAM.y, s), piece(CAM.z, s) * (narrow ? 1.18 : 1));
    camera.lookAt(0, piece(CAM.lookY, s), 0);

    // Group placement per viewport + pointer parallax + slow scroll yaw
    smoothPtr.current.x = lerp(smoothPtr.current.x, pointer.current.x, 1 - Math.exp(-dt * 3));
    smoothPtr.current.y = lerp(smoothPtr.current.y, pointer.current.y, 1 - Math.exp(-dt * 3));
    const g = group.current!;
    g.position.x = narrow ? 0 : piece(DESK_X, s);
    g.position.y = narrow ? 1.05 : 0.1;
    const sc = narrow ? 0.68 : 1;
    g.scale.setScalar(sc);
    const idle = reduced ? 0 : Math.sin(t * 0.25) * 0.1;
    g.rotation.y = piece([0, 0.7, 0.12, 0.12], s) + smoothPtr.current.x * 0.22 + idle;
    g.rotation.x = smoothPtr.current.y * 0.06;

    const introBase = reduced ? 10 : t;
    const emberPos = tmp.set(0, 0, 0);

    for (let i = 0; i < N; i++) {
      const m = meshes.current[i];
      if (!m) continue;
      const a = L[k][i];
      const b = L[Math.min(3, k + 1)][i];
      // ripple: each plate eases on its own clock inside the transition
      const spread = k === 0 ? i / N : delay[i];
      const ti = smooth(clamp01((f - spread * 0.45) / 0.55));
      m.position.set(lerp(a.pos.x, b.pos.x, ti), lerp(a.pos.y, b.pos.y, ti), lerp(a.pos.z, b.pos.z, ti));
      m.rotation.y = a.rotY + wrapAngle(b.rotY - a.rotY) * ti;
      m.rotation.z = lerp(a.rotZ, b.rotZ, ti);
      m.scale.set(lerp(a.scale.x, b.scale.x, ti), lerp(a.scale.y, b.scale.y, ti), lerp(a.scale.z, b.scale.z, ti));

      // intro: plates fall into the tower
      const e = smooth(clamp01((introBase - 0.25 - i * 0.03) / 1.3));
      m.position.y += (1 - e) * 5;
      m.rotation.y += (1 - e) * 1.6;

      // sorted-columns tint
      const sortT = s <= 1 ? 0 : smooth(clamp01(((s >= 2 ? 1 : s - 1) - delay[i] * 0.4) / 0.6));
      const mat = mats[i];
      if (i !== EMBER) {
        work.copy(BASE).lerp(tint[colOf[i]], sortT * 0.92);
        mat.side.color.copy(work);
        mat.top.color.copy(work);
        const dim = 1 - sortT * 0.65;
        mat.top.emissiveIntensity = 0.5 * dim + (cited.includes(i) ? (s - 2 > 0 ? s - 2 : 0) * 0.9 : 0);
        mat.top.emissive.copy(cited.includes(i) && s > 2 ? EMBER_C.clone().lerp(VELLUM, 0.3) : VELLUM);
      } else {
        emberPos.copy(m.position);
        mat.top.emissiveIntensity = 0.8 + Math.max(0, s - 2) * 0.9;
      }
    }

    // The answer: ring, light, evidence links
    const answer = s <= 2 ? 0 : smooth(s - 2);
    if (ring.current) {
      ring.current.position.copy(emberPos);
      ring.current.scale.setScalar(Math.max(0.0001, answer));
      ring.current.rotation.z = t * 0.5;
      ring.current.visible = answer > 0.01;
    }
    if (light.current) {
      light.current.position.set(emberPos.x, emberPos.y + 0.6, emberPos.z + 0.5);
      light.current.intensity = 2 + answer * 10;
    }
    if (evidence.current) {
      const pos = evGeo.getAttribute('position') as THREE.BufferAttribute;
      cited.forEach((idx, n) => {
        const m = meshes.current[idx];
        if (!m) return;
        pos.setXYZ(n * 2, emberPos.x, emberPos.y - 0.04, emberPos.z);
        pos.setXYZ(n * 2 + 1, m.position.x, m.position.y + 0.07, m.position.z);
        const node = nodes.current[n];
        if (node) {
          node.position.set(m.position.x, m.position.y + 0.09, m.position.z);
          node.scale.setScalar(Math.max(0.0001, answer));
        }
      });
      pos.needsUpdate = true;
      (evidence.current.material as THREE.LineBasicMaterial).opacity = answer * 0.9;
      evidence.current.visible = answer > 0.01;
    }

    if (!announced.current) {
      announced.current = true;
      onFirstFrame();
    }
  });

  return (
    <>
      <fog attach="fog" args={['#0d0b09', 11, 22]} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[4, 6, 5]} intensity={0.45} color="#fff1dc" />
      <pointLight ref={light} color="#ff6908" distance={6} decay={2} intensity={2} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} color="#ffe9cc" position={[-5, 3.5, 3]} rotation-y={Math.PI / 2.4} scale={[9, 2.2, 1]} />
        <Lightformer form="rect" intensity={0.9} color="#ffffff" position={[0, 7, 0]} rotation-x={Math.PI / 2} scale={[8, 8, 1]} />
        <Lightformer form="rect" intensity={7} color="#ff7a2a" position={[6, 1.2, -3]} rotation-y={-Math.PI / 2.2} scale={[7, 1.1, 1]} />
        <Lightformer form="ring" intensity={2} color="#f4ede0" position={[0, 1, -7]} scale={6} />
      </Environment>

      <group ref={group}>
        {Array.from({ length: N }, (_, i) => (
          <mesh
            key={i}
            ref={(el) => {
              meshes.current[i] = el;
            }}
            geometry={geo}
            material={[mats[i].side, mats[i].side, mats[i].top, mats[i].top, mats[i].side, mats[i].side]}
          >
            <lineSegments geometry={edges}>
              <lineBasicMaterial color={i === EMBER ? '#ffd2b0' : '#f4ede0'} transparent opacity={i === EMBER ? 0.7 : 0.22} />
            </lineSegments>
          </mesh>
        ))}

        <mesh ref={ring} rotation-x={Math.PI / 2} visible={false}>
          <torusGeometry args={[0.95, 0.007, 12, 160]} />
          <meshBasicMaterial color="#ff8a3a" transparent opacity={0.85} />
        </mesh>

        <lineSegments ref={evidence} geometry={evGeo} frustumCulled={false} visible={false}>
          <lineBasicMaterial color="#ff8a3a" transparent opacity={0} />
        </lineSegments>
        {[0, 1, 2].map((n) => (
          <mesh
            key={n}
            ref={(el) => {
              nodes.current[n] = el;
            }}
          >
            <sphereGeometry args={[0.055, 16, 16]} />
            <meshBasicMaterial color="#ffb27a" />
          </mesh>
        ))}

        {[1.7, 2.6, 3.7, 5].map((r, n) => (
          <mesh key={r} rotation-x={-Math.PI / 2} position={[0, -1.95, 0]}>
            <ringGeometry args={[r, r + 0.006, 160]} />
            <meshBasicMaterial color="#f4ede0" transparent opacity={0.16 - n * 0.03} />
          </mesh>
        ))}
      </group>
    </>
  );
};

class Boundary extends Component<{ fallback: React.ReactNode; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Static stand-in when WebGL is unavailable. */
export const SceneFallback: React.FC = () => (
  <div className="absolute inset-0 grid place-items-center md:place-items-center md:pl-[45%]" aria-hidden="true">
    <div className="relative w-56 h-56" style={{ perspective: 900 }}>
      {Array.from({ length: 9 }, (_, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 h-3 rounded-[3px] border border-vellum/25"
          style={{
            top: `${i * 9 + 10}%`,
            transform: `rotateX(62deg) rotateZ(${i * 10}deg)`,
            background: i === 5 ? '#ff6908' : 'linear-gradient(135deg,#3a332b,#1c1814)',
          }}
        />
      ))}
    </div>
  </div>
);

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const LedgerCanvas: React.FC<{ progress: MotionValue<number>; reduced: boolean; onReady?: () => void }> = ({
  progress,
  reduced,
  onReady,
}) => {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [ok] = useState(webglAvailable);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '80px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!ok) return <SceneFallback />;

  return (
    <div ref={wrap} className="absolute inset-0">
      <Boundary fallback={<SceneFallback />}>
        <Canvas
          dpr={[1, 1.75]}
          camera={{ fov: 32, position: [0, 0.35, 8.4], near: 0.1, far: 40 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          frameloop={reduced ? 'demand' : visible ? 'always' : 'never'}
          style={{ pointerEvents: 'none' }}
        >
          <Scene progress={progress} reduced={reduced} onFirstFrame={() => onReady?.()} />
        </Canvas>
      </Boundary>
    </div>
  );
};

export default LedgerCanvas;
