"use client";

import { Card, Note, Stat } from "@/components/ui";
import { computeBepRow, computeRecoverCost } from "@/lib/calc";
import { copies as fmtCopies, num, won, wonSigned } from "@/lib/format";
import type { AppState } from "@/lib/types";

export default function Detail({ state }: { state: AppState }) {
  const row = computeBepRow(state, state.basePrice);
  const recover = computeRecoverCost(state);
  const sellThrough = row.bep === null ? null : (row.bep / state.copies) * 100;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <Stat label="선택 판매 단가" value={won(row.price)} />
        </Card>
        <Card>
          <Stat
            label="권당 저자 실수령"
            value={won(row.net)}
            tone={row.net >= 0 ? "neutral" : "neg"}
            sub={`판매가 대비 ${((row.net / Math.max(1, row.price)) * 100).toFixed(1)}%`}
          />
        </Card>
        <Card>
          <Stat
            label="손익분기점(BEP)"
            value={row.bep === null ? "회수 불가" : `${num(row.bep)} / ${num(state.copies)}권`}
            tone={row.overPrintRun ? "neg" : "neutral"}
            sub={sellThrough === null ? "실수령이 0 이하" : `판매율 ${sellThrough.toFixed(0)}% 지점`}
          />
        </Card>
        <Card tone="navy">
          <Stat
            label="완판 시 저자 손익"
            value={wonSigned(row.soldOutProfit)}
            tone={row.soldOutProfit >= 0 ? "pos" : "neg"}
            inverted
            sub={`${fmtCopies(state.copies)} 전량 판매 기준`}
          />
        </Card>
      </div>

      <Note>
        회수 대상 총비용 {won(recover)} ÷ 권당 실수령 {won(row.net)} = BEP{" "}
        {row.bep === null ? "산출 불가" : `${num(row.bep)}권`}. 완판 손익은 (권당 실수령 ×
        인쇄부수) − 회수 대상 총비용입니다.
      </Note>
    </div>
  );
}
