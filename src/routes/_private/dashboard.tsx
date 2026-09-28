import { useAuth } from "@/lib/auth"
import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

export const Route = createFileRoute("/_private/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  return (
    <div className="flex flex-col gap-4 text-sm">
      <h1 className="text-2xl font-semibold">{t("dashboard")}</h1>
      <p>
        {t("welcome")}, {user?.firstName}
      </p>
    </div>
  )
}
