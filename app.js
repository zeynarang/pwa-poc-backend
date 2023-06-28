// const express = require("express");
const webpush = require("web-push");
const AWS = require("aws-sdk");
const cors = require("cors");
// const app = express();
// const port = 3000;
var port = process.env.PORT || 4000,
  http = require("http"),
  fs = require("fs"),
  html = fs.readFileSync("index.html");

// var log = function (entry) {
//   fs.appendFileSync(
//     "/tmp/sample-app.log",
//     new Date().toISOString() + " - " + entry + "\n"
//   );
// };

const vapidKeys = {
  publicKey:
    "BBZ-_LjVst1ZWLQQYIdLGBs4Ez_ApbNCQnOanFDBoT1AbJhYq7RovyWoo4BcJe8PCcswcCjwLckJ_1JSza-Ebfc",
  privateKey: "pkytmRATUvrM-JnjvLGkDUZ9L5MbyIjoEmIHe-oMUxo",
};

// webpush.setGCMAPIKey(
//   "BCGiQJ1e-bMuPP07L3-ojOZKUtBW8wwtV8ILBLFjo0DNi-5IFsln4WEjpUkvpVRztRv1ChdnOW6KSL7Ml9YuoiI"
// );
webpush.setVapidDetails(
  "mailto:jnarang@deloitte.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const handleGetAPIs = async (req, res) => {
  switch (req.url) {
    case "/": {
      res.writeHead(200);
      res.end(JSON.stringify({ message: "Welcome to the application" }));

      break;
    }
    case "/hello": {
      res.writeHead(200);
      res.end(JSON.stringify({ message: "Hello World!" }));
      break;
    }
    case "/tasks": {
      res.writeHead(200);
      res.end(JSON.stringify(TASKS));
      break;
    }
  }
};
const handlePostAPIs = async (req, res) => {
  switch (req.url) {
    case "/notify": {
      let requestData = "";
      req.on("data", (chunk) => {
        requestData += chunk;
      });
      req.on("end", async () => {
        requestData = JSON.parse(requestData);
        const subscription = requestData.subObj;
        const checked = requestData.checked;
        const taskDesc = requestData.taskDesc;
        const notificationPayload = JSON.stringify({
          notification: {
            title: "New Message",
            body: `${
              checked
                ? `${taskDesc} marked Done!`
                : `${taskDesc} marked Pending!`
            }`,
            icon: "/logo192.png",
          },
        });
        webpush
          .sendNotification(subscription, notificationPayload)
          .then((respo) => {
            // res.setHeader("Content-Type", "text/plain");
            res.statusCode = 200;
            res.end("Notification sent successfully");
          })
          .catch((error) => {
            console.error("Error sending push notification:", error);
            res.statusCode = 500;
            res.end(JSON.stringify(error));
          });
      });
      break;
    }
    case "/tasks": {
      let requestData = "";
      req.on("data", (chunk) => {
        requestData += chunk;
      });
      req.on("end", async () => {
        requestData = JSON.parse(requestData);
        console.log(requestData);
        const newTask = requestData;

        TASKS.push({
          ...newTask,
          id: TASKS.length + 1,
        });

        const SNS = new AWS.SNS();
        const gcmPayload = {
          notification: {
            title: "Task Created",
            body: newTask.desc,
            android_channel_id: "2",
            data: {
              newTask,
            },
          },
        };

        const message = {
          GCM: JSON.stringify(gcmPayload),
          default:
            '{  "notification": { "title": "Task Created", "body": "A new task was created." }  }',
        };

        SNS.publish(
          {
            TopicArn: "arn:aws:sns:ap-south-1:322794129073:wfm-standard",
            MessageStructure: "json",
            Message: JSON.stringify(message),
          },
          (err, data) => {
            console.error("err", err);
            console.log("res", data);
          }
        );

        res.statusCode = 200;
        res.end(JSON.stringify({ newTask }));
      });
    }
  }
};

const handlePutAPIs = async (req, res) => {
  if (req.url === "/tasks") {
    let requestData = "";
    req.on("data", (chunk) => {
      requestData += chunk;
    });
    req.on("end", async () => {
      requestData = JSON.parse(requestData);
      const taskId = requestData.taskId;
      if (typeof taskId !== "number") {
        res.statusCode = 400;
        res.end("Please provide appropriate task id");
      }

      const idx = TASKS.findIndex((task) => task.id === taskId);

      if (idx === -1) {
        res.statusCode = 400;
        res.end("Please provide appropriate task id");
      }

      const task = TASKS[idx];
      let status;

      if (task.status === "INCOMPLETE") {
        status = "COMPLETED";
      } else {
        status = "INCOMPLETE";
      }

      const updatedTask = {
        ...task,
        status,
      };

      TASKS[idx] = updatedTask;
      res.statusCode = 200;
      res.end(
        JSON.stringify({ task: updatedTask, msg: "Task updated successfully" })
      );
    });
  }
};
var server = http.createServer(async function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "GET") {
    handleGetAPIs(req, res);
  } else if (req.method === "POST") {
    handlePostAPIs(req, res);
  } else if (req.method === "PUT") {
    handlePutAPIs(req, res);
  } else if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
  }
});
// Listen on port 3000, IP defaults to 127.0.0.1
server.listen(port);

console.log(`Server running on port ${port}`);
// const vapidKeys = webpush.generateVAPIDKeys();/

// app.use(express.json());
// app.use((req, res, next) => {
//   // Set CORS headers
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

//   // Continue to the next middleware or route handler
//   next();
// });
// // Route for subscribing to push notifications
// app.post("/subscribe", (req, res) => {
//   console.log("req", req);
//   const subscription = req.body.subObj;
//   const checked = req.body.checked;
//   const notificationPayload = JSON.stringify({
//     notification: {
//       title: "New Message",
//       body: `${checked ? "Task marked Done!" : "Task marked Pending!"}`,
//       icon: "/path/to/icon.png",
//     },
//   });

//   webpush
//     .sendNotification(subscription, notificationPayload)
//     .then((res) => console.log("res", res))
//     .catch((error) => {
//       console.error("Error sending push notification:", error);
//     });
//   res.status(200).json({ message: "Subscription successful" });
// });

// Route for subscribing to push notifications
// app.get("/hello", (req, res) => {
//   console.log("req", req);
//   res.status(200).json({ message: "HELLO WORLD!" });
// });

// app.listen(3000, () => console.log("Server listening on port " + port));

const TASKS = [
  {
    id: 1,
    desc: "Check expiry date of products in Aisle S-002",
    dueDate: "2023-06-10",
    assignee: {
      name: "Jonathan Smith",
    },
    status: "COMPLETED",
  },
  {
    id: 2,
    desc: "Restock products in Aisle B-1011",
    dueDate: "2023-07-01",
    assignee: {
      name: "John Miller",
    },

    status: "INCOMPLETE",
  },
  {
    id: 3,
    desc: "Move products from Aisle S-001 to Aisle B-1011",
    dueDate: "2023-06-17",
    assignee: {
      name: "Martin Roberts",
    },
    status: "COMPLETED",
  },
  {
    id: 4,
    desc: "Collect nearing expiry products from Aisle A-242 and place in promo zone",
    dueDate: "2023-06-20",
    assignee: {
      name: "Ethan K",
    },

    status: "INCOMPLETE",
  },
];
