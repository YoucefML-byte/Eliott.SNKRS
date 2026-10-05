"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

// "그라데이션" from 21st.dev/community/gradients — Ribbon Field (stripes mode).
// Palette: #FFFFFF @ 18, #78B8F9 @ 57, #5667FF @ 60, #4D2FF9 @ 100.

export interface RibbonStop {
  color: string;
  /** position along the gradient line, 0-100 */
  at: number;
}

// Feathered band profile along the angle axis (the exact result when wave = 0).
const DEFAULT_STOPS: RibbonStop[] = [
  { color: "#FFFFFF", at: 4.32 },
  { color: "#FFFFFF", at: 33.18 },
  { color: "#78B8F9", at: 37.86 },
  { color: "#78B8F9", at: 58.14 },
  { color: "#5667FF", at: 58.86 },
  { color: "#5667FF", at: 79.64 },
  { color: "#4D2FF9", at: 80 },
  { color: "#4D2FF9", at: 100 },
];

const MAX_STOPS = 8;
const WAVE_CLOCK_START = 20.75;
const DEFAULT_SEED = 174074637;

// Static fallback (SSR, first paint, no WebGL): the CSS approximation.
const GRAIN_SVG =
  "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.210'/></svg>\")";

const cssFallback = (stops: RibbonStop[], angle: number) => ({
  backgroundColor: stops[0]?.color ?? "#FFFFFF",
  backgroundImage: `${GRAIN_SVG}, linear-gradient(${angle}deg, ${stops
    .map((s) => `${s.color} ${s.at}%`)
    .join(", ")})`,
  backgroundSize: "120px 120px, auto",
  backgroundBlendMode: "overlay, normal",
});

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2 uRes;
uniform float uDpr;
uniform float uAngle;
uniform float uWaveAmp;
uniform float uClock;
uniform float uGrain;
uniform float uSeed;
uniform int uCount;
uniform vec3 uColors[${MAX_STOPS}];
uniform float uStops[${MAX_STOPS}];

vec3 profile(float u) {
  vec3 c = uColors[0];
  for (int i = 1; i < ${MAX_STOPS}; i++) {
    if (i >= uCount) break;
    float a = uStops[i - 1];
    float b = uStops[i];
    c = mix(c, uColors[i], clamp((u - a) / max(b - a, 1e-5), 0.0, 1.0));
  }
  return c;
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21) + uSeed);
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec3 overlay(vec3 b, float n) {
  vec3 lo = 2.0 * b * n;
  vec3 hi = 1.0 - 2.0 * (1.0 - b) * (1.0 - n);
  return mix(lo, hi, step(0.5, b));
}

void main() {
  // CSS space: origin at the centre, y pointing down.
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) - 0.5 * uRes;
  float sa = sin(uAngle);
  float ca = cos(uAngle);

  // same gradient-line length as CSS linear-gradient(angle)
  float len = abs(uRes.x * sa) + abs(uRes.y * ca);
  float crossLen = abs(uRes.x * ca) + abs(uRes.y * sa);
  float u = dot(p, vec2(sa, -ca)) / len + 0.5;
  float cross = dot(p, vec2(ca, sa)) / crossLen + 0.5;

  // wave bends the bands with a cross-axis sine offset
  u += uWaveAmp * sin(cross * 2.4 * 6.28318530718 + uClock);

  vec3 col = profile(u);

  // grain: overlay-blended noise, sized in CSS pixels
  vec2 g = floor(gl_FragCoord.xy / uDpr);
  float n = 0.5 + (0.5 * (hash(g) + hash(g + 17.0)) - 0.5) * 0.9;
  col = mix(col, overlay(col, n), uGrain);

  gl_FragColor = vec4(col, 1.0);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const v = parseInt(full, 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export interface RibbonGradientProps {
  className?: string;
  /** colour stops along the gradient line (max 8) */
  stops?: RibbonStop[];
  /** stripe direction in degrees, CSS convention (0 = to top) */
  angle?: number;
  /** band bend, 0-100 */
  wave?: number;
  /** grain strength, 0-100 */
  grain?: number;
  /** animation speed, 100 = 1x */
  speed?: number;
  /** angle sway amount, 0-100 (0 = bands only ripple) */
  motionAmount?: number;
  motionReverse?: boolean;
  animated?: boolean;
  seed?: number;
}

export default function RibbonGradient({
  className,
  stops = DEFAULT_STOPS,
  angle = 32,
  wave = 14,
  grain = 42,
  speed = 100,
  motionAmount = 0,
  motionReverse = false,
  animated = true,
  seed = DEFAULT_SEED,
}: RibbonGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl) return; // CSS fallback stays visible

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const loc = (name: string) => gl.getUniformLocation(prog, name);
    const uRes = loc("uRes");
    const uDpr = loc("uDpr");
    const uAngle = loc("uAngle");
    const uClock = loc("uClock");

    const used = stops.slice(0, MAX_STOPS);
    const colors = new Float32Array(MAX_STOPS * 3);
    const positions = new Float32Array(MAX_STOPS);
    used.forEach((s, i) => {
      colors.set(hexToRgb(s.color), i * 3);
      positions[i] = s.at / 100;
    });
    gl.uniform3fv(loc("uColors"), colors);
    gl.uniform1fv(loc("uStops"), positions);
    gl.uniform1i(loc("uCount"), used.length);
    gl.uniform1f(loc("uWaveAmp"), (wave / 100) * 0.35);
    gl.uniform1f(loc("uGrain"), (grain / 100) * 0.5);
    gl.uniform1f(loc("uSeed"), (seed % 997) / 997);

    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
    };

    const amt = motionAmount / 100;
    const dir = motionReverse ? -1 : 1;
    const baseAngle = (angle * Math.PI) / 180;

    // ph = t * speed; every modulation is exactly 0 at ph = 0
    const draw = (t: number) => {
      const ph = t * (speed / 100);
      const spin = ph * dir;
      const swayDeg = Math.sin(spin * 0.6) * 28 * amt;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uDpr, dpr);
      gl.uniform1f(uAngle, baseAngle + (swayDeg * Math.PI) / 180);
      gl.uniform1f(uClock, WAVE_CLOCK_START + ph * 1.2);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = animated && !reduce;

    // elapsed-seconds clock that only advances while on screen
    let elapsed = 0;
    let last: number | null = null;
    let raf = 0;
    let visible = true;

    const frame = (now: number) => {
      if (last != null) elapsed += (now - last) / 1000;
      last = now;
      draw(elapsed);
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!animate || raf) return;
      last = null;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const ro = new ResizeObserver(() => {
      resize();
      draw(elapsed);
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);

    resize();
    draw(0);
    canvas.style.opacity = "1";
    if (visible) start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [stops, angle, wave, grain, speed, motionAmount, motionReverse, animated, seed]);

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={cssFallback(stops, angle)}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-0"
      />
    </div>
  );
}
