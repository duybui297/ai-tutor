#!/bin/bash
# Bấm đúp để chạy Gia sư Bông trên máy (http://localhost:8765)
cd "$(dirname "$0")" || exit 1
PORT=8765
echo "🐰 Gia sư Bông đang chạy tại http://localhost:$PORT"
echo "   Đóng cửa sổ này để tắt."
(sleep 1.5; open "http://localhost:$PORT") &
python3 -m http.server "$PORT" --bind 127.0.0.1
