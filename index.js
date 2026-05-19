const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_DB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("petNestDB");

    const petsCollection = db.collection("pets");
    const adoptionRequestsCollection = db.collection("adoptionRequests");

    // ADD PET

    app.post("/pets", async (req, res) => {
      try {
        const result = await petsCollection.insertOne(req.body);

        res.send(result);
      } catch (error) {
        res.status(500).json({
          error: "Failed to add pet",
        });
      }
    });

    // GET ALL PETS

    app.get("/pets", async (req, res) => {
      const pets = await petsCollection.find().toArray();

      res.send(pets);
    });

    // GET PET BY ID

    app.get("/pets/:id", async (req, res) => {
      try {
        const pet = await petsCollection.findOne({
          _id: new ObjectId(req.params.id),
        });

        if (!pet) {
          return res.status(404).json({
            error: "Pet not found",
          });
        }

        res.send(pet);
      } catch (error) {
        res.status(500).json({
          error: "Invalid pet id",
        });
      }
    });

    // UPDATE PET

    app.patch("/pets/:id", async (req, res) => {
      try {
        const result = await petsCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: req.body },
        );

        res.send({
          success: true,
          message: "Pet updated successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Update failed",
        });
      }
    });

    // DELETE PET

    app.delete("/pets/:id", async (req, res) => {
      try {
        const result = await petsCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });

        res.send(result);
      } catch (error) {
        res.status(500).json({
          error: "Delete failed",
        });
      }
    });

    // MY LISTINGS

    app.get("/my-listings", async (req, res) => {
      try {
        const email = req.query.email;

        if (!email) {
          return res.status(400).json({
            error: "Missing email parameter",
          });
        }

        const pets = await petsCollection
          .find({
            ownerEmail: email,
          })
          .toArray();

        res.send({
          pets,
        });
      } catch (error) {
        res.status(500).json({
          error: "Failed to load listings",
        });
      }
    });

    // ADD REQUEST

    app.post("/adoption-requests", async (req, res) => {
      try {
        const requestData = {
          ...req.body,
          status: "pending",
        };

        const result = await adoptionRequestsCollection.insertOne(requestData);

        res.send({
          success: true,
          insertedId: result.insertedId,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
        });
      }
    });

    // GET REQUESTS BY PET

    app.get("/adoption-requests/pet/:petId", async (req, res) => {
      try {
        const requests = await adoptionRequestsCollection
          .find({
            petId: req.params.petId,
            status: {
              $ne: "deleted",
            },
          })
          .toArray();

        res.send(requests);
      } catch (error) {
        res.status(500).json({
          error: "Failed to load requests",
        });
      }
    });

    // UPDATE REQUEST STATUS

    app.patch("/adoption-requests/:id", async (req, res) => {
      try {
        const { status, petId } = req.body;

        await adoptionRequestsCollection.updateOne(
          {
            _id: new ObjectId(req.params.id),
          },
          {
            $set: { status },
          },
        );

        if (status === "approved") {
          await petsCollection.updateOne(
            {
              _id: new ObjectId(petId),
            },
            {
              $set: {
                status: "adopted",
              },
            },
          );
        }

        res.send({
          success: true,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
        });
      }
    });

    // REQUEST COUNTS

    app.get("/my-listings-counts", async (req, res) => {
      try {
        const requests = await adoptionRequestsCollection
          .find({
            status: {
              $ne: "deleted",
            },
          })
          .toArray();

        const counts = {};

        requests.forEach((req) => {
          if (!req.petId) return;

          counts[req.petId] = (counts[req.petId] || 0) + 1;
        });

        res.send(counts);
      } catch (error) {
        res.status(500).json({
          error: "Failed to load counts",
        });
      }
    });

    await client.db("admin").command({
      ping: 1,
    });

    console.log("MongoDB Connected");
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("PetNest Server Running");
});

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
