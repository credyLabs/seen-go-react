import { Outlet, createFileRoute } from "@tanstack/react-router"

// Pathless layout: groups every route under src/routes/_public/.
// No auth required.
export const Route = createFileRoute("/_public")({
  component: PublicLayout,
})

function PublicLayout() {
  return (
    <div className="site-container py-8">
      <Outlet />
    </div>
  )
}
