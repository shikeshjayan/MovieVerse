import { useState } from "react";
import VideoPlayer from "../ui/VideoPlayer";

/**
 * TrailerButton Component
 * Renders a "Watch Trailer" button that opens a modal with a video player.
 * Shows a disabled "Trailer Not Available" button if no video key is provided.
 *
 * @param {string} [movieKey] - YouTube key for movie trailer
 * @param {string} [tvKey] - YouTube key for TV show trailer
 */
const TrailerButton = ({ movieKey, tvKey }) => {
  const [open, setOpen] = useState(false);

  // If neither movieKey nor tvKey is provided, show disabled "Not Available" button
  if (!movieKey && !tvKey) {
    return (
      <button
        disabled
        className="bg-gray-600 text-white px-6 py-2 h-10 rounded mt-4 cursor-not-allowed"
      >
        Trailer Not Available
      </button>
    );
  }

  return (
    <>
      {/* Play Button */}
      <div className="flex flex-col lg:flex-row justify-center items-center gap-4">
        <button
          onClick={() => setOpen(true)}
          className="bg-[#0064E0] text-white px-6 py-2 h-10 rounded mt-4 hover:bg-[#0073ff] transition"
        >
          ▶ Watch Trailer
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl relative">
            {/* Close Button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-10 right-0 text-white text-xl hover:text-red-500"
            >
              ✕ Close
            </button>

            {/* Video */}
            <VideoPlayer videoKey={movieKey || tvKey} />
          </div>
        </div>
      )}
    </>
  );
};

export default TrailerButton;
