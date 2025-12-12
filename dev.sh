#!/bin/bash
# Development script that sets required environment variables
# and starts the dev environment for grafana-llm-app
#
# This ensures Go 1.25.1+ is used via GOTOOLCHAIN feature

export GOTOOLCHAIN=auto
export GOSUMDB=sum.golang.org

echo "🚀 Starting grafana-llm-app development environment..."
echo "📦 GOTOOLCHAIN=$GOTOOLCHAIN"
echo "🔐 GOSUMDB=$GOSUMDB"
echo ""

npm run dev
