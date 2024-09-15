import http from "http";
import webpush from "web-push";
import AWS from "aws-sdk";

const port = process.env.PORT || 4000;
const vapidKeys = {
  publicKey:
    "BBZ-_LjVst1ZWLQQYIdLGBs4Ez_ApbNCQnOanFDBoT1AbJhYq7RovyWoo4BcJe8PCcswcCjwLckJ_1JSza-Ebfc",
  privateKey: "pkytmRATUvrM-JnjvLGkDUZ9L5MbyIjoEmIHe-oMUxo",
};

webpush.setVapidDetails(
  "mailto:jatinnarangofficial@gmail.com",
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

const server = http.createServer(async function (req, res) {
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
