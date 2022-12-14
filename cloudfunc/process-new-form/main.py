# Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

import fitz
import functions_framework

from firebase_admin import auth
from firebase_admin import initialize_app
from firebase_admin import storage
from flask_cors import cross_origin


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
  if doc_id is None or requested_uid is None:
    return '∅'

  authorized_uid = _get_authorized_uid(request)
  if authorized_uid is None:
    return 'invalid Authorization header', 401

  if authorized_uid != requested_uid:
    return 'access denied', 403

  return {'data': {'greeting': 'Hello World'}}


def _get_request_params(request):
  '''Extract the docId from the request.'''
  json = request.get_json(silent=True)
  if not json:
    return (None, None)

  json_data = json.get('data')
  if not json_data:
    return (None, None)

  doc_id = json_data.get('docId')
  uid = json_data.get('uid')
  return (doc_id, uid)


def _get_authorized_uid(request):
  '''Validate the auth token and return the id of the authorized user.'''
  auth_header = request.headers.get('Authorization')
  if not auth_header:
    return None

  auth_type, id_token = auth_header.split(" ", 1)
  if auth_type.lower() != 'bearer':
    return None

  decoded_token = auth.verify_id_token(id_token)
  if not decoded_token:
    return None

  return decoded_token['uid']
