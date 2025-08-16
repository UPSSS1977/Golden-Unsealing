const upload = document.getElementById("upload");
const uploadedImg = document.getElementById("uploadedImg");
const frameImg = document.getElementById("frameImg");
const zoomSlider = document.getElementById("zoom");
const rotateBtn = document.getElementById("rotateBtn");
const downloadBtn = document.getElementById("downloadBtn");

let scale = 1;
let rotation = 0;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let lastX, lastY;

// Apply transform to preview
function updateTransform() {
  uploadedImg.style.transform =
    `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotation}deg)`;
}

// Upload
upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    uploadedImg.src = ev.target.result;
    uploadedImg.style.display = "block";
    scale = 1;
    rotation = 0;
    translateX = 0;
    translateY = 0;
    updateTransform();
  };
  reader.readAsDataURL(file);
});

// Zoom slider
zoomSlider.addEventListener("input", () => {
  scale = parseFloat(zoomSlider.value);
  updateTransform();
});

// Mouse wheel zoom
document.getElementById("editor").addEventListener("wheel", (e) => {
  e.preventDefault();
  scale += e.deltaY * -0.001;
  if (scale < 0.01) scale = 0.01;
  updateTransform();
  zoomSlider.value = scale;
}, { passive: false });

// Drag desktop
uploadedImg.addEventListener("mousedown", (e) => {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  uploadedImg.style.cursor = "grabbing";
});
window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  translateX += e.clientX - lastX;
  translateY += e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
  updateTransform();
});
window.addEventListener("mouseup", () => {
  isDragging = false;
  uploadedImg.style.cursor = "grab";
});

// Drag mobile
uploadedImg.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
  }
}, { passive: false });

uploadedImg.addEventListener("touchmove", (e) => {
  if (!isDragging || e.touches.length !== 1) return;
  e.preventDefault();
  translateX += e.touches[0].clientX - lastX;
  translateY += e.touches[0].clientY - lastY;
  lastX = e.touches[0].clientX;
  lastY = e.touches[0].clientY;
  updateTransform();
}, { passive: false });

uploadedImg.addEventListener("touchend", () => {
  isDragging = false;
});

// Rotate
rotateBtn.addEventListener("click", () => {
  rotation = (rotation + 90) % 360;
  updateTransform();
});

// Download final image
downloadBtn.addEventListener("click", () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");

  if (!uploadedImg.src) return;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = uploadedImg.src;

  img.onload = () => {
    ctx.save();
    ctx.translate(canvas.width / 2 + translateX, canvas.height / 2 + translateY);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    const frame = new Image();
    frame.crossOrigin = "anonymous";
    frame.src = frameImg.src;
    frame.onload = () => {
      ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
      const link = document.createElement("a");
      link.download = "framed-image.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
  };
});
