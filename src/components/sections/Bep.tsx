"use client";

import { Card, CardTitle, Note, SliderField, Stat } from "@/components/ui";
import {
  agencyFixedTotal,
  computeBepTable,
  computeProductionCost,
  computeRecommendation,
  computeRecoverCost,
} from "@/lib/calc";
import { copies as fmtCopies, num, won, wonSigned } from "@/lib/format";
import type { AppState } from "@/lib/types";

export default function Bep({
  state,
  patch,
}: {
  state: AppState;
  patch: (p: Partial<AppState>) => void;
}) {
  const rec = computeRecommendation(state);
  const rows = computeBepTable(state);
  const production = computeProductionCost(state);
  const agencyFixed = agencyFixedTotal(state.agency);
  const recover = computeRecoverCost(state);
  const anyOver = rows.some((r) => r.overPrintRun);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>참고 권장가</CardTitle>
          <SliderField
            label="목표 판매율"
            value={state.targetSellRatePercent}
            display={`${state.targetSellRatePercent}% · ${fmtCopies(rec.targetUnits)}`}
            min={5}
            max={100}
            step={5}
            onChange={(v) => patch({ targetSellRatePercent: v })}
            hint={`인쇄 ${fmtCopies(state.copies)} 중 ${fmtCopies(rec.targetUnits)}을 팔면 손익분기가 되는 가격을 권장가로 제시합니다.`}
          />

          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-3">
            <Stat
              label="권장 판매가"
              value={rec.price === null ? "산출 불가" : won(rec.price)}
              sub={`권당 필요 실수령 ${won(rec.requiredNet)}`}
              tone={rec.price === null ? "neg" : "neutral"}
            />
            <button
              type="button"
              disabled={rec.price === null}
              onClick={() => rec.price !== null && patch({ basePrice: rec.price })}
              className="rounded-lg bg-navy-900 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              권장가를 기준 금액으로
            </button>
          </div>
          {rec.price === null && (
            <div className="mt-3">
              <Note tone="warn">
                할인·플랫폼 수수료·판매대행 정률의 합이 100% 이상이라 가격을 올려도
                실수령이 늘지 않습니다. 수수료 구조를 먼저 조정해야 합니다.
              </Note>
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>기준 판매가</CardTitle>
          <SliderField
            label="판매가"
            value={state.basePrice}
            display={won(state.basePrice)}
            min={5000}
            max={100000}
            step={1000}
            onChange={(v) => patch({ basePrice: v })}
            hint="설정한 금액을 기준으로 ±4,000원(1,000원 간격) 구간의 BEP를 아래 표에서 비교합니다."
          />
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3">
            <Stat label="총 제작비" value={won(production.total)} size="sm" />
            <Stat
              label="회수 대상 총비용"
              value={won(recover)}
              size="sm"
              sub={agencyFixed > 0 ? `제작비 + 대행 고정비 ${won(agencyFixed)}` : "제작비와 동일"}
            />
          </div>
        </Card>
      </div>

      <Card className="!p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <caption className="sr-only">
              기준 판매가 ±4,000원 구간의 손익분기 비교표. 행을 선택하면 기준 판매가가 바뀝니다.
            </caption>
            <thead>
              <tr className="bg-navy-900 text-white">
                <th scope="col" className="px-3 py-2.5 text-left text-[12px] font-semibold">판매 단가</th>
                <th scope="col" className="px-3 py-2.5 text-right text-[12px] font-semibold">권당 저자 실수령</th>
                <th scope="col" className="px-3 py-2.5 text-right text-[12px] font-semibold">손익분기(BEP)</th>
                <th scope="col" className="px-3 py-2.5 text-right text-[12px] font-semibold">완판 시 손익</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.price}
                  tabIndex={0}
                  role="button"
                  aria-pressed={r.selected}
                  onClick={() => patch({ basePrice: r.price })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      patch({ basePrice: r.price });
                    }
                  }}
                  className={`cursor-pointer border-b border-line transition-colors last:border-b-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                    r.selected ? "bg-navy-900/[0.06]" : "hover:bg-slate-50"
                  }`}
                >
                  <td className="px-3 py-2.5">
                    <span className="tnum font-semibold text-navy-900">{won(r.price)}</span>
                    {r.selected && (
                      <span className="ml-2 rounded-full bg-navy-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        선택
                      </span>
                    )}
                  </td>
                  <td className="tnum px-3 py-2.5 text-right font-medium">
                    {r.net > 0 ? won(r.net) : <span className="text-neg">{won(r.net)}</span>}
                  </td>
                  <td
                    className={`tnum px-3 py-2.5 text-right font-semibold ${
                      r.overPrintRun ? "text-neg" : "text-ink"
                    }`}
                  >
                    {r.bep === null ? "회수 불가" : `${num(r.bep)}권`}
                  </td>
                  <td
                    className={`tnum px-3 py-2.5 text-right font-semibold ${
                      r.soldOutProfit >= 0 ? "text-pos" : "text-neg"
                    }`}
                  >
                    {wonSigned(r.soldOutProfit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-2">
        <Note>행을 클릭하면 그 가격이 기준 판매가가 되고, 3번·5번 섹션이 함께 갱신됩니다.</Note>
        {anyOver && (
          <Note tone="warn">
            붉은 BEP는 인쇄부수({fmtCopies(state.copies)})를 초과 → 완판해도 원가 회수 불가.
          </Note>
        )}
      </div>
    </div>
  );
}
