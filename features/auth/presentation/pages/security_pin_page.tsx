"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export function SecurityPin() {
    const router = useRouter()
    const [pin, setPin] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const press = (digit: string) => {
        setPin((p) => (p.length < 6 ? p + digit : p))
    }

    const erase = () => setPin((p) => p.slice(0, -1))

    const onConfirm = async () => {
        if (pin.length < 6 || isSubmitting) return
        setIsSubmitting(true)
        setError(null)

        try {
            const res = await fetch("/api/v1/auth/pin/set", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ pin }),
            })

            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body?.error ?? "Failed to save PIN")
            }

            localStorage.setItem("kyc_pin", pin)
            router.push("/register/complete")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save PIN")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="bg-background min-h-screen flex flex-col items-center justify-center overflow-hidden relative">
            <div className="absolute w-[10000px] h-[400px] bg-[#3B82F6] opacity-10 blur-[120px] rounded-full top-[-300px] z-0"></div>
            <div className="absolute w-[10000px] h-[400px] bg-[#3B82F6] opacity-10 blur-[120px] rounded-full bottom-[-300px] z-0"></div>

            <div className="z-10 w-full min-h-screen sm:max-w-sm sm:min-h-0 p-[1px] rounded-none sm:rounded-[30px] bg-transparent sm:bg-gradient-to-b from-gray-700 from-[10%] via-slate-800 via-[45%] to-slate-700 to-[100%]">
                <div className="z-10 bg-transparent md:bg-linear-to-b from-[#15182B] to-[#1C2140] text-center text-white flex flex-col gap-0 sm:gap-8 justify-between items-center p-8 rounded-none sm:rounded-[30px] min-h-screen sm:min-h-0 shadow-2xl">

                    <div className="flex flex-col gap-8 sm:gap-8 justify-center items-center w-full">
                        <div className="flex items-center justify-between w-full">
                            <ArrowLeft
                                size={28}
                                className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                                onClick={() => router.back()}
                            />
                            <h1 className="font-bold text-2xl flex-1 text-center">Set Your Security PIN</h1>
                            <div className="w-7" /> {/* spacer to center the title */}
                        </div>

                        {/* PIN dots */}
                        <div className="flex justify-center items-center gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-4 h-4 rounded-full transition-colors duration-150 ${
                                        i < pin.length ? "bg-white" : "bg-white/30"
                                    }`}
                                />
                            ))}
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm font-semibold">{error}</p>
                        )}
                    </div>

                    {/* Number pad + confirm */}
                    <div className="flex flex-col gap-6 w-full">
                        <div className="grid grid-cols-3 gap-6 text-4xl sm:text-3xl font-semibold">
                            {["1","2","3","4","5","6","7","8","9"].map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => press(d)}
                                    className="bg-transparent hover:bg-white/10 p-4 rounded-xl transition cursor-pointer text-center"
                                >
                                    {d}
                                </button>
                            ))}

                            {/* empty cell */}
                            <div />

                            <button
                                type="button"
                                onClick={() => press("0")}
                                className="bg-transparent hover:bg-white/10 p-4 rounded-xl transition cursor-pointer"
                            >
                                0
                            </button>

                            <button
                                type="button"
                                onClick={erase}
                                className="flex justify-center items-center bg-transparent hover:bg-white/10 p-4 rounded-xl transition cursor-pointer"
                            >
                                <ArrowLeft width={36} height={36} />
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={pin.length < 6 || isSubmitting}
                            className="bg-gradient-to-r from-[#00FFA3] to-[#3B82F6] py-4 px-8 rounded-lg text-white font-bold w-full disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        >
                            {isSubmitting ? "Saving…" : "Confirm PIN"}
                        </button>
                        {error && <p className="text-red-400 text-sm font-semibold">{error}</p>}
                    </div>

                </div>
            </div>
        </main>
    )
}
