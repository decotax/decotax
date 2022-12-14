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
def processNewForm(request):
    '''
    Process a newly uploaded blank form by rendering each page of the PDF file
    to a PNG image and writing the images back to Cloud Storage.
    '''
    return {'data': {'greeting': 'Hello World'}}
