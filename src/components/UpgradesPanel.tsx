import React from 'react';
import { motion } from 'motion/react';
import { Upgrade } from '../types';
import { Zap, Cpu, Award, Milestone, Coins } from 'lucide-react';

interface UpgradesPanelProps {
  points: number;
  upgrades: Upgrade[];
  onBuyUpgrade: (upgradeId: string) => void;
}

export default function UpgradesPanel({
  points,
  upgrades,
  onBuyUpgrade
}: UpgradesPanelProps) {
  // Helper to resolve icon based on upgrade name or type
  const getUpgradeIcon = (iconName: string) => {
    switch (iconName) {
      case 'zap':
        return <Zap className="w-5 h-5 text-amber-500" />;
      case 'cpu':
        return <Cpu className="w-5 h-5 text-indigo-500" />;
      case 'milestone':
        return <Milestone className="w-5 h-5 text-teal-500" />;
      case 'award':
        return <Award className="w-5 h-5 text-rose-500" />;
      default:
        return <Coins className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight font-sans">
            포인트 연구소 & 상점
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            보유한 포인트로 성능을 업그레이드하고 자동 수익을 늘리세요.
          </p>
        </div>
      </div>

      {/* Upgrade Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {upgrades.map((upgrade) => {
          const isAffordable = points >= upgrade.cost;

          return (
            <motion.div
              key={upgrade.id}
              whileHover={{ y: isAffordable ? -2 : 0 }}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isAffordable
                  ? 'bg-slate-50/50 border-slate-100 hover:bg-slate-50 hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-50/20'
                  : 'bg-slate-50/20 border-slate-100 opacity-60'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100/80">
                      {getUpgradeIcon(upgrade.iconName)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 font-sans">
                        {upgrade.name}
                      </h3>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                        보유: {upgrade.count}개
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-medium block">
                      효과
                    </span>
                    <span className="text-xs font-bold text-emerald-600 font-mono">
                      {upgrade.type === 'click' ? `클릭 +${upgrade.effect}` : `초당 +${upgrade.effect} P`}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 font-sans leading-relaxed min-h-[32px] mb-4">
                  {upgrade.description}
                </p>
              </div>

              {/* Action Button */}
              <button
                id={`btn_upgrade_buy_${upgrade.id}`}
                onClick={() => onBuyUpgrade(upgrade.id)}
                disabled={!isAffordable}
                className={`w-full py-2 px-3 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isAffordable
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>{upgrade.cost.toLocaleString()} P 소모하여 업그레이드</span>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
