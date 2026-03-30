import { useReducer } from "react";

/**
 * Initial state for the confirmation modal
 */
const initialState = {
  isOpen: false, // Is the modal currently open
  pendingId: null, // ID of the item pending confirmation (for single-item actions)
  type: null, // Action type: "single" or "clear"
};

/**
 * Reducer function to handle confirmation modal state
 */
function confirmationReducer(state, action) {
  switch (action.type) {
    case "OPEN_SINGLE":
      return {
        isOpen: true,
        pendingId: action.payload,
        type: "single", // single-item confirmation
      };
    case "OPEN_CLEAR":
      return {
        isOpen: true,
        pendingId: null,
        type: "clear", // clear-all confirmation
      };
    case "CLOSE":
      return initialState; // Reset to initial state
    default:
      return state;
  }
}

/**
 * Custom hook for managing confirmation modals
 *
 * Returns:
 * - isOpen: boolean — modal open/close state
 * - pendingId: number | null — ID of the item pending confirmation
 * - type: string | null — action type ("single" | "clear")
 * - openSingle(id): function — open modal for a single item
 * - openClear(): function — open modal for clearing all
 * - close(): function — close modal
 */
export function useConfirmation() {
  const [state, dispatch] = useReducer(confirmationReducer, initialState);

  /**
   * Open modal for confirming a single item action
   * @param {number|string} id - ID of the item to confirm
   */
  const openSingle = (id) => dispatch({ type: "OPEN_SINGLE", payload: id });

  /**
   * Open modal for confirming a clear-all action
   */
  const openClear = () => dispatch({ type: "OPEN_CLEAR" });

  /**
   * Close the modal and reset state
   */
  const close = () => dispatch({ type: "CLOSE" });

  return {
    isOpen: state.isOpen,
    pendingId: state.pendingId,
    type: state.type,
    openSingle,
    openClear,
    close,
  };
}
