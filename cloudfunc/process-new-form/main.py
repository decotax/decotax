# Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

import fitz
import functions_framework

from firebase_admin import auth
from firebase_admin import initialize_app
from firebase_admin import storage
from flask_cors import cross_origin
from google.cloud import exceptions as cloud_exceptions
from werkzeug.exceptions import *


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
  if not doc_id and not requested_uid:
    return '∅'

  authorized_uid = _get_authorized_uid(request)
  if authorized_uid != requested_uid:
    raise Forbidden

  bucket = storage.bucket('decotax.appspot.com')
  path = 'form/user/%s/%s' % (requested_uid, doc_id)
  blob = bucket.blob(path)

  try:
    blob_bytes = blob.download_as_bytes()
  except cloud_exceptions.NotFound:
    raise NotFound

  with fitz.open(stream = blob_bytes) as doc:
    page_count = doc.page_count

    for page_num in range(page_count):
      page_img = doc[page_num].get_pixmap(dpi = 192)
      img_blob = bucket.blob('%s.%s' % (path, page_num))

      img_blob.upload_from_string(
          page_img.tobytes(),
          content_type = 'image/png')

  return {'data': {'page_count': page_count}}


def _get_request_params(request):
  '''Extract the docId from the request.'''
  json = request.get_json(silent = True)
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

  uid = decoded_token['uid']
  if not uid:
    raise Unauthorized

  return uid
