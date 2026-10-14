import { Eye, EyeOff } from "lucide-react"
import * as React from "react"
import { useTranslation } from "react-i18next"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Password field with a show/hide button at its end, shown only once something
// is typed. Takes the same props as Input (id, name, value, aria-*, …); `type`
// is managed here. Works controlled (value) or uncontrolled.
export function PasswordInput({ className, onChange, ...props }: Omit<React.ComponentProps<typeof Input>, "type">) {
  const { t } = useTranslation()
  const [visible, setVisible] = React.useState(false)
  // Uncontrolled fields report their emptiness through onChange
  const [typed, setTyped] = React.useState(false)
  const hasValue = props.value !== undefined ? String(props.value).length > 0 : typed

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible && hasValue ? "text" : "password"}
        onChange={(event) => {
          setTyped(event.target.value.length > 0)
          // Cleared: hide it again so the next password starts masked
          if (!event.target.value) setVisible(false)
          onChange?.(event)
        }}
        // Room for the button; hide Edge's own reveal icon so there's only one
        className={cn(hasValue && "pe-10", "[&::-ms-reveal]:hidden", className)}
      />
      {hasValue && (
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={t(visible ? "auth.hidePassword" : "auth.showPassword")}
          aria-pressed={visible}
          aria-controls={props.id}
          className="absolute inset-y-0 end-0 flex w-10 items-center justify-center rounded-e-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      )}
    </div>
  )
}
