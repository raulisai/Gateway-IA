"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Network, Zap, Cpu, Server, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EngineVisualizerProps {
    status: "idle" | "classifying" | "routing" | "executing" | "complete";
    routingInfo?: {
        model_name: string;
        provider: string;
        complexity_score: number;
        complexity_level: string;
        reasoning: string;
    };
}

export function EngineVisualizer({ status, routingInfo }: EngineVisualizerProps) {
    return (
        <div className="relative flex flex-col items-center justify-center h-full w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 p-8">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />

            {/* Central Engine HUD */}
            <div className="relative z-10 w-full max-w-md space-y-8">

                {/* Classification Stage */}
                <motion.div
                    className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                        status === "classifying" ? "bg-blue-500/10 border-blue-500/50" : "bg-slate-900/50 border-slate-800",
                        status === "routing" || status === "executing" || status === "complete" ? "opacity-50" : "opacity-100"
                    )}
                    animate={status === "classifying" ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    <div className={cn("p-2 rounded-full", status === "classifying" ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400")}>
                        <Brain className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-200">Input Analysis</h3>
                        <p className="text-xs text-slate-400">Scanning prompt complexity...</p>
                    </div>
                    {status === "classifying" && (
                        <motion.div
                            className="ml-auto w-2 h-2 bg-blue-500 rounded-full"
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                        />
                    )}
                </motion.div>

                {/* Routing Stage */}
                <div className="relative">
                    {status !== "idle" && status !== "classifying" && (
                        <motion.div
                            className="absolute left-8 -top-8 w-0.5 h-8 bg-gradient-to-b from-blue-500 to-purple-500"
                            initial={{ height: 0 }}
                            animate={{ height: "2rem" }}
                        />
                    )}

                    <motion.div
                        className={cn(
                            "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                            status === "routing" ? "bg-purple-500/10 border-purple-500/50" : "bg-slate-900/50 border-slate-800",
                            status === "executing" || status === "complete" ? "opacity-100" : "opacity-100"
                        )}
                        animate={status === "routing" ? { boxShadow: "0 0 20px rgba(168, 85, 247, 0.2)" } : {}}
                    >
                        <div className={cn("p-2 rounded-full", status === "routing" ? "bg-purple-500 text-white" : "bg-slate-800 text-slate-400")}>
                            <Network className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-200">Intelligent Routing</h3>
                            <AnimatePresence mode="wait">
                                {routingInfo ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-xs text-purple-300"
                                    >
                                        Selected: {routingInfo.model_name}
                                    </motion.div>
                                ) : (
                                    <p className="text-xs text-slate-400">Matching best model...</p>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>

                {/* Execution Stage */}
                <div className="relative">
                    {status === "executing" || status === "complete" ? (
                        <motion.div
                            className="absolute left-8 -top-8 w-0.5 h-8 bg-gradient-to-b from-purple-500 to-green-500"
                            initial={{ height: 0 }}
                            animate={{ height: "2rem" }}
                        />
                    ) : null}

                    <motion.div
                        className={cn(
                            "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                            status === "executing" ? "bg-green-500/10 border-green-500/50" : "bg-slate-900/50 border-slate-800",
                            status === "complete" ? "bg-green-500/20 border-green-500" : ""
                        )}
                    >
                        <div className={cn("p-2 rounded-full", status === "executing" || status === "complete" ? "bg-green-500 text-white" : "bg-slate-800 text-slate-400")}>
                            {status === "complete" ? <CheckCircle2 className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-200">Execution</h3>
                            <p className="text-xs text-slate-400">
                                {status === "complete" ? "Response Generated" : "Streaming response..."}
                            </p>
                        </div>
                    </motion.div>
                </div>

            </div>
        </div>
    );
}
