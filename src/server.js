const express = require("express");
const webpush = require("web-push");
const app = express();
const port = process.env.PORT || 4000;

const vapidKeys = webpush.generateVAPIDKeys();

webpush.setGCMAPIKey(
  "BCGiQJ1e-bMuPP07L3-ojOZKUtBW8wwtV8ILBLFjo0DNi-5IFsln4WEjpUkvpVRztRv1ChdnOW6KSL7Ml9YuoiI"
);
webpush.setVapidDetails(
  "mailto:jatinnarangofficial@gmail.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);
app.use(express.json());
app.use((req, res, next) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  // Continue to the next middleware or route handler
  next();
});

// Route for subscribing to push notifications
app.post("/subscribe", (req, res) => {
  console.log("req", req);
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
