package com.managestudents.tuitionrate.service;

import com.managestudents.trainingprogram.entity.TrainingProgram;
import com.managestudents.trainingprogram.repository.TrainingProgramRepository;
import com.managestudents.tuitionrate.entity.TuitionRate;
import com.managestudents.tuitionrate.repository.TuitionRateRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
public class TuitionRateBootstrap implements ApplicationRunner {

    private final TuitionRateRepository tuitionRateRepository;
    private final TrainingProgramRepository trainingProgramRepository;

    public TuitionRateBootstrap(
            TuitionRateRepository tuitionRateRepository,
            TrainingProgramRepository trainingProgramRepository) {
        this.tuitionRateRepository = tuitionRateRepository;
        this.trainingProgramRepository = trainingProgramRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (tuitionRateRepository.count() > 0) {
            return;
        }
        TrainingProgram ctdtCntt = trainingProgramRepository.findByProgramCodeIgnoreCase("CTDT-CNTT").orElse(null);
        TrainingProgram ctdtQtkd = trainingProgramRepository.findByProgramCodeIgnoreCase("CTDT-QTKD").orElse(null);
        TrainingProgram ctdtKt = trainingProgramRepository.findByProgramCodeIgnoreCase("CTDT-KT").orElse(null);
        if (ctdtCntt == null || ctdtQtkd == null || ctdtKt == null) {
            return;
        }
        tuitionRateRepository.saveAll(List.of(
                build("HP-CNTT", "Học phí CTĐT CNTT", ctdtCntt, new BigDecimal("450000"), "Đơn giá theo tín chỉ"),
                build("HP-QTKD", "Học phí CTĐT QTKD", ctdtQtkd, new BigDecimal("420000"), "Đơn giá theo tín chỉ"),
                build("HP-KT", "Học phí CTĐT Kế toán", ctdtKt, new BigDecimal("390000"), "Đơn giá theo tín chỉ")
        ));
    }

    private static TuitionRate build(
            String code,
            String name,
            TrainingProgram trainingProgram,
            BigDecimal feePerCredit,
            String description) {
        TuitionRate e = new TuitionRate();
        e.setTuitionCode(code);
        e.setTuitionName(name);
        e.setTrainingProgram(trainingProgram);
        e.setFeePerCredit(feePerCredit);
        e.setDescription(description);
        return e;
    }
}
