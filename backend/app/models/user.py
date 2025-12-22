from sqlmodel import Field, SQLModel


class User(SQLModel):
    username: str
    bonus: float = Field(default=1.05)
    punishment: float = Field(default=0.8)
    new_limit: int = Field(default=20)
    due_limit: int = Field(default=200)
