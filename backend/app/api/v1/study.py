import random
from datetime import datetime, timedelta
from typing import Annotated

from app.api.deps import get_cards_repo, get_current_user, get_history_repo, get_schedule_repo
from app.models.entities import Answer, Card, CardStatus, History, IncreaseLimitsRequest, ScheduleAmount
from app.models.user import User
from app.repositories.cards import CardsRepo
from app.repositories.history import HistoryRepo
from app.repositories.schedule import ScheduleRepo
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter()


@router.get('/stats')
def get_stats(
    user: Annotated[User, Depends(get_current_user)], schedule_repo: Annotated[ScheduleRepo, Depends(get_schedule_repo)]
) -> ScheduleAmount:
    amount = schedule_repo.get_amount(user.username)
    limits = schedule_repo.get_limits(user)
    return ScheduleAmount(
        new=min(amount.new, limits.new_limit), cram=amount.cram, due=min(amount.due, limits.due_limit)
    )


@router.get('/next')
def get_next_card(
    user: Annotated[User, Depends(get_current_user)],
    cards_repo: Annotated[CardsRepo, Depends(get_cards_repo)],
    schedule_repo: Annotated[ScheduleRepo, Depends(get_schedule_repo)],
) -> Card | None:
    cram = schedule_repo.get_cram(user.username)
    if cram and cram.due <= datetime.now():
        return cards_repo.get_card(cram.card_id)

    amount = schedule_repo.get_amount(user.username)
    limits = schedule_repo.get_limits(user)
    new_limit = min(amount.new, limits.new_limit)
    due_limit = min(amount.due, limits.due_limit)

    if new_limit == 0 and due_limit == 0:
        if cram:
            return cards_repo.get_card(cram.card_id)
        return None

    get_card_id = random.choices([schedule_repo.get_new, schedule_repo.get_due], weights=[new_limit, due_limit], k=1)[0]

    card_schedule = get_card_id(user.username)
    if card_schedule:
        return cards_repo.get_card(card_schedule.card_id)

    return None


@router.post('/answer')
def answer_card(
    answer: Answer,
    user: Annotated[User, Depends(get_current_user)],
    schedule_repo: Annotated[ScheduleRepo, Depends(get_schedule_repo)],
    history_repo: Annotated[HistoryRepo, Depends(get_history_repo)],
) -> None:
    if not (schedule := schedule_repo.get_schedule(answer.card_id, user.username)):
        raise HTTPException(status_code=404, detail='Schedule not found')

    match schedule.status:
        case CardStatus.NEW:
            schedule_repo.update_limits(user, CardStatus.NEW, -1)
        case CardStatus.DUE:
            schedule_repo.update_limits(user, CardStatus.DUE, -1)

    history_repo.add_history(History(username=user.username, card_id=answer.card_id, answer=answer.answer))

    if answer.answer:
        match schedule.interval_min:
            case 10:
                schedule.interval_min = 60 * 24
            case None | 1:
                schedule.interval_min = 10
            case _:
                schedule.interval_min = int(schedule.interval_min * schedule.ease)
        schedule.ease *= user.bonus
        match schedule.status:
            case CardStatus.NEW:
                schedule.status = CardStatus.CRAM
            case CardStatus.CRAM:
                # Для перехода из CRAM в DUE интервал должен быть больше 10 минут
                # (т.е. не первый правильный ответ после неправильного)
                if schedule.interval_min > 10:
                    schedule.status = CardStatus.DUE
    else:
        schedule.ease *= user.punishment
        schedule.status = CardStatus.CRAM
        schedule.interval_min = 1

    schedule.due = datetime.now() + timedelta(minutes=schedule.interval_min)
    schedule_repo.update_schedule(schedule)


@router.delete('/cards/{card_id}')
def delete_card(
    card_id: str,
    user: Annotated[User, Depends(get_current_user)],
    cards_repo: Annotated[CardsRepo, Depends(get_cards_repo)],
    schedule_repo: Annotated[ScheduleRepo, Depends(get_schedule_repo)],
) -> None:
    # Удаляем из schedule для текущего пользователя
    schedule_repo.delete_schedule(card_id, user.username)

    # Если нет других пользователей с этой карточкой, удаляем и саму карточку
    if not schedule_repo.has_other_users(card_id, user.username):
        cards_repo.delete_card(card_id)


@router.post('/limits/increase')
def increase_limits(
    request: IncreaseLimitsRequest,
    user: Annotated[User, Depends(get_current_user)],
    schedule_repo: Annotated[ScheduleRepo, Depends(get_schedule_repo)],
) -> dict:
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail='Amount must be greater than 0')

    if request.limit_type not in ['NEW', 'DUE']:
        raise HTTPException(status_code=400, detail='limit_type must be "NEW" or "DUE"')

    # Преобразуем строку в CardStatus
    limit_status = CardStatus.NEW if request.limit_type == 'NEW' else CardStatus.DUE
    schedule_repo.update_limits(user, limit_status, request.amount)

    return {'success': True, 'message': f'Successfully increased {request.limit_type} limit by {request.amount}'}
