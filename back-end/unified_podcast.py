import json
import time
import re
import os
import requests
from praw import Reddit
from openai import OpenAI
import openai
from file_upload import upload_audio_to_mongodb
# API keys (replace with your actual keys)
REDDIT_CLIENT_ID = 'client id'
REDDIT_CLIENT_SECRET = 'secret key'
OPENAI_API_KEY = "key"
ELEVENLABS_API_KEY = "secret key"

# Hardcoded limits for data collection
MAX_TWEETS = 5
MAX_REDDIT_POSTS = 2
MAX_REDDIT_COMMENTS = 3

# Initialize API clients
reddit = Reddit(client_id=REDDIT_CLIENT_ID, client_secret=REDDIT_CLIENT_SECRET, user_agent='script by /u/Mindless-News-6376')
openai_client = OpenAI(api_key=OPENAI_API_KEY)

def download_json_data(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"An error occurred while fetching Twitter data: {e}")
        return None

def format_json_data(raw_data, query):
    topic = query
    source = "twitter"
    combined_text_data = ""
    for item in raw_data:
        combined_text_data += item['text'] + " "
    formatted_data = {
        "topic": topic,
        "source": source,
        "text_data": combined_text_data.strip()
    }
    return formatted_data

def get_twitter_data(query):
    url = f"https://podcast-generator.onrender.com/search?q={query}"
    raw_data = download_json_data(url)
    if raw_data:
        limited_data = raw_data[:MAX_TWEETS]
        return format_json_data(limited_data, query)
    return None

def get_reddit_data(search_query):
    reddit_data = []
    try:
        for post in reddit.subreddit('all').search(search_query, limit=MAX_REDDIT_POSTS):
            post_data = {
                "topic": search_query,
                "source": "reddit",
                "text_data": f"Title: {post.title}\nSubreddit: {post.subreddit}\nURL: {post.url}\n"
            }
            
            comments_data = ""
            post.comment_sort = 'top'
            post.comments.replace_more(limit=0)
            for i, comment in enumerate(post.comments[:MAX_REDDIT_COMMENTS]):
                comments_data += f"--- Comment by {comment.author}: {comment.body}\n"
                time.sleep(0.5)
            
            post_data["text_data"] += comments_data
            reddit_data.append(post_data)
            time.sleep(1)
    except Exception as e:
        print(f"An error occurred while fetching Reddit data: {e}")
    
    return reddit_data

def get_data(topic):
    twitter_data = get_twitter_data(topic)
    reddit_data = get_reddit_data(topic)
    
    combined_data = []
    if twitter_data:
        combined_data.append(twitter_data)
    combined_data.extend(reddit_data)
    
    return combined_data

def clean_script(script):
    cleaned_script = re.sub(r'\[.*?\]', '', script)
    cleaned_script = re.sub(r'\s+', ' ', cleaned_script).strip()
    return cleaned_script

def chunk_data(data, max_tokens=3000):
    chunks = []
    current_chunk = []
    current_tokens = 0

    for item in data:
        item_json = json.dumps(item)
        item_tokens = len(item_json.split())
        
        if current_tokens + item_tokens > max_tokens:
            chunks.append(current_chunk)
            current_chunk = [item]
            current_tokens = item_tokens
        else:
            current_chunk.append(item)
            current_tokens += item_tokens

    if current_chunk:
        chunks.append(current_chunk)

    return chunks

def generate_podcast(data, character):
    personas = {
        1: ("Jesicca", "an analytical and storyteller host who provides in-depth, well-researched insights on complex topics while weaving compelling narratives"),
        2: ("Allison", "a casual and entertaining host who makes even serious topics accessible and engaging for a wide audience, often using humor and relatable examples"),
        3: ("Andrew", "a deep dive and investigative host who uncovers hidden stories, provides thorough analysis of events, and isn't afraid to ask tough questions")
    }

    host_name, host_description = personas.get(character, ("Host", "a knowledgeable and engaging podcast host"))

    chunks = chunk_data(data)
    full_script = ""

    for i, chunk in enumerate(chunks):
        prompt = f"""
        You are {host_name}, {host_description}. Generate a part of a podcast script based on the following news data:
        {json.dumps(chunk, indent=2)}
        
        This is part {i+1} of {len(chunks)} of the podcast.
        
        Important instructions:
        1. The podcast should be a monologue discussing the topic.
        2. Maintain your persona throughout the script, but do not repeatedly mention your name.
        3. The monologue should be engaging, informative, and reflect your unique perspective as described.
        4. Add human nuances like "um," "you know," or brief pauses, but use them sparingly and naturally.
        5. Include "This American Life"-style interjections (e.g., "Get this," "This is where it gets interesting") to maintain engagement.
        6. Don't sound like an AI; sound like a human expert in your field.
        7. For any actions or emotions, put them in square brackets like this: [chuckle] or [brief pause].
        8. Focus on delivering the content in your unique style without constantly reminding the audience who you are.
        9. Don't just read out the tweets or reddit comments, make it conversational.
        10. Ensure smooth transitions between chunks.
        """

        try:
            response = openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an AI assistant that generates podcast scripts."},
                    {"role": "user", "content": prompt}
                ]
            )
            full_script += response.choices[0].message.content + "\n\n"
            time.sleep(1)  # Add a small delay between API calls
        except openai.RateLimitError:
            print(f"OpenAI API rate limit reached for chunk {i+1}. Skipping to next chunk.")
            continue
        except Exception as e:
            print(f"An error occurred while generating the podcast script for chunk {i+1}: {e}")
            continue

    if not full_script:
        print("Failed to generate any content. Falling back to basic script.")
        return generate_basic_script(data, host_name, host_description)

    return full_script

def generate_basic_script(data, host_name, host_description):
    script = f"Hello, I'm {host_name}, {host_description}. Today, we're discussing some recent news and events.\n\n"
    
    for item in data:
        script += f"Let's talk about {item['topic']} from {item['source']}.\n"
        script += f"{item['text_data'][:500]}...\n\n"  # Limit to first 500 characters for brevity
    
    script += "\nThat's all for today's podcast. Thanks for listening!"
    return script

def text_to_speech(text, voice_id, output_file):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    data = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.5}
    }
    try:
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()
        
        with open(output_file, "wb") as f:
            f.write(response.content)
        print(f"Audio saved to {output_file}")
        
        if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
            print(f"Audio file successfully created: {output_file}")
        else:
            print(f"Audio file creation failed or file is empty: {output_file}")
    
    except requests.exceptions.RequestException as e:
        print(f"Error in API request: {e}")
        if response.status_code == 401:
            print("Authentication failed. Check your API key.")
        elif response.status_code == 400:
            print("Bad request. Check your input parameters.")
        print(f"Response content: {response.text}")
    except IOError as e:
        print(f"Error writing to file: {e}")

def generate_single_host_podcast(topic, character):
    data = get_data(topic)
    podcast_script = generate_podcast(data, int(character))
    cleaned_script = clean_script(podcast_script)

    script_file = f"{topic.replace(' ', '_')}_podcast_script.txt"
    with open(script_file, 'w') as outfile:
        outfile.write(cleaned_script)

    voice_ids = {
        1: "TxGEqnHWrfWFTfGW9XjX",  # Jesicca's voice ID
        2: "EXAVITQu4vr4xnSDxMaL",  # Allison's voice ID
        3: "MF3mGyEYCl7XYWbV9V6O"   # Andrew's voice ID
    }

    selected_voice_id = voice_ids.get(int(character))
    if not selected_voice_id:
        print("Invalid character selection. Using default voice.")
        selected_voice_id = voice_ids[1]  # Default to Jesicca's voice

    audio_file = "output.mp3"
    text_to_speech(cleaned_script, selected_voice_id, audio_file)

    return {
        'script': cleaned_script,
        'audio_file': audio_file
    }

def main_single(topic,character):
    # topic = input("Enter the topic to search for: ")
    
    # print("\nChoose Your Host:")
    # print("1. Jesicca - Analytical & Storyteller")
    # print("2. Allison - Casual & Entertaining")
    # print("3. Andrew - Deep Dive & Investigative")

    while True:
        try:
            # character = int(input("Enter the number (1-3) for your host choice: "))
            if 1 <= character <= 3:
                break
            else:
                print("Invalid choice. Please enter a number between 1 and 3.")
        except ValueError:
            print("Please enter a number.")

    podcast_data = generate_single_host_podcast(topic, character)
    
    print(f"Podcast script saved to: {topic.replace(' ', '_')}_podcast_script.txt")
    print(f"Podcast audio saved to: {podcast_data['audio_file']}")

    uri = ""
    upload_audio_to_mongodb("output.mp3","kdatabase",uri)
    print("uploaded to db")
    # os.remove()

# if __name__ == "__main__":
#     main_single("eminem",2)