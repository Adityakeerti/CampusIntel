# FUTURE_ARCHITECTURE.md

Purpose
- Describe planned/optional architecture upgrades and production hardening steps. This file is intentionally separate from the current-architecture documentation and only describes proposals for future work.

Sections
- Deployment & orchestration
- Caching and performance
- Secrets and config management
- Observability and SLOs
- AI infrastructure upgrades

1) Deployment & orchestration
- Move from local scripts to containerized deployment using Docker images per service.
- Define Kubernetes manifests and Helm charts to deploy services into a cluster (EKS/GKE/AKS). Each service becomes a deployment + service; use HorizontalPodAutoscaler for CPU-based autoscaling.
- Add an API Gateway (Ingress) for TLS termination and routing to services.

2) Caching and performance
- Introduce Redis caching for frequently-read endpoints (student profile, subject lists). Use Spring Cache abstraction in Java services.
- Add object storage (S3) for static assets and large file artifacts (marksheet images) and configure application to store `image_url` pointing to S3.

3) Secrets and configuration
- Replace file-based secrets with HashiCorp Vault or cloud KMS. Use dynamic DB credentials where possible.
- Move environment-specific configuration to a centralized config store and use immutable container images.

4) Observability
- Add centralized logging (ELK or Grafana Loki), structured JSON logs.
- Add distributed tracing (OpenTelemetry) and export traces to Jaeger.
- Add metrics (Prometheus + Grafana) and define SLOs for critical endpoints (OCR latency, chat response time).

5) AI infrastructure
- Evaluate local LLM hosting (quantized Llama-family) for data privacy and reduced cost; add GPU-backed inference endpoints.
- Standardize embeddings and vector DB strategy (choose a single managed or self-hosted vector store for production).

6) Security
- Harden API endpoints behind an API Gateway with rate limiting and WAF rules.
- Implement least-privilege IAM roles for service access to DB and object storage.

This file is intentionally descriptive and prescriptive; implementation tasks belong to a separate roadmap/issue tracker.
