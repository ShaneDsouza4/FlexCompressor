const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
    ticketID: {
        type: String
    },
    data: {
      type: Buffer,
      required: true
    },
    compressor:{
        type:String,
        required: true
    },
    originalSize:{
        type: Number,
        required: true
    },
    compressedSize:{
        type: Number,
        required: true
    },
    compressionRatio: {
        type: Number,
        required: true
    },
    compressionTime: {
        type: Number, 
    },
    decompressionTime: {
        type: Number, 
    },
    accessCount: {
        type: Number,
        default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
});

// Updating the updatedAt field
ticketSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

//Model
const ArchiveTickets = mongoose.model('ArchiveTickets', ticketSchema);

//Exports
module.exports = ArchiveTickets;