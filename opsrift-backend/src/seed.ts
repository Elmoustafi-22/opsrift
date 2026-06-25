import mongoose from "mongoose";
import { config } from "dotenv";
import User from "./modules/users/user.model";
import { hashPassword } from "./utils/password";

config();

const usersToSeed = [
  {
    name: "System Admin",
    email: "admin@opsrift.demo",
    password: "Demo@1234",
    role: "admin" as const,
  },
  {
    name: "Operations Manager",
    email: "manager@opsrift.demo",
    password: "Demo@1234",
    role: "manager" as const,
  },
  {
    name: "Operations Staff",
    email: "staff@opsrift.demo",
    password: "Demo@1234",
    role: "staff" as const,
  },
  {
    name: "Operations Staff 2",
    email: "staff2@opsrift.demo",
    password: "Demo@1234",
    role: "staff" as const,
  },
  {
    name: "Alex Rivera",
    email: "alex@opsrift.demo",
    password: "Demo@1234",
    role: "staff" as const,
  },
  {
    name: "Taylor Chen",
    email: "taylor@opsrift.demo",
    password: "Demo@1234",
    role: "staff" as const,
  },
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("MONGO_URI is not set in environment variables");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding...");

    for (const u of usersToSeed) {
      const existingUser = await User.findOne({ email: u.email });
      if (existingUser) {
        console.log(`User ${u.email} already exists. Skipping.`);
        continue;
      }

      const passwordHash = await hashPassword(u.password);
      await User.create({
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        isActive: true,
      });
      console.log(`Created user: ${u.email} (${u.role})`);
    }

    console.log("Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
