import pandas as pd
import json
import glob
import os

excel_files = sorted(glob.glob("Festival_do_Rio_2026_catalogo_programacao_FINAL*.xlsx"))

if not excel_files:
    print("Erro: Nenhuma planilha 'Festival_do_Rio_2026_catalogo_programacao_FINAL*.xlsx' encontrada.")
    exit(1)

excel_path = excel_files[-1]
output_file = "programacao_festival_2026.json"

print(f"Lendo planilha: '{excel_path}'...")
xls = pd.ExcelFile(excel_path)

df_filmes = pd.read_excel(excel_path, sheet_name='Filmes')

if 'Sessões' in xls.sheet_names:
    df_sessoes = pd.read_excel(excel_path, sheet_name='Sessões')
elif 'Exibições' in xls.sheet_names:
    df_sessoes = pd.read_excel(excel_path, sheet_name='Exibições')
else:
    df_sessoes = pd.read_excel(excel_path, sheet_name=xls.sheet_names[1])

json_data = []

for idx, row in df_filmes.iterrows():
    movie_title = str(row['Filme']).strip()
    
    if 'ID' in row and pd.notna(row['ID']) and 'ID' in df_sessoes.columns:
        sessoes_filme = df_sessoes[df_sessoes['ID'] == row['ID']]
    else:
        sessoes_filme = df_sessoes[df_sessoes['Filme'].str.strip() == movie_title]
        
    screenings = []
    for _, ex in sessoes_filme.iterrows():
        date_str = str(ex['Data']).split()[0] if pd.notna(ex['Data']) else '2026-10-01'
        
        time_raw = str(ex['Horário'])
        time_str = time_raw[:5] if len(time_raw) == 8 else time_raw
        
        if 'Cinema / local' in ex and pd.notna(ex['Cinema / local']):
            venue = str(ex['Cinema / local']).strip()
        else:
            cinema = str(ex.get('Cinema', '')).strip()
            sala = str(ex.get('Sala de cinema', '')).strip()
            venue = f"{cinema} {sala}".strip() if sala and sala != 'nan' and sala not in cinema else cinema
            
        address = str(ex.get('Endereço', '')).strip()
        if address == 'nan':
            address = ""
                
        day_str = date_str.split('-')[2] if '-' in date_str else '01'
        day_of_week = f"{str(ex['Dia']).strip()}, {int(day_str)} Out"
        
        is_free = (str(ex.get('Gratuita', '')).strip().upper() == 'SIM')
        has_qna = (str(ex.get('Com convidado', '')).strip().upper() == 'SIM') or (str(ex.get('Com debate', '')).strip().upper() == 'SIM')
        
        obs = str(ex.get('Observações', '')) if pd.notna(ex.get('Observações', '')) else ''
        is_sold_out = 'esgotada' in obs.lower()
        
        screenings.append({
            "day_of_week": day_of_week,
            "date": date_str,
            "time": time_str,
            "venue": venue,
            "address": address,
            "has_qna": has_qna,
            "is_sold_out": is_sold_out,
            "is_free": is_free
        })
        
    credits_str = f"de {str(row['Direção']).strip()}" if pd.notna(row.get('Direção')) and str(row.get('Direção')).strip() != 'nan' else ""
    synopsis_val = str(row['Sinopse']).strip() if pd.notna(row.get('Sinopse')) and str(row.get('Sinopse')).strip() != 'nan' else "Sinopse em atualização."
    
    genre_val = str(row.get('Gênero padronizado', row.get('Formato (programação)', ''))).strip()
    if genre_val == 'nan':
        genre_val = ""
        
    year_val = str(row.get('Ano', '2026')).strip()
    if year_val == 'nan':
        year_val = "2026"
        
    c_raw = row.get('País', row.get('País 1', row.get('País / território (programação)', '')))
    country_val = str(c_raw).strip() if pd.notna(c_raw) and str(c_raw).strip() != 'nan' else ""
    
    lb_raw = row.get('Letterboxd', '')
    letterboxd_url = str(lb_raw).strip() if pd.notna(lb_raw) and str(lb_raw).strip() != 'nan' else ""

    fest_raw = row.get('Festival A', '')
    festival_a = str(fest_raw).strip() if pd.notna(fest_raw) and str(fest_raw).strip() != 'nan' else ""

    fest_sec_raw = row.get('Mostra / Seção', '')
    festival_a_section = str(fest_sec_raw).strip() if pd.notna(fest_sec_raw) and str(fest_sec_raw).strip() != 'nan' else ""
    
    is_oscar_related = False
    oscar_info = ""
    syn_lower = synopsis_val.lower()
    if "oscar" in syn_lower:
        if "representante" in syn_lower:
            is_oscar_related = True
            oscar_info = "Representante no Oscar"
        elif "indicad" in syn_lower:
            is_oscar_related = True
            oscar_info = "Indicado ao Oscar"
        elif "vencedor" in syn_lower:
            is_oscar_related = True
            oscar_info = "Vencedor do Oscar"
        else:
            is_oscar_related = True
            oscar_info = "Oscar"

    duration_str = ""
    if pd.notna(row.get('Duração programada (min)')) and str(row.get('Duração programada (min)')).strip() != 'nan':
        try:
            duration_str = f"{int(row['Duração programada (min)'])}min"
        except:
            duration_str = str(row['Duração programada (min)']).strip()

    movie_obj = {
        "id": f"movie_{idx+1:03d}",
        "title": movie_title,
        "section": str(row['Mostra']).strip() if pd.notna(row['Mostra']) else "",
        "country": country_val,
        "genre": genre_val,
        "duration": duration_str,
        "year": year_val,
        "credits": credits_str,
        "synopsis": synopsis_val,
        "director_bio": "",
        "full_technical_sheet": str(row.get('Ficha técnica padronizada', '')).strip() if pd.notna(row.get('Ficha técnica padronizada', '')) else "",
        "letterboxd": letterboxd_url,
        "festival_a": festival_a,
        "festival_a_section": festival_a_section,
        "is_oscar": is_oscar_related,
        "oscar_info": oscar_info,
        "screenings": screenings
    }
    json_data.append(movie_obj)

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(json_data, f, ensure_ascii=False, indent=2)

print(f"Sucesso! '{output_file}' gerado com {len(json_data)} filmes!")
