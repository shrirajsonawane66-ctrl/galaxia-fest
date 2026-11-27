import { redirect } from "next/navigation"
import ContentManager from "../content-manager"

const TABS = [
  "overview",
  "schedule",
  "tickets",
  "sponsors",
  "contact",
  "announcements",
  "faqs",
  "socials",
] as const

type ContentTab = (typeof TABS)[number]

export default async function ContentTabPage({
  params,
}: {
  params: Promise<{ tab: string }>
}) {
  const { tab } = await params
  if (!TABS.includes(tab as ContentTab)) {
    redirect("/admin/content/overview")
  }
  return <ContentManager tab={tab as ContentTab} />
}
