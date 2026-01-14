"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient, GenerationResponse } from "@/lib/api";
import { EngineVisualizer } from "./engine-visualizer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Play, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function RequestPlayground() {
    const [prompt, setPrompt] = useState("");
    const [status, setStatus] = useState<"idle" | "classifying" | "routing" | "executing" | "complete">("idle");
    const [response, setResponse] = useState<GenerationResponse | null>(null);

    const mutation = useMutation({
        mutationFn: async (text: string) => {
            // Simulation of steps for visualizer
            setStatus("classifying");
            await new Promise(r => setTimeout(r, 800)); // Fake delay for visual

            setStatus("routing");
            await new Promise(r => setTimeout(r, 800)); // Fake delay for visual

            setStatus("executing");
            return apiClient.chat.complete({
                messages: [{ role: "user", content: text }],
                model_id: undefined // Let the gateway decide
            });
        },
        onSuccess: (data) => {
            setResponse(data);
            setStatus("complete");
        },
        onError: () => {
            setStatus("idle");
        }
    });

    const handleSubmit = () => {
        if (!prompt.trim()) return;
        setResponse(null);
        mutation.mutate(prompt);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">

            {/* LEFT: Input Panel */}
            <Card className="lg:col-span-3 flex flex-col h-full border-muted">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Send className="w-5 h-5 text-primary" />
                        Input
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                    <Textarea
                        placeholder="Enter your prompt here..."
                        className="flex-1 resize-none bg-muted/30 focus:bg-background transition-colors"
                        value={prompt}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                    />
                    <Button
                        onClick={handleSubmit}
                        disabled={mutation.isPending || !prompt.trim()}
                        className="w-full"
                    >
                        {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                        Run Test
                    </Button>
                </CardContent>
            </Card>

            {/* CENTER: Visualizer */}
            <Card className="lg:col-span-5 h-full overflow-hidden border-none shadow-2xl bg-slate-950">
                <EngineVisualizer
                    status={status}
                    routingInfo={response?.routing_info}
                />
            </Card>

            {/* RIGHT: Analysis Panel */}
            <Card className="lg:col-span-4 flex flex-col h-full border-muted bg-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Play className="w-5 h-5 text-primary" />
                        Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                    {response ? (
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-6">

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">Latency</p>
                                        <p className="text-xl font-mono">1.2s</p>
                                    </div>
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">Cost</p>
                                        <p className="text-xl font-mono text-green-500">$0.0042</p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Model Info */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">Model Selection</h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Provider</span>
                                        <Badge variant="outline" className="uppercase">{response.routing_info?.provider || 'Unknown'}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Model</span>
                                        <Badge variant="outline">{response.routing_info?.model_name || response.model_used}</Badge>
                                    </div>
                                    {response.routing_info && (
                                        <div className="mt-2 space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Complexity</span>
                                                <Badge variant="secondary" className="capitalize">{response.routing_info.complexity_level}</Badge>
                                            </div>
                                            <div className="text-xs bg-blue-500/10 text-blue-400 p-2 rounded border border-blue-500/20">
                                                {response.routing_info.reasoning}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Token Usage */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">Token Usage</h4>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Input</span>
                                        <span className="font-mono">{response.usage?.input_tokens}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Output</span>
                                        <span className="font-mono">{response.usage?.output_tokens}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold pt-2 border-t">
                                        <span>Total</span>
                                        <span className="font-mono">{response.usage?.total_tokens}</span>
                                    </div>
                                </div>

                                <Separator />

                                {/* Output */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">Response</h4>
                                    <div className="bg-muted p-4 rounded-md text-sm font-mono whitespace-pre-wrap">
                                        {response.content}
                                    </div>
                                </div>

                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                            <Play className="w-12 h-12 mb-4" />
                            <p>Run a test to view analysis</p>
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}
