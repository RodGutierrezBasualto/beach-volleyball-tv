/**
 * Minimal interactive volleyball for the home hero — flat design.
 *
 * A single flat, dark blue ball with its seams cut out in the hero colour.
 * It rests on the hero's baseline with a flat shadow, bounces gently, drifts
 * slightly toward the cursor, leans away when the cursor comes close, can be
 * knocked with a quick swipe and pops up when clicked or tapped. It spins in
 * the plane as it moves.
 */

const BALL = '#06737b';      // same as --teal-700 (the "TV" in the headline)
const SEAM = '#e3f5f7';      // matches --hero-bg so seams read as cut-outs
const SHADOW = 'rgba(6, 115, 123, 0.14)';

// Seam geometry from the Tabler "ball-volleyball" icon (MIT licence),
// drawn on a 24×24 grid around a circle of radius 9 centred at (12, 12).
const SEAMS = [
  'M12 12a8 8 0 0 0 8 4',
  'M7.5 13.5a12 12 0 0 0 8.5 6.5',
  'M12 12a8 8 0 0 0 -7.464 4.928',
  'M12.951 7.353a12 12 0 0 0 -9.88 4.111',
  'M12 12a8 8 0 0 0 -.536 -8.928',
  'M15.549 15.147a12 12 0 0 0 1.38 -10.611',
].map((d) => new Path2D(d));

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function initHeroBall(canvas: HTMLCanvasElement): () => void {
  const hero = (canvas.closest('[data-hero]') as HTMLElement) ?? canvas.parentElement!;
  const content = hero.querySelector<HTMLElement>('[data-hero-content]');
  const groundEl = hero.querySelector<HTMLElement>('[data-hero-ground]');
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0, H = 0, dpr = 1, R = 90;
  let ground = 0, apex = 0, homeBase = 0, g = 1500;
  let wide = true;

  const ball = { x: 0, y: 0, vx: 0, vy: 0, squash: 0, angle: -0.35 };
  const ptr = { x: -1e4, y: -1e4, vx: 0, vy: 0, inside: false, lastX: 0, lastY: 0, lastT: 0, tapUntil: 0 };
  let t = 0, raf = 0, last = 0, hitCooldown = 0;
  let inView = true, running = false, grab = false;

  /* ---------- Sizing ---------- */
  function resize() {
    const rect = hero.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const prevW = W;
    W = rect.width;
    H = rect.height;
    wide = W >= 900;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    R = wide ? clamp(W * 0.062, 64, 98) : clamp(W * 0.13, 44, 64);
    ground = groundEl ? groundEl.getBoundingClientRect().top - rect.top - 14 : H - 60;
    const contentBottom = content ? content.getBoundingClientRect().bottom - rect.top : 0;
    apex = wide
      ? ground - R - H * 0.3
      : clamp(contentBottom + R + 16, ground - R - H * 0.22, ground - R - 18);
    homeBase = wide ? W * 0.76 : W * 0.66;
    g = clamp(H * 1.9, 1100, 1800);

    if (!prevW) {
      ball.x = homeBase;
      ball.y = ground - R - (ground - R - apex) * 0.6;
    } else {
      ball.x = clamp(ball.x * (W / prevW), R, W - R);
      ball.y = Math.min(ball.y, ground - R);
    }
    draw();
  }

  /* ---------- Simulation ---------- */
  const restY = () => ground - R;
  const targetSpeed = () => Math.sqrt(2 * g * Math.max(12, restY() - apex));

  function step(dt: number) {
    t += dt;
    hitCooldown = Math.max(0, hitCooldown - dt);
    const decay = Math.exp(-dt * 8);
    ptr.vx *= decay; ptr.vy *= decay;
    const active = ptr.inside || performance.now() < ptr.tapUntil;

    const home = active
      ? homeBase + (clamp(ptr.x, R, W - R) - homeBase) * (wide ? 0.22 : 0.45)
      : homeBase + Math.sin(t * 0.3) * W * 0.025;
    let ax = (home - ball.x) * 2 - ball.vx * 1.1;
    let ay = g;

    const dx = ball.x - ptr.x, dy = ball.y - ptr.y;
    const dist = Math.hypot(dx, dy) || 1;
    const field = R * 1.9;
    if (dist < field) {
      const f = (1 - dist / field) ** 2 * g * 1.6;
      ax += (dx / dist) * f;
      ay += (dy / dist) * f * 0.6;
      const speed = Math.hypot(ptr.vx, ptr.vy);
      if (dist < R + 12 && speed > 450 && hitCooldown === 0) {
        ball.vx += clamp(ptr.vx * 0.45, -900, 900);
        ball.vy = Math.min(ball.vy, 0) - targetSpeed() * 0.5;
        hitCooldown = 0.3;
      }
    }
    const near = dist < R * 1.05;
    if (near !== grab) { grab = near; hero.classList.toggle('is-grab', near); }

    ball.vx += ax * dt;
    ball.vy += ay * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.y >= restY() && ball.vy > 0) {
      const impact = ball.vy;
      const target = targetSpeed() * (0.9 + Math.random() * 0.1);
      ball.y = restY();
      ball.vy = -Math.max(target, impact * 0.5);
      ball.vx *= 0.92;
      ball.squash = Math.min(1, impact / (targetSpeed() * 1.4));
    }
    if (ball.y < R) { ball.y = R; ball.vy = Math.abs(ball.vy) * 0.4; }
    if (ball.x < R) { ball.x = R; ball.vx = Math.abs(ball.vx) * 0.6; }
    if (ball.x > W - R) { ball.x = W - R; ball.vx = -Math.abs(ball.vx) * 0.6; }
    ball.squash *= Math.exp(-dt * 12);

    // Roll with horizontal speed, plus a slow idle spin.
    ball.angle += (ball.vx / R + 0.25) * dt;
  }

  /* ---------- Drawing ---------- */
  function draw() {
    if (!W || !H) return;
    const c = ctx!;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);

    // Flat shadow: smaller and fainter as the ball rises.
    const height = restY() - ball.y;
    const k = clamp(1 - height / (H * 0.55), 0.3, 1);
    c.globalAlpha = 0.4 + 0.6 * k;
    c.fillStyle = SHADOW;
    c.beginPath();
    c.ellipse(ball.x, ground + 2, R * (0.55 + 0.4 * k), R * 0.09, 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;

    // Ball, squashed at its base on landing.
    const q = ball.squash;
    const sx = 1 + 0.1 * q, sy = 1 - 0.09 * q;
    c.save();
    c.translate(ball.x, ball.y + R);
    c.scale(sx, sy);
    c.translate(0, -R);
    c.fillStyle = BALL;
    c.beginPath();
    c.arc(0, 0, R, 0, Math.PI * 2);
    c.fill();

    c.rotate(ball.angle);
    const s = R / 9;
    c.scale(s, s);
    c.translate(-12, -12);
    c.strokeStyle = SEAM;
    c.lineWidth = 1.15;
    c.lineCap = 'round';
    for (const p of SEAMS) c.stroke(p);
    c.restore();
  }

  function frame(now: number) {
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
    last = now;
    step(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (running || reduceMotion || !inView || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  /* ---------- Input ---------- */
  const local = (e: PointerEvent) => {
    const rect = hero.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  function onMove(e: PointerEvent) {
    const { x, y } = local(e);
    const now = performance.now();
    const dt = Math.max(8, now - ptr.lastT) / 1000;
    if (ptr.inside) {
      ptr.vx = ptr.vx * 0.4 + ((x - ptr.lastX) / dt) * 0.6;
      ptr.vy = ptr.vy * 0.4 + ((y - ptr.lastY) / dt) * 0.6;
    }
    ptr.x = x; ptr.y = y; ptr.lastX = x; ptr.lastY = y; ptr.lastT = now;
    ptr.inside = true;
  }
  function onLeave() {
    ptr.inside = false;
    ptr.x = ptr.y = -1e4;
    ptr.vx = ptr.vy = 0;
  }
  function onDown(e: PointerEvent) {
    if ((e.target as HTMLElement).closest('a, button, input, select, textarea')) return;
    const { x, y } = local(e);
    if (Math.hypot(ball.x - x, ball.y - y) < R * 1.25) {
      ball.vy = -targetSpeed() * 1.35;
      ball.vx += (ball.x - x) * 6;
      hitCooldown = 0.3;
    } else if (e.pointerType !== 'mouse') {
      ptr.x = x; ptr.y = -1e4;
      ptr.tapUntil = performance.now() + 1800;
    }
  }

  hero.addEventListener('pointermove', onMove);
  hero.addEventListener('pointerleave', onLeave);
  hero.addEventListener('pointerdown', onDown);
  const ro = new ResizeObserver(() => resize());
  ro.observe(hero);
  const io = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    inView ? start() : stop();
  });
  io.observe(hero);
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);

  resize();
  start();

  return () => {
    stop();
    ro.disconnect();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    hero.removeEventListener('pointermove', onMove);
    hero.removeEventListener('pointerleave', onLeave);
    hero.removeEventListener('pointerdown', onDown);
    hero.classList.remove('is-grab');
  };
}
