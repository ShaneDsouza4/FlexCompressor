const ActiveTickets = require("../models/ActiveTickets");

async function handleCreateTicket(req, res){
    try{
        const body = req.body;
        await ActiveTickets.create({
            ticketID: body.ticketID,
            state: body.state,
            priority: body.priority,
            assigned_to: body.assigned_to,
            content: body.content
        })

        return res.status(201).json({ msg: "Ticket Created Succesfully." });

    }catch(error){
        return res.status(500).json({ msg: "Error Creating Ticket", error });
    }
}

async function handleGetTicketByID(req, res){
    try{
        const ticket = await ActiveTickets.findById(req.params.id);
        if(!ticket){
            return res.status(404).json({msg:"No ticket found!"});
        }

        // Increment the access count
        ticket.accessCount += 1;
        await ticket.save();

        return res.status(200).json({msg:"success", ticket});
    }catch(error){
        console.log(error)
        return res.status(500).json({msg:"Error Getting Ticket.", error});
    }
}

async function handleGetAllTickets(req, res){
    try{
        const allTickets = await ActiveTickets.find({});
        return res.status(200).json(allTickets);
    }catch(error){
        return res.status(500).json({msg:"Error Getting All Tickets.", error});
    }
}

module.exports = {
    handleCreateTicket,
    handleGetAllTickets,
    handleGetTicketByID
}
