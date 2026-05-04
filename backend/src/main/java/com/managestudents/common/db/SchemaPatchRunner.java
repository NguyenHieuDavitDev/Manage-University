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
        ensureTrainingProgramsTable();
        ensureTuitionRatesProgramColumns();
        ensureStudentTuitionsTable();
        ensureStudentTuitionPaymentsTable();
        ensureStudentTuitionInvoicesTable();
        ensureClassAttendanceTable();
        ensureClassAttendanceClassScheduleMigration();
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
        jdbcTemplate.execute(
                """
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
        if (count != null && count > 0)
            return;
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

    private void ensureStudentTuitionsTable() {
        Integer count = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_NAME = 'student_tuitions'
                        """,
                Integer.class);
        if (count != null && count > 0) {
            return;
        }
        jdbcTemplate.execute("""
                CREATE TABLE student_tuitions (
                    id BIGINT IDENTITY(1,1) PRIMARY KEY,
                    user_id UNIQUEIDENTIFIER NOT NULL,
                    tuition_rate_id BIGINT NULL,
                    academic_year NVARCHAR(20) NOT NULL,
                    semester INT NOT NULL,
                    total_credits INT NULL,
                    amount_due DECIMAL(18,2) NOT NULL,
                    amount_paid DECIMAL(18,2) NOT NULL CONSTRAINT DF_student_tuitions_amount_paid DEFAULT 0,
                    payment_status NVARCHAR(32) NOT NULL,
                    notes NVARCHAR(1000) NULL,
                    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                    CONSTRAINT uk_student_tuitions_user_year_semester UNIQUE (user_id, academic_year, semester),
                    CONSTRAINT fk_student_tuitions_user FOREIGN KEY (user_id) REFERENCES users(Id),
                    CONSTRAINT fk_student_tuitions_tuition_rate FOREIGN KEY (tuition_rate_id) REFERENCES tuition_rates(id)
                )
                """);
    }

    private void ensureTrainingProgramsTable() {
        Integer count = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_NAME = 'training_programs'
                        """,
                Integer.class);
        if (count != null && count > 0) {
            return;
        }
        jdbcTemplate.execute("""
                CREATE TABLE training_programs (
                    id BIGINT IDENTITY(1,1) PRIMARY KEY,
                    program_code NVARCHAR(64) NOT NULL UNIQUE,
                    program_name NVARCHAR(200) NOT NULL,
                    total_credits INT NOT NULL,
                    description NVARCHAR(500) NULL,
                    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
                )
                """);
    }

    private void ensureTuitionRatesProgramColumns() {
        Integer trainingProgramCol = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_NAME = 'tuition_rates'
                          AND COLUMN_NAME = 'training_program_id'
                        """,
                Integer.class);
        if (trainingProgramCol == null || trainingProgramCol == 0) {
            jdbcTemplate.execute("""
                    ALTER TABLE tuition_rates
                    ADD training_program_id BIGINT NULL
                    """);
        }

        Integer fkCount = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM sys.foreign_keys
                        WHERE name = 'fk_tuition_rates_training_program'
                        """,
                Integer.class);
        if (fkCount == null || fkCount == 0) {
            jdbcTemplate.execute("""
                    ALTER TABLE tuition_rates
                    ADD CONSTRAINT fk_tuition_rates_training_program
                    FOREIGN KEY (training_program_id) REFERENCES training_programs(id)
                    """);
        }
    }

    private void ensureStudentTuitionPaymentsTable() {
        Integer count = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_NAME = 'student_tuition_payments'
                        """,
                Integer.class);
        if (count != null && count > 0) {
            return;
        }
        jdbcTemplate.execute("""
                CREATE TABLE student_tuition_payments (
                    id BIGINT IDENTITY(1,1) PRIMARY KEY,
                    student_tuition_id BIGINT NOT NULL,
                    amount DECIMAL(18,2) NOT NULL,
                    status NVARCHAR(20) NOT NULL,
                    provider NVARCHAR(32) NOT NULL,
                    momo_order_id NVARCHAR(100) NULL UNIQUE,
                    momo_request_id NVARCHAR(100) NULL,
                    momo_trans_id NVARCHAR(100) NULL,
                    pay_url NVARCHAR(1000) NULL,
                    deeplink NVARCHAR(1000) NULL,
                    qr_code_url NVARCHAR(1000) NULL,
                    raw_response NVARCHAR(MAX) NULL,
                    raw_ipn NVARCHAR(MAX) NULL,
                    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                    CONSTRAINT fk_student_tuition_payments_tuition
                        FOREIGN KEY (student_tuition_id) REFERENCES student_tuitions(id)
                )
                """);
    }

    private void ensureStudentTuitionInvoicesTable() {
        Integer count = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_NAME = 'student_tuition_invoices'
                        """,
                Integer.class);
        if (count != null && count > 0) {
            return;
        }
        jdbcTemplate.execute("""
                CREATE TABLE student_tuition_invoices (
                    id BIGINT IDENTITY(1,1) PRIMARY KEY,
                    payment_id BIGINT NOT NULL UNIQUE,
                    invoice_no NVARCHAR(64) NOT NULL UNIQUE,
                    invoice_symbol NVARCHAR(32) NOT NULL,
                    seller_name NVARCHAR(255) NOT NULL,
                    seller_tax_code NVARCHAR(64) NOT NULL,
                    seller_address NVARCHAR(500) NOT NULL,
                    buyer_name NVARCHAR(255) NOT NULL,
                    description NVARCHAR(500) NOT NULL,
                    amount_before_tax DECIMAL(18,2) NOT NULL,
                    vat_rate DECIMAL(5,4) NOT NULL,
                    vat_amount DECIMAL(18,2) NOT NULL,
                    total_amount DECIMAL(18,2) NOT NULL,
                    status NVARCHAR(20) NOT NULL,
                    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                    CONSTRAINT fk_student_tuition_invoices_payment
                        FOREIGN KEY (payment_id) REFERENCES student_tuition_payments(id)
                )
                """);
    }

    private void ensureClassAttendanceTable() {
        Integer count = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_NAME = 'class_attendance'
                        """,
                Integer.class);
        if (count != null && count > 0) {
            return;
        }
        jdbcTemplate.execute("""
                CREATE TABLE class_attendance (
                    id BIGINT IDENTITY(1,1) PRIMARY KEY,
                    enrollment_id BIGINT NOT NULL,
                    class_schedule_id BIGINT NOT NULL,
                    session_date DATE NOT NULL,
                    status NVARCHAR(20) NOT NULL,
                    recorded_by_user_id UNIQUEIDENTIFIER NULL,
                    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                    CONSTRAINT uk_class_attendance_enrollment_schedule_session UNIQUE (enrollment_id, class_schedule_id, session_date),
                    CONSTRAINT fk_class_attendance_enrollment FOREIGN KEY (enrollment_id) REFERENCES course_class_enrollments(id),
                    CONSTRAINT fk_class_attendance_schedule FOREIGN KEY (class_schedule_id) REFERENCES class_schedules(id),
                    CONSTRAINT fk_class_attendance_recorded_by FOREIGN KEY (recorded_by_user_id) REFERENCES users(Id)
                )
                """);
    }

    /**
     * Nâng bảng {@code class_attendance} cũ (chỉ có enrollment + ngày) lên mô hình gắn {@code class_schedule_id}.
     * Dữ liệu điểm danh cũ không gắn được tiết — sẽ bị xóa trước khi thêm ràng buộc mới.
     */
    private void ensureClassAttendanceClassScheduleMigration() {
        Integer tableCount = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_NAME = 'class_attendance'
                        """,
                Integer.class);
        if (tableCount == null || tableCount == 0) {
            return;
        }
        Integer col = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_NAME = 'class_attendance'
                          AND COLUMN_NAME = 'class_schedule_id'
                        """,
                Integer.class);
        if (col != null && col > 0) {
            return;
        }
        jdbcTemplate.execute("ALTER TABLE class_attendance ADD class_schedule_id BIGINT NULL");
        Integer oldUk = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                        WHERE TABLE_NAME = 'class_attendance'
                          AND CONSTRAINT_NAME = 'uk_class_attendance_enrollment_session'
                        """,
                Integer.class);
        if (oldUk != null && oldUk > 0) {
            jdbcTemplate.execute(
                    "ALTER TABLE class_attendance DROP CONSTRAINT uk_class_attendance_enrollment_session");
        }
        jdbcTemplate.execute("DELETE FROM class_attendance");
        jdbcTemplate.execute("ALTER TABLE class_attendance ALTER COLUMN class_schedule_id BIGINT NOT NULL");
        Integer fk = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM sys.foreign_keys
                        WHERE name = 'fk_class_attendance_schedule'
                        """,
                Integer.class);
        if (fk == null || fk == 0) {
            jdbcTemplate.execute("""
                    ALTER TABLE class_attendance
                    ADD CONSTRAINT fk_class_attendance_schedule
                    FOREIGN KEY (class_schedule_id) REFERENCES class_schedules(id)
                    """);
        }
        Integer newUk = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                        WHERE TABLE_NAME = 'class_attendance'
                          AND CONSTRAINT_NAME = 'uk_class_attendance_enrollment_schedule_session'
                        """,
                Integer.class);
        if (newUk == null || newUk == 0) {
            jdbcTemplate.execute("""
                    ALTER TABLE class_attendance
                    ADD CONSTRAINT uk_class_attendance_enrollment_schedule_session
                    UNIQUE (enrollment_id, class_schedule_id, session_date)
                    """);
        }
    }
}
