import json
from replit import db

# Get all key-value pairs from the database
data = {key: db[key] for key in db.keys()}

# Save it as a JSON file
with open("replit_db_export.json", "w") as f:
    json.dump(data, f, indent=4)

print("✅ Database exported successfully to replit_db_export.json")