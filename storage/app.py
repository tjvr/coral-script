import json
from uuid import uuid4

from flask import Flask, jsonify, request, abort
app = Flask(__name__)

from model import Session, User


@app.route("/session/<cookie>")
def session(cookie):
    try:
        session = get_session(cookie)
    except Session.DoesNotExist:
        session = Session.create(
            cookie = cookie,
            state_string = uuid4().hex,
        )
    return jsonify(session_to_dict(session))

@app.route("/session/<cookie>", methods=['POST'])
def login(cookie):
    d = request.get_json()
    if not d:
        abort(400)

    try:
        session = get_session(cookie)
    except Session.DoesNotExist:
        abort(404)

    user, created = User.get_or_create(
        user_id = d.get('user_id'),
        defaults = dict(
            variables_json = "{}",
            scripts_json = "[]",
            access_token = d.get('access_token'),
            refresh_token = d.get('refresh_token'),
        ),
    )
    if not created:
        user.access_token = d.get('access_token')
        user.refresh_token = d.get('refresh_token')
        user.save()

    session.user = user
    session.save()
    return jsonify(session_to_dict(session))

@app.route("/session/<cookie>", methods=['DELETE'])
def logout(cookie):
    try:
        Session.delete().where(Session.cookie == cookie).execute()
    except Session.DoesNotExist:
        pass
    return jsonify()

@app.route("/session/<cookie>/scripts", methods=['PUT'])
def save_scripts(cookie):
    d = request.get_json()
    if not d:
        abort(400)
    scripts = d.get('scripts')
    if not isinstance(scripts, list):
        abort(400)

    try:
        session = get_session(cookie)
    except Session.DoesNotExist:
        abort(404)
    if not session.user_id:
        abort(403)

    session.user.scripts_json = json.dumps(scripts)
    session.user.save()
    return jsonify(session_to_dict(session))

@app.route("/user/<user_id>", methods=['GET'])
def user(user_id):
    try:
        user = User.get(user_id=user_id)
    except User.DoesNotExist:
        abort(404)
    return jsonify(user_to_dict(user))

@app.route("/user/<user_id>/variables", methods=['PUT'])
def save_variables(user_id):
    d = request.get_json()
    if not d:
        abort(400)
    variables = d.get('variables')
    if not isinstance(variables, dict):
        abort(400)

    try:
        user = User.get(user_id=user_id)
    except User.DoesNotExist:
        abort(404)
    user.variables_json = json.dumps(variables)
    user.save()
    return jsonify(user=user_to_dict(user))


def get_session(cookie):
    return Session.select().prefetch(User).where(Session.cookie == cookie).get()
    
def session_to_dict(session):
    return dict(
        state_string = session.state_string,
        user = user_to_dict(session.user),
    )

def user_to_dict(user):
    if not user:
        return None
    return dict(
        user_id = user.user_id,
        access_token = user.access_token,
        refresh_token = user.refresh_token,
        variables = safe_json(user.variables_json),
        scripts = safe_json(user.scripts_json),
    )

def safe_json(data):
    try:
        return json.loads(data)
    except json.JSONDecodeError:
        return None

