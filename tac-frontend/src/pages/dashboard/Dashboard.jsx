import { useMemo } from "react"
import Chart from "react-apexcharts"
import {
  Box, Chip, Grid, Table, TableBody, TableCell, TableHead, TableRow, Typography, useTheme,
} from "@mui/material"
import TextFieldsOutlined from "@mui/icons-material/TextFieldsOutlined"
import LightbulbOutlined from "@mui/icons-material/LightbulbOutlined"
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined"
import CompareArrowsOutlined from "@mui/icons-material/CompareArrowsOutlined"
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined"
import StatCard from "../../components/StatCard"
import ChartCard from "../../components/ChartCard"
import { useAuth } from "../../auth/AuthContext"
import { chartColors, viz } from "../../theme"
import useDemoDashboard from "./useDemoDashboard"
import useRemScale from "../../utils/useRemScale"
import { useI18n } from "../../i18n/I18nContext"
import {
  activitySeries, countBy, iterationsDistribution, recentValidations, statusBreakdown, topValidators,
} from "./stats"

const baseChartOptions = {
  chart: { toolbar: { show: false }, fontFamily: "Inter, Segoe UI, Arial, sans-serif", zoom: { enabled: false } },
  dataLabels: { enabled: false },
  grid: { borderColor: "rgba(0,0,0,0.06)", strokeDashArray: 4 },
  legend: { position: "top", horizontalAlign: "left" },
}

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)

export default function Dashboard() {
  const { user } = useAuth()
  const { t } = useI18n()
  const { data } = useDemoDashboard()
  const k = useRemScale()
  const mode = useTheme().palette.mode
  const px = (n) => `${Math.round(n * k)}px`
  const baseChart = {
    ...baseChartOptions,
    chart: { ...baseChartOptions.chart, background: "transparent", foreColor: mode === "dark" ? "#94a3b8" : "#64748b" },
    theme: { mode },
    grid: { ...baseChartOptions.grid, borderColor: mode === "dark" ? "rgba(148,163,184,0.15)" : "rgba(15,23,42,0.06)" },
    legend: { ...baseChartOptions.legend, fontSize: px(13) },
    tooltip: { style: { fontSize: px(12) } },
  }
  const axisLabels = { style: { fontSize: px(11) } }

  const s = useMemo(() => {
    const concepts = data.concepts || []
    const thesauri = data.thesauri || []
    const alignements = data.alignements || []
    return {
      concepts: statusBreakdown(concepts),
      thesauri: statusBreakdown(thesauri),
      alignements: statusBreakdown(alignements),
      activity: activitySeries(data),
      validators: topValidators(data),
      iterations: iterationsDistribution(data.conceptsValides || []),
      alignTypes: [...countBy(alignements, (a) => a.type_alignement).entries()],
      recent: recentValidations(data),
    }
  }, [data])

  const total = (k) => (data[k] || []).length
  const hasActivity = s.activity.series.some((x) => x.data.some(Boolean))

  return (
    <Box>
      <Box
        sx={{
          mb: 2.5, borderRadius: 4, px: { xs: 2.5, md: 3.5 }, py: { xs: 2, md: 2.5 },
          background: "linear-gradient(120deg, #0a0a0a 0%, #312e81 55%, #6366f1 80%, #14b8a6 100%)", color: "#fff",
        }}
      >
        <Typography variant="h5" sx={{ color: "#fff" }}>
          {t("dash.hello", { name: user?.nom?.split(" ")[0] ?? "" })}
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.72)", mt: 0.5, fontSize: "0.9rem" }}>
          {t("dash.summary", { c: s.concepts.valides, t: total("thesauri"), a: total("alignements"), n: (data.termes || []).filter((x) => x.statut === "nouveau").length })}
        </Typography>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
          <StatCard label={t("dash.kpi.termes")} value={total("termes")} icon={TextFieldsOutlined} color={viz.indigo} hint={t("dash.kpi.termesHint")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
          <StatCard
            label={t("dash.kpi.concepts")} value={`${s.concepts.valides} / ${total("termes")}`} icon={LightbulbOutlined}
            color={viz.teal} progress={pct(s.concepts.valides, total("termes"))}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
          <StatCard
            label={t("dash.kpi.thesauri")} value={`${s.thesauri.valides} / ${total("thesauri")}`} icon={AccountTreeOutlined}
            color={viz.amber} progress={pct(s.thesauri.valides, total("thesauri"))}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
          <StatCard
            label={t("dash.kpi.alignements")} value={`${s.alignements.valides} / ${total("alignements")}`} icon={CompareArrowsOutlined}
            color={viz.violet} progress={pct(s.alignements.valides, total("alignements"))}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 12, lg: 2.4 }}>
          <StatCard label={t("dash.kpi.exports")} value={total("exports")} icon={FileDownloadOutlined} color={viz.rose} hint={t("dash.kpi.exportsHint")} />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ChartCard title={t("dash.activity")} subtitle={t("dash.activitySub")} emptyText={t("dash.empty")} empty={!hasActivity}>
            <Chart
              type="area"
              height={280 * k}
              series={s.activity.series.map((x, i) => ({ ...x, name: [t("dash.serie.concepts"), t("dash.serie.thesauri"), t("dash.serie.alignements")][i] }))}
              options={{
                ...baseChart,
                colors: chartColors.slice(0, 3),
                stroke: { curve: "smooth", width: 2.5 * k },
                fill: { type: "gradient", gradient: { opacityFrom: 0.35, opacityTo: 0.02 } },
                xaxis: {
                  categories: s.activity.labels.map((d) => d.slice(8, 10) + "/" + d.slice(5, 7)),
                  tickAmount: 10,
                  labels: { rotate: 0, ...axisLabels },
                },
                yaxis: { labels: { formatter: (v) => Math.round(v), ...axisLabels } },
              }}
            />
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <ChartCard title={t("dash.status")} subtitle={t("dash.statusSub")} emptyText={t("dash.empty")} empty={total("concepts") === 0}>
            <Chart
              type="donut"
              height={280 * k}
              series={[s.concepts.valides, s.concepts.enAttente, s.concepts.rejetes]}
              options={{
                ...baseChart,
                labels: [t("dash.status.validated"), t("dash.status.pending"), t("dash.status.rejected")],
                colors: [viz.emerald, viz.amber, viz.rose],
                legend: { position: "bottom" },
                plotOptions: { pie: { donut: { size: "68%", labels: { show: true, total: { show: true, label: t("dash.total") } } } } },
                stroke: { width: 2 },
              }}
            />
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <ChartCard title={t("dash.validators")} subtitle={t("dash.validatorsSub")} emptyText={t("dash.empty")} empty={s.validators.length === 0}>
            <Chart
              type="bar"
              height={280 * k}
              series={[{ name: t("dash.serie.validations"), data: s.validators.map((v) => v[1]) }]}
              options={{
                ...baseChart,
                colors: [viz.indigo],
                fill: { type: "gradient", gradient: { shade: "light", type: "horizontal", gradientToColors: [viz.sky], stops: [0, 100] } },
                plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "55%" } },
                xaxis: { categories: s.validators.map((v) => v[0]), labels: { formatter: (v) => Math.round(v), ...axisLabels } },
                yaxis: { labels: axisLabels },
                legend: { show: false },
              }}
            />
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <ChartCard title={t("dash.iterations")} subtitle={t("dash.iterationsSub")} emptyText={t("dash.empty")} empty={s.iterations.length === 0}>
            <Chart
              type="bar"
              height={280 * k}
              series={[{ name: t("dash.serie.concepts"), data: s.iterations.map((v) => v[1]) }]}
              options={{
                ...baseChart,
                colors: [viz.teal],
                fill: { type: "gradient", gradient: { shade: "light", type: "vertical", gradientToColors: [viz.emerald], stops: [0, 100] } },
                plotOptions: { bar: { borderRadius: 4, columnWidth: "45%" } },
                xaxis: { categories: s.iterations.map((v) => `${v[0]} it.`), labels: axisLabels },
                yaxis: { labels: { formatter: (v) => Math.round(v), ...axisLabels } },
                legend: { show: false },
              }}
            />
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <ChartCard title={t("dash.alignTypes")} subtitle={t("dash.alignTypesSub")} emptyText={t("dash.empty")} empty={s.alignTypes.length === 0}>
            <Chart
              type="pie"
              height={280 * k}
              series={s.alignTypes.map((t) => t[1])}
              options={{ ...baseChart, labels: s.alignTypes.map((t) => t[0]), colors: chartColors, legend: { position: "bottom" }, stroke: { width: 2 } }}
            />
          </ChartCard>
        </Grid>

        <Grid size={12}>
          <ChartCard title={t("dash.recent")} emptyText={t("dash.empty")} empty={s.recent.length === 0}>
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t("dash.col.type")}</TableCell>
                    <TableCell>{t("dash.col.element")}</TableCell>
                    <TableCell>{t("dash.col.status")}</TableCell>
                    <TableCell>{t("dash.col.by")}</TableCell>
                    <TableCell>{t("dash.col.date")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {s.recent.map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell><Chip size="small" label={r.type} variant="outlined" /></TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{r.label}</TableCell>
                      <TableCell>
                        <Chip size="small" label={r.statut || "—"} color={(r.statut || "").startsWith("valid") ? "success" : "default"} />
                      </TableCell>
                      <TableCell>{r.by || "—"}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{String(r.at).slice(0, 16).replace("T", " ")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  )
}
