"use client";

import { useState } from "react";
import { Model } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, Eye, EyeOff } from "lucide-react";

interface RawModelsViewProps {
    models: Model[];
}

export function RawModelsView({ models }: RawModelsViewProps) {
    const [copied, setCopied] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const handleCopy = () => {
        const jsonString = JSON.stringify(models, null, 2);
        navigator.clipboard.writeText(jsonString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="border-dashed">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Raw JSON Data</CardTitle>
                        <CardDescription>
                            View the raw underlying data source for all models.
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsVisible(!isVisible)}
                        >
                            {isVisible ? (
                                <>
                                    <EyeOff className="mr-2 h-4 w-4" /> Hide Data
                                </>
                            ) : (
                                <>
                                    <Eye className="mr-2 h-4 w-4" /> Show Data
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopy}
                            disabled={!isVisible}
                        >
                            {copied ? (
                                <>
                                    <Check className="mr-2 h-4 w-4" /> Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="mr-2 h-4 w-4" /> Copy JSON
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            {isVisible && (
                <CardContent>
                    <div className="relative rounded-md bg-muted p-4 overflow-auto max-h-[500px]">
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                            {JSON.stringify(models, null, 2)}
                        </pre>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
