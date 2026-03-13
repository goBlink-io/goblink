'use client';

import { use, useEffect, useState } from 'react';
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
}

interface Comment {
  id: string;
  github_username: string;
  github_avatar_url: string;
  body: string;
  created_at: string;
  is_admin: boolean;
}

interface GitHubUser {
  id: string;
  login: string;
  avatar_url: string;
}

export default function FeatureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [feature, setFeature] = useState<FeatureRequest | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchFeature();
    fetchComments();
  }, [id]);

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

  async function fetchFeature() {
    try {
      const res = await fetch('/api/features');
      const data = await res.json();
      const found = data.requests?.find((r: FeatureRequest) => r.id === id);
      if (found) {
        setFeature(found);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch feature:', error);
      setLoading(false);
    }
  }

  async function fetchComments() {
    try {
      const res = await fetch(`/api/features/${id}/comments`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  }

  async function handleVote() {
    if (!user) return;

    try {
      const res = await fetch(`/api/features/${id}/vote`, { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        setHasVoted(data.voted);
        fetchFeature();
      }
    } catch (error) {
      console.error('Failed to toggle vote:', error);
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/features/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: commentBody }),
      });

      if (res.ok) {
        setCommentBody('');
        setSubmitError(null);
        fetchComments();
      } else {
        setSubmitError('Failed to add comment');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      setSubmitError('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'open': return 'var(--text-secondary)';
      case 'in_progress': return 'var(--brand)';
      case 'completed': return 'var(--success)';
      case 'declined': return 'var(--error)';
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
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p className="text-body-lg" style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!feature) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p className="text-body-lg" style={{ color: 'var(--text-secondary)' }}>Feature request not found</p>
          <Link href="/features" className="btn" style={{ marginTop: '1rem', display: 'inline-block' }}>
            ← Back to features
          </Link>
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
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Back button */}
        <Link href="/features" className="text-body-sm" style={{ color: 'var(--brand)', marginBottom: '1.5rem', display: 'inline-block' }}>
          ← Back to features
        </Link>

        {/* Feature Header */}
        <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
            {/* Vote Button */}
            <button
              onClick={handleVote}
              disabled={!user}
              style={{
                background: hasVoted ? 'var(--brand)' : 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                minWidth: '80px',
                cursor: user ? 'pointer' : 'not-allowed',
                color: 'var(--text-primary)'
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>▲</span>
              <span className="text-body-lg" style={{ fontWeight: 600 }}>{feature.votes}</span>
              <span className="text-tiny" style={{ color: 'var(--text-muted)' }}>votes</span>
            </button>

            {/* Content */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <h1 className="text-h3">{feature.title}</h1>
                <span 
                  className="text-tiny"
                  style={{ 
                    background: getStatusColor(feature.status) + '20',
                    color: getStatusColor(feature.status),
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}
                >
                  {getStatusLabel(feature.status)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <img 
                  src={feature.github_avatar_url} 
                  alt={feature.github_username}
                  style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                />
                <span className="text-body-sm" style={{ color: 'var(--text-muted)' }}>
                  {feature.github_username} · {getTimeAgo(feature.created_at)}
                </span>
              </div>

              <p className="text-body-lg" style={{ 
                color: 'var(--text-secondary)', 
                whiteSpace: 'pre-wrap',
                lineHeight: '1.6'
              }}>
                {feature.description}
              </p>

              {feature.github_issue_url && (
                <a 
                  href={feature.github_issue_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ marginTop: '1rem', display: 'inline-block' }}
                >
                  View on GitHub →
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="card" style={{ padding: '2rem' }}>
          <h2 className="text-h5" style={{ marginBottom: '1.5rem' }}>
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleSubmitComment} style={{ marginBottom: '2rem' }}>
              <textarea
                placeholder="Add a comment..."
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                required
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
              {submitError && (
                <p className="text-body-sm" style={{ color: 'var(--error)', marginBottom: '0.5rem' }}>{submitError}</p>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          ) : (
            <div style={{ 
              padding: '1.5rem', 
              background: 'var(--surface)', 
              borderRadius: '8px',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <p className="text-body-sm" style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Sign in to comment
              </p>
              <a href="/api/auth/github" className="btn btn-primary">
                Sign in with GitHub
              </a>
            </div>
          )}

          {/* Comments List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {comments.map((comment) => (
              <div 
                key={comment.id}
                style={{ 
                  display: 'flex', 
                  gap: '1rem',
                  padding: '1rem',
                  background: 'var(--surface)',
                  borderRadius: '8px'
                }}
              >
                <img 
                  src={comment.github_avatar_url} 
                  alt={comment.github_username}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span className="text-body-sm" style={{ fontWeight: 600 }}>
                      {comment.github_username}
                    </span>
                    {comment.is_admin && (
                      <span 
                        className="text-tiny"
                        style={{ 
                          background: 'var(--brand)' + '20',
                          color: 'var(--brand)',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '4px',
                          fontWeight: 600
                        }}
                      >
                        ADMIN
                      </span>
                    )}
                    <span className="text-tiny" style={{ color: 'var(--text-muted)' }}>
                      {getTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-body-sm" style={{ 
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.5'
                  }}>
                    {comment.body}
                  </p>
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-body-sm" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
