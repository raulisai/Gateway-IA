"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Maximize2,
  Trophy,
  Zap,
  Brain,
  Coins,
  Cpu
} from "lucide-react";
import { Model } from "@/lib/api";

interface ModelChartsProps {
  models: Model[];
}

// Helper to determine specialty based on model ID/provider
const getModelSpecialty = (model: Model) => {
  const id = model.id.toLowerCase();

  if (id.includes('reasoning') || id.includes('o1') || id.includes('deepseek-reasoner')) return "Reasoning";
  if (id.includes('flash') || id.includes('haiku') || id.includes('turbo') || id.includes('groq')) return "Speed";
  if (id.includes('gpt-4') || id.includes('opus') || id.includes('sonnet')) return "Complex";
  if (id.includes('coder') || id.includes('codestral')) return "Coding";

  return "General";
};

// Helper to calculate a synthetic score (0-100)
const calculateScore = (model: Model, maxContext: number, maxCost: number) => {
  // Normalize context (0-50 pts) - Linear
  const contextScore = (model.context_window / maxContext) * 50;

  // Normalize cost (0-50 pts) - Inverse (Lower is better)
  // Avoid division by zero, min cost is effectively 0
  const totalCost = model.cost_per_1k_input + model.cost_per_1k_output;
  // Logarithmic scale for cost might be better due to huge variances, but linear inverse for now
  // If cost is 0 (free?), score is 50. If cost is max, score is 0.
  const costScore = maxCost > 0 ? (1 - (totalCost / maxCost)) * 50 : 25;

  return Math.min(100, Math.max(0, contextScore + costScore));
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover text-popover-foreground p-3 border rounded-lg shadow-lg text-sm max-w-[250px]">
        <p className="font-bold mb-1">{data.name}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="text-muted-foreground">Provider:</span>
          <span>{data.provider}</span>

          <span className="text-muted-foreground">Context:</span>
          <span>{data.context_window.toLocaleString()} tok</span>

          <span className="text-muted-foreground">Input:</span>
          <span>${data.cost_per_1k_input.toFixed(5)}</span>

          <span className="text-muted-foreground">Output:</span>
          <span>${data.cost_per_1k_output.toFixed(5)}</span>

          <div className="col-span-2 my-1 border-t border-border" />

          <span className="text-muted-foreground">Score:</span>
          <span className="font-semibold text-primary">{data.score.toFixed(1)}/100</span>

          <span className="text-muted-foreground">Specialty:</span>
          <span className="font-medium">{data.specialty}</span>
        </div>
      </div>
    );
  }
  return null;
};


export function ModelCharts({ models }: ModelChartsProps) {
  // Process data with memos
  const { processedData, highlights } = useMemo(() => {
    if (!models.length) return { processedData: [], highlights: null };

    const maxContext = Math.max(...models.map(m => m.context_window));
    const maxCost = Math.max(...models.map(m => m.cost_per_1k_input + m.cost_per_1k_output));

    const data = models.map(model => {
      const totalCost = model.cost_per_1k_input + model.cost_per_1k_output;
      const score = calculateScore(model, maxContext, maxCost);
      const specialty = getModelSpecialty(model);

      return {
        ...model,
        totalCost,
        score,
        specialty,
        displayName: model.name.length > 20 ? model.name.substring(0, 17) + "..." : model.name
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    // Calculate Highlights
    const cheapest = [...data].sort((a, b) => a.totalCost - b.totalCost)[0];
    const smartest = [...data].sort((a, b) => b.context_window - a.context_window)[0];
    const bestValue = [...data].sort((a, b) => b.score - a.score)[0]; // Best combo of cost/context

    return {
      processedData: data,
      highlights: { cheapest, smartest, bestValue }
    };
  }, [models]);

  return (
    <div className="space-y-6">
      {/* Highlights Section */}
      {highlights && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cheapest Model</CardTitle>
              <Coins className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate" title={highlights.cheapest.name}>
                {highlights.cheapest.name}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ${highlights.cheapest.totalCost.toFixed(6)} / 1k tokens
              </p>
              <div className="mt-2 text-xs font-medium text-green-700 dark:text-green-300 bg-green-200/50 dark:bg-green-900/50 px-2 py-1 rounded inline-block">
                Best for high volume
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Smartest Leader</CardTitle>
              <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate" title={highlights.smartest.name}>
                {highlights.smartest.name}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {highlights.smartest.context_window.toLocaleString()} context window
              </p>
              <div className="mt-2 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-200/50 dark:bg-blue-900/50 px-2 py-1 rounded inline-block">
                Largest context capacity
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950/30 dark:to-pink-900/10 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Rated</CardTitle>
              <Trophy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate" title={highlights.bestValue.name}>
                {highlights.bestValue.name}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Score: {highlights.bestValue.score.toFixed(1)}/100
              </p>
              <div className="mt-2 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-200/50 dark:bg-purple-900/50 px-2 py-1 rounded inline-block">
                Best cost/performance
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Cost Chart */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Cost Analysis</CardTitle>
              <CardDescription>Input vs Output Cost per 1K tokens</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] w-full h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Full Cost Analysis</DialogTitle>
                  <DialogDescription>Detailed breakdown of model costs</DialogDescription>
                </DialogHeader>
                <div className="h-full w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} fontSize={12} height={100} />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" />
                      <Bar dataKey="cost_per_1k_input" name="Input Cost ($)" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="cost_per_1k_output" name="Output Cost ($)" stackId="a" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="displayName" angle={-45} textAnchor="end" interval={0} fontSize={10} height={60} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="cost_per_1k_input" name="Input Cost" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="cost_per_1k_output" name="Output Cost" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Score vs Context Scatter */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Value Matrix</CardTitle>
              <CardDescription>Score vs Context Window</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="score" name="Score" unit="" domain={[0, 100]} label={{ value: 'Score', position: 'bottom', offset: -10 }} />
                  <YAxis type="number" dataKey="context_window" name="Context" unit="" label={{ value: 'Context', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter name="Models" data={processedData} fill="#8884d8">
                    {processedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        entry.specialty === 'Reasoning' ? '#8b5cf6' :
                          entry.specialty === 'Speed' ? '#f59e0b' :
                            entry.specialty === 'Coding' ? '#ec4899' : '#3b82f6'
                      } />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Specialty Distribution */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Choices by Category</CardTitle>
            <CardDescription>Best performing model in each category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['General', 'Coding', 'Reasoning', 'Speed'].map(cat => {
                const bestInCat = processedData
                  .filter(m => m.specialty === cat || (cat === 'General' && m.specialty === 'Complex')) // Group Complex into General for display if needed
                  .sort((a, b) => b.score - a.score)[0];

                if (!bestInCat) return null;

                return (
                  <div key={cat} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${cat === 'Reasoning' ? 'bg-violet-100 text-violet-600' :
                        cat === 'Speed' ? 'bg-amber-100 text-amber-600' :
                          cat === 'Coding' ? 'bg-pink-100 text-pink-600' :
                            'bg-blue-100 text-blue-600'
                        }`}>
                        {cat === 'Reasoning' ? <Brain size={16} /> :
                          cat === 'Speed' ? <Zap size={16} /> :
                            cat === 'Coding' ? <Cpu size={16} /> :
                              <Trophy size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{cat}</p>
                        <p className="text-xs text-muted-foreground">{bestInCat.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold">{bestInCat.score.toFixed(0)}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
