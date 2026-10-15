import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { categoryTreeQueryOptions, type ApiCategory } from "@/api/categories"
import { brandsQueryOptions } from "@/api/listing"
import { Stars } from "@/components/product/star-rating"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

// Named like the API's query params; id lists are comma-separated
export interface FilterValues {
  categoryIds?: string
  brandIds?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  inStock?: boolean
}

// minRating values the API takes
const RATING_OPTIONS = [4.5, 4, 3]

// Native checkboxes styled with the brand colour
const CHECKBOX_CLASS = "size-4 shrink-0 rounded accent-secondary"
const CHECK_ROW_CLASS = "flex cursor-pointer items-center gap-2.5 text-muted-foreground hover:text-foreground"

// Filter sidebar: category tree, brands, price range, rating and availability.
// Every change goes straight into the URL through onChange.
export function ListingFilters({
  values,
  priceCeiling,
  onChange,
}: {
  values: FilterValues
  // Top of the price slider, from the prices in the results
  priceCeiling: number
  onChange: (patch: Partial<FilterValues>) => void
}) {
  return (
    <div className="flex flex-col gap-6 text-sm">
      <CategoryFilter
        selected={values.categoryIds?.split(",") ?? []}
        onChange={(ids) => onChange({ categoryIds: ids?.join(",") })}
      />
      <BrandFilter
        selected={values.brandIds?.split(",") ?? []}
        onChange={(ids) => onChange({ brandIds: ids?.join(",") })}
      />
      <PriceFilter
        min={values.minPrice}
        max={values.maxPrice}
        ceiling={priceCeiling}
        onChange={(minPrice, maxPrice) => onChange({ minPrice, maxPrice })}
      />
      <RatingFilter value={values.minRating} onChange={(minRating) => onChange({ minRating })} />
      <AvailabilityFilter value={!!values.inStock} onChange={(inStock) => onChange({ inStock })} />
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-2.5 font-semibold text-primary dark:text-foreground">{title}</legend>
      {children}
    </fieldset>
  )
}

// Departments as checkboxes; a ticked department lists its sub-categories,
// which narrow it when ticked. Any number can be picked (categoryIds is a list).
function CategoryFilter({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (ids: string[] | undefined) => void
}) {
  const { t } = useTranslation()
  const { data: tree = [] } = useQuery(categoryTreeQueryOptions)

  // The API wraps everything in one root (Electronics); its children are the departments
  const wrapper = tree.length === 1 && tree[0].children.length > 0 ? tree[0] : null
  const departments = wrapper ? wrapper.children : tree
  const bySort = (list: ApiCategory[]) => [...list].sort((a, b) => a.sortOrder - b.sortOrder)
  if (departments.length === 0) return null

  const isOn = (id: string) => selected.includes(id)
  const emit = (ids: string[]) => onChange(ids.length ? ids : undefined)

  // Ticking a department selects all of it (the API includes sub-categories);
  // unticking clears it and any of its sub-categories
  const toggleDepartment = (department: ApiCategory) => {
    const family = [department.id, ...department.children.map((c) => c.id)]
    const active = family.some(isOn)
    emit(active ? selected.filter((id) => !family.includes(id)) : [...selected, department.id])
  }
  // Ticking sub-categories narrows the department to them; none left means the whole department again
  const toggleChild = (department: ApiCategory, child: ApiCategory) => {
    const childIds = department.children.map((c) => c.id)
    let next = selected.filter((id) => id !== department.id)
    next = isOn(child.id) ? next.filter((id) => id !== child.id) : [...next, child.id]
    if (!next.some((id) => childIds.includes(id))) next.push(department.id)
    emit(next)
  }

  return (
    <FilterGroup title={t("listing.category")}>
      {bySort(departments).map((department) => {
        const childOn = department.children.some((c) => isOn(c.id))
        const active = isOn(department.id) || childOn
        return (
          <div key={department.id} className="flex flex-col gap-2">
            <label className={cn(CHECK_ROW_CLASS, active && "font-semibold text-brand-copper")}>
              <input
                type="checkbox"
                checked={active}
                // Part of it picked: shown as "partly ticked"
                ref={(input) => {
                  if (input) input.indeterminate = childOn
                }}
                onChange={() => toggleDepartment(department)}
                className={CHECKBOX_CLASS}
              />
              <span className="text-bidi-plain">{department.name}</span>
            </label>
            {active && department.children.length > 0 && (
              <div className="flex flex-col gap-2 ps-6">
                {bySort(department.children).map((child) => (
                  <label key={child.id} className={cn(CHECK_ROW_CLASS, isOn(child.id) && "text-foreground")}>
                    <input
                      type="checkbox"
                      checked={isOn(child.id)}
                      onChange={() => toggleChild(department, child)}
                      className={CHECKBOX_CLASS}
                    />
                    <span className="text-bidi-plain">{child.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </FilterGroup>
  )
}

function BrandFilter({ selected, onChange }: { selected: string[]; onChange: (ids: string[] | undefined) => void }) {
  const { t } = useTranslation()
  const { data: brands = [] } = useQuery(brandsQueryOptions)
  if (brands.length === 0) return null

  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((b) => b !== id) : [...selected, id]
    onChange(next.length ? next : undefined)
  }

  return (
    <FilterGroup title={t("listing.brand")}>
      {brands.map((brand) => (
        <label key={brand.id} className="flex cursor-pointer items-center gap-2.5 text-muted-foreground hover:text-foreground">
          <input
            type="checkbox"
            checked={selected.includes(brand.id)}
            onChange={() => toggle(brand.id)}
            className={CHECKBOX_CLASS}
          />
          <span className="text-bidi-plain">{brand.name}</span>
        </label>
      ))}
    </FilterGroup>
  )
}

function PriceFilter({
  min,
  max,
  ceiling,
  onChange,
}: {
  min?: number
  max?: number
  ceiling: number
  onChange: (min: number | undefined, max: number | undefined) => void
}) {
  const { t } = useTranslation()
  const toNumber = (value: string) => (value.trim() === "" || Number(value) < 0 ? undefined : Number(value))
  const [draft, setDraft] = useState({ min: min?.toString() ?? "", max: max?.toString() ?? "" })
  // Follow the URL when it changes elsewhere (e.g. "Clear filters"), but leave a
  // box alone when it already says that value, so typing in the other box isn't lost
  const [seen, setSeen] = useState({ min, max })
  if (seen.min !== min || seen.max !== max) {
    setSeen({ min, max })
    setDraft((current) => ({
      min: toNumber(current.min) === min ? current.min : (min?.toString() ?? ""),
      max: toNumber(current.max) === max ? current.max : (max?.toString() ?? ""),
    }))
  }
  const top = Math.max(ceiling, max ?? 0)
  // Only while dragging; otherwise the handles follow the URL and the current results' top price
  const [dragging, setDragging] = useState<number[] | null>(null)
  const range = dragging ?? [Math.min(min ?? 0, top), Math.min(max ?? top, top)]

  const apply = (nextMin = toNumber(draft.min), nextMax = toNumber(draft.max)) => {
    // Swap a reversed range rather than send min > max, which the API rejects
    const [low, high] = nextMin != null && nextMax != null && nextMin > nextMax ? [nextMax, nextMin] : [nextMin, nextMax]
    if (low !== min || high !== max) onChange(low || undefined, high)
  }

  return (
    <FilterGroup title={t("listing.priceRange")}>
      <div className="grid grid-cols-2 gap-2">
        {(["min", "max"] as const).map((side) => (
          <input
            key={side}
            type="number"
            inputMode="numeric"
            min={0}
            value={draft[side]}
            placeholder={t(side === "min" ? "listing.minPrice" : "listing.maxPrice")}
            aria-label={t(side === "min" ? "listing.minPrice" : "listing.maxPrice")}
            onChange={(event) => setDraft((d) => ({ ...d, [side]: event.target.value }))}
            onBlur={() => apply()}
            onKeyDown={(event) => event.key === "Enter" && apply()}
            className="h-9 w-full min-w-0 rounded-md border bg-muted/50 px-2.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        ))}
      </div>
      <Slider
        min={0}
        max={top}
        step={Math.max(1, Math.round(top / 100))}
        value={range}
        onValueChange={(value) => {
          const next = value as number[]
          setDragging(next)
          setDraft({ min: String(next[0]), max: String(next[1]) })
        }}
        onValueCommitted={(value) => {
          const [low, high] = value as number[]
          setDragging(null)
          // The slider's ends mean "no limit"
          apply(low > 0 ? low : undefined, high < top ? high : undefined)
        }}
        aria-label={t("listing.priceRange")}
        className="mt-2 **:data-[slot=slider-range]:bg-secondary **:data-[slot=slider-thumb]:border-secondary"
      />
    </FilterGroup>
  )
}

function RatingFilter({ value, onChange }: { value?: number; onChange: (rating: number | undefined) => void }) {
  const { t } = useTranslation()
  return (
    <FilterGroup title={t("listing.customerRating")}>
      {RATING_OPTIONS.map((rating) => (
        <label key={rating} className="flex cursor-pointer items-center gap-2.5 text-muted-foreground hover:text-foreground">
          <input
            type="checkbox"
            checked={value === rating}
            // Picking the selected option again clears it
            onChange={() => onChange(value === rating ? undefined : rating)}
            aria-label={t("listing.ratingOption", { rating })}
            className={CHECKBOX_CLASS}
          />
          <Stars rating={rating} />
          <span className="text-xs">{t("listing.andUp")}</span>
        </label>
      ))}
    </FilterGroup>
  )
}

function AvailabilityFilter({ value, onChange }: { value: boolean; onChange: (inStock: boolean | undefined) => void }) {
  const { t } = useTranslation()
  return (
    <FilterGroup title={t("listing.availability")}>
      {/* The API can only narrow to in-stock products, so there's no "out of stock" option */}
      <label className="flex cursor-pointer items-center gap-2.5 text-muted-foreground hover:text-foreground">
        <input
          type="checkbox"
          checked={value}
          onChange={() => onChange(value ? undefined : true)}
          className={CHECKBOX_CLASS}
        />
        {t("listing.inStock")}
      </label>
    </FilterGroup>
  )
}
