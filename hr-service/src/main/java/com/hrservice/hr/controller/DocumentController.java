package com.hrservice.hr.controller;

import com.hrservice.hr.entity.Document;
import com.hrservice.hr.entity.Employee;
import com.hrservice.hr.repository.DocumentRepository;
import com.hrservice.hr.repository.EmployeeRepository;
import com.hrservice.hr.util.SecurityValidator;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/documents")
public class DocumentController {

    private static final long MAX_FILE_BYTES = 20L * 1024 * 1024; // 20 MB

    private static final List<String> ALLOWED_TYPES = List.of(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  // .docx
        "application/msword",                                                          // .doc
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",         // .xlsx
        "application/vnd.ms-excel",                                                   // .xls
        "application/pdf"
    );

    private final DocumentRepository documentRepository;
    private final EmployeeRepository employeeRepository;
    private final SecurityValidator securityValidator;

    public DocumentController(DocumentRepository documentRepository,
                               EmployeeRepository employeeRepository,
                               SecurityValidator securityValidator) {
        this.documentRepository = documentRepository;
        this.employeeRepository = employeeRepository;
        this.securityValidator = securityValidator;
    }

    /** List all documents for the current user's department */
    @GetMapping
    public List<DocumentMeta> listMyDepartment(HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);
        Employee employee = resolveEmployee(request);

        if (employee.getDepartment() == null) {
            return List.of();
        }

        return documentRepository
            .findByDepartmentIdOrderByCreatedAtDesc(employee.getDepartment().getId())
            .stream()
            .map(this::toMeta)
            .toList();
    }

    /** Upload a file — saved to the uploader's department */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public DocumentMeta upload(@RequestParam("file") MultipartFile file,
                               HttpServletRequest request) throws IOException {
        securityValidator.enforceGatewayAccess(request);
        Employee employee = resolveEmployee(request);

        if (employee.getDepartment() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Bạn chưa được gán vào phòng ban nào.");
        }

        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File không được rỗng.");
        }

        if (file.getSize() > MAX_FILE_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                "File vượt quá giới hạn 20 MB.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "Chỉ chấp nhận file Word (.doc/.docx), Excel (.xls/.xlsx) hoặc PDF.");
        }

        Document doc = new Document();
        doc.setFileName(file.getOriginalFilename());
        doc.setFileType(contentType);
        doc.setFileSize(file.getSize());
        doc.setDepartmentId(employee.getDepartment().getId());
        doc.setUploadedBy(employee.getUsername() != null ? employee.getUsername() : employee.getName());
        doc.setCreatedAt(LocalDateTime.now());
        doc.setFileData(file.getBytes());

        return toMeta(documentRepository.save(doc));
    }

    /** Download a file by id */
    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(@PathVariable Long id,
                                            HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);
        Employee employee = resolveEmployee(request);

        Document doc = documentRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tài liệu không tồn tại."));

        // Only members of the same department (or admin) may download
        if (!isAdminRole(request) &&
            (employee.getDepartment() == null ||
             !employee.getDepartment().getId().equals(doc.getDepartmentId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Bạn không có quyền tải tài liệu này.");
        }

        String disposition = "attachment; filename=\"" + doc.getFileName() + "\"";
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
            .contentType(MediaType.parseMediaType(
                doc.getFileType() != null ? doc.getFileType() : MediaType.APPLICATION_OCTET_STREAM_VALUE))
            .contentLength(doc.getFileSize() != null ? doc.getFileSize() : doc.getFileData().length)
            .body(doc.getFileData());
    }

    /** Delete a document — only the uploader or an admin */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id, HttpServletRequest request) {
        securityValidator.enforceGatewayAccess(request);
        Employee employee = resolveEmployee(request);

        Document doc = documentRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tài liệu không tồn tại."));

        String currentUser = employee.getUsername() != null ? employee.getUsername() : employee.getName();
        boolean isOwner = currentUser != null && currentUser.equals(doc.getUploadedBy());

        if (!isOwner && !isAdminRole(request)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Chỉ người upload hoặc admin mới có thể xóa.");
        }

        documentRepository.deleteById(id);
    }

    // ── helpers ──────────────────────────────────────────────

    private Employee resolveEmployee(HttpServletRequest request) {
        String username = request.getHeader("X-Auth-User");
        if (username == null || username.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Không xác định được người dùng.");
        }
        return employeeRepository.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Không tìm thấy nhân viên với tài khoản: " + username));
    }

    private boolean isAdminRole(HttpServletRequest request) {
        String role = request.getHeader("X-Auth-Role");
        String roles = request.getHeader("X-Auth-Roles");
        if (role != null && (role.equalsIgnoreCase("ADMIN") || role.equalsIgnoreCase("ROLE_ADMIN"))) {
            return true;
        }
        if (roles != null) {
            for (String r : roles.split("[,;\\s]+")) {
                if (r.trim().equalsIgnoreCase("ADMIN") || r.trim().equalsIgnoreCase("ROLE_ADMIN")) {
                    return true;
                }
            }
        }
        return false;
    }

    private DocumentMeta toMeta(Document doc) {
        return new DocumentMeta(
            doc.getId(),
            doc.getFileName(),
            doc.getFileType(),
            doc.getFileSize(),
            doc.getDepartmentId(),
            doc.getUploadedBy(),
            doc.getCreatedAt()
        );
    }

    public record DocumentMeta(
        Long id,
        String fileName,
        String fileType,
        Long fileSize,
        Long departmentId,
        String uploadedBy,
        LocalDateTime createdAt
    ) {}
}
