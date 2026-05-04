package com.managestudents.trainingprogram.service;

import com.managestudents.trainingprogram.entity.TrainingProgram;
import com.managestudents.trainingprogram.repository.TrainingProgramRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class TrainingProgramBootstrap implements ApplicationRunner {

    private final TrainingProgramRepository trainingProgramRepository;

    public TrainingProgramBootstrap(TrainingProgramRepository trainingProgramRepository) {
        this.trainingProgramRepository = trainingProgramRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (trainingProgramRepository.count() > 0) {
            return;
        }
        trainingProgramRepository.saveAll(List.of(
                build("CTDT-CNTT", "Cử nhân Công nghệ thông tin", 130, "Chương trình chuẩn ngành CNTT"),
                build("CTDT-QTKD", "Cử nhân Quản trị kinh doanh", 128, "Chương trình chuẩn ngành QTKD"),
                build("CTDT-KT", "Cử nhân Kế toán", 125, "Chương trình chuẩn ngành Kế toán")
        ));
    }

    private static TrainingProgram build(String code, String name, Integer totalCredits, String description) {
        TrainingProgram e = new TrainingProgram();
        e.setProgramCode(code);
        e.setProgramName(name);
        e.setTotalCredits(totalCredits);
        e.setDescription(description);
        return e;
    }
}
