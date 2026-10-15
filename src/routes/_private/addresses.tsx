import { Link, createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { AddressBook } from "@/components/addresses/address-book"
import { ServiceHighlights } from "@/components/home/service-highlights"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export const Route = createFileRoute("/_private/addresses")({
  component: AddressesPage,
})

function AddressesPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-10">
      <AddressBook
        header={
          <div className="flex flex-col gap-2">
            <Breadcrumb>
              <BreadcrumbList className="text-xs">
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link to="/" />}>{t("home")}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link to="/dashboard" />}>{t("orders.myAccount")}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t("addresses.title")}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-3xl font-bold tracking-tight text-primary dark:text-foreground">{t("addresses.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("addresses.subtitle")}</p>
          </div>
        }
      />
      <ServiceHighlights />
    </div>
  )
}
