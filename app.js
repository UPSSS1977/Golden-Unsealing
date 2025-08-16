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

// Update preview transform
function updateTransform() {
  uploadedImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotation}deg)`;
}

// Upload image
upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (ev) {
      uploadedImg.src = ev.target.result;
      uploadedImg.style.display = "block";
      scale = 1;
      rotation = 0;
      translateX = 0;
      translateY = 0;
      updateTransform();
    };
    reader.readAsDataURL(file);
  }
});

// Select frame
function selectTemplate(src) {
  frameImg.src = src;
}

// Zoom with slider (infinite range)
zoomSlider.addEventListener("input", () => {
  scale = parseFloat(zoomSlider.value);
  if (scale < 0.01) scale = 0.01; // prevent flip
  updateTransform();
});

// Zoom with mouse wheel
document.getElementById("editor").addEventListener("wheel", (e) => {
  e.preventDefault();
  scale += e.deltaY * -0.001;
  if (scale < 0.01) scale = 0.01;
  updateTransform();
  zoomSlider.value = scale;
}, { passive: false });

// Dragging (desktop)
uploadedImg.addEventListener("mousedown", (e) => {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  e.preventDefault();
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
});

// Dragging (mobile touch)
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

// Rotate button
rotateBtn.addEventListener("click", () => {
  rotation = (rotation + 90) % 360;
  updateTransform();
});

// Download adjusted image with frame
downloadBtn.addEventListener("click", () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");

  if (uploadedImg.src) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = uploadedImg.src;
    img.onload = () => {
      ctx.save();

      // Apply same transforms as preview
      ctx.translate(canvas.width / 2 + translateX, canvas.height / 2 + translateY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);

      // Draw user uploaded image
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      ctx.restore();

      // Draw selected frame
      const frame = new Image();
      frame.crossOrigin = "anonymous";
      frame.src = frameImg.src;
      frame.onload = () => {
        ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

        // Trigger download
        const link = document.createElement("a");
        link.download = "framed-image.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      };
    };
  }
});
