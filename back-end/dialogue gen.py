from openai import OpenAI
import json


# Load the input from the JSON file
def load_input_from_json(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)


input_data = load_input_from_json('football_combined.json')


client = OpenAI(

    api_key="key"
)
chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "system",
            "content": "Write a dialogue between two characters, Alex and Jamie, discussing a recent news event. Alex introduces the topic, bringing up the event in a way that sets the stage for an in-depth discussion. Jamie responds with detailed information about the event, including key facts and figures. The conversation should explore their emotional reactions to the news, discuss any controversial or unusual aspects, and reflect on the broader societal implications. Ensure the dialogue educates the reader about the incident, highlighting the impact on those directly involved and the community at large. Conclude with the characters sharing their personal takeaways and the lessons that can be learned from the event."
        },

        {
            "role": "user",
            "content": f"Here's the dialogue to analyze:\n\n{json.dumps(input_data, indent=2)}"
        }
    ],
    model="gpt-4",
)


print(chat_completion.choices[0].message.content)




