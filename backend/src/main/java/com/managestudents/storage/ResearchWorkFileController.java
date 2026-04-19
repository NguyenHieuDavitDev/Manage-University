package com.managestudents.storage;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/files/research-works")
public class ResearchWorkFileController {

    private final ResearchWorkDocumentStorageService researchWorkDocumentStorageService;

    public ResearchWorkFileController(ResearchWorkDocumentStorageService researchWorkDocumentStorageService) {
        this.researchWorkDocumentStorageService = researchWorkDocumentStorageService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file)
            throws IOException {
        String url = researchWorkDocumentStorageService.store(file);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> download(@PathVariable("fileName") String fileName) throws IOException {
        Resource resource = researchWorkDocumentStorageService.loadAsResource(fileName);
        Path path = researchWorkDocumentStorageService.getRoot().resolve(fileName).normalize();
        String probe = Files.probeContentType(path);
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (probe != null && !probe.isBlank()) {
            try {
                mediaType = MediaType.parseMediaType(probe);
            } catch (IllegalArgumentException ignored) {
                mediaType = MediaType.APPLICATION_OCTET_STREAM;
            }
        }
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .contentType(mediaType)
                .body(resource);
    }
}
