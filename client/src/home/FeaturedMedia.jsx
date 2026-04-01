import { useEffect, useState } from "react";
import { getFeaturedMedia } from "../services/axiosApi";
import UniversalCarousel from "../ui/UniversalCarousel";
import MediaCard from "../ui/MediaCard";

/**
 * Displays a carousel of featured media picks curated by the platform.
 * Fetches featured content from the server and renders them as MediaCards.
 * @returns {JSX.Element|null} The featured media carousel or null if loading/empty.
 */
const FeaturedMedia = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      const res = await getFeaturedMedia();
      if (res.success && res.data?.length > 0) {
        setMedia(res.data);
      }
      setLoading(false);
    };
    fetchFeatured();
  }, []);

  if (loading || media.length === 0) return null;

  const itemsWithId = media.map(item => ({
    ...item,
    id: item.tmdbId,
  }));

  return (
    <UniversalCarousel
      title="Featured Picks"
      items={itemsWithId}
      loading={false}
      hasMore={false}
      renderItem={(item) => (
        <MediaCard
          key={`${item.mediaType}-${item.tmdbId}`}
          item={item}
          type={item.mediaType}
        />
      )}
    />
  );
};

export default FeaturedMedia;
