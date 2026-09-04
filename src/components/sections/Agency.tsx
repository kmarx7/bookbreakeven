"use client";

import { Card, CardTitle, NumberField, Note, Segmented, SliderField, Stat } from "@/components/ui";
import { agencyFeePerBook, agencyFixedTotal, agencyMonthlyFixed } from "@/lib/calc";
import { won } from "@/lib/format";
import type { AgencyMode, AppState } from "@/lib/types";

const MODES: { value: AgencyMode; label: string }[] = [
  { value: "rate", label: "A. 정률" },
  { value: "flat", label: "B. 정액" },
  { value: "monthlyRate", label: "C. 월 고정 + 정률" },
];

export default function Agency({
  state,
  patch,
}: {
  state: AppState;
  patch: (p: Partial<AppState>) => void;
}) {
  const { agency, basePrice } = state;
  const setAgency = (p: Partial<AppState["agency"]>) =>
    patch({ agency: { ...agency, ...p } });

  const perBook = agencyFeePerBook(agency, basePrice);
  const monthly = agencyMonthlyFixed(agency);
  const fixedTotal = agencyFixedTotal(agency);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardTitle>수수료 방식</CardTitle>
        <Segmented
          options={MODES}
          value={agency.mode}
          onChange={(mode) => setAgency({ mode })}
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {agency.mode === "rate" && (
            <NumberField
              label="권당 수수료율"
              value={agency.ratePercent}
              suffix="%"
              step={1}
              onChange={(v) => setAgency({ ratePercent: v })}
              hint="판매가 기준"
            />
          )}

          {agency.mode === "flat" && (
            <NumberField
              label="권당 고정 수수료"
              value={agency.flatAmount}
              step={500}
              onChange={(v) => setAgency({ flatAmount: v })}
              hint="판매가와 무관한 정액"
            />
          )}

          {agency.mode === "monthlyRate" && (
            <>
              <NumberField
                label="월 고정비"
                value={agency.monthlyFixed}
                step={50000}
                onChange={(v) => setAgency({ monthlyFixed: v })}
              />
              <NumberField
                label="권당 수수료율"
                value={agency.ratePercent}
                suffix="%"
                step={1}
                onChange={(v) => setAgency({ ratePercent: v })}
              />
              <div className="sm:col-span-2">
                <SliderField
                  label="판매 예상 기간"
                  value={agency.months}
                  display={`${agency.months}개월`}
                  min={1}
                  max={36}
                  step={1}
                  onChange={(v) => setAgency({ months: v })}
                  hint={`월 고정비 × 기간 = ${won(fixedTotal)} 이 BEP 회수 대상 비용에 포함됩니다.`}
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-4">
          <Note>
            여기서 정한 수수료는 3번 플랫폼 정산과 4번 BEP 표에 공통으로 적용됩니다.
            권당 수수료는 현재 기준 판매가 {won(basePrice)} 기준으로 표시됩니다.
          </Note>
        </div>
      </Card>

      <div className="grid gap-4 lg:content-start">
        <Card>
          <Stat label="권당 수수료" value={won(perBook)} />
        </Card>
        <Card>
          <Stat
            label="총 월 고정비"
            value={won(monthly)}
            sub={
              monthly > 0
                ? `${agency.months}개월 = ${won(fixedTotal)} (BEP에 반영)`
                : "현재 방식에는 월 고정비 없음"
            }
          />
        </Card>
      </div>
    </div>
  );
}
