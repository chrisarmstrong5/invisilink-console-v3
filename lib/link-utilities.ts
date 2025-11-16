/**
 * Client-Safe Link Generation Utilities
 *
 * These functions can be safely imported in client components
 * as they don't use Node.js modules (fs, path, etc.)
 */

import { config } from "./config";

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
