// frontend/src/hooks/useDestinationPhoto.ts
import { useState, useEffect } from 'react'
import { fetchDestinationPhoto } from '../utils/unsplashPhoto'

export function useDestinationPhoto(destination: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!destination) { setUrl(null); return }
    fetchDestinationPhoto(destination).then(setUrl)
  }, [destination])

  return url
}
