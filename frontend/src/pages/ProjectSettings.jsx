import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { UserPlus, Shield, Trash2, ArrowLeft, Users, Save, AlertCircle } from 'lucide-react';

const API_BASE = window.location.origin.includes('localhost')
  ? 'http://localhost:5000/api'
  : '/api';

export default function ProjectSettings() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit project state
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');

  // Add member state
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('Member');

  useEffect(() => {
    fetchProjectAndMembers();
  }, [projectId]);

  const fetchProjectAndMembers = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      // 1. Fetch project details
      const projRes = await fetch(`${API_BASE}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!projRes.ok) throw new Error('Failed to load project details');
      const projData = await projRes.json();
      setProject(projData);
      setProjectName(projData.name);
      setProjectDesc(projData.description || '');

      // 2. Fetch project members
      const membersRes = await fetch(`${API_BASE}/projects/${projectId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!membersRes.ok) throw new Error('Failed to load project members');
      const membersData = await membersRes.json();
      setMembers(membersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: projectName, description: projectDesc })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update project');
      setSuccess('Project details updated successfully!');
      // Update local project object
      setProject({ ...project, name: projectName, description: projectDesc });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProject = async () => {
    const doubleConfirm = window.confirm('WARNING: Deleting this project will permanently delete all associated tasks and memberships. This cannot be undone. Are you sure?');
    if (!doubleConfirm) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete project');
      navigate('/dashboard');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: memberEmail, role: memberRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add member');

      setSuccess(`Added member ${memberEmail} successfully.`);
      setMemberEmail('');
      // Refresh list
      fetchProjectAndMembers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateMemberRole = async (memberId, currentRole) => {
    const newRole = currentRole === 'Admin' ? 'Member' : 'Admin';
    setSuccess('');
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update member role');
      
      setSuccess('Member role updated.');
      fetchProjectAndMembers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member from the project?')) return;
    setSuccess('');
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove member');

      setSuccess('Member removed from project.');
      fetchProjectAndMembers();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading project settings...</p>
      </div>
    );
  }

  const isAdmin = project && project.project_role === 'Admin';

  return (
    <div>
      {/* Back to board button */}
      <div style={{ marginBottom: '24px' }}>
        <Link to={`/projects/${projectId}`} className="sidebar-link" style={{ display: 'inline-flex', padding: 0, gap: '6px', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} />
          <span>Back to Kanban Board</span>
        </Link>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>Project Settings</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Manage team memberships, project details, and preferences.</p>
      </div>

      {!isAdmin && (
        <div
          className="glass"
          style={{
            background: 'rgba(99, 102, 241, 0.05)',
            border: '1px solid var(--border-color)',
            padding: '16px 20px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '32px'
          }}
        >
          <AlertCircle size={20} style={{ color: 'var(--accent)' }} />
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            You are viewing this project in **Member Mode**. Adding/removing team members and updating project configurations require project **Admin** permissions.
          </p>
        </div>
      )}

      {/* Success/Error Alerts */}
      {success && (
        <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--success)', borderRadius: '6px', marginBottom: '24px', fontSize: '0.85rem' }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: '6px', marginBottom: '24px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        {/* Split view for details & members */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          
          {/* Section 1: Edit Details */}
          <div className="glass" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '24px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} style={{ color: 'var(--accent)' }} />
              <span>Project Details</span>
            </h3>

            <form onSubmit={handleUpdateProject}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={!isAdmin}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '28px' }}>
                <label className="form-label">Project Description</label>
                <textarea
                  className="form-input"
                  style={{ height: '100px', resize: 'vertical' }}
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  disabled={!isAdmin}
                />
              </div>

              {isAdmin && (
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  <Save size={16} />
                  <span>Save Project Settings</span>
                </button>
              )}
            </form>

            {isAdmin && (
              <div style={{ marginTop: '40px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                <h4 style={{ color: 'var(--danger)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px' }}>Danger Zone</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px' }}>Once you delete a project, there is no going back. Please be certain.</p>
                <button onClick={handleDeleteProject} className="btn btn-danger" style={{ width: '100%' }}>
                  <Trash2 size={16} />
                  <span>Delete Project</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Members List & Invitation */}
          <div className="glass" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '24px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: 'var(--purple)' }} />
              <span>Team Members ({members.length})</span>
            </h3>

            {/* Invite Form (Admins only) */}
            {isAdmin && (
              <form onSubmit={handleAddMember} style={{ marginBottom: '28px', background: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', fontWeight: 600 }}>Invite Team Member</h4>
                
                <div className="form-group">
                  <label className="form-label">User Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="teammate@company.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Project Role</label>
                  <select className="form-input" value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '8px' }}>
                  <UserPlus size={16} />
                  <span>Add Member</span>
                </button>
              </form>
            )}

            {/* Members List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {members.map((member) => {
                const isProjectOwner = project && project.owner_id === member.user_id;
                return (
                  <div
                    key={member.user_id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-sm)',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div className="task-assignee-avatar" style={{ flexShrink: 0, width: '32px', height: '32px', fontSize: '0.85rem' }}>
                        {member.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>{member.full_name}</span>
                          {isProjectOwner && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '1px 6px', borderRadius: '4px' }}>
                              Owner
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {member.email}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Role Badge / Control */}
                      {isAdmin && !isProjectOwner ? (
                        <button
                          onClick={() => handleUpdateMemberRole(member.user_id, member.role)}
                          style={{
                            background: member.role === 'Admin' ? 'var(--purple-glow)' : 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--border-color)',
                            color: member.role === 'Admin' ? 'var(--purple)' : 'var(--text-secondary)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                          title="Click to toggle role"
                        >
                          {member.role}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '4px' }}>
                          {member.role}
                        </span>
                      )}

                      {/* Remove Button */}
                      {isAdmin && !isProjectOwner && (
                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            color: 'var(--danger)'
                          }}
                          title="Remove user from project"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
