/**
 * BlurImage Component
 * 
 * Image component with progressive loading effect using blur-up technique.
 * Displays a low-resolution placeholder first, then fades to the full-resolution image.
 * Automatically falls back to placeholder on error.
 */
import { useState } from "react";

const BlurImage = ({ src, alt, className = "" }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <img
        src="/placeholder.svg"
        alt={alt || "No poster"}
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }

  const getPlaceholderUrl = (url) => {
    if (!url) return null;
    return url.replace(/\/w\d+(\/|$)/, "/w92$1");
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {src && (
        <img
          src={getPlaceholderUrl(src)}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover blur-lg scale-110 transition-opacity duration-500 ${loaded ? "opacity-0" : "opacity-100"}`}
        />
      )}

      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
};

export default BlurImage;