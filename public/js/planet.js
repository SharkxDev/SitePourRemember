// ─── PLANET HOLOGRAM RENDERER ────────────────────────────────
(function() {
  const canvas = document.getElementById('planet-canvas');
  const ctx = canvas.getContext('2d');

  let W, H, cx, cy, R;
  let rotY = 0;
  let time = 0;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    cx = W * 0.78;
    cy = H * 0.45;
    R = Math.min(W, H) * 0.28;
  }
  window.addEventListener('resize', resize);
  resize();

  // Generate grid lines on sphere
  function project(lat, lon, rot) {
    const radLat = (lat * Math.PI) / 180;
    const radLon = ((lon + rot) * Math.PI) / 180;
    const x3 = Math.cos(radLat) * Math.sin(radLon);
    const y3 = Math.sin(radLat);
    const z3 = Math.cos(radLat) * Math.cos(radLon);
    return {
      x: cx + R * x3,
      y: cy - R * y3,
      z: z3,
      visible: z3 > -0.1
    };
  }

  function drawLatLine(lat, rot, alpha) {
    ctx.beginPath();
    let first = true;
    for (let lon = -180; lon <= 180; lon += 3) {
      const p = project(lat, lon, rot);
      const fade = Math.max(0, p.z);
      if (!first && p.visible) {
        ctx.lineTo(p.x, p.y);
      } else {
        ctx.moveTo(p.x, p.y);
      }
      first = !p.visible;
    }
    ctx.strokeStyle = `rgba(0, 180, 255, ${alpha * 0.35})`;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }

  function drawLonLine(lon, rot, alpha) {
    ctx.beginPath();
    let first = true;
    for (let lat = -90; lat <= 90; lat += 3) {
      const p = project(lat, lon, rot);
      if (p.visible) {
        if (first) { ctx.moveTo(p.x, p.y); first = false; }
        else ctx.lineTo(p.x, p.y);
      } else {
        first = true;
      }
    }
    ctx.strokeStyle = `rgba(0, 180, 255, ${alpha * 0.35})`;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }

  function drawGlowDot(x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }

  function drawHotspot(lat, lon, rot) {
    const p = project(lat, lon, rot);
    if (!p.visible || p.z < 0.2) return;
    const alpha = (p.z - 0.2) / 0.8;
    drawGlowDot(p.x, p.y, 6 * alpha, `rgba(200, 255, 0, ${0.6 * alpha})`);
    // Pulse ring
    const pulse = (Math.sin(time * 0.05 + lat) + 1) / 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4 + pulse * 8, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(200, 255, 0, ${0.4 * alpha * (1 - pulse)})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const hotspots = [
    [20, 30], [-15, 80], [40, -60], [-35, 140], [60, 10], [0, -120]
  ];

  function draw() {
    ctx.clearRect(0, 0, W, H);
    time++;
    rotY += 0.12;

    const rot = rotY;

    // ── Atmosphere glow ──
    const atm = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.35);
    atm.addColorStop(0, 'rgba(0, 80, 160, 0.12)');
    atm.addColorStop(0.5, 'rgba(0, 100, 200, 0.05)');
    atm.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2);
    ctx.fillStyle = atm;
    ctx.fill();

    // ── Planet base ──
    const base = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.05, cx, cy, R);
    base.addColorStop(0, 'rgba(0, 30, 70, 0.9)');
    base.addColorStop(0.6, 'rgba(0, 15, 40, 0.95)');
    base.addColorStop(1, 'rgba(0, 5, 20, 0.98)');
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = base;
    ctx.fill();

    // ── Clip to planet for grid ──
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    // Latitude lines
    for (let lat = -80; lat <= 80; lat += 20) {
      drawLatLine(lat, rot, 1);
    }
    // Equator brighter
    ctx.save();
    ctx.beginPath();
    for (let lon = -180; lon <= 180; lon += 3) {
      const p = project(0, lon, rot);
      if (lon === -180) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    // Longitude lines
    for (let lon = -180; lon < 180; lon += 20) {
      drawLonLine(lon, rot, 1);
    }

    // Hotspots
    hotspots.forEach(([lat, lon]) => drawHotspot(lat, lon, rot));

    ctx.restore();

    // ── Specular highlight ──
    const spec = ctx.createRadialGradient(
      cx - R * 0.4, cy - R * 0.35, 0,
      cx - R * 0.4, cy - R * 0.35, R * 0.65
    );
    spec.addColorStop(0, 'rgba(100, 200, 255, 0.12)');
    spec.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = spec;
    ctx.fill();

    // ── Outer ring (orbit) ──
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, 0.25);
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.55, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 180, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.stroke();
    ctx.restore();

    // Orbit dot
    const orbitAngle = (time * 0.008) % (Math.PI * 2);
    const ox = cx + Math.cos(orbitAngle) * R * 1.55;
    const oy = cy + Math.sin(orbitAngle) * R * 1.55 * 0.25;
    drawGlowDot(ox, oy, 4, 'rgba(0, 212, 255, 0.8)');

    // ── Scan line ──
    const scanPos = ((time * 0.5) % (R * 2.2)) - R * 1.1;
    const scanX = cx + scanPos;
    const scanAlpha = Math.max(0, 1 - Math.abs(scanPos) / (R * 1.1)) * 0.12;
    ctx.beginPath();
    ctx.moveTo(scanX, cy - R * 1.2);
    ctx.lineTo(scanX, cy + R * 1.2);
    ctx.strokeStyle = `rgba(0, 212, 255, ${scanAlpha})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.stroke();

    // ── Corner HUD elements ──
    drawHUD();

    requestAnimationFrame(draw);
  }

  function drawHUD() {
    // Bottom right corner brackets
    const bx = cx + R * 1.1, by = cy + R * 0.7;
    const s = 16;
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(bx, by - s); ctx.lineTo(bx, by); ctx.lineTo(bx + s, by);
    ctx.stroke();
    // Top left
    ctx.beginPath();
    const tx = cx - R * 1.0, ty = cy - R * 0.7;
    ctx.moveTo(tx + s, ty); ctx.lineTo(tx, ty); ctx.lineTo(tx, ty + s);
    ctx.stroke();
  }

  draw();
})();
