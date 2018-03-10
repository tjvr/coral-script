
import os

from peewee import *



path = os.environ.get('DB_PATH', 'persist.db')
db = SqliteDatabase(path)

class BaseModel(Model):
    class Meta:
        database = db

class User(BaseModel):
    user_id = CharField(primary_key=True)
    access_token = CharField()
    refresh_token = CharField()
    variables_json = CharField()
    scripts_json = CharField()

class Session(BaseModel):
    cookie = CharField(primary_key=True)
    state_string = CharField()
    user = ForeignKeyField(User, backref='sessions', null=True)

db.connect()
db.create_tables([User, Session])

