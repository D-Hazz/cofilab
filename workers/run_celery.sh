#!/bin/bash
source ../.venv/bin/activate
celery -A cofilab worker --loglevel=info -Q default
