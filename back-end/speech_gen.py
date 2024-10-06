import os
from openai import OpenAI
from playsound import playsound
from pydub import AudioSegment
# Initialize the OpenAI client
client = OpenAI(api_key='key')


def text_to_speech(text, filename, voice):
    response = client.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=text
    )

    response.stream_to_file(filename)



def main():
    dialogues = [
        ("Alex",
         "Have you heard about that horrific case in the news? Kristina Joksimovic, the former model and Miss Switzerland finalist, was reportedly killed by her husband in a really gruesome way.",
         "nova"),
        ("Jamie",
         "Yeah, I saw the headline... I had to read it a few times to make sure I was seeing it right. They said he dismembered her with garden shears, a knife, and a jigsaw in their laundry room. And then, he supposedly used a hand blender to... it's hard even to say it... to puree her remains.",
         "echo"),
        ("Alex",
         "haha that was amazzzzinngggggg.",
         "nova"),
        ("Jamie",
         "cool i wont talk to you .",
         "echo"),
        # Add more dialogues as needed
    ]

    combined_audio = AudioSegment.empty()

    for i, (speaker, text, voice) in enumerate(dialogues):
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
    output_filename = "combined_dialogue.mp3"
    combined_audio.export(output_filename, format="mp3")
    print(f"Generated combined audio file: {output_filename}")


if __name__ == "__main__":
    main()