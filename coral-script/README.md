coral-script
============

The interpreter! Scripts are passed in as JSON, perform actions against the public Monzo API, and return a result.

This service does not perform any kind of authentication or persistence. It requires an `access_token` and `user_id` to be passed in, along with the script to run.

