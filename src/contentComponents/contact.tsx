import { z } from "zod"
import DOMPurify from "dompurify"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, /* FormDescription */ FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Github, LinkedinIcon, Mail, PhoneCall } from "lucide-react"
import { motion } from "framer-motion"
import { useInView } from "react-cool-inview"

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
        threshold: 0.8
    });

    return (
        <section {...props} className="h-full flex justify-center items-center">
            <div className="flex items-center justify-center">
                <div className="flex-1 p-4 z-100 h-full" ref={observe} >
                    <ul className="text-right text-white">
                        <ol className="flex flex-col mt-2">
                            <motion.span 
                                className="flex ietems-center justify-end gap-2"
                                initial={{ x: -50, opacity: 0 }}
                                {...(inView && {
                                    animate: { x: 0, opacity: 100 },
                                })}
                                transition={{ duration: 0.6 }}
                            >Email <Mail size={16} /></motion.span>
                            <motion.span 
                                className="text-yellow-100"
                                initial={{ x: -100, opacity: 0 }}
                                {...(inView && {
                                    animate: { x: 0, opacity: 100 },
                                })}
                                transition={{ duration: 0.6, delay: 0.4, }}
                            >
                                <span className="underline sm:text-[0.8rem] hover:decoration-yellow-500 cursor-pointer">
                                    <a target="_blank" href="mailto:maulananurfanoto10@gmail.com">maulananurfanoto10@gmail.com</a>    
                                </span> :
                            </motion.span>
                        </ol>
                        <ol className="flex flex-col mt-2">
                            <motion.span
                                className="flex items-center justify-end gap-2"
                                initial={{ x: -50, opacity: 0 }}
                                {...(inView && {
                                    animate: { x: 0, opacity: 100 },
                                })}
                                transition={{ duration: 0.6 }}
                            >Whatsapp <PhoneCall size={16} /></motion.span>
                            <motion.span
                                className="text-yellow-100"
                                initial={{ x: -100, opacity: 0 }}
                                {...(inView && {
                                    animate: { x: 0, opacity: 100 },
                                })}
                                transition={{ duration: 0.6, delay: 0.4, }}
                            >
                                <span className="underline hover:decoration-yellow-500 cursor-pointer">
                                    <a target="_blank" href="https://wa.me/6288222358226">+62 882-2235-8226</a>
                                </span> :
                            </motion.span>
                        </ol>
                        <ol className="flex flex-col mt-2 ">
                            <motion.span
                                className="flex items-center justify-end gap-2"
                                initial={{ x: -50, opacity: 0 }}
                                {...(inView && {
                                    animate: { x: 0, opacity: 100 },
                                })}
                                transition={{ duration: 0.6 }}
                            >Github <Github size={16} /></motion.span>
                            <motion.span
                                className="text-yellow-100"
                                initial={{ x: -100, opacity: 0 }}
                                {...(inView && {
                                    animate: { x: 0, opacity: 100 },
                                })}
                                transition={{ duration: 0.6, delay: 0.4, }}
                            >
                                <span className="underline hover:decoration-yellow-500 cursor-pointer">
                                    <a target="_blank" href="https://github.com/manuTech0">manuTech0</a>    
                                </span> :
                            </motion.span>
                        </ol>
                        <ol className="flex flex-col mt-2">
                            <motion.span
                                className="flex items-center justify-end gap-2"
                                initial={{ x: -50, opacity: 0 }}
                                {...(inView && {
                                    animate: { x: 0, opacity: 100 },
                                })}
                                transition={{ duration: 0.6 }}
                            >Linkedl <LinkedinIcon size={16} /></motion.span>
                            <motion.span
                                className="text-yellow-100"
                                initial={{ x: -100, opacity: 0 }}
                                {...(inView && {
                                    animate: { x: 0, opacity: 100 },
                                })}
                                transition={{ duration: 0.6, delay: 0.4, }}
                            >
                                <span className="underline hover:decoration-yellow-500 cursor-pointer">
                                    <a target="_blank" w-full href="https://www.linkedin.com/in/maulana-nurfanoto-5256a0318">Maulana Nurfanoto</a>
                                </span> :
                            </motion.span>
                        </ol>
                    </ul>
                </div>
                <div className="flex-1 p-4 z-100 border-s border-gray-500 flex flex-col justify-start">
                    <Form {...form}>
                        <form method="post" className="pe-10" onSubmit={(e) => e.preventDefault()}>
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="mt-2">
                                        <FormLabel><motion.span
                                            initial={{ x: 50, opacity: 0 }}
                                            {...(inView && {
                                                animate: { x: 0, opacity: 100 },
                                            })}
                                            transition={{ duration: 0.6 }}
                                        >Name</motion.span></FormLabel>
                                        <FormControl>
                                            <motion.div
                                                initial={{ x: 100, opacity: 0 }}
                                                {...(inView && {
                                                    animate: { x: 0, opacity: 100 },
                                                })}
                                                transition={{ duration: 0.6, delay: 0.4 }}
                                            >
                                                <Input placeholder="robert@email.com" className="cursor-text w-full" {...field} />
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
                                        <FormLabel><motion.span
                                            initial={{ x: 50, opacity: 0 }}
                                            {...(inView && {
                                                animate: { x: 0, opacity: 100 },
                                            })}
                                            transition={{ duration: 0.6 }}
                                        >Email</motion.span></FormLabel>
                                        <FormControl>
                                            <motion.div
                                                initial={{ x: 100, opacity: 0 }}
                                                {...(inView && {
                                                    animate: { x: 0, opacity: 100 },
                                                })}
                                                transition={{ duration: 0.6, delay: 0.4 }}
                                            >
                                                <Input placeholder="Robert Agustian" className="cursor-text w-full" {...field} />
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
                                    <FormItem className="mt-2">
                                        <FormLabel><motion.span
                                            initial={{ x: 50, opacity: 0 }}
                                            {...(inView && {
                                                animate: { x: 0, opacity: 100 },
                                            })}
                                            transition={{ duration: 0.6 }}
                                        >Message</motion.span></FormLabel>
                                        <FormControl>
                                            <motion.div
                                                initial={{ x: 100, opacity: 0 }}
                                                {...(inView && {
                                                    animate: { x: 0, opacity: 100 },
                                                })}
                                                transition={{ duration: 0.6, delay: 0.4 }}
                                            >
                                                <Textarea {...field} rows={2} className="cursor-text w-full"></Textarea>
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
                                <Button variant="outline" className="mt-4 w-full">{/* Send */} Cooming soon</Button>
                            </motion.div>
                            
                        </form>
                    </Form>
                </div>
            </div>
        </section>
    )
}