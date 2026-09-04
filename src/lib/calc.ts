import type { AgencyConfig, AppState, Platform, PlatformResult } from "./types";
export type { PlatformResult };

/** 판매대행 수수료 중 "권당"으로 발생하는 금액 */
export function agencyFeePerBook(agency: AgencyConfig, price: number): number {
  switch (agency.mode) {
    case "rate":
      return Math.round((price * agency.ratePercent) / 100);
    case "flat":
      return Math.round(agency.flatAmount);
    case "monthlyRate":
      return Math.round((price * agency.ratePercent) / 100);
  }
}

/** 판매대행 수수료 중 매월 고정으로 발생하는 금액 */
export function agencyMonthlyFixed(agency: AgencyConfig): number {
  return agency.mode === "monthlyRate" ? Math.round(agency.monthlyFixed) : 0;
}

/** 판매 기간 전체에 걸쳐 회수해야 하는 판매대행 고정비 */
export function agencyFixedTotal(agency: AgencyConfig): number {
  return agencyMonthlyFixed(agency) * Math.max(0, Math.round(agency.months));
}

export interface ProductionCost {
  printTotal: number;
  interiorDesignCost: number;
  workFeeTotal: number;
  publisherShare: number;
  /** 총 제작비 합계 (저자 부담) */
  total: number;
}

export function computeProductionCost(s: AppState): ProductionCost {
  const printTotal = Math.round(s.printUnitPrice * s.copies);
  const workFeeTotal = s.workFees
    .filter((f) => f.checked)
    .reduce((sum, f) => sum + Math.round(f.amount), 0);
  const publisherShare = s.publisherShareOn ? Math.round(s.publisherShareAmount) : 0;
  const total =
    printTotal + Math.round(s.interiorDesignCost) + workFeeTotal - publisherShare;
  return {
    printTotal,
    interiorDesignCost: Math.round(s.interiorDesignCost),
    workFeeTotal,
    publisherShare,
    total,
  };
}

/**
 * BEP가 회수해야 하는 총비용.
 * 제작비 + (C 방식일 때) 월 고정비 × 판매 예상 기간.
 * 월 고정비를 빼두면 "총 월 고정비" 카드가 어디에도 반영되지 않아 BEP가 낙관적으로 나온다.
 */
export function computeRecoverCost(s: AppState): number {
  return computeProductionCost(s).total + agencyFixedTotal(s.agency);
}

/** 배송비 중 실제로 저자 정산에서 차감되는 금액 */
export function shippingDeducted(p: Platform): number {
  return p.shippingPolicy === "customer" ? 0 : Math.round(p.shippingFee);
}

export function computePlatformResult(
  p: Platform,
  price: number,
  agency: AgencyConfig,
): PlatformResult {
  const discountAmount = p.discount ? Math.round(price * 0.1) : 0;
  const platformFee = Math.round((price * p.feePercent) / 100);
  const shipping = shippingDeducted(p);
  const agencyFee = agencyFeePerBook(agency, price);
  const net = price - discountAmount - platformFee - shipping - agencyFee;
  return { platform: p, price, discountAmount, platformFee, shippingDeducted: shipping, agencyFee, net };
}

/** 판매 비중을 합 100%로 정규화 */
export function normalizedWeights(weights: number[]): number[] {
  const safe = weights.map((w) => (Number.isFinite(w) && w > 0 ? w : 0));
  const sum = safe.reduce((a, b) => a + b, 0);
  if (sum <= 0) return safe.map((_, i) => (i === 0 ? 1 : 0));
  return safe.map((w) => w / sum);
}

/** 판매 비중 가중평균 권당 저자 실수령 */
export function weightedNet(s: AppState, price: number): number {
  const w = normalizedWeights(s.weights);
  return s.platforms.reduce(
    (sum, p, i) => sum + computePlatformResult(p, price, s.agency).net * (w[i] ?? 0),
    0,
  );
}

/**
 * 실수령은 판매가에 대해 선형이다: net(P) = P·K − C
 * K = Σ wᵢ(1 − 할인율 − 플랫폼수수료율 − 대행정률)
 * C = Σ wᵢ(차감 배송비 + 대행 정액)
 * 권장가 역산에 사용한다.
 */
export function netCoefficients(s: AppState): { K: number; C: number } {
  const w = normalizedWeights(s.weights);
  const agencyRate =
    s.agency.mode === "flat" ? 0 : s.agency.ratePercent / 100;
  const agencyFlat = s.agency.mode === "flat" ? s.agency.flatAmount : 0;

  let K = 0;
  let C = 0;
  s.platforms.forEach((p, i) => {
    const wi = w[i] ?? 0;
    K += wi * (1 - (p.discount ? 0.1 : 0) - p.feePercent / 100 - agencyRate);
    C += wi * (shippingDeducted(p) + agencyFlat);
  });
  return { K, C };
}

export interface BepRow {
  price: number;
  net: number;
  /** 손익분기 판매부수. 실수령이 0 이하라 회수가 불가능하면 null */
  bep: number | null;
  /** 완판 시 저자 손익 */
  soldOutProfit: number;
  /** BEP가 인쇄부수를 초과 → 완판해도 원가 회수 불가 */
  overPrintRun: boolean;
  selected: boolean;
}

export function computeBepRow(s: AppState, price: number): BepRow {
  const net = Math.round(weightedNet(s, price));
  const recover = computeRecoverCost(s);
  const bep = net > 0 ? Math.ceil(recover / net) : null;
  return {
    price,
    net,
    bep,
    soldOutProfit: Math.round(net * s.copies - recover),
    overPrintRun: bep === null || bep > s.copies,
    selected: price === s.basePrice,
  };
}

export const BEP_TABLE_STEP = 1000;
export const BEP_TABLE_SPAN = 4;

/** 기준가 ±4,000원 (1,000원 간격) = 9행 */
export function computeBepTable(s: AppState): BepRow[] {
  const rows: BepRow[] = [];
  for (let i = -BEP_TABLE_SPAN; i <= BEP_TABLE_SPAN; i++) {
    const price = s.basePrice + i * BEP_TABLE_STEP;
    if (price <= 0) continue;
    rows.push(computeBepRow(s, price));
  }
  return rows;
}

export interface Recommendation {
  targetUnits: number;
  /** 목표 부수를 팔아 비용을 회수하기 위해 권당 필요한 실수령 */
  requiredNet: number;
  /** 권장 판매가 (1,000원 단위 올림). 구조상 산출 불가하면 null */
  price: number | null;
}

export function computeRecommendation(s: AppState): Recommendation {
  const targetUnits = Math.max(
    1,
    Math.round((s.copies * s.targetSellRatePercent) / 100),
  );
  const recover = computeRecoverCost(s);
  const requiredNet = recover / targetUnits;
  const { K, C } = netCoefficients(s);
  if (K <= 0) return { targetUnits, requiredNet, price: null };
  const raw = (requiredNet + C) / K;
  if (!Number.isFinite(raw) || raw <= 0) return { targetUnits, requiredNet, price: null };
  return {
    targetUnits,
    requiredNet,
    price: Math.ceil(raw / 1000) * 1000,
  };
}
