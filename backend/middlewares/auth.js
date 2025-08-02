import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.spilt(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "un authenitcated."});
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await  User.findById(decoded._id);
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};
