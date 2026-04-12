import { useEffect, useRef } from 'react';
import './AsciiBg.css';

const AsciiBg = () => {
  const hostRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const pre = preRef.current;
    if (!host || !pre) return;

    const CFG = {
      angleDeg: 0,
      frequency: 11,
      contrast: 0.35,
      edgeWidth: 0.04,
      gapLevel: 0.3,
      flowSpeed: 0.018,
      flowAngleOffset: 0,
      flowReverse: false,
      flowMode: "up",
      driftX: 1.1021821192326178e-18,
      driftY: -0.018,
      warpAmp: 0.42,
      warpScale: 1.4,
      warpSpeed: 0.001,
      bandJitter: { enabled: true, amp: 0.2, scale: 0.85, speed: 0.05 },
      randomSet: Array.from(" .,:;*+![]{}<>-~"),
      lineSet: Array.from("    PIXWEB @@@    "),
      gapSet: Array.from("@"),
      randomChangeHz: 1.5,
      lineThreshold: 0,
      gapThreshold: 1,
      gapFan: { enabled: true, strength: 0.5 },
      streaks: {
        enabled: true, count: 3, char: " ", randomDirection: true,
        useDriftDirection: true, angleJitterDeg: 75,
        widthMin: 0.008, widthMax: 0.028, lengthMin: 0.22, lengthMax: 0.7,
        speedMin: 0.12, speedMax: 0.3, startMargin: 0.18,
      },
      gapClouds: { enabled: true, density: 0.08, scale: 1.6, speed: 0.03, octaves: 3, hardness: 0.85 },
      erase: { enabled: true, radiusCells: 12, durationSec: 0.9, jitter: 0.35, hardness: 0.6 },
      fpsCap: 30,
    };

    const G: { x: number; y: number }[] = [];
    for (let i = 0; i < 256; i++) {
      const a = (i / 256) * Math.PI * 2;
      G[i] = { x: Math.cos(a), y: Math.sin(a) };
    }
    const P = new Uint8Array(512);
    {
      const base = new Uint8Array(256);
      for (let i = 0; i < 256; i++) base[i] = i;
      let s = 1234567;
      const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff);
      for (let i = 255; i > 0; i--) {
        const j = (rnd() * (i + 1)) | 0;
        const tmp = base[i]; base[i] = base[j]; base[j] = tmp;
      }
      for (let i = 0; i < 512; i++) P[i] = base[i & 255];
    }

    const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
    const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

    function grad(ix: number, iy: number, x: number, y: number) {
      const g = G[P[(ix & 255) + P[iy & 255]]];
      return g.x * (x - ix) + g.y * (y - iy);
    }

    function perlin(x: number, y: number) {
      const x0 = Math.floor(x), y0 = Math.floor(y);
      const sx = fade(x - x0), sy = fade(y - y0);
      const n00 = grad(x0, y0, x, y), n10 = grad(x0 + 1, y0, x, y);
      const n01 = grad(x0, y0 + 1, x, y), n11 = grad(x0 + 1, y0 + 1, x, y);
      return (n00 + sx * (n10 - n00)) + sy * ((n01 + sx * (n11 - n01)) - (n00 + sx * (n10 - n00)));
    }

    function fbm(x: number, y: number, oct = 3, gain = 0.5, lac = 2) {
      let v = 0, amp = 1, f = 1, norm = 0;
      for (let i = 0; i < oct; i++) { v += amp * perlin(x * f, y * f); norm += amp; amp *= gain; f *= lac; }
      return v / (norm || 1);
    }

    function hash32(n: number) {
      n = (n >>> 0) + 0x9e3779b9; n ^= n >>> 16; n = Math.imul(n, 0x85ebca6b);
      n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); n ^= n >>> 16; return n >>> 0;
    }
    function hash3(x: number, y: number, z: number) {
      let h = 2166136261; h ^= x | 0; h = Math.imul(h, 16777619);
      h ^= y | 0; h = Math.imul(h, 16777619); h ^= z | 0; h = Math.imul(h, 16777619); return h >>> 0;
    }
    const pickFrom = (arr: string[], h: number) => arr[h % arr.length];

    let cols = 0, rows = 0, sShort = 1;
    let t0 = performance.now(), lastFrame = 0, lastT = 0;
    let cellW = 8, cellH = 14;
    let eraseBuf = new Float32Array(1);
    const SAFE_CHAR_PAD_X = 0.15, SAFE_CHAR_PAD_Y = 0.05;

    function measureCell() {
      const probe = document.createElement("span");
      probe.textContent = "M".repeat(200);
      probe.style.cssText = "position:absolute;left:-9999px;top:-9999px;white-space:pre;pointer-events:none;visibility:hidden";
      const cs = getComputedStyle(pre);
      probe.style.font = cs.font;
      probe.style.letterSpacing = cs.letterSpacing;
      host.appendChild(probe);
      const totalW = probe.getBoundingClientRect().width;
      host.removeChild(probe);
      return { cw: totalW / 200 || 8, lh: parseFloat(cs.lineHeight) || 14 };
    }

    function computeGrid() {
      const m = measureCell();
      cellW = m.cw; cellH = m.lh;
      const rect = host.getBoundingClientRect();
      const c = Math.max(1, Math.floor(rect.width / cellW - SAFE_CHAR_PAD_X));
      const r = Math.max(1, Math.floor(rect.height / cellH - SAFE_CHAR_PAD_Y));
      if (c === cols && r === rows) return;
      cols = c; rows = r; sShort = cols < rows ? cols : rows;
      eraseBuf = new Float32Array(cols * rows);
    }

    interface Streak { dirx: number; diry: number; nrmx: number; nrmy: number; p0: number; width: number; length: number; speed: number; headStart: number; bornAt: number; }
    const ST: { list: Streak[] } = { list: [] };
    const randRange = (a: number, b: number) => a + Math.random() * (b - a);

    function makeDir() {
      let dx = CFG.driftX || 0.0001, dy = CFG.driftY || 0;
      if (CFG.streaks.randomDirection) {
        let baseAngle = CFG.streaks.useDriftDirection ? Math.atan2(dy, dx) : 0;
        baseAngle += randRange(-1, 1) * CFG.streaks.angleJitterDeg * Math.PI / 180;
        dx = Math.cos(baseAngle); dy = Math.sin(baseAngle);
      }
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      return { dx, dy, nx: -dy, ny: dx };
    }

    function makeStreak(t: number): Streak {
      const s = CFG.streaks, m = s.startMargin, D = makeDir();
      return {
        dirx: D.dx, diry: D.dy, nrmx: D.nx, nrmy: D.ny,
        p0: randRange(-m, 1 + m), width: randRange(s.widthMin, s.widthMax),
        length: randRange(s.lengthMin, s.lengthMax), speed: randRange(s.speedMin, s.speedMax),
        headStart: -(randRange(s.lengthMin, s.lengthMax) + m), bornAt: t,
      };
    }

    function initStreaks(t: number) {
      ST.list.length = 0;
      if (!CFG.streaks.enabled || CFG.streaks.count <= 0) return;
      for (let i = 0; i < CFG.streaks.count; i++) ST.list.push(makeStreak(t));
    }

    function inAnyStreak(u: number, v: number, t: number) {
      if (!CFG.streaks.enabled) return false;
      const sm = CFG.streaks.startMargin;
      for (let i = 0; i < ST.list.length; i++) {
        const st = ST.list[i];
        const sCoord = u * st.dirx + v * st.diry;
        const pCoord = u * st.nrmx + v * st.nrmy;
        const head = st.headStart + st.speed * t;
        if (head > 1 + sm) { ST.list[i] = makeStreak(t); continue; }
        const tail = head - st.length;
        if (Math.abs(pCoord - st.p0) <= st.width * 0.5 && sCoord >= tail && sCoord <= head) return true;
      }
      return false;
    }

    function inGapCloud(u: number, v: number, t: number) {
      if (!CFG.gapClouds.enabled) return false;
      const c = CFG.gapClouds;
      const n = fbm(u * c.scale + t * c.speed + 11.3, v * c.scale - t * c.speed - 7.9, c.octaves, 0.55, 2);
      const hardened = Math.pow(n, c.hardness);
      const threshold = 1 - c.density;
      const cellJit = (hash3((u * 9999) | 0, (v * 9999) | 0, Math.floor(t)) % 997) / 997 * 0.02;
      return hardened + cellJit > threshold;
    }

    function applyErase(cx: number, cy: number) {
      if (!CFG.erase.enabled) return;
      const R = CFG.erase.radiusCells | 0;
      const dur = CFG.erase.durationSec;
      const hard = clamp(CFG.erase.hardness, 0, 1);
      const jit = clamp(CFG.erase.jitter, 0, 1);
      const r2 = R * R;
      const x0 = Math.max(0, cx - R), x1 = Math.min(cols - 1, cx + R);
      const y0 = Math.max(0, cy - R), y1 = Math.min(rows - 1, cy + R);
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
          if (d2 > r2) continue;
          const d = Math.sqrt(d2) / R;
          const falloff = Math.pow(1 - d, hard * 3 + 0.01);
          const h = (hash3(x * 131 + y * 911, y * 521 + x * 173, cx * 7 + cy * 13) % 1000) / 1000;
          const accept = h < falloff * (1 - jit) + (falloff > 0.5 ? jit * 0.6 : jit * 0.2);
          if (accept) {
            const idx = y * cols + x;
            eraseBuf[idx] = Math.max(eraseBuf[idx], dur * falloff);
          }
        }
      }
    }

    function eventToCell(ev: MouseEvent | TouchEvent) {
      const rect = pre.getBoundingClientRect();
      const touch = 'touches' in ev ? ev.touches[0] : ev;
      let cx = Math.floor((touch.clientX - rect.left) / cellW);
      let cy = Math.floor((touch.clientY - rect.top) / cellH);
      cx = clamp(cx, 0, cols - 1);
      cy = clamp(cy, 0, rows - 1);
      return { cx, cy };
    }

    const onMove = (ev: MouseEvent | TouchEvent) => { const p = eventToCell(ev); applyErase(p.cx, p.cy); };
    pre.addEventListener("mousemove", onMove as EventListener);
    pre.addEventListener("touchstart", onMove as EventListener, { passive: true });
    pre.addEventListener("touchmove", onMove as EventListener, { passive: true });

    function sampleBands(x: number, y: number, t: number, rowNorm: number) {
      const s = sShort || 1;
      let u = x / s, v = y / s;
      u -= CFG.driftX * t; v -= CFG.driftY * t;
      const wt = t * CFG.warpSpeed;
      const wx = CFG.warpAmp * fbm(u * CFG.warpScale + 10.1 + wt, v * CFG.warpScale - 9.3 - wt, 3, 0.55, 2);
      const wy = CFG.warpAmp * fbm(u * CFG.warpScale - 30.9 - wt, v * CFG.warpScale + 19.7 + wt, 3, 0.8, 2);
      const ang = CFG.angleDeg * Math.PI / 180;
      const rx = (u + wx) * Math.cos(ang) + (v + wy) * Math.sin(ang);
      const bandWave = 0.5 + 0.5 * Math.sin(rx * Math.PI * 2 * (CFG.frequency / 2));
      const ink = Math.pow(bandWave, CFG.contrast);
      const gap = 1 - ink;
      let gLevel = CFG.gapLevel;
      if (CFG.gapFan.enabled) gLevel += (1 - rowNorm) * CFG.gapFan.strength;
      if (CFG.bandJitter.enabled) {
        const j = fbm(u * CFG.bandJitter.scale + 77.1, v * CFG.bandJitter.scale - 99.8, 3, 0.55, 2);
        gLevel += CFG.bandJitter.amp * (j - 0.5) * 2 + Math.sin(t * CFG.bandJitter.speed) * 0.02;
      }
      const aL = gLevel - CFG.edgeWidth, bL = gLevel + CFG.edgeWidth;
      const tLine = clamp(1 - (gap - aL) / (bL - aL), 0, 1);
      const tGap = clamp((gap - aL) / (bL - aL), 0, 1);
      const bandIndex = Math.floor(rx * CFG.frequency);
      return { u: u + wx, v: v + wy, bandIndex, tLine, tGap };
    }

    function baseChar(x: number, y: number, t: number, b: ReturnType<typeof sampleBands>) {
      if (inGapCloud(b.u, b.v, t)) return " ";
      if (inAnyStreak(b.u, b.v, t - t0 / 1000)) return CFG.streaks.char;
      if (b.tLine > CFG.lineThreshold) return pickFrom(CFG.lineSet, hash32(b.bandIndex * 73856093));
      if (b.tGap > CFG.gapThreshold) return pickFrom(CFG.gapSet, hash32(b.bandIndex * 19349663));
      const slice = Math.floor(t * CFG.randomChangeHz);
      const h2 = hash32((x + 1) * 15485863 ^ (y + 1) * 32452843 ^ slice * 49979687);
      return CFG.randomSet[h2 % CFG.randomSet.length];
    }

    let rafId = 0;
    function render(now: number) {
      if (now - lastFrame < 1000 / CFG.fpsCap) { rafId = requestAnimationFrame(render); return; }
      const t = (now - t0) / 1000;
      const dt = t - lastT; lastT = t; lastFrame = now;
      if (CFG.erase.enabled) {
        const decay = dt > 0 ? dt : 0.016;
        for (let i = 0; i < eraseBuf.length; i++) { const v = eraseBuf[i] - decay; eraseBuf[i] = v > 0 ? v : 0; }
      }
      let out = "";
      for (let y = 0; y < rows; y++) {
        const rowNorm = rows <= 1 ? 0 : y / (rows - 1);
        for (let x = 0; x < cols; x++) {
          const b = sampleBands(x, y, t, rowNorm);
          const idx = y * cols + x;
          out += eraseBuf[idx] > 0 ? " " : baseChar(x, y, t, b);
        }
        if (y < rows - 1) out += "\n";
      }
      pre.textContent = out;
      rafId = requestAnimationFrame(render);
    }

    const ro = new ResizeObserver(computeGrid);
    ro.observe(host);

    const start = () => {
      computeGrid();
      initStreaks(0);
      rafId = requestAnimationFrame(render);
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(start);
    } else {
      start();
    }

    let pausedAt: number | null = null;
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        pausedAt = performance.now();
      } else if (pausedAt !== null) {
        t0 += performance.now() - pausedAt;
        pausedAt = null; lastFrame = 0;
        rafId = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      pre.removeEventListener("mousemove", onMove as EventListener);
      pre.removeEventListener("touchstart", onMove as EventListener);
      pre.removeEventListener("touchmove", onMove as EventListener);
    };
  }, []);

  return (
    <div ref={hostRef} className="ascii-embed">
      <pre ref={preRef} className="ascii-pre" aria-hidden="true" />
    </div>
  );
};

export default AsciiBg;
