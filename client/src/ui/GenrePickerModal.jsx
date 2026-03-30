import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilm, faStar, faX } from "@fortawesome/free-solid-svg-icons";
import { useUserPreferences, AVAILABLE_GENRES } from "../context/UserPreferencesContext";

const GenrePickerModal = ({ isOpen, onClose }) => {
  const { selectGenres, skipOnboarding, selectedGenres } = useUserPreferences();
  const [selectedIds, setSelectedIds] = useState(selectedGenres);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(selectedGenres);
    }
  }, [isOpen, selectedGenres]);

  const toggleGenre = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((g) => g !== id);
      }
      if (prev.length >= 5) {
        setError("You can select up to 5 genres");
        return prev;
      }
      setError("");
      return [...prev, id];
    });
  };

  const handleContinue = () => {
    if (selectedIds.length === 0) {
      setError("Please select at least one genre");
      return;
    }
    selectGenres(selectedIds);
  };

  const handleSkip = () => {
    skipOnboarding();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={handleSkip}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl shadow-2xl border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faX} className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 mb-4 shadow-lg shadow-cyan-500/30">
                <FontAwesomeIcon icon={faStar} className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Pick Your Favorites
              </h2>
              <p className="text-white/70 text-sm sm:text-base">
                Select at least 1 genre to personalize your experience. You can change these later.
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
              {AVAILABLE_GENRES.map((genre) => {
                const isSelected = selectedIds.includes(genre.id);
                return (
                  <motion.button
                    key={genre.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleGenre(genre.id)}
                    className={`
                      relative p-3 rounded-xl border-2 text-center transition-all duration-200
                      ${
                        isSelected
                          ? "border-cyan-500 bg-cyan-500/20 shadow-lg shadow-cyan-500/20"
                          : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                      }
                    `}
                  >
                    <span className="text-2xl block mb-1">{genre.icon}</span>
                    <span className={`text-xs sm:text-sm font-medium ${isSelected ? "text-cyan-400" : "text-white/80"}`}>
                      {genre.name}
                    </span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center"
                      >
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm text-center mb-4"
              >
                {error}
              </motion.p>
            )}

            <div className="text-center text-white/50 text-sm mb-4">
              {selectedIds.length}/5 selected
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 px-6 py-3 rounded-xl border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-colors font-medium"
              >
                Skip for Now
              </button>
              <button
                onClick={handleContinue}
                disabled={selectedIds.length === 0}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
              >
                <FontAwesomeIcon icon={faFilm} className="mr-2" />
                Continue
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GenrePickerModal;
