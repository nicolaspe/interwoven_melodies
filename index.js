/*
  INTERWOVEN MELODIES
  by nicolas escarpentier
*/

// import packages
var express   = require('express');
var app       = express();
var server    = require('http').createServer(app);
var fs        = require('fs');
var WebSocket = require('ws').Server;

// variables
var curr_id = 0;
var clients = {};
const notes = [[43, 57, 72, 38, 41],
               [43, 45, 48, 50, 53],
               [55, 57, 60, 62, 65],
               [55, 45, 72, 38, 77],
               [55, 69, 60, 62, 65],
               [43, 45, 60, 74, 53],
               [55, 57, 72, 62, 53],
               [55, 69, 60, 62, 65],
               [67, 69, 72, 74, 77],
               [79, 57, 60, 74, 65],
               [67, 69, 72, 62, 53],
               [79, 45, 60, 74, 77],
               [55, 45, 60, 74, 77],
               [67, 81, 60, 62, 77],
               [79, 81, 84, 86, 89]];

// config file
require('./config.js');

// feed HTML frontend
app.use(express.static('public'));

// server
server.listen(process.env.PORT || 8800, function(){
    console.log("Server listening on port 8800");
});

// websocket setup
wss = new WebSocket({ server: server });
wss.on("connection", function(ws_client){
    console.log(">\tUser connected");

    // assign id+notes and add to container object
    ws_client.send("/id:" + curr_id);
    let nId = Math.floor( Math.random()*notes.length );
    let scale = "";
    for(let i=0; i<5; i++){ scale += notes[nId][i] + ","; }
    ws_client.send("/scale:" + scale);
    clients[curr_id] = ws_client;
    curr_id++;
    broadcast("/msg:hi user "+(curr_id-1));

    // error
    ws_client.on("error", function(err){
        console.log("!\tERROR: " + err);
    });
    // disconnection
    ws_client.on("close", function(){
        console.log(">\tUser disconnected")
    });

    // message handling
	ws_client.on('message', function(msg){
        console.log(">\tMessage: " + msg);
        // check for valid msgs
        if(msg[0] != '/' || msg.split(':').length < 2){ return; }
        var addr = msg.split(':')[0];
        var cont = msg.split(':')[1];
        // check address and decide what to do
        if(addr == "/note"){ note_broadcast(cont); }
        // broadcast(msg);
	});
});

function broadcast(msg){
    Object.keys(clients).forEach(function each(id){
        clients[id].send(msg);
    })
}
function note_broadcast(msg){
    // handle data
    let props  = msg.split(",");
    let src_id = props[0];
    let new_m  = "" + props[1] + "," + props[2] + "," + props[3];
    Object.keys(clients).forEach(function each(id){
        if(id == src_id){ }
        else{ clients[id].send("/note:"+new_m); }
    })
}