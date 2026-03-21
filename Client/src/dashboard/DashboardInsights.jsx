import { useState, useEffect, useContext as useCtx, useRef } from "react";
import { motion } from "framer-motion";
import { getRecommendationsService } from "../services/axiosApi.js";
import { AuthContext } from "../context/AuthContext.jsx";
import GenreRadarChart from "../components/GenreRadarChart.jsx";
import {
  buildTasteProfile,
  createTasteProfileModel,
  trainTasteModel,
  getUserEmbedding,
  generateInsights,
} from "../services/tasteProfileModel.js";

const BAR_COLORS = [
  "#534AB7",
  "#1D9E75",
  "#185FA5",
  "#BA7517",
  "#D85A30",
  "#993556",
];

const InsightSkeleton = () => (
  <div className="flex flex-col gap-3">
    {Array(5)
      .fill(0)
      .map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-16 h-3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="w-8 h-3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
      ))}
  </div>
);

const DashboardInsights = () => {
  const { user } = useCtx(AuthContext);
  const [movies, setMovies] = useState([]);
  const [profile, setProfile] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mlLoading, setMlLoading] = useState(false);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState([]);
  const [modelReady, setModelReady] = useState(false);
  const modelRef = useRef(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError("Please log in to see your taste profile");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getRecommendationsService()
      .then((data) => {
        if (cancelled) return;
        const raw = data.data ?? data.results ?? [];
        const unique = Array.from(
          new Map(raw.map((m) => [m.tmdbId ?? m.id, m])).values(),
        );
        setMovies(unique);
        setProfile(buildTasteProfile(unique));
        setInsights(generateInsights(buildTasteProfile(unique)));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load profile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (movies.length < 5) return;

    let cancelled = false;
    setMlLoading(true);

    const initModel = async () => {
      try {
        const model = await createTasteProfileModel();
        if (cancelled) return;

        await trainTasteModel(model, movies, 30);
        if (cancelled) return;

        modelRef.current = model;
        setModelReady(true);

        const embedding = await getUserEmbedding(model, movies);
        if (cancelled) return;

        console.log("Taste profile embedding:", embedding.slice(0, 5));
      } catch (err) {
        console.warn("ML model training skipped:", err.message);
      } finally {
        if (!cancelled) setMlLoading(false);
      }
    };

    initModel();

    return () => {
      cancelled = true;
    };
  }, [movies]);

  return (
    <section className="p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Your Taste Profile</h2>
          {!loading && movies.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
              {movies.length} picks
            </span>
          )}
          {(mlLoading || (modelReady && !loading)) && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
              {mlLoading ? "ML analyzing..." : "AI powered"}
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-5">
        Genre breakdown from your recommended movies
      </p>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {loading && <InsightSkeleton />}

      {!loading && !error && movies.length === 0 && (
        <p className="text-sm text-gray-400">
          Watch a movie to build your taste profile
        </p>
      )}

      {!loading && !error && movies.length > 0 && (
        <>
          {profile.length === 0 ? (
            <p className="text-sm text-gray-400">
              No genre data available for these movies yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  Genre Radar
                </h3>
                <GenreRadarChart profile={profile} size={280} />
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Top Genres
                </h3>
                <div className="flex flex-col gap-3">
                  {profile.slice(0, 6).map((genre, i) => (
                    <motion.div
                      key={genre.id || i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-20 shrink-0 truncate">
                        {genre.name}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: BAR_COLORS[i] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${genre.pct}%` }}
                          transition={{
                            duration: 0.6,
                            delay: i * 0.07,
                            ease: "easeOut",
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-12 text-right shrink-0">
                        {genre.count}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {insights.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-100 dark:border-purple-800/30">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-4 h-4 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  AI Insight
                </span>
              </div>
              <ul className="space-y-1">
                {insights.map((insight, i) => (
                  <li
                    key={i}
                    className="text-sm text-purple-600 dark:text-purple-200">
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {profile.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {profile.slice(0, 3).map((genre, i) => (
                <span
                  key={genre.id || i}
                  className="text-xs px-3 py-1 rounded-full border border-gray-600 text-gray-300">
                  {i === 0 ? "Top genre: " : ""}
                  {genre.name}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default DashboardInsights;
