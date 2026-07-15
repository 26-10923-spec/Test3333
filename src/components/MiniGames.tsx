import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dice5, RotateCcw, AlertCircle, Sparkles, Timer, CheckCircle2, Play, HelpCircle, Trophy } from 'lucide-react';

interface MiniGamesProps {
  points: number;
  onGameResult: (amount: number, exp: number, desc: string, isWin: boolean) => void;
}

export default function MiniGames({ points, onGameResult }: MiniGamesProps) {
  const [activeGame, setActiveGame] = useState<'roulette' | 'highlow' | 'math' | null>(null);

  // 1. Roulette Game State
  const [rouletteState, setRouletteState] = useState<{
    spinning: boolean;
    result: string;
    multiplier: number;
    angle: number;
  }>({ spinning: false, result: '', multiplier: 1, angle: 0 });

  // 2. High-Low Game State
  const [highLowState, setHighLowState] = useState<{
    currentCard: number;
    nextCard: number | null;
    guess: 'high' | 'low' | null;
    status: 'idle' | 'playing' | 'won' | 'lost';
    message: string;
  }>({ currentCard: 7, nextCard: null, guess: null, status: 'idle', message: '카드를 뽑아 시작하세요.' });

  // 3. Math Quiz State
  const [mathState, setMathState] = useState<{
    num1: number;
    num2: number;
    operator: '+' | '-' | '*';
    answer: number;
    userAnswer: string;
    timeLeft: number;
    status: 'idle' | 'playing' | 'correct' | 'wrong' | 'timeout';
    message: string;
  }>({ num1: 0, num2: 0, operator: '+', answer: 0, userAnswer: '', timeLeft: 10, status: 'idle', message: '시작 버튼을 누르면 제한시간 10초 퀴즈가 출제됩니다.' });

  // Quiz timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeGame === 'math' && mathState.status === 'playing' && mathState.timeLeft > 0) {
      timer = setTimeout(() => {
        setMathState((prev) => {
          if (prev.timeLeft <= 1) {
            onGameResult(-15, 0, '스피드 수학 퀴즈 시간 초과', false);
            return {
              ...prev,
              timeLeft: 0,
              status: 'timeout',
              message: `시간 초과! 정답은 ${prev.answer}이었습니다.`
            };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [activeGame, mathState.status, mathState.timeLeft]);

  // Handle Roulette Spin
  const startRoulette = () => {
    if (points < 20) {
      alert('포인트가 부족합니다! (럭키 룰렛 참가비: 20P)');
      return;
    }
    if (rouletteState.spinning) return;

    setRouletteState({ spinning: true, result: '', multiplier: 1, angle: 0 });

    const outcomes = [
      { name: '대실패 (0.1배)', mult: 0.1, weight: 15 },
      { name: '실패 (0.5배)', mult: 0.5, weight: 25 },
      { name: '본전치기 (1.0배)', mult: 1.0, weight: 25 },
      { name: '소소한 이득 (1.5배)', mult: 1.5, weight: 20 },
      { name: '두 배 대박 (2.0배)', mult: 2.0, weight: 10 },
      { name: '잭팟 당첨 (5.0배)', mult: 5.0, weight: 5 }
    ];

    // Spin animation angle
    const extraSpins = 5 + Math.floor(Math.random() * 5); // 5 to 9 full spins
    const outcomeIndex = Math.floor(Math.random() * outcomes.length);
    const selectedOutcome = outcomes[outcomeIndex];
    const targetAngle = extraSpins * 360 + (outcomeIndex * (360 / outcomes.length));

    setRouletteState((prev) => ({ ...prev, angle: targetAngle }));

    setTimeout(() => {
      const stake = 20;
      const reward = Math.round(stake * selectedOutcome.mult);
      const netPoints = reward - stake;

      onGameResult(
        netPoints,
        Math.max(5, Math.floor(reward / 2)),
        `럭키 룰렛 플레이 (${selectedOutcome.name})`,
        netPoints >= 0
      );

      setRouletteState((prev) => ({
        ...prev,
        spinning: false,
        result: `${selectedOutcome.name} 당첨!`,
        multiplier: selectedOutcome.mult
      }));
    }, 3500);
  };

  // Start High-Low
  const startHighLow = () => {
    if (points < 30) {
      alert('포인트가 부족합니다! (하이로 참가비: 30P)');
      return;
    }
    const initialCard = Math.floor(Math.random() * 11) + 2; // card values from 2 to 12
    setHighLowState({
      currentCard: initialCard,
      nextCard: null,
      guess: null,
      status: 'playing',
      message: '다음 카드는 현재 카드보다 높을까요(High), 낮을까요(Low)?'
    });
  };

  const handleHighLowGuess = (guess: 'high' | 'low') => {
    const nextCard = Math.floor(Math.random() * 11) + 2;
    const current = highLowState.currentCard;

    let isWin = false;
    if (guess === 'high' && nextCard >= current) {
      isWin = true;
    } else if (guess === 'low' && nextCard <= current) {
      isWin = true;
    }

    const stake = 30;
    const netPoints = isWin ? Math.round(stake * 0.8) : -stake; // win awards +24 net points (total 54), loss deducts 30
    onGameResult(
      netPoints,
      isWin ? 15 : 5,
      `하이-로우 카드 예측 (${isWin ? '성공' : '실패'})`,
      isWin
    );

    setHighLowState({
      currentCard: current,
      nextCard: nextCard,
      guess: guess,
      status: isWin ? 'won' : 'lost',
      message: isWin
        ? `성공! 다음 카드는 ${nextCard}였습니다! (+24 P / +15 XP 획득)`
        : `실패! 다음 카드는 ${nextCard}였습니다. (-30 P)`
    });
  };

  // Start Math Quiz
  const startMathQuiz = () => {
    if (points < 15) {
      alert('포인트가 부족합니다! (스피드 연산 참가비: 15P)');
      return;
    }
    const operators: ('+' | '-' | '*')[] = ['+', '-', '*'];
    const op = operators[Math.floor(Math.random() * operators.length)];

    let n1 = 0;
    let n2 = 0;
    let ans = 0;

    if (op === '+') {
      n1 = Math.floor(Math.random() * 80) + 10;
      n2 = Math.floor(Math.random() * 80) + 10;
      ans = n1 + n2;
    } else if (op === '-') {
      n1 = Math.floor(Math.random() * 90) + 10;
      n2 = Math.floor(Math.random() * n1); // ensure positive answer for sanity
      ans = n1 - n2;
    } else {
      n1 = Math.floor(Math.random() * 12) + 2;
      n2 = Math.floor(Math.random() * 12) + 2;
      ans = n1 * n2;
    }

    setMathState({
      num1: n1,
      num2: n2,
      operator: op,
      answer: ans,
      userAnswer: '',
      timeLeft: 10,
      status: 'playing',
      message: '연산 결과를 제한 시간 내에 입력해주세요!'
    });
  };

  const handleMathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mathState.status !== 'playing') return;

    const parsedUserAns = parseInt(mathState.userAnswer.trim());
    const isCorrect = parsedUserAns === mathState.answer;

    const stake = 15;
    const netPoints = isCorrect ? 35 : -stake; // correct pays +35 net points, incorrect deducts 15
    onGameResult(
      netPoints,
      isCorrect ? 25 : 5,
      `스피드 산수 퀴즈 (${isCorrect ? '정답' : '오답'})`,
      isCorrect
    );

    setMathState((prev) => ({
      ...prev,
      status: isCorrect ? 'correct' : 'wrong',
      message: isCorrect
        ? `정답입니다! 완벽한 연산력이군요! (+35 P / +25 XP)`
        : `오답입니다! 정답은 ${prev.answer}였습니다. (-15 P)`
    }));
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
      <div className="mb-6">
        <h2 className="text-base font-bold text-slate-800 tracking-tight font-sans">
          포인트 엔터테인먼트 존
        </h2>
        <p className="text-xs text-slate-400 font-sans mt-0.5">
          다양한 확률과 두뇌 게임에 참여하여 단시간에 대량의 포인트를 누적해보세요.
        </p>
      </div>

      {/* Main Game Hub Selector */}
      {!activeGame ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          {/* Game 1 Card */}
          <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between hover:border-indigo-100 transition-all">
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3 font-bold">
                🎰
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">럭키 룰렛</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                20 포인트를 베팅하여 룰렛을 돌립니다. 최대 5배 잭팟 당첨의 기회를 잡으세요!
              </p>
            </div>
            <button
              id="btn_select_roulette"
              onClick={() => setActiveGame('roulette')}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer active:scale-[0.98] transition"
            >
              게임 시작 (참가비 20 P)
            </button>
          </div>

          {/* Game 2 Card */}
          <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between hover:border-indigo-100 transition-all">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3 font-bold">
                🃏
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">카드 하이-로우</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                30 포인트를 베팅합니다. 다음 카드의 수치가 현재보다 높은지 낮은지 판단하세요.
              </p>
            </div>
            <button
              id="btn_select_highlow"
              onClick={() => setActiveGame('highlow')}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer active:scale-[0.98] transition"
            >
              게임 시작 (참가비 30 P)
            </button>
          </div>

          {/* Game 3 Card */}
          <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between hover:border-indigo-100 transition-all">
            <div>
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 mb-3 font-bold">
                ⏱️
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">스피드 산수</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                15 포인트를 베팅하여 10초 퀴즈에 맞춥니다. 정답 시 35 포인트의 높은 보상!
              </p>
            </div>
            <button
              id="btn_select_math"
              onClick={() => setActiveGame('math')}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer active:scale-[0.98] transition"
            >
              게임 시작 (참가비 15 P)
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          {/* Back to main button */}
          <div className="flex justify-between items-center mb-4">
            <button
              id="btn_back_to_lobby"
              onClick={() => {
                setActiveGame(null);
                // Reset states
                setRouletteState({ spinning: false, result: '', multiplier: 1, angle: 0 });
                setHighLowState({ currentCard: 7, nextCard: null, guess: null, status: 'idle', message: '카드를 뽑아 시작하세요.' });
                setMathState({ num1: 0, num2: 0, operator: '+', answer: 0, userAnswer: '', timeLeft: 10, status: 'idle', message: '시작 버튼을 누르면 제한시간 10초 퀴즈가 출제됩니다.' });
              }}
              className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 active:scale-[0.97] transition flex items-center gap-1 cursor-pointer"
            >
              ← 오락실 로비로 이동
            </button>
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md font-mono">
              보유: {points.toLocaleString()} P
            </span>
          </div>

          {/* Render individual game view */}
          <div className="flex-1 flex flex-col justify-center items-center p-6 border border-slate-100 bg-slate-50/20 rounded-xl min-h-[250px]">
            {activeGame === 'roulette' && (
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-extrabold text-slate-700 mb-4 flex items-center gap-1">
                  🎰 럭키 룰렛 스핀
                </h3>

                {/* Animated roulette canvas */}
                <div className="relative w-40 h-40 mb-6 flex items-center justify-center">
                  {/* Wheel Pointer */}
                  <div className="absolute top-0 z-20 w-4 h-4 bg-red-500 clip-triangle shadow-md" style={{ transform: 'translateX(0%) rotate(180deg)' }} />

                  {/* Circle Wheel */}
                  <motion.div
                    className="w-36 h-36 rounded-full border-4 border-slate-800 bg-gradient-to-r from-indigo-500 via-rose-400 to-amber-400 relative overflow-hidden flex items-center justify-center shadow-lg"
                    animate={{ rotate: rouletteState.angle }}
                    transition={{
                      duration: rouletteState.spinning ? 3.5 : 0,
                      ease: [0.25, 0.1, 0.25, 1.0] // smooth out of spin
                    }}
                  >
                    <div className="absolute inset-0 bg-[conic-gradient(from_0deg,#e0e7ff_60deg,#ffe4e6_120deg,#fef3c7_180deg,#ecfdf5_240deg,#f5f3ff_300deg,#fffbeb_360deg)] pointer-events-none opacity-90" />
                    <div className="w-4 h-4 bg-slate-800 rounded-full z-10" />
                    {/* Multiplier guidelines */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="absolute transform -translate-y-12 text-[10px] font-black text-slate-700">5.0x</span>
                      <span className="absolute transform translate-y-12 text-[10px] font-black text-slate-700">0.5x</span>
                      <span className="absolute transform translate-x-12 text-[10px] font-black text-slate-700">1.0x</span>
                      <span className="absolute transform -translate-x-12 text-[10px] font-black text-slate-700">2.0x</span>
                    </div>
                  </motion.div>
                </div>

                <div className="text-center min-h-[44px]">
                  {rouletteState.spinning ? (
                    <p className="text-xs font-semibold text-slate-500 animate-pulse">
                      룰렛이 힘차게 돌아가고 있습니다...
                    </p>
                  ) : rouletteState.result ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-sm font-bold text-indigo-600"
                    >
                      🎉 {rouletteState.result}
                    </motion.div>
                  ) : (
                    <p className="text-xs text-slate-400">참가비 20포인트를 사용하여 룰렛을 작동시키세요!</p>
                  )}
                </div>

                <button
                  id="btn_play_roulette"
                  disabled={rouletteState.spinning || points < 20}
                  onClick={startRoulette}
                  className={`mt-4 px-6 py-2.5 rounded-lg text-xs font-extrabold shadow-sm transition-all cursor-pointer ${
                    rouletteState.spinning || points < 20
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                  }`}
                >
                  {rouletteState.spinning ? '스피닝 중...' : '룰렛 스핀! (20P)'}
                </button>
              </div>
            )}

            {activeGame === 'highlow' && (
              <div className="flex flex-col items-center w-full max-w-sm">
                <h3 className="text-sm font-extrabold text-slate-700 mb-4 flex items-center gap-1">
                  🃏 카드 하이 앤 로우
                </h3>

                {/* Cards Container */}
                <div className="flex items-center gap-6 justify-center mb-6">
                  {/* Current Card */}
                  <div className="text-center">
                    <span className="text-[10px] font-medium text-slate-400 block mb-1.5">현재 카드</span>
                    <motion.div
                      className="w-20 h-28 bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-xl flex items-center justify-center font-mono font-black text-2xl text-indigo-700 shadow-md"
                      animate={{ scale: highLowState.status === 'playing' ? [1, 1.05, 1] : 1 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      {highLowState.currentCard}
                    </motion.div>
                  </div>

                  <span className="font-bold text-slate-300">VS</span>

                  {/* Next Card */}
                  <div className="text-center">
                    <span className="text-[10px] font-medium text-slate-400 block mb-1.5">다음 카드</span>
                    <AnimatePresence mode="wait">
                      {highLowState.nextCard !== null ? (
                        <motion.div
                          key="next-revealed"
                          initial={{ rotateY: 90, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className={`w-20 h-28 rounded-xl border-2 flex items-center justify-center font-mono font-black text-2xl shadow-md ${
                            highLowState.status === 'won'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                          }`}
                        >
                          {highLowState.nextCard}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="next-hidden"
                          className="w-20 h-28 bg-gradient-to-br from-slate-200 to-slate-300 border-2 border-slate-300 rounded-xl flex items-center justify-center font-bold text-xl text-slate-500 shadow-sm border-dashed"
                        >
                          ?
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Messaging feedback */}
                <div className="text-center mb-4 min-h-[40px] px-4">
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {highLowState.message}
                  </p>
                </div>

                {/* Control inputs */}
                {highLowState.status === 'playing' ? (
                  <div className="flex gap-4 w-full">
                    <button
                      id="btn_highlow_high"
                      onClick={() => handleHighLowGuess('high')}
                      className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      ↑ 더 높은 수 (High)
                    </button>
                    <button
                      id="btn_highlow_low"
                      onClick={() => handleHighLowGuess('low')}
                      className="flex-1 py-2 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      ↓ 더 낮은 수 (Low)
                    </button>
                  </div>
                ) : (
                  <button
                    id="btn_play_highlow"
                    disabled={points < 30}
                    onClick={startHighLow}
                    className={`px-6 py-2 rounded-lg text-xs font-bold shadow-sm cursor-pointer ${
                      points < 30
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                    }`}
                  >
                    새 카드 시작하기 (참가비 30P)
                  </button>
                )}
              </div>
            )}

            {activeGame === 'math' && (
              <div className="flex flex-col items-center w-full max-w-sm">
                <h3 className="text-sm font-extrabold text-slate-700 mb-4 flex items-center gap-1">
                  🧮 스피드 연산 퀴즈
                </h3>

                {mathState.status === 'playing' ? (
                  <div className="w-full flex flex-col items-center">
                    {/* Time Counter */}
                    <div className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-full mb-4 text-xs font-bold font-mono">
                      <Timer className="w-3.5 h-3.5 animate-spin" />
                      남은 시간: {mathState.timeLeft}초
                    </div>

                    {/* Formula equation card */}
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-xl py-5 text-center font-mono font-black text-2xl text-slate-800 mb-5 tracking-wide shadow-sm">
                      {mathState.num1} {mathState.operator === '*' ? '×' : mathState.operator} {mathState.num2} = ?
                    </div>

                    <form onSubmit={handleMathSubmit} className="w-full flex gap-2">
                      <input
                        id="math_user_answer"
                        type="number"
                        placeholder="정답 입력"
                        value={mathState.userAnswer}
                        onChange={(e) => setMathState({ ...mathState, userAnswer: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 text-sm font-mono text-center"
                        required
                        autoFocus
                      />
                      <button
                        id="btn_math_submit"
                        type="submit"
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition active:scale-95 cursor-pointer"
                      >
                        입력
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="text-center w-full">
                    {/* Success or failure status badge */}
                    <div className="mb-4">
                      {mathState.status === 'correct' && (
                        <div className="inline-flex p-3 bg-emerald-50 rounded-full text-emerald-600 mb-2">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                      )}
                      {(mathState.status === 'wrong' || mathState.status === 'timeout') && (
                        <div className="inline-flex p-3 bg-rose-50 rounded-full text-rose-600 mb-2">
                          <AlertCircle className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed px-4 mb-5">
                      {mathState.message}
                    </p>

                    <button
                      id="btn_play_math"
                      disabled={points < 15}
                      onClick={startMathQuiz}
                      className={`px-6 py-2.5 rounded-lg text-xs font-bold shadow-sm transition cursor-pointer ${
                        points < 15
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                      }`}
                    >
                      산수 퀴즈 출제 (15P)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
