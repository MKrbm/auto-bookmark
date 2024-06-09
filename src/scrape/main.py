import requests
from bs4 import BeautifulSoup

def scrape_webpage(url):
    """
    Scrapes the given URL and returns the text content of all headings (h1, h2, h3, h4, h5, h6) and paragraphs (p).

    Args:
        url (str): The URL of the webpage to scrape.

    Returns:
        str: The text content of the headings and paragraphs, or an error message if the request fails.
    """
    try:
        # Step 1: Send a request to the URL
        response = requests.get(url)

        # Step 2: Check if the request was successful
        if response.status_code == 200:
            # Step 3: Parse the HTML content
            soup = BeautifulSoup(response.content, 'html.parser')

            # Step 4: Extract the desired data
            contents = ""
            for element in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p']):
                contents += element.get_text() + "\n"

            return contents
        else:
            return f"Failed to retrieve the webpage. Status code: {response.status_code}"
    except Exception as e:
        return f"An error occurred: {e}"

