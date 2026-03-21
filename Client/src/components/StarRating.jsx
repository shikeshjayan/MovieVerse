import { faStar } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * StarRating Component
 * Renders a simple star rating display.
 * Only shows full stars (no half-stars).
 *
 * @param {number} value - Current rating value (e.g., 3.7)
 * @param {number} [max=5] - Maximum number of stars to display
 */
const StarRating = ({ value, max = 5 }) => {
  // Calculate how many full stars to show
  const fullStars = Math.floor(value);

  return (
    <div className="flex gap-1">
      {[...Array(max)].map((_, index) => (
        <span key={index}>
          {index < fullStars ? (
            <FontAwesomeIcon icon={faStar} style={{ color: "#FFD43B" }} />
          ) : (
            <FontAwesomeIcon icon={faStar} />
          )}
        </span>
      ))}
    </div>
  );
};

export default StarRating;
