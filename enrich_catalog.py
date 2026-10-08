import json
import re
import pdfplumber
import unicodedata
import warnings
import logging
import os

# Silencia avisos inofensivos de parsing do PDF
warnings.filterwarnings("ignore")
logging.getLogger("pdfminer").setLevel(logging.ERROR)

def normalize_text(text):
    if not text:
        return ""
    nfkd = unicodedata.normalize('NFKD', text)
    no_accent = "".join([c for c in nfkd if not unicodedata.combining(c)])
    return re.sub(r'[^a-zA-Z0-9\s]', '', no_accent).lower().strip()

def get_pdf_path(filename):
    if os.path.exists(filename):
        return filename
    elif os.path.exists(f"../{filename}"):
        return f"../{filename}"
    return filename

def enrich_movies(programacao_json_path, catalog_pdf_filename, output_path):
    catalog_pdf_path = get_pdf_path(catalog_pdf_filename)
    json_file_path = get_pdf_path(programacao_json_path)

    if not os.path.exists(json_file_path):
        print(f"Erro: Arquivo '{programacao_json_path}' não encontrado.")
        return

    if not os.path.exists(catalog_pdf_path):
        print(f"Erro: Arquivo PDF '{catalog_pdf_filename}' não encontrado.")
        return

    with open(json_file_path, 'r', encoding='utf-8') as f:
        movies = json.load(f)

    print(f"Carregando catálogo completo '{catalog_pdf_path}'...")

    catalog_pages = []
    with pdfplumber.open(catalog_pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                catalog_pages.append({'page_num': i + 1, 'text': text})

    print(f"Catálogo lido ({len(catalog_pages)} páginas). Cruzando informações...")

    matched_count = 0

    for movie in movies:
        movie_title_norm = normalize_text(movie["title"])
        if len(movie_title_norm) < 3:
            continue

        found_page_text = None
        for page in catalog_pages:
            page_text_norm = normalize_text(page['text'])
            if movie_title_norm in page_text_norm:
                found_page_text = page['text']
                break

        if found_page_text:
            matched_count += 1
            lines = [l.strip() for l in found_page_text.split('\n') if l.strip()]

            # Extrai País, Ano e Duração
            info_match = re.search(r'([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s/]+),\s*(\d{4}),\s*\(?(\d+min|\d+)\)?', found_page_text)
            if info_match:
                movie["country"] = info_match.group(1).strip()
                movie["year"] = info_match.group(2).strip()
                dur = info_match.group(3).strip()
                movie["duration"] = dur if "min" in dur else f"{dur}min"

            # Extrai Direção
            director_match = re.search(r'Direção/Direction:\s*(.*)', found_page_text, re.IGNORECASE)
            if director_match:
                director_name = director_match.group(1).split('Roteiro')[0].strip()
                movie["credits"] = f"de {director_name}"

            # Extrai Sinopse e Biografia
            synopsis_paragraphs = []
            bio_lines = []
            capturing_bio = False

            for line in lines:
                if any(k in line.upper() for k in ["DIREÇÃO:", "DIRECTION:", "CINEASTA", "SOBRE O DIRETOR"]):
                    capturing_bio = True

                if capturing_bio:
                    bio_lines.append(line)
                else:
                    if (not line.isupper() and len(line) > 25 and 
                        not line.startswith("Ficção") and not line.startswith("Documentário") and
                        "Direção/" not in line and "Roteiro/" not in line):
                        synopsis_paragraphs.append(line)

            if synopsis_paragraphs:
                movie["synopsis"] = " ".join(synopsis_paragraphs[:3])

            if bio_lines:
                movie["director_bio"] = " ".join(bio_lines[:4])

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(movies, f, ensure_ascii=False, indent=2)

    print(f"Concluído com sucesso! {matched_count} de {len(movies)} filmes encontrados e organizados.")

if __name__ == "__main__":
    enrich_movies(
        "programacao_festival_2026.json",
        "catalogo-festivaldorio-2026.pdf",
        "programacao_festival_2026.json"
    )
