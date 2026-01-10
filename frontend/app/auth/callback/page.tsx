"use client"
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { handleGoogleCallback } from "@/actions/user";

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState("Processing login...");

    useEffect(() => {
        const token = searchParams.get("token");

        if (token) {
            const success = handleGoogleCallback(token);
            if (success) {
                setStatus("Login successful! Redirecting...");
                router.push("/draw");
            } else {
                setStatus("Login failed. Please try again.");
                setTimeout(() => router.push("/signin"), 2000);
            }
        } else {
            setStatus("No token received. Redirecting to login...");
            setTimeout(() => router.push("/signin"), 2000);
        }
    }, [searchParams, router]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="bg-zinc-950 border border-zinc-800 rounded p-10 text-white text-center">
                <div className="animate-pulse">{status}</div>
            </div>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <div className="bg-zinc-950 border border-zinc-800 rounded p-10 text-white text-center">
                    <div className="animate-pulse">Loading...</div>
                </div>
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}
