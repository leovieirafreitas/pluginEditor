#!/bin/bash
# ══════════════════════════════════════════════════════════
#   EditLab Pro — Instalador para DaVinci Resolve (macOS)
# ══════════════════════════════════════════════════════════

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║       EditLab Pro — Instalador DaVinci Resolve (Mac)     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ─────────────────────────────────────────────
# VERIFICA NODE.JS
# ─────────────────────────────────────────────
echo "[1/5] Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo ""
    echo "[ERRO] Node.js NAO encontrado!"
    echo "Instale em: https://nodejs.org  (botao LTS)"
    echo ""
    read -p "Pressione Enter para sair..."
    exit 1
fi
NODE_VER=$(node -v)
echo "[OK] Node.js $NODE_VER encontrado!"

# ─────────────────────────────────────────────
# VERIFICA E COPIA WorkflowIntegration.node DO DAVINCI
# ─────────────────────────────────────────────
echo ""
echo "[2/5] Localizando WorkflowIntegration.node do DaVinci Resolve..."

DAVINCI_APP="/Applications/DaVinci Resolve/DaVinci Resolve.app"

# Caminhos possíveis dentro do DaVinci instalado no Mac
NODE_PATHS=(
    "$DAVINCI_APP/Contents/Libraries/Fusion/Modules/Lua/WorkflowIntegration/WorkflowIntegration.node"
    "$DAVINCI_APP/Contents/Frameworks/WorkflowIntegration.node"
    "$DAVINCI_APP/Contents/MacOS/WorkflowIntegration.node"
    "/Library/Application Support/Blackmagic Design/DaVinci Resolve/Developer/WorkflowIntegration/WorkflowIntegration.node"
)

FOUND_NODE=""
for p in "${NODE_PATHS[@]}"; do
    if [ -f "$p" ]; then
        FOUND_NODE="$p"
        break
    fi
done

if [ -z "$FOUND_NODE" ]; then
    # Buscar recursivamente como fallback
    FOUND_NODE=$(find "$DAVINCI_APP" -name "WorkflowIntegration.node" 2>/dev/null | head -1)
fi

if [ -z "$FOUND_NODE" ]; then
    echo ""
    echo "[ERRO] DaVinci Resolve nao encontrado ou WorkflowIntegration.node nao localizado."
    echo "Certifique-se de que o DaVinci Resolve esta instalado em /Applications/"
    echo ""
    read -p "Pressione Enter para sair..."
    exit 1
fi
echo "[OK] Encontrado: $FOUND_NODE"

# ─────────────────────────────────────────────
# DEFINE CAMINHOS E COPIA PLUGIN
# ─────────────────────────────────────────────
PLUGIN_ID="com.editormaster.premium.v1"
DEST="$HOME/Library/Application Support/Blackmagic Design/DaVinci Resolve/Workflow Integration Plugins/$PLUGIN_ID"
SOURCE="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "[3/5] Instalando plugin na pasta do DaVinci Resolve..."
echo "      Destino: $DEST"

mkdir -p "$DEST"
if [ $? -ne 0 ]; then
    echo "[ERRO] Nao foi possivel criar a pasta de instalacao."
    read -p "Pressione Enter para sair..."
    exit 1
fi

# Copia arquivos do plugin (exceto dist, node_modules e o bat do Windows)
rsync -a \
    --exclude='dist/' \
    --exclude='node_modules/' \
    --exclude='Instalar_Plugin.bat' \
    --exclude='installer.nsh' \
    --exclude='package-lock.json' \
    "$SOURCE/" "$DEST/"

# Substitui o WorkflowIntegration.node pela versão Mac do DaVinci instalado
echo "      Copiando WorkflowIntegration.node para Mac..."
cp "$FOUND_NODE" "$DEST/WorkflowIntegration.node"

echo "[OK] Arquivos copiados!"

# ─────────────────────────────────────────────
# INSTALA PRESETS DE LEGENDAS VIRAIS
# ─────────────────────────────────────────────
PRESET_DEST="$HOME/Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Templates/Edit/Titles/EditLab Pro"
mkdir -p "$PRESET_DEST"
if ls "$SOURCE/Legendas/CaptionsVirais/"*.setting 1> /dev/null 2>&1; then
    echo ""
    echo "[-] Instalando presets de legendas virais (Titles)..."
    cp "$SOURCE/Legendas/CaptionsVirais/"*.setting "$PRESET_DEST/"
fi

# ─────────────────────────────────────────────
# INSTALA DEPENDÊNCIAS
# ─────────────────────────────────────────────
echo ""
echo "[4/5] Instalando dependencias (aguarde 1-2 minutos)..."
cd "$DEST"
npm install --production --silent
echo "[OK] Dependencias instaladas!"

# ─────────────────────────────────────────────
# PERMISSÕES E REMOÇÃO DE QUARENTENA
# ─────────────────────────────────────────────
echo ""
echo "[5/5] Ajustando permissoes (Gatekeeper)..."
chmod +x "$DEST/WorkflowIntegration.node"
xattr -cr "$DEST/" 2>/dev/null
echo "[OK] Permissoes ajustadas!"

# ─────────────────────────────────────────────
# CONCLUÍDO
# ─────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              INSTALACAO CONCLUIDA!                       ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  Como usar:                                             ║"
echo "║  1. Abra o DaVinci Resolve                              ║"
echo "║  2. Va em:  Workspace > Workflow Integrations           ║"
echo "║  3. Clique em: EditLab Pro                              ║"
echo "║  4. Faca login com seu usuario e senha                  ║"
echo "║  5. Pesquise e importe seus clips!                      ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
read -p "Pressione Enter para fechar..."
