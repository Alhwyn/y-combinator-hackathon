#!/bin/bash

# Quick script to test Wordle with 2 agents

echo "🎮 Starting 2 AI Agents to Play Wordle"
echo "======================================="
echo ""

node run-custom-test.js \
  -p "Play Wordle and try to win the game by guessing the correct 5-letter word" \
  -u "https://www.nytimes.com/games/wordle" \
  -n 2 \
  --stream

# This will:
# - Spawn 2 AI agents
# - Navigate to Wordle
# - Analyze the game board
# - Make intelligent guesses
# - Try to win the game
# 
# Watch live at: https://replication.ngrok.io/dashboard/

