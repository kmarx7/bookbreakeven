export type AgencyMode = "rate" | "flat" | "monthlyRate";

export interface AgencyConfig {
  mode: AgencyMode;
  /** A, C 방식: 권당 판매가 대비 % */
  ratePercent: number;
  /** B 방식: 권당 고정 금액(원) */
  flatAmount: number;
  /** C 방식: 월 고정비(원) */
  monthlyFixed: number;
  /** C 방식: 판매 예상 기간(개월). 월 고정비 × 개월이 회수 대상 비용에 포함된다. */
  months: number;
}

/**
 * 배송비 처리 방식.
 * 스펙의 "배송비 고객부담" 체크박스는 표시용/계산용이 모호해서 3분기 선택으로 확정했다.
 *  - author           : 저자 부담. 정산에서 배송비 차감.
 *  - customer         : 고객이 별도 결제. 정산에서 차감 없음.
 *  - customerDeducted : 고객이 결제하지만 플랫폼이 실비를 정산에서 차감(네이버 케이스).
 */
export type ShippingPolicy = "author" | "customer" | "customerDeducted";

export interface Platform {
  id: string;
  name: string;
  /** 플랫폼 수수료율 (%) — 판매가 기준 */
  feePercent: number;
  /** 건당 배송비(원) */
  shippingFee: number;
  /** 10% 할인 판매 여부 */
  discount: boolean;
  shippingPolicy: ShippingPolicy;
}

export interface WorkFee {
  id: string;
  label: string;
  amount: number;
  checked: boolean;
}

export interface AppState {
  /** 1. 제작 비용 */
  printUnitPrice: number;
  interiorDesignCost: number;
  copies: number;
  workFees: WorkFee[];
  publisherShareOn: boolean;
  publisherShareAmount: number;

  /** 2. 판매대행 수수료 */
  agency: AgencyConfig;

  /** 3. 판매 플랫폼 */
  platforms: Platform[];
  /** 플랫폼별 판매 비중(%) — 합이 100이 되도록 정규화해서 사용 */
  weights: number[];

  /** 4. BEP */
  targetSellRatePercent: number;
  basePrice: number;
}

export interface PlatformResult {
  platform: Platform;
  price: number;
  discountAmount: number;
  platformFee: number;
  /** 실제로 정산에서 차감된 배송비 */
  shippingDeducted: number;
  agencyFee: number;
  /** 권당 저자 실수령 */
  net: number;
}
