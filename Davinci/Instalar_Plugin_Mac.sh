#!/bin/bash
# ══════════════════════════════════════════════════════════
#   EditLab Pro — Instalador Automático DaVinci Resolve (macOS)
# ══════════════════════════════════════════════════════════

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║       EditLab Pro — Instalador DaVinci Resolve (Mac)     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ─────────────────────────────────────────────
# 1. VERIFICA AMBIENTE (NODE.JS)
# ─────────────────────────────────────────────
echo "[1/4] Verificando ambiente..."
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
# 2. LOCALIZA WorkflowIntegration.node DO DAVINCI
# ─────────────────────────────────────────────
echo ""
echo "[2/4] Localizando integracao do DaVinci Resolve..."
echo "      (Nota: Este plugin requer o DaVinci Resolve STUDIO)"

# Caminhos possíveis dentro do DaVinci instalado no Mac
DAVINCI_APP="/Applications/DaVinci Resolve/DaVinci Resolve.app"
NODE_PATHS=(
    "$DAVINCI_APP/Contents/Libraries/Fusion/Modules/Lua/WorkflowIntegration/WorkflowIntegration.node"
    "$DAVINCI_APP/Contents/Frameworks/WorkflowIntegration.node"
    "/Library/Application Support/Blackmagic Design/DaVinci Resolve/Developer/Workflow Integrations/Examples/SamplePlugin/WorkflowIntegration.node"
    "/Library/Application Support/Blackmagic Design/DaVinci Resolve/Developer/WorkflowIntegration/WorkflowIntegration.node"
)

FOUND_NODE=""
for p in "${NODE_PATHS[@]}"; do
    if [ -f "$p" ]; then
        FOUND_NODE="$p"
        break
    fi
done

# Fallback 1: Busca via mdfind (Spotlight - super rapido no Mac)
if [ -z "$FOUND_NODE" ]; then
    echo "      Buscando via Spotlight..."
    FOUND_NODE=$(mdfind -name WorkflowIntegration.node | head -1)
fi

# Fallback 2: Busca profunda na pasta de Aplicativos
if [ -z "$FOUND_NODE" ]; then
    echo "      Buscando na pasta de Aplicativos..."
    FOUND_NODE=$(find /Applications -name "WorkflowIntegration.node" 2>/dev/null | head -1)
fi

if [ -z "$FOUND_NODE" ]; then
    echo ""
    echo "[ERRO] WorkflowIntegration.node nao localizado!"
    echo "Os Plugins de Integracao exigem o DaVinci Resolve STUDIO (pago)."
    echo ""
    read -p "Pressione Enter para sair..."
    exit 1
fi
echo "[OK] Integracao localizada: $FOUND_NODE"

# ─────────────────────────────────────────────
# 3. DEFINE CAMINHOS E INSTALA PLUGIN
# ─────────────────────────────────────────────
PLUGIN_ID="com.editormaster.premium.v1"
DEST="$HOME/Library/Application Support/Blackmagic Design/DaVinci Resolve/Workflow Integration Plugins/$PLUGIN_ID"
SOURCE="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "[3/4] Instalando plugin no DaVinci Resolve..."
echo "      Destino: $DEST"

mkdir -p "$DEST"
if [ $? -ne 0 ]; then
    echo "[ERRO] Nao foi possivel criar a pasta de instalacao."
    read -p "Pressione Enter para sair..."
    exit 1
fi

# Copia arquivos do plugin (exceto lixo e instalador windows)
rsync -a \
    --exclude='node_modules/' \
    --exclude='*.bat' \
    --exclude='.DS_Store' \
    "$SOURCE/" "$DEST/"

# Instala a 'chave' de integracao para Mac
cp "$FOUND_NODE" "$DEST/WorkflowIntegration.node"

# Instala dependências silenciosamente
echo "      Instalando dependencias (aguarde)..."
cd "$DEST"
npm install --production --silent
echo "[OK] Plugin instalado!"

# ─────────────────────────────────────────────
# 4. PERMISSOES E SEGURANCA (GATEKEEPER)
# ─────────────────────────────────────────────
echo ""
echo "[4/4] Ajustando permissoes e seguranca..."
chmod +x "$DEST/WorkflowIntegration.node"
xattr -cr "$DEST/" 2>/dev/null
echo "[OK] Permissoes ajustadas!"

# ─────────────────────────────────────────────
# CONCORDÂNCIA E INSTRUÇÕES
# ─────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              INSTALACAO CONCLUIDA!                       ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  Como usar:                                             ║"
echo "║  1. Abra o DaVinci Resolve Studio                       ║"
echo "║  2. Va em:  Workspace > Workflow Integrations           ║"
echo "║  3. Clique em: EditLab Pro                              ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
read -p "Pressione Enter para fechar..."
