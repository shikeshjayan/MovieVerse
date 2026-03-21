import { Navigate, useNavigate } from "react-router-dom";

/**
 * MediaDetailsSkeleton Component
 * ------------------------------
 * A loading skeleton for the movie/TV show details page.
 * - Shows a full-screen animated placeholder while data is loading
 * - Includes a close button to go back
 * - Mimics the layout of the real details page (poster + text blocks)
 */
const MediaDetailsSkeleton = () => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full min-h-screen bg-gray-900 p-4 sm:p-6 md:p-10 animate-pulse overflow-hidden">
      {/* Close button */}
      <button
        onClick={() => navigate(-1)}
        className="text-white py-2 rounded fixed z-20 right-3 sm:right-6 top-16 sm:top-20 hover:text-blue-600 touch-manipulation"
      >
        Close
      </button>

      {/* Background overlay */}
      <div className="absolute inset-0 bg-gray-800 opacity-40"></div>

      {/* Content area */}
      <div className="relative z-10 container mx-auto px-2 sm:px-4 md:px-6 py-8 sm:py-12 md:py-16 flex flex-col md:flex-row gap-6 sm:gap-8 md:gap-10">
        {/* Poster skeleton */}
        <div className="w-40 sm:w-52 md:w-64 lg:w-80 mx-auto md:mx-0 aspect-[2/3] bg-gray-700 rounded-xl shadow-lg"></div>

        {/* Text content skeleton */}
        <div className="flex-1 space-y-4 sm:space-y-5">
          {/* Title */}
          <div className="h-6 sm:h-8 md:h-10 w-3/4 bg-gray-700 rounded"></div>
          {/* Tagline */}
          <div className="h-4 sm:h-5 w-1/3 bg-gray-700 rounded"></div>

          {/* Rating, year, runtime */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
            <div className="h-5 sm:h-6 w-14 bg-gray-700 rounded"></div>
            <div className="h-5 sm:h-6 w-14 bg-gray-700 rounded"></div>
            <div className="h-5 sm:h-6 w-20 bg-gray-700 rounded"></div>
          </div>

          {/* Overview */}
          <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-6">
            <div className="h-3 sm:h-4 w-full bg-gray-700 rounded"></div>
            <div className="h-3 sm:h-4 w-11/12 bg-gray-700 rounded"></div>
            <div className="h-3 sm:h-4 w-10/12 bg-gray-700 rounded hidden sm:block" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaDetailsSkeleton;
