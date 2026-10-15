import { useId } from "react"

import { cn } from "@/lib/utils"

// The SeenGo mark from the logo as an SVG: a navy "S" riding a copper cart,
// with speed lines and wheels. `animated` turns it into a loader (honours
// reduced-motion); `muted` greys it out for error states.
export function BrandMark({
  animated = false,
  muted = false,
  className,
}: {
  animated?: boolean
  muted?: boolean
  className?: string
}) {
  // Unique gradient ids so several marks can share a page
  const id = useId().replace(/:/g, "")

  return (
    <svg
      viewBox="0 0 120 100"
      aria-hidden
      className={cn(
        // Logo colours; lighter navy in dark mode so the S stays visible
        "[--mark-navy-a:#2c51a8] [--mark-navy-b:#0d2b45] [--mark-copper-a:#a35a22] [--mark-copper-b:#dd9346]",
        "dark:[--mark-navy-a:#c5d3f2] dark:[--mark-navy-b:#8fa6dc]",
        muted && "opacity-60 grayscale",
        className
      )}
    >
      <defs>
        <linearGradient id={`${id}-navy`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--mark-navy-a)" />
          <stop offset="1" stopColor="var(--mark-navy-b)" />
        </linearGradient>
        <linearGradient id={`${id}-copper`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--mark-copper-a)" />
          <stop offset="1" stopColor="var(--mark-copper-b)" />
        </linearGradient>
      </defs>

      {/* Speed lines trailing the cart. Solid colour: a gradient sized to a flat
          line (zero height) would not render */}
      <g stroke="var(--mark-navy-a)" strokeWidth="4" strokeLinecap="round">
        {[
          ["M4 54 H26", "0s"],
          ["M10 63 H30", "-0.2s"],
          ["M6 72 H28", "-0.4s"],
        ].map(([d, delay]) => (
          <path
            key={d}
            d={d}
            strokeDasharray={animated ? "14 10" : undefined}
            className={animated ? "motion-safe:animate-[brand-speed_0.6s_linear_infinite_reverse]" : undefined}
            style={{ animationDelay: delay }}
          />
        ))}
      </g>

      <g className={cn("[transform-box:fill-box]", animated && "motion-safe:animate-[brand-bob_0.9s_ease-in-out_infinite]")}>
        {/* Cart: handle, basket floor and wheels */}
        <path
          d="M8 26 H22 L34 80 H100"
          fill="none"
          stroke={`url(#${id}-copper)`}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {[44, 90].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="90" r="7" fill={`url(#${id}-copper)`} />
            {/* A notch on each wheel so the turning shows */}
            <circle
              cx={cx}
              cy="90"
              r="3.2"
              fill="none"
              stroke="white"
              strokeOpacity="0.85"
              strokeWidth="1.6"
              strokeDasharray="5 15"
              className={cn("origin-center [transform-box:fill-box]", animated && "motion-safe:animate-[brand-spin_0.7s_linear_infinite]")}
            />
          </g>
        ))}

        {/* The "S", drawn as one thick stroke */}
        <path
          d="M90 16 C78 6 46 6 45 26 C44 44 88 40 88 60 C88 78 56 82 40 70"
          fill="none"
          stroke={`url(#${id}-navy)`}
          strokeWidth="15"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={animated ? "1 1" : undefined}
          className={animated ? "motion-safe:animate-[brand-draw_1.8s_ease-in-out_infinite]" : undefined}
        />
        {/* Copper arrow tip on the S, as in the logo */}
        <path d="M84 46 L106 54 L86 64 Z" fill={`url(#${id}-copper)`} />
      </g>
    </svg>
  )
}
