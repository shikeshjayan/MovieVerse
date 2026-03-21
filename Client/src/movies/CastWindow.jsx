import { useEffect, useState } from "react";
import { movieCast } from "../services/tmdbApi";
import { useParams } from "react-router-dom";
import UniversalCarousel from "../ui/UniversalCarousel";
import MediaSkeleton from "../ui/MediaSkeleton";
import BlurImage from "../ui/BlurImage";

/**
 * CastWindow
 * -------------------
 * Horizontal scrollable list of cast members
 * Uses reusable Carousel + MediaSkeleton + BlurImage
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
        const data = await movieCast(id, { signal: controller.signal });

        const sortedCast = [...(data ?? [])].sort(
          (a, b) => b.popularity - a.popularity,
        );

        setCast(sortedCast);
      } catch (err) {
        if (err.name !== "AbortError") setError("Failed to load cast");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [id]);

  if (error) return <p>{error}</p>;
  if (!loading && cast.length === 0)
    return <p>No cast information available.</p>;

  return (
    <UniversalCarousel
      items={cast}
      loading={loading}
      skeleton={<MediaSkeleton />}
      className="max-h-100"
      renderItem={(actor) => (
        <div
          key={actor.cast_id}
          className="shrink-0 text-center snap-start mt-4">
          <BlurImage
            src={
              actor.profile_path
                ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
                : "/avatar.png"
            }
            alt={actor.name}
            className="max-w-40 h-60 mx-4 rounded"
          />
          <p className="mt-2 font-semibold">{actor.name}</p>
          <p className="max-w-40 text-sm text-gray-600">as {actor.character}</p>
        </div>
      )}
    />
  );
};

export default CastWindow;
