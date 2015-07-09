
import logging.handlers
import json
import os

class JSONSocketHandler(logging.handlers.SocketHandler):
    """Sends data to a remote server as a JSON string including a
    formatted message, rather than as pickled Python objects"""
    def __init__(self, host, port, engine=None):
        super(JSONSocketHandler, self).__init__(host, port)
        self.engine = engine if engine else os.getpid()

    def makePickle(self, record):
        obj = {"msg":[self.format(record)]}
        obj['pid'] = self.engine
        obj['time'] = record.created
        obj['levelno'] = record.levelno
        obj['level'] = record.levelname
        return json.dumps(obj) + '\000'

def main():
    import logging

    h = JSONSocketHandler("localhost", 8080)
    logging.getLogger().addHandler(h)

    logging.warning("Testing!!!")
    logging.error("Error message")
    logging.error("Error message")
    logging.error("Error message")

if __name__ == '__main__':
    main()
