import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import {
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

const HIDE_CONTROLS_MS = 2500
const SEEK_STEP_S = 5
const VOLUME_STEP = 0.1
const SPEEDS = [1, 1.25, 1.5, 2, 0.5]

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00"
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, "0")
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`
}

function firstValue(value: number | readonly number[]) {
  return typeof value === "number" ? value : value[0]
}

interface VideoPlayerProps {
  src: string
  poster?: string
  // Accessible name for the player, e.g. the product name
  title: string
  autoPlay?: boolean
  className?: string
}

// Custom controls over a native <video>: big play button, seek bar with
// buffered range, volume, speed, fullscreen, keyboard shortcuts, and controls
// that fade out while playing. Controls stay left-to-right in RTL, like a timeline.
export function VideoPlayer({ src, poster, title, autoPlay, className }: VideoPlayerProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const [playing, setPlaying] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [started, setStarted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)

  const video = () => videoRef.current

  const togglePlay = useCallback(() => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) void el.play()
    else el.pause()
  }, [])

  const seekTo = (time: number) => {
    const el = video()
    if (!el || !Number.isFinite(el.duration)) return
    el.currentTime = Math.min(Math.max(time, 0), el.duration)
  }

  const setVolumeLevel = (level: number) => {
    const el = video()
    if (!el) return
    el.volume = Math.min(Math.max(level, 0), 1)
    el.muted = el.volume === 0
  }

  const toggleMute = () => {
    const el = video()
    if (!el) return
    // Unmuting from zero volume would stay silent, so restore a sensible level
    if (el.muted && el.volume === 0) el.volume = 0.5
    el.muted = !el.muted
  }

  const cycleSpeed = () => {
    const el = video()
    if (!el) return
    const next = SPEEDS[(SPEEDS.indexOf(el.playbackRate) + 1) % SPEEDS.length]
    el.playbackRate = next
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void containerRef.current?.requestFullscreen()
  }

  // Show controls, then hide them again after a pause in activity while playing
  const revealControls = useCallback(() => {
    setControlsVisible(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setControlsVisible(false)
    }, HIDE_CONTROLS_MS)
  }, [])

  useEffect(() => {
    const onFullscreenChange = () =>
      setFullscreen(document.fullscreenElement === containerRef.current)
    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange)
      clearTimeout(hideTimer.current)
    }
  }, [])

  const updateBuffered = () => {
    const el = video()
    if (!el || !el.duration) return
    const ranges = el.buffered
    // Use the buffered range that contains the playhead
    for (let i = 0; i < ranges.length; i++) {
      if (ranges.start(i) <= el.currentTime && el.currentTime <= ranges.end(i)) {
        setBuffered(ranges.end(i) / el.duration)
        return
      }
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Let focused buttons and sliders handle their own keys
    const target = event.target as HTMLElement
    if (target !== containerRef.current) return
    const el = video()
    if (!el) return
    switch (event.key) {
      case " ":
      case "k":
        togglePlay()
        break
      case "ArrowRight":
        seekTo(el.currentTime + SEEK_STEP_S)
        break
      case "ArrowLeft":
        seekTo(el.currentTime - SEEK_STEP_S)
        break
      case "ArrowUp":
        setVolumeLevel(el.volume + VOLUME_STEP)
        break
      case "ArrowDown":
        setVolumeLevel(el.volume - VOLUME_STEP)
        break
      case "m":
        toggleMute()
        break
      case "f":
        toggleFullscreen()
        break
      default:
        return
    }
    event.preventDefault()
    revealControls()
  }

  const showControls = controlsVisible || !playing
  const progress = duration ? currentTime / duration : 0
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={t("videoPlayer.label", { title })}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerMove={revealControls}
      onFocus={revealControls}
      className={cn(
        "group/player relative overflow-hidden bg-black outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        fullscreen && "flex items-center justify-center",
        !showControls && "cursor-none",
        className
      )}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        playsInline
        preload="metadata"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onPlay={() => {
          setPlaying(true)
          setStarted(true)
          revealControls()
        }}
        onPause={() => setPlaying(false)}
        // When it finishes, go back to the start screen: first frame, big play button, no control bar
        onEnded={(e) => {
          setPlaying(false)
          setStarted(false)
          e.currentTarget.currentTime = 0
        }}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onCanPlay={() => setWaiting(false)}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime)
          updateBuffered()
        }}
        onProgress={updateBuffered}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onVolumeChange={(e) => {
          setVolume(e.currentTarget.volume)
          setMuted(e.currentTarget.muted)
        }}
        onRateChange={(e) => setSpeed(e.currentTarget.playbackRate)}
        className={cn("size-full object-cover", fullscreen && "object-contain")}
      />

      {/* Big centre button while paused, spinner while buffering */}
      {waiting && playing ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Loader2 className="size-12 animate-spin text-white drop-shadow" />
        </div>
      ) : (
        !playing && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label={t("videoPlayer.play")}
            className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full bg-brand-navy text-white shadow-lg ring-4 ring-white/25 transition-transform hover:scale-105"
          >
            <Play className="ms-1 size-7 fill-current" />
          </button>
        )
      )}

      {/* Control bar */}
      <div
        dir="ltr"
        className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-linear-to-t from-brand-navy/95 via-brand-navy/55 to-transparent px-3 pt-10 pb-2 text-white transition-opacity duration-300",
          showControls && started ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <SliderPrimitive.Root
          value={currentTime}
          min={0}
          max={duration || 1}
          step={0.01}
          onValueChange={(value) => seekTo(firstValue(value))}
          aria-label={t("videoPlayer.seek")}
          className="group/seek w-full"
        >
          <SliderPrimitive.Control className="relative flex h-4 w-full cursor-pointer touch-none items-center select-none">
            <SliderPrimitive.Track className="relative h-1 w-full overflow-hidden rounded-full bg-white/45 transition-[height] group-hover/seek:h-1.5">
              <div
                className="absolute inset-y-0 left-0 bg-white/75"
                style={{ width: `${Math.max(buffered, progress) * 100}%` }}
              />
              {/* Navy like the play button; the light track behind keeps it visible */}
              <SliderPrimitive.Indicator className="h-full bg-brand-navy" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb
              getAriaValueText={(_formatted, value) =>
                t("videoPlayer.timeOf", { current: formatTime(value), total: formatTime(duration) })
              }
              className="size-3.5 rounded-full border-2 border-white bg-brand-navy shadow opacity-0 transition-opacity group-hover/seek:opacity-100 focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-white/50 focus-visible:outline-none" />
          </SliderPrimitive.Control>
        </SliderPrimitive.Root>

        <div className="flex items-center gap-1">
          <ControlButton
            label={t(playing ? "videoPlayer.pause" : "videoPlayer.play")}
            onClick={togglePlay}
          >
            {playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
          </ControlButton>

          <div className="group/volume flex items-center">
            <ControlButton
              label={t(muted || volume === 0 ? "videoPlayer.unmute" : "videoPlayer.mute")}
              onClick={toggleMute}
            >
              <VolumeIcon />
            </ControlButton>
            {/* Volume slider opens on hover/focus; phones use the hardware buttons */}
            <SliderPrimitive.Root
              value={muted ? 0 : volume}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(value) => setVolumeLevel(firstValue(value))}
              aria-label={t("videoPlayer.volume")}
              className="hidden w-0 overflow-hidden opacity-0 transition-all duration-200 group-focus-within/volume:w-20 group-focus-within/volume:opacity-100 group-hover/volume:w-20 group-hover/volume:opacity-100 sm:block"
            >
              <SliderPrimitive.Control className="relative mx-1.5 flex h-8 cursor-pointer touch-none items-center select-none">
                <SliderPrimitive.Track className="relative h-1 w-full overflow-hidden rounded-full bg-white/45">
                  <SliderPrimitive.Indicator className="h-full bg-brand-navy" />
                </SliderPrimitive.Track>
                <SliderPrimitive.Thumb className="size-3 rounded-full border-2 border-white bg-brand-navy shadow focus-visible:ring-3 focus-visible:ring-white/50 focus-visible:outline-none" />
              </SliderPrimitive.Control>
            </SliderPrimitive.Root>
          </div>

          <span className="px-1.5 text-xs tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="ms-auto flex items-center gap-1">
            <ControlButton label={t("videoPlayer.speed", { speed })} onClick={cycleSpeed}>
              <span className="text-xs font-semibold tabular-nums">{speed}×</span>
            </ControlButton>
            <ControlButton
              label={t(fullscreen ? "videoPlayer.exitFullscreen" : "videoPlayer.fullscreen")}
              onClick={toggleFullscreen}
            >
              {fullscreen ? <Minimize /> : <Maximize />}
            </ControlButton>
          </div>
        </div>
      </div>
    </div>
  )
}

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none [&_svg]:size-4.5"
    >
      {children}
    </button>
  )
}
