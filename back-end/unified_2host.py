import json
import os
from openai import OpenAI
from pydub import AudioSegment

# Initialize the OpenAI client
client = OpenAI(api_key='key')

def load_input_from_json(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

def chunk_data(data, chunk_size):
    """Divide data into chunks with each having a maximum of chunk_size characters."""
    for i in range(0, len(data), chunk_size):
        yield data[i:i + chunk_size]

def generate_dialogue(input_data):
    responses = []
    for chunk in chunk_data(json.dumps(input_data), 10000):  # chunk size of 10000 characters
        formatted_input = f"Here's the dialogue to analyze:\n\n{chunk}"
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": f"Write a dialogue between two characters, Alex and Jamie, discussing a recent news event. Alex introduces the topic, bringing up the event in a way that sets the stage for an in-depth discussion. Jamie responds with detailed information about the event, including key facts and figures. The conversation should explore their emotional reactions to the news, discuss any controversial or unusual aspects, and reflect on the broader societal implications. Ensure the dialogue educates the reader about the incident, highlighting the impact on those directly involved and the community at large. Conclude with the characters sharing their personal takeaways and the lessons that can be learned from the event. {formatted_input}"
                },

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

def main():
    # Load input data
    input_data = load_input_from_json('football_combined.json')

    # Generate dialogue
    generated_dialogue = generate_dialogue(input_data)
    parsed_dialogue = parse_dialogue(generated_dialogue)

    # Print the parsed dialogue
    print("Generated Dialogue:")
    for speaker, text, voice in parsed_dialogue:
        print(f"{speaker}: {text}")
        print(f"Voice: {voice}")
        print()

    # Generate speech
    combined_audio = AudioSegment.empty()

    for i, (speaker, text, voice) in enumerate(parsed_dialogue):
        temp_filename = f"temp_{i + 1}_{speaker}.mp3"
        text_to_speech(text, temp_filename, voice)
        print(f"Generated audio file for {speaker}")

        # Load the audio file and add it to the combined audio
        audio_segment = AudioSegment.from_mp3(temp_filename)
        combined_audio += audio_segment

        # Add a short pause between speakers
        combined_audio += AudioSegment.silent(duration=500)

        # Remove the temporary file
        os.remove(temp_filename)

    # Export the combined audio
    output_filename = "combined_asf_dialogue.mp3"
    combined_audio.export(output_filename, format="mp3")
    print(f"Generated combined audio file: {output_filename}")

if __name__ == "__main__":
    main()
