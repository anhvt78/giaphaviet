"use client";
import React, { useMemo } from "react";

const GENERATION_LABELS = {
  1: "Tiên tổ", 2: "Nhị đại tôn", 3: "Tam đại tôn", 4: "Tứ đại tôn",
  5: "Ngũ đại tôn", 6: "Lục đại tôn", 7: "Thất đại tôn", 8: "Bát đại tôn",
  9: "Cửu đại tôn", 10: "Thập đại tôn",
};

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function getDaysUntil(deathDateStr) {
  if (!deathDateStr) return null;
  try {
    const death = new Date(deathDateStr);
    if (isNaN(death)) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisYear = today.getFullYear();
    let anniversary = new Date(thisYear, death.getMonth(), death.getDate());
    if (anniversary < today) {
      anniversary = new Date(thisYear + 1, death.getMonth(), death.getDate());
    }
    return Math.round((anniversary - today) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function StatCard({ label, value }) {
  return (
    <div className="relative bg-[var(--t-bg-card)] border border-[var(--t-border)]/30 px-4 py-4">
      <span className="classical-decor absolute top-0 left-0 w-2 h-2 border-t border-l border-[var(--t-accent)]/50" />
      <span className="classical-decor absolute top-0 right-0 w-2 h-2 border-t border-r border-[var(--t-accent)]/50" />
      <span className="classical-decor absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[var(--t-accent)]/50" />
      <span className="classical-decor absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[var(--t-accent)]/50" />
      <p className="text-[var(--t-text-3)] text-[10px] uppercase tracking-wider font-bold mb-1">{label}</p>
      <p className="text-[var(--t-text)] text-2xl font-bold">{value}</p>
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="h-px flex-1 bg-[var(--t-border)]/40" />
      <h2 className="text-[var(--t-text-3)] text-[10px] font-bold uppercase tracking-[0.3em]">{children}</h2>
      <div className="h-px flex-1 bg-[var(--t-border)]/40" />
    </div>
  );
}

function AnniversaryCard({ person, daysUntil }) {
  const urgent = daysUntil <= 7;
  return (
    <div className={`relative flex items-center gap-3 px-4 py-3 border ${
      urgent
        ? "border-red-700/40 bg-red-900/10"
        : "border-amber-700/30 bg-amber-900/5"
    }`}>
      <span className={`classical-decor absolute top-0 left-0 w-1.5 h-1.5 border-t border-l ${urgent ? "border-red-500/60" : "border-amber-500/60"}`} />
      <span className={`classical-decor absolute top-0 right-0 w-1.5 h-1.5 border-t border-r ${urgent ? "border-red-500/60" : "border-amber-500/60"}`} />
      <span className={`classical-decor absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l ${urgent ? "border-red-500/60" : "border-amber-500/60"}`} />
      <span className={`classical-decor absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r ${urgent ? "border-red-500/60" : "border-amber-500/60"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[var(--t-text)] font-bold text-sm truncate">{person.name}</p>
        <p className="text-[var(--t-text-3)] text-[10px]">Ngày mất: {fmtDate(person.deathDate)}</p>
      </div>
      <div className={`text-center flex-shrink-0 ${urgent ? "text-red-400" : "text-amber-500"}`}>
        <p className="text-xl font-bold leading-none">{daysUntil}</p>
        <p className="text-[9px] uppercase tracking-wide">ngày nữa</p>
      </div>
    </div>
  );
}

export default function GenealogyStatisticsForm({ clanItem, familyData, setTabIndex }) {
  const stats = useMemo(() => {
    if (!familyData) return null;
    const members = familyData.filter((m) => !m.isSpouse);
    const spouses = familyData.filter((m) => m.isSpouse);
    const deceased = members.filter((m) => m.isDeceased);
    const living = members.filter((m) => !m.isDeceased);
    const male = members.filter((m) => m.gender === "male");
    const female = members.filter((m) => m.gender === "female");
    const genCounts = {};
    members.forEach((m) => {
      const g = m.generation || 1;
      genCounts[g] = (genCounts[g] || 0) + 1;
    });
    return {
      total: members.length, spouses: spouses.length,
      deceased: deceased.length, living: living.length,
      male: male.length, female: female.length, genCounts,
    };
  }, [familyData]);

  const anniversaries = useMemo(() => {
    if (!familyData) return [];
    return familyData
      .filter((m) => m.isDeceased && m.deathDate)
      .map((m) => ({ ...m, daysUntil: getDaysUntil(m.deathDate) }))
      .filter((m) => m.daysUntil !== null && m.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [familyData]);

  const upcoming7  = anniversaries.filter((m) => m.daysUntil <= 7);
  const upcoming30 = anniversaries.filter((m) => m.daysUntil > 7);

  const maxGen   = stats ? Math.max(0, ...Object.keys(stats.genCounts).map(Number)) : 0;
  const maxCount = stats ? Math.max(1, ...Object.values(stats.genCounts)) : 1;

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--t-bg)]" style={{ scrollbarWidth: "thin" }}>
      {/* Header */}
      <div className="bg-[var(--t-bg-panel)] relative px-6 py-4">
        <div className="classical-decor absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[var(--t-accent)] via-[var(--t-accent-lt)] to-[var(--t-accent)]" />
        <div className="classical-decor absolute bottom-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[var(--t-accent)] via-[var(--t-accent-lt)] to-[var(--t-accent)]" />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[var(--t-text-inv)] font-bold text-lg uppercase tracking-[0.2em]">Thống Kê Gia Phả</h1>
            {clanItem?.clanName && (
              <p className="text-[var(--t-accent)] text-[11px] uppercase tracking-wider mt-0.5">{clanItem.clanName}</p>
            )}
          </div>
          <button
            onClick={() => setTabIndex(0)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--t-accent)]/40 text-[var(--t-accent)] hover:bg-[var(--t-accent)]/10 text-[10px] font-bold uppercase tracking-wider transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Quay lại
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {stats && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Tổng thành viên" value={stats.total} />
              <StatCard label="Còn sống" value={stats.living} />
              <StatCard label="Đã mất" value={stats.deceased} />
              <StatCard label="Hôn phối" value={stats.spouses} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Nam" value={stats.male} />
              <StatCard label="Nữ" value={stats.female} />
            </div>
          </>
        )}

        {stats && maxGen > 0 && (
          <div>
            <SectionHeader>Phân bố theo đời</SectionHeader>
            <div className="bg-[var(--t-bg-card)] border border-[var(--t-border)]/30 p-4 space-y-2">
              {Array.from({ length: maxGen }, (_, i) => i + 1).map((gen) => {
                const count = stats.genCounts[gen] || 0;
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={gen} className="flex items-center gap-2">
                    <span className="text-[var(--t-text-3)] text-[9px] w-20 text-right flex-shrink-0">
                      {GENERATION_LABELS[gen] || `Đời ${gen}`}
                    </span>
                    <div className="flex-1 h-4 bg-[var(--t-bg-muted)] relative">
                      <div
                        className="h-full bg-[var(--t-primary)] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[var(--t-text-2)] text-[10px] font-bold w-6 text-right flex-shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {anniversaries.length > 0 ? (
          <div>
            <SectionHeader>Ngày giỗ sắp đến</SectionHeader>
            {upcoming7.length > 0 && (
              <div className="mb-3">
                <p className="text-red-400 text-[9px] font-bold uppercase tracking-wider mb-2">Tuần tới</p>
                <div className="space-y-2">
                  {upcoming7.map((m) => (
                    <AnniversaryCard key={m.id} person={m} daysUntil={m.daysUntil} />
                  ))}
                </div>
              </div>
            )}
            {upcoming30.length > 0 && (
              <div>
                <p className="text-amber-500 text-[9px] font-bold uppercase tracking-wider mb-2">Tháng tới</p>
                <div className="space-y-2">
                  {upcoming30.map((m) => (
                    <AnniversaryCard key={m.id} person={m} daysUntil={m.daysUntil} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : familyData ? (
          <div>
            <SectionHeader>Ngày giỗ sắp đến</SectionHeader>
            <p className="text-[var(--t-text-3)] text-sm text-center py-4">Không có ngày giỗ trong 30 ngày tới</p>
          </div>
        ) : (
          <p className="text-[var(--t-text-3)] text-sm text-center py-8">Đang tải dữ liệu gia phả...</p>
        )}
      </div>
    </div>
  );
}
