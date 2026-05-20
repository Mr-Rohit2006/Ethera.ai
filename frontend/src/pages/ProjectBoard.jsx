import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Calendar, User, Search, Settings, Edit2, Trash2, SlidersHorizontal } from 'lucide-react';

const API_BASE = window.location.origin.includes('localhost')
  ? 'http://localhost:5000/api'
  : '/api';

export default function ProjectBoard() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterAssignee, setFilterAssignee] = useState('All');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  // Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskStatus, setTaskStatus] = useState('Todo');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      // 1. Fetch Project Details
      const projRes = await fetch(`${API_BASE}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!projRes.ok) throw new Error('Failed to load project details');
      const projData = await projRes.json();
      setProject(projData);

      // 2. Fetch Tasks
      const tasksRes = await fetch(`${API_BASE}/projects/${projectId}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!tasksRes.ok) throw new Error('Failed to load tasks');
      const tasksData = await tasksRes.json();
      setTasks(tasksData);

      // 3. Fetch Project Members
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

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          priority: taskPriority,
          status: taskStatus,
          due_date: taskDueDate,
          assigned_to: taskAssignee || null
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create task');

      setTasks([data.task, ...tasks]);
      setShowCreateModal(false);
      // Reset form
      setTaskTitle('');
      setTaskDesc('');
      setTaskPriority('Medium');
      setTaskStatus('Todo');
      setTaskDueDate('');
      setTaskAssignee('');
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditModal = (task) => {
    setActiveTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskPriority(task.priority);
    setTaskStatus(task.status);
    setTaskDueDate(task.due_date || '');
    setTaskAssignee(task.assigned_to || '');
    setShowEditModal(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const isAdmin = project.project_role === 'Admin';
    
    // Construct payload based on user role
    const payload = isAdmin 
      ? {
          title: taskTitle,
          description: taskDesc,
          priority: taskPriority,
          status: taskStatus,
          due_date: taskDueDate,
          assigned_to: taskAssignee || null
        }
      : {
          status: taskStatus // Members can only update status
        };

    try {
      const response = await fetch(`${API_BASE}/tasks/${activeTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update task');

      // Update in local state
      setTasks(tasks.map(t => t.id === activeTask.id ? data.task : t));
      setShowEditModal(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete task');

      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleQuickStatusChange = async (task, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update task');

      setTasks(tasks.map(t => t.id === task.id ? data.task : t));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading project details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px' }}>
        <p>Error loading board: {error}</p>
        <Link to="/dashboard" className="btn btn-secondary" style={{ marginTop: '16px' }}>Back to Dashboard</Link>
      </div>
    );
  }

  const isAdmin = project.project_role === 'Admin';

  // Apply filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;
    
    const matchesAssignee = 
      filterAssignee === 'All' || 
      (filterAssignee === 'Unassigned' && !task.assigned_to) || 
      (task.assigned_to && task.assigned_to.toString() === filterAssignee);

    return matchesSearch && matchesPriority && matchesAssignee;
  });

  const columns = ['Todo', 'In Progress', 'Done'];

  return (
    <div>
      {/* Board Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '32px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '24px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>{project.name}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{project.description || 'No description provided.'}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to={`/projects/${projectId}/settings`} className="btn btn-secondary">
            <Settings size={16} />
            <span>Settings & Team</span>
          </Link>
          {isAdmin && (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus size={18} />
              <span>New Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass"
        style={{
          padding: '16px 20px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
          <SlidersHorizontal size={16} />
          <span>Filters:</span>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search tasks..."
            className="form-input"
            style={{ paddingLeft: '36px', paddingTop: '8px', paddingBottom: '8px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Priority Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Priority:</span>
          <select
            className="form-input"
            style={{ width: 'auto', paddingTop: '8px', paddingBottom: '8px' }}
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Assignee Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Assignee:</span>
          <select
            className="form-input"
            style={{ width: 'auto', paddingTop: '8px', paddingBottom: '8px' }}
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
          >
            <option value="All">All Members</option>
            <option value="Unassigned">Unassigned</option>
            {members.map(member => (
              <option key={member.user_id} value={member.user_id}>{member.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Grid */}
      <div className="kanban-grid">
        {columns.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col);
          return (
            <div key={col} className="kanban-column">
              <div className="kanban-column-header">
                <div className="kanban-column-title">
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: col === 'Todo' ? 'var(--text-muted)' : col === 'In Progress' ? 'var(--accent)' : 'var(--success)'
                    }}
                  />
                  <span style={{ fontWeight: 600 }}>{col}</span>
                  <span className="kanban-column-count">{colTasks.length}</span>
                </div>
              </div>

              <div className="kanban-cards">
                {colTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No tasks here
                  </div>
                ) : (
                  colTasks.map(task => (
                    <div key={task.id} className="glass glass-interactive task-card">
                      <div className="task-card-header">
                        <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => openEditModal(task)} className="logout-btn" style={{ padding: '4px', border: 'none', background: 'transparent' }}>
                            <Edit2 size={13} style={{ color: 'var(--text-secondary)' }} />
                          </button>
                          {isAdmin && (
                            <button onClick={() => handleDeleteTask(task.id)} className="logout-btn" style={{ padding: '4px', border: 'none', background: 'transparent' }}>
                              <Trash2 size={13} style={{ color: 'var(--danger)' }} />
                            </button>
                          )}
                        </div>
                      </div>

                      <h4 className="task-title" style={{ marginBottom: '6px', fontWeight: 600 }}>{task.title}</h4>
                      <p className="task-desc">{task.description || 'No description.'}</p>

                      {/* Move status buttons for quick workflow change */}
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                        {columns.filter(c => c !== task.status).map(statusOpt => (
                          <button
                            key={statusOpt}
                            onClick={() => handleQuickStatusChange(task, statusOpt)}
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid var(--border-color)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer'
                            }}
                          >
                            → {statusOpt}
                          </button>
                        ))}
                      </div>

                      <div className="task-card-footer">
                        {task.due_date ? (
                          <span className="task-due-date">
                            <Calendar size={12} />
                            <span>{task.due_date}</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No due date</span>
                        )}

                        <div className="task-assignee">
                          {task.assignee_name ? (
                            <>
                              <div className="task-assignee-avatar">
                                {task.assignee_name.charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontSize: '0.75rem', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {task.assignee_name}
                              </span>
                            </>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unassigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="glass modal-content">
            <div className="modal-header">
              <h3>Create New Task</h3>
              <button onClick={() => setShowCreateModal(false)} className="logout-btn" style={{ border: 'none' }}>✕</button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Task Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="E.g., Implement OAuth Flow"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    placeholder="Describe what needs to be done..."
                    style={{ height: '80px', resize: 'vertical' }}
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-input" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)}>
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assign To</label>
                    <select
                      className="form-input"
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {members.map(m => (
                        <option key={m.user_id} value={m.user_id}>{m.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="glass modal-content">
            <div className="modal-header">
              <div>
                <h3>Edit Task</h3>
                {!isAdmin && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'var(--accent-glow)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                    View-Only (Member Mode)
                  </span>
                )}
              </div>
              <button onClick={() => setShowEditModal(false)} className="logout-btn" style={{ border: 'none' }}>✕</button>
            </div>
            <form onSubmit={handleUpdateTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Task Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    required
                    disabled={!isAdmin}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    style={{ height: '80px', resize: 'vertical' }}
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    disabled={!isAdmin}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-input" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} disabled={!isAdmin}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)}>
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assign To</label>
                    <select
                      className="form-input"
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                      disabled={!isAdmin}
                    >
                      <option value="">Unassigned</option>
                      {members.map(m => (
                        <option key={m.user_id} value={m.user_id}>{m.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
