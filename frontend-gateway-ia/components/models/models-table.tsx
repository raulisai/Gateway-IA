"use client";

import { Model } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

interface ModelsTableProps {
    models: Model[];
}

export function ModelsTable({ models }: ModelsTableProps) {
    // Sort by name by default
    const sortedModels = [...models].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                                Name
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                                Provider
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                                Context Window
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                                Input Cost (1K)
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                                Output Cost (1K)
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {sortedModels.map((model) => (
                            <tr
                                key={model.id}
                                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                            >
                                <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 font-medium">
                                    {model.name}
                                    <div className="text-xs text-muted-foreground font-normal">
                                        {model.id}
                                    </div>
                                </td>
                                <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                                    <Badge variant="outline" className="capitalize">
                                        {model.provider}
                                    </Badge>
                                </td>
                                <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                                    {model.context_window.toLocaleString()}
                                </td>
                                <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                                    ${model.cost_per_1k_input.toFixed(5)}
                                </td>
                                <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                                    ${model.cost_per_1k_output.toFixed(5)}
                                </td>
                                <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                                    {model.is_active ? (
                                        <div className="flex items-center text-green-600 gap-1">
                                            <CheckCircle className="h-4 w-4" />
                                            <span>Active</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-red-500 gap-1">
                                            <XCircle className="h-4 w-4" />
                                            <span>Inactive</span>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
