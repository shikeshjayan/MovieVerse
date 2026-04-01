/**
 * CastWindow Component
 * 
 * Displays cast members for a movie or TV show in a horizontal carousel.
 * Fetches cast from TMDB API sorted by popularity.
 */
import { useEffect, useState } from "react";
import { movieCast, tvCast } from "../services/tmdbApi";
import { useParams } from "react-router-dom";
import UniversalCarousel from "./UniversalCarousel";
import MediaSkeleton from "./MediaSkeleton";
import BlurImage from "./BlurImage";

/**
 * @param {"movie"|"tv"} mediaType - Type of media to fetch cast for
 */
const CastWindow = ({ type: mediaType }) => {
  const { id } = useParams();
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCast = mediaType === "tv" ? tvCast : movieCast;

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCast(id, { signal: controller.signal });
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
  }, [id, fetchCast]);

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 text-lg font-medium">{error}</p>
      </div>
    );
  }

  if (!loading && cast.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 text-lg font-medium">No cast information available</p>
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
          <BlurImage
            src={actor.profile_path ? `https://image.tmdb.org/t/p/w200${actor.profile_path}` : "/avatar.png"}
            alt={`${actor.name} as ${actor.character}`}
            className="max-w-40 h-60 mx-4 rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700"
            loading="lazy"
          />
          <p className="mt-3 font-semibold text-gray-900 dark:text-white text-base leading-tight px-2 truncate">
            {actor.name}
          </p>
          <p className="max-w-40 text-sm text-gray-600 dark:text-gray-400 leading-relaxed px-2 truncate">
            as {actor.character}
          </p>
        </div>
      )}
    />
  );
};

export default CastWindow;
