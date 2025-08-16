const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let uploadedImg = null;
let frameImg = new Image();

// transformation values
let imgX = 0, imgY = 0;
let imgScale = 1;
let isDragging = false;
let lastX, lastY;

// Upload image
document.getElementById("upload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      uploadedImg = new Image();
      uploadedImg.onload = () => {
        // fit initially
        const scale = Math.min(1080 / uploadedImg.width, 1080 / uploadedImg.height);
        imgScale = scale;
        imgX = (1080 - uploadedImg.width * imgScale) / 2;
        imgY = (1080 - uploadedImg.height * imgScale) / 2;
        draw();
      };
      uploadedImg.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Select frame
function selectTemplate(src) {
  frameImg.src = src;
  frameImg.onload = draw;
}

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (uploadedImg) {
    ctx.drawImage(
      uploadedImg,
      imgX,
      imgY,
      uploadedImg.width * imgScale,
      uploadedImg.height * imgScale
    );
  }

  if (frameImg) {
    ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
  }
}

// Mouse drag events
canvas.addEventListener("mousedown", (e) => {
  if (!uploadedImg) return;
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  canvas.style.cursor = "grabbing";
});

canvas.addEventListener("mousemove", (e) => {
  if (isDragging && uploadedImg) {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    imgX += dx;
    imgY += dy;
    lastX = e.clientX;
    lastY = e.clientY;
    draw();
  }
});

canvas.addEventListener("mouseup", () => {
  isDragging = false;
  canvas.style.cursor = "grab";
});

canvas.addEventListener("mouseleave", () => {
  isDragging = false;
  canvas.style.cursor = "grab";
});

// Zoom with scroll
canvas.addEventListener("wheel", (e) => {
  if (!uploadedImg) return;
  e.preventDefault();

  const zoomFactor = 0.1;
  const mouseX = e.offsetX;
  const mouseY = e.offsetY;

  const prevScale = imgScale;
  if (e.deltaY < 0) {
    imgScale *= 1 + zoomFactor;
  } else {
    imgScale *= 1 - zoomFactor;
  }

  // adjust position so zoom is centered on mouse
  imgX -= (mouseX - imgX) * (imgScale / prevScale - 1);
  imgY -= (mouseY - imgY) * (imgScale / prevScale - 1);

  draw();
});

// Download final image
function downloadImage() {
  const link = document.createElement("a");
  link.download = "framed_image.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
