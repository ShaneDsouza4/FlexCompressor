const ActiveTickets = require("../models/ActiveTickets");
const ArchiveTickets = require("../models/archiveTickets");
const brotli = require("brotli");
const lzma = require("lzma");
const zstd = require('@mongodb-js/zstd');

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


async function handleGetAllCompressedBrotliTickets(req, res) {
    try {
        const tickets = await ArchiveTickets.find({ compressor: 'Brotli' });
        const decompressedTickets = await Promise.all(tickets.map(async (ticket) => {
            const startDecompress = process.hrtime();
            let decompressedDataString;

            try {
                decompressedDataString = Buffer.from(brotli.decompress(ticket.data)).toString();
            } catch (error) {
                console.error(`Error decompressing ticket with ID ${ticket._id}:`, error);
                throw error;
            }

            const endDecompress = process.hrtime(startDecompress);
            const decompressionTime = endDecompress[0] * 1000 + endDecompress[1] / 1000000; // Convert to milliseconds

            await ArchiveTickets.findByIdAndUpdate(ticket._id, { decompressionTime });

            return {
                ...ticket._doc,
                data: JSON.parse(decompressedDataString),
                decompressionTime
            };
        }));

        return res.status(200).json({ msg: "Success", tickets: decompressedTickets });

    } catch (error) {
        console.error('Error getting archived tickets:', error);
        return res.status(500).json({ msg: "Error Getting Archived Tickets.", error });
    }
}

async function handleGetAllCompressedLZMATickets(req, res) {
    try {
        const tickets = await ArchiveTickets.find({ compressor: 'LZMA' });
        const decompressedTickets = await Promise.all(tickets.map(async (ticket) => {
            const startDecompress = process.hrtime();
            let decompressedDataString;

            try {
                decompressedDataString = await new Promise((resolve, reject) => {
                    lzma.decompress(ticket.data, (result, error) => {
                        if (error) reject(error);
                        else resolve(Buffer.from(result).toString());
                    });
                });
            } catch (error) {
                console.error(`Error decompressing ticket with ID ${ticket._id}:`, error);
                throw error;
            }

            const endDecompress = process.hrtime(startDecompress);
            const decompressionTime = endDecompress[0] * 1000 + endDecompress[1] / 1000000; // Convert to milliseconds

            await ArchiveTickets.findByIdAndUpdate(ticket._id, { decompressionTime });

            return {
                ...ticket._doc,
                data: JSON.parse(decompressedDataString),
                decompressionTime
            };
        }));

        return res.status(200).json({ msg: "Success", tickets: decompressedTickets });
    } catch (error) {
        console.error('Error getting archived tickets:', error);
        return res.status(500).json({ msg: "Error Getting Archived Tickets.", error });
    }
}

async function handleGetAllCompressedZSTDTickets(req, res) {
    try {
        const tickets = await ArchiveTickets.find({ compressor: 'ZSTD' });
        const decompressedTickets = await Promise.all(tickets.map(async (ticket) => {
            const startDecompress = process.hrtime();
            let decompressedDataString;

            try {
                const decompressedData = await zstd.decompress(ticket.data);
                decompressedDataString = Buffer.from(decompressedData).toString();
            } catch (error) {
                console.error(`Error decompressing ticket with ID ${ticket._id}:`, error);
                throw error;
            }

            const endDecompress = process.hrtime(startDecompress);
            const decompressionTime = endDecompress[0] * 1000 + endDecompress[1] / 1000000; // Convert to milliseconds

            await ArchiveTickets.findByIdAndUpdate(ticket._id, { decompressionTime });

            return {
                ...ticket._doc,
                data: JSON.parse(decompressedDataString),
                decompressionTime
            };
        }));

        return res.status(200).json({ msg: "Success", tickets: decompressedTickets });
    } catch (error) {
        console.error('Error getting archived tickets:', error);
        return res.status(500).json({ msg: "Error Getting Archived Tickets.", error });
    }
}

async function decompressData(data, algorithm) {
    try {
        const bufferData = Buffer.from(data); // Ensure data is a Buffer

        switch (algorithm) {
            case 'Brotli':
                return Buffer.from(brotli.decompress(bufferData)).toString();
            case 'ZSTD':
                const decompressedZstd = await zstd.decompress(bufferData);
                return Buffer.from(decompressedZstd).toString();
            case 'LZMA':
                return await new Promise((resolve, reject) => {
                    lzma.decompress(bufferData, (result, error) => {
                        if (error) reject(error);
                        else resolve(Buffer.from(result).toString());
                    });
                });
            default:
                throw new Error('Unsupported compression algorithm');
        }
    } catch (error) {
        console.error('Error decompressing data:', error);
        throw error;
    }
}

async function handleGetAllArchivedTickets(req, res) {
    try {
        const tickets = await ArchiveTickets.find({});
        const decompressedTickets = await Promise.all(tickets.map(async (ticket) => {
            const startDecompress = process.hrtime();
            let decompressedDataString;

            try {
                decompressedDataString = await decompressData(ticket.data, ticket.compressor); // Use ticket.data directly
            } catch (error) {
                console.error(`Error decompressing ticket with ID ${ticket._id}:`, error);
                return {
                    ...ticket._doc,
                    error: `Error decompressing ticket: ${error.message}`
                };
            }

            const endDecompress = process.hrtime(startDecompress);
            const decompressionTime = endDecompress[0] * 1000 + endDecompress[1] / 1000000; // Convert to milliseconds

            await ArchiveTickets.findByIdAndUpdate(ticket._id, { decompressionTime });

            return {
                ...ticket._doc,
                data: JSON.parse(decompressedDataString),
                decompressionTime
            };
        }));

        return res.status(200).json({ msg: "Success", tickets: decompressedTickets });
    } catch (error) {
        console.error('Error getting archived tickets:', error);
        return res.status(500).json({ msg: "Error Getting Archived Tickets.", error });
    }
}


module.exports = {
    handleCreateTicket,
    handleGetAllTickets,
    handleGetTicketByID,
    handleGetAllCompressedBrotliTickets,
    handleGetAllCompressedLZMATickets,
    handleGetAllCompressedZSTDTickets,
    handleGetAllArchivedTickets
}
