from pymongo import MongoClient, errors

DATABASE_HOST_PORT = 'mongodb://127.0.0.1:27017/'
DEFAULT_DATABASE = 'monica'

URI = DATABASE_HOST_PORT + DEFAULT_DATABASE


class MongoConnection():

    client = None
    def_db = None

    def __init__(self):
        try:
            self.client = MongoClient(URI)
            self.def_db = self.client.get_default_database()
        except IOError:
            print "Could not connect to mongo database !"
            raise

    def get_def_database(self):
        return self.def_db

    def close_connection(self):
        self.client.disconnect()