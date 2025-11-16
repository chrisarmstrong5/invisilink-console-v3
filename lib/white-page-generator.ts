/**
 * White Page Generation System
 *
 * Orchestrates the complete white page generation workflow:
 * 1. Select random template
 * 2. Build bot detection script
 * 3. Inject script into template
 * 4. Generate unique slug
 * 5. Commit to GitHub
 * 6. Update domain usage
 */

import { config } from "./config";
import {
  buildHeadScript,
  buildHeadScript_ParamsOnly,
  injectHeadScript,
  buildCompleteHeadScript,
} from "./bot-detection";
import { buildGeoTargetingScript } from "./geo-targeting";

export interface WhitePageGenerationOptions {
  offerKey: string;
  source: string;
  trackingUrl: string;
  filterType?: "params-only" | "advanced";
  // V2 Features
  customUrl?: string;
  disableCloaking?: boolean;
  geoTargeting?: {
    enabled: boolean;
    targetCountries: string[];
  };
  tiktok?: {
    pixelEnabled: boolean;
    pixelId: string;
    browserRedirectEnabled: boolean;
    strictBotDetectionEnabled: boolean;
  };
}

export interface WhitePageGenerationResult {
  slug: string;
  whitePageHtml: string;
  templateName: string;
  commitUrl?: string;
}

/**
 * Select random white page template from config
 */
export function selectRandomTemplate() {
  const templates = config.whitePageTemplates;
  if (!templates || templates.length === 0) {
    throw new Error("No white page templates available");
  }
  const index = Math.floor(Math.random() * templates.length);
  return templates[index];
}

/**
 * Generate unique slug: {offer}-{source}-{timestamp}{random}
 *
 * Examples:
 * - apple-1639-5ognhpzqo
 * - cashapp-3175-6xbldmnlk
 * - freecash-ads-3177-9qfzv2pcb
 */
export function generateSlug(offerKey: string, source: string): string {
  // Slugify: lowercase, replace non-alphanumeric with dash
  const slugify = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  // Base36 timestamp (6 chars) + random (3 chars)
  const timestamp = Date.now().toString(36).slice(-6);
  const random = Math.random().toString(36).slice(-3);

  return `${slugify(offerKey)}-${source}-${timestamp}${random}`;
}

/**
 * Build tracking URL with TikTok macros and link metadata
 *
 * Format: https://rgbad.ttrk.io/{campaignId}?s={source}&sub1={sparkCode}&sub2-8={TikTokMacros}&sub9={linkSlug}&sub10={offer}&sub11={account}&sub20={source}
 */
export function buildTrackingUrl(
  offerKey: string,
  source: string,
  sparkCodeId?: string,
  linkSlug?: string
): string {
  const campaignId = config.tracker.redtrack.campaigns[offerKey as keyof typeof config.tracker.redtrack.campaigns];
  if (!campaignId) {
    throw new Error(`No RedTrack campaign configured for offer: ${offerKey}`);
  }

  const offerCode = config.offerCodes[offerKey as keyof typeof config.offerCodes];
  const sourceParam = `${source}${offerCode}`.toLowerCase().replace(/[^a-z0-9]/gi, "");

  let url = `https://${config.tracker.redtrack.domain}/${campaignId}?s=${sourceParam}`;

  // Add spark code if provided (sub1)
  if (sparkCodeId) {
    url += `&sub1=${sparkCodeId}`;
  }

  // Add TikTok macros (sub2-sub8)
  url += "&sub2=__CAMPAIGN_ID__&sub3=__AD_ID__&sub4=__CID__&sub5=__PLACEMENT__&sub6=__CAMPAIGN_NAME__&sub7=__AD_NAME__&sub8=__CID_NAME__";

  // Add link metadata for perfect RedTrack sync (sub9-sub11, sub20)
  if (linkSlug) {
    url += `&sub9=${linkSlug}`;  // Link ID for link-level tracking
  }
  url += `&sub10=${offerKey}`;     // Offer key (apple, cashapp, etc.)
  url += `&sub11=${source}`;       // Account number (1639, 3175, etc.)
  url += `&sub20=${sourceParam}`;  // Source parameter (for dashboard compatibility)

  return url;
}

/**
 * Fetch template HTML from public directory
 */
export async function fetchTemplate(templatePath: string): Promise<string> {
  // Read file from filesystem (server-side only)
  const fs = require("fs/promises");
  const path = require("path");

  // Template paths in config start with /white-pages/...
  // which maps to public/white-pages/...
  const fullPath = path.join(process.cwd(), "public", templatePath);

  try {
    const html = await fs.readFile(fullPath, "utf-8");
    return html;
  } catch (error) {
    throw new Error(`Failed to read template: ${templatePath} (${error instanceof Error ? error.message : "unknown error"})`);
  }
}

/**
 * Generate complete white page (orchestrates full workflow)
 *
 * Steps:
 * 1. Generate unique slug
 * 2. Select random template
 * 3. Fetch template HTML
 * 4. Build bot detection script with all features
 * 5. Build geo-targeting script (if enabled)
 * 6. Inject scripts into template
 * 7. Return white page HTML + metadata
 */
export async function generateWhitePage(
  options: WhitePageGenerationOptions
): Promise<WhitePageGenerationResult> {
  const {
    offerKey,
    source,
    trackingUrl,
    filterType = "params-only",
    customUrl,
    disableCloaking,
    geoTargeting,
    tiktok,
  } = options;

  // 1. Generate slug
  const slug = generateSlug(offerKey, source);

  // 2. Select random template
  const template = selectRandomTemplate();

  // 3. Fetch template HTML
  const templateHtml = await fetchTemplate(template.path);

  // 4. Build complete head script with all features (bot detection + TikTok)
  const finalTrackingUrl = customUrl || trackingUrl;

  const headScript = buildCompleteHeadScript({
    primaryUrl: finalTrackingUrl,
    fallbackUrl: finalTrackingUrl,
    placementParam: config.headScriptDefaults.placementParam,
    botPlacementValue: config.headScriptDefaults.botPlacementValue,
    delayMs: config.headScriptDefaults.delayMs,
    filterType,
    disableCloaking,
    tiktok,
  });

  // 5. Build geo-targeting script (if enabled)
  let geoScript = "";
  if (geoTargeting?.enabled && geoTargeting.targetCountries.length > 0) {
    // For geo-targeting, we redirect blocked countries to the white page itself
    // and allowed countries to the tracking URL
    const whitePageUrl = `${config.whitePageProject.deploymentDomain}/${slug}`;
    geoScript = buildGeoTargetingScript({
      enabled: true,
      targetCountries: geoTargeting.targetCountries,
      redirectUrl: whitePageUrl, // Block by staying on white page
      primaryUrl: finalTrackingUrl, // Allow by redirecting to offer
    });
  }

  // 6. Combine scripts and inject into template
  const combinedScripts = [geoScript, headScript].filter((s) => s).join("\n");
  const whitePageHtml = injectHeadScript(templateHtml, combinedScripts);

  return {
    slug,
    whitePageHtml,
    templateName: template.name,
  };
}

/**
 * Commit white page to GitHub
 */
export async function commitWhitePage(slug: string, html: string): Promise<string | undefined> {
  const response = await fetch("/api/github/commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: `${config.whitePageProject.repoPath}/${slug}.html`,
      content: html,
      message: `Add white page ${slug}`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "GitHub commit failed");
  }

  const data = await response.json();
  return data.commitUrl;
}

/**
 * Load domain usage from localStorage
 */
export function loadDomainUsage(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("domain-usage") || "{}");
  } catch {
    return {};
  }
}

/**
 * Save domain usage to localStorage and commit to GitHub
 */
export async function saveDomainUsage(domainId: string): Promise<void> {
  if (typeof window === "undefined") return;

  // Update localStorage
  const usage = loadDomainUsage();
  usage[domainId] = (usage[domainId] || 0) + 1;
  localStorage.setItem("domain-usage", JSON.stringify(usage));

  // Commit to GitHub
  const content = JSON.stringify(usage, null, 2) + "\n";
  await fetch("/api/github/commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "public/link-generator/domain-usage.json",
      content,
      message: `Update domain usage (${domainId})`,
    }),
  });
}
