import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(email, password);
    if (result.success) {
      navigate('/decisions');
    } else {
      setError(result.error || 'Failed to login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--bg-primary))] text-[hsl(var(--text-primary))]">
      <div className="w-full max-w-sm p-8 flex flex-col items-center">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-[hsl(var(--text-secondary))] text-sm">Log in to DecisionScope to continue</p>
        </div>
        
        {error && <div className="w-full mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded text-sm text-center">{error}</div>}
        
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <input
              type="email"
              required
              placeholder="Email address"
              className="w-full p-4 bg-[hsl(var(--bg-secondary))] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-[hsl(var(--text-muted))] text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <input
              type="password"
              required
              placeholder="Password"
              className="w-full p-4 bg-[hsl(var(--bg-secondary))] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-[hsl(var(--text-muted))] text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full p-4 btn-primary rounded-md font-medium transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Logging in...' : 'Continue'}
          </button>
        </form>
        
        <div className="mt-6 text-sm text-[hsl(var(--text-muted))]">
          Don't have an account? <Link to="/signup" className="text-blue-500 hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
