import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  function mapFirebaseError(err: unknown): string {
    const code = (err as any)?.code as string | undefined;
    switch (code) {
      case 'auth/email-already-in-use':
        return '该邮箱已注册，请直接登录或更换邮箱';
      case 'auth/invalid-email':
        return '邮箱格式不正确';
      case 'auth/weak-password':
        return '密码过弱（至少 6 位）';
      case 'auth/operation-not-allowed':
        return '邮箱密码登录未启用，请在 Firebase 控制台开启';
      case 'auth/network-request-failed':
        return '网络错误，请检查网络或稍后再试';
      case 'auth/invalid-api-key':
        return 'API Key 配置无效，请检查环境变量';
      case 'auth/configuration-not-found':
        return '项目配置错误，请检查 VITE_FIREBASE_*';
      default:
        return '操作失败，请重试或检查邮箱与密码';
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/upload');
    } catch (err: unknown) {
      setError(mapFirebaseError(err));
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/upload');
    } catch (err: unknown) {
      setError(mapFirebaseError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '64px auto' }}>
      <h1>{mode === 'login' ? '登录' : '注册'}</h1>
      <form onSubmit={onSubmit}>
        <div>
          <label>
            邮箱
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <label>
            密码
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </label>
        </div>
        {error && (
          <div style={{ color: 'red', marginTop: 12 }}>{error}</div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 16 }}>
          <button type="submit" disabled={loading}>
            {loading ? (mode === 'login' ? '登录中…' : '注册中…') : (mode === 'login' ? '登录' : '注册')}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            disabled={loading}
          >
            {mode === 'login' ? '没有账号？去注册' : '已有账号？去登录'}
          </button>
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="button" onClick={onGoogle} disabled={loading}>
            使用 Google 登录
          </button>
        </div>
        {mode === 'register' && (
          <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
            提示：密码至少 6 位；请在 Firebase 控制台启用 Email/Password，并确认已把本地域名加入授权域。
          </div>
        )}
      </form>
    </div>
  );
}


