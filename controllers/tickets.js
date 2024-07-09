const TICKET = require("../models/tickets");

async function handleCreateTicket(req, res){
    console.log("HITT")
    try{
        const { ticketID, state, priority, assigned_to, content } = req.body;
        const ticket = await TICKET.create({
            ticketID,
            state,
            priority,
            assigned_to,
            content
        })
        return res.status(201).json({msg:"success", ticket});
    }catch(error){
        return res.status(500).json({msg:"error creating ticket", error});
    }
}

module.exports = {
    handleCreateTicket
}