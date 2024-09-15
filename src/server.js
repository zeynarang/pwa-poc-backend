import express from "express";
import webpush from "web-push";
import { email, GCMAPIKey } from "./constant.js";

const app = express();
const port = process.env.PORT || 4000;

const vapidKeys = webpush.generateVAPIDKeys();

webpush.setGCMAPIKey(GCMAPIKey);
webpush.setVapidDetails(email, vapidKeys.publicKey, vapidKeys.privateKey);
app.use(express.json());
app.use((_req, res, next) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  // Continue to the next middleware or route handler
  next();
});

// Route for subscribing to push notifications
app.post("/subscribe", (req, res) => {
  const subscription = req.body.subObj;
  const checked = req.body.checked;
  const notificationPayload = JSON.stringify({
    notification: {
      title: "New Message",
      body: `${checked ? "Task marked Done!" : "Task marked Pending!"}`,
      icon: "/path/to/icon.png",
    },
  });

  webpush
    .sendNotification(subscription, notificationPayload)
    .then((res) => console.log("res", res))
    .catch((error) => {
      console.error("Error sending push notification:", error);
    });
  res.status(200).json({ message: "Subscription successful" });
});

app.listen(3000, () => console.log("Server listening on port " + port));
