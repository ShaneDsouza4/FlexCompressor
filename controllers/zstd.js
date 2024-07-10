const {compress, decompress} = require("@mongodb-js/zstd");

async function testZstd(req, res) {
    try{
        // console.log(req.body);
        const buffer = Buffer.from(JSON.stringify(req.body));
        console.log("initial buffer: ", buffer);
        const compressed = await compress(buffer, 10);
        console.log("compressed: ");
        console.log(Buffer.from(compressed));
        const decompressed = await decompress(compressed);
        console.log("decompressed: ");
        console.log(decompressed.toString());
        return res.status(201).json({msg:"success"});
    }catch(error){
        return res.status(500).json({msg:"error creating ticket", error});
    }
}

module.exports = {
    testZstd
}