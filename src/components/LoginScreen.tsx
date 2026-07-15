import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Lock, UserPlus, LogIn, Sparkles, Database, ShieldCheck, HelpCircle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (userData: any) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<{
    databaseConfigured: boolean;
    databaseConnected: boolean;
    mode: string;
    errorMessage?: string | null;
  } | null>(null);

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        setServerStatus({
          databaseConfigured: data.databaseConfigured,
          databaseConnected: data.databaseConnected,
          mode: data.mode,
          errorMessage: data.errorMessage
        });
      })
      .catch((err) => {
        console.error('Error fetching server status:', err);
      });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !password) {
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    const trimmedUsername = username.trim();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: trimmedUsername,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '로그인 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      setSuccess('로그인 성공! 게임 데이터를 불러오는 중입니다...');
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 1000);
    } catch (err) {
      setError('서버에 연결할 수 없습니다. 백엔드 서비스 상태를 확인해 주세요.');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
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

    setLoading(true);
    const trimmedUsername = username.trim();

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: trimmedUsername,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '회원가입 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      setSuccess('회원가입이 완료되었습니다! 로그인 탭에서 로그인을 진행해 주세요.');
      setIsLoginTab(true);
      setPassword('');
      setConfirmPassword('');
      setLoading(false);
    } catch (err) {
      setError('서버에 연결할 수 없습니다. 백엔드 서비스 상태를 확인해 주세요.');
      setLoading(false);
    }
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
            disabled={loading}
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
            disabled={loading}
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

          {/* Diagnostic Database Status Info boxes */}
          {serverStatus && serverStatus.databaseConfigured && !serverStatus.databaseConnected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs leading-relaxed font-sans flex flex-col gap-1.5 shadow-sm"
            >
              <div className="flex items-center gap-1.5 font-bold text-rose-800">
                <Database className="w-4 h-4 text-rose-500 animate-pulse" />
                <span>데이터베이스 연결 실패 (Vercel/Neon DB)</span>
              </div>
              <p>설정된 <code>DATABASE_URL</code>로 연결을 시도했으나 실패했습니다. 현재 백엔드 서비스가 정상적인 데이터베이스 연결을 수립하지 못하고 있습니다.</p>
              {serverStatus.errorMessage && (
                <div className="mt-1 p-2 bg-rose-100 rounded text-[11px] font-mono break-all text-rose-900 max-h-24 overflow-y-auto border border-rose-200">
                  ⚠️ 오류 원인: {serverStatus.errorMessage}
                </div>
              )}
              <div className="mt-1.5 pt-2 border-t border-rose-100 text-slate-500 text-[10px]">
                💡 <strong>해결 방법:</strong>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  <li>오른쪽 위의 <strong>설정(톱니바퀴)</strong>이나 <strong>Secrets</strong> 패널에서 <code>DATABASE_URL</code>의 철자, 비밀번호, 호스트 주소를 확인해 주세요.</li>
                  <li>SSL 설정(<code>?sslmode=require</code> 등)이 URL 끝에 포함되어 있는지 확인해 주세요.</li>
                  <li>데이터베이스 측 방화벽(Vercel/Neon 등)에서 외부 접속 허용 여부를 체크해 주세요.</li>
                </ul>
              </div>
            </motion.div>
          )}

          {serverStatus && !serverStatus.databaseConfigured && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 p-4 bg-amber-50/70 border border-amber-200/50 rounded-lg text-amber-800 text-xs leading-relaxed font-sans flex flex-col gap-1 shadow-sm"
            >
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Database className="w-4 h-4 text-amber-500" />
                <span>로컬 샌드박스 임시 저장 모드</span>
              </div>
              <p>현재 연결된 외부 데이터베이스가 없습니다. 회원 정보와 게임 진행 상황이 서버의 임시 메모리에만 유지됩니다. (새로고침 시 초기화될 수 있음)</p>
              <p className="mt-1 text-[10px] text-slate-500">
                💡 <strong>안내:</strong> 실시간 상시 영구 저장을 원하신다면 오른쪽 위 <strong>설정</strong> 메뉴에서 Vercel/Neon Postgres 등의 <code>DATABASE_URL</code>을 등록해 주세요.
              </p>
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
                    disabled={loading}
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
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition text-sm text-slate-800 font-sans"
                    required
                  />
                </div>
              </div>

              <button
                id="btn_login_submit"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm shadow-md shadow-indigo-100 hover:shadow-lg transition cursor-pointer"
              >
                {loading ? '인증 확인 중...' : '게임 접속하기'}
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
                    disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
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
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm shadow-md shadow-indigo-100 hover:shadow-lg transition cursor-pointer"
              >
                {loading ? '계정 생성 중...' : '계정 생성 및 준비'}
              </button>
            </form>
          )}

          {/* Connection Status Badge */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-sans">
            <Database className={`w-3.5 h-3.5 ${serverStatus?.databaseConnected ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`} />
            <span>서버 연동:</span>
            <span className={`font-semibold ${serverStatus?.databaseConnected ? 'text-emerald-600' : 'text-amber-600'}`}>
              {serverStatus ? serverStatus.mode : '서버 상태 로딩 중...'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
