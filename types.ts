export interface LaundryOrderResult {
  laundry_service_name: string;
  shopify_order_number: string;
  customer_name: string;
  delivery_address: string;
  laundry_weight_kg: number | string; // number or "DATA_UNCLEAR"
  price: number;
  extraction_confidence_score: number;
  timestamp: number;
  weight_image_src?: string;
  customer_image_src?: string;
}

export interface ProcessingState {
  isLoading: boolean;
  error: string | null;
  result: LaundryOrderResult | null;
}

export enum Step {
  INPUT = 'INPUT',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT'
}