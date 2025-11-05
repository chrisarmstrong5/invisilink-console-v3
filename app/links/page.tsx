"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SparkCodeManager } from "@/components/spark-code-manager";
import { toast } from "sonner";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { config, type SparkCode, type LinkHistoryItem } from "@/lib/config";
import {
  buildTrackingUrl,
  generateWhitePage,
  commitWhitePage,
  saveDomainUsage,
} from "@/lib/white-page-generator";
import {
  Copy,
  Plus,
  Sparkles,
  Link2,
  Activity,
  ChevronDown,
  ChevronUp,
  Trash2,
  ExternalLink,
  Check,
  Loader2,
} from "lucide-react";

export default function LinkGenerator() {
  // Form State
  const [selectedOffer, setSelectedOffer] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [selectedDomain, setSelectedDomain] = useState<string>(
    config.defaultCloakDomain
  );
  const [botFiltering, setBotFiltering] = useState<"params" | "advanced">(
    "params"
  );
  const [selectedSparkCode, setSelectedSparkCode] = useState<string>("");
  const [platform, setPlatform] = useState<"tiktok" | "facebook">("tiktok");

  // Options
  const [randomizeStorefront, setRandomizeStorefront] = useState(true);
  const [tiktokHeadScript, setTiktokHeadScript] = useState(true);

  // UI State
  const [showHistory, setShowHistory] = useState(false);
  const [showSparkManager, setShowSparkManager] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>("");

  // Generated Results
  const [trackingUrl, setTrackingUrl] = useState<string>("");
  const [whitePageUrl, setWhitePageUrl] = useState<string>("");
  const [campaignName, setCampaignName] = useState<string>("");
  const [lastSlug, setLastSlug] = useState<string>("");
  const [commitUrl, setCommitUrl] = useState<string>("");
  const [testUrlLive, setTestUrlLive] = useState<string>("");
  const [testUrlBot, setTestUrlBot] = useState<string>("");

  // LocalStorage
  const [sparkCodes, setSparkCodes] = useLocalStorage<SparkCode[]>(
    "spark-codes",
    []
  );
  const [linkHistory, setLinkHistory] = useLocalStorage<LinkHistoryItem[]>(
    "link-history",
    []
  );

  // Domain rotation logic
  const domainUsage = useMemo(() => {
    const usage: Record<string, number> = {};
    config.cloakDomains.forEach((d) => {
      usage[d.id] = linkHistory.filter((l) => l.domain === d.id).length;
    });
    return usage;
  }, [linkHistory]);

  const lightestDomain = useMemo(() => {
    return config.cloakDomains.reduce((lightest, domain) => {
      return (domainUsage[domain.id] || 0) < (domainUsage[lightest.id] || 0)
        ? domain
        : lightest;
    }, config.cloakDomains[0]);
  }, [domainUsage]);

  // Utility Functions
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const generateLink = async () => {
    // Validation
    if (!selectedOffer) {
      toast.error("Please select an offer");
      return;
    }
    // FIXED: Allow alphanumeric account numbers
    if (!accountNumber || !/^[a-zA-Z0-9_-]+$/.test(accountNumber)) {
      toast.error("Please enter a valid account number (alphanumeric)");
      return;
    }

    setIsGenerating(true);
    setGenerationStatus("Preparing files...");

    try {
      // 1. Build tracking URL
      const sparkCodeId = selectedSparkCode === "none" ? undefined : selectedSparkCode;
      const trackingUrl = buildTrackingUrl(selectedOffer, accountNumber, sparkCodeId);

      setGenerationStatus("Selecting template...");

      // 2. Generate white page (selects template, builds bot script, injects)
      const { slug, whitePageHtml, templateName } = await generateWhitePage({
        offerKey: selectedOffer,
        source: accountNumber,
        trackingUrl,
        filterType: botFiltering === "params" ? "params-only" : "advanced",
      });

      setGenerationStatus("Committing to GitHub...");

      // 3. Commit white page to GitHub
      const commitUrl = await commitWhitePage(slug, whitePageHtml);

      setGenerationStatus("Updating domain usage...");

      // 4. Save domain usage
      await saveDomainUsage(selectedDomain);

      // 5. Build URLs
      const domain = config.cloakDomains.find((d) => d.id === selectedDomain);
      const baseCloakUrl = `${domain?.url}/${slug}`;
      const whitePageUrl = `${config.whitePageProject.deploymentDomain}/${slug}`;

      // Submission URL (with ppc=__PLACEMENT__ for bot detection)
      const submissionUrl = `${baseCloakUrl}?${config.headScriptDefaults.placementParam}=${config.headScriptDefaults.botPlacementValue}`;

      // Test URLs
      const testLive = `${baseCloakUrl}?${config.headScriptDefaults.placementParam}=NEWS_FEED&ttclid=TEST12345`;
      const testBot = `${baseCloakUrl}?${config.headScriptDefaults.placementParam}=${config.headScriptDefaults.botPlacementValue}`;

      // Campaign name
      const sparkCodeName = sparkCodeId
        ? sparkCodes.find((sc) => sc.id === sparkCodeId)?.name || sparkCodeId
        : "no-spark";
      const offerName = config.offers[selectedOffer as keyof typeof config.offers]?.name || selectedOffer;
      const campaignName = `${offerName.replace(/\s+/g, "")}-${accountNumber}-${sparkCodeName}-${platform}`;

      // Set results
      setTrackingUrl(trackingUrl);
      setWhitePageUrl(submissionUrl);
      setCampaignName(campaignName);
      setLastSlug(slug);
      setCommitUrl(commitUrl || "");
      setTestUrlLive(testLive);
      setTestUrlBot(testBot);

      // Save to history
      const historyItem: LinkHistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        offer: offerName,
        account: accountNumber,
        sparkCode: sparkCodeId,
        domain: selectedDomain,
        trackingUrl,
        whitePageUrl: submissionUrl,
        campaignName,
      };

      setLinkHistory([historyItem, ...linkHistory.slice(0, 29)]);

      setGenerationStatus("Complete!");
      toast.success("Links generated successfully - white page deployed!");
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate links");
      setGenerationStatus("Error");
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationStatus(""), 2000);
    }
  };

  const clearHistory = () => {
    setLinkHistory([]);
    toast.success("History cleared");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Container */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-baseline gap-3 mb-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              InvisiLink Console
            </h1>
            <span className="text-sm font-medium text-purple-400 bg-purple-500/10 px-2 py-1 rounded-md">
              v3.0
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            Coded tracking system with TikTok Spark integration
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Left Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card border p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-6">
                <Link2 className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-semibold">Campaign Setup</h2>
              </div>

              <div className="space-y-5">
                {/* Offer */}
                <div>
                  <Label className="text-xs font-medium mb-2 block text-slate-300">
                    Offer
                  </Label>
                  <Select value={selectedOffer} onValueChange={setSelectedOffer}>
                    <SelectTrigger className="bg-input border h-10 hover:border-ring/50 transition-colors text-sm">
                      <SelectValue placeholder="Select an offer..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border">
                      {Object.entries(config.offers).map(([key, value]) => (
                        <SelectItem key={key} value={key} className="text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs font-mono">
                              {value.code}
                            </Badge>
                            <span>{value.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Account Number */}
                <div>
                  <Label className="text-xs font-medium mb-2 block text-slate-300">
                    Account Number
                  </Label>
                  <Input
                    type="text"
                    placeholder="e.g., 1639"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="bg-input border h-10 hover:border-ring/50 transition-colors text-sm"
                  />
                </div>

                {/* Domain */}
                <div>
                  <Label className="text-xs font-medium mb-2 block text-slate-300">
                    Cloak Domain
                  </Label>
                  <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                    <SelectTrigger className="bg-input border h-10 hover:border-ring/50 transition-colors text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border">
                      {config.cloakDomains.map((domain) => (
                        <SelectItem key={domain.id} value={domain.id} className="text-sm">
                          <div className="flex items-center justify-between w-full gap-3">
                            <span>{domain.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {domainUsage[domain.id] || 0}
                              </Badge>
                              {domain.id === lightestDomain.id && (
                                <Badge className="text-xs bg-green-500/10 text-green-400 border-green-500/20">
                                  Lightest
                                </Badge>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  {/* Bot Filtering */}
                  <div>
                    <Label className="text-xs font-medium mb-2.5 block text-slate-300">
                      Bot Filtering
                    </Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="radio"
                            name="botFiltering"
                            value="params"
                            checked={botFiltering === "params"}
                            onChange={() => setBotFiltering("params")}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
                            botFiltering === "params"
                              ? "border-blue-500 bg-blue-500"
                              : "border-[#3A3D45] group-hover:border-[#4A4D55]"
                          }`}>
                            {botFiltering === "params" && (
                              <Check className="w-3 h-3 text-white absolute inset-0.5" />
                            )}
                          </div>
                        </div>
                        <span className="text-sm">Parameters Only</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="radio"
                            name="botFiltering"
                            value="advanced"
                            checked={botFiltering === "advanced"}
                            onChange={() => setBotFiltering("advanced")}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
                            botFiltering === "advanced"
                              ? "border-blue-500 bg-blue-500"
                              : "border-[#3A3D45] group-hover:border-[#4A4D55]"
                          }`}>
                            {botFiltering === "advanced" && (
                              <Check className="w-3 h-3 text-white absolute inset-0.5" />
                            )}
                          </div>
                        </div>
                        <span className="text-sm">Advanced</span>
                      </label>
                    </div>
                  </div>

                  {/* Platform */}
                  <div>
                    <Label className="text-xs font-medium mb-2.5 block text-slate-300">
                      Platform
                    </Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="radio"
                            name="platform"
                            value="tiktok"
                            checked={platform === "tiktok"}
                            onChange={() => setPlatform("tiktok")}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
                            platform === "tiktok"
                              ? "border-blue-500 bg-blue-500"
                              : "border-[#3A3D45] group-hover:border-[#4A4D55]"
                          }`}>
                            {platform === "tiktok" && (
                              <Check className="w-3 h-3 text-white absolute inset-0.5" />
                            )}
                          </div>
                        </div>
                        <span className="text-sm">TikTok</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="radio"
                            name="platform"
                            value="facebook"
                            checked={platform === "facebook"}
                            onChange={() => setPlatform("facebook")}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
                            platform === "facebook"
                              ? "border-blue-500 bg-blue-500"
                              : "border-[#3A3D45] group-hover:border-[#4A4D55]"
                          }`}>
                            {platform === "facebook" && (
                              <Check className="w-3 h-3 text-white absolute inset-0.5" />
                            )}
                          </div>
                        </div>
                        <span className="text-sm">Facebook</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Spark Code */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-medium text-slate-300">
                      Spark Code (Optional)
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSparkManager(true)}
                      className="h-7 text-xs border hover:bg-accent"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Manage
                    </Button>
                  </div>
                  <Select
                    value={selectedSparkCode || "none"}
                    onValueChange={(val) => setSelectedSparkCode(val === "none" ? "" : val)}
                  >
                    <SelectTrigger className="bg-input border h-10 hover:border-ring/50 transition-colors text-sm">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border">
                      <SelectItem value="none" className="text-sm">None</SelectItem>
                      {sparkCodes.map((sc) => (
                        <SelectItem key={sc.id} value={sc.id} className="text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs font-mono">
                              {sc.id}
                            </Badge>
                            <span>{sc.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Options */}
                <div className="pt-4 border-t border-[#2A2D35]">
                  <Label className="text-xs font-medium mb-3 block text-slate-300">
                    Options
                  </Label>
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={randomizeStorefront}
                        onChange={(e) => setRandomizeStorefront(e.target.checked)}
                        className="w-4 h-4 rounded border-input bg-background checked:bg-blue-500 checked:border-blue-500 transition-colors"
                      />
                      <span className="text-sm">Randomized Storefront</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={tiktokHeadScript}
                        onChange={(e) => setTiktokHeadScript(e.target.checked)}
                        className="w-4 h-4 rounded border-input bg-background checked:bg-blue-500 checked:border-blue-500 transition-colors"
                      />
                      <span className="text-sm">TikTok Head Script</span>
                    </label>
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={generateLink}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-10 font-medium transition-colors shadow-lg shadow-blue-600/20"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Links
                </Button>
              </div>
            </Card>

            {/* Results */}
            {trackingUrl && (
              <Card className="bg-card border p-6 shadow-sm">
                <h3 className="text-sm font-semibold mb-4 text-slate-300">
                  Generated Links
                </h3>
                <div className="space-y-3.5">
                  {[
                    { label: "Tracking URL", value: trackingUrl },
                    { label: "White Page URL", value: whitePageUrl },
                    { label: "Campaign Name", value: campaignName },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <Label className="text-xs font-medium mb-1.5 block text-slate-400">
                        {label}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={value}
                          readOnly
                          className="bg-popover border h-9 text-xs font-mono"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(value, label)}
                          className="h-9 px-3 border hover:bg-accent"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Panel */}
          <div>
            <Card className="bg-card border p-6 shadow-sm sticky top-6">
              <div className="flex items-center gap-2.5 mb-6">
                <Activity className="w-5 h-5 text-green-400" />
                <h2 className="text-base font-semibold">Live Stats</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-1">Tracker</p>
                  <p className="text-sm font-mono text-blue-400">
                    {config.tracker.redtrack.domain}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400 mb-1">
                    White Page Pool
                  </p>
                  <p className="text-sm">
                    {config.cloakDomains.length} domains active
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400 mb-1">
                    Lightest Domain
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{lightestDomain.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {domainUsage[lightestDomain.id] || 0}
                    </Badge>
                  </div>
                </div>

                {lastSlug && (
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-1">
                      Last Slug
                    </p>
                    <p className="text-sm font-mono text-green-400">{lastSlug}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-[#2A2D35] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Spark Codes</span>
                    <Badge variant="outline" className="text-xs">
                      {sparkCodes.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Link History</span>
                    <Badge variant="outline" className="text-xs">
                      {linkHistory.length}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Link History */}
        <Card className="bg-card border p-6 shadow-sm">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowHistory(!showHistory)}
          >
            <h3 className="text-sm font-semibold">
              Link History ({linkHistory.length})
            </h3>
            <div className="flex items-center gap-2">
              {linkHistory.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearHistory();
                  }}
                  className="h-7 text-xs border hover:bg-accent"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              )}
              {showHistory ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>

          {showHistory && linkHistory.length > 0 && (
            <div className="mt-4 space-y-2">
              {linkHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-secondary border rounded-lg p-3.5 hover:border-ring/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="outline" className="text-xs">
                          {item.offer}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          Account: {item.account}
                        </span>
                        {item.sparkCode && (
                          <Badge className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/20">
                            {item.sparkCode}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(item.trackingUrl, "Tracking URL")
                        }
                        className="h-7 px-2 border-[#2A2D35] hover:bg-[#16181D]"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(item.whitePageUrl, "_blank")}
                        className="h-7 px-2 border-[#2A2D35] hover:bg-[#16181D]"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showHistory && linkHistory.length === 0 && (
            <p className="text-sm text-slate-400 text-center mt-4">
              No links generated yet
            </p>
          )}
        </Card>
      </div>

      {/* Spark Code Manager Dialog */}
      <SparkCodeManager
        open={showSparkManager}
        onOpenChange={setShowSparkManager}
        sparkCodes={sparkCodes}
        onSparkCodesChange={setSparkCodes}
      />
    </div>
  );
}
