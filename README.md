# Запуск проекта

1. Установить nvm (https://www.geeksforgeeks.org/how-to-install-nvm-on-ubuntu-22-04/) 
2. Установить в nvm 22 версию ноды. `nvm install v22`.
3. Установить pnpm: `curl -fsSL https://get.pnpm.io/install.sh | sh -`
4. Склонировать проект.
5. Зайти в него и запустить команды:
```
nvm use
pnpm install
pnp dev
```
6. Для того, чтобы работала серверная часть - нужно посмотреть правильно ли настроен адрес сервера в файле `.env` в переменной `VITE_PROXY`. И запустить сервер.
7. (Опционально) Установить vue для саблайма (https://packagecontrol.io/packages/Vue)
