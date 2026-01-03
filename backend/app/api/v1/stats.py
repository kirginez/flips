from typing import Annotated

from app.api.deps import get_cards_repo, get_current_user, get_history_repo, get_schedule_repo
from app.models.user import User
from app.repositories.cards import CardsRepo
from app.repositories.history import HistoryRepo
from app.repositories.schedule import ScheduleRepo
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

router = APIRouter()


class StatsOverview(BaseModel):
    total: int
    new: int
    cram: int
    due: int


class HardestCard(BaseModel):
    card: dict
    ease: float


class DueChartData(BaseModel):
    date: str
    count: int


class ActivityData(BaseModel):
    date: str
    count: int


class TodayStats(BaseModel):
    count: int
    time_spent: str | None


@router.get('/overview')
def get_overview(
    user: Annotated[User, Depends(get_current_user)],
    schedule_repo: Annotated[ScheduleRepo, Depends(get_schedule_repo)],
) -> StatsOverview:
    amount = schedule_repo.get_amount(user.username)
    total = amount.new + amount.cram + amount.due
    return StatsOverview(
        total=total,
        new=amount.new,
        cram=amount.cram,
        due=amount.due,
    )


@router.get('/hardest')
def get_hardest(
    user: Annotated[User, Depends(get_current_user)],
    schedule_repo: Annotated[ScheduleRepo, Depends(get_schedule_repo)],
    limit: int = Query(default=10, ge=1, le=20),
) -> list[HardestCard]:
    cards = schedule_repo.get_hardest_cards(user.username, limit)
    return [HardestCard(card=item['card'], ease=item['ease']) for item in cards]


@router.get('/due-chart')
def get_due_chart(
    user: Annotated[User, Depends(get_current_user)],
    schedule_repo: Annotated[ScheduleRepo, Depends(get_schedule_repo)],
    days: int = Query(default=30, ge=1, le=365),
) -> list[DueChartData]:
    data = schedule_repo.get_due_chart(user.username, days)
    return [DueChartData(date=item['date'], count=item['count']) for item in data]


@router.get('/activity')
def get_activity(
    user: Annotated[User, Depends(get_current_user)],
    history_repo: Annotated[HistoryRepo, Depends(get_history_repo)],
    days: int = Query(default=365, ge=1, le=365),
) -> list[ActivityData]:
    data = history_repo.get_activity_data(user.username, days)
    return [ActivityData(date=item['date'], count=item['count']) for item in data]


@router.get('/today')
def get_today_stats(
    user: Annotated[User, Depends(get_current_user)],
    history_repo: Annotated[HistoryRepo, Depends(get_history_repo)],
) -> TodayStats:
    stats = history_repo.get_today_stats(user.username)
    time_spent = None
    if stats['first_time'] and stats['last_time']:
        delta = stats['last_time'] - stats['first_time']
        total_seconds = int(delta.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        time_spent = f'{hours}:{minutes:02d}'
    return TodayStats(count=stats['count'], time_spent=time_spent)

