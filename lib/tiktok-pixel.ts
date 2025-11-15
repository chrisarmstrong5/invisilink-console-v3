/**
 * TikTok Pixel Utility
 *
 * Generates TikTok Pixel tracking scripts and browser redirect scripts.
 * Ported from v2's head-snippet.js
 *
 * Features:
 * - TikTok Pixel PageView and ClickButton events
 * - Browser redirect (force TikTok webview to open in browser)
 * - Strict bot detection for ByteDance/TikTok crawlers
 */

import { config } from "./config";

export interface TikTokPixelOptions {
  enabled: boolean;
  pixelId: string;
}

export interface TikTokBrowserRedirectOptions {
  enabled: boolean;
  forceBrowserOpen?: boolean;
}

export interface TikTokStrictBotDetectionOptions {
  enabled: boolean;
  additionalPatterns?: string[];
}

/**
 * Build TikTok Pixel script for PageView and ClickButton tracking
 *
 * Fires:
 * - PageView event when page loads
 * - ClickButton event when any button/link is clicked
 */
export function buildTikTokPixelScript(options: TikTokPixelOptions): string {
  if (!options.enabled || !options.pixelId) {
    return "";
  }

  const { pixelId } = options;

  const scriptBody = `!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};

  ttq.load('${pixelId}');
  ttq.page();
}(window, document, 'ttq');

// Track ClickButton events on all clicks
document.addEventListener('click', function() {
  if (typeof ttq !== 'undefined') {
    ttq.track('ClickButton');
  }
}, true);`;

  return `<script>
${scriptBody}
</script>`;
}

/**
 * Build TikTok browser redirect script
 *
 * Forces TikTok in-app webview to open link in external browser.
 * This helps avoid TikTok's webview restrictions and improves tracking.
 */
export function buildTikTokBrowserRedirectScript(
  options: TikTokBrowserRedirectOptions,
  targetUrl: string
): string {
  if (!options.enabled) {
    return "";
  }

  const scriptBody = `(function() {
    try {
        const ua = navigator.userAgent.toLowerCase();

        // Detect TikTok in-app browser
        const isTikTokWebview = /tiktok|musical\\.ly|bytedance/i.test(ua);

        if (isTikTokWebview) {
            // Build intent URL to open in external browser
            const currentUrl = encodeURIComponent(window.location.href);
            const intentUrl = 'intent://' + currentUrl.replace(/^https?:\\/\\//, '') + '#Intent;scheme=https;end';

            // For Android, use intent URL
            if (/android/i.test(ua)) {
                window.location.href = intentUrl;
            } else {
                // For iOS, redirect to Safari
                // TikTok iOS doesn't support intent URLs well
                window.location.href = ${JSON.stringify(targetUrl)};
            }
        }
    } catch (error) {
        console.error('TikTok browser redirect error:', error);
    }
})();`;

  return `<script>
${scriptBody}
</script>`;
}

/**
 * Build TikTok strict bot detection patterns
 *
 * Returns additional regex patterns to detect TikTok/ByteDance crawlers
 * These can be merged with existing bot detection patterns
 */
export function buildTikTokStrictBotDetectionPatterns(
  options: TikTokStrictBotDetectionOptions
): string[] {
  if (!options.enabled) {
    return [];
  }

  const basePatterns = config.tiktok.strictBotDetection.additionalPatterns;
  const customPatterns = options.additionalPatterns || [];

  return [...basePatterns, ...customPatterns];
}

/**
 * Build enhanced bot detection regex that includes TikTok patterns
 */
export function buildEnhancedBotPattern(
  strictTikTokDetection: boolean = false
): string {
  const basePattern =
    "bot|crawler|spider|google|facebook|headless|phantomjs|selenium|webdriver|scraper|wget|curl|prerender|preview";

  if (strictTikTokDetection) {
    const tiktokPatterns = buildTikTokStrictBotDetectionPatterns({
      enabled: true,
    }).join("|");
    return `${basePattern}|${tiktokPatterns}`;
  }

  return basePattern;
}

/**
 * Validate TikTok Pixel ID format
 *
 * TikTok Pixel IDs are typically alphanumeric strings like "D45OCM3C77U0CLRNMLJG"
 */
export function validateTikTokPixelId(pixelId: string): boolean {
  if (!pixelId || pixelId.trim() === "") return false;

  // TikTok Pixel IDs are typically 20 characters, alphanumeric
  const pattern = /^[A-Z0-9]{15,25}$/;
  return pattern.test(pixelId.trim());
}

/**
 * Build complete TikTok integration script
 *
 * Combines pixel tracking, browser redirect, and strict bot detection
 */
export function buildCompleteTikTokScript(options: {
  pixel?: TikTokPixelOptions;
  browserRedirect?: TikTokBrowserRedirectOptions;
  targetUrl: string;
}): string {
  const scripts: string[] = [];

  // Add pixel tracking
  if (options.pixel?.enabled) {
    scripts.push(buildTikTokPixelScript(options.pixel));
  }

  // Add browser redirect
  if (options.browserRedirect?.enabled) {
    scripts.push(
      buildTikTokBrowserRedirectScript(options.browserRedirect, options.targetUrl)
    );
  }

  return scripts.filter((s) => s).join("\n");
}

/**
 * Get default TikTok Pixel ID from config
 */
export function getDefaultTikTokPixelId(): string {
  return config.tiktok.pixelDefaults.pixelId;
}

/**
 * Check if TikTok features are enabled globally
 */
export function areTikTokFeaturesEnabled(): {
  pixel: boolean;
  browserRedirect: boolean;
  strictBotDetection: boolean;
} {
  return {
    pixel: config.tiktok.pixelDefaults.enabled,
    browserRedirect: config.tiktok.browserRedirect.enabled,
    strictBotDetection: config.tiktok.strictBotDetection.enabled,
  };
}
