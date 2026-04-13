require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI);

let usersCollection;
let settingsCollection;

async function startServer() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("password_manager");
    usersCollection = db.collection("passwords");
    settingsCollection = db.collection("settings");

    const existingSettings = await settingsCollection.findOne({ name: "security" });

    if (!existingSettings) {
      await settingsCollection.insertOne({
        name: "security",
        failedLogins: 18,
        sessionTimeout: 15,
        passwordPolicy: "Minimum 8 characters",
        ipAccessRules: []
      });
    }

    app.get("/passwords", async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.json(users);
    });

    app.post("/passwords", async (req, res) => {
      const newUser = {
        name: req.body.name,
        role: req.body.role,
        status: req.body.status || "Active",
        mfaEnabled: false,
        mustResetPassword: false,
        loggedIn: true
      };

      const result = await usersCollection.insertOne(newUser);
      res.status(201).json({
        message: "User added",
        insertedId: result.insertedId
      });
    });

    app.put("/passwords/:id", async (req, res) => {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user id" });
      }

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: req.body }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await usersCollection.findOne({ _id: new ObjectId(id) });

      res.json({
        message: "User updated",
        user: updatedUser
      });
    });

    app.delete("/passwords/:id", async (req, res) => {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user id" });
      }

      const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted" });
    });

    app.get("/settings", async (req, res) => {
      const settings = await settingsCollection.findOne({ name: "security" });
      res.json(settings);
    });

    app.put("/settings", async (req, res) => {
      await settingsCollection.updateOne(
        { name: "security" },
        { $set: req.body }
      );

      const updatedSettings = await settingsCollection.findOne({ name: "security" });
      res.json(updatedSettings);
    });

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(error);
  }
}

startServer();