import json
from bs4 import BeautifulSoup, SoupStrainer
from langchain_community.document_loaders import WebBaseLoader
import os

def document_to_dict(doc):
    return {
        "page_content": doc.page_content,
        "metadata": doc.metadata
    }

def scrape_and_save(urls, output_file_path):
    # スクレイピング設定
    bs4_strainer = SoupStrainer(class_=("post-title", "post-header", "post-content"))
    loader = WebBaseLoader(
        web_paths=urls,
        bs_kwargs={"parse_only": bs4_strainer},
    )
    docs = loader.load()
    # print(type(docs))

    # 出力ディレクトリが存在しない場合は作成
    os.makedirs(os.path.dirname(output_file_path), exist_ok=True)

    # 結果をJSON形式で保存
    with open(output_file_path, "w") as file:
        json.dump([document_to_dict(doc) for doc in docs], file)
    return docs

if __name__ == "__main__":
    urls = ["https://lilianweng.github.io/posts/2023-06-23-agent/"]
    output_file_path = "scraped_docs/web_test.json"  # 実行ディレクトリを基準に相対パスを設定
    docs = scrape_and_save(urls, output_file_path)
    print("Scraping and saving completed.")
