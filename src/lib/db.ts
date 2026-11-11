import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? {
  conn: null,
  promise: null,
};

global.mongoose = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("Database connection failed: database configuration is missing.");
    throw new Error("MONGODB_URI is not defined.");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((connection) => {
      console.log("Database connected successfully");
      return connection;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error("Database connection failed.");
    throw new Error("Failed to connect to MongoDB.", { cause: error });
  }

  return cached.conn;
}
