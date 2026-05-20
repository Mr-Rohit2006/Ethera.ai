const { dbHelper } = require('../config/db');

// Get All Projects for Current User
async function getProjects(req, res) {
  try {
    const userId = req.user.id;
    // Get all projects where the user is either the owner or a member
    const projects = await dbHelper.all(
      `SELECT DISTINCT p.*, 
        CASE 
          WHEN p.owner_id = ? THEN 'Admin'
          ELSE pm.role 
        END as project_role
       FROM projects p
       LEFT JOIN project_members pm ON p.id = pm.project_id
       WHERE p.owner_id = ? OR pm.user_id = ?
       ORDER BY p.created_at DESC`,
      [userId, userId, userId]
    );

    res.json(projects);
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Internal server error fetching projects' });
  }
}

// Create New Project
async function createProject(req, res) {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    // Start a transaction or sequential operations
    const projectResult = await dbHelper.run(
      'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)',
      [name, description || '', userId]
    );
    const projectId = projectResult.id;

    // Add creator as project Admin in project_members
    await dbHelper.run(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [projectId, userId, 'Admin']
    );

    const project = {
      id: projectId,
      name,
      description,
      owner_id: userId,
      project_role: 'Admin'
    };

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Internal server error creating project' });
  }
}

// Get Specific Project Details
async function getProjectById(req, res) {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    // Fetch project
    const project = await dbHelper.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is owner or member
    const membership = await dbHelper.get(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );

    if (project.owner_id !== userId && !membership) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this project' });
    }

    const projectRole = project.owner_id === userId ? 'Admin' : membership.role;
    res.json({ ...project, project_role: projectRole });
  } catch (err) {
    console.error('Get project details error:', err);
    res.status(500).json({ error: 'Internal server error fetching project details' });
  }
}

// Update Project (Project Admin only)
async function updateProject(req, res) {
  try {
    const projectId = req.params.id;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    await dbHelper.run(
      'UPDATE projects SET name = ?, description = ? WHERE id = ?',
      [name, description || '', projectId]
    );

    res.json({ message: 'Project updated successfully' });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Internal server error updating project' });
  }
}

// Delete Project (Project Admin only)
async function deleteProject(req, res) {
  try {
    const projectId = req.params.id;

    // Since we set foreign key constraints with ON DELETE CASCADE,
    // deleting the project will automatically delete matching entries in tasks and project_members.
    await dbHelper.run('DELETE FROM projects WHERE id = ?', [projectId]);

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Internal server error deleting project' });
  }
}

// Get Members of a Project
async function getProjectMembers(req, res) {
  try {
    const projectId = req.params.id;

    const members = await dbHelper.all(
      `SELECT u.id as user_id, u.email, u.full_name, pm.role, pm.created_at
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = ?
       ORDER BY pm.role ASC, u.full_name ASC`,
      [projectId]
    );

    res.json(members);
  } catch (err) {
    console.error('Get project members error:', err);
    res.status(500).json({ error: 'Internal server error fetching project members' });
  }
}

// Add Member to Project (Project Admin only)
async function addProjectMember(req, res) {
  try {
    const projectId = req.params.id;
    const { email, role } = req.body; // Add by email is more user-friendly

    if (!email) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const memberRole = role || 'Member';
    if (!['Admin', 'Member'].includes(memberRole)) {
      return res.status(400).json({ error: 'Invalid member role' });
    }

    // Find user by email
    const targetUser = await dbHelper.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!targetUser) {
      return res.status(404).json({ error: 'User with this email not found in the system' });
    }

    // Check if already a member
    const existingMembership = await dbHelper.get(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, targetUser.id]
    );

    if (existingMembership) {
      return res.status(400).json({ error: 'User is already a member of this project' });
    }

    // Insert membership
    await dbHelper.run(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [projectId, targetUser.id, memberRole]
    );

    res.status(201).json({ message: 'Member added to project successfully' });
  } catch (err) {
    console.error('Add project member error:', err);
    res.status(500).json({ error: 'Internal server error adding project member' });
  }
}

// Update Member Role in Project (Project Admin only)
async function updateProjectMember(req, res) {
  try {
    const projectId = req.params.id;
    const memberId = req.params.userId;
    const { role } = req.body;

    if (!['Admin', 'Member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role value' });
    }

    // Prevent changing project owner's role
    const project = await dbHelper.get('SELECT owner_id FROM projects WHERE id = ?', [projectId]);
    if (project && project.owner_id === Number(memberId)) {
      return res.status(400).json({ error: 'Cannot change project owner role' });
    }

    await dbHelper.run(
      'UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?',
      [role, projectId, memberId]
    );

    res.json({ message: 'Project member role updated successfully' });
  } catch (err) {
    console.error('Update project member role error:', err);
    res.status(500).json({ error: 'Internal server error updating project member role' });
  }
}

// Remove Member from Project (Project Admin only)
async function removeProjectMember(req, res) {
  try {
    const projectId = req.params.id;
    const memberId = req.params.userId;

    // Prevent removing project owner
    const project = await dbHelper.get('SELECT owner_id FROM projects WHERE id = ?', [projectId]);
    if (project && project.owner_id === Number(memberId)) {
      return res.status(400).json({ error: 'Cannot remove project owner from project' });
    }

    await dbHelper.run(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, memberId]
    );

    // Set matching tasks' assignee to NULL
    await dbHelper.run(
      'UPDATE tasks SET assigned_to = NULL WHERE project_id = ? AND assigned_to = ?',
      [projectId, memberId]
    );

    res.json({ message: 'Project member removed successfully' });
  } catch (err) {
    console.error('Remove project member error:', err);
    res.status(500).json({ error: 'Internal server error removing project member' });
  }
}

module.exports = {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  updateProjectMember,
  removeProjectMember
};
