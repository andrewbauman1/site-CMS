/**
 * Client-side image dimension calculation utilities
 * Uses browser Image API to extract dimensions and calculate ratio/orientation
 */

export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number; ratio: number; orientation: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      const width = img.width
      const height = img.height
      const ratio = width / height

      // Determine orientation based on ratio
      const orientation = ratio > 1 ? 'landscape' : (ratio < 1 ? 'portrait' : 'square')

      resolve({ width, height, ratio, orientation })

      // Clean up object URL to prevent memory leaks
      URL.revokeObjectURL(img.src)
    }

    img.onerror = reject

    // Create object URL from file blob
    img.src = URL.createObjectURL(file)
  })
}
