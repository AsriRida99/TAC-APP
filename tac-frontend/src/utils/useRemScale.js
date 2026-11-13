import { useEffect, useState } from "react"

function read() {
  if (typeof window === "undefined") return 1
  return parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 || 1
}

export default function useRemScale() {
  const [scale, setScale] = useState(read)
  useEffect(() => {
    const onResize = () => setScale(read())
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])
  return scale
}
