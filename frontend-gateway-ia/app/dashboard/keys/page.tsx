"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Copy, Key, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

export default function KeysPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Gateway Keys State
  const [showGatewayForm, setShowGatewayForm] = useState(false);
  const [gatewayKeyName, setGatewayKeyName] = useState("");
  const [gatewayRateLimit, setGatewayRateLimit] = useState("100");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  // Provider Keys State
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [providerName, setProviderName] = useState("openai");
  const [providerKey, setProviderKey] = useState("");

  // Fetch Gateway Keys
  const { data: gatewayKeys, isLoading: gatewayLoading } = useQuery({
    queryKey: ["gateway-keys"],
    queryFn: () => apiClient.keys.list(),
    enabled: isAuthenticated,
    staleTime: 30000, // 30 seconds
  });

  // Fetch Provider Keys
  const { data: providerKeys, isLoading: providerLoading } = useQuery({
    queryKey: ["provider-keys"],
    queryFn: () => apiClient.providerKeys.list(),
    enabled: isAuthenticated,
    staleTime: 30000, // 30 seconds
  });

  // Create Gateway Key Mutation
  const createGatewayKeyMutation = useMutation({
    mutationFn: async (data: { name?: string; rate_limit?: number }) =>
      await apiClient.keys.create(data.name, data.rate_limit),
    onSuccess: (data) => {
      setCreatedKey(data.key);
      toast({
        title: "Gateway Key Created",
        description: "Copy the key now - you won't be able to see it again!",
      });
      queryClient.invalidateQueries({ queryKey: ["gateway-keys"] });
      setGatewayKeyName("");
      setGatewayRateLimit("100");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create gateway key",
        variant: "destructive",
      });
    },
  });

  // Delete Gateway Key Mutation
  const deleteGatewayKeyMutation = useMutation({
    mutationFn: (keyId: string) => apiClient.keys.delete(keyId),
    onSuccess: () => {
      toast({
        title: "Key Deleted",
        description: "Gateway key has been deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["gateway-keys"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete gateway key",
        variant: "destructive",
      });
    },
  });

  // Create Provider Key Mutation
  const createProviderKeyMutation = useMutation({
    mutationFn: async (data: { provider: string; api_key: string }) =>
      await apiClient.providerKeys.add(data.provider, data.api_key),
    onSuccess: () => {
      toast({
        title: "Provider Key Added",
        description: "The key has been validated and stored securely",
      });
      queryClient.invalidateQueries({ queryKey: ["provider-keys"] });
      setProviderName("openai");
      setProviderKey("");
      setShowProviderForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to add provider key. Check if the key is valid.",
        variant: "destructive",
      });
    },
  });

  // Delete Provider Key Mutation
  const deleteProviderKeyMutation = useMutation({
    mutationFn: (keyId: string) => apiClient.providerKeys.delete(keyId),
    onSuccess: () => {
      toast({
        title: "Key Deleted",
        description: "Provider key has been deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["provider-keys"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete provider key",
        variant: "destructive",
      });
    },
  });

  const handleCreateGatewayKey = useCallback(() => {
    createGatewayKeyMutation.mutate({
      name: gatewayKeyName || undefined,
      rate_limit: parseInt(gatewayRateLimit) || 100,
    });
  }, [gatewayKeyName, gatewayRateLimit, createGatewayKeyMutation]);

  const handleCreateProviderKey = useCallback(() => {
    if (!providerKey.trim()) {
      toast({
        title: "Error",
        description: "API key is required",
        variant: "destructive",
      });
      return;
    }
    createProviderKeyMutation.mutate({
      provider: providerName,
      api_key: providerKey,
    });
  }, [providerName, providerKey, createProviderKeyMutation, toast]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Key copied to clipboard",
    });
  }, [toast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
        <p className="text-muted-foreground">
          Manage your gateway keys and provider API keys
        </p>
      </div>

      <Separator />

      {/* Gateway Keys Section */}
      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gateway Keys</CardTitle>
                <CardDescription>
                  Create and manage keys for accessing the Gateway API
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Create new key form */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <h3 className="font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Gateway Key
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="keyName">Key Name (optional)</Label>
                  <Input
                    id="keyName"
                    placeholder="e.g., Production Key"
                    value={gatewayKeyName}
                    onChange={(e) => setGatewayKeyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rateLimit">Rate Limit (req/min)</Label>
                  <Input
                    id="rateLimit"
                    type="number"
                    placeholder="100"
                    value={gatewayRateLimit}
                    onChange={(e) => setGatewayRateLimit(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={handleCreateGatewayKey} 
                disabled={createGatewayKeyMutation.isPending}
                className="w-full sm:w-auto"
              >
                {createGatewayKeyMutation.isPending ? "Creating..." : "Create Key"}
              </Button>
            </div>

            {/* Newly created key alert */}
            {createdKey && (
              <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50 dark:bg-green-950 space-y-2">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-semibold">
                  <CheckCircle className="h-5 w-5" />
                  Key Created Successfully!
                </div>
                <p className="text-sm text-muted-foreground">
                  Make sure to copy your key now. You won't be able to see it again!
                </p>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-3 rounded border">
                  <code className="flex-1 text-sm font-mono break-all">
                    {createdKey}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(createdKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCreatedKey(null)}
                >
                  I've saved my key
                </Button>
              </div>
            )}

            {/* Keys list */}
            <div className="space-y-2">
              <h3 className="font-semibold">Your Keys</h3>
              {gatewayLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded bg-muted" />
                  ))}
                </div>
              ) : gatewayKeys && gatewayKeys.length > 0 ? (
                <div className="space-y-2">
                  {gatewayKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                    >
                      <div className="flex items-center gap-4">
                        <Key className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {key.name || "Unnamed Key"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <code className="bg-muted px-2 py-1 rounded">
                              {key.prefix}•••••
                            </code>
                            {" • "}
                            {key.rate_limit || 100} req/min
                            {key.last_used_at && (
                              <span> • Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Created: {new Date(key.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {key.is_active ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 text-sm">
                            <XCircle className="h-4 w-4" />
                            Inactive
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteGatewayKeyMutation.mutate(key.id)}
                          disabled={deleteGatewayKeyMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No keys yet. Create your first one!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Provider Keys Section */}
      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Provider API Keys</CardTitle>
                <CardDescription>
                  Add your OpenAI, Anthropic, and Google AI API keys
                </CardDescription>
              </div>
              {!showProviderForm && (
                <Button onClick={() => setShowProviderForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Provider Key
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add provider key form */}
            {showProviderForm && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateProviderKey();
                }}
                className="border rounded-lg p-4 space-y-4 bg-muted/50"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Provider API Key
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() => setShowProviderForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider</Label>
                    <select
                      id="provider"
                      className="w-full p-2 border rounded-md bg-background"
                      value={providerName}
                      onChange={(e) => setProviderName(e.target.value)}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google AI</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="providerKey">API Key</Label>
                    <Input
                      id="providerKey"
                      type="password"
                      placeholder="sk-..."
                      value={providerKey}
                      onChange={(e) => setProviderKey(e.target.value)}
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your key will be encrypted and validated
                    </p>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={createProviderKeyMutation.isPending || !providerKey}
                >
                  {createProviderKeyMutation.isPending ? "Validating & Adding..." : "Add Key"}
                </Button>
              </form>
            )}

            {/* Provider keys list */}
            <div className="space-y-2">
              <h3 className="font-semibold">Configured Providers</h3>
              {providerLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded bg-muted" />
                  ))}
                </div>
              ) : providerKeys && providerKeys.length > 0 ? (
                <div className="space-y-2">
                  {providerKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-semibold text-primary">
                            {key.provider.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium capitalize">{key.provider}</div>
                          <div className="text-xs text-muted-foreground">
                            Added: {new Date(key.created_at).toLocaleDateString()}
                            {key.last_verified_at && (
                              <span> • Verified: {new Date(key.last_verified_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {key.is_active ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            Valid
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            Needs Verification
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteProviderKeyMutation.mutate(key.id)}
                          disabled={deleteProviderKeyMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No provider keys configured. Add one to get started!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
