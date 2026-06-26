const FACE_SCORE_VERIFIED = 72;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const isImageFile = (file) => file?.type?.startsWith("image/");

const loadBitmap = async (file) => {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }

  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageUrl;
    });
    return image;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
};

const getDimensions = (image) => ({
  width: image.width || image.videoWidth || image.naturalWidth,
  height: image.height || image.videoHeight || image.naturalHeight,
});

const detectMainFace = async (image) => {
  if (typeof window === "undefined" || !("FaceDetector" in window)) {
    return {
      error:
        "Este navegador no permite detección facial automática. La verificación queda pendiente.",
    };
  }

  const detector = new window.FaceDetector({
    fastMode: false,
    maxDetectedFaces: 3,
  });
  const faces = await detector.detect(image);

  if (!faces.length) {
    return { error: "No se detectó un rostro claro en una de las imágenes." };
  }

  const face = faces
    .map((item) => item.boundingBox)
    .sort((a, b) => b.width * b.height - a.width * a.height)[0];

  return { face };
};

const extractFaceVector = (image, faceBox) => {
  const { width, height } = getDimensions(image);
  const expandX = faceBox.width * 0.28;
  const expandY = faceBox.height * 0.36;
  const sx = clamp(faceBox.x - expandX, 0, width);
  const sy = clamp(faceBox.y - expandY, 0, height);
  const sw = clamp(faceBox.width + expandX * 2, 1, width - sx);
  const sh = clamp(faceBox.height + expandY * 2, 1, height - sy);

  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const values = [];
  for (let index = 0; index < pixels.length; index += 4) {
    values.push(
      (pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114) /
        255,
    );
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const deviation = Math.sqrt(variance) || 1;

  return values.map((value) => (value - mean) / deviation);
};

const cosineSimilarity = (a, b) => {
  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    magnitudeA += a[index] ** 2;
    magnitudeB += b[index] ** 2;
  }

  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB) || 1);
};

export async function verificarIdentidadLocal(documentoFile, selfieFile) {
  if (!documentoFile && !selfieFile) {
    return null;
  }

  if (!documentoFile || !selfieFile) {
    return {
      estado: "pendiente",
      score: null,
      metodo: "comparacion_facial_local",
      mensaje:
        "Sube una imagen del INE o identificación y una foto del rostro para registrar la verificación.",
    };
  }

  if (!isImageFile(documentoFile) || !isImageFile(selfieFile)) {
    return {
      estado: "pendiente",
      score: null,
      metodo: "comparacion_facial_local",
      mensaje:
        "Archivos recibidos. La comparación automática de rostro funciona mejor con imágenes; este registro queda pendiente.",
    };
  }

  let documento;
  let selfie;

  try {
    documento = await loadBitmap(documentoFile);
    selfie = await loadBitmap(selfieFile);
    const documentoDetectado = await detectMainFace(documento);
    const selfieDetectada = await detectMainFace(selfie);

    if (documentoDetectado.error || selfieDetectada.error) {
      return {
        estado: "pendiente",
        score: null,
        metodo: "comparacion_facial_local",
        mensaje: documentoDetectado.error || selfieDetectada.error,
      };
    }

    const documentoVector = extractFaceVector(documento, documentoDetectado.face);
    const selfieVector = extractFaceVector(selfie, selfieDetectada.face);
    const similarity = cosineSimilarity(documentoVector, selfieVector);
    const score = Math.round(clamp((similarity - 0.45) / 0.35, 0, 1) * 100);

    if (score >= FACE_SCORE_VERIFIED) {
      return {
        estado: "verificado",
        score,
        metodo: "comparacion_facial_local",
        mensaje:
          "INE y foto del rostro revisados automáticamente. La similitud fue suficiente para aprobar la verificación.",
      };
    }

    return {
      estado: "pendiente",
      score,
      metodo: "comparacion_facial_local",
      mensaje:
        "INE y foto del rostro recibidos. La comparación no fue concluyente, así que la verificación queda pendiente.",
    };
  } catch (error) {
    return {
      estado: "pendiente",
      score: null,
      metodo: "comparacion_facial_local",
      mensaje: `No se pudo completar la comparación automática: ${error.message}`,
    };
  } finally {
    documento?.close?.();
    selfie?.close?.();
  }
}
