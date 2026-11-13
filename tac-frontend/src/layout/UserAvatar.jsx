import { Avatar } from "@mui/material"

function initials(nom = "") {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("")
}

export default function UserAvatar({ user, size = 36, sx }) {
  return (
    <Avatar
      src={user?.avatar || undefined}
      alt={user?.nom}
      sx={{ width: `${size / 16}rem`, height: `${size / 16}rem`, background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)", fontSize: `${(size * 0.4) / 16}rem`, fontWeight: 600, ...sx }}
    >
      {initials(user?.nom)}
    </Avatar>
  )
}
