# API Guidelines

REST First

Realtime where necessary.

## Naming

/api/v1/users

/api/v1/auth

/api/v1/voice

/api/v1/agents

/api/v1/memory

/api/v1/chat

## Responses

Always

status

message

data

errors

meta

## Authentication

Bearer JWT

Refresh Token

## Validation

Zod (schema validation on every boundary)

Never trust client input.

## Versioning

Always version APIs.

Never break old APIs.
