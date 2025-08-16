const upload = document.getElementById("upload");
const uploadedImg = document.getElementById("uploaded-img");
const imgContainer = document.getElementById("img-container");
const frameImg = document.getElementById("frame-img");
const zoomSlider = document.getElementById("zoom");
const rotateBtn = document.getElementById("rotate-btn");
const downloadBtn = document.getElementById("download-btn");
const editor = document.getElementById("editor");

let scale = 1;
let rotation = 0;
let posX = 0;
let posY = 0;
let isDragging = false;
let lastX = 0, lastY = 0;
let lastTouchDist = null;

function updateTransform() {
  imgContainer.style.transform = `translate(${posX}px, ${posY}px) scale(${scale}) rotate(${rotation}deg)`;
}

// Upload image
upload.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    uploadedImg.src = ev.target.result;
    uploadedImg.style.display = "block";
    scale = 1;
    rotation = 0;
    posX = posY = 0;
    updateTransform();
  };
  reader.readAsDataURL(file);
});

// Select frame
function selectTemplate(src) {
  frameImg.src = src;
}
window.selectTemplate = selectTemplate;

// Slider zoom (infinite)
zoomSlider.addEventListener("input", () => {
  scale = parseFloat(zoomSlider.value);
  updateTransform();
});

// Scroll zoom
editor.addEventListener("wheel", e => {
  e.preventDefault();
  const rect = editor.getBoundingClientRect();
  const cx = e.clientX - rect.left - rect.width / 2;
  const cy = e.clientY - rect.top - rect.height / 2;
  const prevScale = scale;
  scale *= 1 - e.deltaY * 0.001;
  if (scale < 0.01) scale = 0.01;
  posX -= cx * (scale / prevScale - 1);
  posY -= cy * (scale / prevScale - 1);
  updateTransform();
  zoomSlider.value = scale;
}, { passive: false });

// Drag desktop
imgContainer.addEventListener("mousedown", e => {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  imgContainer.style.cursor = "grabbing";
});
window.addEventListener("mousemove", e => {
  if (!isDragging) return;
  posX += e.clientX - lastX;
  posY += e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
  updateTransform();
});
window.addEventListener("mouseup", () => {
  isDragging = false;
  imgContainer.style.cursor = "grab";
});

// Touch drag + pinch
editor.addEventListener("touchstart", e => {
  e.preventDefault();
  if (e.touches.length === 1) {
    isDragging = true;
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    lastTouchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
}, { passive: false });

editor.addEventListener("touchmove", e => {
  e.preventDefault();
  if (e.touches.length === 1 && isDragging) {
    posX += e.touches[0].clientX - lastX;
    posY += e.touches[0].clientY - lastY;
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
    updateTransform();
  } else if (e.touches.length === 2) {
    const newDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    if (lastTouchDist) {
      const factor = newDist / lastTouchDist;
      scale *= factor;
      zoomSlider.value = scale;
      updateTransform();
    }
    lastTouchDist = newDist;
  }
}, { passive: false });

editor.addEventListener("touchend", e => {
  if (e.touches.length < 2) lastTouchDist = null;
  if (e.touches.length === 0) isDragging = false;
}, { passive: false });

// Rotate
rotateBtn.addEventListener("click", () => {
  rotation = (rotation + 90) % 360;
  updateTransform();
});

// Download
downloadBtn.addEventListener("click", () => {
  if (!uploadedImg.src) return;

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = uploadedImg.src;
  img.onload = () => {
    ctx.save();
    ctx.translate(540 + posX, 540 + posY);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    if (frameImg.src) {
      const frame = new Image();
      frame.crossOrigin = "anonymous";
      frame.src = frameImg.src;
      frame.onload = () => {
        ctx.drawImage(frame, 0, 0, 1080, 1080);
        const link = document.createElement("a");
        link.download = "framed-image.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      };
    }
  };
});
});
