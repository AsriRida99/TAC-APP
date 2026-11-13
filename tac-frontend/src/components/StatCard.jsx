import { Box, Card, CardContent, LinearProgress, Typography } from "@mui/material"
import { alpha } from "@mui/material/styles"
import { brand } from "../theme"

export default function StatCard({ label, value, icon: Icon, color = brand.accent, progress, hint }) {
  return (
    <Card sx={{ height: "100%", transition: "transform .15s ease, box-shadow .15s ease", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 12px 28px rgba(31,26,23,0.08)" } }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {label}
            </Typography>
            <Typography sx={{ fontSize: "clamp(1.5rem, 1.8vw, 2rem)", fontWeight: 800, lineHeight: 1.25, mt: 0.5, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>
              {value}
            </Typography>
          </Box>
          {Icon && (
            <Box sx={{ width: "2.75rem", height: "2.75rem", borderRadius: 3, display: "grid", placeItems: "center", background: `linear-gradient(135deg, ${color}, ${alpha(color, 0.7)})`, color: "#fff", boxShadow: `0 6px 14px -6px ${alpha(color, 0.7)}`, flexShrink: 0 }}>
              <Icon />
            </Box>
          )}
        </Box>
        {progress !== undefined && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ mt: 2, height: "0.375rem", bgcolor: alpha(color, 0.15), "& .MuiLinearProgress-bar": { backgroundImage: "none", bgcolor: color } }}
          />
        )}
        {hint && <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", mt: 1.25 }}>{hint}</Typography>}
      </CardContent>
    </Card>
  )
}
