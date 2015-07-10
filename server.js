#!/usr/bin/nodejs

var io = require("socket.io")();

var express = require('express');
var app = express();

var http = require("http").Server(app);

var net = require("net");

io.listen(http);

var logs = {};

app.use(express.static(__dirname + "/static"));

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/html/index.html");
});

io.on('connection', function(socket) {
  var clienthost = socket.request.connection.remoteAddress;
  console.log("User connected from " + clienthost);
  if(!logs[clienthost]) {
    logs[clienthost] = {};
  }
  socket.on("disconnect", function() {
    console.log("User "+clienthost+" disconnected");
  });

  /*
  Producer events
  incoming: register_producer
            progress
            state

  outgoing: none
  
  */
  socket.on("register_producer", function(pid) {
    socket.join("producers");
    logs[clienthost][pid] = {"messages":[]};
    io.to("consumers").emit("new_process", {"host": clienthost, "pid":pid});
  });
  socket.on("progress", function(prog) {
    //If we get progress from a socket, add it to the producers room
    var item = {"msg": prog.msg, "time":new Date()};
    if(!logs[clienthost][prog.pid]) {

      logs[clienthost][prog.pid] = {"messages": []};
      io.to("consumers").emit("new_process", {"host": clienthost, "pid":prog.pid});
    }

    logs[clienthost][prog.pid].messages.push(item);
    retval = {"host":clienthost, "pid":prog.pid, "msg":prog.msg, "time":item.time};
    io.to("consumers").emit("progress", retval);
  });
  socket.on("state", function(data) {
    console.log("updating state for " + clienthost + " pid:"+data.pid);
    var pid = data.pid;
    if(!logs[clienthost][pid]) {
      console.log("Process not created");
      return;
    }
    if(!logs[clienthost][pid].state) {
      logs[clienthost][pid].state = {};
    }
    for(var prop in data.state) {
      logs[clienthost][pid].state[prop] = data.state[prop];
    }

    var item = {'host':clienthost, 'pid':pid, 'state':data.state};

    io.to('consumers').emit("new_state", item, 4);
  });


  /*
  Consumer events
  incoming: register_consumer
            get_producers

  outgoing: progress
            new_process
            logs
            new_state
  */
  socket.on("register_consumer", function() {
    socket.join("consumers");
    console.log("registered consumer");
    socket.emit("logs", logs);
  });

  socket.on("get_producers", function() {
    socket.emit("logs", logs);
  });

});

var logSocket = net.createServer(function(c) {
  console.log("Logging client connected from " + c.remoteAddress);
  if(!logs[c.remoteAddress]) {
    logs[c.remoteAddress] = {};
  }
  c.on("end", function() {
    console.log("Logger client disconnected");
  });

  c.on("data", function(buf) {
    var json_string = "["+String(buf).replace(/\0\{/g, ',{').replace(/\0/,"")+"]";
    var objs = JSON.parse(json_string);
    for (var i = 0; i < objs.length; i++) {
      objs[i].host = c.remoteAddress;
      if(!logs[c.remoteAddress][objs[i].pid]) {
        logs[c.remoteAddress][objs[i].pid] = {"messages": []};
        io.to("consumers").emit("new_process", {"host": c.remoteAddress, "pid":objs[i].pid});
      }
      logs[c.remoteAddress][objs[i].pid].messages.push(objs[i]);
      io.to('consumers').emit("progress", objs[i]);
    }
  });
});

logSocket.listen(8080, function() {
  console.log("Logging socket open on port 8080");
});

http.listen(8000, function() {
    console.log("Server started on localhost:8000");
});
