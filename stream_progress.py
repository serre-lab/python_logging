#!/usr/bin/env python
from __future__ import print_function
try:
    import colored_traceback.always
except ImportError:
    pass


from socketIO_client import SocketIO,BaseNamespace
import os

from select import select

host = "g15.clps.brown.edu"
port = 8000
_socketIO = SocketIO(host, port, BaseNamespace)
_socketIO.emit("register_producer", os.getpid())

def logged(func):
    """
    A wrapper function to be used on print().
    Depends on the socketIO_client module (try 'pip install socketIO_client' if it's not already there.)
    You will need to use "from __future__ print_function", and then wrap the print function by adding "print = logged(print)".
    After that, any call to print() will send data to the server specified in this file (currently g15.clps.brown.edu), in additon to printing it.
    If you want to specify a particular engine to assosciate a call to print() with, add a keyword argument 'engine' to the print() call.

    e.g., print("Starting...", engine=4) will print "Starting..." on engine 4.

    Visit g15.clps.brown.edu:8000 in a web browser to monitor processes.

    Make sure that a server is actually running on g15 if there are socketIO errors.
    """
    def wrap(*args, **kwargs):
        try:
            pid = os.getpid()
            if('engine' in kwargs):
                pid = kwargs['engine']
                del kwargs['engine']

            _socketIO.emit("progress", {"pid":pid, "msg":args})
        except Exception, e:
            func("Couldn't send output to server '" + host + ":" + port +"'.")
        finally:
            func(*args, **kwargs)

    return wrap

def update(props, engine=-1):
    """
    Updates any number of properties assosciated with this process or a given engine.
    'props' is expected to be a dictionary of dictionaries, something like:
    {
        "progress": {
            "value":50,
            "type":"progress"
        },
        "progress2": {
            "value":75,
            "type":"progress",
            "color":"green"
        },
        "simple": {
            "value":"foo",
            "type":"numeric",
            "color":"#123456"
        }
    }

    These can be done in one call to update() or multiple--they accumulate.

    "value" and "type" are required, "color" is not. If present, "color" is allowed to be
    any CSS color value (a string like "red", "green", etc, a 6-digit hex code preceded by "#",
    or an rgb value like 'rgb(1,2,3)', to name a few).

    Entries with type 'progress' are turned into progress bars, and expect a numeric percentage in 'value'.
    Anything else is just printed out as a key-value pair.

    See the main routine of this file for an example.
    """
    if(engine == -1):
        engine = os.getpid()


    _socketIO.emit("state", {'pid':engine, 'state': props})

if __name__ == "__main__":
    import time
    import random
    r = random.Random()
    print = logged(print)

    def prog_test(n):
        # Color values can be any CSS color value
        progress_color = r.choice(['red', '#337ab7', "rgb(137,92,176)", '#926f47'])
        for i in range(100):
            # Printed strings are sent directly during the print function
            print("#" * i)

            # bulid a state dictionary of keys to {'value':<>, "type":<string>, ["color": <css-color>]}
            state = dict()
            state['progress'] = {"value": i+1, "type":"progress", 'color':progress_color}
            if(i % 20 == 0):
                temp = {'value': r.choice([35, 60, 70, 80, 99, 104, 50])}
                temp['type'] = "numeric";
                if(temp['value'] > 80):
                    temp['color'] = 'red';
                else:
                    temp['color'] = 'green';

                state['temperature'] = temp;
            if(i % 10 == 5):
                state['status'] = {"value": r.choice(["reading", "writing", "waiting"]), 'type':'string'}

            # Send the whole state dictionary at once. Could be done in separate parts.
            update(state)
            time.sleep(0.5)
        update({"status":{"value": "finished", "type":"string"}})

    prog_test(100)
