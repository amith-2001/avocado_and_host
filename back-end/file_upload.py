from pymongo import MongoClient
import gridfs

def connect_to_mongodb(uri):
    # Connect to the remote MongoDB server
    client = MongoClient(uri)
    return client

def upload_audio_to_mongodb(filepath, db_name, uri):
    client = connect_to_mongodb(uri)
    db = client[db_name]  # Use or create the database
    fs = gridfs.GridFS(db)  # Use GridFS for the database

    with open(filepath, 'rb') as audio_file:
        contents = audio_file.read()
        # Store the file in GridFS
        audio_id = fs.put(contents, filename="combined_asf_dialogue.mp3")
        print(f"Audio file uploaded with id: {audio_id}")


