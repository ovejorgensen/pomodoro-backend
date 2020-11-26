// const fs = require('fs');
// const https = require('https');
const http = require('http');
const WebSocket = require('ws').Server;

// const server = https.createServer({
//   cert: fs.readFileSync('https/cert.pem'),
//   key: fs.readFileSync('https/key.pem')
// });
const server = http.createServer();
server.listen(9898);

const wss = new WebSocket({ server });

let CLIENTS = [{
  name: "The Daily Hustle",
  users: []
}];

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) { 
    let obj = JSON.parse(message);
    let type = obj.type;
    if(type == 'fetchNames'){
      const names = CLIENTS.map(el => el.name);
      ws.send(JSON.stringify({
        type: 'usernames',
        names
      }));
    }
    else {
      let name = obj.name;
      if(type === 'join'){
        const clientInner = CLIENTS.find(el => el.name == name);
        if(clientInner) clientInner.users.push(ws);
        else ws.send("Session unavailable");
      }else if (type === 'create'){
        if (!CLIENTS.some(el => el.name == name)) { 
          CLIENTS = [...CLIENTS,
            ({
              name,
              wsInfo: ws,
              users: []
            })
          ];
        } else {
          ws.send("Username already taken");
        }
      }
    }
    
    // // Broadcast to all clients excluding itself
    // wss.clients.forEach(function each(client) {
    //   if (client !== ws && client.readyState === WebSocket.OPEN) {
    //     client.send(data);
    //   }
    // });

  });

  ws.on('close', function close() {
    console.log('Client disconnected');
  });

});
