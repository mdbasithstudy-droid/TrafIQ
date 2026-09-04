// Safe Session Storage Helpers
function safeGetStorage(key) {
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function safeSetStorage(key, val) {
  try {
    sessionStorage.setItem(key, val);
  } catch (e) {}
}

// Initialize Lucide Icons & Backgrounds on DOMReady
document.addEventListener('DOMContentLoaded', () => {
  const safeCall = (name, fn) => {
    try {
      fn();
    } catch (err) {
      console.error(`[TrafIQ] Error initializing module ${name}:`, err);
    }
  };

  if (window.lucide && typeof lucide.createIcons === 'function') {
    safeCall('lucide', () => lucide.createIcons());
  }

  safeCall('initSystemBootSequence', initSystemBootSequence);
  safeCall('initCommandRailNavbar', initCommandRailNavbar);
  safeCall('initGlobalVehicleBgCanvas', initGlobalVehicleBgCanvas);
  safeCall('initHeroCanvas', initHeroCanvas);
  safeCall('initCCTVSurveillanceSimulation', initCCTVSurveillanceSimulation);
  safeCall('initRoleTabs', initRoleTabs);
  safeCall('initVideoModal', initVideoModal);
});

/* ==========================================================================
   0. GLOBAL VEHICLE TRAFFIC HIGHWAY BACKGROUND CANVAS
   ========================================================================== */
function initGlobalVehicleBgCanvas() {
  const canvas = document.getElementById('vehicle-bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  function resize() {
    canvas.width = Math.max(1, window.innerWidth);
    canvas.height = Math.max(1, window.innerHeight);
  }
  resize();
  window.addEventListener('resize', resize);

  // Highway lane definitions (angled Cyber Highways across background)
  const lanes = [
    { startX: -0.1, startY: 0.3, endX: 1.1, endY: 0.7, color: 'rgba(0, 240, 255, 0.15)' },
    { startX: -0.1, startY: 0.35, endX: 1.1, endY: 0.75, color: 'rgba(0, 163, 255, 0.15)' },
    { startX: -0.1, startY: 0.4, endX: 1.1, endY: 0.8, color: 'rgba(0, 240, 255, 0.12)' },
    { startX: 0.2, startY: -0.1, endX: 0.8, endY: 1.1, color: 'rgba(59, 130, 246, 0.15)' },
    { startX: 0.25, startY: -0.1, endX: 0.85, endY: 1.1, color: 'rgba(0, 240, 255, 0.12)' }
  ];

  // Vehicles flowing on lanes
  const vehicles = [];
  const plates = ['MH-12-AB-4921', 'KA-01-MJ-8820', 'DL-03-CC-1942', 'MH-04-EV-9012', 'TN-09-AX-3301', 'GJ-01-TR-7721'];

  for (let i = 0; i < 28; i++) {
    const laneIndex = Math.floor(Math.random() * lanes.length);
    vehicles.push({
      lane: laneIndex,
      progress: Math.random(),
      speed: 0.0015 + Math.random() * 0.0025,
      length: 25 + Math.random() * 40,
      plate: plates[Math.floor(Math.random() * plates.length)],
      showANPR: Math.random() > 0.6,
      color: Math.random() > 0.4 ? '#00F0FF' : (Math.random() > 0.5 ? '#00A3FF' : '#FF4757')
    });
  }

  let scanLineY = 0;

  function draw() {
    try {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Cyber Highway Lane Lines
      lanes.forEach(lane => {
        ctx.beginPath();
        ctx.moveTo(lane.startX * canvas.width, lane.startY * canvas.height);
        ctx.lineTo(lane.endX * canvas.width, lane.endY * canvas.height);
        ctx.strokeStyle = lane.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([12, 12]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw Vehicles and ANPR Overlays
      vehicles.forEach(v => {
        v.progress += v.speed;
        if (v.progress >= 1) {
          v.progress = 0;
          v.lane = Math.floor(Math.random() * lanes.length);
        }

        const lane = lanes[v.lane];
        const startX = lane.startX * canvas.width;
        const startY = lane.startY * canvas.height;
        const endX = lane.endX * canvas.width;
        const endY = lane.endY * canvas.height;

        const headX = startX + (endX - startX) * v.progress;
        const headY = startY + (endY - startY) * v.progress;
        const tailX = startX + (endX - startX) * Math.max(0, v.progress - v.length / 1000);
        const tailY = startY + (endY - startY) * Math.max(0, v.progress - v.length / 1000);

        // Light Trail (Vehicle Headlight / Taillight Stream)
        const grad = ctx.createLinearGradient(
          isNaN(tailX) ? 0 : tailX,
          isNaN(tailY) ? 0 : tailY,
          isNaN(headX) ? 0 : headX,
          isNaN(headY) ? 0 : headY
        );
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, v.color);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Vehicle Front Light Glow Dot
        ctx.beginPath();
        ctx.arc(headX, headY, 4, 0, Math.PI * 2);
        ctx.fillStyle = v.color;
        ctx.shadowColor = v.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Simulated Background ANPR Bounding Box HUD
        if (v.showANPR && v.progress > 0.2 && v.progress < 0.8) {
          const boxSize = 36;
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.strokeRect(headX - boxSize/2, headY - boxSize/2, boxSize, boxSize);

          // Plate Label
          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
          ctx.fillText(v.plate, headX - boxSize/2, headY - boxSize/2 - 4);
        }
      });

      // Sweeping ANPR Radar Beam Line
      scanLineY = (scanLineY + 1.2) % Math.max(1, canvas.height);
      ctx.beginPath();
      ctx.moveTo(0, scanLineY);
      ctx.lineTo(canvas.width, scanLineY);
      const scanGrad = ctx.createLinearGradient(0, Math.max(0, scanLineY - 15), 0, scanLineY);
      scanGrad.addColorStop(0, 'transparent');
      scanGrad.addColorStop(1, 'rgba(0, 240, 255, 0.08)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, Math.max(0, scanLineY - 15), canvas.width, 15);
    } catch (e) {}

    requestAnimationFrame(draw);
  }

  draw();
}

/* ==========================================================================
   1. HERO CANVAS ANIMATION (City Camera Mesh & Moving Vehicles)
   ========================================================================== */
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  function resizeCanvas() {
    if (canvas.parentElement) {
      canvas.width = Math.max(1, canvas.parentElement.clientWidth);
      canvas.height = Math.max(1, canvas.parentElement.clientHeight);
    }
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Define camera nodes across canvas
  const cameraNodes = [
    { id: 'CAM-01', x: 0.15, y: 0.25, label: 'North Gate' },
    { id: 'CAM-02', x: 0.50, y: 0.20, label: 'Central Plaza' },
    { id: 'CAM-03', x: 0.85, y: 0.35, label: 'East Expressway' },
    { id: 'CAM-04', x: 0.30, y: 0.65, label: 'Tech Park Junction' },
    { id: 'CAM-05', x: 0.70, y: 0.75, label: 'South Bridge' }
  ];

  // Define network connections (edges)
  const connections = [
    [0, 1], [1, 2], [0, 3], [1, 3], [1, 4], [2, 4], [3, 4]
  ];

  // Vehicle particles traveling along edges
  const particles = [];
  const particleCount = 12;

  for (let i = 0; i < particleCount; i++) {
    const connIndex = Math.floor(Math.random() * connections.length);
    particles.push({
      connection: connIndex,
      progress: Math.random(),
      speed: 0.003 + Math.random() * 0.004,
      size: 4 + Math.random() * 2,
      color: Math.random() > 0.3 ? '#00F0FF' : '#00A3FF'
    });
  }

  let pulseAngle = 0;

  function animate() {
    try {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pulseAngle += 0.03;

      // Draw background city grid lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw connection lines
      connections.forEach(([from, to]) => {
        const p1 = { x: cameraNodes[from].x * canvas.width, y: cameraNodes[from].y * canvas.height };
        const p2 = { x: cameraNodes[to].x * canvas.width, y: cameraNodes[to].y * canvas.height };

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw traveling vehicle light particles
      particles.forEach(p => {
        p.progress += p.speed;
        if (p.progress >= 1) {
          p.progress = 0;
          p.connection = Math.floor(Math.random() * connections.length);
        }

        const [fromIdx, toIdx] = connections[p.connection];
        const p1 = { x: cameraNodes[fromIdx].x * canvas.width, y: cameraNodes[fromIdx].y * canvas.height };
        const p2 = { x: cameraNodes[toIdx].x * canvas.width, y: cameraNodes[toIdx].y * canvas.height };

        const currX = p1.x + (p2.x - p1.x) * p.progress;
        const currY = p1.y + (p2.y - p1.y) * p.progress;

        // Glow halo
        ctx.beginPath();
        ctx.arc(currX, currY, p.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color === '#00F0FF' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(0, 163, 255, 0.2)';
        ctx.fill();

        // Core particle
        ctx.beginPath();
        ctx.arc(currX, currY, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      // Draw camera nodes
      cameraNodes.forEach((node, i) => {
        const nx = node.x * canvas.width;
        const ny = node.y * canvas.height;

        // Outer radar pulse circle
        const pulseR = 14 + Math.sin(pulseAngle + i) * 4;
        ctx.beginPath();
        ctx.arc(nx, ny, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Node core
        ctx.beginPath();
        ctx.arc(nx, ny, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#050811';
        ctx.fill();
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(nx, ny, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#00F0FF';
        ctx.fill();

        // Label badge
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#00F0FF';
        ctx.fillText(node.id, nx - 18, ny - 18);
      });
    } catch (e) {}

    requestAnimationFrame(animate);
  }

  animate();
}

/* ==========================================================================
   2. TWO-PANEL INTERACTIVE CCTV SURVEILLANCE SIMULATION ENGINE
   ========================================================================== */
function initCCTVSurveillanceSimulation() {
  const roadCanvas = document.getElementById('cctv-interactive-road-canvas');
  const monitorCanvas = document.getElementById('cctv-surveillance-canvas');
  const roadStage = document.getElementById('cctv-road-stage');
  const dragNode = document.getElementById('cctv-drag-node');
  const headHousing = document.getElementById('cctv-head-housing');
  const panSlider = document.getElementById('cctv-pan-slider');

  if (!roadCanvas || !monitorCanvas || !roadStage || !dragNode) return;

  const ctxRoad = roadCanvas.getContext('2d');
  const ctxMonitor = monitorCanvas.getContext('2d');

  if (!ctxRoad || !ctxMonitor) return;

  function resizeCanvases() {
    if (roadStage) {
      roadCanvas.width = Math.max(1, roadStage.clientWidth || 600);
      roadCanvas.height = Math.max(1, roadStage.clientHeight || 350);
    }
    if (monitorCanvas.parentElement) {
      monitorCanvas.width = Math.max(1, monitorCanvas.parentElement.clientWidth || 600);
      monitorCanvas.height = Math.max(1, monitorCanvas.parentElement.clientHeight || 350);
    }
  }
  resizeCanvases();
  window.addEventListener('resize', resizeCanvases);

  // Camera State
  const camState = {
    x: 80,
    y: 40,
    angle: 0, // in degrees
    isDragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0
  };

  // 3 Target Vehicles along the Road
  const vehicles = [
    {
      id: 1,
      camId: 'CAM-01',
      relX: 0.22,
      relY: 0.72,
      plate: 'MH 12 AB 4921',
      time: '14:02:10 IST',
      location: 'Gateway North Junction',
      speed: '48 km/h',
      nodeEl: document.getElementById('node-1'),
      presetBtn: document.getElementById('preset-cam-1'),
      tabBtn: document.getElementById('cctv-tab-1')
    },
    {
      id: 2,
      camId: 'CAM-02',
      relX: 0.52,
      relY: 0.72,
      plate: 'MH 12 AB 4921',
      time: '14:08:45 IST',
      location: 'Tech Park Flyover',
      speed: '52 km/h',
      nodeEl: document.getElementById('node-2'),
      presetBtn: document.getElementById('preset-cam-2'),
      tabBtn: document.getElementById('cctv-tab-2')
    },
    {
      id: 3,
      camId: 'CAM-03',
      relX: 0.82,
      relY: 0.72,
      plate: 'MH 12 AB 4921',
      time: '14:15:30 IST',
      location: 'Expressway Toll Plaza',
      speed: '65 km/h',
      nodeEl: document.getElementById('node-3'),
      presetBtn: document.getElementById('preset-cam-3'),
      tabBtn: document.getElementById('cctv-tab-3')
    }
  ];

  // DOM Overlay Elements
  const camTitleEl = document.getElementById('cctv-cam-title');
  const hudPlateEl = document.getElementById('cctv-hud-plate');
  const hudCamEl = document.getElementById('cctv-hud-cam');
  const hudTimeEl = document.getElementById('cctv-hud-time');
  const hudLocEl = document.getElementById('cctv-hud-loc');
  const hudSpeedEl = document.getElementById('cctv-hud-speed');
  const anprCardEl = document.getElementById('cctv-anpr-card');
  const searchingStatusEl = document.getElementById('cctv-searching-status');

  // Update Draggable Node Position
  function updateNodeDOMPosition() {
    dragNode.style.left = `${camState.x}px`;
    dragNode.style.top = `${camState.y}px`;
    if (headHousing) {
      headHousing.style.transform = `rotate(${camState.angle}deg)`;
    }
  }
  updateNodeDOMPosition();

  // Mouse / Touch Dragging Events
  function onPointerDown(e) {
    camState.isDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = dragNode.getBoundingClientRect();
    camState.dragOffsetX = clientX - rect.left;
    camState.dragOffsetY = clientY - rect.top;
  }

  function onPointerMove(e) {
    if (!camState.isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const stageRect = roadStage.getBoundingClientRect();

    let newX = clientX - stageRect.left - camState.dragOffsetX;
    let newY = clientY - stageRect.top - camState.dragOffsetY;

    newX = Math.max(10, Math.min(stageRect.width - 60, newX));
    newY = Math.max(10, Math.min(stageRect.height * 0.45, newY));

    camState.x = newX;
    camState.y = newY;
    updateNodeDOMPosition();
  }

  function onPointerUp() {
    camState.isDragging = false;
  }

  dragNode.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  dragNode.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  if (panSlider) {
    panSlider.addEventListener('input', (e) => {
      camState.angle = parseFloat(e.target.value);
      updateNodeDOMPosition();
    });
  }

  function aimAtVehicleIndex(index) {
    const v = vehicles[index];
    if (!v) return;
    const stageW = roadStage.clientWidth || 600;
    const targetX = v.relX * stageW;
    camState.x = Math.max(10, Math.min(stageW - 60, targetX - 25));
    camState.y = 30;
    camState.angle = 0;
    if (panSlider) panSlider.value = 0;
    updateNodeDOMPosition();
  }

  vehicles.forEach((v, idx) => {
    if (v.presetBtn) v.presetBtn.addEventListener('click', () => aimAtVehicleIndex(idx));
    if (v.tabBtn) v.tabBtn.addEventListener('click', () => aimAtVehicleIndex(idx));
  });

  let scanLaserY = 0;

  function loop() {
    try {
      const rw = roadCanvas.width;
      const rh = roadCanvas.height;
      ctxRoad.clearRect(0, 0, rw, rh);

      // Dark Road Background
      ctxRoad.fillStyle = '#050a16';
      ctxRoad.fillRect(0, 0, rw, rh);

      // Distant City Skyline
      ctxRoad.fillStyle = '#02050e';
      ctxRoad.fillRect(0, rh * 0.4, rw, rh * 0.1);

      // Road Asphalt
      ctxRoad.beginPath();
      ctxRoad.rect(0, rh * 0.5, rw, rh * 0.5);
      ctxRoad.fillStyle = '#0a101f';
      ctxRoad.fill();

      // Road Lane Markings
      ctxRoad.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctxRoad.lineWidth = 2;
      ctxRoad.setLineDash([15, 15]);
      ctxRoad.beginPath();
      ctxRoad.moveTo(0, rh * 0.72);
      ctxRoad.lineTo(rw, rh * 0.72);
      ctxRoad.stroke();
      ctxRoad.setLineDash([]);

      // Calculate Camera Cone Geometry (Left Panel)
      const camCenterX = camState.x + 25;
      const camCenterY = camState.y + 25;
      const coneAngleRad = (camState.angle + 90) * (Math.PI / 180);
      const coneFov = 0.5;
      const coneLength = rh * 0.7;

      const coneLeftX = camCenterX + Math.cos(coneAngleRad - coneFov / 2) * coneLength;
      const coneLeftY = camCenterY + Math.sin(coneAngleRad - coneFov / 2) * coneLength;
      const coneRightX = camCenterX + Math.cos(coneAngleRad + coneFov / 2) * coneLength;
      const coneRightY = camCenterY + Math.sin(coneAngleRad + coneFov / 2) * coneLength;

      // Draw Translucent Cyan Viewing Cone
      ctxRoad.save();
      ctxRoad.beginPath();
      ctxRoad.moveTo(camCenterX, camCenterY);
      ctxRoad.lineTo(coneLeftX, coneLeftY);
      ctxRoad.lineTo(coneRightX, coneRightY);
      ctxRoad.closePath();

      const safeConeLength = Math.max(15, coneLength);
      const coneGrad = ctxRoad.createRadialGradient(
        camCenterX, camCenterY, 5,
        camCenterX, camCenterY + 15, safeConeLength
      );
      coneGrad.addColorStop(0, 'rgba(0, 240, 255, 0.45)');
      coneGrad.addColorStop(1, 'rgba(0, 240, 255, 0.05)');
      ctxRoad.fillStyle = coneGrad;
      ctxRoad.fill();
      ctxRoad.strokeStyle = 'rgba(0, 240, 255, 0.5)';
      ctxRoad.lineWidth = 1;
      ctxRoad.stroke();
      ctxRoad.restore();

      // Check Detection: Test which vehicle lies inside the camera cone
      let detectedVehicle = null;

      vehicles.forEach(v => {
        const vx = v.relX * rw;
        const vy = v.relY * rh;
        const carW = 56;
        const carH = 26;

        ctxRoad.fillStyle = '#0f172a';
        ctxRoad.strokeStyle = 'rgba(0, 240, 255, 0.7)';
        ctxRoad.lineWidth = 1.5;
        ctxRoad.beginPath();
        if (typeof ctxRoad.roundRect === 'function') {
          ctxRoad.roundRect(vx - carW / 2, vy - carH / 2, carW, carH, 5);
        } else {
          ctxRoad.rect(vx - carW / 2, vy - carH / 2, carW, carH);
        }
        ctxRoad.fill();
        ctxRoad.stroke();

        ctxRoad.fillStyle = 'rgba(0, 240, 255, 0.6)';
        ctxRoad.fillRect(vx + carW / 2 - 2, vy - 8, 4, 4);
        ctxRoad.fillRect(vx + carW / 2 - 2, vy + 4, 4, 4);

        ctxRoad.fillStyle = '#FF4757';
        ctxRoad.fillRect(vx - carW / 2 - 2, vy - 8, 4, 4);
        ctxRoad.fillRect(vx - carW / 2 - 2, vy + 4, 4, 4);

        const dx = vx - camCenterX;
        const dy = vy - camCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angleToCar = Math.atan2(dy, dx);
        let diffAngle = angleToCar - coneAngleRad;
        while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;
        while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;

        if (dist < coneLength + 40 && Math.abs(diffAngle) < coneFov / 1.5) {
          detectedVehicle = v;

          ctxRoad.strokeStyle = '#00F0FF';
          ctxRoad.lineWidth = 2;
          ctxRoad.strokeRect(vx - carW / 2 - 6, vy - carH / 2 - 6, carW + 12, carH + 12);

          ctxRoad.fillStyle = '#00F0FF';
          ctxRoad.font = 'bold 9px "JetBrains Mono", monospace';
          ctxRoad.fillText(v.camId, vx - carW / 2 - 6, vy - carH / 2 - 10);
        }
      });

      // ----------------------------------------------------
      // 2. RENDER RIGHT PANEL: LIVE CONTROL ROOM MONITOR
      // ----------------------------------------------------
      const mw = monitorCanvas.width;
      const mh = monitorCanvas.height;
      ctxMonitor.clearRect(0, 0, mw, mh);

      ctxMonitor.fillStyle = '#030712';
      ctxMonitor.fillRect(0, 0, mw, mh);

      if (detectedVehicle) {
        const v = detectedVehicle;

        ctxMonitor.fillStyle = '#081022';
        ctxMonitor.fillRect(0, mh * 0.4, mw, mh * 0.6);

        ctxMonitor.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        ctxMonitor.lineWidth = 2;
        ctxMonitor.setLineDash([12, 12]);
        ctxMonitor.beginPath();
        ctxMonitor.moveTo(0, mh * 0.7);
        ctxMonitor.lineTo(mw, mh * 0.7);
        ctxMonitor.stroke();
        ctxMonitor.setLineDash([]);

        const mCarX = mw * 0.45;
        const mCarY = mh * 0.65;
        const mCarW = 110;
        const mCarH = 50;

        const hGrad = ctxMonitor.createLinearGradient(mCarX + mCarW, mCarY, mCarX + mCarW + 120, mCarY);
        hGrad.addColorStop(0, 'rgba(0, 240, 255, 0.5)');
        hGrad.addColorStop(1, 'transparent');
        ctxMonitor.beginPath();
        ctxMonitor.moveTo(mCarX + mCarW, mCarY - 12);
        ctxMonitor.lineTo(mCarX + mCarW + 120, mCarY - 35);
        ctxMonitor.lineTo(mCarX + mCarW + 120, mCarY + 35);
        ctxMonitor.lineTo(mCarX + mCarW, mCarY + 12);
        ctxMonitor.fillStyle = hGrad;
        ctxMonitor.fill();

        ctxMonitor.fillStyle = '#0f172a';
        ctxMonitor.strokeStyle = '#00F0FF';
        ctxMonitor.lineWidth = 2;
        ctxMonitor.beginPath();
        if (typeof ctxMonitor.roundRect === 'function') {
          ctxMonitor.roundRect(mCarX, mCarY - mCarH / 2, mCarW, mCarH, 8);
        } else {
          ctxMonitor.rect(mCarX, mCarY - mCarH / 2, mCarW, mCarH);
        }
        ctxMonitor.fill();
        ctxMonitor.stroke();

        ctxMonitor.fillStyle = 'rgba(0, 240, 255, 0.3)';
        ctxMonitor.fillRect(mCarX + 30, mCarY - mCarH / 2 + 6, 40, mCarH - 12);

        const mBoxW = mCarW + 24;
        const mBoxH = mCarH + 24;
        const mBoxX = mCarX - 12;
        const mBoxY = mCarY - mCarH / 2 - 12;

        ctxMonitor.strokeStyle = '#00F0FF';
        ctxMonitor.lineWidth = 2;
        ctxMonitor.shadowColor = '#00F0FF';
        ctxMonitor.shadowBlur = 12;
        ctxMonitor.strokeRect(mBoxX, mBoxY, mBoxW, mBoxH);
        ctxMonitor.shadowBlur = 0;

        scanLaserY = (scanLaserY + 2.5) % Math.max(1, mBoxH);
        ctxMonitor.strokeStyle = '#00E676';
        ctxMonitor.lineWidth = 2;
        ctxMonitor.beginPath();
        ctxMonitor.moveTo(mBoxX, mBoxY + scanLaserY);
        ctxMonitor.lineTo(mBoxX + mBoxW, mBoxY + scanLaserY);
        ctxMonitor.stroke();

        if (anprCardEl) anprCardEl.classList.remove('hidden');
        if (searchingStatusEl) searchingStatusEl.classList.add('hidden');

        if (camTitleEl) camTitleEl.textContent = `${v.camId} // ${v.location.toUpperCase()}`;
        if (hudPlateEl) hudPlateEl.textContent = v.plate;
        if (hudCamEl) hudCamEl.textContent = v.camId;
        if (hudTimeEl) hudTimeEl.textContent = v.time;
        if (hudLocEl) hudLocEl.textContent = v.location;
        if (hudSpeedEl) hudSpeedEl.textContent = v.speed;

        vehicles.forEach(otherV => {
          const isMatch = (otherV.id === v.id);
          if (otherV.presetBtn) otherV.presetBtn.classList.toggle('active', isMatch);
          if (otherV.tabBtn) otherV.tabBtn.classList.toggle('active', isMatch);
          if (otherV.nodeEl) {
            otherV.nodeEl.classList.toggle('active', isMatch);
            otherV.nodeEl.style.opacity = isMatch ? '1' : '0.45';
            otherV.nodeEl.style.borderColor = isMatch ? 'var(--cyan-primary)' : 'var(--border-cyan)';
            otherV.nodeEl.style.boxShadow = isMatch ? '0 0 25px rgba(0, 240, 255, 0.4)' : 'none';
          }
        });

      } else {
        ctxMonitor.fillStyle = '#040814';
        ctxMonitor.fillRect(0, mh * 0.45, mw, mh * 0.55);

        ctxMonitor.strokeStyle = 'rgba(0, 240, 255, 0.08)';
        ctxMonitor.lineWidth = 1;
        for (let x = 0; x < mw; x += 30) {
          ctxMonitor.beginPath();
          ctxMonitor.moveTo(x, mh * 0.45);
          ctxMonitor.lineTo(x, mh);
          ctxMonitor.stroke();
        }

        if (anprCardEl) anprCardEl.classList.add('hidden');
        if (searchingStatusEl) searchingStatusEl.classList.remove('hidden');
        if (camTitleEl) camTitleEl.textContent = 'CAM-FEED // FOV SCANNING';

        vehicles.forEach(otherV => {
          if (otherV.presetBtn) otherV.presetBtn.classList.remove('active');
          if (otherV.tabBtn) otherV.tabBtn.classList.remove('active');
          if (otherV.nodeEl) {
            otherV.nodeEl.classList.remove('active');
            otherV.nodeEl.style.opacity = '0.6';
            otherV.nodeEl.style.borderColor = 'var(--border-cyan)';
            otherV.nodeEl.style.boxShadow = 'none';
          }
        });
      }
    } catch (e) {}

    requestAnimationFrame(loop);
  }

  loop();
}

/* ==========================================================================
   3. ROLE-BASED ACCESS & PRIVACY SELECTOR
   ========================================================================== */
function initRoleTabs() {
  const roleTabs = document.querySelectorAll('.role-tab');
  const roleTitle = document.getElementById('role-title');
  const roleDesc = document.getElementById('role-desc');
  const rolePermissions = document.getElementById('role-permissions');

  if (!roleTabs.length) return;

  const roleData = {
    public: {
      title: 'Public Access Tier',
      desc: 'Provides aggregated traffic density, general congestion indicators, and average corridor travel times. License plates and vehicle identities are strictly masked and anonymized.',
      permissions: [
        { text: 'Real-time City Traffic Map', allowed: true },
        { text: 'Aggregated Speed Heatmaps', allowed: true },
        { text: 'Vehicle Plate Search (Blocked)', allowed: false },
        { text: 'Individual Route Playback (Blocked)', allowed: false }
      ]
    },
    authorities: {
      title: 'Traffic Authorities & Police',
      desc: 'Full access to vehicle-level ANPR recognition, hotlist notification alerts, cross-camera journey reconstruction, and speed violation logs.',
      permissions: [
        { text: 'Real-time City Traffic Map', allowed: true },
        { text: 'High-Precision ANPR Search', allowed: true },
        { text: 'Cross-Camera Journey Reconstruction', allowed: true },
        { text: 'Instant Wanted/Stolen Hotlist Alerts', allowed: true }
      ]
    },
    admin: {
      title: 'System Administrator',
      desc: 'Complete control over camera node onboarding, AI model deployment thresholds, user role provisioning, data retention policies, and security audit logs.',
      permissions: [
        { text: 'Camera Stream Config & RTSP Provisioning', allowed: true },
        { text: 'Role-Based Access Management (RBAC)', allowed: true },
        { text: 'AI OCR Model & Edge Diagnostics', allowed: true },
        { text: 'Audit Logging & Compliance Controls', allowed: true }
      ]
    }
  };

  roleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      roleTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const roleKey = tab.getAttribute('data-role');
      const data = roleData[roleKey];

      if (data && roleTitle && roleDesc && rolePermissions) {
        roleTitle.textContent = data.title;
        roleDesc.textContent = data.desc;

        rolePermissions.innerHTML = data.permissions.map(p => `
          <li style="display: flex; align-items: center; gap: 8px; color: ${p.allowed ? 'var(--text-main)' : 'var(--text-dim)'};">
            <i data-lucide="${p.allowed ? 'check' : 'x'}" color="${p.allowed ? '#00E676' : '#ff4757'}" size="16"></i>
            ${p.text}
          </li>
        `).join('');

        if (window.lucide && typeof lucide.createIcons === 'function') {
          lucide.createIcons();
        }
      }
    });
  });
}

/* ==========================================================================
   4. VIDEO DEMO MODAL HANDLER
   ========================================================================== */
function initVideoModal() {
  const trigger = document.getElementById('demo-screen-trigger');
  const modal = document.getElementById('video-modal');
  const closeBtn = document.getElementById('modal-close-btn');

  if (!trigger || !modal) return;

  trigger.addEventListener('click', () => {
    modal.classList.add('active');
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
}

/* ==========================================================================
   5. CCTV CAMERA NETWORK NAVIGATION ENGINE
   ========================================================================== */
function initCommandRailNavbar() {
  const nodeItems = document.querySelectorAll('.cam-node-item');
  const activeLine = document.getElementById('cam-rail-active-line');
  const dataPulse = document.getElementById('cam-rail-data-pulse');
  const launchDemoBtn = document.getElementById('btn-launch-demo');

  if (!nodeItems.length) return;

  const sections = [];
  nodeItems.forEach((item, index) => {
    const sectionId = item.getAttribute('data-section');
    const el = document.getElementById(sectionId);
    if (el) {
      sections.push({ id: sectionId, el: el, item: item, index: index });
    }
  });

  let currentActiveIndex = -1;

  function updateCameraRail() {
    if (!sections.length) return;
    const scrollY = window.scrollY + 220;
    let newIdx = 0;

    sections.forEach((sec, idx) => {
      const top = sec.el.offsetTop;
      const height = sec.el.offsetHeight;
      if (scrollY >= top && scrollY < top + height) {
        newIdx = idx;
      }
    });

    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
      newIdx = sections.length - 1;
    }

    if (newIdx !== currentActiveIndex) {
      const prevIdx = currentActiveIndex;
      currentActiveIndex = newIdx;

      sections.forEach((sec, idx) => {
        if (idx === currentActiveIndex) {
          sec.item.classList.add('active');
          if (prevIdx !== -1) {
            sec.item.classList.add('transitioning');
            setTimeout(() => sec.item.classList.remove('transitioning'), 450);
          }
        } else {
          sec.item.classList.remove('active');
        }
      });

      const totalCount = sections.length;
      if (totalCount > 1 && activeLine && dataPulse) {
        const percentage = (currentActiveIndex / (totalCount - 1)) * 100;
        activeLine.style.width = `${percentage}%`;
        dataPulse.style.left = `${percentage}%`;
        
        dataPulse.classList.remove('pulse-fire');
        void dataPulse.offsetWidth;
        dataPulse.classList.add('pulse-fire');
      }
    }
  }

  window.addEventListener('scroll', updateCameraRail, { passive: true });
  updateCameraRail();

  nodeItems.forEach((item, idx) => {
    item.addEventListener('mouseenter', () => {
      if (dataPulse && sections.length > 1) {
        const totalCount = sections.length;
        const percentage = (idx / (totalCount - 1)) * 100;
        dataPulse.style.left = `${percentage}%`;
      }
    });

    item.addEventListener('mouseleave', () => {
      if (dataPulse && currentActiveIndex >= 0 && sections.length > 1) {
        const totalCount = sections.length;
        const percentage = (currentActiveIndex / (totalCount - 1)) * 100;
        dataPulse.style.left = `${percentage}%`;
      }
    });

    const link = item.querySelector('a');
    if (link) {
      link.addEventListener('click', (e) => {
        const targetId = item.getAttribute('data-section');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
          if (history.pushState) {
            history.pushState(null, null, `#${targetId}`);
          } else {
            location.hash = `#${targetId}`;
          }
        }
      });
    }
  });

  if (launchDemoBtn) {
    launchDemoBtn.addEventListener('click', (e) => {
      const videoModal = document.getElementById('video-modal');
      if (videoModal) {
        videoModal.classList.add('active');
      }
    });
  }
}

/* ==========================================================================
   6. CINEMATIC 5-SECOND TRAFIQ SYSTEM ACTIVATION EXPERIENCE
   ========================================================================== */
function initSystemBootSequence() {
  const overlay = document.getElementById('system-boot-overlay');
  const switchBox = document.getElementById('boot-switch-container');
  const powerSwitch = document.getElementById('system-power-switch');
  const stageDisplay = document.getElementById('boot-stage-display');
  const canvas = document.getElementById('boot-sequence-canvas');
  const phaseTitle = document.getElementById('boot-phase-title');
  const terminalLog = document.getElementById('boot-terminal-log');
  const statusPill = document.getElementById('boot-status-pill');
  const statusText = document.getElementById('boot-status-text');

  if (!overlay) return;

  function hideOverlay() {
    if (overlay) {
      overlay.classList.add('boot-complete');
      overlay.classList.add('hidden-instant');
      overlay.style.display = 'none';
      overlay.style.pointerEvents = 'none';
    }
  }

  // Global Safety Failsafe: Hide overlay if stuck longer than 20 seconds
  const globalSafety = setTimeout(() => {
    if (overlay && !overlay.classList.contains('hidden-instant')) {
      console.warn('[TrafIQ] System boot overlay safety timeout triggered.');
      hideOverlay();
    }
  }, 20000);

  const isAlreadyBooted = safeGetStorage('trafiq_system_booted') === 'true';

  let isReducedMotion = false;
  try {
    isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {
    isReducedMotion = false;
  }

  if (isAlreadyBooted || isReducedMotion) {
    clearTimeout(globalSafety);
    hideOverlay();
    return;
  }

  if (!powerSwitch) {
    clearTimeout(globalSafety);
    hideOverlay();
    return;
  }

  powerSwitch.checked = false;
  let isBooting = false;

  powerSwitch.addEventListener('change', () => {
    if (!powerSwitch.checked || isBooting) return;
    isBooting = true;

    if (statusPill) {
      statusPill.classList.remove('offline');
      statusPill.style.background = 'rgba(0, 240, 255, 0.15)';
      statusPill.style.borderColor = 'var(--cyan-primary)';
      statusPill.style.color = 'var(--cyan-primary)';
    }
    if (statusText) statusText.textContent = '● POWERING ON...';

    // Timeline safety timer (7.5 seconds after activation)
    const bootSafety = setTimeout(() => {
      safeSetStorage('trafiq_system_booted', 'true');
      clearTimeout(globalSafety);
      hideOverlay();
    }, 7500);

    setTimeout(() => {
      if (switchBox) switchBox.classList.add('hidden');
      if (stageDisplay) stageDisplay.classList.remove('hidden');
      try {
        runBootTimeline(() => {
          clearTimeout(bootSafety);
          clearTimeout(globalSafety);
        });
      } catch (err) {
        console.error('[TrafIQ] Error running boot timeline:', err);
        clearTimeout(bootSafety);
        clearTimeout(globalSafety);
        hideOverlay();
      }
    }, 350);
  });

  function runBootTimeline(onDone) {
    if (!canvas) {
      hideOverlay();
      if (onDone) onDone();
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      hideOverlay();
      if (onDone) onDone();
      return;
    }

    function resize() {
      canvas.width = Math.max(1, window.innerWidth);
      canvas.height = Math.max(1, window.innerHeight);
    }
    resize();
    window.addEventListener('resize', resize);

    const startTime = performance.now();
    const duration = 5200;

    function appendLog(lineText, isOk = true) {
      if (!terminalLog) return;
      const line = document.createElement('div');
      line.className = 'log-line';
      line.innerHTML = `<span>${lineText}</span><span class="${isOk ? 'log-ok' : ''}">${isOk ? '[OK]' : '[PENDING]'}</span>`;
      terminalLog.appendChild(line);
      terminalLog.scrollTop = terminalLog.scrollHeight;
    }

    setTimeout(() => appendLog('SYS_CORE_INITIALIZATION'), 300);
    setTimeout(() => appendLog('RTSP_CAM_GRID_MESH (5 NODES)'), 1200);
    setTimeout(() => appendLog('ANPR_YOLO_PARSER_v2.4'), 2300);
    setTimeout(() => appendLog('VEHICLE_CORRELATION_GRAPH'), 2800);
    setTimeout(() => appendLog('TRAFFIC_ANALYTICS_TELEMETRY'), 3300);
    setTimeout(() => appendLog('SMART_CITY_GRID_FEDERATION'), 4100);

    let isFinished = false;

    function renderBoot(now) {
      if (isFinished) return;
      try {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        // Phase 0 - 1.0s: Power Signal Line
        if (elapsed < 1000) {
          if (phaseTitle) phaseTitle.textContent = 'INITIALIZING TRAFIQ CORE...';
          const lineW = Math.min(w * 0.7, (elapsed / 1000) * w * 0.7);

          ctx.beginPath();
          ctx.moveTo(cx - lineW / 2, cy);
          ctx.lineTo(cx + lineW / 2, cy);
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#00F0FF';
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.shadowBlur = 0;

          const pX = cx - lineW / 2 + (elapsed / 1000) * lineW;
          ctx.beginPath();
          ctx.arc(pX, cy, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
        // Phase 1.0s - 2.2s: Camera Network Nodes Connection
        else if (elapsed >= 1000 && elapsed < 2200) {
          if (phaseTitle) phaseTitle.textContent = 'CONNECTING CAMERA NETWORK...';

          const camCount = 5;
          const spacing = (w * 0.7) / (camCount - 1);
          const startX = cx - (w * 0.7) / 2;

          ctx.beginPath();
          ctx.moveTo(startX, cy);
          ctx.lineTo(startX + w * 0.7, cy);
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          const nodeRatio = (elapsed - 1000) / 1200;
          const visibleNodes = Math.floor(nodeRatio * camCount) + 1;

          for (let i = 0; i < visibleNodes; i++) {
            const nx = startX + i * spacing;
            ctx.beginPath();
            ctx.arc(nx, cy, 12, 0, Math.PI * 2);
            ctx.fillStyle = '#050a18';
            ctx.strokeStyle = '#00F0FF';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(nx, cy, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#00F0FF';
            ctx.fill();

            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillStyle = '#00F0FF';
            ctx.fillText(`CAM-0${i + 1}`, nx - 16, cy - 18);
          }
        }
        // Phase 2.2s - 3.4s: AI Engine & ANPR Plate Lock
        else if (elapsed >= 2200 && elapsed < 3400) {
          if (phaseTitle) phaseTitle.textContent = 'AI ANPR RECOGNITION LOCK...';

          const boxSize = 140;
          ctx.strokeStyle = '#00F0FF';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#00F0FF';
          ctx.shadowBlur = 15;
          ctx.strokeRect(cx - boxSize / 2, cy - boxSize / 2, boxSize, boxSize);
          ctx.shadowBlur = 0;

          const scanY = cy - boxSize / 2 + (((elapsed - 2200) / 1200) * boxSize) % boxSize;
          ctx.strokeStyle = '#00E676';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx - boxSize / 2, scanY);
          ctx.lineTo(cx + boxSize / 2, scanY);
          ctx.stroke();

          ctx.fillStyle = '#fcf8e3';
          ctx.fillRect(cx - 60, cy - 12, 120, 24);
          ctx.fillStyle = '#030712';
          ctx.font = 'bold 12px "JetBrains Mono", monospace';
          ctx.fillText('MH 12 AB 4921', cx - 48, cy + 4);
        }
        // Phase 3.4s - 4.5s: Intelligence Mesh Matrix
        else if (elapsed >= 3400 && elapsed < 4500) {
          if (phaseTitle) phaseTitle.textContent = 'TRAFFIC INTELLIGENCE NETWORK CONNECTED';

          const meshRadius = Math.min(w, h) * 0.35 * ((elapsed - 3400) / 1100);
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            const nx = cx + Math.cos(a) * meshRadius;
            const ny = cy + Math.sin(a) * meshRadius;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(nx, ny);
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(nx, ny, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#00F0FF';
            ctx.fill();
          }
        }
        // Phase 4.5s - 5.2s: Reveal TrafIQ System
        else if (elapsed >= 4500) {
          if (phaseTitle) phaseTitle.textContent = '● TRAFIQ SYSTEM ONLINE';
        }

        if (progress < 1) {
          requestAnimationFrame(renderBoot);
        } else {
          isFinished = true;
          overlay.classList.add('boot-complete');
          safeSetStorage('trafiq_system_booted', 'true');
          setTimeout(() => {
            hideOverlay();
            if (onDone) onDone();
          }, 600);
        }
      } catch (err) {
        console.error('[TrafIQ] Error during renderBoot:', err);
        isFinished = true;
        hideOverlay();
        if (onDone) onDone();
      }
    }

    requestAnimationFrame(renderBoot);
  }
}
