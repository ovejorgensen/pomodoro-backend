// const fs = require('fs');
// const https = require('https');
const http = require("http");
const WebSocket = require("ws").Server;

// const server = https.createServer({
//   cert: fs.readFileSync('https/cert.pem'),
//   key: fs.readFileSync('https/key.pem')
// });
const server = http.createServer();
server.listen(9898);

const wss = new WebSocket({ server });

let CREATORS = [
  {
    name: "The Daily Hustle",
    users: [],
  },
];

wss.on("connection", function connection(ws) {
  ws.on("message", function incoming(message) {
    let obj = JSON.parse(message);
    let type = obj.type;

    if (type == "fetchNames") {
      const names = CREATORS.map((el) => el.name);
      ws.send(
        JSON.stringify({
          type: "usernames",
          names,
        })
      );
    } else {
      let name = obj.name;
      if (type === "join") {
        const clientInner = CREATORS.find((el) => el.name == name);
        console.log(clientInner);
        if (clientInner) {
          clientInner.users.push(ws);
          ws.send(
            JSON.stringify({
              type: "confirmJoin",
              name: clientInner.name,
            })
          );
        } else ws.send("Session unavailable");
      } else if (type === "create") {
        if (!CREATORS.some((el) => el.name == name)) {
          CREATORS = [
            ...CREATORS,
            {
              name,
              wsInfo: ws,
              users: [],
            },
          ];
          ws.send(JSON.stringify({type:'successfulCreate'}));
          wss.clients.forEach( client => {
            client.send(
              JSON.stringify({
                type: "usernames",
                names: CREATORS.map( el => el.name )
              })
            );
          });      
        } else {
          ws.send(
            JSON.stringify({type: "takenUsername"})
          );
        }
      }
    }

  });

  ws.on("close", function close() {
    CREATORS = CREATORS.filter((creator) => creator.wsInfo != ws);

    const names = CREATORS.map((el) => el.name);
    
    wss.clients.forEach( client => {
      client.send(
        JSON.stringify({
          type: "usernames",
          names,
        })
      );
    });

  });
});
