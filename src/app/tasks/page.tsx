'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email?: string;
  role: string;
  avatar_url?: string;
}

interface Category {
  id: string;
  name: string;
}

interface Task {
  id: string;
  name: string;
  category_id?: string;
  category?: Category;
  is_regular: boolean;
  start_date?: string;
  end_date?: string;
  user_tasks?: Array<{
    id: string;
    user_id: string;
    is_done: boolean;
    completed_at?: string;
    user?: User;
  }>;
}

export default function TasksPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states
  const [taskName, setTaskName] = useState('');
  const [taskCategoryId, setTaskCategoryId] = useState('');
  const [taskIsRegular, setTaskIsRegular] = useState(false);
  const [taskStartDate, setTaskStartDate] = useState('');
  const [taskEndDate, setTaskEndDate] = useState('');
  const [taskAssignedUsers, setTaskAssignedUsers] = useState<string[]>([]);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (!response.ok) {
        router.push('/login');
        return;
      }
      const data = await response.json();
      
      // Check if user has at least member role
      if (!['member', 'admin', 'owner'].includes(data.user.role)) {
        router.push('/dashboard');
        return;
      }

      setUser(data.user);
      await Promise.all([fetchCategories(), fetchUsers()]);
      // Fetch tasks after user is set so we can filter properly
      await fetchTasksForUser(data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasksForUser = async (userData: User) => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        // For members, only show tasks assigned to them
        // For admins/owners, show all tasks
        if (userData.role === 'member') {
          const myTasks = data.tasks.filter((task: Task) => 
            task.user_tasks?.some(ut => ut.user_id === userData.id)
          );
          setTasks(myTasks);
        } else {
          setTasks(data.tasks);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const fetchTasks = async () => {
    if (user) {
      await fetchTasksForUser(user);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users.filter((u: User) => ['member', 'admin', 'owner'].includes(u.role)));
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  const openTaskModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setTaskName(task.name);
      setTaskCategoryId(task.category_id || '');
      setTaskIsRegular(task.is_regular);
      setTaskStartDate(task.start_date ? task.start_date.split('T')[0] : '');
      setTaskEndDate(task.end_date ? task.end_date.split('T')[0] : '');
      setTaskAssignedUsers(task.user_tasks?.map(ut => ut.user_id) || []);
    } else {
      setEditingTask(null);
      setTaskName('');
      setTaskCategoryId('');
      setTaskIsRegular(false);
      setTaskStartDate('');
      setTaskEndDate('');
      setTaskAssignedUsers([]);
    }
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
    } else {
      setEditingCategory(null);
      setCategoryName('');
    }
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taskData = {
        name: taskName,
        category_id: taskCategoryId || null,
        is_regular: taskIsRegular,
        start_date: taskStartDate || null,
        end_date: taskEndDate || null,
        assigned_user_ids: taskAssignedUsers,
      };

      const response = editingTask
        ? await fetch(`/api/tasks/${editingTask.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData),
          })
        : await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData),
          });

      if (response.ok) {
        await fetchTasks();
        closeTaskModal();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save task');
      }
    } catch (error) {
      console.error('Failed to save task:', error);
      alert('Failed to save task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTasks();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = editingCategory
        ? await fetch(`/api/categories/${editingCategory.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: categoryName }),
          })
        : await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: categoryName }),
          });

      if (response.ok) {
        await fetchCategories();
        closeCategoryModal();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Failed to save category');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCategories();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    }
  };

  const handleToggleTaskDone = async (userTaskId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/tasks/user-tasks/${userTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_done: !currentStatus }),
      });

      if (response.ok) {
        await fetchTasks();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update task status');
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      alert('Failed to update task status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user?.role === 'member' ? 'My Tasks' : 'Task Management'}
            </h1>
            <p className="text-gray-600 mt-2">
              {user?.role === 'member' 
                ? 'View and complete your assigned tasks'
                : `Role: ${user?.role} - Full task management access`
              }
            </p>
          </div>
          <div className="flex gap-4">
            {isAdmin && (
              <button
                onClick={() => router.push('/admin/tasks')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Admin Dashboard
              </button>
            )}
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Categories Section - Only show for admins */}
        {isAdmin && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
              <button
                onClick={() => openCategoryModal()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                New Category
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openCategoryModal(category)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {tasks.filter((t) => t.category_id === category.id).length} tasks
                  </p>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-gray-500 col-span-full">No categories yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Tasks Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.role === 'member' ? 'My Assigned Tasks' : 'All Tasks'}
            </h2>
            {isAdmin && (
              <button
                onClick={() => openTaskModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                New Task
              </button>
            )}
          </div>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{task.name}</h3>
                    {task.category && (
                      <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {task.category.name}
                      </span>
                    )}
                    <div className="mt-2 text-sm text-gray-600">
                      {task.is_regular ? (
                        <span className="text-green-600 font-semibold">Regular (Daily)</span>
                      ) : (
                        <span>
                          {task.start_date && `Start: ${new Date(task.start_date).toLocaleDateString()}`}
                          {task.end_date && ` • End: ${new Date(task.end_date).toLocaleDateString()}`}
                        </span>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openTaskModal(task)}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Assigned Users */}
                {task.user_tasks && task.user_tasks.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      {user?.role === 'member' ? 'Your Status:' : 'Assigned to:'}
                    </h4>
                    <div className="space-y-2">
                      {task.user_tasks
                        .filter(userTask => 
                          user?.role !== 'member' || userTask.user_id === user?.id
                        )
                        .map((userTask) => (
                          <div
                            key={userTask.id}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded"
                          >
                            <div className="flex items-center gap-3">
                              {userTask.user?.avatar_url && (
                                <img
                                  src={userTask.user.avatar_url}
                                  alt={userTask.user.username}
                                  className="w-8 h-8 rounded-full"
                                />
                              )}
                              {user?.role !== 'member' && (
                                <span className="text-sm font-medium">
                                  {userTask.user?.username || 'Unknown User'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {userTask.is_done && userTask.completed_at && (
                                <span className="text-xs text-gray-500">
                                  Completed: {new Date(userTask.completed_at).toLocaleDateString()}
                                </span>
                              )}
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={userTask.is_done}
                                  onChange={() => handleToggleTaskDone(userTask.id, userTask.is_done)}
                                  disabled={user?.role !== 'member' && userTask.user_id !== user?.id}
                                  className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  {userTask.is_done ? 'Done' : 'Mark as done'}
                                </span>
                              </label>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-gray-500 text-center py-8">No tasks yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h2>
            <form onSubmit={handleSaveTask}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Name *
                  </label>
                  <input
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={taskCategoryId}
                    onChange={(e) => setTaskCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={taskIsRegular}
                      onChange={(e) => setTaskIsRegular(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Regular (Daily) Task
                    </span>
                  </label>
                </div>

                {!taskIsRegular && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={taskStartDate}
                        onChange={(e) => setTaskStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={taskEndDate}
                        onChange={(e) => setTaskEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Users
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {users.map((u) => (
                      <label key={u.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={taskAssignedUsers.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTaskAssignedUsers([...taskAssignedUsers, u.id]);
                            } else {
                              setTaskAssignedUsers(taskAssignedUsers.filter((id) => id !== u.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm">
                          {u.username} ({u.role})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h2>
            <form onSubmit={handleSaveCategory}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
