import * as React from "react"
import { useTranslation } from "react-i18next"

import { DirectionProvider } from "@/components/ui/direction"
import { getDirection } from "@/i18n/direction"

// Keeps <html dir/lang> and Base UI's direction in sync with the active language
export function LanguageDirectionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language
  const direction = getDirection(language)

  React.useLayoutEffect(() => {
    document.documentElement.dir = direction
    document.documentElement.lang = language
  }, [direction, language])

  return <DirectionProvider direction={direction}>{children}</DirectionProvider>
}
