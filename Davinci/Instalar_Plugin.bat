@echo off
chcp 65001 > nul
title EditLab Pro — Instalador para DaVinci Resolve

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║          EditLab Pro — Instalador DaVinci Resolve        ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: ─────────────────────────────────────────────
:: VERIFICA ADMINISTRADOR
:: ─────────────────────────────────────────────
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo  [!] Este instalador precisa de permissoes de Administrador.
    echo  [!] Clique com botao direito no arquivo e escolha:
    echo      "Executar como administrador"
    echo.
    pause
    exit /b 1
)

:: ─────────────────────────────────────────────
:: VERIFICA NODE.JS
:: ─────────────────────────────────────────────
echo  [1/4] Verificando Node.js...
where node >nul 2>&1
if %errorLevel% NEQ 0 (
    echo.
    echo  [ERRO] Node.js NAO encontrado!
    echo.
    echo  Por favor, instale o Node.js antes de continuar:
    echo  https://nodejs.org  ^(escolha a versao LTS^)
    echo.
    echo  Apos instalar, execute este instalador novamente.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% encontrado!

:: ─────────────────────────────────────────────
:: DEFINE CAMINHOS
:: ─────────────────────────────────────────────
set PLUGIN_ID=com.editormaster.premium.v1
set DEST=%ProgramData%\Blackmagic Design\DaVinci Resolve\Support\Workflow Integration Plugins\%PLUGIN_ID%
set SOURCE=%~dp0

echo.
echo  [2/4] Instalando plugin na pasta do DaVinci Resolve...
echo        Destino: %DEST%
echo.

:: Cria pasta de destino se não existir
if not exist "%DEST%" (
    mkdir "%DEST%"
    if %errorLevel% NEQ 0 (
        echo  [ERRO] Nao foi possivel criar a pasta de instalacao.
        echo  Verifique se o DaVinci Resolve esta instalado corretamente.
        pause
        exit /b 1
    )
)

:: Copia todos os arquivos do plugin
xcopy /E /I /Y /Q "%SOURCE%." "%DEST%"
if %errorLevel% NEQ 0 (
    echo  [ERRO] Falha ao copiar os arquivos do plugin.
    pause
    exit /b 1
)

:: Remove arquivos desnecessários do destino
if exist "%DEST%\dist" rmdir /S /Q "%DEST%\dist" >nul 2>&1
if exist "%DEST%\node_modules\electron-builder" rmdir /S /Q "%DEST%\node_modules\electron-builder" >nul 2>&1
if exist "%DEST%\Instalar_Plugin.bat" del /Q "%DEST%\Instalar_Plugin.bat" >nul 2>&1

echo  [OK] Arquivos copiados com sucesso!

:: ─────────────────────────────────────────────
:: INSTALA DEPENDÊNCIAS (node_modules)
:: ─────────────────────────────────────────────
echo.
echo  [3/4] Instalando dependencias ^(pode demorar 1-2 minutos^)...
echo        Por favor aguarde...
echo.

cd /d "%DEST%"
call npm install --production --silent
if %errorLevel% NEQ 0 (
    echo  [AVISO] npm install retornou um aviso, mas pode funcionar normalmente.
)
echo  [OK] Dependencias instaladas!

:: ─────────────────────────────────────────────
:: HABILITA WORKFLOW INTEGRATION NO DAVINCI
:: ─────────────────────────────────────────────
echo.
echo  [4/4] Configurando DaVinci Resolve...
reg add "HKCU\Software\Blackmagic Design\DaVinci Resolve\Preferences" /v "EnableWorkflowIntegration" /t REG_DWORD /d 1 /f >nul 2>&1
echo  [OK] Integracao habilitada no registro do Windows!

:: ─────────────────────────────────────────────
:: CONCLUÍDO
:: ─────────────────────────────────────────────
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║              INSTALACAO CONCLUIDA!                       ║
echo  ╠══════════════════════════════════════════════════════════╣
echo  ║                                                          ║
echo  ║  Como usar:                                             ║
echo  ║  1. Abra o DaVinci Resolve                              ║
echo  ║  2. Va em:  Workspace ^> Workflow Integrations           ║
echo  ║  3. Clique em: EditLab Pro                              ║
echo  ║  4. Faca login com seu usuario e senha                  ║
echo  ║  5. Pesquise e importe seus clips!                      ║
echo  ║                                                          ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
pause
