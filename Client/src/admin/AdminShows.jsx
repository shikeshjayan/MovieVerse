import { useState, useEffect, useCallback } from "react";
import {
  Tv,
  Star,
  TrendingUp,
  Eye,
  Heart,
  Clock,
  Search,
  RefreshCw,
  Trash2,
  Ban,
  CheckCircle,
  Tag,
  Sparkles,
  Database,
  BarChart3,
  Grid3X3,
  EyeOff,
  Pin,
  MoreVertical,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  browseTMDBMoviesService,
  getMediaStatsService,
  getMediaAnalyticsService,
  getCacheStatusService,
  updateMediaStatusService,
  addMediaTagService,
  removeMediaTagService,
  refreshMediaCacheService,
  syncMediaStatsService,
  clearCacheService,
} from "../services/axiosApi";

const AVAILABLE_TAGS = ["Top Picks", "Trending in India", "Editor's Choice", "Must Watch", "Hidden Gem"];

const CATEGORIES = [
  { key: "popular", label: "Popular", icon: Star },
  { key: "top_rated", label: "Top Rated", icon: TrendingUp },
  { key: "airing_today", label: "Airing Today", icon: Play },
  { key: "trending", label: "Trending", icon: TrendingUp },
];

const AdminShows = () => {
  const [activeTab, setActiveTab] = useState("browse");
  const [shows, setShows] = useState([]);
  const [stats, setStats] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [cacheList, setCacheList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [managedTotalPages, setManagedTotalPages] = useState(1);
  const [managedSearchQuery, setManagedSearchQuery] = useState("");
  const [managedLimit, setManagedLimit] = useState(20);
  const [category, setCategory] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionMenu, setActionMenu] = useState(null);

  const fetchBrowseShows = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, category, mediaType: "tv" };
      if (searchQuery) params.search = searchQuery;
      const res = await browseTMDBMoviesService(params);
      setShows(res.data || []);
      setTotalPages(res.pagination?.total_pages || 1);
    } catch (error) {
      console.error("Failed to fetch shows:", error);
      toast.error("Failed to load shows");
    } finally {
      setLoading(false);
    }
  }, [page, category, searchQuery]);

  const fetchManagedShows = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: managedLimit, mediaType: "tv" };
      if (managedSearchQuery) params.search = managedSearchQuery;
      const res = await getMediaStatsService(params);
      setStats(res.data || []);
      if (res.pagination) {
        setManagedTotalPages(res.pagination.pages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  }, [page, managedSearchQuery, managedLimit]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await getMediaAnalyticsService();
      setAnalytics(res.data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
  }, []);

  const fetchCacheList = useCallback(async () => {
    try {
      const res = await getCacheStatusService();
      setCacheList(res.data || []);
    } catch (error) {
      console.error("Failed to fetch cache:", error);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "browse") {
      fetchBrowseShows();
    } else if (activeTab === "managed") {
      fetchManagedShows();
    } else if (activeTab === "analytics") {
      fetchAnalytics();
    } else if (activeTab === "cache") {
      fetchCacheList();
    }
  }, [activeTab, fetchBrowseShows, fetchManagedShows, fetchAnalytics, fetchCacheList]);

  const handleHideShow = async (show) => {
    try {
      const tmdbId = show.id || show.tmdbId;
      await updateMediaStatusService(tmdbId, "tv", { isHidden: true });
      toast.success(`${show.name || show.title} hidden`);
      setActionMenu(null);
      if (activeTab === "browse") fetchBrowseShows();
      else fetchManagedShows();
    } catch {
      toast.error("Failed to hide show");
    }
  };

  const handleUnhideShow = async (show) => {
    try {
      const tmdbId = show.id || show.tmdbId;
      await updateMediaStatusService(tmdbId, "tv", { isHidden: false });
      toast.success(`${show.name || show.title} unhidden`);
      setActionMenu(null);
      if (activeTab === "browse") fetchBrowseShows();
      else fetchManagedShows();
    } catch {
      toast.error("Failed to unhide show");
    }
  };

  const handleFeatureShow = async (show) => {
    try {
      const tmdbId = show.id || show.tmdbId;
      const isFeatured = show.stats?.featured || show.featured;
      await updateMediaStatusService(tmdbId, "tv", { featured: !isFeatured });
      toast.success(isFeatured ? "Removed from featured" : "Featured on homepage");
      setActionMenu(null);
      if (activeTab === "browse") fetchBrowseShows();
      else fetchManagedShows();
    } catch {
      toast.error("Failed to update featured status");
    }
  };

  const handleAddTag = async (show, tag) => {
    try {
      const tmdbId = show.id || show.tmdbId;
      await addMediaTagService(tmdbId, "tv", tag);
      toast.success(`Tag "${tag}" added`);
      fetchBrowseShows();
    } catch {
      toast.error("Failed to add tag");
    }
  };

  const handleRemoveTag = async (show, tag) => {
    try {
      const tmdbId = show.id || show.tmdbId;
      await removeMediaTagService(tmdbId, "tv", tag);
      toast.success(`Tag "${tag}" removed`);
      fetchBrowseShows();
    } catch {
      toast.error("Failed to remove tag");
    }
  };

  const handleRefreshCache = async (show) => {
    try {
      const tmdbId = show.id || show.tmdbId;
      await refreshMediaCacheService(tmdbId, "tv");
      toast.success("Cache refreshed");
      setActionMenu(null);
    } catch {
      toast.error("Failed to refresh cache");
    }
  };

  const handleSyncStats = async (show) => {
    try {
      const tmdbId = show.id || show.tmdbId;
      await syncMediaStatsService(tmdbId, "tv");
      toast.success("Stats synced");
      setActionMenu(null);
      fetchBrowseShows();
    } catch {
      toast.error("Failed to sync stats");
    }
  };

  const handleClearExpiredCache = async () => {
    try {
      const res = await clearCacheService("expired");
      toast.success(res.message);
      fetchCacheList();
    } catch {
      toast.error("Failed to clear cache");
    }
  };

  const handleClearAllCache = async () => {
    if (!window.confirm("Clear ALL cache? This will force re-fetch from TMDB.")) return;
    try {
      const res = await clearCacheService("all");
      toast.success(res.message);
      fetchCacheList();
    } catch {
      toast.error("Failed to clear cache");
    }
  };

  const getImageUrl = (path, size = "w342") => {
    if (!path) return "/placeholder.svg";
    return `https://image.tmdb.org/t/p/${size}${path}`;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num?.toString() || "0";
  };

  const tabs = [
    { id: "browse", label: "Browse TMDB", icon: Grid3X3 },
    { id: "managed", label: "Managed Shows", icon: Tv },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "cache", label: "Cache", icon: Database },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">TV Shows Management</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor, analyze, and manage your TV show database</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setPage(1); setActionMenu(null); if (id === "managed") { setManagedSearchQuery(""); setManagedLimit(20); } }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === id
                ? "bg-blue-500 text-white"
                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "browse" && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setCategory(key); setPage(1); setSearchQuery(""); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  category === key && !searchQuery
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search TV shows..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setPage(1); }}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
                  {shows.map((show) => (
                    <div
                      key={show.id}
                      className={`group relative rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${show.stats?.isHidden ? "opacity-60" : ""}`}
                    >
                      <img
                        src={getImageUrl(show.poster_path)}
                        alt={show.name || show.title}
                        className="w-full aspect-[2/3] object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === show.id ? null : show.id); }}
                          className="p-1.5 bg-white/90 rounded-full text-gray-700 hover:bg-white"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                      {show.stats?.featured && (
                        <div className="absolute top-2 left-2">
                          <span className="p-1 bg-yellow-500 rounded-full">
                            <Sparkles className="w-3 h-3 text-white" />
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-semibold line-clamp-2">{show.name || show.title}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-sm font-bold ${show.vote_average >= 8 ? "text-green-400" : show.vote_average >= 6 ? "text-yellow-400" : "text-red-400"}`}>
                            ★ {show.vote_average?.toFixed(1)}
                          </span>
                          <span className="text-gray-300 text-xs">{show.first_air_date?.split("-")[0]}</span>
                        </div>
                      </div>

                      {actionMenu === show.id && (
                        <div className="absolute top-10 right-2 z-20 bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-gray-200 dark:border-slate-700 py-1 min-w-[140px]">
                          <button
                            onClick={() => handleFeatureShow(show)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Pin className="w-4 h-4" /> {show.stats?.featured ? "Unfeature" : "Feature"}
                          </button>
                          <button
                            onClick={() => show.stats?.isHidden ? handleUnhideShow(show) : handleHideShow(show)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            {show.stats?.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            {show.stats?.isHidden ? "Unhide" : "Hide"}
                          </button>
                          <button
                            onClick={() => { handleRefreshCache(show); setActionMenu(null); }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4" /> Refresh Cache
                          </button>
                          <button
                            onClick={() => handleSyncStats(show)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <BarChart3 className="w-4 h-4" /> Sync Stats
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-slate-800 rounded-lg disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-slate-800 rounded-lg disabled:opacity-50"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === "managed" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
            <p className="text-sm text-gray-500">TV shows tracked in your database with engagement stats</p>
            <div className="flex items-center gap-3">
              <select
                value={managedLimit}
                onChange={(e) => { setManagedLimit(Number(e.target.value)); setPage(1); }}
                className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search managed shows..."
                  value={managedSearchQuery}
                  onChange={(e) => { setManagedSearchQuery(e.target.value); setPage(1); }}
                  className="w-64 pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase">
                    <th className="px-4 py-3 font-semibold">TV Show</th>
                    <th className="px-4 py-3 font-semibold">Views</th>
                    <th className="px-4 py-3 font-semibold">Wishlist</th>
                    <th className="px-4 py-3 font-semibold">Watch Later</th>
                    <th className="px-4 py-3 font-semibold">Tags</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {stats.map((show) => (
                    <tr key={show._id} className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 ${show.isHidden ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={getImageUrl(show.poster_path, "w92")} alt="" className="w-10 h-14 object-cover rounded" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{show.title || show.name || `ID: ${show.tmdbId}`}</p>
                            {show.featured && <span className="text-xs text-yellow-600">Featured</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatNumber(show.views)}</td>
                      <td className="px-4 py-3 text-sm text-red-500">{formatNumber(show.wishlistCount)}</td>
                      <td className="px-4 py-3 text-sm text-blue-500">{formatNumber(show.watchLaterCount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {show.tags?.map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs">
                              {tag}
                              <button onClick={() => handleRemoveTag(show, tag)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {show.isHidden ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                            <Ban className="w-3 h-3" /> Hidden
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                            <CheckCircle className="w-3 h-3" /> Visible
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleFeatureShow(show)}
                            className={`p-1.5 rounded ${show.featured ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                            title={show.featured ? "Unfeature" : "Feature"}
                          >
                            <Pin className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => show.isHidden ? handleUnhideShow(show) : handleHideShow(show)}
                            className={`p-1.5 rounded ${show.isHidden ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-600 hover:bg-red-200"}`}
                            title={show.isHidden ? "Unhide" : "Hide"}
                          >
                            {show.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleRefreshCache(show)}
                            className="p-1.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200"
                            title="Refresh Cache"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSyncStats(show)}
                            className="p-1.5 rounded bg-purple-100 text-purple-600 hover:bg-purple-200"
                            title="Sync Stats"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!stats.length && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">No tracked TV shows yet. Browse and interact with shows to start tracking.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {managedTotalPages > 1 && (
            <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-slate-800 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-sm text-gray-500">Page {page} of {managedTotalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(managedTotalPages, p + 1))}
                disabled={page === managedTotalPages}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-slate-800 rounded-lg disabled:opacity-50"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          {analytics?.overview && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.overview.totalMovies}</p>
                <p className="text-sm text-gray-500">Total Tracked</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border">
                <p className="text-2xl font-bold text-green-500">{analytics.overview.visibleMovies}</p>
                <p className="text-sm text-gray-500">Visible</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border">
                <p className="text-2xl font-bold text-yellow-500">{analytics.overview.featuredMovies}</p>
                <p className="text-sm text-gray-500">Featured</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border">
                <p className="text-2xl font-bold text-red-500">{analytics.overview.hiddenMovies}</p>
                <p className="text-sm text-gray-500">Hidden</p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold">Top 10 Most Viewed</h3>
              </div>
              <div className="divide-y">
                {analytics?.topViewed?.slice(0, 5).map((show, i) => (
                  <div key={show._id} className="p-3 flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400 w-6">#{i + 1}</span>
                    <img src={getImageUrl(show.poster_path, "w92")} alt="" className="w-10 h-14 object-cover rounded" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{show.title}</p>
                      <p className="text-sm text-gray-500">{formatNumber(show.views)} views</p>
                    </div>
                  </div>
                ))}
                {!analytics?.topViewed?.length && <p className="p-4 text-center text-gray-500">No data yet</p>}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold">Top 10 Most Wishlisted</h3>
              </div>
              <div className="divide-y">
                {analytics?.topWishlisted?.slice(0, 5).map((show, i) => (
                  <div key={show._id} className="p-3 flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400 w-6">#{i + 1}</span>
                    <div className="w-10 h-14 bg-gray-200 dark:bg-slate-700 rounded flex items-center justify-center">
                      <Tv className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">Show #{show.tmdbId}</p>
                      <p className="text-sm text-gray-500">{formatNumber(show.wishlistCount)} wishlists</p>
                    </div>
                  </div>
                ))}
                {!analytics?.topWishlisted?.length && <p className="p-4 text-center text-gray-500">No data yet</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "cache" && (
        <div className="space-y-6">
          <div className="flex gap-4">
            <button onClick={handleClearExpiredCache} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
              <Trash2 className="w-4 h-4" /> Clear Expired
            </button>
            <button onClick={handleClearAllCache} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 text-xs uppercase">
                    <th className="px-4 py-3 font-semibold">Cache Key</th>
                    <th className="px-4 py-3 font-semibold">Updated</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cacheList.map((cache) => (
                    <tr key={cache.key} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm">{cache.key}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{cache.updatedAt ? new Date(cache.updatedAt).toLocaleString() : "N/A"}</td>
                      <td className="px-4 py-3">
                        {cache.isExpired ? <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Expired</span>
                          : cache.isStale ? <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Stale</span>
                          : <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Fresh</span>}
                      </td>
                    </tr>
                  ))}
                  {!cacheList.length && <tr><td colSpan={3} className="px-4 py-12 text-center text-gray-500">No cache entries</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShows;
