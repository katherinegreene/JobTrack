import pymongo 
client = pymongo.MongoClient("mongodb+srv://jobsearcher_db:jobsearcher_2026@cluster0.as7ylhr.mongodb.net/jobtrack")
db =client.jobtrack
def run_seed():
    samplejob = {"status": "Applied",
        "jobTitle": "Sample Software Engineer",
        "companyName": "Example Corp",
        "dueDate": "2024-12-31",
        "location": "Remote"}
    db.application.insert_one(samplejob)
    print("application added")

#run_seed() uncomment to populate the application manually application will be added to db