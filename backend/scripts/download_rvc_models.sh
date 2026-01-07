# backend/scripts/download_rvc_models.sh
#!/bin/bash

set -e

echo "Downloading RVC pretrained models..."

ASSETS_DIR="assets"
mkdir -p $ASSETS_DIR/hubert
mkdir -p $ASSETS_DIR/pretrained_v2

# Download HuBERT base model (~190MB)
echo "Downloading HuBERT base model..."
wget -O $ASSETS_DIR/hubert/hubert_base.pt \
  https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/hubert_base.pt

# Download pretrained v2 models
echo "Downloading pretrained v2 models..."
wget -O $ASSETS_DIR/pretrained_v2/f0G40k.pth \
  https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/pretrained_v2/f0G40k.pth
  
wget -O $ASSETS_DIR/pretrained_v2/f0D40k.pth \
  https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/pretrained_v2/f0D40k.pth

wget -O $ASSETS_DIR/pretrained_v2/f0G48k.pth \
  https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/pretrained_v2/f0G48k.pth
  
wget -O $ASSETS_DIR/pretrained_v2/f0D48k.pth \
  https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/pretrained_v2/f0D48k.pth

# Download RMVPE pitch extractor (~180MB)
echo "Downloading RMVPE model..."
wget -O $ASSETS_DIR/rmvpe.pt \
  https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/rmvpe.pt

echo "All models downloaded successfully!"