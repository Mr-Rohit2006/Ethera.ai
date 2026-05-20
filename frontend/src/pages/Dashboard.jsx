import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle, Clock, Folder, AlertTriangle, ArrowRight, User } from 'lucide-react';

const API_BASE = window.location.origin.includes('localhost')
  ? 'http://localhost:5000/api'
  : '/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px' }}>
        <p>Error loading dashboard: {error}</p>
      </div>
    );
  }

  const { todo, in_progress, done } = stats.status_breakdown;
  const totalMyTasks = todo + in_progress + done;
  const completionRate = totalMyTasks > 0 ? Math.round((done / totalMyTasks) * 100) : 0;

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>Workspace Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>An overview of your projects, tasks, and upcoming milestones.</p>
      </div>

      {/* Overdue Alert banner if overdue tasks exist */}
      {stats.overdue_count > 0 && (
        <div
          className="glass"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            padding: '16px 24px',
            borderRadius: 'var(--border-radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--danger)',
              padding: '10px',
              borderRadius: '50%',
              display: 'flex',
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <h4 style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem', marginBottom: '2px' }}>
              Action Required: {stats.overdue_count} Overdue Task{stats.overdue_count > 1 ? 's' : ''}
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              You have tasks that are past their due dates. Complete them as soon as possible.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        {/* Projects Card */}
        <div className="glass glass-interactive" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Active Projects</span>
            <div style={{ color: 'var(--accent)', background: 'var(--accent-glow)', padding: '8px', borderRadius: '8px' }}>
              <Folder size={20} />
            </div>
          </div>
          <span style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'block', color: 'white' }}>
            {stats.project_count}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assigned or owned by you</span>
        </div>

        {/* Total Tasks Card */}
        <div className="glass glass-interactive" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>My Tasks</span>
            <div style={{ color: 'var(--purple)', background: 'var(--purple-glow)', padding: '8px', borderRadius: '8px' }}>
              <Clock size={20} />
            </div>
          </div>
          <span style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'block', color: 'white' }}>
            {totalMyTasks}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {todo} todo · {in_progress} in progress
          </span>
        </div>

        {/* Completion Rate */}
        <div className="glass glass-interactive" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Completion Rate</span>
            <div style={{ color: 'var(--success)', background: 'var(--success-glow)', padding: '8px', borderRadius: '8px' }}>
              <CheckCircle size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'white' }}>
              {completionRate}%
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              ({done} / {totalMyTasks})
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${completionRate}%`, height: '100%', background: 'var(--success)', borderRadius: '3px', transition: 'width 0.5s ease-out' }} />
          </div>
        </div>

        {/* Overdue Card */}
        <div
          className="glass glass-interactive"
          style={{
            padding: '24px',
            borderLeft: stats.overdue_count > 0 ? '3px solid var(--danger)' : '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Overdue Tasks</span>
            <div
              style={{
                color: 'var(--danger)',
                background: 'var(--danger-glow)',
                padding: '8px',
                borderRadius: '8px',
              }}
            >
              <AlertTriangle size={20} />
            </div>
          </div>
          <span
            style={{
              fontSize: '2.2rem',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              display: 'block',
              color: stats.overdue_count > 0 ? 'var(--danger)' : 'white',
            }}
          >
            {stats.overdue_count}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Require immediate attention</span>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        {/* Upcoming Tasks Section */}
        <div className="glass" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', fontFamily: 'var(--font-display)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            My Active Tasks & Deadlines
          </h3>

          {stats.upcoming_tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>You have no active tasks assigned to you right now.</p>
              <Link to="/dashboard" style={{ display: 'none' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.upcoming_tasks.map((task) => (
                <div
                  key={task.id}
                  className="glass-interactive"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-sm)',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Status Circle Indicator */}
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background:
                          task.status === 'Done'
                            ? 'var(--success)'
                            : task.status === 'In Progress'
                            ? 'var(--accent)'
                            : 'var(--text-muted)',
                      }}
                    />
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>{task.title}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                          Project: {task.project_name}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
                        <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {task.due_date && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.85rem',
                          color: task.is_overdue ? 'var(--danger)' : 'var(--text-secondary)',
                          background: task.is_overdue ? 'var(--danger-glow)' : 'rgba(255,255,255,0.03)',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: task.is_overdue ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid transparent',
                        }}
                      >
                        <Calendar size={14} />
                        <span>{task.due_date}</span>
                        {task.is_overdue === 1 && <span style={{ fontWeight: 600 }}>OVERDUE</span>}
                      </div>
                    )}

                    <Link
                      to={`/projects/${task.project_id}`}
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>Board</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
