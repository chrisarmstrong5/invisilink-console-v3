/**
 * SMM Panel API Client
 *
 * Connects to SMM panels (SMMFollows or JustAnotherPanel) to automatically
 * boost engagement on TikTok videos (likes, saves, views).
 *
 * Standard SMM Panel API format (used by most panels):
 * - GET ?key=API_KEY&action=services - List all services
 * - POST key=API_KEY&action=add&service=ID&link=URL&quantity=NUM - Place order
 * - POST key=API_KEY&action=status&order=ID - Check order status
 * - POST key=API_KEY&action=balance - Get account balance
 */

import { config } from "@/lib/config";

export interface SMMService {
  service: number;
  name: string;
  type: string;
  rate: string; // Price per 1000
  min: string;
  max: string;
  category: string;
}

export interface SMMOrderRequest {
  serviceId: string;
  link: string;
  quantity: number;
}

export interface SMMOrderResponse {
  order?: number; // Order ID on success
  error?: string; // Error message on failure
}

export interface SMMOrderStatus {
  charge: string;
  start_count: string;
  status: string; // "Pending", "In progress", "Completed", "Partial", "Canceled"
  remains: string;
}

export interface SMMBalance {
  balance: string;
  currency: string;
}

class SMMPanelAPI {
  private apiUrl: string;
  private apiKey: string;
  private provider: "smmfollows" | "jap";

  constructor() {
    this.provider = config.smmPanel.provider;
    const providerConfig = config.smmPanel[this.provider];
    this.apiUrl = providerConfig.apiUrl;
    this.apiKey = providerConfig.apiKey;

    if (!this.apiKey) {
      console.warn(`[SMM Panel] No API key configured for ${this.provider}`);
    }
  }

  /**
   * Make API request to SMM panel
   */
  private async request<T>(params: Record<string, string>): Promise<T> {
    const url = new URL(this.apiUrl);
    url.searchParams.set("key", this.apiKey);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    try {
      console.log(`[SMM Panel] Request to ${this.provider}:`, params.action);
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (!response.ok) {
        throw new Error(`SMM Panel API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error(`[SMM Panel] Request failed:`, error);
      throw error;
    }
  }

  /**
   * Get list of available services
   */
  async getServices(): Promise<SMMService[]> {
    return this.request<SMMService[]>({ action: "services" });
  }

  /**
   * Place a new order
   */
  async placeOrder(order: SMMOrderRequest): Promise<SMMOrderResponse> {
    return this.request<SMMOrderResponse>({
      action: "add",
      service: order.serviceId,
      link: order.link,
      quantity: order.quantity.toString(),
    });
  }

  /**
   * Check order status
   */
  async getOrderStatus(orderId: number): Promise<SMMOrderStatus> {
    return this.request<SMMOrderStatus>({
      action: "status",
      order: orderId.toString(),
    });
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<SMMBalance> {
    return this.request<SMMBalance>({ action: "balance" });
  }

  /**
   * Boost engagement on a TikTok video
   *
   * @param tiktokLink - Full TikTok video URL
   * @param likes - Number of likes to add
   * @param saves - Number of saves to add
   * @param views - Number of views to add (optional)
   */
  async boostEngagement(
    tiktokLink: string,
    likes: number,
    saves: number,
    views?: number
  ): Promise<{ success: boolean; orders: number[]; errors: string[] }> {
    const orders: number[] = [];
    const errors: string[] = [];

    const providerConfig = config.smmPanel[this.provider];
    const services = providerConfig.services.tiktok;

    try {
      // Place likes order
      if (likes > 0 && services.likes) {
        try {
          const result = await this.placeOrder({
            serviceId: services.likes,
            link: tiktokLink,
            quantity: likes,
          });
          if (result.order) {
            orders.push(result.order);
            console.log(`[SMM Panel] Likes order placed: ${result.order}`);
          }
        } catch (error) {
          errors.push(`Likes order failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Place saves order
      if (saves > 0 && services.saves) {
        try {
          const result = await this.placeOrder({
            serviceId: services.saves,
            link: tiktokLink,
            quantity: saves,
          });
          if (result.order) {
            orders.push(result.order);
            console.log(`[SMM Panel] Saves order placed: ${result.order}`);
          }
        } catch (error) {
          errors.push(`Saves order failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Place views order (optional)
      if (views && views > 0 && services.views) {
        try {
          const result = await this.placeOrder({
            serviceId: services.views,
            link: tiktokLink,
            quantity: views,
          });
          if (result.order) {
            orders.push(result.order);
            console.log(`[SMM Panel] Views order placed: ${result.order}`);
          }
        } catch (error) {
          errors.push(`Views order failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      return {
        success: errors.length === 0,
        orders,
        errors,
      };
    } catch (error) {
      console.error("[SMM Panel] Boost engagement failed:", error);
      return {
        success: false,
        orders,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }
}

export const smmPanelApi = new SMMPanelAPI();
