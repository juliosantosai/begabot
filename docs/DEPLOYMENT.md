# Deployment Guide

Este documento describe cómo desplegar BegaBot 3.0 usando `docker compose` y consideraciones para producción.

Requisitos mínimos:
- Docker Engine
- Docker Compose
- Acceso a un host Linux con puertos libres 3001-3008, 5432, 6379

Despliegue básico (single-host):

1. Copiar `.env` con variables sensibles (no subir al repo). Ejemplo en `docs/ENVIRONMENT.md`.
2. Construir y levantar:

```bash
docker compose up -d --build
```

3. Verificar servicios:

```bash
docker compose ps
docker compose logs -f gateway-service
```

Consideraciones de producción:
- Ejecutar bases de datos administradas (RDS, Cloud SQL) y apuntar `DATABASE_URL` en vez de usar contenedores Postgres para datos críticos.
- Usar una instancia Redis gestionada o cluster para persistencia temporal.
- Configurar secretos en un gestor (Vault, AWS Secrets Manager) y pasar variables de entorno al contenedor.
- Habilitar monitoreo (Prometheus / Grafana) y logs centralizados (ELK / Loki).
- Ejecutar replicas de `ai-agent-service` y `dispatcher-service` detrás de un load balancer si el tráfico crece.

Rollback:

- `docker compose down` y restaurar backup si necesario. Mantener backups regulares de PostgreSQL.
