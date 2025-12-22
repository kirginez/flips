from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_cards_repo, get_current_user, get_reverso_repo, get_schedule_repo
from app.models.user import User
from app.repositories.cards import CardsRepo
from app.repositories.reverso import HTTPReversoRepo
from app.repositories.schedule import ScheduleRepo

router = APIRouter()


class BulkCreateRequest(BaseModel):
    words: list[str]


class BulkCreateResponse(BaseModel):
    added: list[str]
    failed: list[str]


@router.post('/create')
def create_cards(
    word: str,
    user: Annotated[User, Depends(get_current_user)],
    cards_repo: Annotated[CardsRepo, Depends(get_cards_repo)],
    schedule_repo: Annotated[ScheduleRepo, Depends(get_schedule_repo)],
    reverso: Annotated[HTTPReversoRepo, Depends(get_reverso_repo)],
) -> set[str]:
    if not (cards := reverso.get_cards(word)):
        raise HTTPException(status_code=404, detail='No cards found')
    translation = set[str]()
    for card in cards:
        cards_repo.create_card(card)
        schedule_repo.add_card(card.id, user.username)
        translation.update(card.translation.split(', '))
    return translation


@router.post('/bulk-create')
def bulk_create_cards(
    request: BulkCreateRequest,
    user: Annotated[User, Depends(get_current_user)],
    cards_repo: Annotated[CardsRepo, Depends(get_cards_repo)],
    schedule_repo: Annotated[ScheduleRepo, Depends(get_schedule_repo)],
    reverso: Annotated[HTTPReversoRepo, Depends(get_reverso_repo)],
) -> BulkCreateResponse:
    results = BulkCreateResponse(added=[], failed=[])

    for word in request.words:
        word = word.strip()
        if not word:
            continue

        try:
            cards = reverso.get_cards(word)
            if cards:
                for card in cards:
                    cards_repo.create_card(card)
                    schedule_repo.add_card(card.id, user.username)
                results.added.append(word)
            else:
                results.failed.append(word)
        except Exception as e:
            print(f'Failed to add word {word}: {e}')
            results.failed.append(word)

    return results
