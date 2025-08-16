const uploadInput = document.getElementById("upload");
const uploadedImg = document.getElementById("uploaded-img");
const imgContainer = document.getElementById("img-container");
const frameImg = document.getElementById("frame-img");
const zoomSlider = document.getElementById("zoom");
const rotateBtn = document.getElementById("rotate-btn");
const downloadBtn = document.getElementById("download-btn");

let scale = 1;
let rotation = 0;
let posX = 0, posY = 0;
let isDragging = false;
let lastX = 0, lastY = 0;

// === IMAGE UPLOAD ===
uploadInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      uploadedImg.src = ev.target.result;
      uploadedImg.style.display = "block";
      resetImage();
    };
    reader.readAsDataURL(file);
  }
});

// === RESET POSITION ===
function resetImage() {
  scale = 1;
  rotation = 0;
  posX = 0;
  posY = 0;
  updateTransform();
}

// === TRANSFORM IMAGE ===
function updateTransform() {
  imgContainer.style.transform = `translate(${posX}px, ${posY}px) scale(${scale}) rotate(${rotation}deg)`;
  zoomSlider.value = scale; // sync slider
}

// === DRAGGING (Desktop + Mobile) ===
imgContainer.addEventListener("mousedown", (e) => {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  imgContainer.style.cursor = "grabbing";
});

window.addEventListener("mouseup", () => {
  isDragging = false;
  imgContainer.style.cursor = "grab";
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  let dx = e.clientX - lastX;
  let dy = e.clientY - lastY;
  posX += dx;
  posY += dy;
  lastX = e.clientX;
  lastY = e.clientY;
  updateTransform();
});

// === Touch (Mobile) ===
let lastTouchDistance = null;
let isTouchDragging = false;

imgContainer.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    isTouchDragging = true;
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
  }
  if (e.touches.length === 2) {
    lastTouchDistance = getTouchDistance(e.touches);
  }
});

imgContainer.addEventListener("touchmove", (e) => {
  e.preventDefault();

  if (e.touches.length === 1 && isTouchDragging) {
    let dx = e.touches[0].clientX - lastX;
    let dy = e.touches[0].clientY - lastY;
    posX += dx;
    posY += dy;
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
    updateTransform();
  }

  if (e.touches.length === 2) {
    const newDistance = getTouchDistance(e.touches);
    if (lastTouchDistance) {
      let zoomFactor = newDistance / lastTouchDistance;
      scale *= zoomFactor;
      if (scale < 0.01) scale = 0.01; // prevent flip
      updateTransform();
    }
    lastTouchDistance = newDistance;
  }
}, { passive: false });

imgContainer.addEventListener("touchend", () => {
  isTouchDragging = false;
  lastTouchDistance = null;
});

function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// === MOUSE WHEEL ZOOM ===
document.getElementById("editor").addEventListener("wheel", (e) => {
  e.preventDefault();
  let zoomAmount = e.deltaY * -0.001;
  scale += zoomAmount;
  if (scale < 0.01) scale = 0.01; // prevent flipping
  updateTransform();
});

// === SLIDER ZOOM ===
zoomSlider.addEventListener("input", () => {
  scale = parseFloat(zoomSlider.value);
  if (scale < 0.01) scale = 0.01;
  updateTransform();
});

// === ROTATE ===
rotateBtn.addEventListener("click", () => {
  rotation += 90;
  updateTransform();
});

// === TEMPLATE SELECT ===
function selectTemplate(src) {
  frameImg.src = src;
}
window.selectTemplate = selectTemplate;

// === DOWNLOAD ===
downloadBtn.addEventListener("click", () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");

  if (uploadedImg.src) {
    const img = new Image();
    img.crossOrigin = "anonymous"; // fix tainted canvas if needed
    img.src = uploadedImg.src;
    img.onload = () => {
      ctx.save();

      // Apply transforms like in preview
      ctx.translate(canvas.width / 2 + translateX, canvas.height / 2 + translateY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);

      // Draw uploaded image centered
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      ctx.restore();

      // Draw frame on top
      const frame = new Image();
      frame.crossOrigin = "anonymous";
      frame.src = frameImg.src;
      frame.onload = () => {
        ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

        // Download
        const link = document.createElement("a");
        link.download = "framed-image.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      };
    };
  }
});
