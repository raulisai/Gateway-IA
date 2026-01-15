"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Network, Zap, Cpu, Server, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ProposedModel {
    id: string;
    name: string;
    provider: string;
    score: number;
}

interface EngineVisualizerProps {
    status: "idle" | "classifying" | "routing" | "executing" | "complete";
    routingInfo?: {
        model_name: string;
        provider: string;
        complexity_score: number;
        complexity_level: string;
        reasoning: string;
        proposed_models?: ProposedModel[];
    };
}

export function EngineVisualizer({ status, routingInfo }: EngineVisualizerProps) {
    const [expandedStage, setExpandedStage] = useState<string | null>(null);

    // Auto-expand current stage
    useEffect(() => {
        if (status === "classifying") setExpandedStage("classification");
        if (status === "routing") setExpandedStage("routing");
        if (status === "executing") setExpandedStage("execution");
    }, [status]);

    return (
        <div className="relative flex flex-col items-center justify-center h-full w-full rounded-xl overflow-hidden p-4 md:p-8">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)", backgroundSize: "24px 24px" }} />

            {/* Central Engine HUD */}
            <div className="relative z-10 w-full max-w-2xl space-y-6">

                {/* Classification Stage */}
                <motion.div
                    className={cn(
                        "group cursor-pointer flex flex-col p-4 rounded-xl border transition-all duration-300",
                        status === "classifying" ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "bg-slate-900/40 border-slate-800/50 hover:border-slate-700",
                        (status !== "classifying" && status !== "idle" && expandedStage !== "classification") ? "opacity-60" : "opacity-100"
                    )}
                    onClick={() => setExpandedStage(expandedStage === "classification" ? null : "classification")}
                    layout
                >
                    <div className="flex items-center gap-4">
                        <div className={cn("p-2.5 rounded-xl transition-colors", status === "classifying" ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-slate-800 text-slate-400")}>
                            <Brain className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-slate-200">Input Analysis</h3>
                            <p className="text-xs text-slate-400">Scanning prompt complexity & requirements</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {status === "classifying" && (
                                <motion.div className="flex gap-1">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            className="w-1 h-1 bg-blue-500 rounded-full"
                                            animate={{ opacity: [0.2, 1, 0.2] }}
                                            transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                        />
                                    ))}
                                </motion.div>
                            )}
                            {status !== "idle" && status !== "classifying" && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                        </div>
                    </div>

                    <AnimatePresence>
                        {expandedStage === "classification" && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Complexity</p>
                                            <p className="text-sm font-semibold text-blue-400 capitalize">{routingInfo?.complexity_level || "Analyzing..."}</p>
                                        </div>
                                        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Score</p>
                                            <p className="text-sm font-semibold text-blue-400">{routingInfo?.complexity_score?.toFixed(2) || "0.00"}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed italic">
                                        {routingInfo?.reasoning || "The engine is currently evaluating the prompt structure, intent, and token count to determine the most cost-effective routing path."}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Routing Stage */}
                <div className="relative">
                    {(status !== "idle" && status !== "classifying") && (
                        <motion.div
                            className="absolute left-7 -top-6 w-px h-6 bg-gradient-to-b from-blue-500/50 to-purple-500/50"
                            initial={{ height: 0 }}
                            animate={{ height: 24 }}
                        />
                    )}

                    <motion.div
                        className={cn(
                            "group cursor-pointer flex flex-col p-4 rounded-xl border transition-all duration-300",
                            status === "routing" ? "bg-purple-500/10 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]" : "bg-slate-900/40 border-slate-800/50 hover:border-slate-700",
                            (status !== "routing" && expandedStage !== "routing") ? "opacity-60" : "opacity-100"
                        )}
                        onClick={() => setExpandedStage(expandedStage === "routing" ? null : "routing")}
                        layout
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn("p-2.5 rounded-xl transition-colors", status === "routing" ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" : "bg-slate-800 text-slate-400")}>
                                <Network className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-200">Intelligent Routing</h3>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-slate-400">Matching best model</p>
                                    {routingInfo && (
                                        <Badge variant="outline" className="text-[10px] py-0 h-4 border-purple-500/30 text-purple-300">
                                            {routingInfo.model_name}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {status === "routing" && (
                                    <motion.div className="flex gap-1">
                                        {[0, 1, 2].map((i) => (
                                            <motion.div
                                                key={i}
                                                className="w-1 h-1 bg-purple-500 rounded-full"
                                                animate={{ opacity: [0.2, 1, 0.2] }}
                                                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                            />
                                        ))}
                                    </motion.div>
                                )}
                                {(status === "executing" || status === "complete") && <CheckCircle2 className="w-4 h-4 text-purple-500" />}
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedStage === "routing" && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-4">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Scored Candidates</p>
                                            <div className="space-y-2">
                                                {(routingInfo?.proposed_models || [
                                                    { id: "1", name: routingInfo?.model_name || "GPT-4o", provider: routingInfo?.provider || "OpenAI", score: 95 },
                                                    { id: "2", name: "Claude 3.5 Sonnet", provider: "Anthropic", score: 92 },
                                                    { id: "3", name: "Gemini 1.5 Pro", provider: "Google", score: 88 }
                                                ]).map((model, idx) => (
                                                    <div key={model.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/30 border border-slate-800/30">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50" />
                                                            <div>
                                                                <p className="text-[11px] font-medium text-slate-200">{model.name}</p>
                                                                <p className="text-[9px] text-slate-500 uppercase tracking-tighter">{model.provider}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    className="h-full bg-purple-500"
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${model.score}%` }}
                                                                    transition={{ duration: 1, delay: 0.2 + (idx * 0.1) }}
                                                                />
                                                            </div>
                                                            <p className="text-[10px] text-purple-400 font-mono mt-1">{model.score.toFixed(1)}%</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Execution Stage */}
                <div className="relative">
                    {(status === "executing" || status === "complete") && (
                        <motion.div
                            className="absolute left-7 -top-6 w-px h-6 bg-gradient-to-b from-purple-500/50 to-green-500/50"
                            initial={{ height: 0 }}
                            animate={{ height: 24 }}
                        />
                    )}

                    <motion.div
                        className={cn(
                            "group cursor-pointer flex flex-col p-4 rounded-xl border transition-all duration-300",
                            status === "executing" ? "bg-green-500/10 border-green-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]" :
                                status === "complete" ? "bg-emerald-500/10 border-emerald-500/40" : "bg-slate-900/40 border-slate-800/50 hover:border-slate-700",
                            (status !== "executing" && status !== "complete" && expandedStage !== "execution") ? "opacity-60" : "opacity-100"
                        )}
                        onClick={() => setExpandedStage(expandedStage === "execution" ? null : "execution")}
                        layout
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn("p-2.5 rounded-xl transition-colors",
                                status === "executing" || status === "complete" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-slate-800 text-slate-400")}>
                                {status === "complete" ? <CheckCircle2 className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-200">Execution</h3>
                                <p className="text-xs text-slate-400">
                                    {status === "complete" ? "Response Successfully Generated" : status === "executing" ? "Context processing..." : "Awaiting selection"}
                                </p>
                            </div>
                            {status === "executing" && (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                >
                                    <Loader2 className="w-4 h-4 text-emerald-500" />
                                </motion.div>
                            )}
                        </div>

                        <AnimatePresence>
                            {expandedStage === "execution" && status !== "idle" && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-3">
                                        <div className="flex items-center justify-between text-xs p-2 bg-slate-950/20 rounded-lg">
                                            <span className="text-slate-500">Active Provider</span>
                                            <span className="font-mono text-emerald-400 uppercase">{routingInfo?.provider || "---"}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs p-2 bg-slate-950/20 rounded-lg">
                                            <span className="text-slate-500">Inference Mode</span>
                                            <span className="font-mono text-emerald-400">Optimized Stream</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

            </div>
        </div>
    );
}
