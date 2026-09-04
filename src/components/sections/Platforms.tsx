"use client";

import { Card, CardTitle, Note, Row, Segmented, SliderField, Stat, Stepper } from "@/components/ui";
import { computePlatformResult, normalizedWeights, weightedNet } from "@/lib/calc";
import { pct, won } from "@/lib/format";
import type { AppState, Platform, ShippingPolicy } from "@/lib/types";

const SHIPPING_OPTIONS: { value: ShippingPolicy; label: string }[] = [
  { value: "author", label: "저자 부담" },
  { value: "customer", label: "고객 부담" },
  { value: "customerDeducted", label: "고객 부담·정산 차감" },
];

function mixDescription(state: AppState, w: number[]): string {
  const parts = state.platforms
    .map((p, i) => ({ name: p.name, share: (w[i] ?? 0) * 100 }))
    .filter((p) => p.share >= 0.5)
    .map((p) => `${p.name}에서 ${Math.round(p.share)}%`);
  if (parts.length === 0) return "판매 비중을 설정해 주세요.";
  return `${parts.join(", ")} 정도 판매되는 것으로 계산합니다.`;
}

export default function Platforms({
  state,
  patch,
}: {
  state: AppState;
  patch: (p: Partial<AppState>) => void;
}) {
  const w = normalizedWeights(state.weights);
  const avgNet = weightedNet(state, state.basePrice);
  const isPair = state.platforms.length === 2;

  const setPlatform = (id: string, p: Partial<Platform>) =>
    patch({
      platforms: state.platforms.map((x) => (x.id === id ? { ...x, ...p } : x)),
    });

  const removePlatform = (idx: number) =>
    patch({
      platforms: state.platforms.filter((_, i) => i !== idx),
      weights: state.weights.filter((_, i) => i !== idx),
    });

  const addPlatform = () =>
    patch({
      platforms: [
        ...state.platforms,
        {
          id: `p${Date.now()}`,
          name: "새 플랫폼",
          feePercent: 20,
          shippingFee: 3000,
          discount: false,
          shippingPolicy: "author",
        },
      ],
      weights: [...state.weights, 10],
    });

  return (
    <div className="grid gap-4">
      <Card tone="quiet">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium text-muted">기준 판매가 (4번 섹션과 연동)</div>
            <div className="tnum text-2xl font-bold tracking-tight text-navy-900">
              {won(state.basePrice)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Stepper dir="-" ariaLabel="기준 판매가 1,000원 감소" onStep={() => patch({ basePrice: Math.max(1000, state.basePrice - 1000) })} />
            <Stepper dir="+" ariaLabel="기준 판매가 1,000원 증가" onStep={() => patch({ basePrice: state.basePrice + 1000 })} />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {state.platforms.map((p, idx) => {
          const r = computePlatformResult(p, state.basePrice, state.agency);
          return (
            <Card key={p.id}>
              <div className="mb-3 flex items-center gap-2">
                <input
                  value={p.name}
                  aria-label="플랫폼 이름"
                  onChange={(e) => setPlatform(p.id, { name: e.target.value })}
                  className="min-w-0 flex-1 rounded-md border border-transparent px-1 py-0.5 text-[14px] font-bold text-navy-900 outline-none hover:border-line focus:border-navy-800"
                />
                <span className="tnum rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-muted">
                  비중 {pct((w[idx] ?? 0) * 100)}
                </span>
                {state.platforms.length > 1 && (
                  <button
                    type="button"
                    aria-label={`${p.name} 삭제`}
                    onClick={() => removePlatform(idx)}
                    className="rounded-md px-1.5 py-0.5 text-[12px] text-muted hover:bg-red-50 hover:text-neg"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-medium text-muted">플랫폼 수수료율</span>
                  <span className="flex overflow-hidden rounded-lg border border-line bg-white focus-within:border-navy-800">
                    <input
                      type="number"
                      value={p.feePercent}
                      step={1}
                      min={0}
                      max={100}
                      onChange={(e) => setPlatform(p.id, { feePercent: Math.max(0, Number(e.target.value) || 0) })}
                      className="tnum w-full min-w-0 bg-transparent px-2 py-1.5 text-right text-[14px] font-semibold outline-none"
                    />
                    <span className="flex items-center bg-slate-50 px-2 text-[11px] text-muted">%</span>
                  </span>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-medium text-muted">배송비</span>
                  <span className="flex overflow-hidden rounded-lg border border-line bg-white focus-within:border-navy-800">
                    <input
                      type="number"
                      value={p.shippingFee}
                      step={500}
                      min={0}
                      onChange={(e) => setPlatform(p.id, { shippingFee: Math.max(0, Number(e.target.value) || 0) })}
                      className="tnum w-full min-w-0 bg-transparent px-2 py-1.5 text-right text-[14px] font-semibold outline-none"
                    />
                    <span className="flex items-center bg-slate-50 px-2 text-[11px] text-muted">원</span>
                  </span>
                </label>
              </div>

              <div className="mt-3 grid gap-2">
                <div>
                  <span className="mb-1 block text-[11px] font-medium text-muted">판매 방식</span>
                  <Segmented
                    size="sm"
                    options={[
                      { value: "list", label: "정가" },
                      { value: "disc", label: "10% 할인" },
                    ]}
                    value={p.discount ? "disc" : "list"}
                    onChange={(v) => setPlatform(p.id, { discount: v === "disc" })}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-[11px] font-medium text-muted">배송비 처리</span>
                  <Segmented
                    size="sm"
                    options={SHIPPING_OPTIONS}
                    value={p.shippingPolicy}
                    onChange={(v) => setPlatform(p.id, { shippingPolicy: v })}
                  />
                </div>
              </div>

              <div className="mt-3 border-t border-line pt-2">
                <Row label="판매가" value={won(r.price)} />
                <Row label="할인 금액" value={r.discountAmount ? `−${won(r.discountAmount)}` : "—"} tone={r.discountAmount ? "neg" : "neutral"} />
                <Row label={`플랫폼 수수료 (${p.feePercent}%)`} value={`−${won(r.platformFee)}`} tone="neg" />
                <Row
                  label="배송비"
                  value={r.shippingDeducted ? `−${won(r.shippingDeducted)}` : "차감 없음"}
                  tone={r.shippingDeducted ? "neg" : "neutral"}
                />
                <Row label="판매대행 수수료" value={r.agencyFee ? `−${won(r.agencyFee)}` : "—"} tone={r.agencyFee ? "neg" : "neutral"} />
                <Row
                  label="권당 저자 실수령"
                  value={won(r.net)}
                  tone={r.net >= 0 ? "pos" : "neg"}
                  strong
                />
              </div>
            </Card>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addPlatform}
        className="rounded-lg border border-dashed border-line bg-white/60 py-2 text-[12px] font-medium text-muted transition-colors hover:border-navy-800 hover:text-navy-800"
      >
        + 플랫폼 추가
      </button>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>판매 비중</CardTitle>
          {isPair ? (
            <SliderField
              label={`${state.platforms[0].name} ↔ ${state.platforms[1].name}`}
              value={state.weights[0]}
              display={`${Math.round((w[0] ?? 0) * 100)} : ${Math.round((w[1] ?? 0) * 100)}`}
              min={0}
              max={100}
              step={5}
              onChange={(v) => patch({ weights: [v, 100 - v] })}
              hint={mixDescription(state, w)}
            />
          ) : (
            <div className="grid gap-3">
              {state.platforms.map((p, i) => (
                <SliderField
                  key={p.id}
                  label={p.name}
                  value={state.weights[i] ?? 0}
                  display={pct((w[i] ?? 0) * 100)}
                  min={0}
                  max={100}
                  step={5}
                  onChange={(v) =>
                    patch({ weights: state.weights.map((x, j) => (j === i ? v : x)) })
                  }
                />
              ))}
              <Note>{mixDescription(state, w)}</Note>
            </div>
          )}
        </Card>

        <Card tone="navy">
          <Stat
            label="예상 평균 권당 저자 실수령"
            value={won(avgNet)}
            size="lg"
            tone={avgNet >= 0 ? "neutral" : "neg"}
            inverted
            sub={`기준 판매가 ${won(state.basePrice)} · 판매 비중 가중평균`}
          />
        </Card>
      </div>
    </div>
  );
}
