coral-storage
=============

A simple Flask app that wraps a database (eventually PostgreSQL; currently SQLite) and stores session cookies / user auth tokens. Used for persistence, basically.

Written as a separate service because a) I'm addicted to microservices now and b) it meant I didn't have to learn some Go library for SQL :-)

