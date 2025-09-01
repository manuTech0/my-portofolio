import { useEffect, useState } from "react"

export function useImagePreload(imageArray: string[]) {
    const [imageLoaded, setImageLoaded] = useState(false)
    useEffect(() => {
        let loadedCount = 0
        const length = imageArray.length

        imageArray.forEach((item) => {
            const img = new Image()
            img.src = item
            img.onload = () => {
                loadedCount += 1
                if(loadedCount === length) {
                    setImageLoaded(true)
                }
            }
            img.onerror = () => {
                loadedCount += 1
                if(loadedCount === length) {
                    setImageLoaded(true)
                }
            }
        })
    }, [imageArray])
    return imageLoaded
}