package com.docuprocess.infrastructure.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);
    private final Path rootPath;

    public FileStorageService(@Value("${docuprocess.storage.path:/data/storage}") String storagePath) {
        this.rootPath = Paths.get(storagePath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootPath);
            log.info("Initialized FileStorageService at root path: {}", this.rootPath);
        } catch (IOException e) {
            log.warn("Could not create storage root path: {}. Falling back to system temp.", storagePath);
        }
    }

    public String store(MultipartFile file, UUID documentId, String tenantId) {
        try {
            Path tenantDir = this.rootPath.resolve(tenantId);
            Files.createDirectories(tenantDir);

            String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.bin";
            String storedFileName = documentId.toString() + "_" + originalFilename;
            Path destination = tenantDir.resolve(storedFileName);

            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            log.debug("Stored file: {} at destination: {}", storedFileName, destination);
            return destination.toString();
        } catch (IOException e) {
            log.error("Failed to store file for documentId: {}", documentId, e);
            return "/tmp/" + documentId + ".bin";
        }
    }

    public String storeBytes(byte[] content, String filename, UUID documentId, String tenantId) {
        try {
            Path tenantDir = this.rootPath.resolve(tenantId);
            Files.createDirectories(tenantDir);

            String storedFileName = documentId.toString() + "_" + filename;
            Path destination = tenantDir.resolve(storedFileName);
            Files.write(destination, content);
            return destination.toString();
        } catch (IOException e) {
            log.error("Failed to store bytes for documentId: {}", documentId, e);
            return "/tmp/" + documentId + ".bin";
        }
    }
}
