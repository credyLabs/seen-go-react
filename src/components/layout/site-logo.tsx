import seengoLogo from "@/assets/seengo-logo-trimmed.png"
import { Link } from "@tanstack/react-router"
import { cn } from "cn"

// The logo has dark navy lettering, so on navy backgrounds (footer, dark mode)
// it's rendered as a white silhouette.
// TODO: replace the silhouette with a proper light logo variant when available
export function SiteLogo({
  tone = "dark",
  className,
}: {
  tone?: "dark" | "light"
  className?: string
}) {
  return (
    <Link to="/" className={cn("flex shrink-0", className)}>
      <img
        src={seengoLogo}
        alt="SeenGo — Where Discovery Meets Delivery"
        className={cn(
          "h-10 w-auto",
          tone === "light"
            ? "brightness-0 invert"
            : "dark:brightness-0 dark:invert"
        )}
      />
    </Link>
  )
}
