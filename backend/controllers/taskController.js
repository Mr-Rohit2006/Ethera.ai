const { dbHelper } = require('../config/db');

// Get All Tasks for a Project
async function getTasks(req, res) {
  try {
    const projectId = req.params.projectId;

    const tasks = await dbHelper.all(
      `SELECT t.*, u.full_name as assignee_name, u.email as assignee_email
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.project_id = ?
       ORDER BY t.created_at DESC`,
      [projectId]
    );

    res.json(tasks);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Internal server error fetching tasks' });
  }
}

// Create Task (Project Admin only)
async function createTask(req, res) {
  try {
    const projectId = req.params.projectId;
    const { title, description, status, priority, due_date, assigned_to } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    // Validate assigned_to is a member of the project if specified
    if (assigned_to) {
      const isMember = await dbHelper.get(
        'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
        [projectId, assigned_to]
      );
      if (!isMember) {
        return res.status(400).json({ error: 'Assigned user is not a member of this project' });
      }
    }

    const result = await dbHelper.run(
      `INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || '',
        status || 'Todo',
        priority || 'Medium',
        due_date || null,
        projectId,
        assigned_to || null
      ]
    );

    const createdTask = await dbHelper.get(
      `SELECT t.*, u.full_name as assignee_name, u.email as assignee_email
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.id = ?`,
      [result.id]
    );

    res.status(201).json({
      message: 'Task created successfully',
      task: createdTask
    });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Internal server error creating task' });
  }
}

// Update Task (Role-Based validation)
async function updateTask(req, res) {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    const { title, description, status, priority, due_date, assigned_to } = req.body;

    // Fetch existing task
    const task = await dbHelper.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const projectId = task.project_id;

    // Check project role of current user
    const project = await dbHelper.get('SELECT owner_id FROM projects WHERE id = ?', [projectId]);
    const membership = await dbHelper.get(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );

    const isOwner = project && project.owner_id === userId;
    const projectRole = isOwner ? 'Admin' : (membership ? membership.role : null);

    if (!projectRole) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this project' });
    }

    // Role-based logic:
    // Members can ONLY update task status.
    // Admins can update all details.
    if (projectRole === 'Member') {
      const isTryingToEditOtherFields = 
        title !== undefined && title !== task.title ||
        description !== undefined && description !== task.description ||
        priority !== undefined && priority !== task.priority ||
        due_date !== undefined && due_date !== task.due_date ||
        assigned_to !== undefined && Number(assigned_to) !== task.assigned_to;

      if (isTryingToEditOtherFields) {
        return res.status(403).json({ error: 'Permissions denied: Project Members can only update task status' });
      }

      // Perform status-only update
      await dbHelper.run(
        'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status || task.status, taskId]
      );
    } else {
      // Admin update (can edit everything)
      // Validate new assignee if being changed
      if (assigned_to && Number(assigned_to) !== task.assigned_to) {
        const isMember = await dbHelper.get(
          'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
          [projectId, assigned_to]
        );
        if (!isMember) {
          return res.status(400).json({ error: 'Assigned user is not a member of this project' });
        }
      }

      await dbHelper.run(
        `UPDATE tasks 
         SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          title !== undefined ? title : task.title,
          description !== undefined ? description : task.description,
          status !== undefined ? status : task.status,
          priority !== undefined ? priority : task.priority,
          due_date !== undefined ? due_date : task.due_date,
          assigned_to !== undefined ? (assigned_to || null) : task.assigned_to,
          taskId
        ]
      );
    }

    const updatedTask = await dbHelper.get(
      `SELECT t.*, u.full_name as assignee_name, u.email as assignee_email
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.id = ?`,
      [taskId]
    );

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Internal server error updating task' });
  }
}

// Delete Task (Project Admin only)
async function deleteTask(req, res) {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    // Fetch task
    const task = await dbHelper.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const projectId = task.project_id;
    const project = await dbHelper.get('SELECT owner_id FROM projects WHERE id = ?', [projectId]);
    const membership = await dbHelper.get(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );

    const isOwner = project && project.owner_id === userId;
    const projectRole = isOwner ? 'Admin' : (membership ? membership.role : null);

    if (projectRole !== 'Admin') {
      return res.status(403).json({ error: 'Access denied: Only project Admins can delete tasks' });
    }

    await dbHelper.run('DELETE FROM tasks WHERE id = ?', [taskId]);

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Internal server error deleting task' });
  }
}

// Get Dashboard Statistics for Current User
async function getDashboardStats(req, res) {
  try {
    const userId = req.user.id;
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Projects count user belongs to
    const projectCountRow = await dbHelper.get(
      `SELECT COUNT(DISTINCT p.id) as count 
       FROM projects p
       LEFT JOIN project_members pm ON p.id = pm.project_id
       WHERE p.owner_id = ? OR pm.user_id = ?`,
      [userId, userId]
    );

    // 2. Personal tasks count
    const totalTasksRow = await dbHelper.get(
      'SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ?',
      [userId]
    );

    // 3. Personal status breakdown
    const statusCounts = await dbHelper.all(
      'SELECT status, COUNT(*) as count FROM tasks WHERE assigned_to = ? GROUP BY status',
      [userId]
    );

    const stats = {
      todo: 0,
      in_progress: 0,
      done: 0
    };

    statusCounts.forEach(row => {
      if (row.status === 'Todo') stats.todo = row.count;
      else if (row.status === 'In Progress') stats.in_progress = row.count;
      else if (row.status === 'Done') stats.done = row.count;
    });

    // 4. Overdue tasks count assigned to user
    const overdueCountRow = await dbHelper.get(
      `SELECT COUNT(*) as count FROM tasks 
       WHERE assigned_to = ? 
       AND due_date IS NOT NULL 
       AND due_date != '' 
       AND due_date < ? 
       AND status != 'Done'`,
      [userId, todayStr]
    );

    // 5. List of upcoming & overdue tasks with Project Names
    const upcomingTasks = await dbHelper.all(
      `SELECT t.*, p.name as project_name,
         CASE 
           WHEN t.due_date < ? AND t.status != 'Done' THEN 1 
           ELSE 0 
         END as is_overdue
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.assigned_to = ? AND t.status != 'Done'
       ORDER BY t.due_date ASC, t.priority DESC
       LIMIT 10`,
      [todayStr, userId]
    );

    res.json({
      project_count: projectCountRow.count,
      my_tasks_count: totalTasksRow.count,
      status_breakdown: stats,
      overdue_count: overdueCountRow.count,
      upcoming_tasks: upcomingTasks
    });
  } catch (err) {
    console.error('Get dashboard stats error:', err);
    res.status(500).json({ error: 'Internal server error gathering dashboard stats' });
  }
}

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getDashboardStats
};
