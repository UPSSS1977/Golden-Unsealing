const upload = document.getElementById("upload");
const imgContainer = document.getElementById("img-container");
const uploadedImg = document.getElementById("uploaded-img");
const zoomSlider = document.getElementById("zoom");
const rotateBtn = document.getElementById("rotate-btn");
const downloadBtn = document.getElementById("download-btn");
const frameImg = document.getElementById("frame-img");

let scale = 1;
let rotation = 0;
let isDragging = false;
let startX, startY, initialX, initialY;
let lastDistance = 0;

// Upload image
upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (ev) {
      uploadedImg.src = ev.target.result;
      uploadedImg.style.display = "block";
      imgContainer.style.display = "block";
      scale = 0.5; // start smaller so easier to adjust
      rotation = 0;
      imgContainer.style.left = "0px";
      imgContainer.style.top = "0px";
      updateTransform();
    };
    reader.readAsDataURL(file);
  }
});

// Select frame
function selectTemplate(src) {
  frameImg.src = src;
}

// Desktop drag
imgContainer.addEventListener("mousedown", (e) => {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  initialX = imgContainer.offsetLeft;
  initialY = imgContainer.offsetTop;
});

window.addEventListener("mousemove", (e) => {
  if (isDragging) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    imgContainer.style.left = initialX + dx + "px";
    imgContainer.style.top = initialY + dy + "px";
  }
});

window.addEventListener("mouseup", () => {
  isDragging = false;
});

// Mobile drag + pinch zoom
imgContainer.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      isDragging = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      initialX = imgContainer.offsetLeft;
      initialY = imgContainer.offsetTop;
    } else if (e.touches.length === 2) {
      lastDistance = getDistance(e.touches[0], e.touches[1]);
    }
  },
  { passive: false }
);

imgContainer.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    if (isDragging && e.touches.length === 1) {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      imgContainer.style.left = initialX + dx + "px";
      imgContainer.style.top = initialY + dy + "px";
    } else if (e.touches.length === 2) {
      const newDistance = getDistance(e.touches[0], e.touches[1]);
      if (lastDistance) {
        const delta = newDistance - lastDistance;
        scale += delta * 0.005; // pinch sensitivity
        if (scale < 0.01) scale = 0.01;
        zoomSlider.value = scale;
        updateTransform();
      }
      lastDistance = newDistance;
    }
  },
  { passive: false }
);

imgContainer.addEventListener("touchend", () => {
  isDragging = false;
  lastDistance = 0;
});

// Mouse wheel zoom (unlimited)
document.getElementById("editor").addEventListener("wheel", (e) => {
  e.preventDefault();
  scale += e.deltaY * -0.001;
  if (scale < 0.01) scale = 0.01;
  zoomSlider.value = scale;
  updateTransform();
});

// Zoom via slider (no limit)
zoomSlider.addEventListener("input", () => {
  scale = parseFloat(zoomSlider.value);
  if (scale < 0.01) scale = 0.01;
  updateTransform();
});

// Rotate button
rotateBtn.addEventListener("click", () => {
  rotation += 90;
  updateTransform();
});

// Update transform
function updateTransform() {
  imgContainer.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
}

// Distance for pinch zoom
function getDistance(touch1, touch2) {
  return Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
}

// Download combined image
downloadBtn.addEventListener("click", () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");

  // Draw uploaded image
  if (uploadedImg.src) {
    const rect = imgContainer.getBoundingClientRect();
    const editorRect = document.getElementById("editor").getBoundingClientRect();

    const offsetX = rect.left - editorRect.left;
    const offsetY = rect.top - editorRect.top;

    ctx.save();
    ctx.translate(540, 540); // center
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(uploadedImg, offsetX - 540, offsetY - 540, rect.width, rect.height);
    ctx.restore();
  }

  // Draw frame
  if (frameImg.src) {
    ctx.drawImage(frameImg, 0, 0, 1080, 1080);
  }

  const link = document.createElement("a");
  link.download = "frame.png";
  link.href = canvas.toDataURL();
  link.click();
});
