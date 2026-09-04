import type { AppState } from "./types";

export const initialState: AppState = {
  printUnitPrice: 4362,
  interiorDesignCost: 1_920_000,
  copies: 500,
  workFees: [
    { id: "base", label: "기본 업무비", amount: 200_000, checked: true },
    { id: "keyvisual", label: "키비주얼 디자인", amount: 300_000, checked: true },
    { id: "reprint", label: "재인쇄 디자인 수정", amount: 100_000, checked: false },
  ],
  publisherShareOn: false,
  publisherShareAmount: 500_000,

  agency: {
    mode: "flat",
    ratePercent: 10,
    flatAmount: 5_000,
    monthlyFixed: 300_000,
    months: 6,
  },

  platforms: [
    {
      id: "kyobo",
      name: "교보문고",
      feePercent: 35,
      shippingFee: 4_000,
      discount: false,
      shippingPolicy: "author",
    },
    {
      id: "naver",
      name: "네이버 스마트스토어",
      feePercent: 5,
      shippingFee: 1_000,
      discount: false,
      shippingPolicy: "customerDeducted",
    },
  ],
  weights: [90, 10],

  targetSellRatePercent: 50,
  basePrice: 28_000,
};

export const STORAGE_KEY = "book-breakeven:v1";

/**
 * "비우기" 상태 — 모든 금액·부수·비율을 0으로 만든다.
 * 저자가 예시 수치를 지우고 자기 숫자를 처음부터 넣고 싶을 때 쓴다.
 * 플랫폼 이름과 수수료 방식 같은 구조는 유지하고 값만 비운다.
 */
export const emptyState: AppState = {
  printUnitPrice: 0,
  interiorDesignCost: 0,
  copies: 0,
  workFees: initialState.workFees.map((f) => ({ ...f, amount: 0, checked: false })),
  publisherShareOn: false,
  publisherShareAmount: 0,
  agency: {
    mode: initialState.agency.mode,
    ratePercent: 0,
    flatAmount: 0,
    monthlyFixed: 0,
    months: 0,
  },
  platforms: initialState.platforms.map((p) => ({
    ...p,
    feePercent: 0,
    shippingFee: 0,
    discount: false,
    shippingPolicy: "author" as const,
  })),
  weights: initialState.weights.map(() => 0),
  targetSellRatePercent: 0,
  basePrice: 0,
};
