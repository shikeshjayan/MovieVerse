import { useState } from "react";

const BlurImage = ({ src, alt, className = "" }) => {
  const [loaded, setLoaded] = useState(false);

  if (!src) return null;

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
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
};

export default BlurImage;