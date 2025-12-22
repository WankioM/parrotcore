"""Storage abstraction for file uploads (MinIO/S3)."""
import logging
from pathlib import Path
from typing import Optional, BinaryIO
from dataclasses import dataclass
import os

import boto3
from botocore.exceptions import ClientError
from django.conf import settings

logger = logging.getLogger(__name__)


@dataclass
class StorageConfig:
    """Storage configuration."""
    backend: str  # "minio" or "s3"
    bucket: str
    endpoint: Optional[str] = None  # Required for MinIO
    access_key: Optional[str] = None
    secret_key: Optional[str] = None
    region: Optional[str] = None
    use_ssl: bool = True
    external_endpoint: Optional[str] = None


class StorageBackend:
    """
    Unified storage backend for MinIO (dev) and S3 (prod).
    
    Provides simple file operations:
    - upload_file(local_path, key) -> url
    - download_file(key, local_path)
    - delete_file(key)
    - get_presigned_url(key, expires)
    - file_exists(key)
    """
    
    def __init__(self, config: Optional[StorageConfig] = None):
        self.config = config or self._load_config()
        self.client = self._create_client()
        self._ensure_bucket()
    
    def _load_config(self) -> StorageConfig:
        """Load config from Django settings / environment."""
        backend = os.environ.get("STORAGE_BACKEND", "minio")
        
        if backend == "minio":
            return StorageConfig(
                backend="minio",
                bucket=os.environ.get("MINIO_BUCKET", "parrotcore"),
                endpoint=os.environ.get("MINIO_ENDPOINT", "localhost:9000"),
                access_key=os.environ.get("MINIO_ACCESS_KEY", "minioadmin"),
                secret_key=os.environ.get("MINIO_SECRET_KEY", "minioadmin"),
                use_ssl=False,  # MinIO dev uses HTTP
                external_endpoint=os.environ.get("MINIO_EXTERNAL_ENDPOINT", "localhost:9000"),
            )
        else:
            return StorageConfig(
                backend="s3",
                bucket=os.environ.get("AWS_STORAGE_BUCKET_NAME", "parrotcore"),
                access_key=os.environ.get("AWS_ACCESS_KEY_ID"),
                secret_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
                region=os.environ.get("AWS_S3_REGION_NAME", "us-east-1"),
                use_ssl=True,
            )
    
    def _create_client(self):
        """Create boto3 S3 client."""
        if self.config.backend == "minio":
            protocol = "https" if self.config.use_ssl else "http"
            endpoint_url = f"{protocol}://{self.config.endpoint}"
            
            return boto3.client(
                "s3",
                endpoint_url=endpoint_url,
                aws_access_key_id=self.config.access_key,
                aws_secret_access_key=self.config.secret_key,
                region_name="us-east-1",  # Required but ignored by MinIO
            )
        else:
            return boto3.client(
                "s3",
                aws_access_key_id=self.config.access_key,
                aws_secret_access_key=self.config.secret_key,
                region_name=self.config.region,
            )
    
    def _ensure_bucket(self) -> None:
        """Create bucket if it doesn't exist."""
        try:
            self.client.head_bucket(Bucket=self.config.bucket)
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code")
            if error_code == "404":
                logger.info(f"Creating bucket: {self.config.bucket}")
                try:
                    self.client.create_bucket(Bucket=self.config.bucket)
                except ClientError as create_error:
                    logger.warning(f"Could not create bucket: {create_error}")
            else:
                logger.warning(f"Could not check bucket: {e}")
    
    def upload_file(
        self,
        local_path: Path | str,
        key: str,
        content_type: Optional[str] = None,
    ) -> str:
        """
        Upload a file to storage.
        
        Args:
            local_path: Path to local file
            key: Storage key (path in bucket)
            content_type: Optional MIME type
            
        Returns:
            The storage key
        """
        local_path = Path(local_path)
        
        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type
        elif local_path.suffix.lower() in (".wav", ".wave"):
            extra_args["ContentType"] = "audio/wav"
        elif local_path.suffix.lower() == ".mp3":
            extra_args["ContentType"] = "audio/mpeg"
        elif local_path.suffix.lower() == ".pt":
            extra_args["ContentType"] = "application/octet-stream"
        
        self.client.upload_file(
            str(local_path),
            self.config.bucket,
            key,
            ExtraArgs=extra_args if extra_args else None,
        )
        
        logger.debug(f"Uploaded {local_path} to {key}")
        return key
    
    def upload_fileobj(
        self,
        file_obj: BinaryIO,
        key: str,
        content_type: Optional[str] = None,
    ) -> str:
        """
        Upload a file object to storage.
        
        Args:
            file_obj: File-like object
            key: Storage key
            content_type: Optional MIME type
            
        Returns:
            The storage key
        """
        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type
        
        self.client.upload_fileobj(
            file_obj,
            self.config.bucket,
            key,
            ExtraArgs=extra_args if extra_args else None,
        )
        
        logger.debug(f"Uploaded file object to {key}")
        return key
    
    def download_file(self, key: str, local_path: Path | str) -> Path:
        """
        Download a file from storage.
        
        Args:
            key: Storage key
            local_path: Where to save locally
            
        Returns:
            Path to downloaded file
        """
        local_path = Path(local_path)
        local_path.parent.mkdir(parents=True, exist_ok=True)
        
        self.client.download_file(
            self.config.bucket,
            key,
            str(local_path),
        )
        
        logger.debug(f"Downloaded {key} to {local_path}")
        return local_path
    
    def download_fileobj(self, key: str, file_obj: BinaryIO) -> None:
        """
        Download a file to a file object.
        
        Args:
            key: Storage key
            file_obj: File-like object to write to
        """
        self.client.download_fileobj(
            self.config.bucket,
            key,
            file_obj,
        )
    
    def delete_file(self, key: str) -> bool:
        """
        Delete a file from storage.
        
        Args:
            key: Storage key
            
        Returns:
            True if deleted, False if not found
        """
        try:
            self.client.delete_object(
                Bucket=self.config.bucket,
                Key=key,
            )
            logger.debug(f"Deleted {key}")
            return True
        except ClientError as e:
            logger.warning(f"Could not delete {key}: {e}")
            return False
    
    def delete_files(self, keys: list[str]) -> int:
        """
        Delete multiple files from storage.
        
        Args:
            keys: List of storage keys
            
        Returns:
            Number of files deleted
        """
        if not keys:
            return 0
        
        objects = [{"Key": key} for key in keys]
        
        try:
            response = self.client.delete_objects(
                Bucket=self.config.bucket,
                Delete={"Objects": objects},
            )
            deleted = len(response.get("Deleted", []))
            logger.debug(f"Deleted {deleted} files")
            return deleted
        except ClientError as e:
            logger.warning(f"Could not delete files: {e}")
            return 0
    
    def file_exists(self, key: str) -> bool:
        """
        Check if a file exists in storage.
        
        Args:
            key: Storage key
            
        Returns:
            True if exists
        """
        try:
            self.client.head_object(Bucket=self.config.bucket, Key=key)
            return True
        except ClientError:
            return False
    
    def get_file_size(self, key: str) -> Optional[int]:
        """
        Get the size of a file in bytes.
        
        Args:
            key: Storage key
            
        Returns:
            Size in bytes or None if not found
        """
        try:
            response = self.client.head_object(Bucket=self.config.bucket, Key=key)
            return response.get("ContentLength")
        except ClientError:
            return None
    
    def get_presigned_url(
        self,
        key: str,
        expires: int = 3600,
        method: str = "get_object",
    ) -> str:
        """
        Generate a presigned URL for temporary access.
        
        Args:
            key: Storage key
            expires: Expiration time in seconds (default 1 hour)
            method: "get_object" for download, "put_object" for upload
            
        Returns:
            Presigned URL
        """
        url = self.client.generate_presigned_url(
        ClientMethod=method,
        Params={
            "Bucket": self.config.bucket,
            "Key": key,
        },
        ExpiresIn=expires,
    )
        if self.config.backend == "minio" and self.config.external_endpoint:
            protocol = "https" if self.config.use_ssl else "http"
            internal_url = f"{protocol}://{self.config.endpoint}"
            external_url = f"{protocol}://{self.config.external_endpoint}"
            url = url.replace(internal_url, external_url)
        
        return url
    
    def get_presigned_upload_url(
        self,
        key: str,
        expires: int = 3600,
        content_type: Optional[str] = None,
    ) -> dict:
        """
        Generate a presigned URL for direct upload from client.
        
        Args:
            key: Storage key
            expires: Expiration time in seconds
            content_type: Expected content type
            
        Returns:
            Dict with url and fields for form upload
        """
        conditions = []
        fields = {}
        
        if content_type:
            conditions.append({"Content-Type": content_type})
            fields["Content-Type"] = content_type
        
        response = self.client.generate_presigned_post(
            Bucket=self.config.bucket,
            Key=key,
            Fields=fields,
            Conditions=conditions,
            ExpiresIn=expires,
        )
        return response
    
    def list_files(self, prefix: str = "", max_keys: int = 1000) -> list[str]:
        """
        List files in storage with a given prefix.
        
        Args:
            prefix: Key prefix to filter by
            max_keys: Maximum number of keys to return
            
        Returns:
            List of keys
        """
        try:
            response = self.client.list_objects_v2(
                Bucket=self.config.bucket,
                Prefix=prefix,
                MaxKeys=max_keys,
            )
            return [obj["Key"] for obj in response.get("Contents", [])]
        except ClientError as e:
            logger.warning(f"Could not list files: {e}")
            return []


# Global storage instance (lazy initialization)
_storage: Optional[StorageBackend] = None


def get_storage() -> StorageBackend:
    """Get the global storage instance."""
    global _storage
    if _storage is None:
        _storage = StorageBackend()
    return _storage


# Convenience access
class StorageProxy:
    """Proxy for lazy storage access."""
    
    def __getattr__(self, name):
        return getattr(get_storage(), name)


storage = StorageProxy()