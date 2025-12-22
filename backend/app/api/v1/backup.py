import csv
import io
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.api.deps import get_cards_repo, get_current_user, get_schedule_repo
from app.models.user import User
from app.repositories.cards import CardsRepo
from app.repositories.schedule import ScheduleRepo

router = APIRouter()


@router.get('/export')
def export_backup(
    user: Annotated[User, Depends(get_current_user)],
    cards_repo: Annotated[CardsRepo, Depends(get_cards_repo)],
    schedule_repo: Annotated[ScheduleRepo, Depends(get_schedule_repo)],
):
    """Экспортирует Schedule + Cards в CSV"""
    output = io.StringIO()
    writer = csv.writer(output)

    # Schedule section
    writer.writerow(['# SCHEDULE'])
    writer.writerow(['id', 'username', 'card_id', 'ease', 'due', 'interval_min', 'status', 'created_at'])

    schedules = schedule_repo.get_all_schedules(user.username)
    for schedule in schedules:
        writer.writerow([
            schedule.id,
            schedule.username,
            schedule.card_id,
            schedule.ease,
            schedule.due.isoformat() if schedule.due else '',
            schedule.interval_min,
            schedule.status.value,
            schedule.created_at.isoformat(),
        ])

    # Cards section
    writer.writerow([])
    writer.writerow(['# CARDS'])
    writer.writerow(['id', 'word', 'translation', 'definition', 'meta', 'pronunciation', 'example', 'example_translation', 'created_at'])

    # Получаем все карточки пользователя
    card_ids = [s.card_id for s in schedules]
    for card_id in card_ids:
        card = cards_repo.get_card(card_id)
        if card:
            writer.writerow([
                card.id,
                card.word,
                card.translation,
                card.definition or '',
                card.meta or '',
                card.pronunciation or '',
                card.example or '',
                card.example_translation or '',
                card.created_at.isoformat(),
            ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename=flips_backup.csv'}
    )


@router.post('/import')
def import_backup(
    file: UploadFile,
    user: Annotated[User, Depends(get_current_user)],
    cards_repo: Annotated[CardsRepo, Depends(get_cards_repo)],
    schedule_repo: Annotated[ScheduleRepo, Depends(get_schedule_repo)],
):
    """Импортирует Schedule + Cards из CSV (merge)"""
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail='File must be CSV')

    try:
        content = file.file.read().decode('utf-8')
        reader = csv.reader(io.StringIO(content))

        cards_added = 0
        cards_updated = 0
        schedules_added = 0
        schedules_updated = 0

        section = None
        headers = []

        for row in reader:
            if not row:
                continue

            # Проверка на заголовок секции
            if row[0].startswith('# '):
                section = row[0].replace('# ', '').strip()
                continue

            # Пропускаем заголовки столбцов
            if row[0] in ['id', 'card_id']:
                headers = row
                continue

            if section == 'CARDS':
                # TODO: Implement card import
                # Нужна функция create_or_update в CardsRepo
                pass

            elif section == 'SCHEDULE':
                # TODO: Implement schedule import
                # Нужна функция create_or_update в ScheduleRepo
                pass

        return {
            'cards_added': cards_added,
            'cards_updated': cards_updated,
            'schedules_added': schedules_added,
            'schedules_updated': schedules_updated,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f'Failed to import: {str(e)}')

