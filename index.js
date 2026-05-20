const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const dotenv = require("dotenv");
const { jwtVerify, createRemoteJWKSet } = require("jose-cjs");

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

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)

// verify token
const verifyToken = async(req, res, next) => {
  const authHeader = req?.headers?.authorization;
  if (!authHeader) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  try {const {payload} = await jwtVerify(token, JWKS)
  console.log(payload);
  next();
} catch (error) {
  return res.status(403).json({
    message: "Forbidden",
  });
}
};

async function run() {
  try {
    // await client.connect();

    const db = client.db("petNestDB");

    const petsCollection = db.collection("pets");
    const adoptionRequestsCollection = db.collection("adoptionRequests");

    // ADD PET
    app.post("/pets",verifyToken, async (req, res) => {
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
    app.get("/pets/:id", verifyToken, async (req, res) => {
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
    app.patch("/pets/:id", verifyToken, async (req, res) => {
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
    app.delete("/pets/:id", verifyToken, async (req, res) => {
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
    app.get("/my-listings", verifyToken, async (req, res) => {
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

    // ADD REQUEST
    app.post("/adoption-requests", verifyToken, async (req, res) => {
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

    // GET SPECIFIC USER REQUESTS
    app.get("/my-requests", verifyToken, async (req, res) => {
      try {
        const email = req.query.email;

        if (!email) {
          return res.status(400).send({ error: "Email required" });
        }

        const requests = await adoptionRequestsCollection
          .find({ adopterEmail: email })
          .toArray();

        res.send(requests);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch requests" });
      }
    });

    // GET REQUESTS BY PET
    app.get("/adoption-requests/pet/:petId", verifyToken, async (req, res) => {
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
    app.patch("/adoption-requests/:id", verifyToken, async (req, res) => {
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

    // DELETE REQUEST
    app.delete("/adoption-requests/:id", verifyToken, async (req, res) => {
      try {
        await adoptionRequestsCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });

        res.send({ success: true, message: "Request deleted" });
      } catch (error) {
        res.status(500).send({ error: "Delete failed" });
      }
    });

    // await client.db("admin").command({
    //   ping: 1,
    // });

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
  res.send("PetNest Server Running");
});

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
