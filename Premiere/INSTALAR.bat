@echo off
setlocal enabledelayedexpansion

echo ====================================================
echo    INSTALADOR EDITLAB PRO - V5 (FIXED)
echo ====================================================

:: Define nomes e caminhos
set "EXTENSION_NAME=com.editormaster.premium.v1"
set "SOURCE_DIR=%~dp0%EXTENSION_NAME%"
set "TARGET_DIR_COMMON=%CommonProgramFiles(x86)%\Adobe\CEP\extensions\%EXTENSION_NAME%"
set "TARGET_DIR_USER=%AppData%\Adobe\CEP\extensions\%EXTENSION_NAME%"
set "CACHE_DIR=%LocalAppData%\Adobe\CEP\cache\%EXTENSION_NAME%"

echo.
echo [1/3] Limpando cache do Adobe...
rd /s /q "%CACHE_DIR%" 2>nul

echo [2/3] Removendo instalacoes antigas...
rd /s /q "%TARGET_DIR_COMMON%" 2>nul
rd /s /q "%TARGET_DIR_USER%" 2>nul

echo [3/3] Instalando novos arquivos...
:: Tenta Global primeiro (Arquivos de Programas)
mkdir "%TARGET_DIR_COMMON%" 2>nul
xcopy "%SOURCE_DIR%" "%TARGET_DIR_COMMON%" /s /e /y /i /q

if %errorlevel% neq 0 (
    echo [INFO] Nao foi possivel instalar em Arquivos de Programas. 
    echo Tentando instalacao local na pasta do Usuario...
    mkdir "%TARGET_DIR_USER%" 2>nul
    xcopy "%SOURCE_DIR%" "%TARGET_DIR_USER%" /s /e /y /i /q
)

if %errorlevel% equ 0 (
    echo.
    echo ====================================================
    echo    SUCESSO! O PLUGIN FOI ATUALIZADO.
    echo.
    echo    1. Feche o Premiere se estiver aberto.
    echo    2. Abra o Premiere e va em Janela -> Extensoes.
    echo ====================================================
) else (
    echo.
    echo [!] ERRO: Nao foi possivel copiar os arquivos.
    echo Certifique-se de que o Premiere esta FECHADO.
)

echo.
echo Pressione qualquer tecla para sair...
pause >nul
