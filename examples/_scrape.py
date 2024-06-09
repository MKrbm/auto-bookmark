import requests
from bs4 import BeautifulSoup

# Step 1: Send a request to the URL
url = "https://python.langchain.com/v0.2/docs/tutorials/chatbot/"  # Replace with the URL you want to scrape
response = requests.get(url)


contents = ""

# Step 2: Check if the request was successful
if response.status_code == 200:
    # Step 3: Parse the HTML content
    soup = BeautifulSoup(response.content, 'html.parser')

    # Step 4: Extract the desired data
    # For example, let's extract all the headings (h1, h2, h3, ...)
    for heading in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p']):
        contents += heading.text + "\n"
else:
    print(
        f"Failed to retrieve the webpage. Status code: {response.status_code}")


print(contents)
