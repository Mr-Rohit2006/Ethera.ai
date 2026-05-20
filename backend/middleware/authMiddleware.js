const jwt = require('jsonwebtoken');
const { dbHelper } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'ethera_super_secret_key_12345';

// Authenticate JWT Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Check if user is project owner or has specific project-level roles
function requireProjectRole(allowedRoles) {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      // Project ID can be in params.projectId, params.id, or req.body.project_id
      const projectId = req.params.projectId || req.params.id || req.body.project_id;

      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      // Check if project exists
      const project = await dbHelper.get('SELECT * FROM projects WHERE id = ?', [projectId]);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Owner is always an Admin
      if (project.owner_id === userId) {
        req.projectRole = 'Admin';
        return next();
      }

      // Check membership
      const membership = await dbHelper.get(
        'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
        [projectId, userId]
      );

      if (!membership) {
        return res.status(403).json({ error: 'You are not a member of this project' });
      }

      if (!allowedRoles.includes(membership.role)) {
        return res.status(403).json({ error: 'Required permissions not met' });
      }

      req.projectRole = membership.role;
      next();
    } catch (err) {
      console.error('Error checking project role:', err);
      res.status(500).json({ error: 'Internal server error during role validation' });
    }
  };
}

module.exports = {
  authenticateToken,
  requireProjectRole,
  JWT_SECRET
};
