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
    const [response, setResponse] = useState<any | null>(null);

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
            // Enrich with mock data for visualizer demo
            const enrichedData = {
                ...data,
                routing_info: {
                    ...data.routing_info,
                    proposed_models: [
                        { id: "1", name: data.routing_info?.model_name || data.model_used, provider: data.routing_info?.provider || "Direct", score: 98.2 },
                        { id: "2", name: "Claude 3.5 Sonnet", provider: "Anthropic", score: 92.5 },
                        { id: "3", name: "Gemini 1.5 Flash", provider: "Google", score: 85.1 }
                    ]
                }
            };
            setResponse(enrichedData);
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
        <div className="flex flex-col gap-6 lg:h-[calc(100vh-180px)] min-h-[600px] w-full max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">

                {/* LEFT: Input Panel */}
                <Card className="lg:col-span-3 flex flex-col border-muted/50 bg-card/30 backdrop-blur-sm overflow-hidden h-[calc(60vh-200px)]  mt-52">
                    <CardHeader className="pb-3 shrink-0">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Send className="w-4 h-4 text-blue-500" />
                            Input Prompt
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
                        <Textarea
                            placeholder="Describe your task..."
                            className="flex-1 resize-none bg-muted/20 border-border focus:ring-1 focus:ring-blue-500/50 transition-all rounded-lg p-4 text-sm leading-relaxed"
                            value={prompt}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                        />
                        <Button
                            onClick={handleSubmit}
                            disabled={mutation.isPending || !prompt.trim()}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 shrink-0"
                        >
                            {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                            Run Analysis
                        </Button>
                    </CardContent>
                </Card>

                {/* CENTER: Visualizer */}
                <Card variant="ghost" className="lg:col-span-4 h-full overflow-hidden flex flex-col border border-muted/20">
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                        <EngineVisualizer
                            status={status}
                            routingInfo={response?.routing_info}
                        />
                    </div>
                </Card>

                {/* RIGHT: Analysis Panel */}
                <Card className="lg:col-span-5 flex flex-col border-muted/50 bg-card/30 backdrop-blur-sm overflow-hidden h-full">
                    <CardHeader className="pb-3 shrink-0">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Play className="w-4 h-4 text-purple-500" />
                            Smart Metrics & Response
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                        {response ? (
                            <ScrollArea className="h-full px-6">
                                <div className="space-y-6 pb-6">

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 bg-muted/50 dark:bg-muted/30 rounded-xl border border-border">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Latency</p>
                                            <p className="text-xl font-semibold font-mono text-foreground dark:text-slate-100 italic">1.24<span className="text-xs ml-1 text-muted-foreground">s</span></p>
                                        </div>
                                        <div className="p-4 bg-muted/50 dark:bg-muted/30 rounded-xl border border-border">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Total Cost</p>
                                            <p className="text-xl font-semibold font-mono text-emerald-600 dark:text-emerald-400">$0.0042</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Model Data</h4>
                                            <Badge variant="outline" className="text-[10px] h-5 border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5 uppercase">{response.routing_info?.provider || 'Unknown'}</Badge>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border">
                                                <span className="text-xs text-muted-foreground">Deployed Model</span>
                                                <span className="text-xs font-semibold text-foreground dark:text-slate-200">{response.routing_info?.model_name || response.model_used}</span>
                                            </div>

                                            {response.routing_info && (
                                                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] text-blue-600 dark:text-blue-400/70 font-bold uppercase">Classification</span>
                                                        <Badge className="text-[9px] h-4 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border-none capitalize">{response.routing_info.complexity_level}</Badge>
                                                    </div>
                                                    <p className="text-[11px] text-foreground/80 dark:text-slate-300 leading-relaxed italic">
                                                        "{response.routing_info.reasoning}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Resources</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="text-center p-2 rounded-lg bg-muted/20 border border-border">
                                                <p className="text-[9px] text-muted-foreground mb-1">Input</p>
                                                <p className="text-xs font-mono font-bold text-foreground dark:text-slate-200">{response.usage?.input_tokens}</p>
                                            </div>
                                            <div className="text-center p-2 rounded-lg bg-muted/20 border border-border">
                                                <p className="text-[9px] text-muted-foreground mb-1">Output</p>
                                                <p className="text-xs font-mono font-bold text-foreground dark:text-slate-200">{response.usage?.output_tokens}</p>
                                            </div>
                                            <div className="text-center p-2 rounded-lg bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20">
                                                <p className="text-[9px] text-blue-600 dark:text-blue-400 mb-1">Total</p>
                                                <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-300">{response.usage?.total_tokens}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Final Response Content</h4>
                                        <div className="bg-muted/50 dark:bg-slate-950/70 p-5 rounded-md border border-border dark:border-slate-800/50 shadow-sm dark:shadow-2xl group relative">
                                            <div className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                <Badge variant="outline" className="text-[8px] h-4 text-muted-foreground border-border">UTF-8</Badge>
                                                <Badge variant="outline" className="text-[8px] h-4 text-muted-foreground border-border">Markdown</Badge>
                                            </div>
                                            <div className="text-sm font-light text-foreground dark:text-slate-200 leading-relaxed whitespace-pre-wrap max-w-none">
                                                {response.content}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </ScrollArea>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 p-12 text-center">
                                <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-6 border border-border">
                                    <Play className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <h5 className="text-sm font-semibold text-muted-foreground mb-2">Engine Ready</h5>
                                <p className="text-xs max-w-[200px] leading-relaxed">Submit a prompt to start the intelligent routing and analysis visualization.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
