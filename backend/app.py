# app.py

import gridfs
from flask import Flask, request, jsonify, session
from flask_pymongo import PyMongo
import os
from dotenv import load_dotenv
from flask_cors import CORS
import certifi
from bson import ObjectId
import ssl
# Initialize flask 
app = Flask(__name__)

# Hardcoded Mongo URI
app.config["MONGO_URI"] = "mongodb+srv://jobsearcher_db:jobsearcher_2026@cluster0.as7ylhr.mongodb.net/jobtrack?retryWrites=true&w=majority"


mongo = PyMongo(app, tls=True, tlsAllowInvalidCertificates=True)

CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000"])


fs = gridfs.GridFS(mongo.db)
db = mongo.db
try:
        # The 'ping' command is the standard way to check a Mongo connection   
    db.command('ping')
    print("connected to db")
except Exception as e:
    print("not connected")
#test to see if its connected to the db
        
#API endpoints 

@app.route("/upload_material", methods=["POST"])
def upload_material():
    # Validation: Check if a file was actually sent
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    application_id = request.form.get("application_id")
    material_type = request.form.get("material_type", "file")

    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    try:
        # Use fs.put to store the file in GridFS
        # We store application_id as an ObjectId so we can link it back to the job
        file_id = fs.put(
            file,
            filename=file.filename,
            content_type=file.content_type,
            application_id=ObjectId(application_id), 
            material_type=material_type
        )

        return jsonify({
            "message": "File uploaded successfully",
            "file_id": str(file_id)
        }), 201
        
    except Exception as e:
        print(f"Upload error: {e}") 
        return jsonify({"error": str(e)}), 500

#login route endpoint: http://localhost:5000/login POST (sending data)
@app.route('/login', methods=['POST']) 
def login():

    data = request.get_json()
    if not data:#Check if data exists
        return jsonify({"error": "No JSON data"}), 400
        
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
         
    # find the user in users collections 
    user = mongo.db.users.find_one({"email": email})#
    print("user from db:",user)
    if not user:# if user is not found 
        return jsonify({"error": "User not found"}), 401

        
    if password !=  user["password"]:
        return jsonify({"error": "Invalid password"}), 401
    user['_id'] = str(user['_id'])
    session['email'] = email #This creates a cookie that the browser sends back with every request so the server knows who is logged in
    return jsonify({"message":"Login successful"})




#Dashboard
#return all applications 
@app.route("/dashboard",methods=["GET"])
def dashboard():
    application = list(mongo.db.application.find())

    for app in application:
        app["_id"] = str(app["_id"])   # convert ObjectId to string for json

    return jsonify(application)

#Applications CRUD

@app.route("/delete_application/<app_id>", methods=["DELETE"])
def delete_application(app_id):
    result = mongo.db.application.delete_one({"_id": ObjectId(app_id)}) #??
    return jsonify({"message": "Application deleted" if result.deleted_count > 0 else "Application not found"})


@app.route("/add_application", methods=["POST"])
def add_application():
    data = request.get_json()
    application = {
        "status": data.get("status"),
        "jobTitle": data.get("jobTitle"),
        "dueDate": data.get("dueDate"),
        "appliedDate": data.get("appliedDate"), 
        "companyName": data.get("companyName"),
        "Url": data.get("Url"),
        "jobId": data.get("jobId"),
        "salary": data.get("salary"),
        "location": data.get("location"),
    }
    result = mongo.db.application.insert_one(application)
    # Return the inserted document with _id converted to string
    application["_id"] = str(result.inserted_id)
    return jsonify(application)

@app.route("/update_application/<app_id>",methods=["PUT"])
def update_application(app_id):
    data = request.get_json()
    if '_id' in data:
        del data['_id']
    # Important del data deletes the key required for update button to work // Mongo cannot modify immutable id field err

    result = mongo.db.application.update_one(
        {"_id": ObjectId(app_id)}, 
        {"$set": data}
    )
    return jsonify({"message": "Updated successfully", "status": "success"}), 200



if __name__ == "__main__":
    app.run(debug=True)
#Notes:
#CORS (Cross-Origin Resource Sharing):  API-related. By default, browsers block a website at port 3000 (React) from talking to port 5000 (Flask) for security. CORS is the "permission slip" that allows them to talk.
#Since files are too big for standard database rows, you use GridFS (a MongoDB feature for large file storage).
#jsonify: flasks converts python objects json so react can accept/its a safe practice for API
#React can't read Python objects directly. jsonify converts Python dictionaries into JSON strings, which is the standard language of the web.