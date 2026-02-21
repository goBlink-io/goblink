'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'completed' | 'declined';
  votes: number;
  github_username: string;
  github_avatar_url: string;
  created_at: string;
  github_issue_url: string | null;
  feature_request_votes: { count: number }[];
}

interface GitHubUser {
  id: string;
  login: string;
  avatar_url: string;
}

export default function FeaturesPage() {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [features, setFeatures] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUser();
    fetchFeatures();
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch('/api/auth/user');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  }

  async function fetchFeatures() {
    try {
      const res = await fetch('/api/features');
      const data = await res.json();
      setFeatures(data.requests || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch features:', error);
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (res.ok) {
        setTitle('');
        setDescription('');
        setShowNewRequest(false);
        fetchFeatures();
      } else {
        alert('Failed to create request');
      }
    } catch (error) {
      console.error('Failed to create request:', error);
      alert('Failed to create request');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(id: string) {
    if (!user) return;

    try {
      const res = await fetch(`/api/features/${id}/vote`, { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        if (data.voted) {
          setUserVotes(prev => new Set([...prev, id]));
        } else {
          setUserVotes(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
        fetchFeatures();
      }
    } catch (error) {
      console.error('Failed to toggle vote:', error);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'open': return 'var(--text-secondary)';
      case 'in_progress': return 'var(--brand)';
      case 'completed': return '#22c55e';
      case 'declined': return '#ef4444';
      default: return 'var(--text-muted)';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'declined': return 'Declined';
      default: return 'Open';
    }
  }

  function getTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="text-body-lg" style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="text-h1 text-gradient">Feature Requests</h1>
            <p className="text-body-lg" style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Vote on features you'd like to see in goBlink
            </p>
          </div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img 
                  src={user.avatar_url} 
                  alt={user.login}
                  style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                />
                <span className="text-body-sm">{user.login}</span>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => setShowNewRequest(!showNewRequest)}
              >
                {showNewRequest ? 'Cancel' : '+ New Request'}
              </button>
            </div>
          ) : (
            <a href="/api/auth/github" className="btn btn-primary">
              Sign in with GitHub
            </a>
          )}
        </div>

        {/* New Request Form */}
        {showNewRequest && user && (
          <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
            <form onSubmit={handleSubmit}>
              <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Create Feature Request</h3>
              
              <input
                type="text"
                placeholder="Feature title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem',
                  fontSize: '1rem'
                }}
              />

              <textarea
                placeholder="Describe the feature..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Submit Request'}
              </button>
            </form>
          </div>
        )}

        {/* Feature List */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          {features.map((feature) => (
            <Link 
              key={feature.id} 
              href={`/features/${feature.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div 
                className="card" 
                style={{ 
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  display: 'flex',
                  gap: '1rem'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {/* Vote Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleVote(feature.id);
                  }}
                  disabled={!user}
                  style={{
                    background: userVotes.has(feature.id) ? 'var(--brand)' : 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    minWidth: '60px',
                    cursor: user ? 'pointer' : 'not-allowed',
                    color: 'var(--text-primary)'
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>▲</span>
                  <span className="text-body-sm" style={{ fontWeight: 600 }}>{feature.votes}</span>
                </button>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 className="text-h5">{feature.title}</h3>
                    <span 
                      className="text-tiny"
                      style={{ 
                        background: getStatusColor(feature.status) + '20',
                        color: getStatusColor(feature.status),
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontWeight: 600
                      }}
                    >
                      {getStatusLabel(feature.status)}
                    </span>
                  </div>

                  <p className="text-body-sm" style={{ 
                    color: 'var(--text-secondary)', 
                    marginBottom: '0.75rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {feature.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img 
                      src={feature.github_avatar_url} 
                      alt={feature.github_username}
                      style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                    />
                    <span className="text-tiny" style={{ color: 'var(--text-muted)' }}>
                      {feature.github_username} · {getTimeAgo(feature.created_at)}
                    </span>
                    {feature.github_issue_url && (
                      <a 
                        href={feature.github_issue_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-tiny"
                        style={{ color: 'var(--brand)', marginLeft: 'auto' }}
                      >
                        View on GitHub →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {features.length === 0 && (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <p className="text-body-lg" style={{ color: 'var(--text-secondary)' }}>
                No feature requests yet. Be the first to suggest one!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
