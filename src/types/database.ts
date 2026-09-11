// Generated from the live Supabase schema. Regenerate with:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
// Do not edit by hand.

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          company: string | null
          country_code: string
          created_at: string
          first_name: string
          id: string
          is_default_billing: boolean
          is_default_shipping: boolean
          label: string | null
          last_name: string
          line1: string
          line2: string | null
          phone: string | null
          postal_code: string
          profile_id: string
          province: string | null
          updated_at: string
        }
        Insert: {
          city: string
          company?: string | null
          country_code?: string
          created_at?: string
          first_name: string
          id?: string
          is_default_billing?: boolean
          is_default_shipping?: boolean
          label?: string | null
          last_name: string
          line1: string
          line2?: string | null
          phone?: string | null
          postal_code: string
          profile_id: string
          province?: string | null
          updated_at?: string
        }
        Update: {
          city?: string
          company?: string | null
          country_code?: string
          created_at?: string
          first_name?: string
          id?: string
          is_default_billing?: boolean
          is_default_shipping?: boolean
          label?: string | null
          last_name?: string
          line1?: string
          line2?: string | null
          phone?: string | null
          postal_code?: string
          profile_id?: string
          province?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          quantity: number
          updated_at: string
          variant_id: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          quantity: number
          updated_at?: string
          variant_id: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          quantity?: number
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          converted_at: string | null
          created_at: string
          currency: string
          discount_code_id: string | null
          id: string
          profile_id: string | null
          token: string | null
          updated_at: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          currency?: string
          discount_code_id?: string | null
          id?: string
          profile_id?: string | null
          token?: string | null
          updated_at?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          currency?: string
          discount_code_id?: string | null
          id?: string
          profile_id?: string | null
          token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_discount_code_fk"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          audience: Database["public"]["Enums"]["audience"] | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_published: boolean
          name: string
          parent_id: string | null
          position: number
          seo_description: string | null
          seo_title: string | null
          show_in_nav: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["audience"] | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          name: string
          parent_id?: string | null
          position?: number
          seo_description?: string | null
          seo_title?: string | null
          show_in_nav?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["audience"] | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          name?: string
          parent_id?: string | null
          position?: number
          seo_description?: string | null
          seo_title?: string | null
          show_in_nav?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_products: {
        Row: {
          collection_id: string
          position: number
          product_id: string
        }
        Insert: {
          collection_id: string
          position?: number
          product_id: string
        }
        Update: {
          collection_id?: string
          position?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          cover_image_url: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          hero_image_url: string | null
          hero_video_url: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          position: number
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          story: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          hero_image_url?: string | null
          hero_video_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          position?: number
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          story?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          hero_image_url?: string | null
          hero_video_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          position?: number
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          story?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string
          discount_id: string
          id: string
        }
        Insert: {
          code: string
          created_at?: string
          discount_id: string
          id?: string
        }
        Update: {
          code?: string
          created_at?: string
          discount_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["discount_kind"]
          min_subtotal_cents: number
          name: string
          starts_at: string | null
          updated_at: string
          usage_count: number
          usage_limit: number | null
          value: number
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["discount_kind"]
          min_subtotal_cents?: number
          name: string
          starts_at?: string | null
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          value: number
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["discount_kind"]
          min_subtotal_cents?: number
          name?: string
          starts_at?: string | null
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          value?: number
        }
        Relationships: []
      }
      inventory: {
        Row: {
          allow_backorder: boolean
          low_stock_threshold: number
          quantity: number
          reserved: number
          track_inventory: boolean
          updated_at: string
          variant_id: string
        }
        Insert: {
          allow_backorder?: boolean
          low_stock_threshold?: number
          quantity?: number
          reserved?: number
          track_inventory?: boolean
          updated_at?: string
          variant_id: string
        }
        Update: {
          allow_backorder?: boolean
          low_stock_threshold?: number
          quantity?: number
          reserved?: number
          track_inventory?: boolean
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: true
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          delta: number
          id: number
          reason: string
          reference_id: string | null
          variant_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: number
          reason: string
          reference_id?: string | null
          variant_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: number
          reason?: string
          reference_id?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_items: {
        Row: {
          column_label: string | null
          created_at: string
          href: string | null
          id: string
          image_url: string | null
          is_published: boolean
          label: string
          location: string
          parent_id: string | null
          position: number
          updated_at: string
        }
        Insert: {
          column_label?: string | null
          created_at?: string
          href?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          label: string
          location?: string
          parent_id?: string | null
          position?: number
          updated_at?: string
        }
        Update: {
          column_label?: string | null
          created_at?: string
          href?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          label?: string
          location?: string
          parent_id?: string | null
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigation_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "navigation_items"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_confirmed: boolean
          source: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_confirmed?: boolean
          source?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_confirmed?: boolean
          source?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          sku: string | null
          slug: string | null
          total_cents: number
          unit_price_cents: number
          variant_id: string | null
          variant_label: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          sku?: string | null
          slug?: string | null
          total_cents: number
          unit_price_cents: number
          variant_id?: string | null
          variant_label?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          sku?: string | null
          slug?: string | null
          total_cents?: number
          unit_price_cents?: number
          variant_id?: string | null
          variant_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          cancelled_at: string | null
          created_at: string
          currency: string
          customer_note: string | null
          discount_cents: number
          discount_code: string | null
          email: string
          id: string
          order_number: string
          phone: string | null
          placed_at: string | null
          profile_id: string | null
          shipping_address: Json
          shipping_cents: number
          shipping_method_code: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subtotal_cents: number
          total_cents: number
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          customer_note?: string | null
          discount_cents?: number
          discount_code?: string | null
          email: string
          id?: string
          order_number?: string
          phone?: string | null
          placed_at?: string | null
          profile_id?: string | null
          shipping_address: Json
          shipping_cents?: number
          shipping_method_code?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal_cents: number
          total_cents: number
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          customer_note?: string | null
          discount_cents?: number
          discount_code?: string | null
          email?: string
          id?: string
          order_number?: string
          phone?: string | null
          placed_at?: string | null
          profile_id?: string | null
          shipping_address?: Json
          shipping_cents?: number
          shipping_method_code?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_sections: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_published: boolean
          kind: Database["public"]["Enums"]["page_section_kind"]
          page_id: string
          position: number
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          kind: Database["public"]["Enums"]["page_section_kind"]
          page_id: string
          position?: number
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          kind?: Database["public"]["Enums"]["page_section_kind"]
          page_id?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          seo_description: string | null
          seo_title: string | null
          slug: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          order_id: string
          provider: string
          provider_reference: string | null
          raw_payload: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          order_id: string
          provider?: string
          provider_reference?: string | null
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          provider?: string
          provider_reference?: string | null
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string | null
          created_at: string
          height: number | null
          id: string
          position: number
          product_id: string
          url: string
          variant_id: string | null
          width: number | null
        }
        Insert: {
          alt?: string | null
          created_at?: string
          height?: number | null
          id?: string
          position?: number
          product_id: string
          url: string
          variant_id?: string | null
          width?: number | null
        }
        Update: {
          alt?: string | null
          created_at?: string
          height?: number | null
          id?: string
          position?: number
          product_id?: string
          url?: string
          variant_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_recommendations: {
        Row: {
          kind: string
          position: number
          product_id: string
          recommended_id: string
        }
        Insert: {
          kind?: string
          position?: number
          product_id: string
          recommended_id: string
        }
        Update: {
          kind?: string
          position?: number
          product_id?: string
          recommended_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_recommendations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recommendations_recommended_id_fkey"
            columns: ["recommended_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          barcode: string | null
          color_hex: string | null
          color_name: string | null
          compare_at_price_cents: number | null
          created_at: string
          id: string
          is_active: boolean
          position: number
          price_cents: number | null
          product_id: string
          size: string | null
          sku: string
          updated_at: string
          weight_grams: number | null
        }
        Insert: {
          barcode?: string | null
          color_hex?: string | null
          color_name?: string | null
          compare_at_price_cents?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          position?: number
          price_cents?: number | null
          product_id: string
          size?: string | null
          sku: string
          updated_at?: string
          weight_grams?: number | null
        }
        Update: {
          barcode?: string | null
          color_hex?: string | null
          color_name?: string | null
          compare_at_price_cents?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          position?: number
          price_cents?: number | null
          product_id?: string
          size?: string | null
          sku?: string
          updated_at?: string
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_videos: {
        Row: {
          created_at: string
          id: string
          position: number
          poster_url: string | null
          product_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          poster_url?: string | null
          product_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          poster_url?: string | null
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_videos_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          audience: Database["public"]["Enums"]["audience"]
          base_price_cents: number
          care_guide: string | null
          category_id: string | null
          compare_at_price_cents: number | null
          composition: string | null
          created_at: string
          currency: string
          deleted_at: string | null
          description: string | null
          id: string
          is_new: boolean
          is_one_of_a_kind: boolean
          manufacturing: string | null
          model_name: string | null
          name: string
          origin_country: string | null
          position: number
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          size_guide: Json | null
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["audience"]
          base_price_cents: number
          care_guide?: string | null
          category_id?: string | null
          compare_at_price_cents?: number | null
          composition?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_new?: boolean
          is_one_of_a_kind?: boolean
          manufacturing?: string | null
          model_name?: string | null
          name: string
          origin_country?: string | null
          position?: number
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          size_guide?: Json | null
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["audience"]
          base_price_cents?: number
          care_guide?: string | null
          category_id?: string | null
          compare_at_price_cents?: number | null
          composition?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_new?: boolean
          is_one_of_a_kind?: boolean
          manufacturing?: string | null
          model_name?: string | null
          name?: string
          origin_country?: string | null
          position?: number
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          size_guide?: Json | null
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accepts_marketing: boolean
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          accepts_marketing?: boolean
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          accepts_marketing?: boolean
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_published: boolean
          product_id: string
          profile_id: string | null
          rating: number
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          product_id: string
          profile_id?: string | null
          rating: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          product_id?: string
          profile_id?: string | null
          rating?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      shipping_methods: {
        Row: {
          code: string
          country_codes: string[]
          created_at: string
          description: string | null
          free_above_cents: number | null
          id: string
          is_active: boolean
          max_days: number | null
          min_days: number | null
          name: string
          position: number
          price_cents: number
          updated_at: string
        }
        Insert: {
          code: string
          country_codes?: string[]
          created_at?: string
          description?: string | null
          free_above_cents?: number | null
          id?: string
          is_active?: boolean
          max_days?: number | null
          min_days?: number | null
          name: string
          position?: number
          price_cents: number
          updated_at?: string
        }
        Update: {
          code?: string
          country_codes?: string[]
          created_at?: string
          description?: string | null
          free_above_cents?: number | null
          id?: string
          is_active?: boolean
          max_days?: number | null
          min_days?: number | null
          name?: string
          position?: number
          price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          address_line: string | null
          city: string | null
          country_code: string
          created_at: string
          id: string
          is_published: boolean
          kind: string
          latitude: number | null
          longitude: number | null
          name: string
          opening_hours: Json | null
          phone: string | null
          position: number
          postal_code: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          address_line?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          id?: string
          is_published?: boolean
          kind?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          opening_hours?: Json | null
          phone?: string | null
          position?: number
          postal_code?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          address_line?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          id?: string
          is_published?: boolean
          kind?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          position?: number
          postal_code?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          variant_id: string | null
          wishlist_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          variant_id?: string | null
          wishlist_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          variant_id?: string | null
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_dashboard: { Args: never; Returns: Json }
      catalog_search: { Args: { p_filters?: Json }; Returns: Json }
      create_order: {
        Args: {
          p_billing_address?: Json
          p_customer_note?: string
          p_discount_code?: string
          p_email: string
          p_items: Json
          p_phone?: string
          p_shipping_address: Json
          p_shipping_method_code?: string
        }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      lookup_order: {
        Args: { p_email: string; p_order_number: string }
        Returns: Json
      }
      mark_order_paid: {
        Args: {
          p_amount_cents?: number
          p_order_id: string
          p_payload?: Json
          p_payment_reference: string
        }
        Returns: Json
      }
      merge_cart: { Args: { p_items: Json }; Returns: number }
      merge_wishlist: { Args: { p_items: Json }; Returns: number }
      normalize_text: { Args: { value: string }; Returns: string }
      price_cart: {
        Args: {
          p_country_code?: string
          p_discount_code?: string
          p_items: Json
          p_shipping_method_code?: string
        }
        Returns: Json
      }
      release_order: {
        Args: { p_order_id: string; p_reason?: string }
        Returns: Json
      }
      reserve_variant: {
        Args: { p_quantity: number; p_variant_id: string }
        Returns: boolean
      }
      search_suggestions: {
        Args: { p_limit?: number; p_query: string }
        Returns: Json
      }
      unaccent_immutable: { Args: { value: string }; Returns: string }
      validate_discount_code: {
        Args: { p_code: string; p_subtotal_cents: number }
        Returns: Json
      }
      variant_price_cents: { Args: { p_variant_id: string }; Returns: number }
    }
    Enums: {
      audience: "femme" | "homme" | "unisexe"
      discount_kind: "percentage" | "fixed_amount" | "free_shipping"
      order_status:
        | "pending"
        | "paid"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      page_section_kind:
        | "hero"
        | "image_text"
        | "product_grid"
        | "collection_grid"
        | "editorial"
        | "banner"
        | "video"
        | "manifesto"
        | "commitments"
        | "newsletter"
        | "rich_text"
      payment_status:
        | "pending"
        | "authorized"
        | "succeeded"
        | "failed"
        | "refunded"
      product_status: "draft" | "active" | "archived"
      user_role: "customer" | "staff" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      audience: ["femme", "homme", "unisexe"],
      discount_kind: ["percentage", "fixed_amount", "free_shipping"],
      order_status: [
        "pending",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      page_section_kind: [
        "hero",
        "image_text",
        "product_grid",
        "collection_grid",
        "editorial",
        "banner",
        "video",
        "manifesto",
        "commitments",
        "newsletter",
        "rich_text",
      ],
      payment_status: [
        "pending",
        "authorized",
        "succeeded",
        "failed",
        "refunded",
      ],
      product_status: ["draft", "active", "archived"],
      user_role: ["customer", "staff", "admin"],
    },
  },
} as const
