#!/usr/bin/nodejs

var io = require("socket.io")();

var express = require('express');
var app = express();

var http = require("http").Server(app);

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

http.listen(8000, function() {
    console.log("Server started on localhost:8000");
});
