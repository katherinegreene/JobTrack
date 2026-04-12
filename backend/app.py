# app.py

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

app.secret_key = os.environ.get('SECRET_KEY','supersecretkey123')
# Hardcoded Mongo URI
app.config["MONGO_URI"] = "mongodb+srv://jobsearcher_db:jobsearcher_2026@cluster0.as7ylhr.mongodb.net/jobtrack?retryWrites=true&w=majority"

#DELETE this later
print("HARDCODED URI:", app.config["MONGO_URI"])

#mongo = PyMongo(app, tlsCAFile=certifi.where())
#mongo = PyMongo(app)
mongo = PyMongo(app, tls=True, tlsAllowInvalidCertificates=True)
#CORS(app, supports_credentials=True, origins=["*"])
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])
#CORS(app, origins=["http://localhost:3000"])


db = mongo.db
try:
        # The 'ping' command is the standard way to check a Mongo connection   
    db.command('ping')
    print("connected to db")
except Exception as e:
    print("not connected")
    #return jsonify({"error": "Database connection failed", "details": str(e)}), 500
        
#Routes
#login route endpoint: http://localhost:5000/login POST (sending data)
@app.route('/login', methods=['POST']) 

def login():

    db = mongo.db
    try:
            # The 'ping' command is the standard way to check a Mongo connection   
        db.command('ping')
        print("connected to db")
    except Exception as e:
        print("not connected")
        #return jsonify({"error": "Database connection failed", "details": str(e)}), 500
   
    data = request.get_json()
    if not data:#Check if data exists
        return jsonify({"error": "No JSON data"}), 400
        
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
         
    # find the user in users collections 
    user = mongo.db.users.find_one({"email": email})
    print("user from db:",user)
    if not user:# if user is not found 
        return jsonify({"error": "User not found"}), 401

        
    if password !=  user["password"]:
        return jsonify({"error": "Invalid password"}), 401
    user['_id'] = str(user['_id'])
    session['email'] = email
    return jsonify({"message":"Login successful"})




#dashboard
#return all applications 
@app.route("/dashboard",methods=["GET"])
def dashboard():
    application = list(mongo.db.application.find())

    for app in application:
        app["_id"] = str(app["_id"])   # convert ObjectId to string for json

    return jsonify(application)



@app.route("/add_application", methods=["POST"])
def add_application():
    data = request.get_json()
    application = {
        "status": data.get("status"),
        "jobTitle": data.get("jobTitle"),
        "dueDate": data.get("dueDate"),
        "appliedDate": data.get("appliedDate"),  # optional
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

#jsonify: flasks converts python objects json so react can accept/safe practice for API
if __name__ == "__main__":
    app.run(debug=True)
