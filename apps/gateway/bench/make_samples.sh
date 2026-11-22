#!/usr/bin/env bash
# Synthetic, consent-free test speech using macOS voices (no real people's audio).
# Output: bench/samples/*.wav as 16 kHz mono PCM16 (git-ignored).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p samples
make() { # voice name text
  say -v "$1" -o "samples/$2.aiff" "$3"
  afconvert -f WAVE -d LEI16@16000 -c 1 "samples/$2.aiff" "samples/$2.wav"
  rm "samples/$2.aiff"
}
make Yelda tr-01 "Merhaba, toplantıyı gelecek salı saat üçe alabilir miyiz?"
make Yelda tr-02 "Siparişin teslim tarihi on beş Mart, fiyat ise kilogram başına dört dolar değil, üç buçuk dolar."
make Yelda tr-03 "Bu ürünü stokta tutmuyoruz ama iki hafta içinde getirebiliriz."
make Samantha en-01 "Could we move the meeting to next Tuesday at three?"
make Samantha en-02 "The delivery date is March fifteenth, and the price is not four dollars but three fifty per kilo."
make Samantha en-03 "We don't keep this item in stock, but we can bring it in within two weeks."
ls -1 samples
