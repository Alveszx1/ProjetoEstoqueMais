@echo off
setlocal

set "ROOT=%~dp0"

if not exist "%ROOT%projeto_estoque\app.js" (
    echo Nao encontrei a API em "%ROOT%projeto_estoque".
    pause
    exit /b 1
)

if not exist "%ROOT%package.json" (
    echo Nao encontrei o projeto frontend em "%ROOT%".
    pause
    exit /b 1
)

start "API Estoque+" /D "%ROOT%projeto_estoque" cmd /k "node app.js"
start "Frontend Estoque+" /D "%ROOT%" cmd /k "npm run dev -- --host"

echo Aguardando o frontend iniciar...
timeout /t 5 /nobreak >nul
start "" "http://localhost:5173"

echo API e frontend iniciados em janelas separadas.
echo Mantenha as duas janelas abertas enquanto usar o sistema.
