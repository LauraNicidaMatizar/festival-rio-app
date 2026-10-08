import re
import json
import pdfplumber

def parse_festival_magazine(pdf_path, output_json_path):
    movies = []
    
    # Padrão para identificar sessões (ex: "SAB (10/10) 19:30 Cine Odeon CCLSR")
    session_regex = re.compile(
        r'^(DOM|SEG|TER|QUA|QUI|SEX|SÁB|SAB)\s*\((?P<date>\d{2}/\d{2})\)\s*(?P<time>\d{2}:\d{2})\s*(?P<venue>.*?)(?P<flags>[\*★\s]*)$',
        re.IGNORECASE
    )

    # Padrão para extrair País, Ano e Duração
    info_regex = re.compile(r'(?P<country>[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s/]+),\s*(?P<year>\d{4}),\s*\((?P<duration>\d+min)\)', re.IGNORECASE)

    with pdfplumber.open(pdf_path) as pdf:
        start_page = 43  # Índice 0 (página 44)
        end_page = min(71, len(pdf.pages))

        full_text = ""
        for page_num in range(start_page, end_page):
            text = pdf.pages[page_num].extract_text()
            if text:
                full_text += text + "\n"

    lines = full_text.split("\n")
    
    current_movie = None
    synopsis_lines = []
    is_capturing_synopsis = False

    for line in lines:
        line_str = line.strip()
        if not line_str:
            continue

        # Verifica se é linha de sessão
        session_match = session_regex.match(line_str)
        if session_match and current_movie:
            is_capturing_synopsis = False
            session_data = session_match.groupdict()
            has_qna = "**" in session_data["flags"] or "★" in session_data["flags"]
            
            current_movie["screenings"].append({
                "day_of_week": session_data["date"],
                "date": f"2026-{session_data['date'].split('/')[1]}-{session_data['date'].split('/')[0]}",
                "time": session_data["time"],
                "datetime_start": f"2026-{session_data['date'].split('/')[1]}-{session_data['date'].split('/')[0]}T{session_data['time']}:00-03:00",
                "venue": session_data["venue"].strip(),
                "has_qna": has_qna
            })
            continue

        # Se encontrar nome de mostra/seção
        if any(section in line_str for section in [
            "Première Brasil", "Panorama Mundial", "Expectativa", 
            "Première Latina", "Midnight Movies", "Clássicos e Cults", 
            "O Estado das Coisas", "Itinerários Únicos"
        ]):
            is_capturing_synopsis = False
            if current_movie:
                current_movie["section"] = line_str.split("-")[0].strip()
            continue

        # Linha de créditos e metadados ("de DIREÇÃO com ELENCO. PAÍS, ANO, (XXmin)")
        if line_str.startswith("de ") and current_movie:
            current_movie["credits"] = line_str
            
            info_match = info_regex.search(line_str)
            if info_match:
                current_movie["country"] = info_match.group("country").strip()
                current_movie["year"] = info_match.group("year").strip()
                current_movie["duration"] = info_match.group("duration").strip()
            
            is_capturing_synopsis = True
            synopsis_lines = []
            continue

        # Título do filme em Caixa Alta
        if line_str.isupper() and len(line_str) > 2 and not line_str.startswith("SINOPSES") and not line_str.startswith("LEGENDAS"):
            if current_movie:
                if synopsis_lines:
                    current_movie["synopsis"] = " ".join(synopsis_lines).strip()
                if current_movie["screenings"]:
                    movies.append(current_movie)

            current_movie = {
                "id": f"movie_{len(movies) + 1:03d}",
                "title": line_str,
                "section": "Outros",
                "credits": "",
                "synopsis": "",
                "country": "",
                "year": "",
                "duration": "",
                "screenings": []
            }
            is_capturing_synopsis = False
            synopsis_lines = []
            continue

        # Captura as linhas da sinopse
        if is_capturing_synopsis and current_movie:
            synopsis_lines.append(line_str)

    # Adiciona o último filme
    if current_movie:
        if synopsis_lines:
            current_movie["synopsis"] = " ".join(synopsis_lines).strip()
        if current_movie["screenings"]:
            movies.append(current_movie)

    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(movies, f, ensure_ascii=False, indent=2)

    print(f"Sucesso! {len(movies)} filmes atualizados com sinopses completas em '{output_json_path}'.")

if __name__ == "__main__":
    parse_festival_magazine("revista-festivaldorio-2026.pdf", "programacao_festival_2026.json")
