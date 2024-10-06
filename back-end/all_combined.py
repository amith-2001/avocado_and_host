import requests
import praw
import json
import os
from openai import OpenAI
from pydub import AudioSegment
from file_upload import upload_audio_to_mongodb
# Setup for Twitter-like API
def download_json_data(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        return data
    except requests.RequestException as e:
        print(f"An error occurred: {e}")
        return None

# Setup for Reddit
reddit = praw.Reddit(
    client_id='your client id',
    client_secret='your secret key',
    user_agent='script by /u/Mindless-News-6376'
)

def search_and_export_comments(search_query, source, topic):
    search_results = reddit.subreddit('all').search(search_query, limit=10)
    data_list = []
    for post in search_results:
        comments_data = ""
        post.comments.replace_more(limit=0)
        for comment in post.comments.list()[:5]:
            comments_data += f"--- Comment by {comment.author}: {comment.body}\n"
        data_list.append({
            "topic": topic,
            "source": source,
            "text_data": f"Title: {post.title}\nSubreddit: {post.subreddit}\nURL: {post.url}\n" + comments_data
        })
    return data_list

# Initialize the OpenAI client
client = OpenAI(api_key='key')

def load_input_from_json(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

def chunk_data(data, chunk_size):
    for i in range(0, len(data), chunk_size):
        yield data[i:i + chunk_size]

def generate_dialogue(input_data):
    responses = []
    for chunk in chunk_data(json.dumps(input_data), 10000):
        formatted_input = f"Here's the dialogue to analyze:\n\n{chunk}"
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": f"Write a dialogue between two characters, Alex and Jamie, discussing a recent news event. {formatted_input}"
                }
            ],
            model="gpt-4",
        )
        responses.append(chat_completion.choices[0].message.content)
    return ' '.join(responses)

def parse_dialogue(text):
    lines = text.split('\n')
    parsed_dialogue = []
    current_speaker = None
    current_text = ""

    for line in lines:
        if line.startswith("Alex:") or line.startswith("Jamie:"):
            if current_speaker:
                parsed_dialogue.append((current_speaker, current_text.strip(), "nova" if current_speaker == "Alex" else "echo"))
            current_speaker = line.split(':')[0]
            current_text = line.split(':', 1)[1].strip()
        else:
            current_text += " " + line.strip()

    if current_speaker:
        parsed_dialogue.append((current_speaker, current_text.strip(), "nova" if current_speaker == "Alex" else "echo"))

    return parsed_dialogue

def text_to_speech(text, filename, voice):
    response = client.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=text
    )
    response.stream_to_file(filename)

def main(topic):
    print("entered main loop")
    query = topic
    twitter_url = f"https://podcast-generator.onrender.com/search?q={query}"
    twitter_data = download_json_data(twitter_url)
    if twitter_data:
        twitter_formatted_data = [{"topic": query, "source": "twitter", "text_data": item['text']} for item in twitter_data]
    reddit_data = search_and_export_comments(query, "reddit", query)
    combined_data = twitter_formatted_data + reddit_data
    with open(f'{query.replace(" ", "_")}_combined.json', 'w') as json_file:
        json.dump(combined_data, json_file, indent=4)
    input_data = load_input_from_json(f'{topic}_combined.json')
    generated_dialogue = generate_dialogue(input_data)
    parsed_dialogue = parse_dialogue(generated_dialogue)
    print("Generated Dialogue:")
    for speaker, text, voice in parsed_dialogue:
        print(f"{speaker}: {text}")
        print(f"Voice: {voice}")
        print()
    combined_audio = AudioSegment.empty()
    for i, (speaker, text, voice) in enumerate(parsed_dialogue):
        temp_filename = f"temp_{i + 1}_{speaker}.mp3"
        text_to_speech(text, temp_filename, voice)
        print(f"Generated audio file for {speaker}")
        audio_segment = AudioSegment.from_mp3(temp_filename)
        combined_audio += audio_segment
        combined_audio += AudioSegment.silent(duration=500)
        os.remove(temp_filename)
    output_filename = "combined_asf_dialogue.mp3"
    combined_audio.export(output_filename, format="mp3")
    print(f"Generated combined audio file: {output_filename}")
    uri = "URI"
    upload_audio_to_mongodb("combined_asf_dialogue.mp3","mydatabase",uri)
# if __name__ == "__main__":
#     main("basketball")
