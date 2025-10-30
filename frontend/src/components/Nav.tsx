import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Nav() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  async function handleLogout() {
    await signOut(auth);
    navigate('/login');
  }

  return (
    <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #eee', alignItems: 'center' }}>
      <Link to="/upload">上传</Link>
      <Link to="/jobs">任务</Link>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        {user ? (
          <>
            <span>{user.email}</span>
            <button onClick={handleLogout}>登出</button>
          </>
        ) : (
          <Link to="/login">登录</Link>
        )}
      </div>
    </nav>
  );
}


