"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Filter, 
  DollarSign, 
  Cpu, 
  MessageSquare, 
  TrendingUp,
  CheckCircle
} from "lucide-react";
import { apiClient, Model } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

export default function ModelsPage() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "context">("name");

  // Fetch all models
  const { data: allModels, isLoading } = useQuery({
    queryKey: ["models"],
    queryFn: () => apiClient.models.list(),
    enabled: isAuthenticated,
  });

  // Filter and sort models
  const filteredModels = allModels
    ? allModels
        .filter((model) => {
          const matchesSearch = 
            model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.description?.toLowerCase().includes(searchQuery.toLowerCase());
          
          const matchesProvider = !selectedProvider || model.provider === selectedProvider;
          
          return matchesSearch && matchesProvider && model.is_active;
        })
        .sort((a, b) => {
          switch (sortBy) {
            case "name":
              return a.name.localeCompare(b.name);
            case "price":
              return (a.cost_per_1k_input + a.cost_per_1k_output) - 
                     (b.cost_per_1k_input + b.cost_per_1k_output);
            case "context":
              return b.context_window - a.context_window;
            default:
              return 0;
          }
        })
    : [];

  // Get unique providers
  const providers = allModels
    ? Array.from(new Set(allModels.map((m) => m.provider)))
    : [];

  // Calculate cost for different token amounts
  const calculateCost = (model: Model, inputTokens: number, outputTokens: number) => {
    return (
      (model.cost_per_1k_input * inputTokens) / 1000 +
      (model.cost_per_1k_output * outputTokens) / 1000
    ).toFixed(6);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Models Catalog</h1>
        <p className="text-muted-foreground">
          Browse and compare available LLM models
        </p>
      </div>

      <Separator />

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search Models</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Provider Filter */}
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <select
                id="provider"
                className="w-full p-2 border rounded-md bg-background"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
              >
                <option value="">All Providers</option>
                {providers.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider.charAt(0).toUpperCase() + provider.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label htmlFor="sortBy">Sort By</Label>
              <select
                id="sortBy"
                className="w-full p-2 border rounded-md bg-background"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="name">Name</option>
                <option value="price">Price (Low to High)</option>
                <option value="context">Context Window (High to Low)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {filteredModels.length} model{filteredModels.length !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* Models Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-64 animate-pulse">
              <div className="h-full bg-muted rounded-lg" />
            </Card>
          ))}
        </div>
      ) : filteredModels.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredModels.map((model) => (
            <Card key={model.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {model.id}
                    </CardDescription>
                  </div>
                  <span className="ml-2 px-2 py-1 text-xs font-medium border rounded-md bg-background">
                    {model.provider}
                  </span>
                </div>
                {model.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {model.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Context Window */}
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Context:</span>
                  <span className="font-medium">
                    {model.context_window.toLocaleString()} tokens
                  </span>
                </div>

                {/* Pricing */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">Pricing (per 1K tokens)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted p-2 rounded">
                      <div className="text-muted-foreground">Input</div>
                      <div className="font-medium">
                        ${model.cost_per_1k_input.toFixed(4)}
                      </div>
                    </div>
                    <div className="bg-muted p-2 rounded">
                      <div className="text-muted-foreground">Output</div>
                      <div className="font-medium">
                        ${model.cost_per_1k_output.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Example Costs */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="text-xs font-semibold">Example Costs:</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">10K in + 1K out:</span>
                      <span className="font-medium">${calculateCost(model, 10000, 1000)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">50K in + 5K out:</span>
                      <span className="font-medium">${calculateCost(model, 50000, 5000)}</span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                {model.is_active && (
                  <div className="flex items-center gap-1 text-xs text-green-600 pt-2">
                    <CheckCircle className="h-3 w-3" />
                    <span>Available</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground">
              No models found matching your filters
            </div>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => {
                setSearchQuery("");
                setSelectedProvider("");
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Pricing Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            • Costs are shown per 1,000 tokens (approximately 750 words)
          </p>
          <p>
            • Input tokens = your prompt/context, Output tokens = model response
          </p>
          <p>
            • Actual costs may vary slightly based on provider pricing changes
          </p>
          <p>
            • Use the Gateway to automatically route to the best model for your use case
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
