import { useConfirmation } from "../hooks/useConfirmation";
import ConfirmModal from "../ui/ConfirmModal";
import { useWatchHistory } from "../context/WatchHistoryContext";

import UniversalCarousel from "../ui/UniversalCarousel";
import MediaCard from "../ui/MediaCard";

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
          <MediaCard
            key={item.movieId}
            item={{
              id: item.movieId,
              title: item.title || item.name || item.original_name,
              poster_path: item.poster_path,
              vote_average: item.vote_average,
            }}
            type={item.media_type === "tv" ? "tv" : "movie"}
            showDelete={true}
            onDelete={(id) => openSingle({ id, type: item.media_type })}
          />
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
