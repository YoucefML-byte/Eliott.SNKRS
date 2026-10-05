import { useId } from "react";

import type { Colorway, ImageView, Silhouette } from "@/data/types";

// Studio-style sneaker renders used as placeholder product shots for the
// mock-up. Each silhouette is a set of layered panels coloured from the
// product's colorway; swap them for real photos via `ProductImage.src`.

type Parts = {
  upper: string;
  heel: string;
  toe: string;
  eyestay: string;
  side: string;
  tongue: string;
  collar: string;
  midsole: string;
  outsole: string;
  /** lace line from collar to vamp; laces are spread along it */
  laceLine: [number, number, number, number];
  laceCount: number;
  perfs?: boolean;
  stitch: string[];
  extra?: string;
};

const LOW: Parts = {
  upper:
    "M40 192 C36 160 38 124 52 98 C78 104 116 110 146 108 L166 82 C172 72 186 72 194 80 L326 146 C372 156 420 162 446 180 Q458 190 450 196 L40 196 Z",
  heel: "M40 196 C36 162 38 130 50 108 C70 112 96 124 106 150 C110 168 110 184 108 196 Z",
  toe: "M318 196 C318 182 322 166 334 154 C374 156 420 164 444 180 Q458 190 450 196 Z",
  eyestay: "M150 110 L168 84 C174 76 184 76 190 82 L324 148 C316 154 310 160 304 168 L176 116 Z",
  side: "M112 182 C150 176 214 160 270 140 C300 130 322 126 338 128 C318 140 290 156 252 170 C206 186 150 192 112 190 Z",
  tongue: "M146 108 L160 66 C164 56 182 54 190 62 L196 80 L180 92 Z",
  collar: "M52 98 C80 104 116 110 146 108 L150 116 C116 120 82 116 56 110 Z",
  midsole: "M34 184 L440 186 C456 188 462 196 460 204 L458 210 C456 216 448 218 438 218 L44 218 C34 218 30 212 30 204 L30 194 C30 188 31 184 34 184 Z",
  outsole: "M30 210 L460 210 C460 220 452 228 438 228 L46 228 C34 228 30 222 30 216 Z",
  laceLine: [172, 86, 316, 150],
  laceCount: 6,
  perfs: true,
  stitch: [
    "M112 186 C150 182 214 166 268 146",
    "M322 194 C322 182 326 170 336 160",
    "M104 194 C106 176 106 160 100 146",
  ],
};

const HIGH: Parts = {
  upper:
    "M40 196 C34 150 34 96 44 48 C70 44 104 46 132 50 L150 30 C156 22 172 22 178 30 L188 60 C206 92 250 122 326 146 C372 156 420 162 446 180 Q458 190 450 196 Z",
  heel: "M40 196 C34 152 34 112 42 76 C66 84 92 100 104 130 C110 152 110 178 108 196 Z",
  toe: LOW.toe,
  eyestay: "M134 54 L150 34 C156 28 168 28 172 34 L182 62 C200 94 250 126 324 148 C316 154 310 160 304 168 C238 146 184 118 160 84 Z",
  side: LOW.side,
  tongue: "M132 50 L144 18 C148 10 164 8 172 14 L178 30 L160 42 Z",
  collar: "M44 48 C70 44 104 46 132 50 L134 60 C104 58 72 58 46 60 Z",
  midsole: LOW.midsole,
  outsole: LOW.outsole,
  laceLine: [158, 44, 300, 142],
  laceCount: 7,
  perfs: true,
  stitch: [...LOW.stitch, "M46 100 C80 104 104 112 120 126"],
  extra: "M44 100 C78 102 108 108 128 120 L124 134 C104 124 74 118 44 116 Z",
};

const RUNNER: Parts = {
  upper:
    "M46 176 C40 146 44 118 60 98 C86 104 120 108 150 106 L170 82 C176 74 188 74 194 80 L320 140 C366 150 414 156 440 170 Q452 178 446 184 L46 184 Z",
  heel: "M46 184 C40 150 44 124 58 104 C82 112 104 132 112 162 L114 184 Z",
  toe: "M300 184 C302 168 310 154 322 144 C366 150 414 156 440 170 Q452 178 446 184 Z",
  eyestay: "M154 108 L172 84 C178 78 186 78 192 84 L318 142 C310 148 304 154 300 162 L180 114 Z",
  side: "M150 172 C172 140 196 122 222 118 L246 120 C226 132 208 150 196 176 Z M204 174 C220 148 240 132 262 128 L282 130 C262 142 248 156 240 176 Z",
  tongue: "M150 106 L164 66 C168 58 184 56 190 64 L196 80 L182 92 Z",
  collar: "M60 98 C86 104 120 108 150 106 L154 114 C120 118 88 114 62 108 Z",
  midsole: "M38 168 C60 164 120 168 200 170 C300 172 400 170 446 174 C460 176 464 190 458 200 C452 210 440 212 420 212 L60 212 C42 212 34 204 34 192 C34 180 34 170 38 168 Z",
  outsole: "M34 204 L458 204 C456 216 446 226 428 226 L56 226 C40 226 34 216 34 204 Z",
  laceLine: [176, 88, 304, 146],
  laceCount: 5,
  stitch: [
    "M112 182 C112 160 106 138 96 122",
    "M304 182 C306 170 312 158 322 150",
  ],
  extra: "M40 186 C120 190 300 190 452 186",
};

const SHAPES: Record<Silhouette, Parts> = { low: LOW, high: HIGH, runner: RUNNER };

// toe-box perforation grid
const PERFS: [number, number][] = [];
for (let row = 0; row < 3; row++)
  for (let col = 0; col < 6; col++) PERFS.push([360 + col * 13 + row * 4, 168 + row * 8]);

// short bars across the lace line, slightly tilted like crossed laces
function laces(s: Parts): [number, number, number, number][] {
  const [x1, y1, x2, y2] = s.laceLine;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const nx = -(y2 - y1) / len;
  const ny = (x2 - x1) / len;
  return Array.from({ length: s.laceCount }, (_, i) => {
    const t = 0.06 + (i / (s.laceCount - 1)) * 0.86;
    const px = x1 + (x2 - x1) * t;
    const py = y1 + (y2 - y1) * t;
    return [px - nx * 8 - 3, py - ny * 8, px + nx * 6 + 3, py + ny * 6];
  });
}

function Shoe({ s, c, uid }: { s: Parts; c: Colorway; uid: string }) {
  return (
    <g>
      <path d={s.outsole} fill={c.outsole} />
      <path d={s.midsole} fill={c.midsole} />
      {s.extra && s === RUNNER && (
        <path d={s.extra} fill="none" stroke={c.outsole} strokeOpacity={0.35} strokeWidth={3} />
      )}
      <path d={s.tongue} fill={c.tongue ?? c.upper} />
      <path d={s.upper} fill={c.upper} />
      <g clipPath={`url(#${uid}-clip)`}>
        <path d={s.toe} fill={c.toe ?? c.overlay} />
        <path d={s.heel} fill={c.heel ?? c.overlay} />
        <path d={s.eyestay} fill={c.overlay} />
        {s.extra && s !== RUNNER && <path d={s.extra} fill={c.overlay} />}
        {s.perfs &&
          PERFS.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} fill="#000" fillOpacity={0.28} />
          ))}
        <path d={s.side} fill={c.accent} />
        <path d={s.collar} fill={c.lining ?? "#1b1b1b"} opacity={0.9} />
        {s.stitch.map((d) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke="#000"
            strokeOpacity={0.22}
            strokeWidth={1.2}
            strokeDasharray="3 3"
          />
        ))}
        <rect width="480" height="260" fill={`url(#${uid}-shade)`} />
      </g>
      {laces(s).map(([x1, y1, x2, y2]) => (
        <line
          key={`${x1}-${y1}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={c.laces}
          strokeWidth={5.5}
          strokeLinecap="round"
        />
      ))}
      <path d={s.midsole} fill={`url(#${uid}-sole)`} />
    </g>
  );
}

export interface SneakerArtProps {
  silhouette: Silhouette;
  colorway: Colorway;
  view?: ImageView;
  className?: string;
  title?: string;
}

const VIEWBOX: Record<ImageView, string> = {
  side: "0 -10 480 270",
  medial: "0 -10 480 270",
  pair: "-10 -30 500 290",
  detail: "20 30 250 200",
};

export default function SneakerArt({
  silhouette,
  colorway,
  view = "side",
  className,
  title,
}: SneakerArtProps) {
  const uid = useId().replace(/:/g, "");
  const s = SHAPES[silhouette];

  const shoe = <Shoe s={s} c={colorway} uid={uid} />;

  return (
    <svg
      viewBox={VIEWBOX[view]}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <clipPath id={`${uid}-clip`}>
          <path d={s.upper} />
        </clipPath>
        <linearGradient id={`${uid}-shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id={`${uid}-sole`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
        <radialGradient id={`${uid}-floor`}>
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {view === "pair" ? (
        <>
          <ellipse cx="240" cy="242" rx="250" ry="16" fill={`url(#${uid}-floor)`} />
          <g transform="translate(62 -24) scale(0.92)">{shoe}</g>
          <g transform="translate(-14 16)">{shoe}</g>
        </>
      ) : (
        <>
          <ellipse cx="245" cy="230" rx="230" ry="14" fill={`url(#${uid}-floor)`} />
          <g transform={view === "medial" ? "translate(490 0) scale(-1 1)" : undefined}>
            {shoe}
          </g>
        </>
      )}
    </svg>
  );
}
