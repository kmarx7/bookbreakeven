"use client";

import { Card, CardTitle, CheckRow, NumberField, Row, SliderField, Stat, Toggle } from "@/components/ui";
import { computeProductionCost } from "@/lib/calc";
import { copies as fmtCopies, won } from "@/lib/format";
import type { AppState } from "@/lib/types";

export default function Production({
  state,
  patch,
}: {
  state: AppState;
  patch: (p: Partial<AppState>) => void;
}) {
  const cost = computeProductionCost(state);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardTitle>인쇄 · 디자인</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label="인쇄 단가"
            value={state.printUnitPrice}
            step={1}
            onChange={(v) => patch({ printUnitPrice: v })}
            hint="1권을 찍는 데 드는 단가"
          />
          <NumberField
            label="내지 디자인비"
            value={state.interiorDesignCost}
            step={10000}
            onChange={(v) => patch({ interiorDesignCost: v })}
            hint="부수와 무관한 1회성 비용"
          />
        </div>

        <div className="mt-4">
          <SliderField
            label="인쇄 부수"
            value={state.copies}
            display={fmtCopies(state.copies)}
            min={100}
            max={5000}
            step={100}
            onChange={(v) => patch({ copies: v })}
          />
        </div>

        <div className="mt-4 border-t border-line pt-3">
          <CardTitle>업무비 항목</CardTitle>
          {state.workFees.map((fee) => (
            <CheckRow
              key={fee.id}
              checked={fee.checked}
              onChange={(checked) =>
                patch({
                  workFees: state.workFees.map((f) =>
                    f.id === fee.id ? { ...f, checked } : f,
                  ),
                })
              }
              label={fee.label}
              right={
                <input
                  type="number"
                  aria-label={`${fee.label} 금액`}
                  value={fee.amount}
                  step={10000}
                  min={0}
                  onChange={(e) =>
                    patch({
                      workFees: state.workFees.map((f) =>
                        f.id === fee.id
                          ? { ...f, amount: Math.max(0, Number(e.target.value) || 0) }
                          : f,
                      ),
                    })
                  }
                  className={`tnum w-28 rounded-md border border-line px-2 py-1 text-right text-[13px] font-semibold outline-none focus:border-navy-800 ${
                    fee.checked ? "text-ink" : "text-slate-400"
                  }`}
                />
              }
            />
          ))}
        </div>

        <div className="mt-4 border-t border-line pt-3">
          <Toggle
            checked={state.publisherShareOn}
            onChange={(v) => patch({ publisherShareOn: v })}
            label="기획사 제작비 일부 부담"
          />
          {state.publisherShareOn && (
            <div className="mt-3">
              <NumberField
                label="기획사 분담액"
                value={state.publisherShareAmount}
                step={100000}
                onChange={(v) => patch({ publisherShareAmount: v })}
                hint="총 제작비에서 차감됩니다"
              />
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:content-start">
        <Card>
          <Stat label="총 인쇄비" value={won(cost.printTotal)} sub={`${won(state.printUnitPrice)} × ${fmtCopies(state.copies)}`} />
        </Card>
        <Card tone="navy">
          <Stat label="총 제작비 합계 (저자 부담)" value={won(cost.total)} size="lg" inverted />
          <div className="mt-3 border-t border-white/15 pt-2 text-[11.5px] text-slate-300">
            <div className="flex justify-between py-0.5">
              <span>인쇄비</span>
              <span className="tnum">{won(cost.printTotal)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>내지 디자인비</span>
              <span className="tnum">{won(cost.interiorDesignCost)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>업무비</span>
              <span className="tnum">{won(cost.workFeeTotal)}</span>
            </div>
            {cost.publisherShare > 0 && (
              <div className="flex justify-between py-0.5 text-red-300">
                <span>기획사 부담</span>
                <span className="tnum">−{won(cost.publisherShare)}</span>
              </div>
            )}
          </div>
        </Card>
        <Card tone="quiet">
          <Row label="권당 제작 원가" value={won(cost.total / Math.max(1, state.copies))} />
        </Card>
      </div>
    </div>
  );
}
