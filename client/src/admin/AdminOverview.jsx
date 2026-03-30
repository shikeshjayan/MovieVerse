import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getAdminStatsService } from "../services/axiosApi";
import AdminStatCard from "./components/AdminStatCard";
import {
  Users,
  UserCheck,
  Star,
  Film,
  TrendingUp,
  Award,
} from "lucide-react";

const AdminOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getAdminStatsService();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatEmailToName = (email) => {
    if (!email) return "User";
    const localPart = email.split("@")[0].toLowerCase();
    if (localPart === "loganlucus") return "Logan Lucas";
    if (localPart === "george") return "George";
    return localPart.charAt(0).toUpperCase() + localPart.slice(1);
  };

  const displayName =
    user?.displayName || formatEmailToName(user?.email) || "Admin";

  if (loading) {
    return (
      <section className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 rounded w-1/3 bg-gray-300 dark:bg-gray-700"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-gray-300 dark:bg-gray-700"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="p-6 space-y-8">
      <h1 className="lg:text-3xl font-bold text-blue-900 dark:text-blue-100">
        Welcome back, {displayName}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard
          label="Total Users"
          value={stats?.totalUsers || 0}
          subLabel="Registered members"
          icon={Users}
          color="blue"
        />
        <AdminStatCard
          label="Active Today"
          value={stats?.activeUsersToday || 0}
          subLabel={`${stats?.activeUsersWeek || 0} this week`}
          icon={UserCheck}
          color="green"
        />
        <AdminStatCard
          label="Total Reviews"
          value={stats?.totalReviews || 0}
          subLabel="User reviews"
          icon={Star}
          color="purple"
        />
        <AdminStatCard
          label="Top Movie"
          value={stats?.mostPopularMovie?.count || 0}
          subLabel={
            stats?.mostPopularMovie
              ? `Reviews`
              : "No data yet"
          }
          icon={Film}
          color="orange"
        />
      </div>

      {stats?.mostActiveUser && (
        <div className="p-6 rounded-xl shadow-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-500/20 p-4 rounded-full">
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Most Active User</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.mostActiveUser.username}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {stats.mostActiveUser.email}
              </p>
              <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span>{stats.mostActiveUser.activityScore} activity score</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 rounded-xl bg-blue-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Platform Overview
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-lg bg-white dark:bg-gray-700/50">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {((stats?.activeUsersToday / stats?.totalUsers) * 100 || 0).toFixed(1)}%
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Daily Active Rate</p>
          </div>
          <div className="p-4 rounded-lg bg-white dark:bg-gray-700/50">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats?.totalUsers > 0
                ? (stats.totalReviews / stats.totalUsers).toFixed(1)
                : 0}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Reviews/User</p>
          </div>
          <div className="p-4 rounded-lg bg-white dark:bg-gray-700/50">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats?.activeUsersWeek || 0}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Weekly Active</p>
          </div>
          <div className="p-4 rounded-lg bg-white dark:bg-gray-700/50">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats?.mostPopularMovie?.count || 0}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Most Reviewed</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminOverview;
