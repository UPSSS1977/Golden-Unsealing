const upload = document.getElementById("upload");
const templateOptions = document.querySelectorAll(".template");
const editor = document.getElementById("editor");
const imgContainer = document.getElementById("img-container");
const uploadedImg = document.getElementById("uploaded-img");
const frameImg = document.getElementById("frame-img");
const zoomSlider = document.getElementById("zoom-slider");
const rotateBtn = document.getElementById("rotate-btn");
const downloadBtn = document.getElementById("download-btn");

let currentRotation = 0;
let currentScale = 1;
let posX = 0, posY = 0, isDragging = false, startX, startY;

// Template selection
function selectTemplate(src) {
  frameImg.src = src;
}
window.selectTemplate = selectTemplate;

// Upload image
upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      uploadedImg.src = event.target.result;
      uploadedImg.onload = () => {
        const maxW = 800;
        const maxH = 800;
        let w = uploadedImg.naturalWidth;
        let h = uploadedImg.naturalHeight;

        if (w > maxW || h > maxH) {
          const scale = Math.min(maxW / w, maxH / h);
          w *= scale;
          h *= scale;
        }

        imgContainer.style.width = w + "px";
        imgContainer.style.height = h + "px";
        imgContainer.style.left = (540 - w / 2) + "px";
        imgContainer.style.top = (540 - h / 2) + "px";
        resetTransform();
      };
    };
    reader.readAsDataURL(file);
  }
});

// Dragging
imgContainer.addEventListener("mousedown", (e) => {
  isDragging = true;
  startX = e.clientX - posX;
  startY = e.clientY - posY;
});
document.addEventListener("mouseup", () => isDragging = false);
document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  posX = e.clientX - startX;
  posY = e.clientY - startY;
  updateTransform();
});

// Zoom via slider
zoomSlider.addEventListener("input", (e) => {
  currentScale = e.target.value / 100;
  updateTransform();
});

// Rotate button
rotateBtn.addEventListener("click", () => {
  currentRotation = (currentRotation + 90) % 360;
  updateTransform();
});

// Update transform
function updateTransform() {
  imgContainer.style.transform = `translate(${posX}px, ${posY}px) scale(${currentScale}) rotate(${currentRotation}deg)`;
}

// Reset transform
function resetTransform() {
  posX = 0;
  posY = 0;
  currentScale = 1;
  currentRotation = 0;
  zoomSlider.value = 100;
  updateTransform();
}

// Download final image
downloadBtn.addEventListener("click", () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");

  if (uploadedImg.src) {
    ctx.save();
    ctx.translate(540 + posX, 540 + posY);
    ctx.rotate(currentRotation * Math.PI / 180);
    ctx.scale(currentScale, currentScale);
    ctx.drawImage(
      uploadedImg,
      -imgContainer.offsetWidth / 2,
      -imgContainer.offsetHeight / 2,
      imgContainer.offsetWidth,
      imgContainer.offsetHeight
    );
    ctx.restore();
  }

  if (frameImg.src) {
    ctx.drawImage(frameImg, 0, 0, 1080, 1080);
  }

  const link = document.createElement("a");
  link.download = "frame_editor.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
