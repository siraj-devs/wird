"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  created_at: string;
}

interface Task {
  id: string;
  name: string;
  category_id?: string;
  category?: Category;
  is_regular: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  user_tasks?: Array<{
    id: string;
    user_id: string;
    is_done: boolean;
    completed_at?: string;
    user?: User;
  }>;
}

export default function AdminTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states
  const [taskName, setTaskName] = useState("");
  const [taskCategoryId, setTaskCategoryId] = useState("");
  const [taskIsRegular, setTaskIsRegular] = useState(false);
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskEndDate, setTaskEndDate] = useState("");
  const [taskAssignedUsers, setTaskAssignedUsers] = useState<string[]>([]);
  const [categoryName, setCategoryName] = useState("");

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/user");
      if (!response.ok) {
        router.push("/login");
        return;
      }
      const data = await response.json();

      if (!["admin", "owner"].includes(data.user.role)) {
        router.push("/dashboard");
        return;
      }

      await Promise.all([fetchTasks(), fetchCategories(), fetchUsers()]);
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(
          data.users.filter((u: User) =>
            ["member", "admin", "owner"].includes(u.role),
          ),
        );
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const openTaskModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setTaskName(task.name);
      setTaskCategoryId(task.category_id || "");
      setTaskIsRegular(task.is_regular);
      setTaskStartDate(task.start_date ? task.start_date.split("T")[0] : "");
      setTaskEndDate(task.end_date ? task.end_date.split("T")[0] : "");
      setTaskAssignedUsers(task.user_tasks?.map((ut) => ut.user_id) || []);
    } else {
      setEditingTask(null);
      setTaskName("");
      setTaskCategoryId("");
      setTaskIsRegular(false);
      setTaskStartDate("");
      setTaskEndDate("");
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
      setCategoryName("");
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
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(taskData),
          })
        : await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(taskData),
          });

      if (response.ok) {
        await fetchTasks();
        closeTaskModal();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save task");
      }
    } catch (error) {
      console.error("Failed to save task:", error);
      alert("Failed to save task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchTasks();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete task");
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
      alert("Failed to delete task");
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = editingCategory
        ? await fetch(`/api/categories/${editingCategory.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: categoryName }),
          })
        : await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: categoryName }),
          });

      if (response.ok) {
        await fetchCategories();
        closeCategoryModal();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save category");
      }
    } catch (error) {
      console.error("Failed to save category:", error);
      alert("Failed to save category");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? Tasks will not be deleted.",
      )
    )
      return;

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchCategories();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("Failed to delete category");
    }
  };

  const getTaskCompletionStatus = (task: Task) => {
    if (!task.user_tasks || task.user_tasks.length === 0) return "unassigned";
    const completedCount = task.user_tasks.filter((ut) => ut.is_done).length;
    const totalCount = task.user_tasks.length;
    if (completedCount === 0) return "not-started";
    if (completedCount === totalCount) return "completed";
    return "in-progress";
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesCategory =
      categoryFilter === "all" ||
      task.category_id === categoryFilter ||
      (categoryFilter === "none" && !task.category_id);
    const status = getTaskCompletionStatus(task);
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    return matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Task & Category Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage tasks, categories, and assignments
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/admin/users")}
              className="rounded-lg bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-700"
            >
              User Management
            </button>
            <button
              onClick={() => router.push("/admin/access-requests")}
              className="rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
            >
              Access Requests
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-lg bg-gray-600 px-4 py-2 text-white transition hover:bg-gray-700"
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Categories Section */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
            <button
              onClick={() => openCategoryModal()}
              className="rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
            >
              + New Category
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="rounded-lg bg-white p-4 shadow transition hover:shadow-md"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {category.name}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openCategoryModal(category)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {tasks.filter((t) => t.category_id === category.id).length}{" "}
                  tasks
                </p>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="col-span-full text-gray-500">No categories yet.</p>
            )}
          </div>
        </div>

        {/* Tasks Section */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
            <button
              onClick={() => openTaskModal()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
            >
              + New Task
            </button>
          </div>

          {/* Filters */}
          <div className="mb-4 rounded-lg bg-white p-4 shadow">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Filter by Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="none">No Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="unassigned">Unassigned</option>
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const status = getTaskCompletionStatus(task);
              return (
                <div key={task.id} className="rounded-lg bg-white p-6 shadow">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {task.name}
                        </h3>
                        {status === "completed" && (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                            Completed
                          </span>
                        )}
                        {status === "in-progress" && (
                          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                            In Progress
                          </span>
                        )}
                        {status === "not-started" && (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800">
                            Not Started
                          </span>
                        )}
                        {status === "unassigned" && (
                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-800">
                            Unassigned
                          </span>
                        )}
                      </div>
                      {task.category && (
                        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                          {task.category.name}
                        </span>
                      )}
                      <div className="mt-2 text-sm text-gray-600">
                        {task.is_regular ? (
                          <span className="font-semibold text-green-600">
                            ⟳ Regular (Daily)
                          </span>
                        ) : (
                          <span>
                            {task.start_date &&
                              `📅 Start: ${new Date(task.start_date).toLocaleDateString()}`}
                            {task.end_date &&
                              ` → End: ${new Date(task.end_date).toLocaleDateString()}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openTaskModal(task)}
                        className="rounded px-3 py-1 text-blue-600 hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="rounded px-3 py-1 text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Assigned Users */}
                  {task.user_tasks && task.user_tasks.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="mb-2 text-sm font-semibold text-gray-700">
                        Assigned to (
                        {task.user_tasks.filter((ut) => ut.is_done).length}/
                        {task.user_tasks.length} completed):
                      </h4>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {task.user_tasks.map((userTask) => (
                          <div
                            key={userTask.id}
                            className={`flex items-center justify-between rounded p-3 ${
                              userTask.is_done ? "bg-green-50" : "bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {userTask.user?.avatar_url && (
                                <Image
                                  src={userTask.user.avatar_url}
                                  alt={userTask.user.username}
                                  className="h-8 w-8 rounded-full"
                                  width={32}
                                  height={32}
                                />
                              )}
                              <div>
                                <span className="text-sm font-medium">
                                  {userTask.user?.username || "Unknown User"}
                                </span>
                                {userTask.is_done && userTask.completed_at && (
                                  <div className="text-xs text-gray-500">
                                    ✓{" "}
                                    {new Date(
                                      userTask.completed_at,
                                    ).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            {userTask.is_done ? (
                              <span className="text-sm font-semibold text-green-600">
                                ✓ Done
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">
                                Pending
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredTasks.length === 0 && (
              <p className="py-8 text-center text-gray-500">
                No tasks found matching your filters.
              </p>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm font-medium text-gray-500">Total Tasks</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {tasks.length}
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm font-medium text-gray-500">Completed</div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              {
                tasks.filter((t) => getTaskCompletionStatus(t) === "completed")
                  .length
              }
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm font-medium text-gray-500">In Progress</div>
            <div className="mt-2 text-3xl font-bold text-yellow-600">
              {
                tasks.filter(
                  (t) => getTaskCompletionStatus(t) === "in-progress",
                ).length
              }
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm font-medium text-gray-500">Categories</div>
            <div className="mt-2 text-3xl font-bold text-blue-600">
              {categories.length}
            </div>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
            <h2 className="mb-4 text-2xl font-bold">
              {editingTask ? "Edit Task" : "Create New Task"}
            </h2>
            <form onSubmit={handleSaveTask}>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Task Name *
                  </label>
                  <input
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    value={taskCategoryId}
                    onChange={(e) => setTaskCategoryId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                      className="h-4 w-4 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Regular (Daily) Task
                    </span>
                  </label>
                </div>

                {!taskIsRegular && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={taskStartDate}
                        onChange={(e) => setTaskStartDate(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={taskEndDate}
                        onChange={(e) => setTaskEndDate(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Assign to Users
                  </label>
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                    {users.map((u) => (
                      <label key={u.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={taskAssignedUsers.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTaskAssignedUsers([
                                ...taskAssignedUsers,
                                u.id,
                              ]);
                            } else {
                              setTaskAssignedUsers(
                                taskAssignedUsers.filter((id) => id !== u.id),
                              );
                            }
                          }}
                          className="h-4 w-4 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm">
                          {u.username}{" "}
                          <span className="text-gray-500">({u.role})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                >
                  {editingTask ? "Update Task" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-2xl font-bold">
              {editingCategory ? "Edit Category" : "Create New Category"}
            </h2>
            <form onSubmit={handleSaveCategory}>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
                >
                  {editingCategory ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
