from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
uri = os.getenv("MONGO_URI")

try:
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    print("Databases:", client.list_database_names())
    print("MongoDB connection successful!")
except Exception as e:
    print("Connection failed:", e)