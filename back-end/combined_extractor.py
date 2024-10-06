import requests
import praw
import json


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
    client_id='client id',
    client_secret='client secret key',
    user_agent='script by /u/Mindless-News-6376'
)


def search_and_export_comments(search_query, source, topic):
    search_results = reddit.subreddit('all').search(search_query, limit=10)
    data_list = []  # List to hold all posts and their comments

    for post in search_results:
        comments_data = ""
        post.comments.replace_more(limit=0)
        for comment in post.comments.list()[:5]:  # Limit the list to first 5 comments
            comments_data += f"--- Comment by {comment.author}: {comment.body}\n"

        # Append formatted data
        data_list.append({
            "topic": topic,
            "source": source,
            "text_data": f"Title: {post.title}\nSubreddit: {post.subreddit}\nURL: {post.url}\n" + comments_data
        })

    return data_list


def main():
    query = "football"
    twitter_url = f"https://podcast-generator.onrender.com/search?q={query}"
    twitter_data = download_json_data(twitter_url)

    if twitter_data:
        twitter_formatted_data = [{"topic": query, "source": "twitter", "text_data": item['text']} for item in
                                  twitter_data]

    reddit_data = search_and_export_comments(query, "reddit", query)

    combined_data = twitter_formatted_data + reddit_data

    # Export the combined list to a JSON file
    with open(f'{query.replace(" ", "_")}_combined.json', 'w') as json_file:
        json.dump(combined_data, json_file, indent=4)


# Call the main function to execute
main()
