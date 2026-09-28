import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

// Pathless layout: guards every route under src/routes/_private/.
export const Route = createFileRoute("/_private")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      })
    }
  },
  component: PrivateLayout,
})

function PrivateLayout() {
  return (
    <div className="site-container py-8">
      <Outlet />
    </div>
  )
}
