import mongoose from "mongoose";

const conn = {
  isConnected: false,
  listenersSetup: false,
};

export async function connectDB() {
  if (conn.isConnected) {
    return;
  }

  const dburl = process.env.MONGODB;

  if (!dburl) {
    throw new Error("MongoDB URL is undefined");
  }

  try {
    // Set up event listeners only once
    if (!conn.listenersSetup) {
      mongoose.connection.setMaxListeners(60);
      
      mongoose.connection.on("connected", () => {
        console.log("Mongo Connection Established");
      });

      mongoose.connection.on("error", (err: any) => {
        console.log("Mongo Connection error", err);
      });

      mongoose.connection.on("disconnected", () => {
        console.log("Mongo Connection Disconnected");
      });

      conn.listenersSetup = true;
    }
    
    const db = await mongoose.connect(dburl);

    console.log(`Connected to database: ${db.connection.db?.databaseName}`);
    conn.isConnected = db.connections[0].readyState === 1;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw new Error("Failed to connect to MongoDB");
  }
}
