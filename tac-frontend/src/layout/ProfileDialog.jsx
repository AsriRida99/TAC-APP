import { useState } from "react"
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField,
} from "@mui/material"
import { useAuth } from "../auth/AuthContext"
import UserAvatar from "./UserAvatar"
import { fileToAvatar } from "./avatarImage"

export default function ProfileDialog({ open, onClose }) {
  const { user, updateProfile } = useAuth()
  const [nom, setNom] = useState(user?.nom ?? "")
  const [avatar, setAvatar] = useState(user?.avatar ?? null)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  async function pickImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setAvatar(await fileToAvatar(file))
      setError("")
    } catch (err) {
      setError(err.message)
    }
  }

  async function save() {
    setSaving(true)
    try {
      await updateProfile({ nom, avatar: avatar ?? "" })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Mon profil</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ alignItems: "center", pt: 1 }}>
          <UserAvatar user={{ nom, avatar }} size={88} />
          <Stack direction="row" spacing={1}>
            <Button component="label" variant="outlined" size="small">
              Changer la photo
              <input hidden type="file" accept="image/*" onChange={pickImage} />
            </Button>
            {avatar && (
              <Button size="small" color="inherit" onClick={() => setAvatar(null)}>
                Retirer
              </Button>
            )}
          </Stack>
          <TextField label="Nom complet" value={nom} onChange={(e) => setNom(e.target.value)} fullWidth />
          {error && <Alert severity="error" sx={{ width: "100%" }}>{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Annuler</Button>
        <Button onClick={save} variant="contained" disabled={!nom.trim() || saving}>Enregistrer</Button>
      </DialogActions>
    </Dialog>
  )
}
