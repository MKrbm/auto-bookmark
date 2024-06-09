from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_community.document_loaders import WebBaseLoader
from langchain_chroma import Chroma
from langchain import hub
import bs4
from dotenv import load_dotenv
import os
import sys  # noqa: E402
sys.path.insert(0, "./src")  # noqa: E402
import scrape  # noqa: E402

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
LANGCHAIN_API_KEY = os.getenv("LANGCHAIN_API_KEy")


text = scrape.scrape_webpage(
    "https://python.langchain.com/v0.2/docs/tutorials/chatbot/")

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000, chunk_overlap=200)
splits = text_splitter.split_documents(text)
# os.environ["LANGCHAIN_TRACKING_V2"] = "true"
# os.environ["LANGCHAIN_API_KEY"] = LANGCHAIN_API_KEY
