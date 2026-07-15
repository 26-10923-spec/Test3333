import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, UserPlus, LogIn, Sparkles } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (username: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !password) {
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    const trimmedUsername = username.trim();
    const usersStr = localStorage.getItem('point_accumulator_users');
    const users = usersStr ? JSON.parse(usersStr) : {};

    if (!users[trimmedUsername]) {
      setError('존재하지 않는 아이디입니다. 회원가입을 먼저 진행해주세요.');
      return;
    }

    if (users[trimmedUsername].password !== password) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setSuccess('로그인 성공! 게임에 접속 중입니다...');
    setTimeout(() => {
      onLoginSuccess(trimmedUsername);
    }, 1000);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !password || !confirmPassword) {
      setError('모든 항목을 입력해주세요.');
      return;
    }

    if (username.length < 3) {
      setError('아이디는 최소 3글자 이상이어야 합니다.');
      return;
    }

    if (password.length < 4) {
      setError('비밀번호는 최소 4글자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 서로 일치하지 않습니다.');
      return;
    }

    const trimmedUsername = username.trim();
    const usersStr = localStorage.getItem('point_accumulator_users');
    const users = usersStr ? JSON.parse(usersStr) : {};

    if (users[trimmedUsername]) {
      setError('이미 존재하는 아이디입니다.');
      return;
    }

    // Save user data
    users[trimmedUsername] = {
      username: trimmedUsername,
      password: password,
      points: 100, // starting points bonus!
      totalEarned: 100,
      clickPower: 1,
      passiveIncome: 0,
      level: 1,
      experience: 0,
      clicksCount: 0,
      registeredAt: new Date().toISOString()
    };

    localStorage.setItem('point_accumulator_users', JSON.stringify(users));
    setSuccess('회원가입이 완료되었습니다! 로그인 탭에서 로그인해주세요.');
    setIsLoginTab(true);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div id="login_container" className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden"
      >
        {/* Banner area */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-15">
            <Sparkles className="w-24 h-24 rotate-12" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex p-3 bg-white/10 rounded-xl mb-3 backdrop-blur-md">
              <Sparkles className="w-8 h-8 text-indigo-100 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold font-sans tracking-tight">포인트 어큐뮬레이터</h1>
            <p className="text-xs text-indigo-100 mt-1.5 font-sans">
              최고의 포인트 획득 전문가가 되어보세요!
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            id="tab_login"
            onClick={() => {
              setIsLoginTab(true);
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-4 text-center font-medium text-sm transition-all relative ${
              isLoginTab ? 'text-indigo-600 bg-white font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" />
              로그인
            </div>
            {isLoginTab && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
              />
            )}
          </button>
          <button
            id="tab_register"
            onClick={() => {
              setIsLoginTab(false);
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-4 text-center font-medium text-sm transition-all relative ${
              !isLoginTab ? 'text-indigo-600 bg-white font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              회원가입
            </div>
            {!isLoginTab && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
              />
            )}
          </button>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3.5 bg-rose-50 border-l-4 border-rose-500 rounded-r text-rose-700 text-xs font-medium"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3.5 bg-emerald-50 border-l-4 border-emerald-500 rounded-r text-emerald-700 text-xs font-medium"
            >
              {success}
            </motion.div>
          )}

          {isLoginTab ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  아이디
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="login_username"
                    type="text"
                    placeholder="아이디를 입력하세요"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition text-sm text-slate-800 font-sans"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  비밀번호
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="login_password"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition text-sm text-slate-800 font-sans"
                    required
                  />
                </div>
              </div>

              <button
                id="btn_login_submit"
                type="submit"
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-lg font-semibold text-sm shadow-md shadow-indigo-100 hover:shadow-lg transition cursor-pointer"
              >
                게임 접속하기
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  새 아이디 (3글자 이상)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="register_username"
                    type="text"
                    placeholder="새 아이디 입력"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition text-sm text-slate-800 font-sans"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  비밀번호 (4글자 이상)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="register_password"
                    type="password"
                    placeholder="비밀번호 입력"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition text-sm text-slate-800 font-sans"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  비밀번호 확인
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="register_confirm_password"
                    type="password"
                    placeholder="비밀번호 다시 입력"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition text-sm text-slate-800 font-sans"
                    required
                  />
                </div>
              </div>

              <div className="text-slate-500 text-[11px] leading-relaxed pt-1">
                * 회원가입 시 <strong>100 포인트</strong> 웰컴 보너스가 즉시 지급됩니다!
              </div>

              <button
                id="btn_register_submit"
                type="submit"
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-lg font-semibold text-sm shadow-md shadow-indigo-100 hover:shadow-lg transition cursor-pointer"
              >
                계정 생성 및 준비
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
