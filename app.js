'use strict';
// Elements
const upload = document.getElementById('upload');
const imgContainer = document.getElementById('imgContainer');
const userImage = document.getElementById('userImage');
const resizer = document.getElementById('resizer');
const frameImage = document.getElementById('frameImage');
const zoomSlider = document.getElementById('zoomSlider');
const rotateBtn = document.getElementById('rotateBtn');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');
const templates = document.querySelectorAll('.template');
const editor = document.getElementById('editor');
const exportCanvas = document.getElementById('exportCanvas');

// State (base size = container size before CSS scale)
let baseWidth = 300, baseHeight = 200;
let posX = 0, posY = 0; // translation from center, in px
let scale = 1; // CSS scale
let rotation = 0; // degrees
let dragging = false;
let resizing = false;
let pointerId = null;
let start = {x:0,y:0, baseW:0, baseH:0, posX:0, posY:0};

// Utility to update DOM transform
function updateTransform(){
  imgContainer.style.transform = `translate(-50%,-50%) translate(${posX}px, ${posY}px) rotate(${rotation}deg) scale(${scale})`;
  // set displayed size (base width/height as CSS width/height)
  imgContainer.style.width = baseWidth + 'px';
  imgContainer.style.height = baseHeight + 'px';
}

// Fit uploaded image to editor nicely
function fitToEditor(nw, nh){
  const maxDim = 800; // leave margin inside 1080
  let w = nw, h = nh;
  if(w > maxDim || h > maxDim){
    const s = Math.min(maxDim / w, maxDim / h);
    w = Math.round(w * s);
    h = Math.round(h * s);
  }
  baseWidth = w;
  baseHeight = h;
  posX = 0; posY = 0;
  scale = 1; rotation = 0;
  zoomSlider.value = 100;
  updateTransform();
}

// Upload handler
upload.addEventListener('change', (e)=>{
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (ev)=>{
    userImage.src = ev.target.result;
    userImage.onload = ()=>{
      // set starting base size to fit nicely
      fitToEditor(userImage.naturalWidth, userImage.naturalHeight);
    };
  };
  reader.readAsDataURL(file);
});

// Templates click
templates.forEach(t=>{
  t.addEventListener('click', ()=>{
    const src = t.getAttribute('data-src');
    frameImage.src = src;
    // mark active visual
    templates.forEach(x=>x.style.borderColor = 'transparent');
    t.style.borderColor = '#111827';
  });
});

// Pointer drag for moving image
imgContainer.addEventListener('pointerdown', (e)=>{
  // ignore if clicked on resizer
  if(e.target === resizer) return;
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

editor.addEventListener('pointermove', (e)=>{
  if(dragging && e.pointerId === pointerId){
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    posX = start.posX + dx;
    posY = start.posY + dy;
    updateTransform();
  }
});

editor.addEventListener('pointerup', (e)=>{
  if(dragging && e.pointerId === pointerId){
    dragging = false;
    try{ imgContainer.releasePointerCapture(e.pointerId); }catch(e){};
    imgContainer.classList.remove('dragging');
  }
});
editor.addEventListener('pointercancel', ()=>{ dragging=false; imgContainer.classList.remove('dragging'); });

// Resizer pointer events (bottom-right)
resizer.addEventListener('pointerdown', (e)=>{
  e.preventDefault();
  resizer.setPointerCapture(e.pointerId);
  pointerId = e.pointerId;
  resizing = true;
  start.x = e.clientX; start.y = e.clientY;
  start.baseW = baseWidth; start.baseH = baseHeight;
});

resizer.addEventListener('pointermove', (e)=>{
  if(!resizing || e.pointerId !== pointerId) return;
  const dx = e.clientX - start.x;
  const dy = e.clientY - start.y;
  // scale uniformly based on max of dx,dy to maintain aspect ratio
  const newW = Math.max(40, start.baseW + dx);
  const newH = Math.max(40, start.baseH + dy);
  // maintain aspect ratio of original image
  const aspect = start.baseW / start.baseH;
  if(newW / newH > aspect){
    baseHeight = Math.round(newW / aspect);
    baseWidth = Math.round(newW);
  } else {
    baseWidth = Math.round(newH * aspect);
    baseHeight = Math.round(newH);
  }
  updateTransform();
});

resizer.addEventListener('pointerup', (e)=>{
  if(resizing && e.pointerId === pointerId){
    resizing = false;
    try{ resizer.releasePointerCapture(e.pointerId); }catch(e){};
  }
});
resizer.addEventListener('pointercancel', ()=>{ resizing=false; });

// Zoom slider
zoomSlider.addEventListener('input', (e)=>{
  const v = Number(e.target.value); // percent
  scale = v / 100;
  updateTransform();
});

// Rotate button (90deg steps)
rotateBtn.addEventListener('click', ()=>{
  rotation = (rotation + 90) % 360;
  updateTransform();
});

// Reset
resetBtn.addEventListener('click', ()=>{
  if(!userImage.src) return;
  fitToEditor(userImage.naturalWidth, userImage.naturalHeight);
});

// Download / export to 1080x1080 canvas
downloadBtn.addEventListener('click', ()=>{
  const canvas = exportCanvas;
  const ctx = canvas.getContext('2d');
  // clear
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // fill white background (optional)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // draw user image with transforms
  if(userImage.src){
    // center point in canvas coordinates (editor center)
    const centerX = canvas.width / 2 + posX;
    const centerY = canvas.height / 2 + posY;

    ctx.save();
    ctx.translate(centerX, centerY);
    // rotation in radians around center
    ctx.rotate(rotation * Math.PI / 180);
    ctx.scale(scale, scale);
    // draw centered using baseWidth/baseHeight as source size mapping
    ctx.drawImage(userImage, -baseWidth/2, -baseHeight/2, baseWidth, baseHeight);
    ctx.restore();
  }

  // draw frame overlay (stretch to full)
  if(frameImage.src){
    // ensure frame is loaded; if not, use onload to draw (but generally loaded)
    ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
  }

  // trigger download
  const link = document.createElement('a');
  link.download = 'frame-1080.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// initialize
updateTransform();
