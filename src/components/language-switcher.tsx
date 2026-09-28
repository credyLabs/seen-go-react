import { cn } from "cn"
import { Globe } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getDirection } from "@/i18n/direction"

const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
] as const

function NativeName({ code, name }: { code: string; name: string }) {
  return (
    <span lang={code} dir={getDirection(code)}>
      {name}
    </span>
  )
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation()
  const current = i18n.resolvedLanguage ?? i18n.language

  return (
    <Select
      value={current}
      onValueChange={(language) => {
        if (language) void i18n.changeLanguage(language)
      }}
    >
      <SelectTrigger
        aria-label="Language"
        className={cn("h-8 rounded-full bg-card", className)}
      >
        <Globe className="text-muted-foreground" />
        <SelectValue>
          {(value: string) => {
            const language = LANGUAGES.find((l) => l.code === value)
            return language ? (
              <NativeName code={language.code} name={language.nativeName} />
            ) : null
          }}
        </SelectValue>
      </SelectTrigger>

      <SelectContent
        align="end"
        alignItemWithTrigger={false}
        className="w-60 min-w-60 overflow-hidden rounded-lg p-0 shadow-lg"
      >
        {LANGUAGES.map((language) => (
          <SelectItem
            key={language.code}
            value={language.code}
            className="h-10 rounded-none border-b ps-3 pe-9 last:border-b-0 data-highlighted:bg-muted data-selected:bg-accent"
          >
            <Globe className="text-primary dark:text-foreground" />
            <span className="font-semibold">{language.name}</span>
            <span className="ms-auto text-muted-foreground">
              <NativeName code={language.code} name={language.nativeName} />
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
