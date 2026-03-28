import express from "express";
import { protect, admin } from "../middlewares/authMiddleware.js";
import SupportTicket from "../models/supportTicket.model.js";

export const supportRouter = express.Router();

supportRouter.post("/", protect, async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ 
        success: false, 
        message: "Subject and description are required" 
      });
    }

    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject,
      description,
      category: category || 'other',
      priority: priority || 'medium'
    });

    res.status(201).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

supportRouter.get("/", protect, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

supportRouter.get("/:id", protect, async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: "Ticket not found" 
      });
    }

    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

supportRouter.put("/:id", protect, async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;

    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: "Ticket not found" 
      });
    }

    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot update closed ticket" 
      });
    }

    if (subject) ticket.subject = subject;
    if (description) ticket.description = description;
    if (category) ticket.category = category;
    if (priority) ticket.priority = priority;

    await ticket.save();

    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

supportRouter.delete("/:id", protect, async (req, res) => {
  try {
    const ticket = await SupportTicket.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: "Ticket not found" 
      });
    }

    res.json({ success: true, message: "Ticket deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

supportRouter.get("/admin/all", protect, admin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const tickets = await SupportTicket.find(query)
      .populate('user', 'username email')
      .populate('respondedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await SupportTicket.countDocuments(query);

    res.json({ 
      success: true, 
      tickets,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

supportRouter.put("/admin/:id/respond", protect, admin, async (req, res) => {
  try {
    const { response, status } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: "Ticket not found" 
      });
    }

    if (response) {
      ticket.response = response;
      ticket.respondedAt = new Date();
      ticket.respondedBy = req.user._id;
    }

    if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      ticket.status = status;
    }

    await ticket.save();

    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});