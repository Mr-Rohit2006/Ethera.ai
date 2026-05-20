const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./config/db');

// Controllers
const authController = require('./controllers/authController');
const projectController = require('./controllers/projectController');
const taskController = require('./controllers/taskController');

// Middlewares
const { authenticateToken, requireProjectRole } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());
// Parse JSON body
app.use(express.json());

// Initialize Database
initDb();

// ================= AUTH ROUTES =================
app.post('/api/auth/signup', authController.signup);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', authenticateToken, authController.getMe);
app.get('/api/users', authenticateToken, authController.getAllUsers);

// ================= DASHBOARD ROUTES =================
app.get('/api/dashboard', authenticateToken, taskController.getDashboardStats);

// ================= PROJECT ROUTES =================
app.get('/api/projects', authenticateToken, projectController.getProjects);
app.post('/api/projects', authenticateToken, projectController.createProject);
app.get('/api/projects/:id', authenticateToken, projectController.getProjectById);
app.put('/api/projects/:id', authenticateToken, requireProjectRole(['Admin']), projectController.updateProject);
app.delete('/api/projects/:id', authenticateToken, requireProjectRole(['Admin']), projectController.deleteProject);

// ================= PROJECT MEMBER ROUTES =================
app.get('/api/projects/:id/members', authenticateToken, projectController.getProjectMembers);
app.post('/api/projects/:id/members', authenticateToken, requireProjectRole(['Admin']), projectController.addProjectMember);
app.put('/api/projects/:id/members/:userId', authenticateToken, requireProjectRole(['Admin']), projectController.updateProjectMember);
app.delete('/api/projects/:id/members/:userId', authenticateToken, requireProjectRole(['Admin']), projectController.removeProjectMember);

// ================= TASK ROUTES =================
app.get('/api/projects/:projectId/tasks', authenticateToken, requireProjectRole(['Admin', 'Member']), taskController.getTasks);
app.post('/api/projects/:projectId/tasks', authenticateToken, requireProjectRole(['Admin']), taskController.createTask);
app.put('/api/tasks/:id', authenticateToken, taskController.updateTask);
app.delete('/api/tasks/:id', authenticateToken, taskController.deleteTask);

// ================= STATIC FILES & SPA FALLBACK =================
// Serve static assets from frontend build folder
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Fallback to index.html for React router support (fixes reload 404 errors)
app.get('*', (req, res) => {
  // If the request is for an API that doesn't exist, return 404 instead of index.html
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

module.exports = app;
