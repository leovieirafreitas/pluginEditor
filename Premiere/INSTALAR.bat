@echo off
title EditLab Pro - Instalador
chcp 65001 > nul
color 0B

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║                🎬 EDITLAB PRO - INSTALADOR               ║
echo  ║                  Versão 1.0                              ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: Verificar se está rodando como Admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo  ⚠️  ATENÇÃO: Execute como Administrador para instalação global!
    echo  Tentando instalar no perfil do usuário...
    echo.
)

set "PLUGIN_NAME=com.editormaster.premium.v1"
set "PLUGIN_SRC=%~dp0%PLUGIN_NAME%"

:: Tenta primeiro o caminho global, depois o local
set "INSTALL_PATH_GLOBAL=C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\%PLUGIN_NAME%"
set "INSTALL_PATH_USER=%APPDATA%\Adobe\CEP\extensions\%PLUGIN_NAME%"

:: Verificar se a pasta do plugin existe
if not exist "%PLUGIN_SRC%" (
    echo  ❌ ERRO: Pasta do plugin nao encontrada em:
    echo     %PLUGIN_SRC%
    echo.
    pause
    exit /b 1
)

:: Escolher destino
set "INSTALL_DEST=%INSTALL_PATH_USER%"
net session >nul 2>&1
if %errorLevel% equ 0 (
    set "INSTALL_DEST=%INSTALL_PATH_GLOBAL%"
    echo  ✓ Modo Administrador detectado. Instalação global.
) else (
    echo  ✓ Instalação no perfil do usuário.
)

echo  📂 Destino: %INSTALL_DEST%
echo.

:: Remover versão antiga se existir
if exist "%INSTALL_DEST%" (
    echo  🗑️  Removendo versão anterior...
    rmdir /s /q "%INSTALL_DEST%"
)

:: Criar diretório e copiar
echo  📋 Copiando arquivos...
mkdir "%INSTALL_DEST%" 2>nul
xcopy "%PLUGIN_SRC%\*" "%INSTALL_DEST%\" /s /e /y /q

if %errorLevel% neq 0 (
    echo.
    echo  ❌ ERRO ao copiar arquivos!
    pause
    exit /b 1
)

:: Verificar instalação
if not exist "%INSTALL_DEST%\index.html" (
    echo.
    echo  ❌ ERRO: Instalação incompleta!
    pause
    exit /b 1
)

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║  ✅  INSTALAÇÃO CONCLUÍDA COM SUCESSO!                   ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
echo  📌 PRÓXIMOS PASSOS:
echo.
echo  1. Abra o Adobe Premiere Pro
echo  2. Vá em: Window ^> Extensions ^> 🎬 EditLab Pro
echo  3. Faça login com suas credenciais
echo  4. Abra uma timeline e comece a usar!
echo.
echo  ⚠️  Se o plugin não aparecer na lista de extensões:
echo     - Certifique-se de ter o CSXS Player instalado
echo     - Tente fechar e reabrir o Premiere Pro
echo     - Execute o instalador como Administrador
echo.
pause
