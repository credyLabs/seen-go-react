import {
  SiFacebook,
  SiInstagram,
  SiX,
  SiYoutube,
} from "@icons-pack/react-simple-icons"
import { Mail } from "lucide-react"
import { useTranslation } from "react-i18next"

import { SiteLogo } from "@/components/layout/site-logo"
import { buttonVariants } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"

const SOCIAL_LINKS = [
  { label: "Facebook", Icon: SiFacebook },
  { label: "Instagram", Icon: SiInstagram },
  { label: "X", Icon: SiX },
  { label: "YouTube", Icon: SiYoutube },
]

const LINK_COLUMNS = [
  {
    title: "footer.shop",
    links: [
      "header.categories.smartphones",
      "header.categories.laptops",
      "header.categories.audio",
      "header.categories.gaming",
      "footer.allBrands",
    ],
  },
  {
    title: "footer.help",
    links: [
      "footer.orderTracking",
      "footer.returns",
      "footer.warranty",
      "footer.shipping",
      "footer.faq",
    ],
  },
  {
    title: "footer.company",
    links: [
      "footer.about",
      "footer.careers",
      "footer.press",
      "footer.sellWithUs",
      "footer.affiliate",
    ],
  },
  {
    title: "footer.legal",
    links: [
      "footer.terms",
      "footer.privacy",
      "footer.cookies",
      "footer.vatInfo",
      "footer.tradeLicense",
    ],
  },
] as const

const PAYMENT_METHODS = ["Visa", "Mastercard", "Apple Pay", "Tabby", "Tamara"]

export function SiteFooter() {
  const { t } = useTranslation()

  return (
    <footer className="bg-brand-navy text-white/70">
      <div className="site-container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-6">
        <div className="flex flex-col gap-5 sm:col-span-2">
          <SiteLogo tone="light" />
          <p className="max-w-64 text-sm">{t("footer.tagline")}</p>

          <form
            // TODO: hook up the newsletter API
            onSubmit={(event) => event.preventDefault()}
            className="max-w-80"
          >
            <InputGroup className="h-11 rounded-full border-white/20 bg-white/10 dark:bg-white/10">
              <InputGroupAddon className="ps-4 text-white/60">
                <Mail />
              </InputGroupAddon>
              <InputGroupInput
                type="email"
                name="email"
                required
                aria-label={t("footer.emailPlaceholder")}
                placeholder={t("footer.emailPlaceholder")}
                className="text-white placeholder:text-white/50"
              />
              <InputGroupAddon align="inline-end" className="pe-1">
                <InputGroupButton
                  type="submit"
                  size="sm"
                  className="h-9 rounded-full bg-brand-gradient px-4 text-white hover:opacity-90"
                >
                  {t("footer.subscribe")}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </form>

          <ul className="flex gap-2">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.label}>
                {/* TODO: real social profile URLs */}
                <a
                  href="#"
                  aria-label={social.label}
                  className={buttonVariants({
                    variant: "outline",
                    size: "icon-sm",
                    className:
                      "rounded-full border-white/20 bg-transparent text-white/70 hover:bg-white/10 hover:text-white dark:bg-transparent",
                  })}
                >
                  <social.Icon />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {LINK_COLUMNS.map((column) => (
          <div key={column.title} className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold tracking-wider text-brand-copper uppercase">
              {t(column.title)}
            </h2>
            <ul className="flex flex-col gap-2.5 text-sm">
              {column.links.map((link) => (
                <li key={link}>
                  {/* TODO: point at real routes once they exist */}
                  <a href="#" className="transition-colors hover:text-white">
                    {t(link)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Separator className="bg-white/10" />
      <div>
        <div className="site-container flex flex-col gap-3 py-5 text-xs md:flex-row md:items-center md:justify-between">
          <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-white/60">
            {PAYMENT_METHODS.map((method) => (
              <li key={method}>{method}</li>
            ))}
            <li>{t("footer.cod")}</li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
