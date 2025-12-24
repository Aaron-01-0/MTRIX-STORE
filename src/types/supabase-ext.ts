import { Database } from '@/integrations/supabase/types';

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type ExtendedDatabase = Database & {
    public: {
        Tables: {
            products: {
                Row: Database['public']['Tables']['products']['Row'] & {
                    has_variants: boolean;
                    variant_type: 'none' | 'single' | 'multi';
                    ratings_avg?: number;
                    ratings_count?: number;
                };
                Insert: Database['public']['Tables']['products']['Insert'] & {
                    has_variants?: boolean;
                    variant_type?: 'none' | 'single' | 'multi';
                };
                Update: Database['public']['Tables']['products']['Update'] & {
                    has_variants?: boolean;
                    variant_type?: 'none' | 'single' | 'multi';
                };
            };
            product_variants: {
                Row: Database['public']['Tables']['product_variants']['Row'] & {
                    attribute_json: Json | null;
                    barcode: string | null;
                    images: Json | null;
                };
                Insert: Database['public']['Tables']['product_variants']['Insert'] & {
                    attribute_json?: Json | null;
                    barcode?: string | null;
                    images?: Json | null;
                };
                Update: Database['public']['Tables']['product_variants']['Update'] & {
                    attribute_json?: Json | null;
                    barcode?: string | null;
                    images?: Json | null;
                };
            };
            product_attributes: {
                Row: {
                    id: string;
                    product_id: string;
                    display_name: string;
                    type: string;
                    display_order: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    product_id: string;
                    display_name: string;
                    type?: string;
                    display_order?: number;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    product_id?: string;
                    display_name?: string;
                    type?: string;
                    display_order?: number;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "product_attributes_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    }
                ];
            };
            attribute_values: {
                Row: {
                    id: string;
                    attribute_id: string;
                    value: string;
                    display_order: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    attribute_id: string;
                    value: string;
                    display_order?: number;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    attribute_id?: string;
                    value?: string;
                    display_order?: number;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "attribute_values_attribute_id_fkey"
                        columns: ["attribute_id"]
                        isOneToOne: false
                        referencedRelation: "product_attributes"
                        referencedColumns: ["id"]
                    }
                ];
            };
            inventory_history: {
                Row: {
                    id: string;
                    variant_id: string;
                    quantity_change: number;
                    action_type: string;
                    description: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    variant_id: string;
                    quantity_change: number;
                    action_type: string;
                    description?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    variant_id?: string;
                    quantity_change?: number;
                    action_type?: string;
                    description?: string | null;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "inventory_history_variant_id_fkey"
                        columns: ["variant_id"]
                        isOneToOne: false
                        referencedRelation: "product_variants"
                        referencedColumns: ["id"]
                    }
                ];
            };
        };
    };
};

export type Product = ExtendedDatabase['public']['Tables']['products']['Row'];
export type ProductVariant = ExtendedDatabase['public']['Tables']['product_variants']['Row'];
export type ProductAttribute = ExtendedDatabase['public']['Tables']['product_attributes']['Row'];
export type AttributeValue = ExtendedDatabase['public']['Tables']['attribute_values']['Row'];
