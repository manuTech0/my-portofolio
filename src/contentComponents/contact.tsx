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

const contactSchema = z.object({
    name: z.string().min(5).transform(val => DOMPurify.sanitize(val)),
    email: z.string().min(8).transform(val => DOMPurify.sanitize(val)),
    message: z.string().min(8).transform(val => DOMPurify.sanitize(val))
})

export default function Contact(props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>) {
    const form = useForm<z.infer<typeof contactSchema>>({
        resolver: zodResolver(contactSchema)
    })
    const { observe, inView } = useInView({
        threshold: 0.3
    });

    return (
        <section {...props} className="min-h-full flex justify-center items-center">
            <div className="flex justify-center flex-col sm:flex-row items-stretch h-full w-full" ref={observe}>
                <div className="flex-1 p-4 z-100 h-full border-b lg:border-e md:border-b-0 md:border-e border-gray-500">
                    <h2 className="md:text-right text-2xl"><span className="md:hidden">- </span>My Contact <span className="hidden md:inline-block">-</span></h2>
                    <div className="flex justify-end md:items-center h-full ">
                        <ul className="text-left text-white md:text-right">
                            <ol className="flex flex-col mt-0">
                                <motion.li 
                                    className="flex ietems-center justify-start md:justify-end lg:justify-end gap-2"
                                    initial={{ x: -50, opacity: 0 }}
                                    {...(inView && {
                                        animate: { x: 0, opacity: 100 },
                                    })}
                                    transition={{ duration: 0.6 }}
                                >Email <Mail size={16} /> <span className="md:hidden">:</span></motion.li>
                                <motion.li
                                    className="text-yellow-100"
                                    initial={{ x: -100, opacity: 0 }}
                                    {...(inView && {
                                        animate: { x: 0, opacity: 100 },
                                    })}
                                    transition={{ duration: 0.6, delay: 0.4, }}
                                    aria-label="redirect to email"
                                >
                                    <span className="underline sm:text-[0.8rem] hover:decoration-yellow-500 cursor-pointer">
                                        <a target="_blank" href="mailto:maulananurfanoto10@gmail.com" aria-label="redirect to email" title="redirect to email">maulananurfanoto10@gmail.com</a>    
                                    </span> <span className="hidden md:inline-block">:</span>
                                </motion.li>
                            </ol>
                            <ol className="flex flex-col mt-2">
                                <motion.li
                                    className="flex items-center justify-start md:justify-end lg:justify-end gap-2"
                                    initial={{ x: -50, opacity: 0 }}
                                    {...(inView && {
                                        animate: { x: 0, opacity: 100 },
                                    })}
                                    transition={{ duration: 0.6 }}
                                >Whatsapp <PhoneCall size={16} /> <span className="md:hidden">:</span></motion.li>
                                <motion.li
                                    className="text-yellow-100"
                                    initial={{ x: -100, opacity: 0 }}
                                    {...(inView && {
                                        animate: { x: 0, opacity: 100 },
                                    })}
                                    transition={{ duration: 0.6, delay: 0.4, }}
                                    aria-label="redirect to whatsapp"
                                >
                                    <span className="underline hover:decoration-yellow-500 cursor-pointer">
                                        <a target="_blank" href="https://wa.me/6288222358226" aria-label="redirect to whatsapp" title="redirect to whatsapp">+62 882-2235-8226</a>
                                    </span> <span className="hidden md:inline-block">:</span>
                                </motion.li>
                            </ol>
                            <ol className="flex flex-col mt-2 ">
                                <motion.li
                                    className="flex items-center justify-start md:justify-end lg:justify-end gap-2"
                                    initial={{ x: -50, opacity: 0 }}
                                    {...(inView && {
                                        animate: { x: 0, opacity: 100 },
                                    })}
                                    transition={{ duration: 0.6 }}
                                >Github <Github size={16} /> <span className="md:hidden">:</span></motion.li>
                                <motion.li
                                    className="text-yellow-100"
                                    initial={{ x: -100, opacity: 0 }}
                                    {...(inView && {
                                        animate: { x: 0, opacity: 100 },
                                    })}
                                    transition={{ duration: 0.6, delay: 0.4, }}
                                    aria-label="redirect to github"
                                >
                                    <span className="underline hover:decoration-yellow-500 cursor-pointer">
                                        <a target="_blank" href="https://github.com/manuTech0" aria-label="redirect to github" title="redirect to github">manuTech0</a>    
                                    </span> <span className="hidden md:inline-block">:</span>
                                </motion.li>
                            </ol>
                            <ol className="flex flex-col mt-2">
                                <motion.li
                                    className="flex items-center justify-start md:justify-end lg:justify-end gap-2"
                                    initial={{ x: -50, opacity: 0 }}
                                    {...(inView && {
                                        animate: { x: 0, opacity: 100 },
                                    })}
                                    transition={{ duration: 0.6 }}
                                >Linkedl <LinkedinIcon size={16} /> <span className="md:hidden">:</span></motion.li>
                                <motion.li
                                    className="text-yellow-100"
                                    initial={{ x: -100, opacity: 0 }}
                                    {...(inView && {
                                        animate: { x: 0, opacity: 100 },
                                    })}
                                    transition={{ duration: 0.6, delay: 0.4, }}
                                    aria-label="redirect to linkedin"
                                >
                                    <span className="underline hover:decoration-yellow-500 cursor-pointer">
                                        <a target="_blank" w-full href="https://www.linkedin.com/in/maulana-nurfanoto-5256a0318" aria-label="redirect to linkedin" title="redirect to linkedin">Maulana Nurfanoto</a>
                                    </span> <span className="hidden md:inline-block">:</span>
                                </motion.li>
                            </ol>
                        </ul>
                    </div>
                </div>
                <div  className="flex-1 p-4 z-100 border-t min-h-full lg:border-s md:border-t-0 md:border-s border-gray-500 flex flex-col justify-start ">
                    <h2 className="text-2xl">- Message Me</h2>
                    <div className="flex md:items-center h-full">
                        <Form {...form} >
                            <form method="post" className="lg:pe-10 md:pe-10 w-full sm:w-64" onSubmit={(e) => e.preventDefault()}>
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="mt-0">
                                            <FormControl>
                                                <motion.div
                                                    initial={{ x: 100, opacity: 0 }}
                                                    {...(inView && {
                                                        animate: { x: 0, opacity: 100 },
                                                    })}
                                                    transition={{ duration: 0.6, delay: 0.4 }}
                                                >
                                                        <EditableField {...field} label="Name" placeholder="John Doe" />
                                                    </motion.div>
                                                    </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="mt-2">
                                            <FormControl>
                                                <motion.div
                                                    initial={{ x: 100, opacity: 0 }}
                                                    {...(inView && {
                                                        animate: { x: 0, opacity: 100 },
                                                    })}
                                                    transition={{ duration: 0.6, delay: 0.4 }}
                                                >
                                                    <EditableField {...field} type="email" label="Email" placeholder="johndoe@email.com"/>
                                                </motion.div>
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
                                                <motion.div
                                                    initial={{ x: 100, opacity: 0 }}
                                                    {...(inView && {
                                                        animate: { x: 0, opacity: 100 },
                                                    })}
                                                    transition={{ duration: 0.6, delay: 0.4 }}
                                                >
                                                    <EditableField {...field}  placeholder="Hope you're well" label="Message"/>
                                                </motion.div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <motion.div
                                    initial={{ x: 50, opacity: 0 }}
                                    {...(inView && {
                                        animate: { x: 0, opacity: 100 },
                                    })}
                                    transition={{ duration: 0.6 }}
                                >
                                    <Button variant="outline" className="mt-4 w-full">Send Message</Button>
                                </motion.div>
                                
                            </form>
                        </Form>
                    </div>
                </div>
            </div>
        </section>
    )
}