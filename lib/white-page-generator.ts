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
import { buildHeadScript, buildHeadScript_ParamsOnly, injectHeadScript } from "./bot-detection";

export interface WhitePageGenerationOptions {
  offerKey: string;
  source: string;
  trackingUrl: string;
  filterType?: "params-only" | "advanced";
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
 * Build tracking URL with TikTok macros
 *
 * Format: https://rgbad.ttrk.io/{campaignId}?s={source}&sub2=__CAMPAIGN_ID__&sub3=__AD_ID__...
 */
export function buildTrackingUrl(offerKey: string, source: string, sparkCodeId?: string): string {
  const campaignId = config.tracker.redtrack.campaigns[offerKey as keyof typeof config.tracker.redtrack.campaigns];
  if (!campaignId) {
    throw new Error(`No RedTrack campaign configured for offer: ${offerKey}`);
  }

  const offerCode = config.offerCodes[offerKey as keyof typeof config.offerCodes];
  const sourceParam = `${source}${offerCode}`.toLowerCase().replace(/[^a-z0-9]/gi, "");

  let url = `https://${config.tracker.redtrack.domain}/${campaignId}?s=${sourceParam}`;

  // Add spark code if provided
  if (sparkCodeId) {
    url += `&sub1=${sparkCodeId}`;
  }

  // Add TikTok macros (sub2-sub8)
  url += "&sub2=__CAMPAIGN_ID__&sub3=__AD_ID__&sub4=__CID__&sub5=__PLACEMENT__&sub6=__CAMPAIGN_NAME__&sub7=__AD_NAME__&sub8=__CID_NAME__";

  return url;
}

/**
 * Fetch template HTML from public directory
 */
export async function fetchTemplate(templatePath: string): Promise<string> {
  const response = await fetch(templatePath + `?v=${Date.now()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch template: ${templatePath}`);
  }
  return await response.text();
}

/**
 * Generate complete white page (orchestrates full workflow)
 *
 * Steps:
 * 1. Generate unique slug
 * 2. Select random template
 * 3. Fetch template HTML
 * 4. Build bot detection script
 * 5. Inject script into template
 * 6. Return white page HTML + metadata
 */
export async function generateWhitePage(
  options: WhitePageGenerationOptions
): Promise<WhitePageGenerationResult> {
  const { offerKey, source, trackingUrl, filterType = "params-only" } = options;

  // 1. Generate slug
  const slug = generateSlug(offerKey, source);

  // 2. Select random template
  const template = selectRandomTemplate();

  // 3. Fetch template HTML
  const templateHtml = await fetchTemplate(template.path);

  // 4. Build bot detection script
  const scriptBuilder = filterType === "params-only" ? buildHeadScript_ParamsOnly : buildHeadScript;
  const botScript = scriptBuilder({
    primaryUrl: trackingUrl,
    fallbackUrl: trackingUrl,
    placementParam: config.headScriptDefaults.placementParam,
    botPlacementValue: config.headScriptDefaults.botPlacementValue,
    delayMs: config.headScriptDefaults.delayMs,
  });

  // 5. Inject script into template
  const whitePageHtml = injectHeadScript(templateHtml, botScript);

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
