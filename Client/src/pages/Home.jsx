// -------------------- Home Page --------------------
import { useHomepage } from "../hooks/useHomepage";
import Banner from "../home/Banner";
import Moviecase from "../home/Moviecase";
import Tvshowcase from "../home/Tvshowcase";
import WatchHistory from "../home/WatchHistory";
import TopRatedMovies from "../home/TopRatedMovies";
import UpcomingReleases from "../home/UpcomingReleases";
import TrendingNow from "../home/TrendingNow";
import AiringTVShows from "../home/AiringTVShows";
import Skeleton from "../ui/Skeleton";

const Home = () => {
  const { data, loading, error } = useHomepage();

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
      <Banner movies={data?.upcoming} />

      <div className="my-6 mx-4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <TrendingNow movies={data?.trending} />

      <div className="my-6 mx-4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <Moviecase movies={data?.popularMovies} />

      <div className="my-6 mx-4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <TopRatedMovies movies={data?.topRated} />

      <div className="my-6 mx-4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <WatchHistory />

      <div className="my-6 mx-4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <UpcomingReleases movies={data?.upcoming} />

      <div className="my-6 mx-4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <AiringTVShows shows={data?.airingToday} />

      <div className="my-6 mx-4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <Tvshowcase shows={data?.popularTV} />
    </section>
  );
};

export default Home;