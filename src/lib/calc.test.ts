import { describe, expect, it } from "vitest";
import {
  agencyFeePerBook,
  computeBepRow,
  computeBepTable,
  computePlatformResult,
  computeProductionCost,
  computeRecommendation,
  computeRecoverCost,
  normalizedWeights,
  weightedNet,
} from "./calc";
import { emptyState, initialState } from "./defaults";
import type { AppState } from "./types";

const base: AppState = initialState;
const withState = (p: Partial<AppState>): AppState => ({ ...base, ...p });

describe("제작비", () => {
  it("인쇄비 + 내지디자인 + 체크된 업무비를 합산한다", () => {
    const c = computeProductionCost(base);
    expect(c.printTotal).toBe(4362 * 500); // 2,181,000
    expect(c.workFeeTotal).toBe(500_000); // 기본 + 키비주얼, 재인쇄 미체크
    expect(c.total).toBe(2_181_000 + 1_920_000 + 500_000);
  });

  it("기획사 부담액은 총 제작비에서 차감된다", () => {
    const c = computeProductionCost(
      withState({ publisherShareOn: true, publisherShareAmount: 600_000 }),
    );
    expect(c.total).toBe(4_601_000 - 600_000);
  });

  it("토글이 꺼져 있으면 분담액이 남아 있어도 차감하지 않는다", () => {
    const c = computeProductionCost(
      withState({ publisherShareOn: false, publisherShareAmount: 600_000 }),
    );
    expect(c.publisherShare).toBe(0);
  });
});

describe("판매대행 수수료", () => {
  it("정률은 판매가에 비례한다", () => {
    expect(agencyFeePerBook({ ...base.agency, mode: "rate", ratePercent: 10 }, 22_000)).toBe(2_200);
  });

  it("정액은 판매가와 무관하다", () => {
    const a = { ...base.agency, mode: "flat" as const, flatAmount: 5_000 };
    expect(agencyFeePerBook(a, 22_000)).toBe(5_000);
    expect(agencyFeePerBook(a, 40_000)).toBe(5_000);
  });

  it("월 고정 + 정률은 권당 정률만 물리고, 고정비는 회수 대상 비용으로 넘어간다", () => {
    const s = withState({
      agency: { mode: "monthlyRate", ratePercent: 5, flatAmount: 0, monthlyFixed: 300_000, months: 6 },
    });
    expect(agencyFeePerBook(s.agency, 20_000)).toBe(1_000);
    expect(computeRecoverCost(s)).toBe(computeProductionCost(s).total + 1_800_000);
  });
});

describe("플랫폼 정산", () => {
  it("판매가 − 할인 − 플랫폼수수료 − 배송비 − 대행수수료", () => {
    const r = computePlatformResult(base.platforms[0], 22_000, base.agency);
    expect(r.discountAmount).toBe(0);
    expect(r.platformFee).toBe(7_700); // 22,000 × 35%
    expect(r.shippingDeducted).toBe(4_000);
    expect(r.agencyFee).toBe(5_000);
    expect(r.net).toBe(22_000 - 7_700 - 4_000 - 5_000);
  });

  it("10% 할인은 판매가에서 차감하되 플랫폼 수수료는 정가 기준이다", () => {
    const p = { ...base.platforms[0], discount: true };
    const r = computePlatformResult(p, 20_000, base.agency);
    expect(r.discountAmount).toBe(2_000);
    expect(r.platformFee).toBe(7_000);
  });

  it("배송비 고객부담이면 정산에서 차감하지 않는다", () => {
    const p = { ...base.platforms[0], shippingPolicy: "customer" as const };
    expect(computePlatformResult(p, 22_000, base.agency).shippingDeducted).toBe(0);
  });

  it("고객부담·정산차감이면 차감한다 (네이버 케이스)", () => {
    const p = { ...base.platforms[1], shippingPolicy: "customerDeducted" as const };
    expect(computePlatformResult(p, 22_000, base.agency).shippingDeducted).toBe(1_000);
  });
});

describe("판매 비중", () => {
  it("합이 100이 아니어도 정규화한다", () => {
    expect(normalizedWeights([3, 1])).toEqual([0.75, 0.25]);
  });

  it("전부 0이면 균등 분배한다", () => {
    expect(normalizedWeights([0, 0])).toEqual([0.5, 0.5]);
    expect(normalizedWeights([0, 0, 0, 0])).toEqual([0.25, 0.25, 0.25, 0.25]);
  });

  it("가중평균 실수령은 각 플랫폼 실수령의 비중 평균이다", () => {
    const s = withState({ weights: [90, 10] });
    const a = computePlatformResult(s.platforms[0], 22_000, s.agency).net;
    const b = computePlatformResult(s.platforms[1], 22_000, s.agency).net;
    expect(weightedNet(s, 22_000)).toBeCloseTo(a * 0.9 + b * 0.1, 6);
  });
});

describe("BEP", () => {
  it("회수 대상 비용 ÷ 권당 실수령을 올림한다", () => {
    const s = withState({ basePrice: 22_000 });
    const row = computeBepRow(s, 22_000);
    expect(row.bep).toBe(Math.ceil(computeRecoverCost(s) / row.net));
  });

  it("실수령이 0 이하면 회수 불가로 표시한다", () => {
    const s = withState({
      agency: { ...base.agency, mode: "flat", flatAmount: 30_000 },
    });
    const row = computeBepRow(s, 10_000);
    expect(row.net).toBeLessThanOrEqual(0);
    expect(row.bep).toBeNull();
    expect(row.overPrintRun).toBe(true);
  });

  it("완판 손익 = 실수령 × 인쇄부수 − 회수 대상 비용", () => {
    const s = withState({ basePrice: 30_000 });
    const row = computeBepRow(s, 30_000);
    expect(row.soldOutProfit).toBe(Math.round(row.net * s.copies - computeRecoverCost(s)));
  });

  it("표는 기준가 ±4,000원 9행이고 기준가 행만 선택된다", () => {
    const rows = computeBepTable(withState({ basePrice: 22_000 }));
    expect(rows).toHaveLength(9);
    expect(rows[0].price).toBe(18_000);
    expect(rows[8].price).toBe(26_000);
    expect(rows.filter((r) => r.selected).map((r) => r.price)).toEqual([22_000]);
  });

  it("기준가가 낮아 음수 가격이 생기면 그 행은 빼고 만든다", () => {
    const rows = computeBepTable(withState({ basePrice: 2_000 }));
    expect(rows.every((r) => r.price > 0)).toBe(true);
  });
});

describe("권장가 역산", () => {
  it("권장가로 계산한 BEP는 목표 부수 이하여야 한다", () => {
    const s = withState({ targetSellRatePercent: 50 });
    const rec = computeRecommendation(s);
    expect(rec.targetUnits).toBe(250);
    expect(rec.price).not.toBeNull();
    const row = computeBepRow(s, rec.price!);
    expect(row.bep).not.toBeNull();
    expect(row.bep!).toBeLessThanOrEqual(rec.targetUnits);
  });

  it("정액 대행 방식에서도 역산이 성립한다", () => {
    const s = withState({
      agency: { ...base.agency, mode: "flat", flatAmount: 5_000 },
      targetSellRatePercent: 30,
    });
    const rec = computeRecommendation(s);
    const row = computeBepRow(s, rec.price!);
    expect(row.bep!).toBeLessThanOrEqual(rec.targetUnits);
  });

  it("수수료 합이 100%를 넘으면 산출 불가를 반환한다", () => {
    const s = withState({
      platforms: base.platforms.map((p) => ({ ...p, feePercent: 60, discount: true })),
      agency: { ...base.agency, mode: "rate", ratePercent: 40 },
    });
    expect(computeRecommendation(s).price).toBeNull();
  });
});

describe("비우기 상태", () => {
  it("모든 금액과 부수가 0이다", () => {
    expect(emptyState.printUnitPrice).toBe(0);
    expect(emptyState.copies).toBe(0);
    expect(emptyState.basePrice).toBe(0);
    expect(emptyState.workFees.every((f) => f.amount === 0 && !f.checked)).toBe(true);
    expect(emptyState.platforms.every((p) => p.feePercent === 0 && p.shippingFee === 0)).toBe(true);
  });

  it("제작비와 회수 대상 비용이 0이고 NaN이 아니다", () => {
    expect(computeProductionCost(emptyState).total).toBe(0);
    expect(computeRecoverCost(emptyState)).toBe(0);
  });

  it("실수령·BEP·완판손익이 NaN/Infinity로 새지 않는다", () => {
    const row = computeBepRow(emptyState, 0);
    expect(Number.isFinite(row.net)).toBe(true);
    expect(row.net).toBe(0);
    expect(row.bep).toBeNull();
    expect(Number.isFinite(row.soldOutProfit)).toBe(true);
    expect(weightedNet(emptyState, 0)).toBe(0);
  });

  it("권장가는 산출 불가로 떨어진다", () => {
    expect(computeRecommendation(emptyState).price).toBeNull();
  });

  it("비중이 전부 0이어도 가중치 합은 1이다", () => {
    const w = normalizedWeights(emptyState.weights);
    expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });
});
