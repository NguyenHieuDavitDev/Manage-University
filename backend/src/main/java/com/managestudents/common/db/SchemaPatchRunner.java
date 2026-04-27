package com.managestudents.common.db;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Vá schema an toàn cho môi trường đã có dữ liệu cũ.
 * Tránh lỗi runtime khi entity mới thêm cột nhưng DB chưa kịp đồng bộ.
 */
@Component
public class SchemaPatchRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public SchemaPatchRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        ensureCourseClassesGradebookFinalizedColumn();
        ensureGradeComponentsWeightPercentColumn();
        ensureGradeScalesTable();
        ensureStudentGradesTable();
        ensureExamsTable();
    }

    private void ensureCourseClassesGradebookFinalizedColumn() {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'course_classes'
                  AND COLUMN_NAME = 'gradebook_finalized'
                """,
                Integer.class);
        if (count != null && count > 0) {
            return;
        }
        jdbcTemplate.execute("""
                ALTER TABLE course_classes
                ADD gradebook_finalized BIT NOT NULL
                    CONSTRAINT DF_course_classes_gradebook_finalized DEFAULT 0
                """);
    }

    private void ensureGradeComponentsWeightPercentColumn() {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'grade_components'
                  AND COLUMN_NAME = 'weight_percent'
                """,
                Integer.class);
        if (count != null && count > 0) {
            return;
        }
        jdbcTemplate.execute("""
                ALTER TABLE grade_components
                ADD weight_percent INT NULL
                """);
    }

    private void ensureGradeScalesTable() {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_NAME = 'grade_scales'
                """,
                Integer.class);
        if (count != null && count > 0) {
            return;
        }
        jdbcTemplate.execute("""
                CREATE TABLE grade_scales (
                    id BIGINT IDENTITY(1,1) PRIMARY KEY,
                    letter_grade NVARCHAR(8) NOT NULL UNIQUE,
                    min_score DECIMAL(5,2) NOT NULL,
                    max_score DECIMAL(5,2) NOT NULL,
                    description NVARCHAR(255) NULL,
                    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
                )
                """);
    }

    private void ensureStudentGradesTable() {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_NAME = 'student_grades'
                """,
                Integer.class);
        if (count != null && count > 0) {
            return;
        }
        jdbcTemplate.execute("""
                CREATE TABLE student_grades (
                    id BIGINT IDENTITY(1,1) PRIMARY KEY,
                    enrollment_id BIGINT NOT NULL,
                    grade_component_id BIGINT NOT NULL,
                    score DECIMAL(5,2) NOT NULL,
                    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                    CONSTRAINT uk_student_grades_enrollment_component UNIQUE (enrollment_id, grade_component_id),
                    CONSTRAINT fk_student_grades_enrollment FOREIGN KEY (enrollment_id) REFERENCES course_class_enrollments(id),
                    CONSTRAINT fk_student_grades_component FOREIGN KEY (grade_component_id) REFERENCES grade_components(id)
                )
                """);
    }

    private void ensureExamsTable() {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_NAME = 'exams'
                """,
                Integer.class);
        if (count != null && count > 0) return;
        jdbcTemplate.execute("""
                CREATE TABLE exams (
                    id BIGINT IDENTITY(1,1) PRIMARY KEY,
                    course_class_id BIGINT NOT NULL,
                    exam_type_id BIGINT NOT NULL,
                    classroom_id BIGINT NOT NULL,
                    exam_date DATE NOT NULL,
                    start_period INT NOT NULL,
                    end_period INT NOT NULL,
                    description NVARCHAR(500) NULL,
                    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                    CONSTRAINT fk_exams_course_class FOREIGN KEY (course_class_id) REFERENCES course_classes(id),
                    CONSTRAINT fk_exams_exam_type FOREIGN KEY (exam_type_id) REFERENCES exam_types(id),
                    CONSTRAINT fk_exams_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
                )
                """);
    }
}
