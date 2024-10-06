import praw
import json

# Setup PRAW with your credentials
reddit = praw.Reddit(
    client_id='client id',
    client_secret='client secret',
    user_agent='script by /u/Mindless-News-6376'
)


# def search_world_news(news_search):
#     # Search for 'world news' across all subreddits
#     search_results = reddit.subreddit('all').search(f'{news_search}', limit=1)
#
#     for post in search_results:
#         print(f"Title: {post.title}\nSubreddit: {post.subreddit}")
#
#         # Fetch and print all comments
#         post.comments.replace_more(limit=None)  # This removes MoreComments objects to expand the comment tree fully
#         for comment in post.comments.list():
#             print(f"--- Comment by {comment.author}: {comment.body}\n")
#
#
# # Example usage: Search for 'world news' across Reddit
# search_world_news("world news")

def search_and_export_comments(search_query):
    search_results = reddit.subreddit('all').search(search_query, limit=10)
    data_list = []  # List to hold all posts and their comments

    for post in search_results:
        # Initialize a dictionary for each post
        post_dict = {
            "topic": search_query,
            "source": "reddit",
            "text_data": f"Title: {post.title}\nSubreddit: {post.subreddit}\nURL: {post.url}\n"
        }

        # Fetch and append comments
        post.comments.replace_more(limit=0)  # Do not fetch hidden comments beyond the visible ones
        comments_data = ""
        for comment in post.comments.list()[:5]:  # Limit the list to first 10 comments
            comments_data += f"--- Comment by {comment.author}: {comment.body}\n"
        post_dict["text_data"] += comments_data

        # Append the post dictionary to the list
        data_list.append(post_dict)

    # Export the list to a JSON file
    with open(f'{search_query.replace(" ", "_")}.json', 'w') as json_file:
        json.dump(data_list, json_file, indent=4)

# Example usage: Pass the search term as a parameter
search_and_export_comments("us election")


