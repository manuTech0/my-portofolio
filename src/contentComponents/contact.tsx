import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Github, LinkedinIcon, Mail, PhoneCall, type LucideIcon } from "lucide-react"
import { motion } from "framer-motion"
import { useInView } from "react-cool-inview"
import { EditableField } from "@/components/editableField"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"

const buildContactSchema = (t: TFunction) => z.object({
  name: z.string().min(5, t("validation.nameMin")),
  email: z.string().email(t("validation.emailInvalid")).min(8, t("validation.emailMin")),
  message: z.string().min(8, t("validation.messageMin"))
})

type ContactFormData = z.infer<ReturnType<typeof buildContactSchema>>

// Contact links data; label/value come from translations, URLs are language-agnostic
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

// Contact item component untuk reduce duplication
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

  const handleSubmit = useCallback((data: ContactFormData) => {
    const subject = encodeURIComponent(`Portfolio: ${data.name}`)
    const body = encodeURIComponent(`${data.message}\n\nFrom: ${data.name} <${data.email}>`)
    window.location.href = `mailto:maulananurfanoto10@gmail.com?subject=${subject}&body=${body}`
  }, [])

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

              <Button 
                variant="outline" 
                className="mt-4 w-full" 
                type="submit"
              >
                {t("contact.send")}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  )
}
