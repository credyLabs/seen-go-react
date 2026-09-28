import { queryOptions } from "@tanstack/react-query"

export type CategoryIcon =
  | "smartphone"
  | "laptop"
  | "headphones"
  | "watch"
  | "camera"
  | "gamepad"
  | "tv"
  | "home"
  | "plug"

export interface CategoryLink {
  label: string
  href: string
}

export interface CategoryGroup {
  title: string
  href: string
  links: CategoryLink[]
}

export interface MenuCategory {
  id: string
  label: string
  icon: CategoryIcon
  groups: CategoryGroup[]
}

const group = (title: string, links: string[]): CategoryGroup => ({
  title,
  href: "#",
  links: links.map((label) => ({ label, href: "#" })),
})

// TODO: replace with the real endpoint, e.g. GET /api/categories/menu?lang=xx.
// Labels are expected to come back already localized for `lang`.
const MOCK_MENU: MenuCategory[] = [
  {
    id: "mobile-phones",
    label: "Mobile Phones",
    icon: "smartphone",
    groups: [
      group("Smartphones", ["iPhone", "Samsung Galaxy", "Google Pixel", "OnePlus", "Xiaomi"]),
      group("By Type", ["Foldables", "5G Phones", "Gaming Phones", "Rugged Phones", "Refurbished"]),
      group("Accessories", ["Cases & Covers", "Chargers", "Power Banks", "Screen Protectors", "Cables"]),
    ],
  },
  {
    id: "laptops-computers",
    label: "Laptops & Computers",
    icon: "laptop",
    groups: [
      group("Laptops", ["MacBook Pro", "MacBook Air", "Dell XPS", "HP Spectre", "Lenovo ThinkPad"]),
      group("Desktops & Parts", ["Gaming PCs", "All-in-One PCs", "Processors", "Graphics Cards", "RAM & Storage"]),
      group("Accessories", ["Monitors", "Keyboards & Mice", "Laptop Bags", "Docking Stations", "Webcams"]),
    ],
  },
  {
    id: "audio-headphones",
    label: "Audio & Headphones",
    icon: "headphones",
    groups: [
      group("Headphones", ["AirPods", "Sony WH-1000XM", "Bose QuietComfort", "Beats", "Sennheiser"]),
      group("Speakers", ["Bluetooth Speakers", "Smart Speakers", "Soundbars", "Party Speakers", "Home Theatre"]),
      group("Pro Audio", ["Microphones", "Audio Interfaces", "Studio Monitors", "DJ Equipment", "Turntables"]),
    ],
  },
  {
    id: "wearables",
    label: "Wearables",
    icon: "watch",
    groups: [
      group("Smartwatches", ["Apple Watch", "Galaxy Watch", "Garmin", "Huawei Watch", "Amazfit"]),
      group("Fitness", ["Fitness Trackers", "Smart Rings", "Heart Rate Monitors", "Smart Scales", "GPS Watches"]),
      group("Accessories", ["Watch Straps", "Chargers", "Screen Guards", "Cases", "Docks"]),
    ],
  },
  {
    id: "cameras",
    label: "Cameras",
    icon: "camera",
    groups: [
      group("Cameras", ["Mirrorless", "DSLR", "Action Cameras", "Instant Cameras", "Compact Cameras"]),
      group("Lenses", ["Prime Lenses", "Zoom Lenses", "Wide Angle", "Telephoto", "Macro"]),
      group("Accessories", ["Tripods", "Gimbals", "Memory Cards", "Camera Bags", "Lighting"]),
    ],
  },
  {
    id: "gaming",
    label: "Gaming",
    icon: "gamepad",
    groups: [
      group("Consoles", ["PlayStation 5", "Xbox Series X", "Nintendo Switch", "Steam Deck", "Meta Quest"]),
      group("Games", ["PS5 Games", "Xbox Games", "Switch Games", "PC Games", "Gift Cards"]),
      group("Accessories", ["Controllers", "Gaming Headsets", "Gaming Chairs", "Gaming Mice", "Keyboards"]),
    ],
  },
  {
    id: "tvs-displays",
    label: "TVs & Displays",
    icon: "tv",
    groups: [
      group("Televisions", ["OLED TVs", "QLED TVs", "4K TVs", "8K TVs", "Smart TVs"]),
      group("Projectors", ["Home Projectors", "Portable Projectors", "4K Projectors", "Screens", "Mounts"]),
      group("Accessories", ["Streaming Devices", "TV Mounts", "HDMI Cables", "Remotes", "Soundbars"]),
    ],
  },
  {
    id: "smart-home",
    label: "Smart Home",
    icon: "home",
    groups: [
      group("Security", ["Smart Cameras", "Video Doorbells", "Smart Locks", "Sensors", "Alarm Systems"]),
      group("Automation", ["Smart Plugs", "Smart Lighting", "Hubs", "Thermostats", "Robot Vacuums"]),
      group("Assistants", ["Amazon Echo", "Google Nest", "Apple HomePod", "Smart Displays", "Accessories"]),
    ],
  },
  {
    id: "accessories",
    label: "Accessories",
    icon: "plug",
    groups: [
      group("Power", ["Chargers", "Power Banks", "Wireless Chargers", "Car Chargers", "Adapters"]),
      group("Cables & Hubs", ["USB-C Cables", "Lightning Cables", "USB Hubs", "HDMI Cables", "Adapters"]),
      group("Storage", ["External SSDs", "Hard Drives", "USB Flash Drives", "Memory Cards", "NAS"]),
    ],
  },
]

export async function fetchCategoryMenu(): Promise<MenuCategory[]> {
  return MOCK_MENU
}

export const categoryMenuQueryOptions = (lang: string) =>
  queryOptions({
    queryKey: ["categories", "menu", lang],
    // lang is in the key so switching language refetches; pass it to the request once the API exists
    queryFn: () => fetchCategoryMenu(),
    // The menu rarely changes; keep it for the session
    staleTime: Infinity,
  })
