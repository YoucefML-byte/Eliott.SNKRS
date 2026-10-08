"use client";

import { useEffect, useRef, useState } from "react";

import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

// Le monogramme Eliott SNKRS en volume (three.js). Il tourne sur lui-même au
// rythme du défilement : `progress` (0 → 1) correspond à un tour complet.
// Tracés repris de LogoMark (viewBox 64) : trois barres vertes pleines et le
// contour du « S », extrudés. three.js n'est chargé qu'à l'affichage ; en
// attendant (ou sans WebGL) le logo plat reste visible.

type Pt = [number, number];

// barres vertes (parallélogrammes)
const BARS: Pt[][] = [
  [[2, 14], [32, 9], [32, 19], [2, 24]],
  [[2, 30], [32, 25], [32, 35], [2, 40]],
  [[2, 46], [32, 41], [32, 51], [2, 56]],
];
// contour du « S » : traits ouverts, appuyés sur le bord droit des barres
const STROKES: Pt[][] = [
  [[32, 9], [62, 4], [62, 14], [32, 19]],
  [[32, 25], [62, 20], [62, 44], [32, 51]],
  [[32, 35], [54, 31], [54, 40], [32, 44]],
];
const STROKE_WIDTH = 1.5;
const DEPTH = 6;
/** pose de départ (et d'arrivée, un tour plus loin) : de trois quarts */
const START_ANGLE = -0.45;

/** repère du logo (y vers le bas, centré en 32,30) → repère 3D (y vers le haut) */
const toScene = ([x, y]: Pt): Pt => [x - 32, 30 - y];

/** contour fermé d'un trait d'épaisseur w le long d'une ligne brisée (angles en onglet) */
function strokeOutline(points: Pt[], w: number): Pt[] {
  const half = w / 2;
  const normal = (a: Pt, b: Pt): Pt => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    return [-dy / len, dx / len];
  };
  const left: Pt[] = [];
  const right: Pt[] = [];
  points.forEach((p, i) => {
    const n1 = i > 0 ? normal(points[i - 1], p) : null;
    const n2 = i < points.length - 1 ? normal(p, points[i + 1]) : null;
    let n: Pt;
    let scale = half;
    if (n1 && n2) {
      const sum: Pt = [n1[0] + n2[0], n1[1] + n2[1]];
      const len = Math.hypot(sum[0], sum[1]);
      n = [sum[0] / len, sum[1] / len];
      scale = Math.min(half / (n[0] * n1[0] + n[1] * n1[1]), half * 3);
    } else {
      n = (n1 ?? n2)!;
    }
    left.push([p[0] + n[0] * scale, p[1] + n[1] * scale]);
    right.push([p[0] - n[0] * scale, p[1] - n[1] * scale]);
  });
  return [...left, ...right.reverse()];
}

export function Logo3D({ className, progress }: { className?: string; progress: () => number }) {
  const box = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (disposed) return;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      } catch {
        return; // pas de WebGL : le logo plat reste affiché
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      // tonalité neutre : garde le vert fluo du logo (ACES le délave)
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.className = "absolute inset-0 size-full";
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envMap;

      const camera = new THREE.PerspectiveCamera(28, 1, 1, 1000);
      camera.position.set(0, 0, 150);

      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(40, 60, 80);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xbfffd6, 0.9);
      rim.position.set(-60, -20, -40);
      scene.add(rim);

      const extrude = (outline: Pt[]) => {
        const shape = new THREE.Shape(outline.map(toScene).map(([x, y]) => new THREE.Vector2(x, y)));
        const geo = new THREE.ExtrudeGeometry(shape, {
          depth: DEPTH,
          bevelEnabled: true,
          bevelThickness: 0.5,
          bevelSize: 0.35,
          bevelSegments: 4,
          curveSegments: 1,
        });
        geo.translate(0, 0, -DEPTH / 2);
        return geo;
      };

      const green = new THREE.MeshPhysicalMaterial({
        color: 0x00fc54,
        emissive: 0x00fc54,
        emissiveIntensity: 0.32,
        roughness: 0.38,
        metalness: 0,
        envMapIntensity: 0.45,
        clearcoat: 0.5,
        clearcoatRoughness: 0.2,
      });
      const graphite = new THREE.MeshPhysicalMaterial({
        color: 0x1a1f1c,
        roughness: 0.22,
        metalness: 0.85,
        clearcoat: 0.6,
      });

      const logo = new THREE.Group();
      const geometries = [
        ...BARS.map((bar) => {
          const g = extrude(bar);
          logo.add(new THREE.Mesh(g, green));
          return g;
        }),
        ...STROKES.map((line) => {
          const g = extrude(strokeOutline(line, STROKE_WIDTH));
          logo.add(new THREE.Mesh(g, graphite));
          return g;
        }),
      ];
      scene.add(logo);

      const resize = () => {
        const { width, height } = el.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        // le logo (≈ 64 × 56) remplit la boîte quelle que soit sa forme
        const fit = Math.max(64 / camera.aspect, 58) / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        camera.position.z = fit * 1.18;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      // léger penché vers le pointeur
      const tilt = { x: 0, y: 0 };
      const target = { x: 0, y: 0 };
      const onPointer = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        target.x = ((e.clientY - r.top) / r.height - 0.5) * 0.35;
        target.y = ((e.clientX - r.left) / r.width - 0.5) * 0.5;
      };
      const onLeave = () => {
        target.x = 0;
        target.y = 0;
      };
      el.addEventListener("pointermove", onPointer);
      el.addEventListener("pointerleave", onLeave);

      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const clock = new THREE.Clock();
      let angle = START_ANGLE + progressRef.current() * Math.PI * 2;
      let frame = 0;
      let visible = true;

      const draw = () => {
        clock.getDelta();
        // suit le défilement, en douceur
        const goal = START_ANGLE + progressRef.current() * Math.PI * 2;
        angle += still ? goal - angle : (goal - angle) * 0.14;
        tilt.x += (target.x - tilt.x) * 0.06;
        tilt.y += (target.y - tilt.y) * 0.06;
        logo.rotation.set(-0.12 + tilt.x, angle + tilt.y, 0);
        logo.position.y = still ? 0 : Math.sin(clock.elapsedTime * 1.2) * 1.2;
        renderer.render(scene, camera);
      };
      const loop = () => {
        draw();
        frame = visible ? requestAnimationFrame(loop) : 0;
      };
      // ne tourne que si le logo est à l'écran et l'onglet visible
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting && !document.hidden;
        if (visible && !frame) {
          clock.getDelta();
          loop();
        }
      });
      io.observe(el);
      const onVisibility = () => {
        visible = !document.hidden;
        if (visible && !frame) {
          clock.getDelta();
          loop();
        }
      };
      document.addEventListener("visibilitychange", onVisibility);

      draw();
      setLive(true);

      cleanup = () => {
        cancelAnimationFrame(frame);
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        el.removeEventListener("pointermove", onPointer);
        el.removeEventListener("pointerleave", onLeave);
        geometries.forEach((g) => g.dispose());
        green.dispose();
        graphite.dispose();
        envMap.dispose();
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div ref={box} className={cn("relative", className)}>
      {/* logo plat en attendant three.js (ou sans WebGL) */}
      <LogoMark
        className={cn(
          "absolute inset-[14%] size-auto text-ink transition-opacity duration-500",
          live && "opacity-0",
        )}
      />
    </div>
  );
}
