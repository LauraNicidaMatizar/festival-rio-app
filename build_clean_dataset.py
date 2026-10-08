import json
import re
import unicodedata
import os
from docx import Document
from bs4 import BeautifulSoup
from thefuzz import fuzz

def normalize_title(text):
    if not text:
        return ""
    # Remove acentos e caracteres especiais para comparação
    nfkd = unicodedata.normalize('NFKD', text)
    no_accent = "".join([c for c in nfkd if not unicodedata.combining(c)])
    clean = re.sub(r'[^a-zA-Z0-9\s]', '', no_accent).lower().strip()
    # Remove artigos iniciais comuns para melhorar o match
    clean = re.sub(r'^(o|a|os|as|um|uma|uns|umas|the|le|la|les)\s+', '', clean)
    return clean

def parse_docx_schedule(docx_filename):
    if not os.path.exists(docx_filename):
        # Tenta nome alternativo caso exista
        alt_name = "Programação festival do rio.docx"
        if os.path.exists(alt_name):
            docx_filename = alt_name

    doc = Document(docx_filename)
    lines = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

    movies_dict = {}
    current_date_raw = ""
    iso_date = "2026-10-01"

    date_regex = re.compile(r'^(Seg|Ter|Qua|Qui|Sex|Sáb|Dom),\s*(\d+)\s*Out$', re.IGNORECASE)
    time_regex = re.compile(r'^(\d{1,2})H(\d{2})$', re.IGNORECASE)
    duration_regex = re.compile(r'^(\d+)\'$')

    known_sections = [
        "Panorama Mundial", "Expectativa", "Première Latina", "Première Brasil", 
        "Itinerários Únicos", "Clássicos e Cults", "Clássicos & Cults", "O Estado das Coisas", 
        "Cinema Circulação", "Midnight Movies", "Gala de Abertura", "Gala de Encerramento",
        "Gala De Abertura", "Gala De Encerramento"
    ]

    idx = 0
    while idx < len(lines):
        line = lines[idx]

        # Processa mudança de dia
        date_match = date_regex.match(line)
        if date_match:
            current_date_raw = line
            day_num = int(date_match.group(2))
            iso_date = f"2026-10-{day_num:02d}"
            idx += 1
            continue

        # Identifica o bloco de um filme
        if line in known_sections and idx + 2 < len(lines):
            section = line
            title = lines[idx+1].strip()
            country = lines[idx+2].strip()

            genre = ""
            duration = ""
            time_val = ""
            venue = ""
            has_qna = False
            is_sold_out = False
            is_free = False

            for offset in range(3, 14):
                if idx + offset >= len(lines):
                    break
                l = lines[idx+offset].strip()

                if l in ["Ficção", "Documentário", "Animação"]:
                    genre = l
                elif duration_regex.match(l):
                    duration = f"{duration_regex.match(l).group(1)}min"
                elif time_regex.match(l):
                    tm = time_regex.match(l)
                    time_val = f"{int(tm.group(1)):02d}:{tm.group(2)}"

                    tag_idx = idx + offset + 1
                    venue_parts = []

                    while tag_idx < len(lines):
                        tl = lines[tag_idx].strip()
                        tl_upper = tl.upper()

                        if "SESSÃO ESGOTADA" in tl_upper:
                            is_sold_out = True
                        elif "COM CONVIDADO" in tl_upper or "COM DEBATE" in tl_upper:
                            has_qna = True
                        elif "GRATUITA" in tl_upper:
                            is_free = True
                        elif re.search(r'Comprar ingresso|Cadastre-se', tl, re.IGNORECASE):
                            tag_idx += 1
                            break
                        elif not any(k in tl_upper for k in ["SESSÃO ESPECIAL", "NA SESSÃO"]):
                            if len(tl) > 2 and not date_regex.match(tl) and tl not in known_sections:
                                venue_parts.append(tl)

                        tag_idx += 1

                    venue = " ".join(venue_parts).strip()
                    if not venue or venue == "Comprar ingresso":
                        venue = "Local a definir"

                    norm_key = normalize_title(title)
                    if not norm_key:
                        norm_key = title.lower().strip()

                    if norm_key not in movies_dict:
                        movies_dict[norm_key] = {
                            "id": f"movie_{len(movies_dict) + 1:03d}",
                            "title": title,
                            "section": section,
                            "country": country,
                            "genre": genre,
                            "duration": duration,
                            "year": "2026",
                            "credits": "",
                            "synopsis": "Sinopse em atualização.",
                            "director_bio": "",
                            "screenings": []
                        }

                    # Adiciona a sessão
                    movies_dict[norm_key]["screenings"].append({
                        "day_of_week": current_date_raw,
                        "date": iso_date,
                        "time": time_val,
                        "venue": venue,
                        "has_qna": has_qna,
                        "is_sold_out": is_sold_out,
                        "is_free": is_free
                    })

                    idx = tag_idx - 1
                    break
        idx += 1

    return movies_dict

def enrich_from_html(movies_dict, html_filename):
    if not os.path.exists(html_filename):
        print(f"Aviso: Ficheiro '{html_filename}' não encontrado.")
        return 0

    with open(html_filename, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    # Agrupa blocos de texto por div de texto do InDesign
    containers = soup.find_all('div', class_='Quadro-de-texto-b-sico')
    text_blocks = []
    for c in containers:
        txt = c.get_text(separator='\n').strip()
        if len(txt) > 30:
            text_blocks.append(txt)

    matched = 0
    for norm_key, movie in movies_dict.items():
        best_score = 0
        best_block = None

        for block in text_blocks:
            lines = [l.strip() for l in block.split('\n') if l.strip()]
            first_lines = " ".join(lines[:4])
            score = fuzz.token_set_ratio(movie['title'].lower(), first_lines.lower())
            
            if score > best_score:
                best_score = score
                best_block = block

        if best_score >= 75 and best_block:
            matched += 1
            lines = [l.strip() for l in best_block.split('\n') if l.strip()]

            # Procura créditos do Diretor
            dir_match = re.search(r'Direção/Direction:\s*([^Roteiro\n]+)', best_block, re.IGNORECASE)
            if dir_match:
                movie["credits"] = f"de {dir_match.group(1).strip()}"

            # Extrai sinopse em Português
            pt_paragraphs = []
            bio_paragraphs = []
            is_bio = False

            for l in lines:
                if any(k in l.upper() for k in ["DIREÇÃO:", "DIRECTION:", "SOBRE O DIRETOR", "CINEASTA"]):
                    is_bio = True
                
                if is_bio:
                    if len(l) > 20 and not l.startswith("Direção/"):
                        bio_paragraphs.append(l)
                else:
                    # Filtra linhas de cabeçalho, inglês e metadados
                    if (len(l) > 30 and 
                        not any(k in l for k in ["Fiction", "Color", "Direction:", "Screenplay:", "Production Company:", "Executive Production:"]) and
                        not l.isupper()):
                        pt_paragraphs.append(l)

            if pt_paragraphs:
                movie["synopsis"] = " ".join(pt_paragraphs[:2])
            if bio_paragraphs:
                movie["director_bio"] = " ".join(bio_paragraphs[:2])

    return matched

def main():
    docx_file = "Programação festival do rio_2.docx"
    html_file = "indesign.html"
    output_file = "programacao_festival_2026.json"

    print(f"1. A extrair grade completa do DOCX ({docx_file})...")
    movies_dict = parse_docx_schedule(docx_file)
    print(f"-> {len(movies_dict)} filmes únicos identificados.")

    print(f"2. A cruzar dados com o HTML do InDesign ({html_file})...")
    matched_count = enrich_from_html(movies_dict, html_file)
    print(f"-> {matched_count} filmes enriquecidos com ficha técnica e sinopse.")

    final_list = list(movies_dict.values())
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(final_list, f, ensure_ascii=False, indent=2)

    print(f"✓ Ficheiro final guardado com sucesso em '{output_file}'.")

if __name__ == "__main__":
    main()