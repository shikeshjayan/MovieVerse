import { useWatchHistory } from "../context/WatchHistoryContext";
import { useConfirmation } from "../hooks/useConfirmation";
import EmptyState from "../ui/EmptyState";
import DashboardCard from "../ui/DashboardCard";
import { faHistory, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const History = () => {
  const { history, removeFromHistory, clearHistory } = useWatchHistory();
  const { isOpen, pendingId, type, openSingle, openClear, close } = useConfirmation();

  const confirmRemove = () => {
    if (type === "single" && pendingId) {
      const id = pendingId?.id ?? pendingId;
      const itemType = pendingId?.type || "movie";
      removeFromHistory(id, itemType);
    }
    if (type === "clear") clearHistory();
    close();
  };

  if (!history.length) {
    return (
      <EmptyState
        icon={faHistory}
        title="Your watch history is empty"
        description="Start watching movies to see them here"
        actionLabel="Browse Movies"
        actionLink="/"
      />
    );
  }

  const getId = (item) => item.id;
  const getType = (item) => item.media_type || (item.first_air_date ? "tv" : "movie");

  return (
    <section className="flex flex-col gap-4 px-4">
      <div className="flex items-center justify-between">
        <h4 className="popular-movies md:text-3xl text-gray-900 dark:text-blue-100">Recently Watched</h4>
        <button onClick={openClear} title="Clear watch history">
          <FontAwesomeIcon icon={faTrash} size="lg" className="text-red-600 hover:text-red-700" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {history.map((item) => (
          <DashboardCard
            key={item.id}
            item={item}
            type={getType(item)}
            id={getId(item)}
            onRemove={(item) => openSingle({ id: getId(item), type: getType(item) })}
          />
        ))}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              {type === "clear" ? "Clear watch history?" : "Remove from history"}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {type === "clear" ? "This will remove all watched items." : "This action cannot be undone."}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={close} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                Cancel
              </button>
              <button onClick={confirmRemove} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                {type === "clear" ? "Clear All" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default History;
