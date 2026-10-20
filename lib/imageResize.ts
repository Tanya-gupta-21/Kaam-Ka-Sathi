// Shrinks a photo in the browser before it is sent to the AI.
// Smaller photos are faster and stay under the server size limit.
export async function resizeImageToBase64(
  file: File,
  maxSize = 1024,
  quality = 0.8
): Promise<{ data: string; mediaType: "image/jpeg" }> {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new Error("Image processing is not supported in this browser.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", quality);

  return {
    data: dataUrl.split(",")[1],
    mediaType: "image/jpeg",
  };
}