#!/usr/bin/env python3
"""
Скрипт для хэширования паролей.
Использование: python3 hash_password.py <пароль>
"""

import sys

from app.core.security import hash_password

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Использование: python3 hash_password.py <пароль>')
        print('Или запустите скрипт и введите пароль интерактивно')
        password = input('Введите пароль для хэширования: ')
    else:
        password = sys.argv[1]

    hashed = hash_password(password)
    print('\nХэшированный пароль:')
    print(hashed)
    print("\nСкопируйте это значение в поле 'hashed_password' в users.json")
