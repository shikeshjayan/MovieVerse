// -------------------- Home Page --------------------
import { useHomepage } from "../hooks/useHomepage";
import { useUserPreferences } from "../context/UserPreferencesContext";
import { useWatchLater } from "../context/WatchLaterContext";
import { useWishlist } from "../context/WishlistContext";
import { useWatchHistory } from "../context/WatchHistoryContext";
import Banner from "../home/Banner";
import Moviecase from "../home/Moviecase";
import Tvshowcase from "../home/Tvshowcase";
import WatchHistory from "../home/WatchHistory";
import TopRatedMovies from "../home/TopRatedMovies";
import UpcomingReleases from "../home/UpcomingReleases";
import TrendingNow from "../home/TrendingNow";
import AiringTVShows from "../home/AiringTVShows";
import GenreBasedRecommendations from "../home/GenreBasedRecommendations";
import GenrePickerModal from "../ui/GenrePickerModal";
import Skeleton from "../ui/Skeleton";

const Home = () => {
  const { data, loading, error } = useHomepage();
  const { showOnboarding, selectedGenres, hasOnboarded, triggerOnboarding } = useUserPreferences();
  const { watchLaterCount } = useWatchLater();
  const { wishlistCount } = useWishlist();
  const { historyCount } = useWatchHistory();

  const totalUserData = watchLaterCount + wishlistCount + historyCount;
  const hasEnoughData = totalUserData >= 5;

  if (loading) {
    return (
      <section className="home-page py-4">
        <div className="w-full h-[80vh] bg-gray-900 animate-pulse" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="my-6 mx-4">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="flex gap-4 overflow-hidden">
              {[...Array(5)].map((_, j) => (
                <Skeleton key={j} className="w-48 h-72 flex-shrink-0" />
              ))}
            </div>
          </div>
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <section className="home-page py-4 flex items-center justify-center min-h-[50vh]">
        <p className="text-red-500 text-xl">{error}</p>
      </section>
    );
  }

  return (
    <section className="home-page py-4">
      <GenrePickerModal isOpen={showOnboarding} />
      
      <Banner movies={data?.upcoming} />

      <div className="my-6 mx-4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <TrendingNow />

      <div className="my-6 mx-4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      {hasOnboarded && selectedGenres.length > 0 && !hasEnoughData && (
        <>
          <GenreBasedRecommendations selectedGenres={selectedGenres} />
          <div className="my-6 mx-4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        </>
      )}

      <Moviecase />

      <div className="my-6 mx-4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <TopRatedMovies />

      <div className="my-6 mx-4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <WatchHistory />

      <div className="my-6 mx-4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <UpcomingReleases />

      <div className="my-6 mx-4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <AiringTVShows />

      <div className="my-6 mx-4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <Tvshowcase />
    </section>
  );
};

export default Home;