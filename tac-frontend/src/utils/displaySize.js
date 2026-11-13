const KEY = "tac_display_size"

export const DISPLAY_SIZES = [
  { value: 100, label: "Normale" },
  { value: 125, label: "Grande" },
  { value: 150, label: "Très grande" },
  { value: 175, label: "Écran de présentation" },
  { value: 200, label: "Écran géant" },
]

export function getDisplaySize() {
  try {
    const v = Number(localStorage.getItem(KEY))
    return DISPLAY_SIZES.some((o) => o.value === v) ? v : 100
  } catch {
    return 100
  }
}

export function applyDisplaySize(value = getDisplaySize()) {
  const root = document.documentElement
  if (value === 100) root.style.removeProperty("font-size")
  else root.style.fontSize = `${value}%`
  window.dispatchEvent(new Event("resize"))
}

export function setDisplaySize(value) {
  try {
    localStorage.setItem(KEY, String(value))
  } catch {
  }
  applyDisplaySize(value)
}
