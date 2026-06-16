const video = document.getElementById('video');
const captureBtn = document.getElementById('captureBtn');
const switchCameraBtn = document.getElementById('switchCameraBtn');
const newPhotoBtn = document.getElementById('newPhotoBtn');
const shareBtn = document.getElementById('shareBtn');
const resultImage = document.getElementById('resultImage');
const downloadLink = document.getElementById('downloadLink');
const cameraScreen = document.getElementById('cameraScreen');
const resultScreen = document.getElementById('resultScreen');

const FRAME_SRC = 'assets/moldura-katia-v3.png?v=4';
const EVENT_PHRASE = 'Celebrando a plenitude da vida com o coração cheio de alegria.';
const EVENT_NAME = 'Kátia Menezes';
const EVENT_DATE = '20/6/2026';

let currentStream = null;
let useFrontCamera = false;
let lastBlob = null;
let frameImage = null;

function preloadFrame() {
  return new Promise((resolve, reject) => {
    if (frameImage && frameImage.complete) {
      resolve(frameImage);
      return;
    }

    frameImage = new Image();
    frameImage.onload = () => resolve(frameImage);
    frameImage.onerror = reject;
    frameImage.src = FRAME_SRC;
  });
}

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
    await preloadFrame();
    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = currentStream;
    await video.play();
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

function fitFont(ctx, text, maxWidth, startSize, minSize, fontFamily, weight = '900') {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${fontFamily}`;

  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${fontFamily}`;
  }

  return size;
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function drawEventText(ctx, canvas) {
  const centerX = canvas.width / 2;
  const maxWidth = canvas.width * 0.74;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Frase
  ctx.fillStyle = '#6b3b16';
  ctx.strokeStyle = 'rgba(255,255,255,.75)';
  ctx.lineWidth = 6;
  ctx.font = '900 42px Arial';
  const phraseLines = wrapText(ctx, EVENT_PHRASE, maxWidth);
  const phraseStartY = 1510;

  phraseLines.forEach((line, index) => {
    const y = phraseStartY + index * 52;
    ctx.strokeText(line, centerX, y);
    ctx.fillText(line, centerX, y);
  });

  // Nome
  const nameSize = fitFont(ctx, EVENT_NAME, maxWidth, 82, 42, 'Georgia', '700');
  ctx.font = `italic 700 ${nameSize}px Georgia`;
  ctx.fillStyle = '#d8a300';
  ctx.strokeStyle = 'rgba(95,53,0,.65)';
  ctx.lineWidth = 5;
  ctx.strokeText(EVENT_NAME, centerX, 1645);
  ctx.fillText(EVENT_NAME, centerX, 1645);

  // Data
  ctx.font = '900 42px Arial';
  ctx.fillStyle = '#6b3b16';
  ctx.strokeStyle = 'rgba(255,255,255,.7)';
  ctx.lineWidth = 5;
  ctx.strokeText(EVENT_DATE, centerX, 1735);
  ctx.fillText(EVENT_DATE, centerX, 1735);

  ctx.restore();
}

async function capturePhoto() {
  if (!video.videoWidth || !video.videoHeight) {
    alert('A câmera ainda está carregando. Tente novamente em 1 segundo.');
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

  const moldura = await preloadFrame();
  ctx.drawImage(moldura, 0, 0, canvas.width, canvas.height);

  drawEventText(ctx, canvas);

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
    await navigator.share({
      files: [file],
      title: 'Foto com moldura',
      text: 'Foto com moldura - Kátia Menezes'
    });
  } else {
    alert('Seu navegador não permite compartilhar direto. Use o botão Baixar foto.');
  }
});

startCamera();
