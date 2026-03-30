import { useState } from "react";

/**
 * ImageWithLoader Component
 * -------------------------
 * A robust image component that:
 * - Shows a loading state while the image is being fetched
 * - Handles broken images gracefully with a fallback
 * - Uses lazy loading for performance
 *
 * Props:
 * - `src` (string): Image URL to load
 * - `alt` (string): Alt text for accessibility
 * - `fallback` (string, optional): Fallback image URL (default: "/Loader.svg")
 */
const ImageWithLoader = ({ src, alt, fallback = "/Loader.svg" }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-800">
      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center animate-pulse bg-gray-700">
          <span className="text-gray-400 text-sm">Loading...</span>
        </div>
      )}

      {/* Main image */}
      {!error && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          className={`w-full h-full object-cover transition-opacity duration-700 ${
            loading ? "opacity-0" : "opacity-100"
          }`}
        />
      )}

      {/* Fallback image when main image fails */}
      {error && (
        <img
          src={fallback}
          alt="fallback"
          className="w-full h-full object-contain p-6 bg-gray-900"
        />
      )}
    </div>
  );
};

export default ImageWithLoader;
