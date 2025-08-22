const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const session = require("express-session");
const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // React dev server
  credentials: true
}));

// Session middleware
app.use(session({
  secret: 'election_commission_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/elections", require("./routes/electionRoutes"));
app.use("/api/votes", require("./routes/voteRoutes"));

// Error middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));