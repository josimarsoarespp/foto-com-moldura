const video = document.getElementById('video');
const captureBtn = document.getElementById('captureBtn');
const switchCameraBtn = document.getElementById('switchCameraBtn');
const newPhotoBtn = document.getElementById('newPhotoBtn');
const shareBtn = document.getElementById('shareBtn');
const resultImage = document.getElementById('resultImage');
const downloadLink = document.getElementById('downloadLink');
const cameraScreen = document.getElementById('cameraScreen');
const resultScreen = document.getElementById('resultScreen');

let currentStream = null;
let useFrontCamera = false;
let lastBlob = null;

async function startCamera() {
  stopCamera();

  const constraints = {
    audio: false,
    video: {
      facingMode: useFrontCamera ? 'user' : 'environment',
      width: { ideal: 1080 },
      height: { ideal: 1920 }
    }
  };

  try {
    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = currentStream;
  } catch (error) {
    alert('Não consegui abrir a câmera. Verifique se você permitiu o acesso e se abriu pelo link HTTPS.');
    console.error(error);
  }
}

function stopCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawTextFit(ctx, text, x, y, maxWidth, startSize, color) {
  let size = startSize;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${size}px Arial`;
  while (ctx.measureText(text).width > maxWidth && size > 24) {
    size -= 2;
    ctx.font = `900 ${size}px Arial`;
  }
  ctx.lineWidth = Math.max(5, size * 0.13);
  ctx.strokeStyle = 'rgba(0,0,0,.55)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function capturePhoto() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 1080;
  canvas.height = 1920;

  const videoRatio = video.videoWidth / video.videoHeight;
  const canvasRatio = canvas.width / canvas.height;
  let sx, sy, sw, sh;

  if (videoRatio > canvasRatio) {
    sh = video.videoHeight;
    sw = sh * canvasRatio;
    sx = (video.videoWidth - sw) / 2;
    sy = 0;
  } else {
    sw = video.videoWidth;
    sh = sw / canvasRatio;
    sx = 0;
    sy = (video.videoHeight - sh) / 2;
  }

  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  // Moldura desenhada na foto final
  ctx.save();
  ctx.lineWidth = 34;
  ctx.strokeStyle = 'rgba(255,255,255,.95)';
  drawRoundedRect(ctx, 34, 34, canvas.width - 68, canvas.height - 68, 54);
  ctx.stroke();

  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(196,181,253,.95)';
  drawRoundedRect(ctx, 62, 62, canvas.width - 124, canvas.height - 124, 38);
  ctx.stroke();

  // Brilho inferior
  const gradient = ctx.createLinearGradient(0, canvas.height * .72, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, canvas.height * .72, canvas.width, canvas.height * .28);

  drawTextFit(ctx, 'KYARA • 15 ANOS', canvas.width / 2, 130, canvas.width * .84, 72, '#ffffff');
  drawTextFit(ctx, 'Uma noite inesquecível', canvas.width / 2, canvas.height - 120, canvas.width * .84, 56, '#fff7ed');

  ctx.font = '900 54px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fde68a';
  ctx.strokeStyle = 'rgba(0,0,0,.45)';
  ctx.lineWidth = 7;
  ctx.strokeText('✦ ✧ ✦', canvas.width / 2, 230);
  ctx.fillText('✦ ✧ ✦', canvas.width / 2, 230);
  ctx.restore();

  canvas.toBlob(blob => {
    lastBlob = blob;
    const url = URL.createObjectURL(blob);
    resultImage.src = url;
    downloadLink.href = url;
    cameraScreen.classList.remove('active');
    resultScreen.classList.add('active');
  }, 'image/png', 1);
}

captureBtn.addEventListener('click', capturePhoto);

switchCameraBtn.addEventListener('click', async () => {
  useFrontCamera = !useFrontCamera;
  await startCamera();
});

newPhotoBtn.addEventListener('click', () => {
  resultScreen.classList.remove('active');
  cameraScreen.classList.add('active');
});

shareBtn.addEventListener('click', async () => {
  if (!lastBlob) return;
  const file = new File([lastBlob], 'foto-com-moldura.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Foto com moldura' });
  } else {
    alert('Seu navegador não permite compartilhar direto. Use o botão Baixar foto.');
  }
});

startCamera();
