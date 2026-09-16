# Knowledge Navigator
#
# Every target here is a thin wrapper around a script or an npm script, so
# there is one definition of each job rather than two that can drift.

SHELL := /usr/bin/env bash

.PHONY: help install check smoke security-review test browser-test validate compile up down logs clean

help: ## Show the available targets
	@grep -hE '^[a-z-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[1m%-14s\033[0m %s\n", $$1, $$2}'

install: ## Install workspace dependencies from the lockfile
	npm ci

check: ## Run every static check, test and build (stops at the first failure)
	./scripts/check.sh

smoke: ## Start the Docker stack, exercise it, and clean up
	./scripts/smoke.sh

security-review: ## Audit the built images and the configuration for privacy and security
	./scripts/security-review.sh

test: ## Run the unit tests
	npm test

browser-test: ## Run the Playwright acceptance journeys
	npm run test:browser

validate: ## Validate canonical content
	npm run validate

compile: ## Compile the index, graph and sidebar from canonical Markdown
	npm run compile

up: ## Start the containerized stack (host Ollama)
	docker compose up --build -d

down: ## Stop the stack, keeping knowledge and model data
	docker compose down

logs: ## Follow the stack's logs
	docker compose logs -f

clean: ## Remove build output and the local compiled index
	rm -rf apps/web/build apps/web/.docusaurus packages/core/dist apps/api/dist \
	       coverage test-results playwright-report data/knowledge.db
