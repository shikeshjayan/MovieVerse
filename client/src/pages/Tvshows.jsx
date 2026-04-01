/**
 * TV Shows Page Component
 * 
 * Dedicated page for TV show browsing featuring a hero banner, currently airing shows,
 * and genre-specific TV show carousels. Provides navigation to the full show exploration page.
 */
import { useNavigate } from "react-router-dom";
import Banner from "../tvshows/Banner";
import AiringTVShows from "../home/AiringTVShows";
import GenreTVShows from "../tvshows/GenreTVShows";

// TMDB genre IDs for top TV show categories displayed on this page
const topGenres = [
  { genreId: 10759, title: "Action & Adventure" },
  { genreId: 35, title: "Comedy" },
  { genreId: 18, title: "Drama" },
  { genreId: 16, title: "Animation" },
  { genreId: 10765, title: "Sci-Fi & Fantasy" },
];

const TVShows = () => {
  const navigate = useNavigate();

  return (
    <section className="py-5 flex flex-col gap-6">
      <Banner />
      <AiringTVShows />
      {topGenres.map((genre) => (
        <GenreTVShows key={genre.genreId} genreId={genre.genreId} title={genre.title} />
      ))}
      <div className="flex justify-center py-4">
        <button
          onClick={() => navigate("/explore-tvshows")}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-300"
        >
          Explore TV Shows
        </button>
      </div>
    </section>
  );
};

export default TVShows;