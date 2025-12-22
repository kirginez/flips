import hashlib
import urllib.parse
from typing import Any, List

import httpx
from fastapi import HTTPException

from app.core.config import settings
from app.models.entities import Card


class HTTPReversoRepo:
    def __init__(self, client: httpx.Client):
        self.client = client

    def _get_definitions(self, request: str) -> Any:
        encoded = urllib.parse.quote(request, safe='')
        url = f'https://definition-api.reverso.net/v1/api/definitions/{settings.SOURCE_LANGUAGE}/{encoded}'
        params = {'targetLang': settings.TARGET_LANGUAGE}

        try:
            data = self.client.get(url, params=params)
            return data.json().get('DefsByWord', []) or []
        except Exception as e:
            raise HTTPException(status_code=500, detail=f'Reverso fetch failed: {e}')

    def get_cards(self, request: str) -> list[Card]:
        data = self._get_definitions(request)
        cards = []
        for entry in data:
            if not (word := (entry.get('word') or '').strip()):
                continue

            raw_pron = entry.get('pronounceSpelling') or entry.get('pronounceIpa') or None
            pronunciation = raw_pron.split(', ')[0].strip() if raw_pron else None
            for def_by_pos in entry.get('DefsByPos', []) or []:
                pos = (def_by_pos.get('Pos') or '').strip() or None

                # TODO: Здесь можно пересмотреть или вынести в настройки
                for def_ in def_by_pos.get('Defs', []) or []:
                    # Убираем редкие и устаревшие определения
                    if (def_.get('frequency') != 'VeryCommon') or (def_.get('registerExt') == 'Dated'):
                        continue

                    # Убираем пустые определения
                    if not (definition := (def_.get('Def') or '').strip()):
                        continue

                    # Собираем переводы
                    translations: List[str] = []
                    for t in def_.get('translations') or []:
                        if isinstance(t, dict):
                            if tx := (t.get('translation') or '').strip():
                                translations.append(tx)
                    # Убираем пустые переводы
                    if not (translation := ', '.join(translations)):
                        continue

                    # Собираем метаданные
                    register = (def_.get('registerExt') or '').strip() or None
                    dialect = (def_.get('dialect') or '').strip() or None
                    meta = ', '.join(filter(None, [pos, register, dialect])) or None

                    # Собираем примеры
                    example = example_translation = None
                    examples = def_.get('examples') or []
                    if examples and isinstance(examples[0], dict):
                        example = (examples[0].get('example') or '').strip() or None
                        example_translations = examples[0].get('translations') or []
                        if example_translations and isinstance(example_translations[0], dict):
                            example_translation = (example_translations[0].get('translation') or '').strip().replace(
                                '<em>', ''
                            ).replace('</em>', '') or None

                    id = hashlib.sha256(
                        f'{word}_{translation}_{pronunciation}_{meta}_{example}_{example_translation}'.encode()
                    ).hexdigest()

                    cards.append(
                        Card(
                            id=id,
                            word=word,
                            translation=translation,
                            definition=definition,
                            pronunciation=pronunciation,
                            meta=meta,
                            example=example,
                            example_translation=example_translation,
                        )
                    )
        return cards
