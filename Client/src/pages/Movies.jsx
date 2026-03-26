import { useNavigate } from "react-router-dom";
import Banner from "../movies/Banner";
import NowPlayingMovies from "../movies/NowPlayingMovies";
import GenreMovies from "../movies/GenreMovies";

const topGenres = [
  { genreId: 28, title: "Action Movies" },
  { genreId: 35, title: "Comedy Movies" },
  { genreId: 27, title: "Horror Movies" },
  { genreId: 878, title: "Sci-Fi Movies" },
  { genreId: 18, title: "Drama Movies" },
];

const Movies = () => {
  const navigate = useNavigate();

  return (
    <section className="py-5 flex flex-col gap-6">
      <Banner />
      <NowPlayingMovies />
      {topGenres.map((genre) => (
        <GenreMovies key={genre.genreId} genreId={genre.genreId} title={genre.title} />
      ))}
      <div className="flex justify-center py-4">
        <button
          onClick={() => navigate("/explore-movies")}
          className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-300"
        >
          Explore Movies
        </button>
      </div>
    </section>
  );
};

export default Movies;
