# use this code for chunking

from openai import OpenAI
import json

def load_input_from_json(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

def chunk_data(data, chunk_size):
    """Divide data into chunks with each having a maximum of chunk_size characters."""
    for i in range(0, len(data), chunk_size):
        yield data[i:i + chunk_size]

# Initialize the OpenAI client
client = OpenAI(api_key="key")

# Load the data
input_data = load_input_from_json('football_combined.json')
input_json_string = json.dumps(input_data)


chunk_size = 10000  # Adjust based on trial and error to fit within token limits

# Create system message (constant across all requests)
system_message = {

        "role": "system",
        "content": "Write a dialogue between two characters, Alex and Jamie, discussing a recent news event. Alex introduces the topic, bringing up the event in a way that sets the stage for an in-depth discussion. Jamie responds with detailed information about the event, including key facts and figures. The conversation should explore their emotional reactions to the news, discuss any controversial or unusual aspects, and reflect on the broader societal implications. Ensure the dialogue educates the reader about the incident, highlighting the impact on those directly involved and the community at large. Conclude with the characters sharing their personal takeaways and the lessons that can be learned from the event."

}

# Process each chunk
responses = []
for chunk in chunk_data(input_json_string, chunk_size):
    formatted_input = f"Here's the dialogue to analyze:\n\n{chunk}"
    chat_completion = client.chat.completions.create(
        messages=[system_message, {"role": "user", "content": formatted_input}],
        model="gpt-4",
    )
    responses.append(chat_completion.choices[0].message.content)

# Output the results (you may want to further process or concatenate them)
for response in responses:
    print(response)
