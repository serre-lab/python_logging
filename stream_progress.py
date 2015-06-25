from __future__ import print_function

from socketIO_client import SocketIO,BaseNamespace
import os

from select import select

host = "localhost"#"g15.clps.brown.edu"
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
    Updates any number of arbitrary key-value properties of this process 
    (or the engine given in a keyword argument) on the remote server.
    The exception is "progress"--any value keyed as "progress" is assumed
    to be a numeric percentage representing progress towards a goal, and is 
    used to construct a progress bar on the final webpage.
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
        for i in range(100):
            print("#" * i)
            update({"progress": i+1})
            if(i % 20 == 0):
                update({"temperature": r.choice([35, 60, 70, 80, 99, 104, 50])})
            if(i % 10 == 5):
                update({"status": r.choice(["reading", "writing", "waiting"])})
            time.sleep(0.5)
        update({"status": "finished"})

    prog_test(100)
