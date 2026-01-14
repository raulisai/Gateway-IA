"use client";

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
  ZAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Model } from "@/lib/api";

interface ModelChartsProps {
  models: Model[];
}

export function ModelCharts({ models }: ModelChartsProps) {
  // Sort by name for consistent display
  const sortedModels = [...models].sort((a, b) => a.name.localeCompare(b.name));

  // Data for Cost Comparison Chart
  const costData = sortedModels.map((model) => ({
    name: model.name,
    Input: model.cost_per_1k_input,
    Output: model.cost_per_1k_output,
    TotalAvg: (model.cost_per_1k_input + model.cost_per_1k_output) / 2, // Just for sorting/reference
  }));

  // Data for Context Window Chart
  const contextData = sortedModels
    .map((model) => ({
      name: model.name,
      context: model.context_window,
    }))
    .sort((a, b) => b.context - a.context); // Sort by context size

  // Data for Scatter (Price vs Context)
  const scatterData = sortedModels.map((model) => ({
    name: model.name,
    x: model.cost_per_1k_input + model.cost_per_1k_output, // Total Cost
    y: model.context_window, // Context Window
    z: 1,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
      {/* Cost Comparison Chart */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Cost Comparison per 1K Tokens</CardTitle>
          <CardDescription>
            Comparing input and output costs across different models.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={costData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} fontSize={10} />
                <YAxis label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(5)}`, "Cost"]}
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend verticalAlign="top"/>
                <Bar dataKey="Input" stackId="a" fill="#8884d8" name="Input Cost" />
                <Bar dataKey="Output" stackId="a" fill="#82ca9d" name="Output Cost" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Context Window Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Context Window Size</CardTitle>
          <CardDescription>
            Maximum tokens processed by each model.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={contextData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 40,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => `${value / 1000}k`} />
                <YAxis dataKey="name" type="category" width={100} fontSize={10} />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString()} tokens`, "Context"]}
                />
                <Bar dataKey="context" fill="#ffc658" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cost Distribution (Input vs Output) */}
      <Card>
        <CardHeader>
          <CardTitle>Input vs Output Cost Ratio</CardTitle>
          <CardDescription>
             Comparing the ratio of input to output costs.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="h-[350px]">
             <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20,
                  }}
                >
                  <CartesianGrid />
                  <XAxis type="number" dataKey="Input" name="Input Cost" unit="$" label={{ value: 'Input Cost ($)', position: 'bottom', offset: 0 }} />
                  <YAxis type="number" dataKey="Output" name="Output Cost" unit="$" label={{ value: 'Output Cost ($)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-2 border rounded shadow-sm text-sm">
                            <p className="font-semibold">{data.name}</p>
                            <p>Input: ${data.Input}</p>
                            <p>Output: ${data.Output}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Models" data={costData} fill="#8884d8" />
                </ScatterChart>
             </ResponsiveContainer>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
