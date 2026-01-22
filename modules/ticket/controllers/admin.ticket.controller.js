import Ticket from "../../ticket/ticket.model.js";

export const adminGetAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("userId", "name email customerId") // Added name
      .sort({ createdAt: -1 });

    const formattedTickets = tickets.map(ticket => {
        let status = "Open";
        if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") status = "Closed";
        if (ticket.status === "IN_PROGRESS") status = "Open"; 

        return {
            id: ticket._id,
            user: ticket.userId?.name || "Unknown User",
            email: ticket.userId?.email || "",
            userId: ticket.userId?._id,
            subject: ticket.subject,
            status: status,
            date: ticket.createdAt,
            messages: ticket.messages, // Return full history
            rawStatus: ticket.status 
        };
    });

    res.json(formattedTickets);
  } catch (error) {
    console.error("Fetch Tickets Error:", error);
    res.status(500).json({ message: "Failed to fetch tickets" });
  }
};

export const adminReplyTicket = async (req, res) => {
  const { id } = req.params;
  const { message, status } = req.body;

  try {
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Add admin reply
    ticket.messages.push({
      senderRole: "ADMIN",
      message: message
    });

    if (status) {
        ticket.status = status;
    } else {
        // Default to IN_PROGRESS if replying (keep it open)
        ticket.status = "IN_PROGRESS"; 
    }

    await ticket.save();

    res.json({ success: true, message: "Reply sent", ticket });
  } catch (error) {
    res.status(500).json({ message: "Failed to reply to ticket" });
  }
};