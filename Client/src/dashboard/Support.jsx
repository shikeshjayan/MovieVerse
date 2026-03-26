import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "sonner";
import { ToastMessages } from "../utils/toastConfig";
import apiClient from "../services/apiClient";
import { 
  faPlus, 
  faMinus, 
  faPaperPlane, 
  faCircleCheck,
  faClock,
  faCircleExclamation,
  faCheckCircle,
  faXmark,
  faEnvelope,
  faPhone,
  faTag
} from "@fortawesome/free-solid-svg-icons";

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    category: "other",
    priority: "medium"
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await apiClient.get("/support");
      setTickets(res.data.tickets);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await apiClient.post("/support", formData);
      
      if (res.data.success) {
        setTickets([res.data.ticket, ...tickets]);
        setFormData({ subject: "", description: "", category: "other", priority: "medium" });
        setShowForm(false);
        toast.success("Ticket created successfully!");
      } else {
        toast.error(res.data.message || ToastMessages.SUPPORT.CREATE_ERROR);
      }
    } catch (err) {
      console.error("Failed to create ticket:", err);
      toast.error(err.response?.data?.message || ToastMessages.SUPPORT.CREATE_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: "text-yellow-500",
      in_progress: "text-blue-500",
      resolved: "text-green-500",
      closed: "text-gray-500"
    };
    return colors[status] || "text-gray-500";
  };

  const getStatusIcon = (status) => {
    const icons = {
      open: faClock,
      in_progress: faCircleExclamation,
      resolved: faCircleCheck,
      closed: faCheckCircle
    };
    return icons[status] || faClock;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-gray-100 text-gray-600",
      medium: "bg-yellow-100 text-yellow-700",
      high: "bg-red-100 text-red-600"
    };
    return colors[priority] || "bg-gray-100 text-gray-600";
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
    <div className="min-h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-blue-100">
          Support Center
        </h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <FontAwesomeIcon icon={showForm ? faMinus : faPlus} />
          {showForm ? "Cancel" : "New Ticket"}
        </motion.button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-6 rounded-xl bg-blue-50 dark:bg-blue-900/30"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-blue-100">
              Create New Support Ticket
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-gray-600 dark:text-blue-300">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief description of your issue"
                    className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-600 dark:text-blue-300">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bug">Bug Report</option>
                    <option value="account">Account Issue</option>
                    <option value="payment">Payment</option>
                    <option value="content">Content Issue</option>
                    <option value="recommendation">Recommendation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-gray-600 dark:text-blue-300">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-600 dark:text-blue-300">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Please describe your issue in detail..."
                  rows={5}
                  className="w-full px-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${
                  submitting 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-green-600 hover:bg-green-700"
                } text-white`}
              >
                <FontAwesomeIcon icon={faPaperPlane} />
                {submitting ? "Submitting..." : "Submit Ticket"}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="text-lg text-gray-500 dark:text-blue-300">
            Loading tickets...
          </div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-blue-300">
          <FontAwesomeIcon icon={faEnvelope} className="text-4xl mb-4 opacity-50" />
          <p className="text-lg">No support tickets yet</p>
          <p className="text-sm mt-2">Create a ticket if you're experiencing any issues</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <motion.div
              key={ticket._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-xl border bg-white border-gray-200 dark:bg-blue-900/20 dark:border-blue-800"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-blue-100">
                    {ticket.subject}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <span className="text-xs flex items-center gap-1 text-gray-500 dark:text-blue-300">
                      <FontAwesomeIcon icon={faTag} className="text-xs" />
                      {ticket.category}
                    </span>
                  </div>
                </div>
                <div className={`flex items-center gap-1 ${getStatusColor(ticket.status)}`}>
                  <FontAwesomeIcon icon={getStatusIcon(ticket.status)} />
                  <span className="text-sm font-medium capitalize">{ticket.status.replace("_", " ")}</span>
                </div>
              </div>

              <p className="text-sm mb-3 text-gray-600 dark:text-blue-300">
                {ticket.description}
              </p>

              <div className="text-xs text-gray-500 dark:text-blue-400">
                Created: {formatDate(ticket.createdAt)}
              </div>

              {ticket.response && (
                <div className="mt-4 p-4 rounded-lg bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                    <span className="font-medium text-sm text-green-700 dark:text-green-400">
                      Response
                    </span>
                    {ticket.respondedAt && (
                      <span className="text-xs text-green-600 dark:text-green-500">
                        ({formatDate(ticket.respondedAt)})
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-blue-200">
                    {ticket.response}
                  </p>
                </div>
              )}

              {ticket.status === "open" && (
                <div className="mt-3 pt-3 border-t border-blue-800/30">
                  <span className="text-xs text-yellow-600 dark:text-yellow-400">
                    <FontAwesomeIcon icon={faClock} className="mr-1" />
                    We'll respond within 24-48 hours
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Support;