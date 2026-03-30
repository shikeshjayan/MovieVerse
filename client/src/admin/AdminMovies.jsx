import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  EyeOff,
  Search,
  Ban,
  CheckCircle,
  Pin,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMediaStatsService,
  updateMediaStatusService,
  removeMediaTagService,
} from "../services/axiosApi";

const AdminMovies = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [managedTotalPages, setManagedTotalPages] = useState(1);
  const [managedSearchQuery, setManagedSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'featured', 'hidden'
  const managedLimit = 20;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(managedSearchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [managedSearchQuery]);

  const fetchManagedMovies = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: managedLimit, mediaType: "movie", filter };
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await getMediaStatsService(params);
      const newData = res.data || [];
      
      setStats(prev => page === 1 ? newData : [...prev, ...newData]);
      
      if (res.pagination) {
        setManagedTotalPages(res.pagination.pages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      toast.error("Failed to load managed movies");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, managedLimit, filter]);

  useEffect(() => {
    fetchManagedMovies();
  }, [fetchManagedMovies]);

  // Reset page when search query or limit changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, managedLimit]);

  const handleHideMovie = async (movie) => {
    try {
      const tmdbId = movie.tmdbId;
      await updateMediaStatusService(tmdbId, "movie", { 
        isHidden: true,
        title: movie.title,
        posterPath: movie.poster_path
      });
      toast.success(`${movie.title} hidden`);
      // Update local state instead of re-fetching everything if we want to preserve "Load More" position,
      // but simpler is to re-fetch if we're on page 1. For now, let's keep it consistent.
      fetchManagedMovies();
    } catch {
      toast.error("Failed to hide movie");
    }
  };

  const handleUnhideMovie = async (movie) => {
    try {
      const tmdbId = movie.tmdbId;
      await updateMediaStatusService(tmdbId, "movie", { isHidden: false });
      toast.success(`${movie.title} unhidden`);
      fetchManagedMovies();
    } catch {
      toast.error("Failed to unhide movie");
    }
  };

  const handleFeatureMovie = async (movie) => {
    try {
      const tmdbId = movie.tmdbId;
      const isFeatured = movie.featured;
      await updateMediaStatusService(tmdbId, "movie", { 
        featured: !isFeatured,
        title: movie.title,
        posterPath: movie.poster_path
      });
      toast.success(isFeatured ? "Removed from featured" : "Featured on homepage");
      fetchManagedMovies();
    } catch {
      toast.error("Failed to update featured status");
    }
  };

  const handleRemoveTag = async (movie, tag) => {
    try {
      const tmdbId = movie.tmdbId;
      await removeMediaTagService(tmdbId, "movie", tag);
      toast.success(`Tag "${tag}" removed`);
      fetchManagedMovies();
    } catch {
      toast.error("Failed to remove tag");
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Movie Management</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage tracked movies in your database</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
          <p className="text-sm text-gray-500">Movies tracked in your database with engagement stats</p>
            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => { setFilter("all"); setPage(1); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === "all" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                All
              </button>
              <button
                onClick={() => { setFilter("featured"); setPage(1); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === "featured" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Featured
              </button>
              <button
                onClick={() => { setFilter("hidden"); setPage(1); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === "hidden" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Hidden
              </button>
            </div>
            <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search managed movies..."
                value={managedSearchQuery}
                onChange={(e) => setManagedSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase">
                <th className="px-4 py-3 font-semibold">Movie</th>
                <th className="px-4 py-3 font-semibold">Views</th>
                <th className="px-4 py-3 font-semibold">Wishlist</th>
                <th className="px-4 py-3 font-semibold">Watch Later</th>
                <th className="px-4 py-3 font-semibold">Tags</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {stats.map((movie) => (
                <tr key={movie.tmdbId} className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 ${movie.isHidden ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={getImageUrl(movie.poster_path, "w92")} alt="" className="w-10 h-14 object-cover rounded" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{movie.title || `ID: ${movie.tmdbId}`}</p>
                        {movie.featured && <span className="text-xs text-yellow-600">Featured</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{formatNumber(movie.views)}</td>
                  <td className="px-4 py-3 text-sm text-red-500">{formatNumber(movie.wishlistCount)}</td>
                  <td className="px-4 py-3 text-sm text-blue-500">{formatNumber(movie.watchLaterCount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {movie.tags?.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs">
                          {tag}
                          <button onClick={() => handleRemoveTag(movie, tag)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {movie.isHidden ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                        <Ban className="w-3 h-3" /> Hidden
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        <CheckCircle className="w-3 h-3" /> Visible
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleFeatureMovie(movie)}
                        className={`p-1.5 rounded ${movie.featured ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                        title={movie.featured ? "Unfeature" : "Feature"}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => movie.isHidden ? handleUnhideMovie(movie) : handleHideMovie(movie)}
                        className={`p-1.5 rounded ${movie.isHidden ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-600 hover:bg-red-200"}`}
                        title={movie.isHidden ? "Unhide" : "Hide"}
                      >
                        {movie.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!stats.length && !loading && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">No movies found. Try searching for a specific title.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {page < managedTotalPages && !loading && (
          <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex justify-center">
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-8 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-sm"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMovies;
