import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Search,
  CheckSquare,
  Square,
  ThumbsUp,
  ThumbsDown,
  User,
  Film,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flag,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmModal from "../ui/ConfirmModal";
import {
  getAllReviewsService,
  getReviewStatsService,
  getReportedReviewsService,
  adminUpdateReviewService,
  adminDeleteReviewService,
  bulkDeleteReviewsService,
  bulkHideReviewsService,
  clearReportService,
} from "../services/axiosApi";

// --- Debounce hook ---
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const AdminReviews = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [selectedReviews, setSelectedReviews] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [deleteModal, setDeleteModal] = useState({ open: false, reviewId: null });
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, sort: sortBy, order: "desc" };
      if (debouncedSearch) params.search = debouncedSearch;

      let res;
      if (activeTab === "reported") {
        params.isReported = "true";
        res = await getReportedReviewsService(params);
      } else if (activeTab === "hidden") {
        params.isHidden = "true";
        res = await getAllReviewsService(params);
      } else {
        res = await getAllReviewsService(params);
      }

      setReviews(res.data || []);
      setPagination(res.pagination || { page: 1, total: 0, pages: 1 });
      setSelectedReviews(new Set());
      setSelectAll(false);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      setError(err.response?.data?.message || "Failed to load reviews");
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, debouncedSearch, activeTab]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getReviewStatsService();
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  const refreshBadgeCounts = useCallback(async () => {
    try {
      const res = await getReviewStatsService();
      setStats((prev) => ({
        ...prev,
        reportedReviews: res.data?.reportedReviews,
        hiddenReviews: res.data?.hiddenReviews,
      }));
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => { setPage(1); }, [activeTab, debouncedSearch, sortBy]);

  useEffect(() => {
    if (activeTab === "stats") fetchStats();
    else fetchReviews();
  }, [activeTab, fetchReviews, fetchStats]);

  // Load badge counts on mount
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedReviews(new Set());
    } else {
      setSelectedReviews(new Set(reviews.map((r) => r._id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectReview = (reviewId) => {
    const newSelected = new Set(selectedReviews);
    if (newSelected.has(reviewId)) newSelected.delete(reviewId);
    else newSelected.add(reviewId);
    setSelectedReviews(newSelected);
    setSelectAll(newSelected.size === reviews.length);
  };

  const handleHideReview = async (review) => {
    try {
      await adminUpdateReviewService(review._id, { isHidden: true });
      toast.success("Review hidden");
      fetchReviews(); refreshBadgeCounts();
    } catch { toast.error("Failed to hide review"); }
  };

  const handleUnhideReview = async (review) => {
    try {
      await adminUpdateReviewService(review._id, { isHidden: false });
      toast.success("Review unhidden");
      fetchReviews(); refreshBadgeCounts();
    } catch { toast.error("Failed to unhide review"); }
  };

  const handleMarkInappropriate = async (review) => {
    try {
      await adminUpdateReviewService(review._id, { isInappropriate: true, isHidden: true });
      toast.success("Marked as inappropriate and hidden");
      fetchReviews(); refreshBadgeCounts();
    } catch { toast.error("Failed to mark review"); }
  };

  const handleDeleteReview = async () => {
    try {
      await adminDeleteReviewService(deleteModal.reviewId);
      toast.success("Review deleted");
      setDeleteModal({ open: false, reviewId: null });
      fetchReviews(); refreshBadgeCounts();
    } catch { toast.error("Failed to delete review"); }
  };

  const handleBulkDelete = async () => {
    try {
      const res = await bulkDeleteReviewsService(Array.from(selectedReviews));
      toast.success(res.message);
      setBulkDeleteModal(false);
      fetchReviews(); refreshBadgeCounts();
    } catch { toast.error("Failed to delete reviews"); }
  };

  const handleBulkHide = async () => {
    try {
      const res = await bulkHideReviewsService(Array.from(selectedReviews));
      toast.success(res.message);
      setSelectedReviews(new Set());
      fetchReviews(); refreshBadgeCounts();
    } catch { toast.error("Failed to hide reviews"); }
  };

  const handleClearReport = async (review) => {
    try {
      await clearReportService(review._id);
      toast.success("Report cleared");
      fetchReviews(); refreshBadgeCounts();
    } catch { toast.error("Failed to clear report"); }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const tabs = [
    { id: "all", label: "All Comments", icon: MessageSquare },
    { id: "reported", label: "Reported", icon: Flag, badge: stats?.reportedReviews },
    { id: "hidden", label: "Hidden", icon: EyeOff, badge: stats?.hiddenReviews },
    { id: "stats", label: "Analytics", icon: AlertTriangle },
  ];

  // ── Inline action buttons — shown directly under comment text, no dropdown ──
  const InlineActions = ({ review }) => (
    <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
      {review.reportCount > 0 && (
        <button
          onClick={() => handleClearReport(review)}
          title="Clear Reports"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
        >
          <Flag className="w-3 h-3 text-gray-400" />
          <span className="hidden lg:inline">Clear Reports</span>
        </button>
      )}

      {review.isHidden ? (
        <button
          onClick={() => handleUnhideReview(review)}
          title="Unhide"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
        >
          <Eye className="w-3 h-3" />
          <span className="hidden lg:inline">Unhide</span>
        </button>
      ) : (
        <button
          onClick={() => handleHideReview(review)}
          title="Hide"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
        >
          <EyeOff className="w-3 h-3" />
          <span className="hidden lg:inline">Hide</span>
        </button>
      )}

      {!review.isInappropriate && (
        <button
          onClick={() => handleMarkInappropriate(review)}
          title="Mark Inappropriate"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
        >
          <AlertTriangle className="w-3 h-3" />
          <span className="hidden lg:inline">Inappropriate</span>
        </button>
      )}

      <button
        onClick={() => setDeleteModal({ open: true, reviewId: review._id })}
        title="Delete"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
      >
        <Trash2 className="w-3 h-3" />
        <span className="hidden lg:inline">Delete</span>
      </button>
    </div>
  );

  // Empty state
  const EmptyState = ({ tab }) => {
    const messages = {
      all: { icon: MessageSquare, text: "No comments found" },
      reported: { icon: Flag, text: "No reported comments — all clear!" },
      hidden: { icon: EyeOff, text: "No hidden comments" },
    };
    const { icon: Icon, text } = messages[tab] || messages.all;
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3">
        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
          <Icon className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Comments Moderation</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and moderate user comments</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === id
                ? "bg-blue-500 text-white"
                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {badge > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === id ? "bg-white text-blue-500" : "bg-blue-500 text-white"
              }`}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reviews Panel */}
      {activeTab !== "stats" && (
        <div
          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mb-6 flex flex-col"
          style={{ minHeight: "calc(100vh - 220px)" }}
        >
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search comments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white text-sm flex-shrink-0"
            >
              <option value="createdAt">Recent</option>
              <option value="reportCount">Most Reported</option>
              <option value="likes">Most Liked</option>
            </select>
            {selectedReviews.size > 0 && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setBulkDeleteModal(true)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                  <span>({selectedReviews.size})</span>
                </button>
                <button
                  onClick={handleBulkHide}
                  className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 flex items-center gap-1.5 transition-colors"
                >
                  <EyeOff className="w-4 h-4" />
                  <span className="hidden sm:inline">Hide</span>
                </button>
              </div>
            )}
          </div>

          {/* Body */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center text-red-500 text-sm">{error}</div>
          ) : (
            <div className="flex flex-col flex-1 overflow-hidden">

              {/* ── DESKTOP TABLE ── */}
              <div className="hidden md:flex flex-col flex-1 overflow-auto">
                <table className="w-full text-left" style={{ tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: "40px" }} />         {/* checkbox */}
                    <col style={{ width: "auto" }} />          {/* comment — fluid */}
                    <col style={{ width: "15%" }} />           {/* user */}
                    <col style={{ width: "15%" }} />           {/* movie */}
                    <col style={{ width: "90px" }} />          {/* stats */}
                    <col style={{ width: "120px" }} />         {/* date */}
                  </colgroup>
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                      <th className="px-3 py-3">
                        <button onClick={handleSelectAll} className="text-gray-400 hover:text-gray-600">
                          {selectAll ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </th>
                      <th className="px-3 py-3 font-semibold">Comment</th>
                      <th className="px-3 py-3 font-semibold">User</th>
                      <th className="px-3 py-3 font-semibold">Movie / Show</th>
                      <th className="px-3 py-3 font-semibold">Stats</th>
                      <th className="px-3 py-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {reviews.map((review) => (
                      <tr
                        key={review._id}
                        className={`align-top transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50 ${
                          review.isHidden ? "opacity-50" : ""
                        } ${review.reportCount > 0 ? "bg-red-50/30 dark:bg-red-950/10" : ""}`}
                      >
                        {/* Checkbox */}
                        <td className="px-3 py-4">
                          <button onClick={() => handleSelectReview(review._id)} className="text-gray-400 hover:text-gray-600">
                            {selectedReviews.has(review._id)
                              ? <CheckSquare className="w-4 h-4 text-blue-500" />
                              : <Square className="w-4 h-4" />}
                          </button>
                        </td>

                        {/* Comment + status badges + inline actions */}
                        <td className="px-3 py-4">
                          <p className="text-gray-900 dark:text-white text-sm line-clamp-2 leading-relaxed">
                            {review.comment || `(Rated ${review.rating} stars)`}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {review.reportCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded text-xs">
                                <Flag className="w-3 h-3" /> {review.reportCount}
                              </span>
                            )}
                            {review.isInappropriate && (
                              <span className="inline-flex items-center px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">Inappropriate</span>
                            )}
                            {review.isHidden && (
                              <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-200 text-gray-600 dark:bg-slate-700 dark:text-gray-300 rounded text-xs">Hidden</span>
                            )}
                          </div>
                          {/* Actions live here — under the comment */}
                          <InlineActions review={review} />
                        </td>

                        {/* User */}
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                              <User className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                {review.user?.username || "Unknown"}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{review.user?.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Movie */}
                        <td className="px-3 py-4">
                          <div className="flex items-start gap-1.5">
                            <Film className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-sm text-gray-900 dark:text-white truncate">
                                {review.movieTitle || `ID: ${review.movieId}`}
                              </p>
                              <p className="text-xs text-gray-500 capitalize">{review.media_type}</p>
                            </div>
                          </div>
                        </td>

                        {/* Stats */}
                        <td className="px-3 py-4">
                          <div className="flex flex-col gap-1 text-xs">
                            <span className="flex items-center gap-1 text-green-500">
                              <ThumbsUp className="w-3 h-3" /> {review.likes || 0}
                            </span>
                            <span className="flex items-center gap-1 text-red-400">
                              <ThumbsDown className="w-3 h-3" /> {review.dislikes || 0}
                            </span>
                            <span className="text-yellow-500">★ {review.rating}</span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-3 py-4">
                          <div className="flex items-start gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span className="leading-snug">{formatDate(review.createdAt)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!reviews.length && <EmptyState tab={activeTab} />}
              </div>

              {/* ── MOBILE CARDS ── */}
              <div className="md:hidden flex-1 overflow-y-auto space-y-3 p-4">
                <div className="flex items-center justify-between mb-1">
                  <button onClick={handleSelectAll} className="flex items-center gap-2 text-sm text-gray-500">
                    {selectAll ? <CheckSquare className="w-5 h-5 text-blue-500" /> : <Square className="w-5 h-5" />}
                    <span>Select All</span>
                  </button>
                  <span className="text-sm text-gray-500">{selectedReviews.size} selected</span>
                </div>

                {reviews.map((review) => (
                  <div
                    key={review._id}
                    className={`bg-gray-50 dark:bg-slate-800 rounded-xl p-4 border ${
                      review.reportCount > 0
                        ? "border-l-4 border-red-400 border-t-0 border-r-0 border-b-0"
                        : "border-gray-100 dark:border-slate-700"
                    } ${review.isHidden ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <button onClick={() => handleSelectReview(review._id)} className="mt-0.5 text-gray-400 hover:text-gray-600 flex-shrink-0">
                        {selectedReviews.has(review._id)
                          ? <CheckSquare className="w-5 h-5 text-blue-500" />
                          : <Square className="w-5 h-5" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        {/* User + movie */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <User className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                              {review.user?.username || "Unknown"}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Film className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate capitalize">
                                {review.movieTitle || `ID: ${review.movieId}`} · {review.media_type}
                              </span>
                            </div>
                          </div>
                          {review.reportCount > 0 && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded text-xs flex-shrink-0">
                              <Flag className="w-3 h-3" /> {review.reportCount}
                            </span>
                          )}
                        </div>

                        {/* Comment */}
                        <p className="text-gray-900 dark:text-white text-sm line-clamp-3 mb-2">
                          {review.comment || `(Rated ${review.rating} stars)`}
                        </p>

                        {/* Status badges */}
                        <div className="flex gap-1 flex-wrap mb-1">
                          {review.isInappropriate && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">Inappropriate</span>
                          )}
                          {review.isHidden && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-gray-200 text-gray-600 dark:bg-slate-700 dark:text-gray-300 rounded text-xs">Hidden</span>
                          )}
                        </div>

                        {/* Stats + date */}
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-green-500"><ThumbsUp className="w-3 h-3" /> {review.likes || 0}</span>
                            <span className="flex items-center gap-1 text-red-400"><ThumbsDown className="w-3 h-3" /> {review.dislikes || 0}</span>
                            <span className="text-yellow-500">★ {review.rating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Inline actions — shared component */}
                        <InlineActions review={review} />
                      </div>
                    </div>
                  </div>
                ))}

                {!reviews.length && <EmptyState tab={activeTab} />}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex-shrink-0 p-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-slate-800 rounded-lg disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-slate-800 rounded-lg disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "stats" && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Comments", value: stats.totalReviews, color: "text-gray-900 dark:text-white" },
              { label: "Visible", value: stats.visibleReviews, color: "text-green-500" },
              { label: "Hidden", value: stats.hiddenReviews, color: "text-yellow-500" },
              { label: "Reported", value: stats.reportedReviews, color: "text-red-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Most Active Commenters</h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {stats.mostActiveUsers?.map((item, i) => (
                  <div key={i} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{item.username}</p>
                        <p className="text-xs text-gray-500">{item.email}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-sm">
                      {item.reviewCount} comments
                    </span>
                  </div>
                ))}
                {!stats.mostActiveUsers?.length && (
                  <p className="p-4 text-center text-gray-500 text-sm">No data available</p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Weekly Activity</h3>
              </div>
              <div className="p-6 text-center">
                <p className="text-5xl font-bold text-purple-500">{stats.commentsLast7Days}</p>
                <p className="text-gray-500 mt-2 text-sm">comments in the last 7 days</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modals */}
      <ConfirmModal
        open={deleteModal.open}
        onCancel={() => setDeleteModal({ open: false, reviewId: null })}
        onConfirm={handleDeleteReview}
        title="Delete Comment?"
        message="This comment will be permanently deleted. This action cannot be undone."
      />
      <ConfirmModal
        open={bulkDeleteModal}
        onCancel={() => setBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedReviews.size} Comments?`}
        message="These comments will be permanently deleted. This action cannot be undone."
      />
    </div>
  );
};

export default AdminReviews;