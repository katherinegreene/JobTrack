# app.py


from flask import Flask, request, jsonify, session
from flask_pymongo import PyMongo
import os
from dotenv import load_dotenv
from flask_cors import CORS
import certifi
from bson import ObjectId
import ssl
from flask import send_file 
from io import BytesIO
import base64
from werkzeug.utils import secure_filename


load_dotenv()
app = Flask(__name__)

app.secret_key = os.environ.get("SECRET_KEY") 
app.config["MONGO_URI"] = os.environ.get("MONGO_URI")

app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'py', 'java', 'doc', 'docx','mp3', 'wav', 'm4a', 'ogg', 'aac'} #Used Base64 used for uploading materials to mongo 

UPLOAD_FOLDER = "backend/materials" 
os.makedirs(UPLOAD_FOLDER, exist_ok=True)# checks if there is already an existing folder
app.config["UPLOAD_FOLDER"]= UPLOAD_FOLDER


# Hardcoded Mongo URI
app.config["MONGO_URI"] = "mongodb+srv://jobsearcher_db:jobsearcher_2026@cluster0.as7ylhr.mongodb.net/jobtrack?retryWrites=true&w=majority"


mongo = PyMongo(app, tls=True, tlsAllowInvalidCertificates=True)#mongo db connection ignores certification 
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000"])#enables CORS (Cross-Origin Resource Sharing) for your Flask backend so your React frontend can make API requests.

#Nice helper method to check which type of files are allowed
def allowed_file(filename):
    return '.' in filename and filename.lower().endswith((
        '.txt', '.pdf', '.png', '.jpg', '.jpeg', '.gif',
        '.py', '.java', '.doc', '.docx', '.mp3', '.wav',
        '.m4a', '.ogg', '.aac'
    ))
        

dbmongo = mongo.db.materials
#API endpoints 

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
        app["_id"] = str(app["_id"])   # convert ObjectId to string for json/ for react to read it

    return jsonify(application)

#Applications CRUD

@app.route("/delete_application/<app_id>", methods=["DELETE"])
def delete_application(app_id):
    result = mongo.db.application.delete_one({"_id": ObjectId(app_id)}) 
    return jsonify({"message": "Application deleted" if result.deleted_count > 0 else "Application not found"})
#1 > 0 = True   "Application deleted"
#0 > 0 = False  "Application not found"
#"Application deleted" if True    "Application deleted"  
#"Application not found" if False  "Application not found"

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

### 
#Materials

@app.route("/upload_material", methods=["POST"])
def upload_material():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    application_id = request.form.get("application_id")
    
    if file.filename == "" or not allowed_file(file.filename):
        return jsonify({"error": "Invalid file"}), 400

    try:
        # Read file and encode to base64
        file_data = file.read()
        if len(file_data) > 10 * 1024 * 1024:  # 10MB limit
            return jsonify({"error": "File too large (max 10MB)"}), 400
            
        encoded_data = base64.b64encode(file_data).decode('utf-8')
        filename = secure_filename(file.filename)
        
        # Store DIRECTLY in materials collection
        materials = mongo.db.materials
        result = materials.insert_one({
            "application_id": ObjectId(application_id),
            "filename": filename,
            "file_data": encoded_data,  # Base64 encoded file
            "content_type": file.content_type,
            "size": len(file_data)
        })
        
        return jsonify({
            "message": "File uploaded successfully",
            "material_id": str(result.inserted_id),  
            "filename": filename
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/materials/<app_id>", methods=["GET"])
def get_materials(app_id):
    try:
        materials = mongo.db.materials
        files = list(materials.find({"application_id": ObjectId(app_id)}))
        file_list = []
        for file in files:
            file_list.append({
                "material_id": str(file["_id"]),
                "filename": file["filename"],
                "content_type": file["content_type"],
                "size": file.get("size", 0)   
            })
        return jsonify(file_list)
    except Exception as e:
        return jsonify({"error": str(e)})
@app.route("/download/<material_id>")
def download_material(material_id):
    try:
        materials = mongo.db.materials
        material = materials.find_one({"_id": ObjectId(material_id)})
        if not material:
            return jsonify({"error": "File not found"}), 404
        
        # Try base64 first (new files)
        if "file_data" in material:
            file_data = base64.b64decode(material["file_data"])
            return send_file(
                BytesIO(file_data),
                as_attachment=False,  
                download_name=material["filename"],
                mimetype=material["content_type"]
            )

        elif "filepath" in material:
            return send_file(
                material["filepath"],
                as_attachment=False,  
                download_name=material["filename"]
            )
        else:
            return jsonify({"error": "No file data found"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/delete_material/<material_id>", methods=["DELETE"])
def delete_material(material_id):
    materials = mongo.db.materials
    material = materials.find_one({"_id": ObjectId(material_id)})
    if material:
        materials.delete_one({"_id": ObjectId(material_id)})
        return jsonify({"success": True})
    return jsonify({"error": "Material not found"}), 404

if __name__ == "__main__": #runs app.py 
    app.run(debug=True, port=5000)
#Notes:
#CORS (Cross-Origin Resource Sharing):  API-related. By default, browsers block a website at port 3000 (React) from talking to port 5000 (Flask) for security. CORS is the "permission slip" that allows them to talk.
#Since files are too big for standard database rows, you use GridFS (a MongoDB feature for large file storage).
#jsonify: flasks converts python objects json so react can accept/its a safe practice for API
#React can't read Python objects directly. jsonify converts Python dictionaries into JSON strings, which is the standard language of the web.
#file.read() = raw bytes
##b64encode(...) =converts bytes into a long string
#.decode('utf-8') = makes it storable as text in MongoDB