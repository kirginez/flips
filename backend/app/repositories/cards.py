from fastapi import HTTPException
from sqlmodel import Session, select

from app.models.entities import Card


class CardsRepo:
    def __init__(self, db: Session):
        self.db = db

    def create_card(self, card: Card) -> None:
        stmt = select(Card).where(Card.id == card.id)
        if not (self.db.exec(stmt).first()):
            self.db.add(card)
            self.db.commit()
            return

    def get_card(self, card_id: str) -> Card:
        card = self.db.get(Card, card_id)
        if not card:
            raise HTTPException(status_code=404, detail='Card not found')
        return card

    def delete_card(self, card_id: str) -> None:
        card = self.db.get(Card, card_id)
        if card:
            self.db.delete(card)
            self.db.commit()
