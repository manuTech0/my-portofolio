import { useTranslation } from "react-i18next"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu"

export default function LanguageToggle({ className }: { className?: string }) {
    const { i18n } = useTranslation()
    const lang = i18n.resolvedLanguage === "id" ? "id" : "en"

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label="Change language"
                    className={className ?? "transform-gpu hover:scale-110 active:scale-110 hover:border-yellow-400 active:border-yellow-400 cursor-pointer border-white border-b-2 bg-transparent text-white uppercase"}
                >
                    {lang}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={lang} onValueChange={(value) => i18n.changeLanguage(value)}>
                    <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="id">Bahasa Indonesia</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
