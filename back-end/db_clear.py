from pymongo import MongoClient
import gridfs

def connect_to_mongodb(uri):
    # Connect to the remote MongoDB server
    client = MongoClient(uri)
    return client

def delete_all_audio_files(db_name, uri):
    client = connect_to_mongodb(uri)
    db = client[db_name]  # Use or create the database
    fs = gridfs.GridFS(db)  # Use GridFS for the database

    # Retrieve all files in GridFS
    all_files = fs.find()
    file_count = 0

    # Delete each file
    for file in all_files:
        fs.delete(file._id)
        file_count += 1

    print(f"All files deleted. Total files removed: {file_count}")

# Example usage
uri = "url to db"
delete_all_audio_files("kdatabase", uri)
