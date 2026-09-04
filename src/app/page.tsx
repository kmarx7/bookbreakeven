"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Agency from "@/components/sections/Agency";
import Bep from "@/components/sections/Bep";
import Detail from "@/components/sections/Detail";
import Platforms from "@/components/sections/Platforms";
import Production from "@/components/sections/Production";
import { Section } from "@/components/ui";
import { computeBepRow } from "@/lib/calc";
import { STORAGE_KEY, emptyState, initialState } from "@/lib/defaults";
import { num, won, wonSigned } from "@/lib/format";
import type { AppState } from "@/lib/types";

function PresetButton({
  label,
  doneLabel,
  alreadyLabel,
  title,
  state,
  onClick,
}: {
  label: string;
  doneLabel: string;
  alreadyLabel: string;
  title: string;
  state: "done" | "already" | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
        state === "done"
          ? "border-sky-300/60 bg-sky-300/15 text-sky-200"
          : state === "already"
            ? "border-white/25 bg-white/10 text-slate-300"
            : "border-white/25 text-slate-200 hover:bg-white/10"
      }`}
    >
      {state === "done" ? doneLabel : state === "already" ? alreadyLabel : label}
    </button>
  );
}

export default function Page() {
  const [state, setState] = useState<AppState>(initialState);
  const [restored, setRestored] = useState(false);
  const [feedback, setFeedback] = useState<{
    target: "empty" | "default";
    kind: "done" | "already";
  } | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<AppState>;
        // localStorage는 외부 시스템이고, 서버에서 프리렌더된 기본값과 하이드레이션을
        // 맞추려면 초기화 함수가 아니라 마운트 후에 한 번 덮어써야 한다.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState((prev) => ({ ...prev, ...saved }));
      }
    } catch {
      /* 저장값이 깨졌으면 기본값으로 시작한다 */
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* 사생활 보호 모드 등 저장 불가 — 계산에는 영향 없음 */
    }
  }, [state, restored]);

  const patch = useCallback(
    (p: Partial<AppState>) => setState((prev) => ({ ...prev, ...p })),
    [],
  );

  const serialized = useMemo(() => JSON.stringify(state), [state]);
  const isDefault = serialized === JSON.stringify(initialState);
  const isEmpty = serialized === JSON.stringify(emptyState);

  /**
   * 두 버튼 모두 항상 눌리게 둔다. 비활성화하면 그것대로 "고장난 버튼"으로 읽히므로,
   * 바꿀 것이 없을 때는 그 사실을 응답으로 알려주는 편이 낫다.
   */
  const applyPreset = (target: "empty" | "default") => {
    const already = target === "empty" ? isEmpty : isDefault;
    if (already) {
      setFeedback({ target, kind: "already" });
      return;
    }
    setState(target === "empty" ? emptyState : initialState);
    setFeedback({ target, kind: "done" });
    if (target === "default") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* noop */
      }
    }
  };

  useEffect(() => {
    if (!feedback) return;
    const id = window.setTimeout(() => setFeedback(null), 1600);
    return () => window.clearTimeout(id);
  }, [feedback]);

  const current = computeBepRow(state, state.basePrice);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-navy-900 bg-navy-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="text-[15px] font-bold tracking-tight">
              📚 출판 저자 손익분기(BEP) 계산기
            </h1>
            <p className="text-[11px] text-slate-300">
              인쇄부수 · 판매가 · 판매채널을 바꿔가며 권당 실수령과 손익분기 부수를 비교합니다
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] text-slate-300">기준가 / 권당 실수령</div>
              <div className="tnum text-[13px] font-bold">
                {won(state.basePrice)} · {won(current.net)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-300">BEP / 완판 손익</div>
              <div className="tnum text-[13px] font-bold">
                {current.bep === null ? "회수 불가" : `${num(current.bep)}권`} ·{" "}
                <span className={current.soldOutProfit >= 0 ? "text-sky-300" : "text-red-300"}>
                  {wonSigned(current.soldOutProfit)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <PresetButton
                label="비우기"
                doneLabel="비웠음 ✓"
                alreadyLabel="이미 비어 있음"
                title="모든 금액과 부수를 0으로 만듭니다"
                state={feedback?.target === "empty" ? feedback.kind : null}
                onClick={() => applyPreset("empty")}
              />
              <PresetButton
                label="기본값"
                doneLabel="기본값 ✓"
                alreadyLabel="이미 기본값"
                title="예시 수치로 되돌립니다"
                state={feedback?.target === "default" ? feedback.kind : null}
                onClick={() => applyPreset("default")}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-6">
        <Section index={1} emoji="🖨️" title="제작 비용 산출" desc="저자 부담">
          <Production state={state} patch={patch} />
        </Section>

        <Section index={2} emoji="🤝" title="판매대행 수수료">
          <Agency state={state} patch={patch} />
        </Section>

        <Section index={3} emoji="🛒" title="판매 플랫폼 정산" desc="선택 가격 기준">
          <Platforms state={state} patch={patch} />
        </Section>

        <Section index={4} emoji="📖" title="가격대별 BEP 분석">
          <Bep state={state} patch={patch} />
        </Section>

        <Section index={5} emoji="🎯" title="선택 가격 상세 분석">
          <Detail state={state} />
        </Section>

        <footer className="border-t border-line pt-4 pb-8 text-[11px] leading-relaxed text-muted">
          모든 입력값은 이 브라우저에만 저장되며 서버로 전송되지 않습니다. 부가세, 인지세,
          반품·파본 손실은 계산에 포함되지 않으므로 실제 정산과 차이가 날 수 있습니다.
        </footer>
      </main>
    </div>
  );
}
