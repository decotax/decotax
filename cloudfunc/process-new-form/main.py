# Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

import fitz
import functions_framework

from firebase_admin import auth
from firebase_admin import initialize_app
from firebase_admin import storage
from flask_cors import cross_origin
from werkzeug.exceptions import BadRequest
from werkzeug.exceptions import Unauthorized
from werkzeug.exceptions import Forbidden


# Initialize Firebase.
initialize_app()


@cross_origin()
@functions_framework.http
def process_new_form(request):
  '''
  Process a newly uploaded blank form by rendering each page of the PDF file
  to a PNG image and writing the images back to Cloud Storage.
  '''
  (doc_id, requested_uid) = _get_request_params(request)
  if doc_id is None and requested_uid is None:
    return '∅'

  authorized_uid = _get_authorized_uid(request)
  if authorized_uid is None:
    raise Unauthorized

  if authorized_uid != requested_uid:
    raise Forbidden

  return {'data': {'greeting': 'Hello World'}}


def _get_request_params(request):
  '''Extract the docId from the request.'''
  json = request.get_json(silent=True)
  if not json:
    return (None, None)

  json_data = json.get('data')
  if not json_data:
    raise BadRequest

  doc_id = json_data.get('docId')
  if not doc_id:
    raise BadRequest

  uid = json_data.get('uid')
  if not uid:
    raise BadRequest

  return (doc_id, uid)


def _get_authorized_uid(request):
  '''Validate the auth token and return the id of the authorized user.'''
  auth_header = request.headers.get('Authorization')
  if not auth_header:
    raise Unauthorized

  auth_type, id_token = auth_header.split(" ", 1)
  if auth_type.lower() != 'bearer':
    raise Unauthorized

  decoded_token = auth.verify_id_token(id_token)
  if not decoded_token:
    raise Unauthorized

  return decoded_token['uid']
