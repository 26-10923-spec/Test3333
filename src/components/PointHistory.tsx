import React from 'react';
import { Transaction } from '../types';
import { History, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface PointHistoryProps {
  transactions: Transaction[];
}

export default function PointHistory({ transactions }: PointHistoryProps) {
  // Sort transactions by timestamp descending
  const sortedTx = [...transactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-indigo-500" />
        <h2 className="text-base font-bold text-slate-800 tracking-tight font-sans">
          포인트 트랜잭션 기록
        </h2>
      </div>

      <p className="text-xs text-slate-400 font-sans mb-5 leading-relaxed">
        플레이어가 포인트를 쌓거나 업그레이드에 사용한 모든 내역이 타임스탬프와 함께 로깅됩니다.
      </p>

      {/* Transaction List */}
      <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px] pr-1">
        {sortedTx.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Clock className="w-8 h-8 opacity-40 mb-2" />
            <span className="text-xs font-sans">아직 포인트 거래 기록이 없습니다.</span>
          </div>
        ) : (
          sortedTx.map((tx) => {
            const isGain = tx.type === 'earn';

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-50 bg-slate-50/20 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${
                    isGain ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {isGain ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-700 block font-sans">
                      {tx.description}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <span className={`text-xs font-black font-mono ${
                  isGain ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {isGain ? '+' : ''}{tx.amount.toLocaleString()} P
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
