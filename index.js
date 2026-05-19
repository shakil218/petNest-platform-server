const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_DB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("petNestDB");
    const petsCollection = db.collection("pets");

    // Add a new pet
    app.post("/pets", async (req, res) => {
      try {
        const petData = req.body;
        const result = await petsCollection.insertOne(petData);
        res.send(result);
      } catch (error) {
        res.status(500).json({ error: "Failed to add pet" });
      }
    });

    // get all pets
    app.get("/pets", async (req, res) => {
      const results = await petsCollection.find().toArray();
      res.send(results);
    });

    // get pet by id
    app.get("/pets/:id", async (req, res) => {
      try {
        const id = req.params.id;
        console.log(id);

        const pet = await petsCollection.findOne({ _id: new ObjectId(id) });

        if (!pet) {
          return res.status(404).json({ error: "Pet not found" });
        }

        res.json(pet);
      } catch (error) {
        res.status(500).json({ error: "Server error" });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("The petNest platform server is running!");
});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
