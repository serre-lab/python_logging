#!/usr/bin/env python
# from __future__ import print_function

try:
    import colored_traceback.always
except ImportError:
    pass

import sys
import time
from IPython.display import clear_output
from IPython import parallel
import os


# from stream_progress import stdout_wrapped
# print = stdout_wrapped(print)


rc = parallel.Client()
print len(rc) , " engines."
import time

# print = logged(print)

# Starting the ipython parallelt ools
from IPython.parallel import Client, depend, require, dependent
print( len(rc), " engine started")
lview = rc.load_balanced_view()
lview.block = False
n_engines = len(lview)

#------------------------------------------------------------------------------#
def wait_watching(ar):
    import os
    import time
    t = 1

    clear = lambda: os.system('clear')
    while not ar.ready():
        clear()
        lerr = ar.stderr
        lout = ar.stdout
        print "*********************"
        for i, (le, lo) in enumerate(zip(lerr, lout)):
            print "engine: ", i
            print le
            print lo
        time.sleep(t)
    if ar.ready():
        return ar.get()

def print_one(i, le, lo):
    print( le)
    sys.stdout.flush()
    print( lo)
    sys.stderr.flush()
#------------------------------------------------------------------------------#
def prog_test(n):
    import time
    import random
    import tools, time
    from tools.utils import start_progressbar, end_progressbar, update_progressbar
    import os, sys
    from python_logging.stream_progress import logged, update
    r = random.Random()
    def p(args): print args
    p = logged(p)

    # Color values can be any CSS color value
    progress_color = r.choice(['red', '#337ab7', "rgb(137,92,176)", '#926f47'])
    for i in range(100):
        # Printed strings are sent directly during the print function
        #p("#" * i)
        p("doing bla bla bla at iteration: %i" %(i) )

        # bulid a state dictionary of keys to {'value':<>, "type":<string>, ["color": <css-color>]}
        state = dict()
        state['progress'] = {"value": i+1, "type":"progress", 'color':"red"}
        state['progress2'] = {"value": i+1, "type":"progress", 'color':"blue"}
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
#------------------------------------------------------------------------------#
def fake_progress((time_iter, engine)):
    """docstring for fname"""
    import tools, time
    from tools.utils import start_progressbar, end_progressbar, update_progressbar
    import os, sys
    from python_logging.stream_progress import logged, update
    #from python_logging import stream_progress
    #from stream_progress import logged,update
    # Make p function
    def p(args): print args
    p = logged(p)

    n_total = 100
    pbar = start_progressbar(n_total, 'Progress: ')
    for i in range(n_total):
        time.sleep(time_iter)
        # Use p function rather than print
        p(i, engine=engine)
        update_progressbar(pbar, i)
    end_progressbar(pbar)
    sys.stdout.flush()

    return n_total

#------------------------------------------------------------------------------#
if __name__ == "__main__":
    ar   = lview.map(prog_test, range(n_engines))
    dest = wait_watching(ar)

