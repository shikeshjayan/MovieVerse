import mongoose from "mongoose";

class MongoDatabase {

  static async connect() {
    if (mongoose.connection.readyState === 1) {
      console.log("✅ MongoDB already connected");
      return mongoose.connection;
    }

    const { default: connectDB } = await import("../config/db.config.js");
    await connectDB();

    return mongoose.connection;
  }

  static getConnection() {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Database not connected");
    }

    return mongoose.connection;
  }

  static get status() {
    return {
      isConnected: mongoose.connection.readyState === 1,
      readyState: mongoose.connection.readyState,
    };
  }
}

export default MongoDatabase;