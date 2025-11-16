/**
 * CSV Spend Import Parser
 *
 * Parses TikTok and Facebook Ads Manager CSV exports.
 * Automatically detects format and extracts spend data.
 */

export interface ParsedSpendRecord {
  campaignName: string;
  spend: number;
  date: string;
  platform: "tiktok" | "facebook";
  account?: string; // Extracted from campaign name
  offer?: string; // Extracted from campaign name
}

export interface CSVParseResult {
  success: boolean;
  records: ParsedSpendRecord[];
  errors: string[];
  totalSpend: number;
  detectedFormat: "tiktok" | "facebook" | "custom" | "unknown";
}

export class CSVParser {
  /**
   * Parse CSV file content
   */
  async parse(csvContent: string): Promise<CSVParseResult> {
    const errors: string[] = [];
    const records: ParsedSpendRecord[] = [];

    try {
      // Split into lines and remove empty lines
      const lines = csvContent
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length < 2) {
        return {
          success: false,
          records: [],
          errors: ["CSV file is empty or has no data rows"],
          totalSpend: 0,
          detectedFormat: "unknown",
        };
      }

      // Parse header row
      const headers = this.parseCSVLine(lines[0]);
      const format = this.detectFormat(headers);

      console.log(`[CSV Parser] Detected format: ${format}`);
      console.log(`[CSV Parser] Headers:`, headers);

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = this.parseCSVLine(lines[i]);
          const record = this.parseRecord(headers, values, format);

          if (record) {
            records.push(record);
          }
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      const totalSpend = records.reduce((sum, r) => sum + r.spend, 0);

      return {
        success: errors.length === 0,
        records,
        errors,
        totalSpend,
        detectedFormat: format,
      };
    } catch (error) {
      return {
        success: false,
        records: [],
        errors: [error instanceof Error ? error.message : String(error)],
        totalSpend: 0,
        detectedFormat: "unknown",
      };
    }
  }

  /**
   * Parse a single CSV line (handles quoted values)
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let currentValue = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = "";
      } else {
        currentValue += char;
      }
    }

    // Add last value
    values.push(currentValue.trim());

    return values;
  }

  /**
   * Detect CSV format based on headers
   */
  private detectFormat(headers: string[]): "tiktok" | "facebook" | "custom" | "unknown" {
    const headerLower = headers.map((h) => h.toLowerCase());

    // TikTok Ads Manager headers
    if (
      headerLower.includes("campaign name") &&
      (headerLower.includes("cost") || headerLower.includes("spend"))
    ) {
      return "tiktok";
    }

    // Facebook Ads Manager headers
    if (
      headerLower.includes("campaign name") &&
      headerLower.includes("amount spent (usd)")
    ) {
      return "facebook";
    }

    // Custom format (Campaign, Spend, Date)
    if (
      headerLower.includes("campaign") &&
      headerLower.includes("spend")
    ) {
      return "custom";
    }

    return "unknown";
  }

  /**
   * Parse a single record based on format
   */
  private parseRecord(
    headers: string[],
    values: string[],
    format: string
  ): ParsedSpendRecord | null {
    const headerMap = new Map<string, number>();
    headers.forEach((header, index) => {
      headerMap.set(header.toLowerCase(), index);
    });

    let campaignName = "";
    let spend = 0;
    let date = new Date().toISOString().split("T")[0]; // Default to today

    // Extract based on format
    if (format === "tiktok") {
      const campaignIndex = headerMap.get("campaign name");
      const spendIndex = headerMap.get("cost") || headerMap.get("spend");
      const dateIndex = headerMap.get("date") || headerMap.get("day");

      if (campaignIndex !== undefined && spendIndex !== undefined) {
        campaignName = values[campaignIndex];
        spend = this.parseSpendValue(values[spendIndex]);

        if (dateIndex !== undefined) {
          date = this.parseDate(values[dateIndex]);
        }
      }
    } else if (format === "facebook") {
      const campaignIndex = headerMap.get("campaign name");
      const spendIndex = headerMap.get("amount spent (usd)");
      const dateIndex = headerMap.get("reporting starts") || headerMap.get("date");

      if (campaignIndex !== undefined && spendIndex !== undefined) {
        campaignName = values[campaignIndex];
        spend = this.parseSpendValue(values[spendIndex]);

        if (dateIndex !== undefined) {
          date = this.parseDate(values[dateIndex]);
        }
      }
    } else if (format === "custom") {
      const campaignIndex = headerMap.get("campaign");
      const spendIndex = headerMap.get("spend");
      const dateIndex = headerMap.get("date");

      if (campaignIndex !== undefined && spendIndex !== undefined) {
        campaignName = values[campaignIndex];
        spend = this.parseSpendValue(values[spendIndex]);

        if (dateIndex !== undefined) {
          date = this.parseDate(values[dateIndex]);
        }
      }
    }

    // Skip if no campaign name or zero spend
    if (!campaignName || spend <= 0) {
      return null;
    }

    // Extract account and offer from campaign name
    const extracted = this.extractFromCampaignName(campaignName);

    return {
      campaignName,
      spend,
      date,
      platform: format === "facebook" ? "facebook" : "tiktok",
      account: extracted.account,
      offer: extracted.offer,
    };
  }

  /**
   * Parse spend value (handles currency symbols and formatting)
   */
  private parseSpendValue(value: string): number {
    // Remove currency symbols, commas, and spaces
    const cleaned = value.replace(/[$,\s]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Parse date string to YYYY-MM-DD format
   */
  private parseDate(value: string): string {
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return new Date().toISOString().split("T")[0];
      }
      return date.toISOString().split("T")[0];
    } catch {
      return new Date().toISOString().split("T")[0];
    }
  }

  /**
   * Extract account number and offer from campaign name
   *
   * Campaign name formats:
   * - "ApplePay-1639-SC5-tiktok" → account: "1639", offer: "apple"
   * - "CashApp-3175-SC12-facebook" → account: "3175", offer: "cashapp"
   * - "Apple Pay - 1639 - Spark 5" → account: "1639", offer: "apple"
   */
  private extractFromCampaignName(campaignName: string): {
    account?: string;
    offer?: string;
  } {
    // Pattern 1: Offer-Account-... (e.g., "ApplePay-1639-SC5")
    const pattern1 = /^([a-zA-Z\s]+)-?(\d+[A-Z]*)/i;
    const match1 = campaignName.match(pattern1);

    if (match1) {
      const offerPart = match1[1].toLowerCase().replace(/\s+/g, "");
      const account = match1[2];

      // Map offer names to keys
      const offerMap: Record<string, string> = {
        applepay: "apple",
        apple: "apple",
        cashapp: "cashapp",
        cash: "cashapp",
        shein: "shein",
        venmo: "venmo",
        freecash: "freecash-main",
        swift: "swift-venmo",
      };

      const offer = offerMap[offerPart];

      return { account, offer };
    }

    // Pattern 2: Account number anywhere (e.g., "Campaign 1639 Test")
    const pattern2 = /(\d{4,})/;
    const match2 = campaignName.match(pattern2);

    if (match2) {
      return { account: match2[1] };
    }

    return {};
  }
}

// Export singleton instance
export const csvParser = new CSVParser();
