const upload = document.getElementById("upload");
const uploadedImg = document.getElementById("uploaded-img");
const frameImg = document.getElementById("frame-img");
const templates = document.querySelectorAll(".template");
const editor = document.getElementById("editor");
const imgContainer = document.getElementById("img-container");
const zoomSlider = document.getElementById("zoom-slider");
const rotateBtn = document.getElementById("rotate-btn");
const downloadBtn = document.getElementById("download-btn");

let scale = 1;
let rotation = 0;
let isDragging = false;
let startX, startY, initialX, initialY;

// ---------- Upload ----------
upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      uploadedImg.src = event.target.result;
      uploadedImg.onload = () => {
        const maxW = 600, maxH = 600;
        let w = uploadedImg.naturalWidth;
        let h = uploadedImg.naturalHeight;

        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w *= ratio;
          h *= ratio;
        }

        imgContainer.style.width = w + "px";
        imgContainer.style.height = h + "px";
        imgContainer.style.left = (editor.clientWidth - w) / 2 + "px";
        imgContainer.style.top = (editor.clientHeight - h) / 2 + "px";

        scale = 1;
        rotation = 0;
        zoomSlider.value = 1;
        updateTransform();
      };
    };
    reader.readAsDataURL(file);
  }
});

// ---------- Template selection ----------
templates.forEach(tpl => {
  tpl.addEventListener("click", () => {
    frameImg.src = tpl.src;
  });
});

// ---------- Drag (desktop) ----------
imgContainer.addEventListener("mousedown", (e) => {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  initialX = imgContainer.offsetLeft;
  initialY = imgContainer.offsetTop;
  e.preventDefault();
});

document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    imgContainer.style.left = initialX + dx + "px";
    imgContainer.style.top = initialY + dy + "px";
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});

// ---------- Touch: drag + pinch zoom ----------
let lastDistance = 0;

imgContainer.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    // Single finger drag
    isDragging = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    initialX = imgContainer.offsetLeft;
    initialY = imgContainer.offsetTop;
  } else if (e.touches.length === 2) {
    // Pinch start
    lastDistance = getDistance(e.touches[0], e.touches[1]);
  }
});

imgContainer.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (isDragging && e.touches.length === 1) {
    // Dragging
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    imgContainer.style.left = initialX + dx + "px";
    imgContainer.style.top = initialY + dy + "px";
  } else if (e.touches.length === 2) {
    // Pinch zoom
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
});

function getDistance(t1, t2) {
  const dx = t2.clientX - t1.clientX;
  const dy = t2.clientY - t1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// ---------- Zoom: slider ----------
zoomSlider.addEventListener("input", () => {
  scale = parseFloat(zoomSlider.value);
  updateTransform();
});

// ---------- Zoom: mouse scroll ----------
editor.addEventListener("wheel", (e) => {
  e.preventDefault();
  scale += e.deltaY * -0.001;
  if (scale < 0.1) scale = 0.1;
  if (scale > 5) scale = 5;
  zoomSlider.value = scale;
  updateTransform();
});

// ---------- Rotate ----------
rotateBtn.addEventListener("click", () => {
  rotation += 90;
  updateTransform();
});

// ---------- Apply transforms ----------
function updateTransform() {
  uploadedImg.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
}

// ---------- Download ----------
downloadBtn.addEventListener("click", () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");

  if (uploadedImg.src) {
    const rect = imgContainer.getBoundingClientRect();
    const editorRect = editor.getBoundingClientRect();
    const x = rect.left - editorRect.left;
    const y = rect.top - editorRect.top;
    const w = rect.width;
    const h = rect.height;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(uploadedImg, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  if (frameImg.src) {
    ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
  }

  const link = document.createElement("a");
  link.download = "framed-image.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
