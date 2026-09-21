export const compressPhoto = async (file: File) => {
  const image = await createImageBitmap(file)
  const ratio = Math.min(1, 1600 / Math.max(image.width, image.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(image.width * ratio)
  canvas.height = Math.round(image.height * ratio)
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Photo processing is not available")
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Photo compression failed")), "image/webp", 0.78))
  return new File([blob], `${crypto.randomUUID()}.webp`, { type: "image/webp" })
}
