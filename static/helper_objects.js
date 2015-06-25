
function Process (pid, host, messages) {
    this.pid = pid;
    this.host = host;
    this.messages = [];

    $("#"+this.host).append("<li class='"+this.pid+" log' draggable='true'><h4><span class='handle'></span>"+this.pid+"</h4><pre><ul></ul></pre></li>");
    this.domObject = $("#"+this.host+" ."+this.pid+" ul")[0];

    for (var i = 0; i < messages.length; i++) {
        this.addMessage(messages[i].msg, messages[i].time);
    };
}

Process.prototype.addMessage = function(message, t) {
    if(this.messages === undefined) {
        this.messages = [];
    }
    this.messages.push(message);
    string = "<li class='message'>"
    lines = message.join(" ").split("\n");
    for (var i = 0; i < lines.length; i++) {
        string += lines[i] + "<br>";
    };

    string += "<span class='timestamp'>" + t.toLocaleString();
    string += "</span>";
    string += "</li>";

    $(this.domObject).append(string);
};

Process.prototype.hasState = function() {
    return this.state != undefined;
};

Process.prototype.addState = function(stateobject) {
    this.state = new State(this.host, this.pid, stateobject);
};

Process.prototype.updateState = function(stateobject) {
    this.state.update(stateobject);
};

function Host (name) {
    this.name = name.replace(/\./g, "_").replace(/\:/g, "_");
    this.processes = {};

    $("body").append("<ul class='row sortable grid handles' id='"+this.name+"'><h3>On "+name+": </h3></ul>");

    this.domObject = $("#"+this.name)[0];
};

Host.prototype.addProcess = function(pid, msg_state) {
    if(!msg_state) {
        msg_state = {};
        msg_state.messages = [];
    }
    this.processes[pid] = new Process(pid, this.name, msg_state.messages);
    if(msg_state.state) {
        this.processes[pid].addState(msg_state.state);
    }
};

function State(host, pid, stateobject) {
    this.host = host;
    this.pid = pid;
    this.progress = stateobject.progress;
    this.data = {};
    for(var prop in stateobject) {
        this.data[prop] = stateobject[prop];
    }

    this.html = "<div class='state'></div>"
    $("#"+this.host + " ."+this.pid).append(this.html);
    this.domObject = $("#"+this.host + " ."+this.pid + " .state")[0];

    this.update(stateobject);
}

State.prototype.update = function(stateobject) {
    if(stateobject.progress) {
        this.progress = stateobject.progress;
    }

    for(var prop in stateobject) {
        if(prop == "progress") {
            p = $(this.domObject).find(".progress");
            if(p.length == 0) {
                $(this.domObject).prepend("<div class='progress'>"
                    +"<div class='progress-bar' role='progressbar'"
                    +" aria-valuenow='60' aria-valuemin='0' aria-valuemax='100'"
                    +" style='width: 60%;'>60%</div></div>");
            }

            $(this.domObject).find(".progress .progress-bar")
                    .css("width", stateobject.progress+"%")
                    .attr("aria-valuenow", stateobject.progress)
                    .text(stateobject.progress);
        } else {
            o = $(this.domObject).find("." + prop);
            if(o.length == 0) {
                $(this.domObject).append("<b>"+prop+"</b>: <span class='property " 
                    + prop + "'></span>, ");
            }
            $(this.domObject).find(".property." + prop).text(stateobject[prop]);
                // .fadeTo(400, 0, function() {$(this).text(stateobject[prop]);})
                // .fadeTo(400, 1);
        }
    }
};