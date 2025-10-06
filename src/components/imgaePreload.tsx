import { useEffect, useState } from "react"

export function useImagePreload(images: string[]) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!images || images.length === 0) return

    let loadedCount = 0
    const handleDone = () => {
      loadedCount++
      if (loadedCount === images.length) setLoaded(true)
    }

    images.forEach((src) => {
      const img = new Image()
      img.src = src
      img.onload = handleDone
      img.onerror = handleDone
    })
  }, [images])

  return loaded
}
