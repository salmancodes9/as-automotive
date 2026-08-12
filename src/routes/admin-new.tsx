import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin-new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin-new"!</div>
}
