import { useState, useEffect } from "react";
import apiClient from "../services/apiClient";
import { 
  faTicket, 
  faSearch,
  faReply,
  faCheck,
  faTimes,
  faCircleExclamation,
  faClock,
  faUser,
  faEnvelope,
  faTag
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "sonner";
import { ToastMessages } from "../utils/toastConfig";
import ConfirmModal from "../ui/ConfirmModal";
import { motion, AnimatePresence } from "framer-motion";

const AdminSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [responding, setResponding] = useState(false);
  const [actionModal, setActionModal] = useState({ open: false, ticket: null, action: null, title: "", message: "" });

  const fetchTickets = async () => {
    try {
      const res = await apiClient.get("/support/admin/all");
      setTickets(res.data.tickets || []);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = 
      ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleRespond = async () => {
    if (!responseText.trim()) {
      toast.error("Please enter a response message");
      return;
    }

    setResponding(true);
    try {
      await apiClient.put(`/support/admin/${selectedTicket._id}/respond`, {
        response: responseText,
        status: "in_progress"
      });
      toast.success("Response sent successfully!");
      setSelectedTicket(null);
      setResponseText("");
      fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send response");
    } finally {
      setResponding(false);
    }
  };

  const handleStatusChange = async (ticket, newStatus) => {
    try {
      await apiClient.put(`/support/admin/${ticket._id}/respond`, {
        status: newStatus
      });
      toast.success(`Ticket marked as ${newStatus}`);
      fetchTickets();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const openActionModal = (ticket, action) => {
    const actions = {
      resolve: {
        title: "Resolve Ticket?",
        message: `This will mark the ticket "${ticket.subject}" as resolved.`,
      },
      close: {
        title: "Close Ticket?",
        message: `This will close the ticket "${ticket.subject}".`,
      },
      reopen: {
        title: "Reopen Ticket?",
        message: `This will reopen the ticket "${ticket.subject}".`,
      }
    };
    setActionModal({ open: true, ticket, action, ...actions[action] });
  };

  const handleActionConfirm = async () => {
    const statusMap = {
      resolve: "resolved",
      close: "closed",
      reopen: "open"
    };

    try {
      await apiClient.put(`/support/admin/${actionModal.ticket._id}/respond`, {
        status: statusMap[actionModal.action]
      });
      toast.success(`Ticket ${actionModal.action}ed successfully!`);
      setActionModal({ open: false, ticket: null, action: null, title: "", message: "" });
      fetchTickets();
    } catch (error) {
      toast.error("Failed to update ticket");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      open: "bg-yellow-100 text-yellow-800 border-yellow-300",
      in_progress: "bg-blue-100 text-blue-800 border-blue-300",
      resolved: "bg-green-100 text-green-800 border-green-300",
      closed: "bg-gray-100 text-gray-600 border-gray-300"
    };
    return styles[status] || styles.open;
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      low: "bg-gray-100 text-gray-600",
      medium: "bg-yellow-100 text-yellow-700",
      high: "bg-red-100 text-red-600"
    };
    return styles[priority] || styles.medium;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FontAwesomeIcon icon={faTicket} />
          Support Tickets
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-64"
            />
            <FontAwesomeIcon 
              icon={faSearch} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FontAwesomeIcon icon={faTicket} className="text-6xl mb-4 opacity-20" />
          <p className="text-xl">No tickets found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <motion.div
              key={ticket._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(ticket.status)}`}>
                      {ticket.status?.replace("_", " ").toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(ticket.priority)}`}>
                      {ticket.priority?.toUpperCase()} Priority
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      <FontAwesomeIcon icon={faTag} className="mr-1" />
                      {ticket.category || "other"}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2">{ticket.subject}</h3>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faUser} />
                      {ticket.user?.username || "Unknown User"}
                    </span>
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faEnvelope} />
                      {ticket.user?.email || "No email"}
                    </span>
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faClock} />
                      {formatDate(ticket.createdAt)}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-3">{ticket.description}</p>
                  
                  {ticket.response && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 border-l-4 border-blue-500">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-1">
                        <FontAwesomeIcon icon={faReply} />
                        Admin Response:
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-400">{ticket.response}</p>
                      {ticket.respondedAt && (
                        <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                          {formatDate(ticket.respondedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 lg:min-w-[140px]">
                  <button
                    onClick={() => { setSelectedTicket(ticket); setResponseText(ticket.response || ""); }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <FontAwesomeIcon icon={faReply} className="mr-1" />
                    {ticket.response ? "Edit Response" : "Respond"}
                  </button>
                  
                  {ticket.status !== "resolved" && (
                    <button
                      onClick={() => openActionModal(ticket, "resolve")}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <FontAwesomeIcon icon={faCheck} className="mr-1" />
                      Resolve
                    </button>
                  )}
                  
                  {ticket.status !== "closed" && (
                    <button
                      onClick={() => openActionModal(ticket, "close")}
                      className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <FontAwesomeIcon icon={faTimes} className="mr-1" />
                      Close
                    </button>
                  )}
                  
                  {ticket.status === "closed" && (
                    <button
                      onClick={() => openActionModal(ticket, "reopen")}
                      className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <FontAwesomeIcon icon={faCircleExclamation} className="mr-1" />
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedTicket(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FontAwesomeIcon icon={faReply} />
                  Respond to Ticket
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <p className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">{selectedTicket.subject}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">User</label>
                  <p className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    {selectedTicket.user?.username} ({selectedTicket.user?.email})
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Original Message</label>
                  <p className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">{selectedTicket.description}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Your Response</label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={5}
                    placeholder="Enter your response to the user..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRespond}
                  disabled={responding || !responseText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {responding ? "Sending..." : "Send Response"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={actionModal.open}
        onClose={() => setActionModal({ open: false, ticket: null, action: null, title: "", message: "" })}
        onConfirm={handleActionConfirm}
        title={actionModal.title}
        message={actionModal.message}
        confirmText={actionModal.action === "reopen" ? "Reopen" : "Confirm"}
        confirmStyle={actionModal.action === "reopen" ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"}
      />
    </div>
  );
};

export default AdminSupport;
