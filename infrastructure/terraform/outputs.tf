# ── EKS Cluster Outputs ────────────────────────────────────────────────
output "cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "Endpoint for the EKS cluster API server"
  value       = module.eks.cluster_endpoint
}

output "cluster_arn" {
  description = "ARN of the EKS cluster"
  value       = module.eks.cluster_arn
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

# ── Networking Outputs ─────────────────────────────────────────────────
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnets
}

# ── Database Outputs ──────────────────────────────────────────────────
output "rds_endpoint" {
  description = "Endpoint of the RDS PostgreSQL instance"
  value       = module.rds.db_instance_endpoint
}

output "rds_port" {
  description = "Port of the RDS PostgreSQL instance"
  value       = module.rds.db_instance_port
}

output "rds_database_name" {
  description = "Name of the RDS database"
  value       = module.rds.db_instance_name
}

# ── Redis Outputs ──────────────────────────────────────────────────────
output "redis_endpoint" {
  description = "Endpoint of the ElastiCache Redis cluster"
  value       = module.elasticache.cluster_cache_nodes[0].address
}

output "redis_port" {
  description = "Port of the ElastiCache Redis cluster"
  value       = 6379
}

# ── ECR Outputs ────────────────────────────────────────────────────────
output "ecr_backend_repository_url" {
  description = "URL of the backend ECR repository"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_repository_url" {
  description = "URL of the frontend ECR repository"
  value       = aws_ecr_repository.frontend.repository_url
}

output "ecr_ai_engine_repository_url" {
  description = "URL of the AI engine ECR repository"
  value       = aws_ecr_repository.ai_engine.repository_url
}

# ── S3 Outputs ─────────────────────────────────────────────────────────
output "uploads_bucket_name" {
  description = "Name of the S3 uploads bucket"
  value       = aws_s3_bucket.uploads.bucket
}

output "uploads_bucket_arn" {
  description = "ARN of the S3 uploads bucket"
  value       = aws_s3_bucket.uploads.arn
}
