from pymongo import MongoClient
import gridfs

def connect_to_mongodb(uri):
    # Connect to the remote MongoDB server
    client = MongoClient(uri)
    return client

def retrieve_audio_from_mongodb(filename, db_name, uri):
    client = connect_to_mongodb(uri)
    db = client[db_name]
    fs = gridfs.GridFS(db)
    print(fs)
    try:
        # Retrieve the file from GridFS
        grid_out = fs.find_one({'filename': filename})
        print(grid_out)
        if grid_out:
            with open(f"downloaded_{filename}", "wb") as output_file:
                output_file.write(grid_out.read())
            print(f"Audio file {filename} has been downloaded.")
        else:
            print("File not found.")
    except Exception as e:
        print(f"An error occurred: {e}")

# Example usage
uri = "mongo db connection string "
retrieve_audio_from_mongodb("combined_dialogue.mp3", "mydatabase", uri)
