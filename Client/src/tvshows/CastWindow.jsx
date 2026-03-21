import { useEffect, useState } from "react";
import { tvCast } from "../services/tmdbApi";
import { useParams } from "react-router-dom";
import UniversalCarousel from "../ui/UniversalCarousel";
import MediaSkeleton from "../ui/MediaSkeleton";
import BlurImage from "../ui/BlurImage";

/**
 * CastWindow
 * -------------------
 * Horizontal scrollable list of cast members for TV shows/movies
 * Features: AbortController cleanup, popularity sorting, optimized images
 */
const CastWindow = () => {
  const { id } = useParams();
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null); // Reset previous errors

        const data = await tvCast(id, { signal: controller.signal });

        // Sort by popularity (most popular first) with null safety
        const sortedCast = [...(data ?? [])].sort(
          (a, b) => (b.popularity || 0) - (a.popularity || 0)
        );

        setCast(sortedCast);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("Failed to load cast");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [id]);

  // Error state
  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 text-lg font-medium">{error}</p>
      </div>
    );
  }

  // Empty state
  if (!loading && cast.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 text-lg font-medium">
          No cast information available
        </p>
      </div>
    );
  }

  return (
    <UniversalCarousel
      items={cast}
      loading={loading}
      skeleton={<MediaSkeleton />}
      className="max-h-100"
      renderItem={(actor) => (
        <div className="shrink-0 text-center snap-start mt-4 w-44 hover:scale-[1.02] transition-transform">
          {/* Actor Profile Image */}
          <BlurImage
            src={
              actor.profile_path
                ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
                : "/avatar.png"
            }
            alt={`${actor.name} as ${actor.character}`}
            className="max-w-40 h-60 mx-4 rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700"
            loading="lazy"
          />

          {/* Actor Name */}
          <p className="mt-3 font-semibold text-gray-900 dark:text-white text-base leading-tight px-2 truncate">
            {actor.name}
          </p>

          {/* Character Role */}
          <p className="max-w-40 text-sm text-gray-600 dark:text-gray-400 leading-relaxed px-2 truncate">
            as {actor.character}
          </p>
        </div>
      )}
    />
  );
};

export default CastWindow;
