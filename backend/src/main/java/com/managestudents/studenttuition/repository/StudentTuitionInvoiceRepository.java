package com.managestudents.studenttuition.repository;

import com.managestudents.studenttuition.entity.StudentTuitionInvoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface StudentTuitionInvoiceRepository extends JpaRepository<StudentTuitionInvoice, Long> {

    Optional<StudentTuitionInvoice> findByPayment_Id(Long paymentId);

    Optional<StudentTuitionInvoice> findByPayment_IdAndPayment_StudentTuition_User_Id(Long paymentId, java.util.UUID userId);

    List<StudentTuitionInvoice> findByPayment_IdIn(Collection<Long> paymentIds);
}
