import { Link } from "react-router-dom";
import { useConfirmation } from "../hooks/useConfirmation";
import ConfirmModal from "../ui/ConfirmModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useWatchHistory } from "../context/WatchHistoryContext";

import UniversalCarousel from "../ui/UniversalCarousel";
import BlurImage from "../ui/BlurImage";

const WatchHistory = () => {
  const { history, removeFromHistory, clearHistory } = useWatchHistory();
  const { isOpen, pendingId, type, openSingle, openClear, close } =
    useConfirmation();

  if (!history || !history.length) return null;

  const confirmActionHandler = () => {
    if (type === "single") {
      const idToRemove = pendingId?.id ?? pendingId;
      removeFromHistory(idToRemove, pendingId?.type || "movie");
    }
    if (type === "clear") clearHistory();
    close();
  };

  return (
    <>
      <div className="flex items-center justify-between px-4">
        <h4 className="my-2 md:text-3xl font-semibold">Recently Watched</h4>
        <button onClick={openClear} title="Clear watch history">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#EA3323">
            <path d="m656-120-56-56 84-84-84-84 56-56 84 84 84-84 56 56-83 84 83 84-56 56-84-83-84 83Zm-176 0q-138 0-240.5-91.5T122-440h82q14 104 92.5 172T480-200q11 0 20.5-.5T520-203v81q-10 1-19.5 1.5t-20.5.5ZM120-560v-240h80v94q51-64 124.5-99T480-840q150 0 255 105t105 255h-80q0-117-81.5-198.5T480-760q-69 0-129 32t-101 88h110v80H120Zm414 190-94-94v-216h80v184l56 56-42 70Z" />
          </svg>
        </button>
      </div>

      <UniversalCarousel
        title=""
        items={[...history].reverse()}
        loading={false}
        renderItem={(item) => (
          <div key={item.movieId} className="shrink-0 w-48 relative group">
            <Link to={item.media_type === "tv" ? `/tvshow/${item.movieId}` : `/movie/${item.movieId}`} className="block">
              <BlurImage
                src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                alt={item.name || item.original_name || item.title}
                className="w-full h-67.5 rounded shadow-md"
              />

                <button
                  aria-label="Remove from history"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openSingle({
                      id: item.movieId || item.id,
                      type: item.media_type,
                    });
                  }}
                className="absolute top-2 right-2
                  bg-black/70 hover:bg-red-600
                  text-white rounded-full
                  w-7 h-7
                  flex items-center justify-center
                  opacity-100 md:opacity-0 md:group-hover:opacity-100
                  transition">
                <FontAwesomeIcon icon={faXmark} size="sm" />
              </button>
            </Link>

            <h5 className="mt-2 text-center text-sm truncate">
              {item.name || item.original_name || item.title}
            </h5>
          </div>
        )}
      />

      <ConfirmModal
        open={isOpen}
        onConfirm={confirmActionHandler}
        onCancel={close}
        title={
          type === "clear" ? "Clear watch history?" : "Remove from history"
        }
        message={
          type === "clear"
            ? "This will remove all watched items."
            : "This action cannot be undone."
        }
      />
    </>
  );
};

export default WatchHistory;
