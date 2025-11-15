/**
 * Kill List Manager
 *
 * Manages the kill list for burned/blocked affiliate links.
 * Provides functionality to:
 * - Kill links (mark as burned)
 * - Restore killed links
 * - Track kill history
 * - Sync with GitHub repository
 */

import { config, type KillListItem, type LinkHistoryItem } from "./config";

const KILL_LIST_STORAGE_KEY = config.killSwitch.storageKey;

/**
 * Get all killed links from local storage
 */
export function getKillList(): KillListItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(KILL_LIST_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error reading kill list:", error);
    return [];
  }
}

/**
 * Save kill list to local storage
 */
export function saveKillList(killList: KillListItem[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(KILL_LIST_STORAGE_KEY, JSON.stringify(killList));
  } catch (error) {
    console.error("Error saving kill list:", error);
  }
}

/**
 * Extract slug from white page URL
 * Examples:
 * - https://example.com/apple-123-abc -> apple-123-abc
 * - https://example.com/cashapp-456-xyz/ -> cashapp-456-xyz
 */
export function extractSlugFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const slug = pathname.replace(/^\//, "").replace(/\/$/, "");
    return slug || "";
  } catch (error) {
    console.error("Error extracting slug:", error);
    return "";
  }
}

/**
 * Kill a link by its slug
 */
export function killLink(
  linkHistoryItem: LinkHistoryItem,
  reason?: string
): KillListItem {
  const killList = getKillList();
  const slug = extractSlugFromUrl(linkHistoryItem.whitePageUrl);
  const domain = new URL(linkHistoryItem.whitePageUrl).hostname;

  const killedItem: KillListItem = {
    slug,
    domain,
    killedAt: new Date().toISOString(),
    reason,
    canRestore: true,
    originalLink: linkHistoryItem,
  };

  // Check if already killed
  const existingIndex = killList.findIndex((item) => item.slug === slug);
  if (existingIndex >= 0) {
    killList[existingIndex] = killedItem;
  } else {
    killList.push(killedItem);
  }

  saveKillList(killList);
  return killedItem;
}

/**
 * Restore a killed link
 */
export function restoreLink(slug: string): boolean {
  const killList = getKillList();
  const index = killList.findIndex((item) => item.slug === slug);

  if (index === -1) {
    return false;
  }

  killList.splice(index, 1);
  saveKillList(killList);
  return true;
}

/**
 * Check if a link is killed
 */
export function isLinkKilled(whitePageUrl: string): boolean {
  const killList = getKillList();
  const slug = extractSlugFromUrl(whitePageUrl);
  return killList.some((item) => item.slug === slug);
}

/**
 * Get a killed link by slug
 */
export function getKilledLink(slug: string): KillListItem | null {
  const killList = getKillList();
  return killList.find((item) => item.slug === slug) || null;
}

/**
 * Bulk kill multiple links
 */
export function bulkKillLinks(
  linkHistoryItems: LinkHistoryItem[],
  reason?: string
): KillListItem[] {
  return linkHistoryItems.map((item) => killLink(item, reason));
}

/**
 * Clear entire kill list (dangerous operation)
 */
export function clearKillList(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KILL_LIST_STORAGE_KEY);
}

/**
 * Get kill list statistics
 */
export function getKillListStats(): {
  total: number;
  last24Hours: number;
  last7Days: number;
  byDomain: Record<string, number>;
} {
  const killList = getKillList();
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const stats = {
    total: killList.length,
    last24Hours: 0,
    last7Days: 0,
    byDomain: {} as Record<string, number>,
  };

  killList.forEach((item) => {
    const killedTime = new Date(item.killedAt).getTime();

    if (killedTime >= oneDayAgo) {
      stats.last24Hours++;
    }
    if (killedTime >= sevenDaysAgo) {
      stats.last7Days++;
    }

    stats.byDomain[item.domain] = (stats.byDomain[item.domain] || 0) + 1;
  });

  return stats;
}

/**
 * Export kill list as JSON for GitHub commit
 */
export function exportKillListForGitHub(): string {
  const killList = getKillList();
  return JSON.stringify(
    {
      lastUpdated: new Date().toISOString(),
      totalKilled: killList.length,
      items: killList.map((item) => ({
        slug: item.slug,
        domain: item.domain,
        killedAt: item.killedAt,
        reason: item.reason,
      })),
    },
    null,
    2
  );
}
