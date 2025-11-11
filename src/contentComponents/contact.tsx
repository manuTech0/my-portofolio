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
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3"
import ReCAPTCHA from "react-google-recaptcha"
import React, { useState } from "react"
import { toast } from "sonner"

const contactSchema = z.object({
    name: z.string().min(5).transform(val => DOMPurify.sanitize(val)),
    email: z.string().email().min(8).transform(val => DOMPurify.sanitize(val)),
    message: z.string().min(8).transform(val => DOMPurify.sanitize(val))
})

const SEND_MESSAGE_MUTATION = `
    mutation SendMessage($email: String!, $name: String!, $message: String!, $recaptchaToken: String!, $recaptchaVersion: String!) {
        sendMessage(
            email: $email
            name: $name
            message: $message
            recaptchaToken: $recaptchaToken
            recaptchaVersion: $recaptchaVersion
        ) {
            isBot
            needVerify
            success
            type
            message
        }
    }
`

function Element(props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>) {
    const { executeRecaptcha } = useGoogleReCaptcha()
    const [showRecaptchaV2, setShowRecaptchaV2] = useState(false)
    const [loading, setLoading] = useState(false)
    const recaptchaV2Ref = React.useRef<ReCAPTCHA>(null)

    const form = useForm<z.infer<typeof contactSchema>>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: "",
            email: "",
            message: ""
        }
    })

    const { observe } = useInView({ threshold: 0.3 })

    const sendToGraphQL = async (recaptchaToken: string, version: "v2" | "v3") => {
        try {
            const response = await fetch("https://api.manu-tech.my.id/graphql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: SEND_MESSAGE_MUTATION,
                    variables: {
                        email: form.getValues().email,
                        name: form.getValues().name,
                        message: form.getValues().message,
                        recaptchaToken,
                        recaptchaVersion: version
                    }
                })
            })

            const result = await response.json()
            if (result.data.sendMessage.type === "error" || result.error) {
                throw new Error(result.data.sendMessage.message)
            }
            return result.data.sendMessage
        } catch (error) {
            toast.error((error as { message: string }).message || "Failed to send message")
            return false
        }
    }

    const handleSubmit = async () => {
        if (!executeRecaptcha) {
            console.error("reCAPTCHA not loaded")
            return
        }
        setLoading(true)
        try {
            const v3Token = await executeRecaptcha("contact_form")
            const result = await sendToGraphQL(v3Token, "v3")
            if (!result) return
            if (result.needVerify) {
                setShowRecaptchaV2(true)
                toast.warning("Please complete the verification below")
            } else if (result.success) {
                toast.success(result.message || "Message sent successfully!")
                form.reset()
                setShowRecaptchaV2(false)
            } else {
                toast.error(result.message || "Failed to send message")
            }
        } catch (error) {
            toast.error((error as { message: string }).message)
        } finally {
            setLoading(false)
        }
    }

    const handleRecaptchaV2Change = async (token: string | null) => {
        if (!token) return
        setLoading(true)
        try {
            const result = await sendToGraphQL(token, "v2")
            if (!result) return
            if (result.success) {
                toast.success(result.message || "Message sent successfully!")
                form.reset()
                setShowRecaptchaV2(false)
                recaptchaV2Ref.current?.reset()
            } else {
                toast.error(result.message || "Verification failed")
            }
        } catch (error) {
            toast.error((error as { message: string }).message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <section {...props} className="min-h-full flex justify-center items-center">
            <div className="flex justify-center flex-col sm:flex-row items-stretch h-full w-full" ref={observe}>
                {/* Bagian Informasi Kontak */}
                <div className="flex-1 border-gray-500 border-b md:border-b-0 md:border-e p-4">
                    <h2 className="md:text-right text-2xl">
                        <span className="md:hidden">- </span>My Contact
                        <span className="hidden md:inline-block">-</span>
                    </h2>

                    <div className="flex justify-start ms-4 0 sm:ms-4 sm:justify-end md:items-center h-full">
                        <ul className="text-left text-white md:text-right">
                            {/* Email */}
                            <li>
                                <ol className="flex flex-col mt-0">
                                    <motion.li
                                        className="flex items-center justify-start md:justify-end gap-2"
                                        initial={{ x: -50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ duration: 0.6 }}
                                    >
                                        Email <Mail size={16} />
                                    </motion.li>
                                    <motion.li
                                        className="text-yellow-100"
                                        initial={{ x: -100, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ duration: 0.6, delay: 0.4 }}
                                    >
                                        <a
                                            href="mailto:maulananurfanoto10@gmail.com"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="underline hover:decoration-yellow-500 cursor-pointer text-sm"
                                        >
                                            maulananurfanoto10@gmail.com
                                        </a>
                                    </motion.li>
                                </ol>
                            </li>

                            {/* WhatsApp */}
                            <li>
                                <ol className="flex flex-col mt-2">
                                    <motion.li
                                        className="flex items-center justify-start md:justify-end gap-2"
                                        initial={{ x: -50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ duration: 0.6 }}
                                    >
                                        WhatsApp <PhoneCall size={16} />
                                    </motion.li>
                                    <motion.li
                                        className="text-yellow-100"
                                        initial={{ x: -100, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ duration: 0.6, delay: 0.4 }}
                                    >
                                        <a
                                            href="https://wa.me/6288222358226"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="underline hover:decoration-yellow-500 cursor-pointer"
                                        >
                                            +62 882-2235-8226
                                        </a>
                                    </motion.li>
                                </ol>
                            </li>

                            {/* GitHub */}
                            <li>
                                <ol className="flex flex-col mt-2">
                                    <motion.li
                                        className="flex items-center justify-start md:justify-end gap-2"
                                        initial={{ x: -50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ duration: 0.6 }}
                                    >
                                        GitHub <Github size={16} />
                                    </motion.li>
                                    <motion.li
                                        className="text-yellow-100"
                                        initial={{ x: -100, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ duration: 0.6, delay: 0.4 }}
                                    >
                                        <a
                                            href="https://github.com/manuTech0"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="underline hover:decoration-yellow-500 cursor-pointer"
                                        >
                                            manuTech0
                                        </a>
                                    </motion.li>
                                </ol>
                            </li>

                            {/* LinkedIn */}
                            <li>
                                <ol className="flex flex-col mt-2">
                                    <motion.li
                                        className="flex items-center justify-start md:justify-end gap-2"
                                        initial={{ x: -50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ duration: 0.6 }}
                                    >
                                        LinkedIn <LinkedinIcon size={16} />
                                    </motion.li>
                                    <motion.li
                                        className="text-yellow-100"
                                        initial={{ x: -100, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ duration: 0.6, delay: 0.4 }}
                                    >
                                        <a
                                            href="https://www.linkedin.com/in/maulana-nurfanoto-5256a0318"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="underline hover:decoration-yellow-500 cursor-pointer"
                                        >
                                            Maulana Nurfanoto
                                        </a>
                                    </motion.li>
                                </ol>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Form Pesan */}
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

                            {showRecaptchaV2 && (
                                <div className="flex justify-center py-2">
                                    <ReCAPTCHA
                                        ref={recaptchaV2Ref}
                                        sitekey="6LcK9wgsAAAAAO5CTgHWAHtd3CDjyo3oT1jhC0Ut"
                                        onChange={handleRecaptchaV2Change}
                                        theme="dark"
                                    />
                                </div>
                            )}

                            <Button variant="outline" className="mt-4 w-full" type="submit" disabled={loading}>
                                Send Message
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
        </section>
    )
}

export default function Contact(props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>) {
    return (
        <GoogleReCaptchaProvider
            reCaptchaKey="6LdV7ggsAAAAALsrZ1nMUb6qM2EGLTAGwmW26qCZ"
            scriptProps={{ async: true, defer: true }}
        >
            <Element {...props} />
        </GoogleReCaptchaProvider>
    )
}
