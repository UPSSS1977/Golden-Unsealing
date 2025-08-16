const upload = document.getElementById("upload");
const uploadedImg = document.getElementById("uploaded-img");
const imgContainer = document.getElementById("img-container");
const frameImg = document.getElementById("frame-img");
const zoomSlider = document.getElementById("zoom");
const rotateBtn = document.getElementById("rotate-btn");
const downloadBtn = document.getElementById("download-btn");

let scale = 1, rotation = 0, translateX = 0, translateY = 0;
let isDragging = false, lastX, lastY;

// Update preview
function updateTransform() {
  uploadedImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotation}deg)`;
}

// Upload image
upload.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    uploadedImg.src = ev.target.result;
    uploadedImg.style.display = "block";
    scale = 1; rotation = 0; translateX = 0; translateY = 0;

    // Resize image to fit editor initially
    uploadedImg.onload = () => {
      const editorSize = document.getElementById("editor").offsetWidth;
      const maxDim = Math.max(uploadedImg.naturalWidth, uploadedImg.naturalHeight);
      scale = editorSize / maxDim * 0.8; // 80% fit
      updateTransform();
    };
  };
  reader.readAsDataURL(file);
});

// Select frame
function selectTemplate(src) { frameImg.src = src; }
window.selectTemplate = selectTemplate;

// Dragging desktop
imgContainer.addEventListener("mousedown", e => { isDragging=true; lastX=e.clientX; lastY=e.clientY; e.preventDefault(); });
window.addEventListener("mousemove", e => { if(!isDragging) return; translateX += e.clientX-lastX; translateY += e.clientY-lastY; lastX=e.clientX; lastY=e.clientY; updateTransform(); });
window.addEventListener("mouseup", () => isDragging=false);

// Dragging mobile
imgContainer.addEventListener("touchstart", e => { if(e.touches.length===1){ isDragging=true; lastX=e.touches[0].clientX; lastY=e.touches[0].clientY; } }, {passive:false});
imgContainer.addEventListener("touchmove", e => { if(!isDragging || e.touches.length!==1) return; e.preventDefault(); translateX += e.touches[0].clientX-lastX; translateY += e.touches[0].clientY-lastY; lastX=e.touches[0].clientX; lastY=e.touches[0].clientY; updateTransform(); }, {passive:false});
imgContainer.addEventListener("touchend", () => isDragging=false);

// Zoom slider
zoomSlider.addEventListener("input", e => { scale *= parseFloat(e.target.value); zoomSlider.value=1; updateTransform(); });

// Zoom mouse wheel
document.getElementById("editor").addEventListener("wheel", e => { e.preventDefault(); scale += e.deltaY*-0.001; if(scale<0.01) scale=0.01; updateTransform(); }, {passive:false});

// Rotate
rotateBtn.addEventListener("click", ()=>{ rotation=(rotation+90)%360; updateTransform(); });

// Download
downloadBtn.addEventListener("click", () => {
  const canvas=document.createElement("canvas");
  canvas.width=1080; canvas.height=1080;
  const ctx=canvas.getContext("2d");
  if(uploadedImg.src){
    const img=new Image();
    img.crossOrigin="anonymous"; img.src=uploadedImg.src;
    img.onload=()=>{
      ctx.save();
      ctx.translate(canvas.width/2 + translateX, canvas.height/2 + translateY);
      ctx.rotate(rotation*Math.PI/180);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -img.width/2, -img.height/2);
      ctx.restore();
      if(frameImg.src){
        const frame=new Image();
        frame.crossOrigin="anonymous"; frame.src=frameImg.src;
        frame.onload=()=>{
          ctx.drawImage(frame,0,0,canvas.width,canvas.height);
          const link=document.createElement("a"); link.download="framed-image.png";
          link.href=canvas.toDataURL("image/png"); link.click();
        };
      }
    };
  }
});
