import { SiGoogle, SiX } from "@icons-pack/react-simple-icons"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function SocialAuthButtons({ dividerLabel }: { dividerLabel: string }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Separator className="flex-1" />
        {dividerLabel}
        <Separator className="flex-1" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* TODO: wire up OAuth providers */}
        <Button type="button" variant="outline" className="h-9 rounded-lg">
          <SiGoogle color="default" />
          {t("auth.google")}
        </Button>
        <Button type="button" className="h-9 rounded-lg shadow-md">
          <SiX />
          {t("auth.twitter")}
        </Button>
      </div>
    </div>
  )
}
