import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Folder, Plus, LogOut, ShieldAlert, FolderKanban } from 'lucide-react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ProjectBoard from './pages/ProjectBoard';
import ProjectSettings from './pages/ProjectSettings';

const API_BASE = window.location.origin.includes('localhost')
  ? 'http://localhost:5000/api'
  : '/api';

// Protected Layout Component to serve sidebar & header
function AppLayout({ user, token, projects, onLogout, onProjectCreated, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Create project modal state
  const [showCreateProj, setShowCreateProj] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjName) return;

    try {
      const response = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newProjName, description: newProjDesc })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create project');

      setShowCreateProj(false);
      setNewProjName('');
      setNewProjDesc('');
      onProjectCreated(data.project);
      
      // Navigate to the newly created project board
      navigate(`/projects/${data.project.id}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ color: 'var(--accent)', background: 'var(--accent-glow)', padding: '6px', borderRadius: '8px', display: 'flex' }}>
            <FolderKanban size={24} />
          </div>
          <span className="logo-text">Ethera.ai</span>
        </div>

        <nav className="sidebar-menu">
          <Link
            to="/dashboard"
            className={`sidebar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>

          {/* PROJECTS HEADER */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '24px',
              marginBottom: '12px',
              padding: '0 16px',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              PROJECTS
            </span>
            <button
              onClick={() => setShowCreateProj(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
                borderRadius: '4px',
                transition: 'background 0.2s'
              }}
              title="Create New Project"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* PROJECTS LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
            {projects.length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0 16px' }}>No projects yet.</span>
            ) : (
              projects.map(proj => {
                const isActive = location.pathname.startsWith(`/projects/${proj.id}`);
                return (
                  <Link
                    key={proj.id}
                    to={`/projects/${proj.id}`}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                    style={{ fontSize: '0.9rem' }}
                  >
                    <Folder size={16} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {proj.name}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </nav>

        {/* SIDEBAR FOOTER */}
        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar">
              {getUserInitials(user.full_name)}
            </div>
            <div className="user-info">
              <span className="user-name">{user.full_name}</span>
              <span className="user-role">{user.role}</span>
            </div>
          </div>
          <button onClick={onLogout} className="logout-btn">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN MAIN CONTENT CONTAINER */}
      <main className="main-content">
        <header className="header">
          <div className="page-title-container">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Welcome back, <strong>{user.full_name}</strong> · Role: <strong>{user.role}</strong>
            </span>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </main>

      {/* CREATE PROJECT DIALOG MODAL */}
      {showCreateProj && (
        <div className="modal-overlay">
          <div className="glass modal-content">
            <div className="modal-header">
              <h3>Create New Project</h3>
              <button onClick={() => setShowCreateProj(false)} className="logout-btn" style={{ border: 'none' }}>✕</button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Project Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="E.g., Ethera Frontend redesign"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    placeholder="Outline details, goal, or tech stack..."
                    style={{ height: '100px', resize: 'vertical' }}
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateProj(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MainApp() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      validateSession();
    } else {
      setLoading(false);
    }
  }, [token]);

  const validateSession = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Session invalid or expired');
      }

      const userData = await response.json();
      setUser(userData);
      
      // Load user projects
      await fetchProjects();
    } catch (err) {
      console.error(err);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE}/projects`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const handleLoginSuccess = (newToken, loggedInUser) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(loggedInUser);
    fetchProjects();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setProjects([]);
    navigate('/login');
  };

  const handleProjectCreated = (newProj) => {
    // Add to project list
    setProjects([newProj, ...projects]);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading session...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={<Auth onLoginSuccess={handleLoginSuccess} />} 
      />
      
      <Route
        path="/dashboard"
        element={
          token ? (
            <AppLayout user={user} token={token} projects={projects} onLogout={handleLogout} onProjectCreated={handleProjectCreated}>
              <Dashboard />
            </AppLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/projects/:projectId"
        element={
          token ? (
            <AppLayout user={user} token={token} projects={projects} onLogout={handleLogout} onProjectCreated={handleProjectCreated}>
              <ProjectBoard />
            </AppLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/projects/:projectId/settings"
        element={
          token ? (
            <AppLayout user={user} token={token} projects={projects} onLogout={handleLogout} onProjectCreated={handleProjectCreated}>
              <ProjectSettings />
            </AppLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* Wildcard redirects to dashboard */}
      <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MainApp />
    </BrowserRouter>
  );
}
