/**
 * Genre-Based Recommendations Section Component
 * 
 * Displays movies and TV shows based on user's selected genre preferences.
 * Shows content for each selected genre in separate carousels.
 */
import { useState, useEffect } from "react";
import { fetchMoviesByGenre, fetchTvShowsByGenre } from "../services/tmdbApi";
import { AVAILABLE_GENRES } from "../context/UserPreferencesContext";
import UniversalCarousel from "../ui/UniversalCarousel";
import MediaCard from "../ui/MediaCard";

/** Mapping from movie genre IDs to corresponding TV genre IDs */
const MOVIE_TO_TV_GENRE_MAP = {
  28: 10759,
  12: 10759,
  35: 35,
  80: 80,
  99: 99,
  18: 18,
  10751: 10751,
  14: 10765,
  36: 36,
  27: 10768,
  10402: 10402,
  9648: 9648,
  10749: 10749,
  878: 10765,
  53: 10768,
  10752: 10768,
  37: 37,
};

const getTvGenreId = (movieGenreId) => {
  return MOVIE_TO_TV_GENRE_MAP[movieGenreId] || movieGenreId;
};

const GenreRow = ({ genreId, genreName, icon }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const pagePromises = [];
        const pagesToFetch = 5;
        
        for (let page = 1; page <= pagesToFetch; page++) {
          pagePromises.push(fetchMoviesByGenre(genreId, page));
          const tvGenreId = getTvGenreId(genreId);
          pagePromises.push(fetchTvShowsByGenre(tvGenreId, page));
        }
        
        const results = await Promise.all(pagePromises);
        
        const combined = [];
        const seen = new Set();
        
        results.forEach((data) => {
          (data.results || []).forEach((item) => {
            const key = `${item.id}-${!item.title ? 'tv' : 'movie'}`;
            if (!seen.has(key)) {
              seen.add(key);
              combined.push(item);
            }
          });
        });
        
        const shuffled = combined.sort(() => Math.random() - 0.5);
        setItems(shuffled);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [genreId]);

  if (items.length === 0 && !loading) {
    return (
      <UniversalCarousel
        title={`${icon} ${genreName}`}
        items={[]}
        loading={false}
        error="No results found"
        renderItem={() => null}
      />
    );
  }

  return (
    <UniversalCarousel
      title={`${icon} ${genreName}`}
      items={items}
      loading={loading}
      error={error}
      renderItem={(item) => {
        const itemMediaType = !item.title ? "tv" : "movie";
        return (
          <MediaCard
            key={item.id}
            item={item}
            type={itemMediaType}
          />
        );
      }}
    />
  );
};

const GenreBasedRecommendations = ({ selectedGenres }) => {
  if (!selectedGenres || selectedGenres.length === 0) return null;

  const getGenreInfo = (id) => {
    const genre = AVAILABLE_GENRES.find((g) => g.id === id);
    return genre || { name: "Movies", icon: "🎬" };
  };

  return (
    <div className="genre-based-recs">
      {selectedGenres.slice(0, 6).map((genreId) => {
        const genre = getGenreInfo(genreId);
        return (
          <div key={genreId} className="mb-6">
            <GenreRow 
              genreId={genreId} 
              genreName={genre.name} 
              icon={genre.icon}
            />
          </div>
        );
      })}
    </div>
  );
};

export default GenreBasedRecommendations;
