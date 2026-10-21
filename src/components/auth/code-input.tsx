import { REGEXP_ONLY_DIGITS } from "input-otp"

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

// The 6-digit code the auth service emails (sign-up confirmation, password reset)
export const CODE_LENGTH = 6

export function CodeInput({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  invalid?: boolean
}) {
  return (
    <InputOTP
      id={id}
      name={id}
      maxLength={CODE_LENGTH}
      pattern={REGEXP_ONLY_DIGITS}
      // Codes are often pasted as "48 29 13"
      pasteTransformer={(text) => text.replace(/\D/g, "")}
      autoComplete="one-time-code"
      required
      autoFocus
      value={value}
      onChange={onChange}
      aria-invalid={invalid || undefined}
      // Digits read left to right in Arabic too
      dir="ltr"
      containerClassName="justify-center"
    >
      <InputOTPGroup>
        {Array.from({ length: CODE_LENGTH }, (_, index) => (
          <InputOTPSlot key={index} index={index} aria-invalid={invalid || undefined} className="size-11 text-lg" />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}
