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
      const names = CREATORS.map( el => el.name);
      ws.send(
        JSON.stringify({
          type: "usernames",
          names,
        })
      );
    } 

    else if (type == "leaveSession") {
      for (let i = 0; i< CREATORS.length; i++){
        const preLen = CREATORS[i].users.length; 
        creator = CREATORS[i].users.filter(el => el != ws)
        CREATORS[i].users = creator;
        const postLen = CREATORS[i].users.length;
        
        // Update number of people in session count
        if (preLen != postLen){
          const usersInfo = JSON.stringify({
            type: "getUsersInfo",
            numUsers: CREATORS[i].users.length
          });
          // Update host-side
          if (CREATORS[i].name !== "The Daily Hustle"){
            CREATORS[i].wsInfo.send(usersInfo);
          }
          // Update user-side
          CREATORS[i].users.forEach( client => {
            client.send(usersInfo);
          });
        }
      }
    }
    
    else if (type == "endSession") {
      CREATORS = CREATORS.filter( el => el.wsInfo != ws);
      wss.clients.forEach( client => {
        client.send(
          JSON.stringify({
            type: "usernames",
            names: CREATORS.map( el => el.name )
          })
        );
        client.send(
          JSON.stringify({
            type: "endSession"
          })
        );
      }); 
    } 
    
    else {
      const name = obj.name;
      if (type === "join") {
        const clientInner = CREATORS.find( el => el.name == name);
        if (clientInner) {
          clientInner.users.push(ws);
          
          // Update user count
          wss.clients.forEach( client => {
            client.send(
              JSON.stringify({
                type: "getUsersInfo",
                numUsers: clientInner.users.length
              })
            );
          });

          ws.send(
            JSON.stringify({
              type: "confirmJoin",
              name: clientInner.name,
              state: clientInner.state,
              time: clientInner.time,
              numUsers: clientInner.users.length
            })
          );

        } 
        else ws.send("Session unavailable");
      } 
      
      else if (type === "create") {
        if (name.toString().length > 10){
          ws.send(
            JSON.stringify({type: "longName"})
          );
        }
        else if (!CREATORS.some((el) => el.name == name)) {
          CREATORS = [
            ...CREATORS,
            {
              name,
              wsInfo: ws,
              state: obj.state,
              time: obj.time,
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
        } 
        
        else {
          ws.send(
            JSON.stringify({type: "takenUsername"})
          );
        }
      } 
      
      else if (type === "sendHostInfo") {
        const currentCreator = CREATORS.find( el => el.wsInfo == ws);
        if (currentCreator !== undefined){
          currentCreator.state = obj.state;
          currentCreator.time = obj.time;
          const numUsers = currentCreator.users.length;
          currentCreator.users.forEach( client => {
            client.send(
              JSON.stringify({
                type: "hostStatus",
                state: currentCreator.state,
                time: currentCreator.time,
                numUsers
              })
            );
          }) 
        }
      }
    }

  });

  ws.on("close", function close() {
    CREATORS = CREATORS.filter((creator) => creator.wsInfo != ws);

    const names = CREATORS.map((el) => el.name);
    
    // Update available sessions to join
    wss.clients.forEach( client => {
      client.send(
        JSON.stringify({
          type: "usernames",
          names,
        })
      );
      client.send(
        JSON.stringify({
          type: "endSession"
        })
      );
    });

    // Update number of people in session
    for (let i = 0; i< CREATORS.length; i++){
      const preLen = CREATORS[i].users.length; 
      remainingUsers = CREATORS[i].users.filter(el => el != ws)
      CREATORS[i].users = remainingUsers;
      const postLen = CREATORS[i].users.length;
      
      if (preLen != postLen){
        const usersInfo = JSON.stringify({
          type: "getUsersInfo",
          numUsers: CREATORS[i].users.length
        });
        // Update host-side
        if (CREATORS[i].name !== "The Daily Hustle"){
          CREATORS[i].wsInfo.send(usersInfo);
        }
        // Update user-side
        CREATORS[i].users.forEach( client => {
          client.send(usersInfo);
        });
      }

    }

  });
});
