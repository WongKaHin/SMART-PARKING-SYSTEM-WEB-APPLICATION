//const { MongoClient } = require('mongodb');
//const client = new MongoClient("mongodb://localhost:27017/");

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://ariespolyu:vwcr0OYMf7y1NkNT@erb-pe076ds-9.b11iq.mongodb.net/?retryWrites=true&w=majority&appName=ERB-PE076DS-9";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let db;

async function connectDB() {
    if (!db) {
        try {
            await client.connect();
            console.log('Connected to MongoDB');
            db = client.db('project');
        } catch (err) {
            console.error('Failed to connect to MongoDB', err);
            throw err;
        }
    }
    return db;
}

module.exports = { connectDB };