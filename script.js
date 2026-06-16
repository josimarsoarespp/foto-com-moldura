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

const frameImage = new Image();
frameImage.src = 'assets/moldura.png';

const EVENT_MESSAGE = 'Celebrando a plenitude da vida\ncom o coração cheio de alegria.';
const EVENT_NAME = 'Kátia Menezes';
const EVENT_DATE = '20/6/2026';

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

function drawMultilineTextFit(ctx, text, x, y, maxWidth, startSize, color, lineHeightMultiplier = 1.25) {
  const lines = text.split('\n');
  let size = startSize;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${size}px Georgia, serif`;

  while (lines.some(line => ctx.measureText(line).width > maxWidth) && size > 22) {
    size -= 2;
    ctx.font = `700 ${size}px Georgia, serif`;
  }

  const lineHeight = size * lineHeightMultiplier;
  const startY = y - ((lines.length - 1) * lineHeight) / 2;

  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth = Math.max(3, size * 0.08);

  lines.forEach((line, index) => {
    const currentY = startY + index * lineHeight;
    ctx.strokeText(line, x, currentY);
    ctx.fillText(line, x, currentY);
  });
}

function drawTextFit(ctx, text, x, y, maxWidth, startSize, color, font = '900 {size}px Georgia, serif') {
  let size = startSize;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font.replace('{size}', size);

  while (ctx.measureText(text).width > maxWidth && size > 22) {
    size -= 2;
    ctx.font = font.replace('{size}', size);
  }

  ctx.lineWidth = Math.max(3, size * 0.08);
  ctx.strokeStyle = 'rgba(255,255,255,.65)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function capturePhoto() {
  if (!video.videoWidth || !video.videoHeight) {
    alert('A câmera ainda está carregando. Tente novamente em alguns segundos.');
    return;
  }

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

  // Moldura de girassóis enviada pelo usuário.
  ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);

  // Textos finais do evento.
  drawMultilineTextFit(
    ctx,
    EVENT_MESSAGE,
    canvas.width / 2,
    1458,
    canvas.width * 0.72,
    46,
    '#6b3f1d'
  );

  drawTextFit(
    ctx,
    EVENT_NAME,
    canvas.width / 2,
    1588,
    canvas.width * 0.72,
    78,
    '#d6a500',
    'italic 900 {size}px Georgia, serif'
  );

  drawTextFit(
    ctx,
    EVENT_DATE,
    canvas.width / 2,
    1692,
    canvas.width * 0.55,
    44,
    '#6b3f1d'
  );

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
  const file = new File([lastBlob], 'foto-katia-menezes.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Foto com moldura - Kátia Menezes' });
  } else {
    alert('Seu navegador não permite compartilhar direto. Use o botão Baixar foto.');
  }
});

frameImage.onload = () => startCamera();
frameImage.onerror = () => {
  alert('Não consegui carregar a moldura. Verifique se o arquivo assets/moldura.png está no GitHub.');
  startCamera();
};
