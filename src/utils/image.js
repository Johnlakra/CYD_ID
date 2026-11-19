// Shrinks a photo in the browser before upload: payment screenshots from phones are often 3-5 MB,
// but the server accepts at most a few MB of JSON. Produces a JPEG data URL under `maxBytes`.
const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file is not an image we can read.'));
    };
    img.src = url;
  });

const dataUrlBytes = (dataUrl) => Math.ceil(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4);

export const resizeImageToDataUrl = async (file, { maxBytes = 1024 * 1024, maxSide = 1600 } = {}) => {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }
  const img = await loadImage(file);
  let side = maxSide;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const scale = Math.min(1, side / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.7, 0.55]) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrlBytes(dataUrl) <= maxBytes) return dataUrl;
    }
    side = Math.round(side * 0.7);
  }
  throw new Error('That image is too large. Please crop it and try again.');
};

export default resizeImageToDataUrl;
