"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import {
  useForm,
  type DefaultValues,
  type FieldPath,
  type FieldValues,
  type Resolver,
  type UseFormRegister,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z, type ZodTypeAny } from "zod"
import { toast } from "sonner"
import { Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { adminApi } from "@/lib/admin-api"
import {
  CONTENT_SECTIONS,
  contentSchemas,
  isCollectionSection,
  siteSettingsSchema,
  type Announcement,
  type CollectionSection,
  type ContentSection,
  type Faq,
  type ScheduleEntry,
  type SiteSettings,
  type SocialLink,
  type Sponsor,
  type TicketCategory,
} from "@/lib/content/types"
import { cn } from "@/lib/utils"

type ContentTab =
  | "overview"
  | "schedule"
  | "tickets"
  | "sponsors"
  | "contact"
  | "announcements"
  | "faqs"
  | "socials"

type EntryMeta = {
  id: string
  status: "draft" | "published"
  sortOrder: number
}

type CollectionTypeMap = {
  schedule: ScheduleEntry
  tickets: TicketCategory
  sponsors: Sponsor
  faqs: Faq
  socials: SocialLink
  announcements: Announcement
}

type ContentEntry = CollectionTypeMap[CollectionSection] & EntryMeta

type FormValue = string | number | boolean | string[] | undefined
type FormValues = Record<string, FormValue>

type FieldKind =
  | "text"
  | "date"
  | "time"
  | "textarea"
  | "lines"
  | "number"
  | "url"
  | "image"
  | "checkbox"
  | "select"

type FieldOption = {
  value: string
  label: string
}

type FieldConfig = {
  name: string
  label: string
  kind: FieldKind
  placeholder?: string
  required?: boolean
  min?: number
  options?: readonly FieldOption[]
  defaultValue?: FormValue
}

const TAB_META = {
  overview: {
    label: "Event Info",
    title: "Event Information",
    description: "Update the public title, story, theme, and booking guidance.",
    section: "settings",
  },
  schedule: {
    label: "Schedule",
    title: "Schedule",
    description: "Manage confirmed programme slots and their display order.",
    section: "schedule",
  },
  tickets: {
    label: "Tickets",
    title: "Tickets & Booking",
    description: "Manage ticket categories, pricing, benefits, and availability.",
    section: "tickets",
  },
  sponsors: {
    label: "Sponsors",
    title: "Sponsors",
    description: "Manage partners and the logos shown on the public site.",
    section: "sponsors",
  },
  contact: {
    label: "Venue & Contact",
    title: "Venue & Contact",
    description: "Add confirmed venue and contact details only.",
    section: "settings",
  },
  announcements: {
    label: "Announcements",
    title: "Announcements",
    description: "Publish timely updates for attendees.",
    section: "announcements",
  },
  faqs: {
    label: "FAQs",
    title: "FAQs",
    description: "Answer common questions about the festival.",
    section: "faqs",
  },
  socials: {
    label: "Social Links",
    title: "Social Links",
    description: "Manage official social profiles shown across the site.",
    section: "socials",
  },
} as const satisfies Record<
  ContentTab,
  { label: string; title: string; description: string; section: ContentSection }
>

const SECTION_LABELS: Record<ContentSection, string> = {
  settings: "Event information",
  schedule: "Schedule entry",
  sponsors: "Sponsor",
  faqs: "FAQ",
  socials: "Social link",
  announcements: "Announcement",
  tickets: "Ticket category",
}

const STATUS_OPTIONS: readonly FieldOption[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
]

const PLATFORM_OPTIONS: readonly FieldOption[] = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "other", label: "Other" },
]

const FIELD_CONFIGS: Record<CollectionSection, readonly FieldConfig[]> = {
  schedule: [
    { name: "name", label: "Name", kind: "text", placeholder: "Opening ceremony", required: true },
    { name: "date", label: "Date", kind: "date", required: true },
    { name: "startTime", label: "Start time", kind: "time", required: true },
    { name: "endTime", label: "End time", kind: "time" },
    { name: "venue", label: "Venue", kind: "text", placeholder: "Main stage" },
    { name: "description", label: "Description", kind: "textarea", placeholder: "What attendees can expect" },
    { name: "status", label: "Status", kind: "select", options: STATUS_OPTIONS, defaultValue: "draft" },
    { name: "sortOrder", label: "Sort order", kind: "number", min: 0 },
  ],
  tickets: [
    { name: "name", label: "Name", kind: "text", placeholder: "Student pass", required: true },
    { name: "description", label: "Description", kind: "textarea", placeholder: "What this ticket includes" },
    { name: "price", label: "Price", kind: "number", min: 0 },
    { name: "benefits", label: "Benefits", kind: "lines", placeholder: "One benefit per line" },
    { name: "capacity", label: "Capacity", kind: "number", min: 0 },
    { name: "soldCount", label: "Sold count", kind: "number", min: 0 },
    { name: "active", label: "Active", kind: "checkbox", defaultValue: true },
    { name: "status", label: "Status", kind: "select", options: STATUS_OPTIONS, defaultValue: "draft" },
    { name: "sortOrder", label: "Sort order", kind: "number", min: 0 },
  ],
  sponsors: [
    { name: "name", label: "Name", kind: "text", placeholder: "Partner name", required: true },
    { name: "logoUrl", label: "Logo", kind: "image", placeholder: "Paste a URL or upload a logo" },
    { name: "category", label: "Category", kind: "text", placeholder: "Title partner" },
    { name: "websiteUrl", label: "Website URL", kind: "url", placeholder: "https://" },
    { name: "description", label: "Description", kind: "textarea", placeholder: "Short partner description" },
    { name: "status", label: "Status", kind: "select", options: STATUS_OPTIONS, defaultValue: "draft" },
    { name: "sortOrder", label: "Sort order", kind: "number", min: 0 },
  ],
  faqs: [
    { name: "question", label: "Question", kind: "text", placeholder: "What is the entry fee?", required: true },
    { name: "answer", label: "Answer", kind: "textarea", placeholder: "Add the confirmed answer", required: true },
    { name: "status", label: "Status", kind: "select", options: STATUS_OPTIONS, defaultValue: "draft" },
    { name: "sortOrder", label: "Sort order", kind: "number", min: 0 },
  ],
  announcements: [
    { name: "title", label: "Title", kind: "text", placeholder: "Announcement title", required: true },
    { name: "message", label: "Message", kind: "textarea", placeholder: "Announcement details", required: true },
    { name: "linkUrl", label: "Link URL", kind: "url", placeholder: "https://" },
    { name: "status", label: "Status", kind: "select", options: STATUS_OPTIONS, defaultValue: "draft" },
    { name: "sortOrder", label: "Sort order", kind: "number", min: 0 },
  ],
  socials: [
    { name: "platform", label: "Platform", kind: "select", options: PLATFORM_OPTIONS, defaultValue: "instagram" },
    { name: "label", label: "Label", kind: "text", placeholder: "Follow us" },
    { name: "url", label: "URL", kind: "url", placeholder: "https://" },
    { name: "status", label: "Status", kind: "select", options: STATUS_OPTIONS, defaultValue: "draft" },
    { name: "sortOrder", label: "Sort order", kind: "number", min: 0 },
  ],
}

const SETTINGS_FIELDS: Record<"overview" | "contact", readonly FieldConfig[]> = {
  overview: [
    { name: "title", label: "Event title", kind: "text", placeholder: "Galaxia i-Fest", required: true },
    { name: "tagline", label: "Tagline", kind: "text", placeholder: "Festival tagline" },
    { name: "dateLabel", label: "Date label", kind: "text", placeholder: "DEC 19–20" },
    { name: "theme", label: "Theme", kind: "text", placeholder: "Festival theme" },
    { name: "description", label: "Description", kind: "textarea", placeholder: "Short public description" },
    { name: "aboutTitle", label: "About title", kind: "text", placeholder: "About the festival" },
    { name: "aboutText1", label: "About text 1", kind: "textarea", placeholder: "First about paragraph" },
    { name: "aboutText2", label: "About text 2", kind: "textarea", placeholder: "Second about paragraph" },
    { name: "collegeName", label: "College name", kind: "text", placeholder: "Organising college" },
    { name: "showPrices", label: "Public pricing", kind: "checkbox" },
    { name: "bookingInstructions", label: "Booking instructions", kind: "textarea", placeholder: "How attendees should book" },
    { name: "bookingUrl", label: "Booking URL", kind: "url", placeholder: "https://" },
  ],
  contact: [
    { name: "venueName", label: "Venue name", kind: "text", placeholder: "Venue name" },
    { name: "venueAddress", label: "Venue address", kind: "textarea", placeholder: "Full venue address" },
    { name: "mapsUrl", label: "Maps URL", kind: "url", placeholder: "https://" },
    { name: "contactName", label: "Contact name", kind: "text", placeholder: "Contact person" },
    { name: "contactPhone", label: "Contact phone", kind: "text", placeholder: "Phone number" },
    { name: "contactEmail", label: "Contact email", kind: "text", placeholder: "Email address" },
  ],
}

const emptySettings = {
  title: "",
  tagline: "",
  description: "",
  theme: "",
  aboutTitle: "",
  aboutText1: "",
  aboutText2: "",
  collegeName: "",
  dateLabel: "",
  showPrices: false,
  bookingInstructions: "",
  bookingUrl: "",
  venueName: "",
  venueAddress: "",
  mapsUrl: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
} as unknown as SiteSettings

const inputClass =
  "w-full min-h-11 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:border-[#F4EDE0]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A] sm:min-h-0"

export default function ContentManager({ tab }: { tab: ContentTab }) {
  const meta = TAB_META[tab]
  const section = meta.section

  return (
    <div className="space-y-6">
      <nav
        aria-label="Site content sections"
        className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
      >
        {(Object.keys(TAB_META) as ContentTab[]).map((item) => {
          const active = item === tab
          return (
            <Link
              key={item}
              href={`/admin/content/${item}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center justify-center rounded-full border px-3 py-2 text-center text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A] sm:min-h-0",
                active
                  ? "border-white/20 bg-white/10 text-[var(--text-strong)]"
                  : "border-white/10 bg-white/[0.02] text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-strong)]"
              )}
            >
              {TAB_META[item].label}
            </Link>
          )
        })}
      </nav>

      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-strong)] sm:text-3xl">
          {meta.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{meta.description}</p>
      </div>

      {tab === "overview" ? (
        <SettingsForm mode="overview" />
      ) : tab === "contact" ? (
        <SettingsForm mode="contact" />
      ) : isCollectionSection(section) ? (
        <CollectionManager section={section} />
      ) : null}
    </div>
  )
}

function SettingsForm({ mode }: { mode: "overview" | "contact" }) {
  const [settings, setSettings] = React.useState<SiteSettings | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const fields = SETTINGS_FIELDS[mode]

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SiteSettings>({
    resolver: zodResolver(siteSettingsSchema) as Resolver<SiteSettings>,
    defaultValues: emptySettings as DefaultValues<SiteSettings>,
  })

  const load = React.useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await adminApi<{ settings: SiteSettings }>("/api/admin/content/settings")
      setSettings(data.settings)
      reset({ ...emptySettings, ...data.settings } as DefaultValues<SiteSettings>)
    } catch (loadError) {
      setError(formatError(loadError, "Could not load site settings."))
    } finally {
      setLoading(false)
    }
  }, [reset])

  React.useEffect(() => {
    void load()
  }, [load])

  const submit = handleSubmit(
    async (data) => {
      if (!settings) return
      setSaving(true)
      try {
        const result = await adminApi<{ settings: SiteSettings }>(
          "/api/admin/content/settings",
          {
            method: "PUT",
            body: JSON.stringify({ ...settings, ...data }),
          }
        )
        setSettings(result.settings)
        reset({ ...emptySettings, ...result.settings } as DefaultValues<SiteSettings>)
        toast.success("Event information saved")
      } catch (submitError) {
        toast.error(formatError(submitError, "Could not save settings."))
      } finally {
        setSaving(false)
      }
    },
    (formErrors) => {
      const message = firstError(formErrors)
      if (message) toast.error(message)
    }
  )

  if (loading) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[var(--text-muted)]">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        <span className="mt-2 text-sm">Loading settings…</span>
      </div>
    )
  }

  if (error || !settings) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between">
        <span>{error || "Settings are unavailable."}</span>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full rounded-full sm:min-h-0 sm:w-auto"
          onClick={() => void load()}
        >
          Retry
        </Button>
      </div>
    )
  }

  const values = asRecord(watch())

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const value = values[field.name]
          const hint =
            mode === "contact" && isBlank(value) ? "Not confirmed yet" : undefined

          if (field.kind === "checkbox") {
            return (
              <label
                key={field.name}
                className="flex min-h-11 items-center gap-2 self-end rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[var(--text-body)] sm:min-h-0"
              >
                <input
                  type="checkbox"
                  {...register(field.name as FieldPath<SiteSettings>)}
                  className="h-4 w-4 accent-[#E5121F]"
                />
                {field.label}
              </label>
            )
          }

          return (
            <Field
              key={field.name}
              label={field.label}
              required={field.required}
              hint={hint}
              error={getErrorMessage(errors, field.name)}
            >
              {renderFieldControl(field, register)}
            </Field>
          )
        })}
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-t border-white/10 bg-[#0a0f2b] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:static sm:mx-0 sm:flex-row sm:justify-end sm:bg-transparent sm:px-0 sm:pb-0">
        <Button
          type="submit"
          variant="galaxy"
          className="min-h-11 w-full rounded-full sm:min-h-0 sm:w-auto"
          disabled={saving}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          Save changes
        </Button>
      </div>
    </form>
  )
}

function CollectionManager({ section: requestedSection }: { section: CollectionSection }) {
  const section = React.useMemo(() => {
    const match = CONTENT_SECTIONS.find((value) => value === requestedSection)
    return match !== undefined && isCollectionSection(match) ? match : requestedSection
  }, [requestedSection])

  const fields = FIELD_CONFIGS[section]
  const [items, setItems] = React.useState<ContentEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ContentEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<ContentEntry | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [busyId, setBusyId] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await adminApi<{ items: ContentEntry[] }>(
        `/api/admin/content/${section}`
      )
      setItems(data.items)
    } catch (loadError) {
      setError(formatError(loadError, `Could not load ${SECTION_LABELS[section].toLowerCase()} entries.`))
    } finally {
      setLoading(false)
    }
  }, [section])

  React.useEffect(() => {
    void load()
  }, [load])

  const initialValues = React.useMemo(() => {
    const fallbacks: Record<string, unknown> = {
      status: "draft",
      sortOrder: items.length + 1,
    }
    return buildInitialValues(fields, editing ? asRecord(editing) : {}, fallbacks)
  }, [editing, fields, items.length])

  const save = async (payload: Record<string, unknown>) => {
    setSaving(true)
    try {
      if (editing) {
        await adminApi(`/api/admin/content/${section}/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        toast.success("Entry updated")
      } else {
        await adminApi(`/api/admin/content/${section}`, {
          method: "POST",
          body: JSON.stringify(payload),
        })
        toast.success("Entry added")
      }
      setFormOpen(false)
      setEditing(null)
      await load()
    } catch (submitError) {
      toast.error(formatError(submitError, "Could not save entry."))
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (item: ContentEntry) => {
    const status = item.status === "published" ? "draft" : "published"
    setBusyId(item.id)
    try {
      await adminApi(`/api/admin/content/${section}/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      toast.success(status === "published" ? "Entry published" : "Entry hidden")
      await load()
    } catch (statusError) {
      toast.error(formatError(statusError, "Could not update status."))
    } finally {
      setBusyId("")
    }
  }

  const remove = async () => {
    if (!deleteTarget) return
    setBusyId(deleteTarget.id)
    try {
      await adminApi(`/api/admin/content/${section}/${deleteTarget.id}`, {
        method: "DELETE",
      })
      toast.success("Entry deleted")
      setDeleteTarget(null)
      await load()
    } catch (deleteError) {
      toast.error(formatError(deleteError, "Could not delete entry."))
    } finally {
      setBusyId("")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[var(--text-muted)]">
          {loading ? "Loading entries…" : `${items.length} ${items.length === 1 ? "entry" : "entries"}`}
        </div>
        <Button
          type="button"
          variant="galaxy"
          className="min-h-11 w-full rounded-full sm:min-h-0 sm:w-auto"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4" aria-hidden /> Add entry
        </Button>
      </div>

      {error ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full rounded-full sm:min-h-0 sm:w-auto"
            onClick={() => void load()}
          >
            Retry
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-b border-white/10 text-sm text-[var(--text-muted)]">
              <tr>
                <th className="p-3 text-left">Entry</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Order</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-[var(--text-muted)]">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-hidden />
                    <span className="mt-2 block text-sm">Loading entries…</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-sm text-[var(--text-muted)]">
                    Nothing added yet. Add the first entry when details are confirmed.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const record = asRecord(item)
                  const label = entryLabel(section, record)
                  const published = item.status === "published"
                  const busy = busyId === item.id
                  return (
                    <tr key={item.id} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.03]">
                      <td className="p-3">
                        <div className="max-w-xs truncate font-medium text-[var(--text-strong)]">
                          {label}
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                            published
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-white/10 text-[var(--text-muted)]"
                          )}
                        >
                          {published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="p-3 text-[var(--text-body)]">{numberValue(record.sortOrder)}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void toggleStatus(item)}
                            className="inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-xs text-[var(--text-muted)] transition hover:bg-white/10 hover:text-[var(--text-strong)] disabled:opacity-50 sm:min-h-0"
                            aria-label={`${published ? "Hide" : "Publish"} ${label}`}
                          >
                            {published ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
                            {published ? "Hide" : "Publish"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(item)
                              setFormOpen(true)
                            }}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-white/10 hover:text-[var(--text-strong)] sm:h-9 sm:w-9"
                            aria-label={`Edit ${label}`}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-red-300/80 transition hover:bg-red-500/15 hover:text-red-200 sm:h-9 sm:w-9"
                            aria-label={`Delete ${label}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
      >
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-h-[92dvh] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-sans">
              {editing ? `Edit ${SECTION_LABELS[section].toLowerCase()}` : `Add ${SECTION_LABELS[section].toLowerCase()}`}
            </DialogTitle>
            <DialogDescription>
              Leave unconfirmed details empty. Drafts stay hidden from the public site.
            </DialogDescription>
          </DialogHeader>
          <AutoForm
            key={`${section}-${editing?.id ?? "new"}`}
            schema={contentSchemas[section]}
            fields={fields}
            initialValues={initialValues}
            saving={saving}
            submitLabel={editing ? "Save changes" : "Add entry"}
            onCancel={() => {
              setFormOpen(false)
              setEditing(null)
            }}
            onSubmit={save}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-h-[92dvh] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete entry?</DialogTitle>
            <DialogDescription>
              {entryLabel(section, asRecord(deleteTarget))} will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full rounded-full sm:min-h-0 sm:w-auto"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="galaxy"
              className="min-h-11 w-full rounded-full sm:min-h-0 sm:w-auto"
              disabled={busyId === deleteTarget?.id}
              onClick={() => void remove()}
            >
              {busyId === deleteTarget?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden />
              )}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AutoForm({
  schema,
  fields,
  initialValues,
  saving,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  schema: ZodTypeAny
  fields: readonly FieldConfig[]
  initialValues: FormValues
  saving: boolean
  submitLabel: string
  onCancel: () => void
  onSubmit: (values: Record<string, unknown>) => Promise<void>
}) {
  const resolverSchema = React.useMemo(
    () => z.preprocess((raw) => normalizeForSchema(raw, fields), schema),
    [fields, schema]
  )

  const typedZodResolver = zodResolver as unknown as (
    schema: ZodTypeAny
  ) => Resolver<FormValues>

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: typedZodResolver(resolverSchema),
    defaultValues: initialValues,
  })

  const submit = handleSubmit(
    async (data) => {
      await onSubmit(normalizeForSchema(data, fields))
    },
    (formErrors) => {
      const message = firstError(formErrors)
      if (message) toast.error(message)
    }
  )

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          if (field.kind === "image") {
            const current = watch(field.name)
            const error = getErrorMessage(errors, field.name)
            return (
              <div key={field.name}>
                <span className="mb-1.5 flex items-center justify-between gap-2 text-sm text-[var(--text-muted)]">
                  <span>
                    {field.label}
                    {field.required ? <span className="ml-1 text-red-300">*</span> : null}
                  </span>
                </span>
                <LogoField
                  value={typeof current === "string" ? current : ""}
                  placeholder={field.placeholder}
                  onChange={(url) =>
                    setValue(field.name, url, { shouldValidate: true, shouldDirty: true })
                  }
                />
                {error ? <span className="mt-1 block text-[13px] text-red-300">{error}</span> : null}
              </div>
            )
          }

          if (field.kind === "checkbox") {
            return (
              <label
                key={field.name}
                className="flex min-h-11 items-center gap-2 self-end rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[var(--text-body)] sm:min-h-0"
              >
                <input
                  type="checkbox"
                  {...register(field.name as FieldPath<FormValues>)}
                  className="h-4 w-4 accent-[#E5121F]"
                />
                {field.label}
              </label>
            )
          }

          return (
            <Field
              key={field.name}
              label={field.label}
              required={field.required}
              error={getErrorMessage(errors, field.name)}
            >
              {renderFieldControl(field, register)}
            </Field>
          )
        })}
      </div>

      <div className="sticky bottom-0 z-10 -mx-6 flex flex-col-reverse gap-2 border-t border-white/10 bg-[#0a0f2b] px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:static sm:mx-0 sm:flex-row sm:justify-end sm:bg-transparent sm:px-0 sm:pb-0">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full rounded-full sm:min-h-0 sm:w-auto"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="galaxy"
          className="min-h-11 w-full rounded-full sm:min-h-0 sm:w-auto"
          disabled={saving}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-2 text-sm text-[var(--text-muted)]">
        <span>
          {label}
          {required ? <span className="ml-1 text-red-300">*</span> : null}
        </span>
        {hint ? <span className="text-[13px] text-[var(--text-muted)]">{hint}</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1 block text-[13px] text-red-300">{error}</span> : null}
    </label>
  )
}

function LogoField({
  value,
  placeholder,
  onChange,
}: {
  value: string
  placeholder?: string
  onChange: (url: string) => void
}) {
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)

  const previewSrc = React.useMemo(() => {
    if (value.startsWith("data:image/")) return value
    if (value.startsWith("/") && !value.startsWith("//")) return value
    try {
      const parsed = new URL(value)
      return parsed.protocol === "http:" || parsed.protocol === "https:" ? value : ""
    } catch {
      return ""
    }
  }, [value])

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG or WebP images are allowed.")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be 2MB or smaller.")
      return
    }

    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const response = await fetch("/api/admin/content/sponsors/upload", {
        method: "POST",
        body: form,
      })
      const payload = (await response.json().catch(() => ({}))) as {
        url?: unknown
        error?: unknown
      }
      if (!response.ok) {
        throw new Error(
          typeof payload.error === "string" ? payload.error : "Could not upload logo."
        )
      }
      if (typeof payload.url !== "string" || !payload.url) {
        throw new Error("Upload did not return an image URL.")
      }
      onChange(payload.url)
      toast.success("Logo uploaded")
    } catch (uploadError) {
      toast.error(uploadError instanceof Error ? uploadError.message : "Could not upload logo.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
        <Button
          type="button"
          variant="outline"
          className="min-h-11 shrink-0 rounded-lg px-3 sm:min-h-0"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="h-4 w-4" aria-hidden />
          )}
          Upload
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => void upload(event)}
          className="sr-only"
          aria-label="Upload sponsor logo"
        />
      </div>
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-2">
          {previewSrc ? (
            <Image
              src={previewSrc}
              alt="Sponsor logo preview"
              width={48}
              height={48}
              unoptimized
              className="h-12 w-12 rounded-md border border-white/10 bg-white object-contain p-1"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[var(--text-muted)]">
              <ImagePlus className="h-4 w-4" aria-hidden />
            </div>
          )}
          <span className="min-w-0 flex-1 truncate text-xs text-[var(--text-muted)]">{value}</span>
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remove logo"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-white/10 hover:text-[var(--text-strong)]"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <ImagePlus className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Upload a JPG, PNG or WebP up to 2MB, or paste a URL.
        </p>
      )}
    </div>
  )
}

function renderFieldControl<T extends FieldValues>(
  field: FieldConfig,
  register: UseFormRegister<T>
) {
  const name = field.name as FieldPath<T>

  if (field.kind === "textarea" || field.kind === "lines") {
    return (
      <textarea
        {...register(name)}
        rows={field.kind === "lines" ? 4 : 3}
        placeholder={field.placeholder}
        className={inputClass}
      />
    )
  }

  if (field.kind === "select") {
    return (
      <select {...register(name)} className={inputClass}>
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value} className="bg-[#050816]">
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  const type =
    field.kind === "number"
      ? "number"
      : field.kind === "url"
        ? "url"
        : field.kind === "date"
          ? "date"
          : field.kind === "time"
            ? "time"
            : "text"

  return (
    <input
      type={type}
      {...register(name)}
      min={field.kind === "number" ? field.min : undefined}
      placeholder={field.placeholder}
      className={inputClass}
    />
  )
}

function buildInitialValues(
  fields: readonly FieldConfig[],
  source: Record<string, unknown>,
  fallbacks: Record<string, unknown>
): FormValues {
  const values: FormValues = {}
  for (const field of fields) {
    const raw = source[field.name] ?? fallbacks[field.name] ?? field.defaultValue
    values[field.name] = toFormValue(field, raw)
  }
  return values
}

function normalizeForSchema(raw: unknown, fields: readonly FieldConfig[]): Record<string, unknown> {
  const source = asRecord(raw)
  const values: Record<string, unknown> = {}

  for (const field of fields) {
    const value = source[field.name]

    if (field.kind === "lines") {
      values[field.name] = toLines(value)
    } else if (field.kind === "number") {
      values[field.name] = toNumber(value)
    } else {
      values[field.name] = value
    }
  }

  return values
}

function toFormValue(field: FieldConfig, raw: unknown): FormValue {
  if (field.kind === "lines") {
    if (Array.isArray(raw)) return raw.map((value) => String(value)).join("\n")
    return raw === undefined || raw === null ? "" : String(raw)
  }

  if (field.kind === "checkbox") return raw === true

  if (field.kind === "number") {
    if (raw === undefined || raw === null || raw === "") return ""
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : ""
  }

  return raw === undefined || raw === null ? "" : String(raw)
}

function toLines(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }
  if (typeof value !== "string") return []
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function toNumber(value: unknown): number | undefined {
  if (isBlank(value)) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function entryLabel(section: CollectionSection, record: Record<string, unknown>): string {
  if (section === "faqs") return stringValue(record.question) || "Untitled FAQ"
  if (section === "announcements") return stringValue(record.title) || "Untitled announcement"
  if (section === "socials") {
    return stringValue(record.label) || stringValue(record.platform) || "Untitled social link"
  }
  return stringValue(record.name) || "Untitled entry"
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === "object") {
    return value as Record<string, unknown>
  }
  return {}
}

function stringValue(value: unknown): string {
  return typeof value === "string" && value.trim() ? value : ""
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function isBlank(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === "string") return value.trim() === ""
  if (Array.isArray(value)) return value.length === 0
  return false
}

function getErrorMessage(errors: object, name: string): string | undefined {
  const error = asRecord(errors)[name]
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message
  }
  return undefined
}

function firstError(errors: object): string | undefined {
  for (const value of Object.values(asRecord(errors))) {
    const message = getErrorMessage({ error: value }, "error")
    if (message) return message
  }
  return undefined
}

function formatError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}
