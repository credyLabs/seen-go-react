import { useTranslation } from "react-i18next"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <Select
      value={i18n.language}
      onValueChange={(language) => {
        void i18n.changeLanguage(language)
      }}
    >
      <SelectTrigger className="w-[150px]">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="en">English</SelectItem>

        <SelectItem value="ta">தமிழ்</SelectItem>

        <SelectItem value="ar">العربية</SelectItem>
      </SelectContent>
    </Select>
  )
}
