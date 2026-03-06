#!/bin/bash
# ══════════════════════════════════════════════════════════
#   EditLab Pro — Instalador para Adobe Premiere Pro (macOS)
# ══════════════════════════════════════════════════════════

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║    EditLab Pro — Instalador Adobe Premiere Pro (Mac)     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

PLUGIN_ID="com.editormaster.premium.v1"
SOURCE="$(cd "$(dirname "$0")/$PLUGIN_ID" && pwd)"
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/$PLUGIN_ID"

# ─────────────────────────────────────────────
# VERIFICA SE A PASTA DO PLUGIN EXISTE
# ─────────────────────────────────────────────
echo "[1/4] Verificando arquivos do plugin..."
if [ ! -d "$SOURCE" ]; then
    echo "[ERRO] Pasta do plugin nao encontrada: $SOURCE"
    echo "Certifique-se de que esta rodando o instalador da pasta correta."
    read -p "Pressione Enter para sair..."
    exit 1
fi
echo "[OK] Arquivos encontrados!"

# ─────────────────────────────────────────────
# CRIA PASTA DE DESTINO
# ─────────────────────────────────────────────
echo ""
echo "[2/4] Instalando plugin na pasta do Adobe CEP..."
echo "      Destino: $DEST"
mkdir -p "$DEST"
if [ $? -ne 0 ]; then
    echo "[ERRO] Nao foi possivel criar a pasta de instalacao."
    read -p "Pressione Enter para sair..."
    exit 1
fi

# Copia todos os arquivos do plugin
rsync -a "$SOURCE/" "$DEST/"
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao copiar os arquivos."
    read -p "Pressione Enter para sair..."
    exit 1
fi
echo "[OK] Arquivos copiados!"

# ─────────────────────────────────────────────
# HABILITA EXTENSÕES NÃO ASSINADAS NO PREMIERE
# (necessário para extensions sem assinatura digital da Adobe)
# ─────────────────────────────────────────────
echo ""
echo "[3/4] Habilitando extensoes de terceiros no Adobe CEP..."

PLIST="$HOME/Library/Preferences/com.adobe.CSXS.11.plist"
PLIST10="$HOME/Library/Preferences/com.adobe.CSXS.10.plist"
PLIST9="$HOME/Library/Preferences/com.adobe.CSXS.9.plist"

for p in "$PLIST" "$PLIST10" "$PLIST9"; do
    defaults write "$p" PlayerDebugMode 1 2>/dev/null
done

echo "[OK] Extensoes de terceiros habilitadas!"

# ─────────────────────────────────────────────
# REMOVE QUARENTENA DO GATEKEEPER
# ─────────────────────────────────────────────
echo ""
echo "[4/4] Ajustando permissoes (Gatekeeper)..."
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
echo "║  1. Abra o Adobe Premiere Pro                           ║"
echo "║  2. Va em: Window > Extensions > EditLab Pro            ║"
echo "║  3. Faca login com seu usuario e senha                  ║"
echo "║  4. Pesquise e importe seus clips!                      ║"
echo "║                                                          ║"
echo "║  IMPORTANTE: Reinicie o Premiere se ja estiver aberto!  ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
read -p "Pressione Enter para fechar..."
