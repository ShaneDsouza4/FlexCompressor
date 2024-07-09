const TICKET = require("../models/tickets");
const brotli = require("brotli");

async function handleCreateTicket(req, res){
    try{
        //const compressedData = brotli.compress(Buffer.from(JSON.stringify(req.body)));
        const compressedData = Buffer.from(brotli.compress(Buffer.from(JSON.stringify(req.body))));
        await TICKET.create({
            data: compressedData
        })
        return res.status(201).json({msg:"success"});
    }catch(error){
        return res.status(500).json({msg:"error creating ticket", error});
    }
}


async function handleGetTicketById(req, res){
    try{
        const ticket = await TICKET.findById(req.params.id);
        if (ticket) {
            const decompressedData = JSON.parse(Buffer.from(brotli.decompress(ticket.data)).toString());
            res.status(200).json({msg:"success", decompressedData});
        } else {
            res.status(404).json({ msg: 'Ticket not found' });
        }
    }catch(error){
        return res.status(500).json({msg:"error getting ticket", error});
    }
}

module.exports = {
    handleCreateTicket,
    handleGetTicketById
}