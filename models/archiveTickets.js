const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
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
        type: Number, // in milliseconds
    },
    decompressionTime: {
        type: Number, // in milliseconds
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

ticketSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

//Model
const ArchiveTickets = mongoose.model('ArchiveTickets', ticketSchema);

//Exports
module.exports = ArchiveTickets;