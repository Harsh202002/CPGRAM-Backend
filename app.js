const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { errorHandler } = require("./middlewares/errorHandler");
const helmet = require("helmet");
const { header } = require("express-validator");
require("dotenv").config();

const app = express();
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*", // Allow all origins by default
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], //
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev")); // Use morgan for logging in development mode
}

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/grievances", require("./routes/grievanceRoutes"));
app.use("/api/userProfile", require("./routes/userProfileRoutes"));
app.use("/api/officer", require("./routes/officerRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

app.use(errorHandler);

module.exports = app;
