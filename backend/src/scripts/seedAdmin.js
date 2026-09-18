const connectToDatabase = require("../config/db");
const config = require("../config");
const User = require("../models/User");
const ROLES = require("../constants/roles");

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@company.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
  const adminName = process.env.ADMIN_NAME || "Platform Admin";

  await connectToDatabase();

  const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });

  if (existingAdmin) {
    console.log(`Admin already exists for ${adminEmail}`);
    process.exit(0);
  }

  const admin = await User.create({
    name: adminName,
    email: adminEmail.toLowerCase(),
    password: adminPassword,
    role: ROLES.ADMIN,
  });

  console.log(`Admin created: ${admin.email}`);
  console.log(`Connected using ${config.mongoUri}`);
  process.exit(0);
}

seedAdmin().catch((error) => {
  console.error("Failed to seed admin", error);
  process.exit(1);
});

