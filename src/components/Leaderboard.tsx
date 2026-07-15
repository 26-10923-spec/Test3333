import React from 'react';
import { LeaderboardEntry } from '../types';
import { Trophy, Award, TrendingUp, Sparkles } from 'lucide-react';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUsername: string;
}

export default function Leaderboard({ entries, currentUsername }: LeaderboardProps) {
  // Sort entries by points descending
  const sortedEntries = [...entries].sort((a, b) => b.points - a.points);

  // Helper to get rank badge
  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-extrabold text-xs">
            🥇
          </div>
        );
      case 1:
        return (
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-extrabold text-xs">
            🥈
          </div>
        );
      case 2:
        return (
          <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center text-amber-700 font-extrabold text-xs">
            🥉
          </div>
        );
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center font-mono text-xs font-semibold text-slate-400">
            {index + 1}
          </span>
        );
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-800 tracking-tight font-sans">
            실시간 어큐뮬레이터 랭킹
          </h2>
        </div>
        <p className="text-xs text-slate-400 font-sans mb-5 leading-relaxed">
          서버에 등록된 모든 플레이어와 자율 마이닝 봇들의 실시간 포인트 경쟁을 보여줍니다!
        </p>

        {/* Leaderboard Table */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {sortedEntries.map((entry, index) => {
            const isSelf = entry.username === currentUsername;

            return (
              <div
                key={entry.username}
                className={`flex items-center justify-between p-3 rounded-xl border transition ${
                  isSelf
                    ? 'bg-indigo-50/50 border-indigo-100 shadow-sm'
                    : 'bg-slate-50/40 border-slate-100/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getRankBadge(index)}

                  <div>
                    <span className={`text-xs font-bold font-sans flex items-center gap-1 ${
                      isSelf ? 'text-indigo-600' : 'text-slate-700'
                    }`}>
                      {entry.username}
                      {isSelf && (
                        <span className="text-[9px] font-black bg-indigo-600 text-white px-1 py-0.25 rounded">
                          ME
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      LV. {entry.level}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black font-mono text-slate-800">
                    {entry.points.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 block font-mono uppercase">
                    Points
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4 mt-4">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span>점수를 올려 다른 경쟁자들을 밀어내세요!</span>
        </div>
      </div>
    </div>
  );
}
