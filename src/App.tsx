import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, LogOut, User as UserIcon, Zap, Sparkles, TrendingUp, Award, RefreshCw } from 'lucide-react';
import { User, Upgrade, Transaction, LeaderboardEntry } from './types';

// Component Imports
import LoginScreen from './components/LoginScreen';
import PointClicker from './components/PointClicker';
import UpgradesPanel from './components/UpgradesPanel';
import MiniGames from './components/MiniGames';
import Leaderboard from './components/Leaderboard';
import PointHistory from './components/PointHistory';

const DEFAULT_UPGRADES: Upgrade[] = [
  {
    id: 'click_power_1',
    name: '나노 햅틱 장갑 (Click)',
    description: '클릭당 획득하는 포인트를 증가시킵니다.',
    cost: 50,
    effect: 1,
    count: 0,
    type: 'click',
    iconName: 'zap'
  },
  {
    id: 'passive_miner_1',
    name: '자동 루적 매크로 (Passive)',
    description: '매 초당 자동으로 1포인트를 마이닝합니다.',
    cost: 150,
    effect: 1,
    count: 0,
    type: 'passive',
    iconName: 'cpu'
  },
  {
    id: 'passive_miner_2',
    name: '포인트 정찰 드론 (Passive)',
    description: '매 초당 자동으로 5포인트를 드롭합니다.',
    cost: 500,
    effect: 5,
    count: 0,
    type: 'passive',
    iconName: 'milestone'
  },
  {
    id: 'passive_miner_3',
    name: '클라우드 연산 메인프레임 (Passive)',
    description: '매 초당 자동으로 25포인트를 대량 생산합니다.',
    cost: 2000,
    effect: 25,
    count: 0,
    type: 'passive',
    iconName: 'award'
  }
];

const INITIAL_BOTS = [
  { username: '마이닝마스터', points: 3800, level: 8, isBot: true },
  { username: '포인트포식자', points: 2200, level: 6, isBot: true },
  { username: '룰렛의지배자', points: 1450, level: 4, isBot: true },
  { username: '스피드러너', points: 890, level: 3, isBot: true },
  { username: '포인트루키', points: 120, level: 1, isBot: true }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(DEFAULT_UPGRADES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLevelUpAlert, setShowLevelUpAlert] = useState<string | null>(null);

  // Initialize background bots if not exists
  useEffect(() => {
    const botsStr = localStorage.getItem('point_accumulator_bots');
    if (!botsStr) {
      localStorage.setItem('point_accumulator_bots', JSON.stringify(INITIAL_BOTS));
    }
  }, []);

  // Sync user data to backend database (and local storage as a robust fallback)
  const syncUserData = async (
    user: User,
    currentUpgrades: Upgrade[] = upgrades,
    currentTx: Transaction[] = transactions
  ) => {
    setUserData(user);
    
    // Save to local cache first
    localStorage.setItem(`point_accumulator_cache_${user.username}`, JSON.stringify({
      user,
      upgrades: currentUpgrades,
      transactions: currentTx
    }));

    try {
      await fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          points: user.points,
          totalEarned: user.totalEarned,
          clickPower: user.clickPower,
          passiveIncome: user.passiveIncome,
          level: user.level,
          experience: user.experience,
          clicksCount: user.clicksCount,
          upgrades: currentUpgrades,
          transactions: currentTx
        })
      });
    } catch (err) {
      console.warn('Network error syncing to database:', err);
    }
  };

  // Log in user successfully from backend details
  const handleLoginSuccess = (userDataFromApi: any) => {
    const username = userDataFromApi.username;
    setCurrentUser(username);

    const loggedInUser: User = {
      id: username,
      username: username,
      points: userDataFromApi.points || 0,
      totalEarned: userDataFromApi.totalEarned || 0,
      clickPower: userDataFromApi.clickPower || 1,
      passiveIncome: userDataFromApi.passiveIncome || 0,
      level: userDataFromApi.level || 1,
      experience: userDataFromApi.experience || 0,
      clicksCount: userDataFromApi.clicksCount || 0,
      registeredAt: new Date().toISOString()
    };

    setUserData(loggedInUser);
    setUpgrades(userDataFromApi.upgrades && userDataFromApi.upgrades.length > 0 ? userDataFromApi.upgrades : DEFAULT_UPGRADES);
    setTransactions(userDataFromApi.transactions || []);
  };

  // Sign out
  const handleSignOut = () => {
    setCurrentUser(null);
    setUserData(null);
    setUpgrades(DEFAULT_UPGRADES);
    setTransactions([]);
  };

  // Level Up check and handle
  const addExpAndCheckLevelUp = (user: User, expToAdd: number, currentTx: Transaction[]): { user: User, tx: Transaction[] } => {
    let exp = user.experience + expToAdd;
    let level = user.level;
    let points = user.points;
    let levelUpOccurred = false;
    let updatedTx = [...currentTx];

    while (exp >= level * 100) {
      exp -= level * 100;
      level += 1;
      const bonusPoints = level * 150;
      points += bonusPoints;
      levelUpOccurred = true;

      const levelUpTx: Transaction = {
        id: 'levelup_' + Date.now() + '_' + level,
        type: 'earn',
        amount: bonusPoints,
        description: `레벨 ${level} 달성 보너스! 🎉`,
        timestamp: new Date().toISOString()
      };
      updatedTx = [levelUpTx, ...updatedTx];
    }

    if (levelUpOccurred) {
      setShowLevelUpAlert(`축하합니다! 레벨 ${level}로 벌크업 되었습니다! 보너스 포인트 획득!`);
      setTimeout(() => setShowLevelUpAlert(null), 4000);
    }

    return {
      user: {
        ...user,
        level,
        experience: exp,
        points
      },
      tx: updatedTx
    };
  };

  // Earn Points (manual click)
  const handleEarnPoints = (pointsAmount: number, expAmount: number) => {
    if (!userData) return;

    const baseUser = {
      ...userData,
      points: userData.points + pointsAmount,
      totalEarned: userData.totalEarned + pointsAmount,
      clicksCount: userData.clicksCount + 1
    };

    const { user: updatedUser, tx: updatedTx } = addExpAndCheckLevelUp(baseUser, expAmount, transactions);

    setTransactions(updatedTx);
    syncUserData(updatedUser, upgrades, updatedTx);

    if (Math.random() < 0.25) {
      simulateCompetitorsProgress();
    }
  };

  // Handle Mini-Game results
  const handleGameResult = (netPoints: number, expGained: number, description: string, isWin: boolean) => {
    if (!userData) return;

    const baseUser = {
      ...userData,
      points: Math.max(0, userData.points + netPoints),
      totalEarned: netPoints > 0 ? userData.totalEarned + netPoints : userData.totalEarned
    };

    const gameTx: Transaction = {
      id: 'game_' + Date.now(),
      type: netPoints >= 0 ? 'earn' : 'spend',
      amount: Math.abs(netPoints),
      description: description,
      timestamp: new Date().toISOString()
    };

    const combinedTx = [gameTx, ...transactions];
    const { user: updatedUser, tx: updatedTx } = addExpAndCheckLevelUp(baseUser, expGained, combinedTx);

    setTransactions(updatedTx);
    syncUserData(updatedUser, upgrades, updatedTx);

    simulateCompetitorsProgress();
  };

  // Upgrade Purchase
  const handleBuyUpgrade = (upgradeId: string) => {
    if (!userData) return;

    const upgradeIndex = upgrades.findIndex((u) => u.id === upgradeId);
    if (upgradeIndex === -1) return;

    const upgrade = upgrades[upgradeIndex];
    if (userData.points < upgrade.cost) {
      alert('포인트가 부족합니다!');
      return;
    }

    const updatedPoints = userData.points - upgrade.cost;
    const updatedCount = upgrade.count + 1;
    const nextCost = Math.round(upgrade.cost * (upgrade.type === 'click' ? 1.5 : 1.6));

    const updatedUpgrades = [...upgrades];
    updatedUpgrades[upgradeIndex] = {
      ...upgrade,
      count: updatedCount,
      cost: nextCost
    };

    let extraClickPower = 0;
    let extraPassiveIncome = 0;

    updatedUpgrades.forEach((u) => {
      if (u.type === 'click') {
        extraClickPower += u.count * u.effect;
      } else {
        extraPassiveIncome += u.count * u.effect;
      }
    });

    const updatedUser: User = {
      ...userData,
      points: updatedPoints,
      clickPower: 1 + extraClickPower,
      passiveIncome: extraPassiveIncome
    };

    const upgradeTx: Transaction = {
      id: 'upgrade_' + Date.now(),
      type: 'spend',
      amount: upgrade.cost,
      description: `'${upgrade.name}' 연구 업그레이드`,
      timestamp: new Date().toISOString()
    };

    const updatedTx = [upgradeTx, ...transactions];

    setUpgrades(updatedUpgrades);
    setTransactions(updatedTx);
    syncUserData(updatedUser, updatedUpgrades, updatedTx);
  };

  // Passive points generation ticker
  useEffect(() => {
    if (!currentUser || !userData || userData.passiveIncome <= 0) return;

    const passiveInterval = setInterval(() => {
      setUserData((prevUser) => {
        if (!prevUser) return null;

        const addedPoints = prevUser.passiveIncome;
        const addedExp = Math.max(1, Math.floor(addedPoints * 0.1));

        const baseUser = {
          ...prevUser,
          points: prevUser.points + addedPoints,
          totalEarned: prevUser.totalEarned + addedPoints
        };

        const { user: updatedUser, tx: updatedTx } = addExpAndCheckLevelUp(baseUser, addedExp, transactions);

        // Background Sync to Server
        fetch('/api/user/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: updatedUser.username,
            points: updatedUser.points,
            totalEarned: updatedUser.totalEarned,
            clickPower: updatedUser.clickPower,
            passiveIncome: updatedUser.passiveIncome,
            level: updatedUser.level,
            experience: updatedUser.experience,
            clicksCount: updatedUser.clicksCount,
            upgrades: upgrades,
            transactions: updatedTx
          })
        }).catch(() => {});

        if (updatedTx.length !== transactions.length) {
          setTransactions(updatedTx);
        }

        return updatedUser;
      });
    }, 1000);

    return () => clearInterval(passiveInterval);
  }, [currentUser, userData?.passiveIncome, upgrades, transactions]);

  // Simulate active progress of computer competitors
  const simulateCompetitorsProgress = () => {
    const botsStr = localStorage.getItem('point_accumulator_bots');
    if (!botsStr) return;

    const bots = JSON.parse(botsStr);
    const updatedBots = bots.map((bot: any) => {
      if (Math.random() < 0.35) {
        const addedPoints = Math.floor(Math.random() * (bot.level * 15)) + 5;
        const newPoints = bot.points + addedPoints;
        const currentLevel = bot.level;
        const nextLevelPoints = currentLevel * 800;
        const newLevel = newPoints >= nextLevelPoints ? currentLevel + 1 : currentLevel;

        return {
          ...bot,
          points: newPoints,
          level: newLevel
        };
      }
      return bot;
    });

    localStorage.setItem('point_accumulator_bots', JSON.stringify(updatedBots));
    assembleLeaderboard(updatedBots);
  };

  // Periodic simulation check for AI competitors
  useEffect(() => {
    if (!currentUser) return;

    const botTicker = setInterval(() => {
      simulateCompetitorsProgress();
    }, 6000);

    return () => clearInterval(botTicker);
  }, [currentUser]);

  // Assemble real database users and simulated bots into rankings
  const assembleLeaderboard = async (activeBots?: any[]) => {
    const list: LeaderboardEntry[] = [];

    // Fetch real users from backend API
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.users)) {
        data.users.forEach((u: any) => {
          list.push({
            username: u.username,
            points: u.points || 0,
            level: u.level || 1,
            isCurrentUser: u.username === currentUser
          });
        });
      }
    } catch (err) {
      console.warn('Error fetching leaderboard, falling back:', err);
    }

    // Add bots
    const botsToUse = activeBots || JSON.parse(localStorage.getItem('point_accumulator_bots') || '[]');
    botsToUse.forEach((bot: any) => {
      const botLabel = bot.username + ' (BOT)';
      if (!list.some((item) => item.username === bot.username || item.username === botLabel)) {
        list.push({
          username: botLabel,
          points: bot.points,
          level: bot.level
        });
      }
    });

    // Sort descending
    list.sort((a, b) => b.points - a.points);
    setLeaderboard(list);
  };

  // Trigger leaderboard update on user modifications
  useEffect(() => {
    if (currentUser) {
      assembleLeaderboard();
    }
  }, [currentUser, userData?.points, userData?.level]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Level up modal overlay banner */}
      <AnimatePresence>
        {showLevelUpAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 text-white font-sans font-bold px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 border border-amber-400"
          >
            <Sparkles className="w-5 h-5 text-amber-200 animate-spin" />
            <span>{showLevelUpAlert}</span>
            <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      {!currentUser ? (
        <div className="py-20">
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        </div>
      ) : (
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
          {/* Header Bar */}
          <header className="flex flex-col sm:flex-row justify-between items-center bg-white border border-slate-100 rounded-2xl p-5 mb-6 shadow-sm">
            <div className="flex items-center gap-3.5 mb-4 sm:mb-0">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <Coins className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-800 font-sans">
                  POINT ACCUMULATOR
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600">
                    접속 계정: <strong className="text-indigo-600">{currentUser}</strong>
                  </span>
                  <span className="text-[10px] text-slate-300">|</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-mono">
                    LV. {userData?.level}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              id="btn_sign_out"
              onClick={handleSignOut}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200/60 transition active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>로그아웃 (안전하게 저장)</span>
            </button>
          </header>

          {/* Quick Stats Banner Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            {/* 1. Point Balance */}
            <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-y-4 translate-x-4 opacity-10">
                <Coins className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider block mb-1">
                  누적 보상 포인트
                </span>
                <span className="text-3xl font-black font-mono block">
                  {userData?.points.toLocaleString()} <span className="text-lg font-bold text-indigo-200">P</span>
                </span>
                <span className="text-[10px] text-indigo-200 block mt-2">
                  클릭과 미니게임에서 획득한 포인트입니다.
                </span>
              </div>
            </div>

            {/* 2. Passive Income */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-y-4 translate-x-4 opacity-5">
                <Zap className="w-32 h-32 text-indigo-500" />
              </div>
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    초당 자동 획득 포인트
                  </span>
                  <span className="text-2xl font-black font-mono text-emerald-600 block">
                    +{userData?.passiveIncome.toLocaleString()} P <span className="text-xs font-semibold text-slate-400 font-sans">/ 초</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] text-slate-400">
                    연구실 업그레이드를 통해 포인트를 자동으로 채굴합니다.
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Click Power Info */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-y-4 translate-x-4 opacity-5">
                <Award className="w-32 h-32 text-amber-500" />
              </div>
              <div className="relative z-10">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  수동 클릭 파워
                </span>
                <span className="text-2xl font-black font-mono text-indigo-600 block">
                  +{userData?.clickPower.toLocaleString()} P <span className="text-xs font-semibold text-slate-400 font-sans">/ 탭</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-2">
                  포인트 오브를 한 번 터치할 때마다 즉시 획득합니다.
                </span>
              </div>
            </div>
          </div>

          {/* Core Interactive Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left side: Action Area */}
            <div className="lg:col-span-7 space-y-6">
              {/* Clicker */}
              <PointClicker
                clickPower={userData?.clickPower || 1}
                points={userData?.points || 0}
                level={userData?.level || 1}
                experience={userData?.experience || 0}
                onEarnPoints={handleEarnPoints}
              />

              {/* Upgrades panel */}
              <UpgradesPanel
                points={userData?.points || 0}
                upgrades={upgrades}
                onBuyUpgrade={handleBuyUpgrade}
              />
            </div>

            {/* Right side: Social/Games/Log Area */}
            <div className="lg:col-span-5 space-y-6">
              {/* Mini-Games zone */}
              <MiniGames
                points={userData?.points || 0}
                onGameResult={handleGameResult}
              />

              {/* Leaderboard panel */}
              <Leaderboard
                entries={leaderboard}
                currentUsername={currentUser}
              />

              {/* Transaction Logs */}
              <PointHistory transactions={transactions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
