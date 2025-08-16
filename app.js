'use strict';

/* app.js - Full revised script for Frame Editor
   Features:
   - Upload & auto-fit image
   - Drag with mouse or single-finger touch
   - Pinch-to-zoom (two-finger) on mobile
   - Wheel zoom on desktop (centers on cursor)
   - Resize handle (bottom-right)
   - Rotate (90° steps) / Reset
   - Download export as 1080x1080 PNG (includes image + frame)
*/

// Elements (match IDs/classes used in the HTML)
const upload = document.getElementById('upload');
const imgContainer = document.getElementById('imgContainer'); // div wrapper around the image
const userImage = document.getElementById('userImage');       // actual <img>
const resizer = document.getElementById('resizer');
const frameImage = document.getElementById('frameImage');
const templates = document.querySelectorAll('.template');
const editor = document.getElementById('editor');
const zoomSlider = document.getElementById('zoomSlider');     // optional
const rotateBtn = document.getElementById('rotateBtn');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');
const exportCanvas = document.getElementById('exportCanvas'); // optional hidden canvas

// State
let baseWidth = 300, baseHeight = 200; // base "intrinsic" drawn size in px (before css scale)
let posX = 0, posY = 0;                // translation in px relative to editor center
let scale = 1;                         // css scale (1 = 100%)
let rotation = 0;                      // degrees
let dragging = false;
let resizing = false;
let pointerId = null;
let start = { x: 0, y: 0, posX: 0, posY: 0, baseW: 0, baseH: 0 };
let lastTouchDistance = 0;

// Helper: apply CSS transform & size
function updateTransform() {
  // set explicit width/height for the container (these are the base dimensions)
  imgContainer.style.width = Math.round(baseWidth) + 'px';
  imgContainer.style.height = Math.round(baseHeight) + 'px';

  // place container at editor center then translate by posX,posY
  // Using translate(-50%,-50%) to center by CSS origin then move by posX/posY
  imgContainer.style.transform =
    `translate(-50%,-50%) translate(${posX}px, ${posY}px) rotate(${rotation}deg) scale(${scale})`;
}

// Fit uploaded image to editor at load time (keeps it manageable)
function fitToEditor(nw, nh) {
  const maxDim = 800; // leave some margin inside 1080
  let w = nw, h = nh;
  if (w > maxDim || h > maxDim) {
    const s = Math.min(maxDim / w, maxDim / h);
    w = Math.round(w * s);
    h = Math.round(h * s);
  }
  baseWidth = w;
  baseHeight = h;
  posX = 0;
  posY = 0;
  scale = 1;
  rotation = 0;
  if (zoomSlider) zoomSlider.value = String(Math.round(scale * 100));
  updateTransform();
}

// --- Upload handler ---
upload.addEventListener('change', (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    userImage.src = e.target.result;
    // wait for image to load natural dimensions
    userImage.onload = () => {
      fitToEditor(userImage.naturalWidth, userImage.naturalHeight);

      // center the imgContainer visually in the editor
      // editor might be responsive; compute center offsets using bounding rect
      const editorRect = editor.getBoundingClientRect();
      // posX,posY are already 0 so the transform centers it — updateTransform will use those
      updateTransform();
    };
  };
  reader.readAsDataURL(file);
});

// --- Template selection ---
templates.forEach(t => {
  t.addEventListener('click', () => {
    // template may use data-src or src attribute
    const src = t.getAttribute('data-src') || t.src || t.getAttribute('src');
    if (!src) return;
    frameImage.src = src;
    // mark active
    templates.forEach(x => x.style.borderColor = 'transparent');
    t.style.borderColor = '#111827';
  });
});

// --- POINTER (mouse & stylus) dragging for imgContainer ---
// Use pointer events for reliable desktop behavior
imgContainer.addEventListener('pointerdown', (e) => {
  // if started on the resizer, ignore here (resizer has its own pointer handlers)
  if (e.target === resizer) return;

  e.preventDefault();
  imgContainer.setPointerCapture(e.pointerId);
  pointerId = e.pointerId;
  dragging = true;

  start.x = e.clientX;
  start.y = e.clientY;
  start.posX = posX;
  start.posY = posY;
  imgContainer.classList.add('dragging');
});

document.addEventListener('pointermove', (e) => {
  if (!dragging || e.pointerId !== pointerId) return;
  const dx = e.clientX - start.x;
  const dy = e.clientY - start.y;
  posX = start.posX + dx;
  posY = start.posY + dy;
  updateTransform();
});

document.addEventListener('pointerup', (e) => {
  if (dragging && e.pointerId === pointerId) {
    dragging = false;
    try { imgContainer.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    imgContainer.classList.remove('dragging');
    pointerId = null;
  }
});
document.addEventListener('pointercancel', () => {
  dragging = false;
  imgContainer.classList.remove('dragging');
  pointerId = null;
});

// --- Resizer (pointer events) ---
resizer.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  resizer.setPointerCapture(e.pointerId);
  pointerId = e.pointerId;
  resizing = true;
  start.x = e.clientX;
  start.y = e.clientY;
  start.baseW = baseWidth;
  start.baseH = baseHeight;
});

resizer.addEventListener('pointermove', (e) => {
  if (!resizing || e.pointerId !== pointerId) return;
  const dx = e.clientX - start.x;
  const dy = e.clientY - start.y;
  // naive new dims
  let newW = Math.max(40, start.baseW + dx);
  let newH = Math.max(40, start.baseH + dy);

  // maintain original aspect ratio of current base size
  const aspect = start.baseW / start.baseH;
  if (newW / newH > aspect) {
    newH = Math.round(newW / aspect);
  } else {
    newW = Math.round(newH * aspect);
  }
  baseWidth = newW;
  baseHeight = newH;
  updateTransform();
});

resizer.addEventListener('pointerup', (e) => {
  if (resizing && e.pointerId === pointerId) {
    resizing = false;
    try { resizer.releasePointerCapture(e.pointerId); } catch (err) {}
    pointerId = null;
  }
});
resizer.addEventListener('pointercancel', () => { resizing = false; pointerId = null; });

// --- TOUCH: single-finger drag + two-finger pinch zoom ---
// We use touch events for pinch detection (pointer events support multitouch but is more verbose)
imgContainer.addEventListener('touchstart', (e) => {
  // prevent page scroll while interacting with editor
  e.preventDefault();
  if (e.touches.length === 1) {
    // single-finger drag
    const t = e.touches[0];
    dragging = true;
    start.x = t.clientX;
    start.y = t.clientY;
    start.posX = posX;
    start.posY = posY;
  } else if (e.touches.length === 2) {
    // pinch start
    lastTouchDistance = getDistance(e.touches[0], e.touches[1]);
  }
}, { passive: false });

imgContainer.addEventListener('touchmove', (e) => {
  // prevent page scroll
  e.preventDefault();

  if (e.touches.length === 1 && dragging) {
    const t = e.touches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    posX = start.posX + dx;
    posY = start.posY + dy;
    updateTransform();
  } else if (e.touches.length === 2) {
    // pinch: compute scale delta
    const d = getDistance(e.touches[0], e.touches[1]);
    if (lastTouchDistance) {
      const delta = d - lastTouchDistance;
      // change scale proportional to delta (tweak sensitivity)
      const sensitivity = 0.005;
      scale = clamp(scale + delta * sensitivity, 0.1, 5);
      if (zoomSlider) zoomSlider.value = String(Math.round(scale * 100));
      updateTransform();
    }
    lastTouchDistance = d;
  }
}, { passive: false });

imgContainer.addEventListener('touchend', (e) => {
  // if touches < 2 reset pinch
  if (e.touches.length < 2) lastTouchDistance = 0;
  // if no more touches, end dragging
  if (e.touches.length === 0) dragging = false;
}, { passive: false });

// helper distance between two touch points
function getDistance(t1, t2) {
  const dx = t2.clientX - t1.clientX;
  const dy = t2.clientY - t1.clientY;
  return Math.sqrt(dx*dx + dy*dy);
}

// --- Wheel zoom (desktop) ---
// Zoom centered on mouse pointer: we convert pointer pos to image-local coordinates then adjust posX/posY to keep mouse point stable
editor.addEventListener('wheel', (e) => {
  // only when interacting with editor — prevent page scroll
  if (!userImageHasSource()) return;
  e.preventDefault();

  // get mouse coordinates relative to editor top-left
  const rect = editor.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const prevScale = scale;
  const zoomFactor = 0.12; // feel
  if (e.deltaY < 0) {
    scale = clamp(scale * (1 + zoomFactor), 0.05, 8);
  } else {
    scale = clamp(scale * (1 - zoomFactor), 0.05, 8);
  }
  // adjust posX/posY so the point under the cursor remains under the cursor after scale change
  // Compute image-space coordinates of the mouse relative to editor center:
  // imageCenterOnCanvas = editorCenter + posX,posY
  const editorCenterX = rect.width / 2;
  const editorCenterY = rect.height / 2;
  // vector from image center to mouse
  const vx = mouseX - editorCenterX - posX;
  const vy = mouseY - editorCenterY - posY;
  // After scaling, the vector length should change proportionally; compute delta and adjust pos
  const scaleRatio = scale / prevScale;
  posX -= (vx * (scaleRatio - 1));
  posY -= (vy * (scaleRatio - 1));

  if (zoomSlider) zoomSlider.value = String(Math.round(scale * 100));
  updateTransform();
}, { passive: false });

// --- Zoom slider (optional) ---
if (zoomSlider) {
  zoomSlider.addEventListener('input', (e) => {
    const v = Number(e.target.value);
    scale = clamp(v / 100, 0.05, 8);
    updateTransform();
  });
}

// --- Rotate / Reset / Download ---
if (rotateBtn) {
  rotateBtn.addEventListener('click', () => {
    rotation = (rotation + 90) % 360;
    updateTransform();
  });
}
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    if (!userImageHasSource()) return;
    fitToEditor(userImage.naturalWidth, userImage.naturalHeight);
  });
}
if (downloadBtn) {
  downloadBtn.addEventListener('click', () => {
    // use existing exportCanvas or create a temporary one
    let canvas = exportCanvas;
    let created = false;
    if (!canvas) {
      canvas = document.createElement('canvas');
      created = true;
    }
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // clear and paint white background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw uploaded image with current transform
    if (userImageHasSource()) {
      // compute the center point on canvas (editor center) and add posX,posY
      const centerX = canvas.width / 2 + posX;
      const centerY = canvas.height / 2 + posY;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.scale(scale, scale);
      // draw image centered using baseWidth/baseHeight
      ctx.drawImage(userImage, -baseWidth / 2, -baseHeight / 2, baseWidth, baseHeight);
      ctx.restore();
    }

    // draw frame overlay stretched to full 1080
    if (frameImage && frameImage.src) {
      // If the frame image hasn't loaded yet, this still attempts draw; usually frame is loaded
      ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
    }

    // trigger download
    const link = document.createElement('a');
    link.download = 'frame-1080.png';
    link.href = canvas.toDataURL('image/png');
    link.click();

    if (created) {
      // nothing to clean
    }
  });
}

// small helper
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function userImageHasSource() {
  return userImage && userImage.src && userImage.src.length > 0;
}

// initialize transform visually
updateTransform();
