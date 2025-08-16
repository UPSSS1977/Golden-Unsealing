const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let uploadedImg = null;
let frameImg = new Image();

let imgX = 0, imgY = 0; // position
let imgScale = 1;
let isDragging = false;
let startX, startY;

// Upload image
document.getElementById("upload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      uploadedImg = new Image();
      uploadedImg.onload = () => {
        // Fit image initially inside 1080x1080
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

// Dragging logic
canvas.addEventListener("mousedown", (e) => {
  isDragging = true;
  startX = e.offsetX - imgX;
  startY = e.offsetY - imgY;
});
canvas.addEventListener("mousemove", (e) => {
  if (isDragging && uploadedImg) {
    imgX = e.offsetX - startX;
    imgY = e.offsetY - startY;
    draw();
  }
});
canvas.addEventListener("mouseup", () => { isDragging = false; });
canvas.addEventListener("mouseleave", () => { isDragging = false; });

// Zoom with mouse wheel
canvas.addEventListener("wheel", (e) => {
  if (!uploadedImg) return;
  e.preventDefault();

  const zoomFactor = 0.1;
  if (e.deltaY < 0) {
    imgScale *= (1 + zoomFactor);
  } else {
    imgScale *= (1 - zoomFactor);
  }
  draw();
});

// Download
function downloadImage() {
  const link = document.createElement("a");
  link.download = "framed_image.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
