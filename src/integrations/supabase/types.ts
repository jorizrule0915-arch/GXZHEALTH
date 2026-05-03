export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      orders: {
        Row: {
          created_at: string
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_state: string | null
          customer_zip: string | null
          id: string
          items: Json
          order_number: string
          payer_account_name: string | null
          payment_method: string | null
          payment_reference_id: string | null
          payment_submitted_at: string | null
          promo_code: string | null
          promo_code_id: string | null
          promo_discount_amount: number
          promo_discount_percent: number | null
          promo_product_id: string | null
          status: string
          total_items: number
          total_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_state?: string | null
          customer_zip?: string | null
          id?: string
          items: Json
          order_number: string
          payer_account_name?: string | null
          payment_method?: string | null
          payment_reference_id?: string | null
          payment_submitted_at?: string | null
          promo_code?: string | null
          promo_code_id?: string | null
          promo_discount_amount?: number
          promo_discount_percent?: number | null
          promo_product_id?: string | null
          status?: string
          total_items: number
          total_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_state?: string | null
          customer_zip?: string | null
          id?: string
          items?: Json
          order_number?: string
          payer_account_name?: string | null
          payment_method?: string | null
          payment_reference_id?: string | null
          payment_submitted_at?: string | null
          promo_code?: string | null
          promo_code_id?: string | null
          promo_discount_amount?: number
          promo_discount_percent?: number | null
          promo_product_id?: string | null
          status?: string
          total_items?: number
          total_price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          discount_percent: number | null
          expires_at: string | null
          id: string
          influencer_name: string
          last_used_at: string | null
          minimum_order_requirement: number
          promo_product_id: string
          total_revenue: number
          total_uses: number
          updated_at: string
          usage_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          influencer_name: string
          last_used_at?: string | null
          minimum_order_requirement?: number
          promo_product_id: string
          total_revenue?: number
          total_uses?: number
          updated_at?: string
          usage_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          influencer_name?: string
          last_used_at?: string | null
          minimum_order_requirement?: number
          promo_product_id?: string
          total_revenue?: number
          total_uses?: number
          updated_at?: string
          usage_limit?: number | null
        }
        Relationships: []
      }
      promo_products: {
        Row: {
          created_at: string
          id: string
          name: string
          sku: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sku?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sku?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string
          features: Json
          gallery: Json
          highlights: Json
          id: string
          image_url: string | null
          in_stock: boolean
          is_active: boolean
          long_description: string | null
          name: string
          options: Json
          price: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          features?: Json
          gallery?: Json
          highlights?: Json
          id?: string
          image_url?: string | null
          in_stock?: boolean
          is_active?: boolean
          long_description?: string | null
          name: string
          options?: Json
          price?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          features?: Json
          gallery?: Json
          highlights?: Json
          id?: string
          image_url?: string | null
          in_stock?: boolean
          is_active?: boolean
          long_description?: string | null
          name?: string
          options?: Json
          price?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      validate_promo_code: {
        Args: {
          cart_items?: Json
          customer_email?: string
          input_code: string
        }
        Returns: {
          code: string | null
          discount_percent: number | null
          expires_at: string | null
          influencer_name: string | null
          message: string
          minimum_order_requirement: number | null
          promo_code_id: string | null
          promo_product_id: string | null
          promo_product_name: string | null
          total_uses: number | null
          usage_limit: number | null
          valid: boolean
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
