import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Github, LinkedinIcon, Mail, PhoneCall, type LucideIcon } from "lucide-react"
import { motion } from "framer-motion"
import { useInView } from "react-cool-inview"
import { EditableField } from "@/components/editableField"
import { Turnstile } from "@marsidev/react-turnstile"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"

const buildContactSchema = (t: TFunction) => z.object({
  name: z.string().min(5, t("validation.nameMin")),
  email: z.string().email(t("validation.emailInvalid")).min(8, t("validation.emailMin")),
  message: z.string().min(8, t("validation.messageMin"))
})

type ContactFormData = z.infer<ReturnType<typeof buildContactSchema>>

const contactLinks = [
  {
    labelKey: "contact.email",
    valueKey: "contact.emailValue",
    icon: Mail,
    href: "mailto:maulananurfanoto10@gmail.com"
  },
  {
    labelKey: "contact.whatsapp",
    valueKey: "contact.whatsappValue",
    icon: PhoneCall,
    href: "https://wa.me/6288222358226"
  },
  {
    labelKey: "contact.github",
    valueKey: "contact.githubValue",
    icon: Github,
    href: "https://github.com/manuTech0"
  },
  {
    labelKey: "contact.linkedin",
    valueKey: "contact.linkedinValue",
    icon: LinkedinIcon,
    href: "https://www.linkedin.com/in/maulana-nurfanoto-5256a0318"
  }
] as const

const ContactItem = ({ label, icon: Icon, value, href }: {
  label: string
  icon: LucideIcon
  value: string
  href: string
}) => (
  <li>
    <ol className="flex flex-col mt-2">
      <motion.li
        className="flex items-center justify-start md:justify-end gap-2"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {label} <Icon size={16} />
      </motion.li>
      <motion.li
        className="text-yellow-100"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className={`underline hover:decoration-yellow-500 cursor-pointer`}
        >
          {value}
        </a>
      </motion.li>
    </ol>
  </li>
)

const COOLDOWN_SECONDS = 3

// crypto.randomUUID() only exists in secure contexts (https/localhost);
// insecure origins (LAN http) need this fallback.
function createIdempotencyKey(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export default function Contact(props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>) {
  const { t } = useTranslation()
  const { observe } = useInView({ threshold: 0.3 })

  const form = useForm<ContactFormData>({
    resolver: zodResolver(buildContactSchema(t)),
    defaultValues: {
      name: "",
      email: "",
      message: ""
    }
  })

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
  const apiBase = import.meta.env.VITE_API_URL ?? "/api"
  const apiUrl = `${apiBase}/contact`
  const sessionUrl = `${apiBase}/session`

  // Turnstile is disabled in development or when no site key is configured.
  const isTurnstileDisabled = import.meta.env.DEV || !siteKey

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [turnstileToken, setTurnstileToken] = useState("")
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [serverError, setServerError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Fetch a fresh HS256 JWT session token from the server on mount.
  // This token must be sent with every /api/contact request (Authorization: Bearer).
  useEffect(() => {
    void (async () => {
      try {
        setSessionLoading(true)
        const res = await fetch(sessionUrl, { method: "POST", credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          if (data.token) setSessionToken(data.token)
        }
      } catch (err) {
        console.error("[contact] session fetch failed", err)
      } finally {
        setSessionLoading(false)
      }
    })()
  }, [sessionUrl])

  // Mandatory 3-second cooldown after a successful submission.
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [cooldown])

  const handleHttpError = useCallback((status: number, body: unknown) => {
    const message = (body as { message?: string })?.message
    switch (status) {
      case 422:
        setServerError(message || t("contact.turnstileError"))
        break
      case 429:
        setServerError(message || t("contact.errorRateLimited", { retryAfter: "30" }))
        break
      case 409:
        setServerError(message || t("contact.errorIdempotencyConflict"))
        break
      case 400:
        setServerError(message || t("validation.emailInvalid"))
        break
      case 503:
        setServerError(message || t("contact.errorServer"))
        break
      default:
        setServerError(message || t("contact.errorServer"))
        break
    }
  }, [t])

  const handleSubmit = useCallback(async (data: ContactFormData) => {
    if (isSubmitting || cooldown > 0) return

    // Turnstile token is required only when Turnstile is enabled.
    if (!isTurnstileDisabled && !turnstileToken) {
      setServerError(t("contact.turnstileRequired"))
      return
    }
    if (!sessionToken) {
      setServerError(t("contact.errorServer"))
      return
    }

    setIsSubmitting(true)
    setServerError("")
    setSuccessMessage("")

    try {
      const idempotencyKey = createIdempotencyKey()

      const submitWithToken = async (token: string) => {
        const res = await fetch(apiUrl, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
            ...(isTurnstileDisabled ? {} : { "X-Turnstile-Token": turnstileToken }),
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: data.name.trim(),
            email: data.email.trim().toLowerCase(),
            message: data.message.trim(),
          }),
        })
        let body: unknown
        try { body = await res.json() } catch { body = {} }
        return { res, body }
      }

      let { res, body } = await submitWithToken(sessionToken)

      // If session expired, fetch a new token and retry once.
      if (res.status === 401) {
        try {
          const refresh = await fetch(sessionUrl, { method: "POST", credentials: "include" })
          if (refresh.ok) {
            const data = await refresh.json()
            if (data.token) {
              setSessionToken(data.token)
              ;({ res, body } = await submitWithToken(data.token))
            }
          }
        } catch (err) {
          console.error("[contact] session refresh failed", err)
        }
      }

      if (!res.ok) { handleHttpError(res.status, body); return }
      setSuccessMessage(t("contact.success"))
      setCooldown(COOLDOWN_SECONDS)
    } catch (err) {
      console.error("[contact] submit failed", err)
      setServerError(t("contact.errorNetwork"))
    } finally {
      setIsSubmitting(false)
    }
  }, [apiUrl, isSubmitting, cooldown, turnstileToken, isTurnstileDisabled, sessionToken, sessionUrl, handleHttpError, t])

  const buttonLabel = cooldown > 0
    ? t("contact.sentCountdown", { seconds: cooldown })
    : isSubmitting
      ? t("contact.submitting")
      : t("contact.send")

  return (
    <section {...props} className="min-h-full flex justify-center items-center">
      <div className="flex justify-center flex-col sm:flex-row items-stretch h-full w-full" ref={observe}>
        {/* Contact Information Section */}
        <div className="flex-1 border-gray-500 border-b md:border-b-0 md:border-e p-4">
          <h2 className="md:text-right text-2xl">
            <span className="md:hidden">- </span>{t("contact.myContact")}
            <span className="hidden md:inline-block">-</span>
          </h2>

          <div className="flex justify-start ms-4 sm:ms-4 sm:justify-end md:items-center h-full">
            <ul className="text-left text-white md:text-right">
              {contactLinks.map((link) => (
                <ContactItem
                  key={link.labelKey}
                  label={t(link.labelKey)}
                  value={t(link.valueKey)}
                  icon={link.icon}
                  href={link.href}
                />
              ))}
            </ul>
          </div>
        </div>

        {/* Message Form Section */}
        <div className="flex-1 p-4 border-t md:border-t-0 md:border-s border-gray-500 flex flex-col justify-start">
          <h2 className="text-2xl">- {t("contact.messageMe")}</h2>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="lg:pe-10 md:pe-10 w-full sm:w-64">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="mt-2">
                    <FormControl>
                      <EditableField {...field} label={t("contact.formName")} placeholder={t("contact.placeholderName")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="mt-2">
                    <FormControl>
                      <EditableField {...field} type="email" label={t("contact.formEmail")} placeholder={t("contact.placeholderEmail")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem className="mt-2 w-full">
                    <FormControl>
                      <EditableField {...field} placeholder={t("contact.placeholderMessage")} label={t("contact.formMessage")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isTurnstileDisabled && (
                <Turnstile
                  siteKey={siteKey!}
                  onSuccess={(token: string) => {
                    setTurnstileToken(token)
                    setServerError("")
                  }}
                  onExpire={() => {
                    setTurnstileToken("")
                    setServerError("")
                  }}
                  onError={() => {
                    setTurnstileToken("")
                    setServerError(t("contact.turnstileError"))
                  }}
                  className="mt-2"
                />
              )}

              {serverError && (
                <p className="mt-2 text-destructive text-sm" role="alert" aria-live="polite">
                  {serverError}
                </p>
              )}

              {successMessage && (
                <p className="mt-2 text-green-400 text-sm" role="status" aria-live="polite">
                  {successMessage}
                </p>
              )}

              <Button
                variant="outline"
                className="mt-4 w-full"
                type="submit"
                disabled={isSubmitting || cooldown > 0 || sessionLoading || !sessionToken}
                aria-busy={isSubmitting || cooldown > 0 || sessionLoading || !sessionToken ? true : undefined}
              >
                {buttonLabel}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  )
}
