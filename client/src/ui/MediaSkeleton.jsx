/**
 * MediaSkeleton Component
 * 
 * Placeholder loading skeleton for movie/TV cards displayed during data fetching.
 * Matches the aspect ratio and dimensions of actual MediaCard components.
 * @param {number} [count=1] - Number of skeleton placeholders to render
 */
const MediaSkeleton = ({ count = 1 }) => {
  return Array.from({ length: count }).map((_, index) => (
    <div
      key={index}
      className="shrink-0 w-32 sm:w-40 md:w-48 animate-pulse"
      aria-hidden="true"
    >
      <div className="w-full aspect-[2/3] bg-gray-300 dark:bg-gray-700 rounded" />
      <div className="mt-2 h-3 sm:h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mx-auto" />
    </div>
  ));
};

export default MediaSkeleton;
