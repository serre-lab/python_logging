
function Process (pid, host, messages) {
    this.pid = pid;
    this.host = host;
    this.messages = [];

    $("#"+this.host).append("<li class='"+this.pid+" log' draggable='true'><h4><span class='handle'></span>"+this.pid+"</h4><pre><ul></ul></pre></li>");
    this.domObject = $("#"+this.host+" ."+this.pid+" ul")[0];

    for (var i = 0; i < messages.length; i++) {
        this.addMessage(messages[i]);
    }
}

var escapeMap = {
    "'": "&#39;",
    "\"":"&quot;",
    "<":"&lt;",
    ">":"&gt;",
    "/":"&#x2F;",
    "&":"&amp;"
}

function escapeHTML(string) {
    return String(string).replace(/[&<>"'\/]/g, function(x) {
        return escapeMap[x];
    });
}

Process.prototype.addMessage = function(msg_obj) {
    if(this.messages === undefined) {
        this.messages = [];
    }
    var message = msg_obj.msg;
    this.messages.push(message);
    string = "<li class='message";
    if (msg_obj.level) {
        string += " message-" + msg_obj.level;
        string += "'>[" + msg_obj.level + "]:";
    } else  {
        string += "'>";
    }
    var lines = message.join(" ").split("\n");
    for (var i = 0; i < lines.length; i++) {
        string += escapeHTML(lines[i]) + "<br>";
    }

    t = msg_obj.time;

    string += "<span class='timestamp'>" + Date(t).toLocaleString();
    string += "</span>";
    string += "</li>";

    $(this.domObject).append(string);
};

Process.prototype.hasState = function() {
    return this.state !== undefined;
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
}

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

Host.prototype.removeProcess = function(pid) {
    delete this.processes[pid];
    $("#"+this.name+" ."+pid).remove();
};

function State(host, pid, stateobject) {
    this.host = host;
    this.pid = pid;
    this.progress = stateobject.progress;
    this.data = {};
    for(var prop in stateobject) {
        this.data[prop] = stateobject[prop];
    }

    this.html = "<div class='state'><div class='pbars'></div></div>";
    $("#"+this.host + " ."+this.pid).append(this.html);
    this.domObject = $("#"+this.host + " ."+this.pid + " .state")[0];

    this.update(stateobject);
}

State.prototype.update = function(stateobject) {
    if(stateobject.progress) {
        this.progress = stateobject.progress;
    }

    for(var prop in stateobject) {
        var state = stateobject[prop];
        if(state.type == "progress") {
            p = $(this.domObject).find(".pbar-"+prop);
            if(p.length === 0) {
                $(this.domObject).find(".pbars").append(prop +
                    "<br/><div class='progress'>"+
                    "<div class='progress-bar pbar-"+prop+"' role='progressbar'"+
                    " style='width: 60%;'>60%</div></div>");
            }
            pbar_dom = $(this.domObject).find(".progress-bar.pbar-"+prop);
            $(pbar_dom).css("width", state.value+"%").text(state.value);
            if('color' in state) {
                $(pbar_dom).css("background-color", state.color);
            }
        } else if(state.type == "image") {
            p = $(this.domObject).find("img." + prop);
            if(p.length === 0) {
                $(this.domObject).append("<b>"+prop+": </b><img class='property "+prop+"' src='"+state.value+"'></img>");
            } else  {
                $(p).attr('src', state.value);
            }
        } else {
            o = $(this.domObject).find("." + prop);
            if(o.length === 0) {
                $(this.domObject).append("<b>"+prop+"</b>: <span class='property " +
                    prop + "'></span>, ");
            }
            $(this.domObject).find(".property." + prop).text(stateobject[prop].value);
            if('color' in stateobject[prop]) {
                $(this.domObject).find(".property." + prop).css("color", stateobject[prop].color);
            }
        }
    }
};
