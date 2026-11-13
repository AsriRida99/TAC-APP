import { Box, Card, CardContent, Typography } from "@mui/material"

export default function ChartCard({ title, subtitle, children, empty, emptyText = "Aucune donnée pour le moment" }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography sx={{ fontWeight: 700, fontSize: "1rem" }}>{title}</Typography>
        {subtitle && <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>{subtitle}</Typography>}
        <Box sx={{ mt: 1 }}>
          {empty ? (
            <Box sx={{ height: "16.25rem", display: "grid", placeItems: "center", color: "text.secondary", fontSize: "0.875rem" }}>
              {emptyText}
            </Box>
          ) : (
            children
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
