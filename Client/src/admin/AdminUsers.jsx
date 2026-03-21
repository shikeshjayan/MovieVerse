import { useState, useEffect } from "react";
import apiClient from "../services/apiClient";
import {
  Users as UsersIcon,
  UserCheck,
  Shield,
  Search,
  Mail,
  Trash2,
  Edit3,
  Check,
  X,
  UserX,
  UserCheck2,
  Ban,
} from "lucide-react";
import ConfirmModal from "../ui/ConfirmModal";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [deleteModal, setDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, user: null, action: null, title: "", message: "" });
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingRole, setEditingRole] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get("/users");
      setUsers(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleDeleteUser = async () => {
    try {
      await apiClient.delete(`/users/${userToDelete._id}`);
      setDeleteModal(false);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete user");
    }
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setDeleteModal(true);
  };

  const openActionModal = (user, action) => {
    const actions = {
      deactivate: {
        title: "Deactivate User?",
        message: `${user.username} will not be able to access their account.`,
      },
      activate: {
        title: "Activate User?",
        message: `${user.username} will regain access to their account.`,
      },
      ban: {
        title: "Ban User?",
        message: `${user.username} will be permanently banned from the platform.`,
      },
      unban: {
        title: "Unban User?",
        message: `${user.username} will be unbanned and can access their account again.`,
      },
    };
    setActionModal({ open: true, user, action, ...actions[action] });
  };

  const handleActionConfirm = async () => {
    const { user, action } = actionModal;
    try {
      const updates = action === "activate" || action === "unban"
        ? { isActive: true, isBanned: false }
        : action === "deactivate"
        ? { isActive: false }
        : { isActive: false, isBanned: true };
      
      await apiClient.put(`/users/${user._id}`, updates);
      setActionModal({ open: false, user: null, action: null, title: "", message: "" });
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || `Failed to ${action} user`);
    }
  };

  const startEditRole = (user) => {
    setEditingUserId(user._id);
    setEditingRole(user.role);
  };

  const cancelEditRole = () => {
    setEditingUserId(null);
    setEditingRole("");
  };

  const handleRoleChange = async (userId) => {
    try {
      await apiClient.put(`/users/${userId}`, { role: editingRole });
      setEditingUserId(null);
      setEditingRole("");
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update role");
    }
  };

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive !== false && !u.isBanned).length;
  const admins = users.filter((u) => u.role === "admin").length;
  const bannedUsers = users.filter((u) => u.isBanned).length;

  const getAvatar = (username) => {
    if (!username) return "??";
    return username.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (user) => {
    if (user.isBanned) return "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400";
    if (user.role === "admin") return "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400";
    return "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400";
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">
            User Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors">
            Manage users, admins, and permissions across your platform.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <UsersIcon className="h-24 w-24" />
          </div>
          <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center mr-4 relative z-10">
            <UsersIcon className="h-7 w-7 text-blue-500" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Total Users
            </p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">
              {totalUsers}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center hover:shadow-md transition-all relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10">
            <UserCheck className="h-24 w-24 dark:text-gray-400" />
          </div>
          <div className="h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center mr-4 relative z-10 transition-colors">
            <UserCheck className="h-7 w-7 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="relative z-10 transition-colors">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Active Users
            </p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {activeUsers}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center hover:shadow-md transition-all relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10">
            <Shield className="h-24 w-24 dark:text-gray-400" />
          </div>
          <div className="h-14 w-14 rounded-full bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center mr-4 relative z-10 transition-colors">
            <Shield className="h-7 w-7 text-purple-500 dark:text-purple-400" />
          </div>
          <div className="relative z-10 transition-colors">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Admins
            </p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {admins}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center hover:shadow-md transition-all relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10">
            <Ban className="h-24 w-24 dark:text-gray-400" />
          </div>
          <div className="h-14 w-14 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center mr-4 relative z-10 transition-colors">
            <Ban className="h-7 w-7 text-red-500 dark:text-red-400" />
          </div>
          <div className="relative z-10 transition-colors">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Banned
            </p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {bannedUsers}
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-slate-900 gap-4 transition-colors">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-colors"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors w-full sm:w-auto outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider transition-colors">
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Joined Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 transition-colors">
              {filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  className={`hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors group ${user.isBanned ? "bg-red-50/30 dark:bg-red-950/10" : ""}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm mr-3 ${getAvatarColor(
                          user,
                        )} shadow-sm border border-white dark:border-slate-800 transition-colors`}
                      >
                        {getAvatar(user.username)}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white transition-colors">
                          {user.username}
                        </span>
                        {user.isBanned && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400">
                            Banned
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm transition-colors">
                      <Mail className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500 transition-colors" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUserId === user._id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editingRole}
                          onChange={(e) => setEditingRole(e.target.value)}
                          className="text-sm border border-gray-200 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleRoleChange(user._id)}
                          className="p-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded transition-colors"
                          title="Save"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelEditRole}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-gray-100 text-gray-800 border border-gray-200"
                          }`}
                        >
                          {user.role === "admin" ? "Admin" : "User"}
                        </span>
                        <button
                          onClick={() => startEditRole(user)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Edit Role"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isBanned ? (
                      <span className="inline-flex items-center text-sm text-red-600 dark:text-red-400 font-medium transition-colors">
                        <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                        Banned
                      </span>
                    ) : user.isActive !== false ? (
                      <span className="inline-flex items-center text-sm text-emerald-600 dark:text-emerald-400 font-medium transition-colors">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-sm text-amber-600 dark:text-amber-400 font-medium transition-colors">
                        <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {user.isBanned ? (
                        <button
                          onClick={() => openActionModal(user, "unban")}
                          className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-colors"
                          title="Unban User"
                        >
                          <UserCheck2 className="h-4 w-4" />
                        </button>
                      ) : user.isActive !== false ? (
                        <>
                          <button
                            onClick={() => openActionModal(user, "deactivate")}
                            className="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg transition-colors"
                            title="Deactivate User"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openActionModal(user, "ban")}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                            title="Ban User"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openActionModal(user, "activate")}
                          className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-colors"
                          title="Activate User"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 transition-colors"
                  >
                    {searchQuery || filterRole !== "all"
                      ? "No users found matching your criteria."
                      : "No users found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/30 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 transition-colors">
          <div>
            Showing {filteredUsers.length} of {totalUsers} users
          </div>
        </div>
      </div>

      <ConfirmModal
        open={deleteModal}
        onCancel={() => setDeleteModal(false)}
        onConfirm={handleDeleteUser}
        title="Delete User?"
        message="This user will be permanently removed from the system."
      />

      <ConfirmModal
        open={actionModal.open}
        onCancel={() => setActionModal({ open: false, user: null, action: null, title: "", message: "" })}
        onConfirm={handleActionConfirm}
        title={actionModal.title}
        message={actionModal.message}
      />
    </div>
  );
};

export default Users;
