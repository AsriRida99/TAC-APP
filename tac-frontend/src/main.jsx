import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@fontsource/inter/400.css"
import "@fontsource/inter/500.css"
import "@fontsource/inter/600.css"
import "@fontsource/inter/700.css"
import "./scale.css"
import { applyDisplaySize } from "./utils/displaySize"
import { ColorModeProvider } from "./colorMode"
import { AuthProvider } from "./auth/AuthContext"
import { I18nProvider } from "./i18n/I18nContext"
import App from "./App"

applyDisplaySize()

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ColorModeProvider>
      <I18nProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </I18nProvider>
    </ColorModeProvider>
  </StrictMode>
)
