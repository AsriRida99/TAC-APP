import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import RequireAuth from "./auth/RequireAuth"
import { DemoProvider } from "./demo/DemoStore"
import AppLayout from "./layout/AppLayout"
import Login from "./pages/Login"
import Dashboard from "./pages/dashboard/Dashboard"
import Termes from "./pages/Termes"
import Concepts from "./pages/Concepts"
import Thesaurus from "./pages/Thesaurus"
import Alignements from "./pages/Alignements"
import Export from "./pages/Export"
import Synchronisation from "./pages/Synchronisation"
import Administration from "./pages/Administration"
import { useAuth } from "./auth/AuthContext"

function AdminOnly({ children }) {
  const { user } = useAuth()
  return user?.role === "admin" ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <RequireAuth>
              <DemoProvider>
                <AppLayout />
              </DemoProvider>
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="termes" element={<Termes />} />
          <Route path="concepts" element={<Concepts />} />
          <Route path="thesaurus" element={<Thesaurus />} />
          <Route path="alignements" element={<Alignements />} />
          <Route path="export" element={<Export />} />
          <Route path="synchronisation" element={<Synchronisation />} />
          <Route path="administration" element={<AdminOnly><Administration /></AdminOnly>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
