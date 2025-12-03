@echo off
REM Script para fazer Push no GitHub com Personal Access Token

echo.
echo ====================================
echo    PUSH PARA GITHUB - THE BOX
echo ====================================
echo.

cd "c:\Users\Vip\Documents\PROJETO THE BOX CONTROL\PROJETO B ORIGIN"

echo [1/3] Verificando status do repositório...
git status
echo.

echo [2/3] Abrindo página para gerar Token...
echo Acessando: https://github.com/settings/tokens/new
start https://github.com/settings/tokens/new
echo.

echo [3/3] Pronto para fazer Push!
echo.
echo Digite seu token pessoal quando solicitado (não é a senha!)
echo.
pause

echo Fazendo Push para GitHub...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SUCESSO! Seu código está no GitHub!
    echo.
    echo Acesse: https://github.com/Accont-stack/boxx
    echo.
) else (
    echo.
    echo ❌ Erro no Push. Verifique o token gerado.
    echo.
)

pause
