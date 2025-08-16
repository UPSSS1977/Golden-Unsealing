const uploadInput = document.getElementById("upload");
const frameThumbs = document.querySelectorAll(".template");
const editor = document.getElementById("editor");
const frameLayer = document.getElementById("frame-layer");
const imgContainer = document.getElementById("img-container");
const uploadedImg = document.getElementById("uploaded-img");
const zoomSlider = document.getElementById("zoom");
const rotateBtn = document.getElementById("rotate");
const downloadBtn = document.getElementById("download");

let currentFrame = null;
let scale = 1;
let rotation = 0;

// Dragging state
let isDragging = false;
let startX, startY, initialX, initialY;

// Touch pinch state
let lastDistance = 0;

uploadInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    uploadedImg.src = ev.target.result;
    uploadedImg.onload = () => {
      imgContainer.style.left = "0px";
      imgContainer.style.top = "0px";
      scale = 0.8;
      rotation = 0;
      zoomSlider.value = scale;
      updateTransform();
    };
  };
  reader.readAsDataURL(file);
});

frameThumbs.forEach((thumb) => {
  thumb.addEventListener("click", () => {
    currentFrame = thumb.src;
    frameLayer.src = currentFrame;
  });
});

function updateTransform() {
  imgContainer.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`;
}

zoomSlider.addEventListener("input", (e) => {
  scale = parseFloat(e.target.value);
  updateTransform();
});

rotateBtn.addEventListener("click", () => {
  rotation = (rotation + 90) % 360;
  updateTransform();
});

// Mouse drag
imgContainer.addEventListener("mousedown", (e) => {
  e.preventDefault();
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  initialX = imgContainer.offsetLeft;
  initialY = imgContainer.offsetTop;
});
window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  e.preventDefault();
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  imgContainer.style.left = initialX + dx + "px";
  imgContainer.style.top = initialY + dy + "px";
});
window.addEventListener("mouseup", () => {
  isDragging = false;
});

// Mouse wheel zoom
editor.addEventListener("wheel", (e) => {
  e.preventDefault();
  scale += e.deltaY * -0.001;
  if (scale < 0.1) scale = 0.1;
  if (scale > 5) scale = 5;
  zoomSlider.value = scale;
  updateTransform();
}, { passive: false });

// Touch drag + pinch
imgContainer.addEventListener("touchstart", (e) => {
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
}, { passive: false });

imgContainer.addEventListener("touchmove", (e) => {
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
      scale += delta * 0.005;
      if (scale < 0.1) scale = 0.1;
      if (scale > 5) scale = 5;
      zoomSlider.value = scale;
      updateTransform();
    }
    lastDistance = newDistance;
  }
}, { passive: false });

imgContainer.addEventListener("touchend", (e) => {
  if (e.touches.length < 2) {
    lastDistance = 0;
  }
  isDragging = false;
}, { passive: false });

function getDistance(touch1, touch2) {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

downloadBtn.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1080;
  exportCanvas.height = 1080;
  const ctx = exportCanvas.getContext("2d");

  if (uploadedImg.src) {
    const rect = imgContainer.getBoundingClientRect();
    const editorRect = editor.getBoundingClientRect();
    const centerX = 1080 / 2;
    const centerY = 1080 / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(uploadedImg, -uploadedImg.width / 2, -uploadedImg.height / 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  if (currentFrame) {
    const frameImage = new Image();
    frameImage.src = currentFrame;
    frameImage.onload = () => {
      ctx.drawImage(frameImage, 0, 0, 1080, 1080);
      const link = document.createElement("a");
      link.download = "framed-image.png";
      link.href = exportCanvas.toDataURL("image/png");
      link.click();
    };
  }
});
