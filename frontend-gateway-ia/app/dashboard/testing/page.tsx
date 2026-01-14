"use client";

import { RequestPlayground } from "@/components/testing/request-playground";

export default function TestingPage() {
    return (
        <div className="h-full p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Request Playground</h1>
                <p className="text-muted-foreground">
                    Test your prompts and visualize the Gateway's intelligent routing engine in real-time.
                </p>
            </div>

            <RequestPlayground />
        </div>
    );
}
