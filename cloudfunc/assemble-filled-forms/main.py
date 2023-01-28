# Copyright 2022 DecoTax.  Licensed under AGPL; see COPYING file.

import fitz
import functions_framework

from firebase_admin import auth
from firebase_admin import initialize_app
from firebase_admin import storage
from flask_cors import cross_origin
from google.cloud import exceptions as cloud_exceptions
from jsonschema import validate
from jsonschema.exceptions import ValidationError
from werkzeug.exceptions import *


REQUEST_SCHEMA = ({
  'type': 'array',
  'items': {
    'type': 'object',
    'properties': {
      'formId': {'type': 'string'},
      'private': {'type': 'boolean'},
      'pageSpecs': {
        'type': 'array',
        'items': {
          'type': 'array',
          'items': {
            'type': 'object',
            'properties': {
              'x': {'type': 'number'},
              'y': {'type': 'number'},
              'text': {'type': 'string'}
            },
            'required': ['x', 'y', 'text']
          }
        }
      }
    },
    'required': ['formId', 'private', 'pageSpecs']
  }
})


# Initialize Firebase.
initialize_app()


@cross_origin()
@functions_framework.http
def assemble_filled_forms(request):
  '''
  Generate a PDF according to the specification in the request, consisting of
  a list of blank form IDs and the strings to print on each page.  Write the
  result to Cloud Storage under the request-specified file ID.
  '''
  try:
    return _assemble_filled_forms_impl(request)
  except HTTPException as e:
    # https://github.com/corydolphin/flask-cors/issues/241
    return {'data': {'error': str(e)}}


def _assemble_filled_forms_impl(request):
  '''Helper for assemble_filled_forms.'''
  (dest_file_id, requested_uid, assembly_spec) = _get_request_params(request)
  if not dest_file_id:
    return '∅'

  authorized_uid = _get_authorized_uid(request)
  if authorized_uid != requested_uid:
    raise Forbidden

  bucket = storage.bucket('decotax.appspot.com')
  dest_path = 'file/user/%s/%s' % (authorized_uid, dest_file_id)
  dest_blob = bucket.blob(dest_path)

  try:
    validate(assembly_spec, REQUEST_SCHEMA)
  except ValidationError as e:
    raise BadRequest(e)

  with fitz.open() as dest_doc:
    for form_spec in assembly_spec:
      _process_form_spec(form_spec, bucket, authorized_uid, dest_doc)

    dest_blob.upload_from_string(
        dest_doc.tobytes(garbage=3, clean=True, deflate=True),
        content_type = 'application/pdf')

  return {'data': {'success': True}}


def _get_request_params(request):
  '''Extract the docId from the request.'''
  json = request.get_json(silent = True)
  if not json:
    return (None, None, None)

  json_data = json.get('data')
  if not json_data:
    raise BadRequest

  dest_file_id = json_data.get('destFileId')
  if not dest_file_id:
    raise BadRequest

  uid = json_data.get('uid')
  if not uid:
    raise BadRequest

  assembly_spec = json_data.get('assemblySpec')
  if not assembly_spec:
    raise BadRequest

  return (dest_file_id, uid, assembly_spec)


def _get_authorized_uid(request):
  '''Validate the auth token and return the id of the authorized user.'''
  auth_header = request.headers.get('Authorization')
  if not auth_header:
    raise Unauthorized

  auth_type, id_token = auth_header.split(' ', 1)
  if auth_type.lower() != 'bearer':
    raise Unauthorized

  decoded_token = auth.verify_id_token(id_token)
  if not decoded_token:
    raise Unauthorized

  uid = decoded_token['uid']
  if not uid:
    raise Unauthorized

  return uid


def _process_form_spec(form_spec, bucket, authorized_uid, dest_doc):
  '''Fetch a blank form PDF, write text on it, and append it to dest_doc.'''
  form_id = form_spec['formId']
  private = form_spec['private']
  page_specs = form_spec['pageSpecs']

  if private:
    blank_form_path = 'form/user/%s/%s' % (authorized_uid, form_id)
  else:
    blank_form_path = 'form/public/%s' % form_id

  blank_form_blob = bucket.blob(blank_form_path)
  try:
    blank_form_bytes = blank_form_blob.download_as_bytes()
  except cloud_exceptions.NotFound:
    raise NotFound

  if not blank_form_bytes:
    raise UnprocessableEntity('empty file')

  with fitz.open(stream = blank_form_bytes) as src_doc:
    page_count = src_doc.page_count
    page_spec_count = len(page_specs)
    if page_spec_count > page_count:
      raise BadRequest

    for page_num in range(page_spec_count):
      page_spec = page_specs[page_num]
      page = src_doc[page_num]
      for print_cmd in page_spec:
        page.insert_text(
            fitz.Point(print_cmd['x'], print_cmd['y']),
            print_cmd['text'])

    dest_doc.insert_pdf(src_doc)
