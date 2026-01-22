// modules/ticket/controllers/ticket.controller.js
import Ticket from "../ticket.model.js";

export const createTicket = async (req, res) => {
  console.log("DEBUG TICKET: req.user", req.user);
  console.log("DEBUG TICKET: req.body", req.body);
  const { category, subject, message, relatedRefId } = req.body;

  const ticket = await Ticket.create({
    userId: req.user.userId,
    category,
    subject,
    relatedRefId: relatedRefId || null,
    messages: [
      {
        senderRole: "USER",
        message
      }
    ]
  });

  res.status(201).json({
    message: "Ticket created successfully",
    ticket
  });
};

export const getUserTickets = async (req, res) => {
    const tickets = await Ticket.find({ userId: req.user.userId })
      .sort({ updatedAt: -1 });
  
    res.json(tickets);
  };


  export const replyToTicket = async (req, res) => {
    const { message } = req.body;
  
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      userId: req.user.userId,
      status: { $nin: ["CLOSED", "RESOLVED"] }
    });
  
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
  
    ticket.messages.push({
      senderRole: "USER",
      message
    });
  
    await ticket.save();
  
    res.json({ message: "Reply sent" });
  };
  