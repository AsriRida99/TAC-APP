import DashboardOutlined from "@mui/icons-material/DashboardOutlined"
import TextFieldsOutlined from "@mui/icons-material/TextFieldsOutlined"
import LightbulbOutlined from "@mui/icons-material/LightbulbOutlined"
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined"
import CompareArrowsOutlined from "@mui/icons-material/CompareArrowsOutlined"
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined"
import SyncOutlined from "@mui/icons-material/SyncOutlined"
import ManageAccountsOutlined from "@mui/icons-material/ManageAccountsOutlined"

export const navigation = [
  {
    section: "nav.section.pilotage",
    items: [{ path: "/", label: "nav.dashboard", icon: DashboardOutlined, color: "#6366f1" }],
  },
  {
    section: "nav.section.curation",
    items: [
      { path: "/termes", label: "nav.termes", icon: TextFieldsOutlined, color: "#0ea5e9" },
      { path: "/concepts", label: "nav.concepts", icon: LightbulbOutlined, color: "#14b8a6" },
      { path: "/thesaurus", label: "nav.thesaurus", icon: AccountTreeOutlined, color: "#f59e0b" },
      { path: "/alignements", label: "nav.alignements", icon: CompareArrowsOutlined, color: "#8b5cf6", wip: true },
      { path: "/export", label: "nav.export", icon: FileDownloadOutlined, color: "#f43f5e", wip: true },
    ],
  },
  {
    section: "nav.section.admin",
    items: [
      { path: "/synchronisation", label: "nav.sync", icon: SyncOutlined, color: "#10b981" },
      { path: "/administration", label: "nav.users", icon: ManageAccountsOutlined, color: "#f97316", adminOnly: true },
    ],
  },
]

export const allNavItems = navigation.flatMap((s) => s.items)
