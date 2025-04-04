#!/bin/bash

# Usage: ./apply-configmap.sh [dev|prod]
# Example: ./apply-configmap.sh dev

ENV=${1:-dev}
NAMESPACE="conva-$ENV"

# Default values
if [ "$ENV" == "dev" ]; then
  DEFAULT_NODE_ENV="development"
  DEFAULT_LOG_LEVEL="debug"
  DEFAULT_API_URL="http://api-service.conva-dev.svc.cluster.local"
  DEFAULT_DATABASE_URL="postgres://user:password@postgres-service.conva-dev.svc.cluster.local:5432/conva_dev"
  DEFAULT_CACHE_HOST="redis-service.conva-dev.svc.cluster.local"
else
  DEFAULT_NODE_ENV="production"
  DEFAULT_LOG_LEVEL="info"
  DEFAULT_API_URL="http://api-service.conva-prod.svc.cluster.local"
  DEFAULT_DATABASE_URL="postgres://user:password@postgres-service.conva-prod.svc.cluster.local:5432/conva_prod"
  DEFAULT_CACHE_HOST="redis-service.conva-prod.svc.cluster.local"
fi

DEFAULT_CACHE_PORT="6379"

# Use environment variables if set, otherwise use defaults
NODE_ENV=${NODE_ENV:-$DEFAULT_NODE_ENV}
LOG_LEVEL=${LOG_LEVEL:-$DEFAULT_LOG_LEVEL}
API_URL=${API_URL:-$DEFAULT_API_URL}
DATABASE_URL=${DATABASE_URL:-$DEFAULT_DATABASE_URL}
CACHE_HOST=${CACHE_HOST:-$DEFAULT_CACHE_HOST}
CACHE_PORT=${CACHE_PORT:-$DEFAULT_CACHE_PORT}

# Apply ConfigMap using kubectl
kubectl create configmap conva-config \
  --namespace=$NAMESPACE \
  --from-literal=NODE_ENV=$NODE_ENV \
  --from-literal=LOG_LEVEL=$LOG_LEVEL \
  --from-literal=API_URL=$API_URL \
  --from-literal=DATABASE_URL=$DATABASE_URL \
  --from-literal=CACHE_HOST=$CACHE_HOST \
  --from-literal=CACHE_PORT=$CACHE_PORT \
  --dry-run=client -o yaml | kubectl apply -f -

echo "ConfigMap applied to $NAMESPACE namespace with values:"
echo "NODE_ENV: $NODE_ENV"
echo "LOG_LEVEL: $LOG_LEVEL"
echo "API_URL: $API_URL"
echo "DATABASE_URL: $DATABASE_URL"
echo "CACHE_HOST: $CACHE_HOST"
echo "CACHE_PORT: $CACHE_PORT"
