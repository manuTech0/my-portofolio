import { z } from "zod"
import DOMPurify from "dompurify"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Github, LinkedinIcon, Mail, PhoneCall } from "lucide-react"
import { motion } from "framer-motion"
import { useInView } from "react-cool-inview"
import { EditableField } from "@/components/editableField"
import { useState, useCallback } from "react"
import { toast } from "sonner"

const contactSchema = z.object({
  name: z.string()
    .min(5, "Name must be at least 5 characters")
    .transform(val => DOMPurify.sanitize(val)),
  email: z.string()
    .email("Invalid email address")
    .min(8, "Email must be at least 8 characters")
    .transform(val => DOMPurify.sanitize(val)),
  message: z.string()
    .min(8, "Message must be at least 8 characters")
    .transform(val => DOMPurify.sanitize(val))
})

type ContactFormData = z.infer<typeof contactSchema>

const SEND_MESSAGE_MUTATION = `
  mutation SendMessage($email: String!, $name: String!, $message: String!) {
    sendMessage(email: $email, name: $name, message: $message) {
      success
      message
    }
  }
`

// Contact info data untuk reduce repetition
const contactInfo = [
  {
    label: "Email",
    icon: Mail,
    value: "maulananurfanoto10@gmail.com",
    href: "mailto:maulananurfanoto10@gmail.com",
    className: "text-sm"
  },
  {
    label: "WhatsApp",
    icon: PhoneCall,
    value: "+62 882-2235-8226",
    href: "https://wa.me/6288222358226"
  },
  {
    label: "GitHub",
    icon: Github,
    value: "manuTech0",
    href: "https://github.com/manuTech0"
  },
  {
    label: "LinkedIn",
    icon: LinkedinIcon,
    value: "Maulana Nurfanoto",
    href: "https://www.linkedin.com/in/maulana-nurfanoto-5256a0318"
  }
] as const

// Contact item component untuk reduce duplication
const ContactItem = ({ label, icon: Icon, value, href }: typeof contactInfo[number]) => (
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
  const [loading, setLoading] = useState(false)
  const { observe } = useInView({ threshold: 0.3 })

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      message: ""
    }
  })

  // Memoize submit handler
  const handleSubmit = useCallback(async (data: ContactFormData) => {
    setLoading(true)
    
    try {
      const response = await fetch("https://api.manu-tech.my.id/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: SEND_MESSAGE_MUTATION,
          variables: {
            email: data.email,
            name: data.name,
            message: data.message
          }
        })
      })
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      const result = await response.json()

      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Failed to send message")
      }
      
      const { success, message } = result.data.sendMessage
        
      if (success) {
        toast.success(message || "Message sent successfully!")
        form.reset()
      } else {
        toast.error(message || "Failed to send message")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send message"
      toast.error(errorMessage)
      console.error("Send message error:", error)
    } finally {
      setLoading(false)
    }
  }, [form])

  return (
    <section {...props} className="min-h-full flex justify-center items-center">
      <div className="flex justify-center flex-col sm:flex-row items-stretch h-full w-full" ref={observe}>
        {/* Contact Information Section */}
        <div className="flex-1 border-gray-500 border-b md:border-b-0 md:border-e p-4">
          <h2 className="md:text-right text-2xl">
            <span className="md:hidden">- </span>My Contact
            <span className="hidden md:inline-block">-</span>
          </h2>

          <div className="flex justify-start ms-4 sm:ms-4 sm:justify-end md:items-center h-full">
            <ul className="text-left text-white md:text-right">
              {contactInfo.map((info) => (
                <ContactItem key={info.label} {...info} />
              ))}
            </ul>
          </div>
        </div>

        {/* Message Form Section */}
        <div className="flex-1 p-4 border-t md:border-t-0 md:border-s border-gray-500 flex flex-col justify-start">
          <h2 className="text-2xl">- Message Me</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="lg:pe-10 md:pe-10 w-full sm:w-64">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="mt-2">
                    <FormControl>
                      <EditableField {...field} label="Name" placeholder="John Doe" />
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
                      <EditableField {...field} type="email" label="Email" placeholder="johndoe@email.com" />
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
                      <EditableField {...field} placeholder="Hope you're well" label="Message" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                variant="outline" 
                className="mt-4 w-full" 
                type="submit" 
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  )
}
