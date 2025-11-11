import type React from "react";
import { useRef, useState } from "react";
import { Label } from "./ui/label";

type Props = {
    label: string
} & React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>

export function EditableField(props: Props) {
    const [isEditing, setIsEditing] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    return (
        <div className="inline-block w-full">
            {isEditing || inputRef.current?.value ? (
                <div className="flex flex-col w-full">
                    <Label
                        className="w-full text-gray-500 mb-[0.2rem]"
                    >{ props.label }</Label>
                    <input 
                        {...props} 
                        autoFocus
                        onBlur={() => {
                            setIsEditing(false)
                        }}
                        onKeyDown={(e) => {
                            if(e.key == "Enter") {
                                setIsEditing(false)
                            }
                        }}
                        ref={inputRef}
                        className="w-full focus-visible:ring-0 focus-visible:outline-none ps-2 transition border-b border-yellow-500"
                    />
                </div>
            ) : (
                <span className="cursor-pointer w-full border-gray-500 border-b-2 inline-block py-1 text-white hover:border-yellow-500z hover:text-gray-600 transition" onClick={() => setIsEditing(true)}>
                    { props.label }
                </span>
            )}
        </div>
    )
    
}